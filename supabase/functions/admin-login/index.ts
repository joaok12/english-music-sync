// O painel administrativo usa o signInWithPassword do Supabase Auth.
// Esta função fica apenas para responder claramente a integrações antigas que
// ainda tentarem solicitar o magic link legado.
const headers = {
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  return new Response(JSON.stringify({
    error: "O painel administrativo agora usa e-mail e senha.",
  }), { status: 410, headers });
});
