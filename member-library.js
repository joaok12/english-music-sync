(() => {
  const config = window.SUPABASE_CONFIG || {};
  const status = document.getElementById('libraryStatus');
  const grid = document.getElementById('libraryGrid');
  const logout = document.getElementById('logoutButton');
  const hasConfig = config.anonKey && !config.anonKey.startsWith('COLE_AQUI');

  if (!hasConfig || !window.supabase?.createClient) {
    status.className = 'member-status error';
    status.textContent = 'A chave pública do Supabase ainda precisa ser configurada.';
    return;
  }
  const client = window.supabase.createClient(config.url, config.anonKey);
  logout.addEventListener('click', async () => { await client.auth.signOut(); window.location.replace('login.html'); });

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  async function load() {
    const {data: {session}} = await client.auth.getSession();
    if (!session) { window.location.replace('login.html'); return; }
    const {data: songs, error} = await client.rpc('get_my_library');
    if (error) throw error;
    grid.innerHTML = '';
    if (!songs?.length) {
      status.textContent = 'Sua compra foi reconhecida, mas ainda não há músicas vinculadas a esse produto.';
      grid.innerHTML = '<p class="library-empty">Assim que o produto for associado às músicas, elas aparecerão aqui.</p>';
      return;
    }
    status.textContent = `${songs.length} música(s) liberada(s)`;
    for (const song of songs) {
      const cover = song.cover_path ? (await client.storage.from('song-media').createSignedUrl(song.cover_path, 3600)).data?.signedUrl : '';
      const card = document.createElement('article');
      card.className = 'library-card';
      card.innerHTML = `<div class="library-cover" ${cover ? `style="background-image:url('${escapeHtml(cover)}');background-size:cover;background-position:center"` : ''}>${cover ? '' : escapeHtml(song.icon || '🎵')}</div><div class="library-info"><h2>${escapeHtml(song.title)}</h2><p>${escapeHtml(song.subtitle || song.product_name || 'Sua música')}</p><div class="library-actions"><a class="library-action primary" href="karaoke.html?song=remote_${encodeURIComponent(song.song_id)}">🎤 Cantar</a></div></div>`;
      grid.append(card);
    }
  }
  load().catch(error => { status.className = 'member-status error'; status.textContent = error.message || 'Não foi possível carregar sua biblioteca.'; });
})();
