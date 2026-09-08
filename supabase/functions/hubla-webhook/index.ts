import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "content-type, x-hubla-token, x-hubla-sandbox, x-hubla-idempotency",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

type JsonObject = Record<string, unknown>;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookToken = Deno.env.get("HUBLA_WEBHOOK_TOKEN") ?? "";
const cpfHashSecret = Deno.env.get("CPF_HASH_SECRET") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function string(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asError(value: unknown): Error {
  if (value instanceof Error) return value;
  const details = object(value);
  const message = string(details.message) || "Erro desconhecido";
  const code = string(details.code);
  return new Error(code ? `${message} (${code})` : message);
}

function isUniqueViolation(value: unknown): boolean {
  const error = asError(value);
  const details = object(value);
  return string(details.code) === "23505" || /duplicate key|unique constraint/i.test(error.message);
}

function sanitizedPayload(payload: JsonObject): JsonObject {
  const copy = JSON.parse(JSON.stringify(payload)) as JsonObject;
  const event = object(copy.event);
  const user = object(event.user);
  if ("document" in user) user.document = "[redacted]";
  const subscription = object(event.subscription);
  const paymentSession = object(subscription.firstPaymentSession);
  if ("ip" in paymentSession) paymentSession.ip = "[redacted]";
  if ("billingAddress" in subscription) delete subscription.billingAddress;
  return copy;
}

function digits(value: unknown): string {
  return string(value).replace(/\D/g, "");
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

async function hmacCpf(cpf: string): Promise<string> {
  if (!cpfHashSecret) throw new Error("CPF_HASH_SECRET não configurado");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(cpfHashSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(cpf));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function nestedProduct(value: JsonObject): JsonObject {
  const direct = object(value.product);
  if (string(direct.id)) return direct;
  const products = Array.isArray(value.products) ? value.products : [];
  return object(products[0]);
}

function allProducts(value: JsonObject): JsonObject[] {
  const direct = object(value.product);
  // Nos eventos v2 da Hubla, event.product é o produto canônico. O array
  // event.products de faturas pode conter IDs de oferta/linha diferentes do
  // produto, então ele só é usado quando não existe o produto direto.
  if (string(direct.id)) return [direct];
  const products = Array.isArray(value.products) ? value.products.map(object) : [];
  return products.filter((product) => string(product.id));
}

function slugify(value: string, fallback: string): string {
  const slug = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (slug || "produto") + "-" + fallback.slice(0, 8).toLowerCase();
}

function eventDecision(type: string): "active" | "inactive" | "ignored" {
  if ([
    "customer.member_added",
    "subscription.activated",
    "invoice.payment_succeeded",
    "invoice.paid",
    "invoice.payment_success",
  ].includes(type)) return "active";
  if ([
    "customer.member_removed",
    "subscription.deactivated",
    "subscription.expired",
    "invoice.refunded",
    "invoice.expired",
  ].includes(type)) return "inactive";
  return "ignored";
}

async function upsertProduct(product: JsonObject) {
  const hublaId = string(product.id);
  const name = string(product.name) || `Produto ${hublaId}`;
  const checkoutUrl = string(product.checkoutUrl) || string(product.checkout_url) || string(product.url);
  const values: JsonObject = {
    hubla_product_id: hublaId,
    name,
    slug: slugify(name, hublaId),
    updated_at: new Date().toISOString(),
  };
  if (checkoutUrl) values.checkout_url = checkoutUrl;
  const { data: rules, error: rulesError } = await admin.from("product_access_rules")
    .select("hubla_product_id, name_contains, playlist_id, is_order_bump, price, checkout_url, is_active")
    .eq("is_active", true);
  if (rulesError) throw rulesError;
  const normalizedName = name.toLocaleLowerCase();
  const rule = (rules ?? []).find((item) =>
    string(item.hubla_product_id) === hublaId
  ) ?? (rules ?? []).find((item) => {
    const term = string(item.name_contains).toLocaleLowerCase();
    return term && normalizedName.includes(term);
  });
  if (rule) {
    values.playlist_id = rule.playlist_id;
    values.is_order_bump = Boolean(rule.is_order_bump);
    values.price = rule.price ?? null;
    values.checkout_url = string(rule.checkout_url) || checkoutUrl || null;
    values.is_active = rule.is_active !== false;
  }
  const { data, error } = await admin.from("products").upsert(values, { onConflict: "hubla_product_id" })
    .select("id, hubla_product_id, name").single();
  if (error) throw error;
  return data;
}

async function findOrCreateMember(user: JsonObject, subscription: JsonObject) {
  const hublaUserId = string(user.id) || string(subscription.payerId);
  const email = string(user.email).toLowerCase();
  const cpf = digits(user.document);
  if (!hublaUserId && !email) throw new Error("Evento sem identificador do comprador");

  async function findMember(column: "hubla_user_id" | "email", value: string) {
    if (!value) return null;
    const { data, error } = await admin.from("members")
      .select("id, auth_user_id, email, cpf_hash")
      .eq(column, value)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  // O sandbox e a produção podem entregar vários eventos do mesmo comprador
  // ao mesmo tempo. Procuramos pelo ID e, como fallback, pelo e-mail para
  // evitar criar duas linhas para a mesma pessoa.
  const existing = await findMember("hubla_user_id", hublaUserId) ?? await findMember("email", email);

  const payload: JsonObject = {
    hubla_user_id: hublaUserId || null,
    email: email || existing?.email,
    full_name: [string(user.firstName), string(user.lastName)].filter(Boolean).join(" ") || null,
    phone: string(user.phone) || null,
    updated_at: new Date().toISOString(),
  };
  if (cpf && cpfHashSecret) {
    payload.cpf_hash = await hmacCpf(cpf);
    payload.cpf_last4 = cpf.slice(-4);
  }
  if (!payload.email) throw new Error("Evento sem email do comprador");

  if (existing) {
    const { data, error } = await admin.from("members").update(payload).eq("id", existing.id)
      .select("id, auth_user_id, email").single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await admin.from("members").insert(payload)
    .select("id, auth_user_id, email").single();
  if (!error) return data;

  // Outra entrega pode ter inserido o membro entre a busca e o INSERT.
  // Nesse caso, recuperamos a linha criada e atualizamos os dados recebidos.
  if (!isUniqueViolation(error)) throw error;
  const concurrent = await findMember("hubla_user_id", hublaUserId) ?? await findMember("email", email);
  if (!concurrent) throw error;
  const { data: updated, error: updateError } = await admin.from("members")
    .update(payload)
    .eq("id", concurrent.id)
    .select("id, auth_user_id, email")
    .single();
  if (updateError) throw updateError;
  return updated;
}

async function processEvent(payload: JsonObject, type: string) {
  const event = object(payload.event);
  const user = object(event.user);
  const subscription = object(event.subscription);
  const decision = eventDecision(type);
  if (decision === "ignored") return;

  const member = await findOrCreateMember(user, subscription);
  const products = allProducts(event);
  if (!products.length) throw new Error("Evento sem produto");
  const subscriptionId = string(subscription.id);
  const subscriptionVersion = Number.isInteger(subscription.version) ? Number(subscription.version) : null;
  const modifiedAt = string(subscription.modifiedAt) || string(subscription.activatedAt);

  for (const product of products) {
    const savedProduct = await upsertProduct(product);
    const { data: current, error: currentError } = await admin.from("member_entitlements")
      .select("id, subscription_version")
      .eq("member_id", member.id)
      .eq("hubla_product_id", savedProduct.hubla_product_id)
      .eq("subscription_id", subscriptionId)
      .maybeSingle();
    if (currentError) throw currentError;
    if (current?.subscription_version != null && subscriptionVersion != null && current.subscription_version > subscriptionVersion) continue;

    const entitlement = {
      member_id: member.id,
      hubla_product_id: savedProduct.hubla_product_id,
      product_name: savedProduct.name,
      subscription_id: subscriptionId,
      subscription_status: decision,
      subscription_version: subscriptionVersion,
      source_event_type: type,
      granted_at: decision === "active" ? (modifiedAt || new Date().toISOString()) : undefined,
      revoked_at: decision === "inactive" ? (modifiedAt || new Date().toISOString()) : null,
      access_until: string(subscription.inactivatedAt) || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from("member_entitlements").upsert(entitlement, {
      onConflict: "member_id,hubla_product_id,subscription_id",
    });
    if (error) throw error;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers: corsHeaders });

  const receivedToken = request.headers.get("x-hubla-token") ?? "";
  if (!webhookToken || !constantTimeEqual(receivedToken, webhookToken)) {
    return new Response(JSON.stringify({ error: "Webhook não autenticado" }), { status: 401, headers: corsHeaders });
  }
  const idempotency = request.headers.get("x-hubla-idempotency") ?? crypto.randomUUID();
  const sandbox = (request.headers.get("x-hubla-sandbox") ?? "false").toLowerCase() === "true";
  let payload: JsonObject;
  try { payload = object(await request.json()); } catch { return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: corsHeaders }); }
  const type = string(payload.type) || "unknown";
  const version = string(payload.version) || null;

  const { data: duplicate } = await admin.from("hubla_webhook_events").select("id, processing_status")
    .eq("idempotency_key", idempotency).maybeSingle();
  if (duplicate) return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200, headers: corsHeaders });

  const { error: eventError } = await admin.from("hubla_webhook_events").insert({
    idempotency_key: idempotency,
    event_type: type,
    contract_version: version,
    is_sandbox: sandbox,
    payload: sanitizedPayload(payload),
  });
  if (eventError) return new Response(JSON.stringify({ error: "Não foi possível registrar o evento" }), { status: 500, headers: corsHeaders });

  try {
    await processEvent(payload, type);
    await admin.from("hubla_webhook_events").update({ processing_status: eventDecision(type) === "ignored" ? "ignored" : "processed", processed_at: new Date().toISOString() }).eq("idempotency_key", idempotency);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    const message = asError(error).message;
    await admin.from("hubla_webhook_events").update({ processing_status: "failed", processing_error: message }).eq("idempotency_key", idempotency);
    return new Response(JSON.stringify({ error: "Evento recebido, mas não processado" }), { status: 500, headers: corsHeaders });
  }
});
