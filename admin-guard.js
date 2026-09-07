// Protege o estúdio, edição e cadastro. O catálogo do aluno nunca recebe esses links.
(() => {
  const config = window.SUPABASE_CONFIG || {};
  const goHome = () => { window.location.replace('index.html'); };
  if (!config.anonKey || !window.supabase?.createClient) { goHome(); return; }
  const client = window.supabase.createClient(config.url, config.anonKey);
  window.AdminClientReady = (async () => {
    const {data: {session}} = await client.auth.getSession();
    if (!session) { goHome(); return false; }
    const {data: isAdmin, error} = await client.rpc('is_admin');
    if (error || !isAdmin) { goHome(); return false; }
    document.body.hidden = false;
    return true;
  })().catch(() => { goHome(); return false; });
})();
