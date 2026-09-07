// Carrega uma música protegida do catálogo Supabase antes do player/estúdio iniciar.
window.RemoteSongReady = (async () => {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('song') || '';
  if (!requested.startsWith('remote_')) return null;
  const config = window.SUPABASE_CONFIG || {};
  const hasConfig = config.anonKey && !config.anonKey.startsWith('COLE_AQUI');
  if (!hasConfig || !window.supabase?.createClient) throw new Error('O acesso ao Supabase ainda não foi configurado.');
  const client = window.supabase.createClient(config.url, config.anonKey);
  const {data: {session}} = await client.auth.getSession();
  if (!session) { window.location.replace('login.html'); return null; }
  const songId = requested.slice('remote_'.length);
  const {data: songs, error} = await client.rpc('get_my_library');
  if (error) throw error;
  const song = (songs || []).find(item => item.song_id === songId);
  if (!song) throw new Error('Esta música não está liberada para sua conta.');
  if (song.is_available === false) throw new Error('Esta música ainda está em breve. Volte na data de liberação para cantar.');
  let audioFile = '';
  if (song.audio_path) {
    const signed = await client.storage.from('song-media').createSignedUrl(song.audio_path, 3600);
    if (signed.error) throw signed.error;
    audioFile = signed.data.signedUrl;
  }
  window.SONGS_CATALOG = window.SONGS_CATALOG || {};
  window.SONGS_CATALOG[requested] = {
    id: requested,
    title: song.title,
    subtitle: song.subtitle || song.product_name || '',
    icon: song.icon || '🎵',
    durationSec: Number(song.duration_seconds) || 0,
    durationText: '',
    audioFile,
    lyrics: song.lyrics || []
  };
  return window.SONGS_CATALOG[requested];
})();
