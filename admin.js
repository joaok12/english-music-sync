(() => {
  const config = window.SUPABASE_CONFIG || {};
  const hasConfig = config.anonKey && !config.anonKey.startsWith('COLE_AQUI');
  const loginCard = document.getElementById('adminLoginCard');
  const loginForm = document.getElementById('adminLoginForm');
  const loginEmail = document.getElementById('adminEmail');
  const loginStatus = document.getElementById('adminLoginStatus');
  const app = document.getElementById('adminApp');
  const status = document.getElementById('adminStatus');
  const logout = document.getElementById('adminLogout');
  const songForm = document.getElementById('adminSongForm');
  const songId = document.getElementById('adminSongId');
  const songTitle = document.getElementById('adminSongTitle');
  const songSubtitle = document.getElementById('adminSongSubtitle');
  const songIcon = document.getElementById('adminSongIcon');
  const songCover = document.getElementById('adminSongCover');
  const songAudio = document.getElementById('adminSongAudio');
  const songLyrics = document.getElementById('adminSongLyrics');
  const songPublished = document.getElementById('adminSongPublished');
  const saveSong = document.getElementById('adminSaveSong');
  const clearSong = document.getElementById('adminClearSong');
  const songStatus = document.getElementById('adminSongStatus');
  const songList = document.getElementById('adminSongList');
  const productList = document.getElementById('adminProductList');

  if (!hasConfig || !window.supabase?.createClient) {
    loginStatus.className = 'member-status error';
    loginStatus.textContent = 'A chave pública do Supabase ainda precisa ser configurada.';
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey);
  let songs = [];
  let products = [];

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function setStatus(element, message, error = false) {
    element.className = `member-status${error ? ' error' : ''}`;
    element.textContent = message || '';
  }

  function slugify(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'musica';
  }

  function extension(file, fallback) {
    const name = String(file?.name || '').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    return name || fallback;
  }

  function audioDuration(file) {
    if (!file) return Promise.resolve(null);
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      const cleanup = () => { audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); };
      const finish = (value) => { cleanup(); resolve(Number.isFinite(value) && value > 0 ? value : null); };
      audio.onloadedmetadata = () => finish(audio.duration);
      audio.onerror = () => finish(null);
      audio.src = url;
    });
  }

  function parsedLyrics() {
    const parsed = window.SongImport?.parse(songLyrics.value);
    if (!parsed?.blocks?.length) throw new Error('Cole pelo menos uma parte de letra.');
    return parsed.blocks;
  }

  async function upload(file, path) {
    if (!file) return path || null;
    const { error } = await client.storage.from('song-media').upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: '31536000'
    });
    if (error) throw error;
    return path;
  }

  function recordData(data) {
    return Array.isArray(data) ? data[0] : data;
  }

  function resetForm() {
    songForm.reset();
    songId.value = '';
    songIcon.value = '🎵';
    songPublished.checked = false;
    songForm.dataset.coverPath = '';
    songForm.dataset.audioPath = '';
    document.getElementById('songFormTitle').textContent = 'Adicionar música';
    saveSong.textContent = 'Salvar música';
    setStatus(songStatus, '');
  }

  function editSong(song) {
    songId.value = song.id;
    songTitle.value = song.title || '';
    songSubtitle.value = song.subtitle || '';
    songIcon.value = song.icon || '🎵';
    songLyrics.value = (song.lyrics || []).flatMap(block => [block.pt, block.en1, block.en2].filter(Boolean)).join('\n\n');
    songPublished.checked = Boolean(song.is_published);
    songForm.dataset.coverPath = song.cover_path || '';
    songForm.dataset.audioPath = song.audio_path || '';
    document.getElementById('songFormTitle').textContent = `Editar: ${song.title}`;
    saveSong.textContent = 'Salvar alterações';
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function renderSongs() {
    songList.replaceChildren();
    if (!songs.length) {
      songList.innerHTML = '<li class="admin-empty">Nenhuma música cadastrada ainda.</li>';
      return;
    }
    songs.forEach(song => {
      const item = document.createElement('li');
      item.className = 'admin-song-row';
      const state = song.is_published ? 'Publicado' : 'Rascunho';
      item.innerHTML = `<div><strong>${escapeHtml(song.icon || '🎵')} ${escapeHtml(song.title)}</strong><span class="admin-meta">${escapeHtml(state)} · ${song.lyrics?.length || 0} partes</span></div><div class="admin-row-actions"><a class="admin-small-button primary" href="sincronizar.html?song=remote_${encodeURIComponent(song.id)}">Sincronizar</a><button class="admin-small-button" type="button" data-edit-song="${escapeHtml(song.id)}">Editar</button></div>`;
      item.querySelector('[data-edit-song]').addEventListener('click', () => editSong(song));
      songList.append(item);
    });
  }

  function renderProducts() {
    productList.replaceChildren();
    if (!products.length) {
      productList.innerHTML = '<p class="admin-empty">Nenhum produto recebido da Hubla ainda. Faça um evento de teste ou uma venda para ele aparecer.</p>';
      return;
    }
    products.forEach(product => {
      const item = document.createElement('div');
      item.className = 'admin-product-row';
      const options = songs.map(song => `<option value="${escapeHtml(song.id)}"${(product.song_ids || []).includes(song.id) ? ' selected' : ''}>${escapeHtml(song.icon || '🎵')} ${escapeHtml(song.title)}</option>`).join('');
      item.innerHTML = `<div><strong>${escapeHtml(product.name)}</strong><span class="admin-meta">Hubla: ${escapeHtml(product.hubla_product_id)}</span></div><div class="admin-product-link"><select multiple size="${Math.min(Math.max(songs.length, 2), 6)}" aria-label="Músicas liberadas para ${escapeHtml(product.name)}">${options}</select><button class="admin-small-button primary" type="button">Salvar vínculos</button></div>`;
      const select = item.querySelector('select');
      item.querySelector('button').addEventListener('click', async () => {
        const selected = new Set([...select.selectedOptions].map(option => option.value));
        const previous = new Set(product.song_ids || []);
        try {
          for (const id of songs.map(song => song.id)) {
            if (selected.has(id) === previous.has(id)) continue;
            const {error} = await client.rpc('admin_link_product_song', {
              p_hubla_product_id: product.hubla_product_id,
              p_song_id: id,
              p_link: selected.has(id)
            });
            if (error) throw error;
          }
          product.song_ids = [...selected];
          setStatus(status, `Vínculos de “${product.name}” salvos.`);
        } catch (error) {
          setStatus(status, error.message || 'Não foi possível salvar os vínculos.', true);
        }
      });
      productList.append(item);
    });
  }

  async function refresh() {
    const [songResult, productResult] = await Promise.all([
      client.rpc('admin_list_songs'),
      client.rpc('admin_list_products')
    ]);
    if (songResult.error) throw songResult.error;
    if (productResult.error) throw productResult.error;
    songs = songResult.data || [];
    products = productResult.data || [];
    renderSongs();
    renderProducts();
    setStatus(status, `${songs.length} música(s) · ${products.length} produto(s)`);
  }

  async function showApp(session) {
    if (!session) {
      loginCard.hidden = false;
      app.hidden = true;
      return;
    }
    loginCard.hidden = true;
    app.hidden = false;
    try { await refresh(); }
    catch (error) {
      setStatus(status, error.message || 'Esta conta não tem acesso ao painel.', true);
      await client.auth.signOut();
      loginCard.hidden = false;
      app.hidden = true;
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
    if (!email) return setStatus(loginStatus, 'Informe um e-mail válido.', true);
    const button = loginForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Enviando…';
    try {
      const response = await fetch(`${config.functionsBase}/admin-login`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.action_link) throw new Error(data.error || 'Não foi possível gerar o acesso.');
      setStatus(loginStatus, 'Link enviado. Abra o e-mail para entrar no painel.');
    } catch (error) {
      setStatus(loginStatus, error.message || 'Não foi possível entrar agora.', true);
    } finally {
      button.disabled = false;
      button.textContent = 'Enviar link de acesso';
    }
  });

  logout.addEventListener('click', async () => { await client.auth.signOut(); window.location.replace('admin.html'); });
  clearSong.addEventListener('click', resetForm);

  songForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!songTitle.value.trim()) return setStatus(songStatus, 'Informe o nome da música.', true);
    saveSong.disabled = true;
    saveSong.textContent = 'Salvando…';
    try {
      const lyrics = parsedLyrics();
      const audioFile = songAudio.files[0] || null;
      const duration = await audioDuration(audioFile);
      const id = songId.value || null;
      const existingSong = id ? songs.find(song => song.id === id) : null;
      const durationForSave = duration ?? existingSong?.duration_seconds ?? null;
      const first = await client.rpc('admin_upsert_song', {
        p_id: id,
        p_title: songTitle.value.trim(),
        p_slug: slugify(songTitle.value),
        p_subtitle: songSubtitle.value.trim() || null,
        p_icon: songIcon.value.trim() || '🎵',
        p_cover_path: songForm.dataset.coverPath || null,
        p_audio_path: songForm.dataset.audioPath || null,
        p_duration_seconds: durationForSave,
        p_lyrics: lyrics,
        p_is_published: songPublished.checked,
        p_sort_order: 0
      });
      if (first.error) throw first.error;
      const saved = recordData(first.data);
      if (!saved?.id) throw new Error('O Supabase não retornou a música criada.');
      const coverPath = songCover.files[0] ? `${saved.id}/cover.${extension(songCover.files[0], 'jpg')}` : (saved.cover_path || null);
      const audioPath = audioFile ? `${saved.id}/audio.${extension(audioFile, 'mp3')}` : (saved.audio_path || null);
      await upload(songCover.files[0], coverPath);
      await upload(audioFile, audioPath);
      if (coverPath !== saved.cover_path || audioPath !== saved.audio_path) {
        const second = await client.rpc('admin_upsert_song', {
          p_id: saved.id,
          p_title: songTitle.value.trim(),
          p_slug: slugify(songTitle.value),
          p_subtitle: songSubtitle.value.trim() || null,
          p_icon: songIcon.value.trim() || '🎵',
          p_cover_path: coverPath,
          p_audio_path: audioPath,
          p_duration_seconds: durationForSave ?? saved.duration_seconds ?? null,
          p_lyrics: lyrics,
          p_is_published: songPublished.checked,
          p_sort_order: Number(saved.sort_order) || 0
        });
        if (second.error) throw second.error;
      }
      songId.value = saved.id;
      songForm.dataset.coverPath = coverPath || '';
      songForm.dataset.audioPath = audioPath || '';
      setStatus(songStatus, `“${songTitle.value.trim()}” salva. Use Sincronizar para marcar as palavras.`);
      await refresh();
    } catch (error) {
      setStatus(songStatus, error.message || 'Não foi possível salvar a música.', true);
    } finally {
      saveSong.disabled = false;
      saveSong.textContent = songId.value ? 'Salvar alterações' : 'Salvar música';
    }
  });

  client.auth.onAuthStateChange((_event, session) => { showApp(session).catch(error => setStatus(status, error.message, true)); });
  client.auth.getSession().then(({data: {session}}) => showApp(session)).catch(error => setStatus(loginStatus, error.message, true));
})();
