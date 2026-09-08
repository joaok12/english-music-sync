(() => {
  const config = window.SUPABASE_CONFIG || {};
  const loginView = document.getElementById('memberLoginView');
  const libraryView = document.getElementById('memberLibraryView');
  const loginForm = document.getElementById('memberLoginForm');
  const emailInput = document.getElementById('memberEmail');
  const cpfInput = document.getElementById('memberCpf');
  const loginStatus = document.getElementById('loginStatus');
  const playlistDetailStatus = document.getElementById('playlistDetailStatus');
  const playlistCollections = document.getElementById('playlists');
  const playlistCollectionsRail = document.getElementById('playlistCollectionsRail');
  const playlistDetail = document.getElementById('playlistDetail');
  const playlistBack = document.getElementById('playlistBack');
  const playlistDetailTitle = document.getElementById('playlistDetailTitle');
  const playlistDetailSubtitle = document.getElementById('playlistDetailSubtitle');
  const playlist = document.getElementById('memberPlaylist');
  const playlistCount = document.getElementById('playlistCount');
  const offersSection = document.getElementById('memberOffersSection');
  const offersRail = document.getElementById('memberOffersRail');
  const greeting = document.getElementById('memberGreeting');
  const logout = document.getElementById('memberLogout');
  let viewRequest = 0;
  let memberSongsCache = [];
  let activePlaylist = null;
  const coverCache = new Map();

  const fallbackPlaylists = [
    {playlist_id: 'fallback-ingles-cantando', title: 'Inglês Cantando', slug: 'ingles-cantando', subtitle: 'Pratique cantando, uma música por vez.', cover_path: '', song_count: 26, release_at: null, is_available: true, is_accessible: true},
    {playlist_id: 'fallback-50-girias', title: '50 Gírias', slug: '50-girias', subtitle: 'Expressões naturais para conversar melhor.', cover_path: '', song_count: 6, release_at: null, is_available: true, is_accessible: true}
  ];

  function setStatus(element, text, error = false) {
    if (!element) return;
    element.className = `member-status${error ? ' error' : ''}`;
    element.textContent = text || '';
  }

  function animateElement(element, className = 'is-entering') {
    if (!element) return;
    element.classList.remove(className);
    // Restart the short entrance animation when navigating back and forth.
    void element.offsetWidth;
    element.classList.add(className);
    element.onanimationend = event => {
      if (event.target !== element) return;
      element.classList.remove(className);
      element.onanimationend = null;
    };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function isMissingRpc(error) {
    const text = String(error?.message || error || '');
    return error?.code === 'PGRST202' || /could not find the function|function .* does not exist|schema cache/i.test(text);
  }

  function formatCpf(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length > 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    if (digits.length > 6) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    if (digits.length > 3) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    return digits;
  }

  function formatReleaseDate(value) {
    const date = new Date(value || '');
    if (!Number.isFinite(date.getTime())) return 'Disponível em breve.';
    const day = new Intl.DateTimeFormat('pt-BR', {day: 'numeric', timeZone: 'America/Sao_Paulo'}).format(date);
    const month = new Intl.DateTimeFormat('pt-BR', {month: 'long', timeZone: 'America/Sao_Paulo'}).format(date);
    return `Disponível no dia ${day} de ${month}.`;
  }

  if (!config.anonKey || config.anonKey.startsWith('COLE_AQUI') || !window.supabase?.createClient) {
    loginStatus.className = 'member-status error';
    loginStatus.textContent = 'A integração ainda não foi configurada.';
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey);

  function normalizeLegacySong(song) {
    // A release date is the source of truth. Older rows may contain an
    // `is_available` flag without a release date; those are existing songs
    // and must remain playable.
    if (song?.release_at) return song;
    return {...song, release_at: null, is_available: true};
  }

  function isComingSoon(song) {
    const releaseAt = new Date(song?.release_at || '').getTime();
    return Number.isFinite(releaseAt) && releaseAt > Date.now();
  }

  function releaseOrderNumber(song) {
    const text = `${song?.slug || ''} ${song?.title || ''}`;
    const match = text.match(/(?:em-breve-|m[úu]sica\s*)(\d{1,2})/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function orderAvailableFirst(rows) {
    return uniqueSongs(rows)
      .map(normalizeLegacySong)
      .map((song, index) => ({song, index}))
      .sort((left, right) => {
        const leftUpcoming = isComingSoon(left.song) ? 1 : 0;
        const rightUpcoming = isComingSoon(right.song) ? 1 : 0;
        if (leftUpcoming !== rightUpcoming) return leftUpcoming - rightUpcoming;
        if (leftUpcoming) return releaseOrderNumber(left.song) - releaseOrderNumber(right.song) || left.index - right.index;
        return left.index - right.index;
      })
      .map(({song}) => song);
  }

  function playlistKeyForSong(song) {
    if (song?.playlist_id) return song.playlist_id;
    const text = `${song?.id || ''} ${song?.song_id || ''} ${song?.title || ''} ${song?.slug || ''}`.toLocaleLowerCase();
    return text.includes('de boa') || text.includes('de-boa') || text.includes('facdb85a')
      ? 'fallback-50-girias'
      : 'fallback-ingles-cantando';
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

  function formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value <= 0) return '—';
    const minutes = Math.floor(value / 60);
    const remaining = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${remaining}`;
  }

  function formatPrice(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return 'Ver valor';
    return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(amount);
  }

  function songHref(song) {
    const id = song.song_id || song.id;
    return `karaoke.html?song=remote_${encodeURIComponent(id)}`;
  }

  async function coverUrl(song) {
    const cacheKey = String(song?.cover_path || song?.song_id || song?.id || song?.title || '');
    const cached = coverCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.url;
    if (song.cover_path) {
      try {
        const {data} = await client.storage.from('song-media').createSignedUrl(song.cover_path, 3600);
        if (data?.signedUrl) {
          coverCache.set(cacheKey, {url: data.signedUrl, expiresAt: Date.now() + 55 * 60 * 1000});
          return data.signedUrl;
        }
      } catch (_error) {
        // A missing cover should never block the playlist from opening.
      }
    }
    const text = `${song?.id || ''} ${song?.song_id || ''} ${song?.title || ''}`.toLocaleLowerCase();
    const fallback = text.includes('de boa') || text.includes('de-boa') || text.includes('facdb85a')
      ? 'assets/covers/de-boa.webp'
      : text.includes('praia')
        ? 'assets/covers/praia.webp'
        : text.includes('moro aqui')
          ? 'assets/covers/eu-moro-aqui.webp'
          : text.includes('start')
            ? 'assets/covers/lets-start.webp'
            : '';
    coverCache.set(cacheKey, {url: fallback, expiresAt: Date.now() + 10 * 60 * 1000});
    return fallback;
  }

  function fallbackPlaylistCover(playlistItem) {
    return String(playlistItem?.slug || '').toLowerCase() === '50-girias'
      ? 'assets/covers/50-girias.webp'
      : 'assets/branding/logo.png';
  }

  async function playlistCoverUrl(playlistItem) {
    const cacheKey = `playlist:${playlistItem?.cover_path || playlistItem?.slug || playlistItem?.playlist_id || ''}`;
    const cached = coverCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.url;
    if (playlistItem.cover_path) {
      try {
        const {data} = await client.storage.from('song-media').createSignedUrl(playlistItem.cover_path, 3600);
        if (data?.signedUrl) {
          coverCache.set(cacheKey, {url: data.signedUrl, expiresAt: Date.now() + 55 * 60 * 1000});
          return data.signedUrl;
        }
      } catch (_error) {
        // Fall back to the local cover when storage is slow or unavailable.
      }
    }
    const fallback = fallbackPlaylistCover(playlistItem);
    coverCache.set(cacheKey, {url: fallback, expiresAt: Date.now() + 10 * 60 * 1000});
    return fallback;
  }

  function emptyRail(container, message) {
    container.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-catalog';
    empty.textContent = message;
    container.append(empty);
  }

  function renderPlaylistCollectionSkeleton() {
    playlistCollectionsRail.replaceChildren();
    for (let index = 0; index < 2; index += 1) {
      const skeleton = document.createElement('div');
      skeleton.className = 'playlist-tile-skeleton';
      skeleton.style.setProperty('--tile-index', index);
      skeleton.setAttribute('aria-hidden', 'true');
      skeleton.innerHTML = '<span class="skeleton-cover"></span><span class="skeleton-copy"><i></i><i></i><i></i></span>';
      playlistCollectionsRail.append(skeleton);
    }
  }

  function renderPlaylistSkeleton() {
    playlist.replaceChildren();
    for (let index = 0; index < 5; index += 1) {
      const skeleton = document.createElement('div');
      skeleton.className = 'playlist-row-skeleton';
      skeleton.style.setProperty('--row-index', index);
      skeleton.setAttribute('aria-hidden', 'true');
      skeleton.innerHTML = '<i></i><em></em><span></span><b></b>';
      playlist.append(skeleton);
    }
  }

  async function renderPlaylistCollections(rows) {
    playlistCollectionsRail.replaceChildren();
    if (!Array.isArray(rows) || !rows.length) {
      emptyRail(playlistCollectionsRail, 'Nenhuma playlist disponível para esta conta.');
      return;
    }
    const cards = await Promise.all(rows.map(async (playlistItem, index) => {
      const cover = await playlistCoverUrl(playlistItem);
      const future = playlistItem.is_available === false || (playlistItem.release_at && new Date(playlistItem.release_at).getTime() > Date.now());
      const accessible = playlistItem.is_accessible !== false;
      const locked = !future && !accessible;
      const count = Number(playlistItem.song_count || 0);
      const release = future && playlistItem.release_at
        ? `<div class="playlist-release is-locked"><strong>${escapeHtml(formatReleaseDate(playlistItem.release_at))}</strong></div>`
        : locked
          ? `<div class="playlist-release is-locked"><span>${playlistItem.is_order_bump ? 'ORDER BUMP' : 'ACESSO'}</span><strong class="playlist-buy">${escapeHtml(formatPrice(playlistItem.price))}</strong></div>`
          : `<div class="playlist-release"><span>${count || 'Sua'} ${count === 1 ? 'música' : 'músicas'} na coleção</span><strong class="playlist-available">Abrir playlist</strong></div>`;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `playlist-tile${future ? ' is-coming-soon' : ''}${locked ? ' is-locked' : ''}`;
      card.style.setProperty('--tile-index', index);
      card.disabled = future;
      const imageLoading = index < 2 ? 'eager' : 'lazy';
      const imagePriority = index === 0 ? 'high' : 'auto';
      const badge = future ? '<span class="playlist-tile-badge">EM BREVE</span>' : locked ? '<span class="playlist-tile-badge locked">BLOQUEADA</span>' : '<span class="playlist-tile-badge available">PLAYLIST</span>';
      const lock = future || locked ? '<span class="playlist-tile-lock" aria-hidden="true">🔒</span>' : '';
      card.innerHTML = `<div class="playlist-tile-cover"><img src="${escapeHtml(cover)}" alt="Capa da playlist ${escapeHtml(playlistItem.title)}" loading="${imageLoading}" fetchpriority="${imagePriority}" decoding="async">${badge}${lock}</div><div class="playlist-tile-info"><h3>${escapeHtml(playlistItem.title)}</h3><p>${escapeHtml(playlistItem.subtitle || 'Escolha uma playlist para ver suas músicas.')}</p>${release}</div>`;
      card.setAttribute('aria-label', accessible ? `Abrir playlist ${playlistItem.title}` : `Comprar acesso à playlist ${playlistItem.title}`);
      card.addEventListener('click', () => {
        if (future) return;
        if (accessible) return openPlaylist(playlistItem);
        if (playlistItem.checkout_url) window.open(playlistItem.checkout_url, '_blank', 'noopener');
      });
      return card;
    }));
    playlistCollectionsRail.append(...cards);
    animateElement(playlistCollections);
  }

  function renderLibrary(rows) {
    playlist.replaceChildren();
    const unique = orderAvailableFirst(rows);
    playlistCount.textContent = unique.length;
    if (!unique.length) {
      emptyRail(playlist, 'Esta playlist ainda não tem músicas liberadas.');
      return;
    }
    unique.forEach((song, index) => {
      const row = document.createElement('article');
      const future = isComingSoon(song);
      const available = !future;
      row.className = `playlist-row${available ? '' : ' is-locked'}`;
      row.style.setProperty('--row-index', index);
      const releaseMeta = future ? `<span class="playlist-song-release"><strong>${escapeHtml(formatReleaseDate(song.release_at))}</strong></span>` : '';
      const cover = song.__cover || '';
      row.innerHTML = `<div class="playlist-select"><span class="playlist-index">${String(index + 1).padStart(2, '0')}</span><span class="playlist-thumb">${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy" decoding="async">` : escapeHtml(song.icon || '🎵')}</span><span class="playlist-copy"><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.subtitle || 'Sua música')}</small>${releaseMeta}</span><span class="playlist-duration">${formatDuration(song.duration_seconds)}</span></div>${available ? `<a class="playlist-action" href="${songHref(song)}">Tocar</a>` : '<span class="playlist-action is-locked" aria-label="Música ainda não liberada">Em breve</span>'}`;
      playlist.append(row);
    });
    animateElement(playlist);
  }

  async function renderLibraryWithCovers(rows) {
    const songs = orderAvailableFirst(rows);
    await Promise.all(songs.map(async song => { song.__cover = await coverUrl(song); }));
    renderLibrary(songs);
  }

  function closePlaylist() {
    activePlaylist = null;
    playlistDetail.hidden = true;
    playlistCollections.hidden = false;
    playlist.replaceChildren();
    setStatus(playlistDetailStatus, '');
    animateElement(playlistCollections);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  async function loadPlaylistSongs(playlistItem) {
    const result = await client.rpc('get_my_playlist_songs', {p_playlist_id: playlistItem.playlist_id});
    if (!result.error) return result.data || [];
    if (!isMissingRpc(result.error)) throw result.error;
    const fallback = memberSongsCache.filter(song => playlistKeyForSong(song) === playlistItem.playlist_id);
    return fallback;
  }

  async function openPlaylist(playlistItem) {
    if (playlistItem.is_accessible === false) {
      if (playlistItem.checkout_url) window.open(playlistItem.checkout_url, '_blank', 'noopener');
      return;
    }
    activePlaylist = playlistItem;
    playlistCollections.hidden = true;
    playlistDetail.hidden = false;
    playlistDetailTitle.textContent = playlistItem.title || 'Playlist';
    playlistDetailSubtitle.textContent = playlistItem.subtitle || '';
    setStatus(playlistDetailStatus, 'Carregando músicas…');
    renderPlaylistSkeleton();
    animateElement(playlistDetail);
    window.scrollTo({top: 0, behavior: 'smooth'});
    try {
      const songs = await loadPlaylistSongs(playlistItem);
      if (activePlaylist !== playlistItem) return;
      await renderLibraryWithCovers(songs);
      setStatus(playlistDetailStatus, songs.length ? '' : 'Esta playlist ainda não tem músicas liberadas.');
    } catch (error) {
      setStatus(playlistDetailStatus, error.message || 'Não foi possível carregar esta playlist.', true);
      emptyRail(playlist, 'Tente novamente em alguns instantes.');
    }
  }

  function renderOffers(offers) {
    offersRail.replaceChildren();
    // As ofertas agora aparecem na própria grade de playlists, como cards
    // bloqueados com preço e checkout. Mantemos a seção antiga oculta para
    // compatibilidade com caches de versões anteriores.
    offersSection.classList.remove('has-offers');
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
    closePlaylist();
    renderPlaylistCollectionSkeleton();
    try {
      const [libraryResult, playlistsResult, offersResult] = await Promise.all([
        client.rpc('get_my_library'),
        client.rpc('get_member_playlists'),
        client.rpc('get_member_offers')
      ]);
      if (requestId !== viewRequest) return;
      memberSongsCache = libraryResult.error ? [] : uniqueSongs(libraryResult.data || []);
      let playlistRows;
      if (playlistsResult.error) {
        // The fallback contains only the two persistent collections. Never
        // manufacture upcoming songs in the browser when the RPC is missing.
        playlistRows = fallbackPlaylists;
      } else {
        playlistRows = playlistsResult.data || [];
      }
      await renderPlaylistCollections(playlistRows);
      renderOffers(offersResult.error ? [] : offersResult.data || []);
    } catch (error) {
      setStatus(playlistDetailStatus, error.message || 'Não foi possível carregar suas playlists.', true);
    }
  }

  playlistBack.addEventListener('click', closePlaylist);
  document.querySelector('.member-nav-links a')?.addEventListener('click', event => {
    if (!playlistDetail.hidden) {
      event.preventDefault();
      closePlaylist();
    }
  });
  cpfInput.addEventListener('input', () => { cpfInput.value = formatCpf(cpfInput.value); });
  loginForm.addEventListener('submit', async event => {
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
      button.innerHTML = 'Entrar <span>→</span>';
    }
  });

  logout.addEventListener('click', async () => { await client.auth.signOut(); window.location.reload(); });
  client.auth.onAuthStateChange((_event, session) => { showMemberArea(session).catch(error => setStatus(playlistDetailStatus, error.message, true)); });
  client.auth.getSession().then(({data: {session}}) => showMemberArea(session)).catch(error => setStatus(loginStatus, error.message, true));
})();
