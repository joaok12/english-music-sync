(() => {
  const config = window.SUPABASE_CONFIG || {};
  const loginView = document.getElementById('memberLoginView');
  const libraryView = document.getElementById('memberLibraryView');
  const loginForm = document.getElementById('memberLoginForm');
  const emailInput = document.getElementById('memberEmail');
  const cpfInput = document.getElementById('memberCpf');
  const loginStatus = document.getElementById('loginStatus');
  const libraryStatus = document.getElementById('libraryStatus');
  const hero = document.getElementById('memberHero');
  const heroTitle = document.getElementById('memberHeroTitle');
  const heroSubtitle = document.getElementById('memberHeroSubtitle');
  const heroMeta = document.getElementById('memberHeroMeta');
  const heroPlay = document.getElementById('memberHeroPlay');
  const heroCover = document.getElementById('memberHeroCover');
  const heroFallback = document.getElementById('memberHeroFallback');
  const playlist = document.getElementById('memberPlaylist');
  const playlistCount = document.getElementById('playlistCount');
  const playlistCollectionsRail = document.getElementById('playlistCollectionsRail');
  const catalogRail = document.getElementById('memberCatalogRail');
  const catalogSection = catalogRail.closest('.catalog-section');
  const offersSection = document.getElementById('memberOffersSection');
  const offersRail = document.getElementById('memberOffersRail');
  const greeting = document.getElementById('memberGreeting');
  const logout = document.getElementById('memberLogout');
  let viewRequest = 0;
  let releaseTimer = null;

  const fallbackCatalog = [
    {id: 'viagens', title: 'Frases de Viagem', subtitle: 'Aeroporto, hotel, táxi e restaurante', icon: '✈️', cover: 'assets/covers/viagens.webp'},
    {id: 'dia_a_dia', title: 'Frases do Dia a Dia', subtitle: 'Conversas simples para começar', icon: '☀️', cover: 'assets/covers/dia-a-dia.webp'},
    {id: 'anos_80', title: 'Inglês Anos 80', subtitle: 'Ação, ritmo e frases essenciais', icon: '🎸', cover: 'assets/covers/anos-80.webp'},
    {id: 'custom_253e4b44-65eb-4d80-964c-b536b065350d', title: 'Eu Moro Aqui', subtitle: 'Casa, bairro e onde você vive', icon: '🏠', cover: 'assets/covers/eu-moro-aqui.webp'},
    {id: 'custom_9d0e92ae-1b1b-4317-b7ad-a9dab2b2cea6', title: 'Onde é a Praia', subtitle: 'Praia, férias e viagens', icon: '🏝️', cover: 'assets/covers/praia.webp'},
    {id: 'custom_facdb85a-b843-441d-8b45-053a0218c0e1', title: 'De Boa · Gíria 01', subtitle: 'Inglês casual para conversar', icon: '🛹', cover: 'assets/covers/de-boa.webp'},
    {id: 'custom_fcf0288e-073e-4af4-a05d-6f7fa396f9fa', title: 'Let’s Start', subtitle: 'Comece, pratique e avance', icon: '🚀', cover: 'assets/covers/lets-start.webp'}
  ];

  const fallbackPlaylists = [
    {playlist_id: 'fallback-ingles-cantando', title: 'Inglês Cantando', slug: 'ingles-cantando', subtitle: 'Pratique cantando, uma música por vez.', cover_path: '', song_count: 20, release_at: null, is_available: true},
    {playlist_id: 'fallback-50-girias', title: '50 Gírias', slug: '50-girias', subtitle: 'Expressões naturais para conversar melhor.', cover_path: '', song_count: 1, release_at: null, is_available: true}
  ];

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  function updateReleaseCountdowns() {
    const countdowns = [...document.querySelectorAll('[data-release-countdown]')];
    let hasActiveCountdown = false;
    countdowns.forEach(element => {
      const releaseAt = new Date(element.dataset.releaseAt || '').getTime();
      if (!Number.isFinite(releaseAt)) return;
      const remaining = releaseAt - Date.now();
      if (remaining <= 0) {
        element.textContent = 'Disponível';
        element.closest('.playlist-tile, .playlist-release')?.classList.remove('is-locked');
      } else {
        hasActiveCountdown = true;
        element.textContent = formatCountdown(remaining);
      }
    });
    if (!hasActiveCountdown && releaseTimer) {
      clearInterval(releaseTimer);
      releaseTimer = null;
    }
  }

  function startReleaseCountdowns() {
    if (releaseTimer) clearInterval(releaseTimer);
    updateReleaseCountdowns();
    if (document.querySelector('[data-release-countdown][data-release-at]')) releaseTimer = setInterval(updateReleaseCountdowns, 1000);
  }

  if (!config.anonKey || config.anonKey.startsWith('COLE_AQUI') || !window.supabase?.createClient) {
    loginStatus.className = 'member-status error';
    loginStatus.textContent = 'A integração ainda não foi configurada.';
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey);

  function setStatus(element, text, error = false) {
    element.className = `member-status${error ? ' error' : ''}`;
    element.textContent = text || '';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function formatCpf(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length > 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    if (digits.length > 6) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    if (digits.length > 3) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    return digits;
  }

  function fallbackFor(song) {
    const text = `${song?.id || ''} ${song?.title || ''} ${song?.slug || ''}`.toLocaleLowerCase();
    return fallbackCatalog.find(item => text.includes(item.id) || text.includes(item.title.toLocaleLowerCase())) || null;
  }

  function uniqueSongs(rows) {
    const byId = new Map();
    for (const song of Array.isArray(rows) ? rows : []) {
      const id = song?.song_id || song?.id || `${song?.title || ''}-${song?.slug || ''}`;
      if (!id) continue;
      const previous = byId.get(id);
      if (!previous || (song.is_accessible && !previous.is_accessible)) byId.set(id, song);
    }
    return [...byId.values()];
  }

  async function coverUrl(song) {
    if (song.cover_path) {
      const {data} = await client.storage.from('song-media').createSignedUrl(song.cover_path, 3600);
      if (data?.signedUrl) return data.signedUrl;
    }
    return fallbackFor(song)?.cover || '';
  }

  function fallbackPlaylistCover(playlistItem) {
    return String(playlistItem?.slug || '').toLowerCase() === '50-girias'
      ? 'assets/covers/50-girias.webp'
      : 'assets/branding/logo.png';
  }

  async function playlistCoverUrl(playlistItem) {
    if (playlistItem.cover_path) {
      const {data} = await client.storage.from('song-media').createSignedUrl(playlistItem.cover_path, 3600);
      if (data?.signedUrl) return data.signedUrl;
    }
    return fallbackPlaylistCover(playlistItem);
  }

  async function renderPlaylistCollections(rows) {
    playlistCollectionsRail.replaceChildren();
    const source = Array.isArray(rows) && rows.length ? rows : fallbackPlaylists;
    for (const playlistItem of source) {
      const cover = await playlistCoverUrl(playlistItem);
      const future = playlistItem.is_available === false || (playlistItem.release_at && new Date(playlistItem.release_at).getTime() > Date.now());
      const count = Number(playlistItem.song_count || 0);
      const release = future && playlistItem.release_at
        ? `<div class="playlist-release is-locked"><span>Próximas faixas liberam em</span><strong data-release-countdown data-release-at="${escapeHtml(playlistItem.release_at)}">--d --h --m --s</strong><small>${escapeHtml(new Intl.DateTimeFormat('pt-BR', {day: 'numeric', month: 'long'}).format(new Date(playlistItem.release_at)))}</small></div>`
        : `<div class="playlist-release"><span>${count || 'Sua'} ${count === 1 ? 'música' : 'músicas'} na coleção</span><strong class="playlist-available">Disponível</strong></div>`;
      const card = document.createElement('article');
      card.className = `playlist-tile${future ? ' is-coming-soon' : ''}`;
      card.innerHTML = `<div class="playlist-tile-cover"><img src="${escapeHtml(cover)}" alt="Capa da playlist ${escapeHtml(playlistItem.title)}" loading="lazy">${future ? '<span class="playlist-tile-badge">EM BREVE</span><span class="playlist-tile-lock" aria-hidden="true">🔒</span>' : '<span class="playlist-tile-badge available">PLAYLIST</span>'}</div><div class="playlist-tile-info"><h3>${escapeHtml(playlistItem.title)}</h3><p>${escapeHtml(playlistItem.subtitle || 'Escolha uma música e comece a praticar.')}</p>${release}</div>`;
      playlistCollectionsRail.append(card);
    }
    startReleaseCountdowns();
  }

  function emptyRail(container, message) {
    container.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-catalog';
    empty.textContent = message;
    container.append(empty);
  }

  function formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value <= 0) return '—';
    const minutes = Math.floor(value / 60);
    const remaining = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${remaining}`;
  }

  function songHref(song) {
    return `karaoke.html?song=remote_${encodeURIComponent(song.song_id)}`;
  }

  function selectFeaturedSong(song, cover, row) {
    document.querySelectorAll('.playlist-row.is-selected').forEach(item => item.classList.remove('is-selected'));
    row?.classList.add('is-selected');
    hero.hidden = false;
    heroTitle.textContent = song.title || 'Sua próxima música';
    heroSubtitle.textContent = song.subtitle || song.product_name || 'Pratique inglês cantando.';
    heroMeta.textContent = `${song.product_name || 'Sua biblioteca'} • ${formatDuration(song.duration_seconds)}`;
    heroPlay.href = songHref(song);
    if (cover) {
      heroCover.src = cover;
      heroCover.alt = `Capa de ${song.title || 'música'}`;
      heroCover.hidden = false;
      heroFallback.hidden = true;
    } else {
      heroCover.removeAttribute('src');
      heroCover.alt = '';
      heroCover.hidden = true;
      heroFallback.textContent = song.icon || '🎵';
      heroFallback.hidden = false;
    }
  }

  async function renderLibrary(songs) {
    playlist.replaceChildren();
    const unique = uniqueSongs(songs);
    playlistCount.textContent = unique.length;
    if (!unique.length) {
      hero.hidden = true;
      emptyRail(playlist, 'Sua compra foi reconhecida. As músicas liberadas aparecerão aqui assim que forem vinculadas ao produto.');
      return;
    }
    for (const [index, song] of unique.entries()) {
      const cover = await coverUrl(song);
      const available = song.is_available !== false;
      const songRelease = song.release_at && new Date(song.release_at).getTime() > Date.now();
      const row = document.createElement('article');
      row.className = `playlist-row${available ? '' : ' is-locked'}`;
      const releaseMeta = songRelease ? `<span class="playlist-song-release"><span>Libera em</span><strong data-release-countdown data-release-at="${escapeHtml(song.release_at)}">--d --h --m --s</strong></span>` : '';
      row.innerHTML = `<button class="playlist-select" type="button" aria-label="Selecionar ${escapeHtml(song.title)}"${available ? '' : ' disabled'}><span class="playlist-index">${String(index + 1).padStart(2, '0')}</span><span class="playlist-thumb">${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : escapeHtml(song.icon || '🎵')}</span><span class="playlist-copy"><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.subtitle || song.playlist_title || song.product_name || 'Sua música')}</small>${releaseMeta}</span><span class="playlist-duration">${formatDuration(song.duration_seconds)}</span></button>${available ? `<a class="playlist-action" href="${songHref(song)}">Tocar</a>` : '<span class="playlist-action is-locked" aria-label="Música ainda não liberada">Em breve</span>'}`;
      if (available) row.querySelector('.playlist-select').addEventListener('click', () => selectFeaturedSong(song, cover, row));
      playlist.append(row);
      if (available && !document.querySelector('.playlist-row.is-selected')) selectFeaturedSong(song, cover, row);
    }
    startReleaseCountdowns();
  }

  async function renderCatalog(rows, ownedIds = new Set()) {
    catalogRail.replaceChildren();
    const source = rows?.length ? rows : fallbackCatalog.map(song => ({...song, song_id: song.id, is_accessible: false, product_name: 'Catálogo'}));
    const catalog = uniqueSongs(source).filter(song => !ownedIds.has(song.song_id));
    catalogSection.classList.toggle('is-empty', catalog.length === 0);
    if (!catalog.length) return;
    for (const song of catalog) {
      const cover = await coverUrl(song);
      const available = song.is_available !== false;
      const accessible = Boolean(song.is_accessible) && available;
      const comingSoon = !available && song.release_at;
      const checkout = typeof song.checkout_url === 'string' ? song.checkout_url.trim() : '';
      const action = accessible
        ? `<a class="catalog-play" href="karaoke.html?song=remote_${encodeURIComponent(song.song_id)}">Tocar agora</a>`
        : comingSoon
          ? `<p class="catalog-muted">Libera em <strong data-release-countdown data-release-at="${escapeHtml(song.release_at)}">--d --h --m --s</strong></p>`
        : checkout
          ? `<a class="catalog-buy" href="${escapeHtml(checkout)}" target="_blank" rel="noopener">Conhecer acesso ↗</a>`
          : '<p class="catalog-muted">Disponível em breve</p>';
      const card = document.createElement('article');
      card.className = 'catalog-card';
      card.innerHTML = `<div class="catalog-cover">${cover ? `<img src="${escapeHtml(cover)}" alt="Capa de ${escapeHtml(song.title)}" loading="lazy">` : `<span class="catalog-fallback">${escapeHtml(song.icon || '🎵')}</span>`}${accessible ? '<span class="catalog-badge unlocked">Liberada</span>' : comingSoon ? '<span class="catalog-badge locked">EM BREVE</span><span class="catalog-lock">🔒</span>' : '<span class="catalog-badge locked">Bloqueada</span><span class="catalog-lock">🔒</span>'}</div><h3 class="catalog-card-title">${escapeHtml(song.title)}</h3><p class="catalog-card-subtitle">${escapeHtml(song.subtitle || song.product_name || 'Nova aula')}</p>${action}`;
      catalogRail.append(card);
    }
    startReleaseCountdowns();
  }

  function renderOffers(offers) {
    offersRail.replaceChildren();
    const available = (offers || []).filter(offer => offer.checkout_url);
    offersSection.classList.toggle('has-offers', available.length > 0);
    available.forEach(offer => {
      const card = document.createElement('article');
      card.className = 'offer-card';
      card.innerHTML = `<h3>${escapeHtml(offer.name)}</h3><p>Adicione novas músicas à sua biblioteca quando quiser.</p><a href="${escapeHtml(offer.checkout_url)}" target="_blank" rel="noopener">Ver acesso ↗</a>`;
      offersRail.append(card);
    });
  }

  async function showMemberArea(session) {
    const requestId = ++viewRequest;
    if (!session) {
      loginView.hidden = false;
      libraryView.hidden = true;
      return;
    }
    loginView.hidden = true;
    libraryView.hidden = false;
    greeting.textContent = session.user?.email || '';
    setStatus(libraryStatus, 'Carregando sua biblioteca…');
    try {
      const [libraryResult, catalogResult, offersResult, playlistsResult] = await Promise.all([
        client.rpc('get_my_library'),
        client.rpc('get_member_catalog'),
        client.rpc('get_member_offers'),
        client.rpc('get_member_playlists')
      ]);
      if (libraryResult.error) throw libraryResult.error;
      if (catalogResult.error) throw catalogResult.error;
      if (offersResult.error) throw offersResult.error;
      if (requestId !== viewRequest) return;
      const librarySongs = uniqueSongs(libraryResult.data || []);
      await renderPlaylistCollections(playlistsResult.error ? fallbackPlaylists : (playlistsResult.data || []));
      await renderLibrary(librarySongs);
      await renderCatalog(catalogResult.data || [], new Set(librarySongs.map(song => song.song_id)));
      renderOffers(offersResult.data || []);
      setStatus(libraryStatus, `${librarySongs.length} música(s) na sua playlist`);
    } catch (error) {
      setStatus(libraryStatus, error.message || 'Não foi possível carregar sua biblioteca.', true);
    }
  }

  cpfInput.addEventListener('input', () => { cpfInput.value = formatCpf(cpfInput.value); });
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const cpf = cpfInput.value.replace(/\D/g, '');
    if (!email || cpf.length !== 11) return setStatus(loginStatus, 'Informe um e-mail e um CPF válidos.', true);
    const button = loginForm.querySelector('button');
    button.disabled = true;
    button.innerHTML = 'Conferindo acesso…';
    try {
      const response = await fetch(`${config.functionsBase}/member-login`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, cpf})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.action_link) throw new Error(data.error || 'Não foi possível confirmar o acesso.');
      setStatus(loginStatus, 'Acesso confirmado. Confira seu e-mail para entrar.');
      window.location.assign(data.action_link);
    } catch (error) {
      setStatus(loginStatus, error.message || 'Não foi possível entrar agora.', true);
      button.disabled = false;
      button.innerHTML = 'Entrar na minha biblioteca <span>→</span>';
    }
  });

  logout.addEventListener('click', async () => { await client.auth.signOut(); window.location.reload(); });
  client.auth.onAuthStateChange((_event, session) => { showMemberArea(session).catch(error => setStatus(libraryStatus, error.message, true)); });
  client.auth.getSession().then(({data: {session}}) => showMemberArea(session)).catch(error => setStatus(loginStatus, error.message, true));
})();
