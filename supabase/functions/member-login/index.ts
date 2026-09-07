import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const appUrl = Deno.env.get("APP_URL") ?? "https://english-music-sync.vercel.app";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cpfHashSecret = Deno.env.get("CPF_HASH_SECRET") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const headers = {
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeCpf(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

async function hashCpf(cpf: string): Promise<string> {
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

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return response({ error: "Método não permitido" }, 405);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return response({ error: "Dados inválidos" }, 400); }
  const email = normalizeEmail(body.email);
  const cpf = normalizeCpf(body.cpf);
  if (!email || cpf.length !== 11) return response({ error: "Informe um e-mail e um CPF válidos." }, 400);

  // Evita disparar links ilimitados para o mesmo endereço sem guardar o CPF.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin.from("member_login_attempts").select("id", { count: "exact", head: true })
    .eq("email", email).gte("created_at", since);
  if ((count ?? 0) >= 5) return response({ error: "Aguarde um minuto e tente novamente." }, 429);
  await admin.from("member_login_attempts").insert({ email });

  const cpfHash = await hashCpf(cpf);
  const { data: member, error: memberError } = await admin.from("members")
    .select("id, auth_user_id, email, full_name")
    .eq("email", email)
    .eq("cpf_hash", cpfHash)
    .maybeSingle();
  if (memberError) return response({ error: "Não foi possível validar o acesso." }, 500);
  if (!member) return response({ error: "E-mail ou CPF não conferem, ou o acesso ainda não foi liberado." }, 401);

  let authUserId = member.auth_user_id;
  if (!authUserId) {
    const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return response({ error: "Não foi possível preparar o acesso." }, 500);
    authUserId = users.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
  }
  if (!authUserId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: member.full_name ?? "" },
    });
    if (createError || !created.user) return response({ error: "Não foi possível preparar o acesso." }, 500);
    authUserId = created.user.id;
  }
  await admin.from("members").update({ auth_user_id: authUserId, updated_at: new Date().toISOString() }).eq("id", member.id);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    // A URL já permitida no Supabase. biblioteca.html encaminha para a nova tela inicial.
    options: { redirectTo: `${appUrl.replace(/\/$/, "")}/biblioteca.html` },
  });
  if (linkError || !link.properties?.action_link) return response({ error: "Não foi possível gerar o acesso." }, 500);

  // O link é de uso único e só é emitido depois da validação e-mail + CPF.
  return response({ ok: true, action_link: link.properties.action_link });
});
