import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const appUrl = Deno.env.get("APP_URL") ?? "https://english-music-sync.vercel.app";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const allowedEmails = (Deno.env.get("ADMIN_EMAILS") ?? Deno.env.get("ADMIN_EMAIL") ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const headers = {
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return response({ error: "Método não permitido" }, 405);
  if (!allowedEmails.length) return response({ error: "O e-mail administrativo ainda não foi configurado." }, 503);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return response({ error: "Dados inválidos" }, 400); }
  const email = normalizeEmail(body.email);
  if (!email || !allowedEmails.includes(email)) {
    return response({ error: "Este e-mail não tem acesso administrativo." }, 403);
  }

  const { data: record, error: recordError } = await admin.from("admin_users")
    .select("auth_user_id, email")
    .eq("email", email)
    .maybeSingle();
  if (recordError) return response({ error: "Não foi possível preparar o acesso." }, 500);

  let authUserId = record?.auth_user_id ?? null;
  if (!authUserId) {
    const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return response({ error: "Não foi possível preparar o acesso." }, 500);
    authUserId = users.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
  }
  if (!authUserId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });
    if (createError || !created.user) return response({ error: "Não foi possível preparar o acesso." }, 500);
    authUserId = created.user.id;
  }

  const { error: upsertError } = await admin.from("admin_users").upsert({
    email,
    auth_user_id: authUserId,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" });
  if (upsertError) return response({ error: "Não foi possível preparar o acesso." }, 500);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appUrl.replace(/\/$/, "")}/admin.html` },
  });
  if (linkError || !link.properties?.action_link) return response({ error: "Não foi possível gerar o acesso." }, 500);
  return response({ ok: true, action_link: link.properties.action_link });
});
