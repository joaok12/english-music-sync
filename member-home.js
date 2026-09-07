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
  let releaseTimer = null;
  let memberSongsCache = [];
  let activePlaylist = null;

  const legacyReleaseAt = '2026-09-11T00:00:00-03:00';
  const fallbackPlaylists = [
    {playlist_id: 'fallback-ingles-cantando', title: 'Inglês Cantando', slug: 'ingles-cantando', subtitle: 'Pratique cantando, uma música por vez.', cover_path: '', song_count: 20, release_at: null, is_available: true},
    {playlist_id: 'fallback-50-girias', title: '50 Gírias', slug: '50-girias', subtitle: 'Expressões naturais para conversar melhor.', cover_path: '', song_count: 1, release_at: null, is_available: true}
  ];

  function setStatus(element, text, error = false) {
    if (!element) return;
    element.className = `member-status${error ? ' error' : ''}`;
    element.textContent = text || '';
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
      const row = element.closest('.playlist-row');
      if (remaining <= 0) {
        element.textContent = 'Disponível';
        element.closest('.playlist-tile, .playlist-release')?.classList.remove('is-locked');
        row?.classList.remove('is-locked');
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

  function orderAvailableFirst(rows) {
    return uniqueSongs(rows)
      .map(normalizeLegacySong)
      .map((song, index) => ({song, index}))
      .sort((left, right) => {
        const leftUpcoming = isComingSoon(left.song) ? 1 : 0;
        const rightUpcoming = isComingSoon(right.song) ? 1 : 0;
        return leftUpcoming - rightUpcoming || left.index - right.index;
      })
      .map(({song}) => song);
  }

  function legacyUpcomingSongs() {
    return Array.from({length: 20}, (_, index) => ({
      song_id: `legacy-ingles-cantando-${String(index + 1).padStart(2, '0')}`,
      title: `Inglês Cantando • Música ${String(index + 1).padStart(2, '0')}`,
      subtitle: 'Nova aula em breve.',
      icon: '🎤',
      cover_path: '',
      audio_path: '',
      duration_seconds: null,
      lyrics: [],
      playlist_id: 'fallback-ingles-cantando',
      release_at: legacyReleaseAt,
      is_available: false
    }));
  }

  function isEnglishSingingPlaylist(playlistItem) {
    return String(playlistItem?.slug || '').toLocaleLowerCase() === 'ingles-cantando';
  }

  function upcomingNumber(song) {
    const slugMatch = String(song?.slug || '').match(/ingles-cantando-em-breve-(\d{1,2})$/i);
    if (slugMatch) return Number(slugMatch[1]);
    const idMatch = String(song?.song_id || '').match(/legacy-ingles-cantando-(\d{1,2})$/i);
    if (idMatch) return Number(idMatch[1]);
    const titleMatch = String(song?.title || '').match(/m[úu]sica\s*(\d{1,2})/i);
    return titleMatch ? Number(titleMatch[1]) : null;
  }

  function mergeLegacyUpcomingSongs(rows, playlistItem) {
    const current = Array.isArray(rows) ? [...rows] : [];
    if (!isEnglishSingingPlaylist(playlistItem)) return current;
    const present = new Set(current.map(upcomingNumber).filter(Number.isInteger));
    return [...current, ...legacyUpcomingSongs().filter((song, index) => !present.has(index + 1))];
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

  function songHref(song) {
    const id = song.song_id || song.id;
    return `karaoke.html?song=remote_${encodeURIComponent(id)}`;
  }

  async function coverUrl(song) {
    if (song.cover_path) {
      const {data} = await client.storage.from('song-media').createSignedUrl(song.cover_path, 3600);
      if (data?.signedUrl) return data.signedUrl;
    }
    const text = `${song?.id || ''} ${song?.song_id || ''} ${song?.title || ''}`.toLocaleLowerCase();
    if (text.includes('de boa') || text.includes('de-boa') || text.includes('facdb85a')) return 'assets/covers/de-boa.webp';
    if (text.includes('praia')) return 'assets/covers/praia.webp';
    if (text.includes('moro aqui')) return 'assets/covers/eu-moro-aqui.webp';
    if (text.includes('start')) return 'assets/covers/lets-start.webp';
    return '';
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

  function emptyRail(container, message) {
    container.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-catalog';
    empty.textContent = message;
    container.append(empty);
  }

  async function renderPlaylistCollections(rows) {
    playlistCollectionsRail.replaceChildren();
    if (!Array.isArray(rows) || !rows.length) {
      emptyRail(playlistCollectionsRail, 'Nenhuma playlist disponível para esta conta.');
      return;
    }
    for (const playlistItem of rows) {
      const cover = await playlistCoverUrl(playlistItem);
      const future = playlistItem.is_available === false || (playlistItem.release_at && new Date(playlistItem.release_at).getTime() > Date.now());
      const count = Number(playlistItem.song_count || 0);
      const release = future && playlistItem.release_at
        ? `<div class="playlist-release is-locked"><span>Libera em</span><strong data-release-countdown data-release-at="${escapeHtml(playlistItem.release_at)}">--d --h --m --s</strong></div>`
        : `<div class="playlist-release"><span>${count || 'Sua'} ${count === 1 ? 'música' : 'músicas'} na coleção</span><strong class="playlist-available">Abrir playlist</strong></div>`;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `playlist-tile${future ? ' is-coming-soon' : ''}`;
      card.disabled = future;
      card.innerHTML = `<div class="playlist-tile-cover"><img src="${escapeHtml(cover)}" alt="Capa da playlist ${escapeHtml(playlistItem.title)}" loading="lazy">${future ? '<span class="playlist-tile-badge">EM BREVE</span><span class="playlist-tile-lock" aria-hidden="true">🔒</span>' : '<span class="playlist-tile-badge available">PLAYLIST</span>'}</div><div class="playlist-tile-info"><h3>${escapeHtml(playlistItem.title)}</h3><p>${escapeHtml(playlistItem.subtitle || 'Escolha uma playlist para ver suas músicas.')}</p>${release}</div>`;
      card.addEventListener('click', () => openPlaylist(playlistItem));
      playlistCollectionsRail.append(card);
    }
    startReleaseCountdowns();
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
      const releaseMeta = future ? `<span class="playlist-song-release"><span>Libera em</span><strong data-release-countdown data-release-at="${escapeHtml(song.release_at)}">--d --h --m --s</strong></span>` : '';
      const cover = song.__cover || '';
      row.innerHTML = `<div class="playlist-select"><span class="playlist-index">${String(index + 1).padStart(2, '0')}</span><span class="playlist-thumb">${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : escapeHtml(song.icon || '🎵')}</span><span class="playlist-copy"><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.subtitle || 'Sua música')}</small>${releaseMeta}</span><span class="playlist-duration">${formatDuration(song.duration_seconds)}</span></div>${available ? `<a class="playlist-action" href="${songHref(song)}">Tocar</a>` : '<span class="playlist-action is-locked" aria-label="Música ainda não liberada">Em breve</span>'}`;
      playlist.append(row);
    });
    startReleaseCountdowns();
  }

  async function renderLibraryWithCovers(rows) {
    const songs = orderAvailableFirst(rows);
    for (const song of songs) song.__cover = await coverUrl(song);
    renderLibrary(songs);
  }

  function closePlaylist() {
    activePlaylist = null;
    playlistDetail.hidden = true;
    playlistCollections.hidden = false;
    playlist.replaceChildren();
    setStatus(playlistDetailStatus, '');
  }

  async function loadPlaylistSongs(playlistItem) {
    const result = await client.rpc('get_my_playlist_songs', {p_playlist_id: playlistItem.playlist_id});
    if (!result.error) return mergeLegacyUpcomingSongs(result.data || [], playlistItem);
    if (!isMissingRpc(result.error)) throw result.error;
    const fallback = memberSongsCache.filter(song => playlistKeyForSong(song) === playlistItem.playlist_id);
    return mergeLegacyUpcomingSongs(fallback, playlistItem);
  }

  async function openPlaylist(playlistItem) {
    activePlaylist = playlistItem;
    playlistCollections.hidden = true;
    playlistDetail.hidden = false;
    playlistDetailTitle.textContent = playlistItem.title || 'Playlist';
    playlistDetailSubtitle.textContent = playlistItem.subtitle || '';
    setStatus(playlistDetailStatus, 'Carregando músicas…');
    playlist.replaceChildren();
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
    const available = (offers || []).filter(offer => offer.checkout_url);
    offersSection.classList.toggle('has-offers', available.length > 0);
    available.forEach(offer => {
      const card = document.createElement('article');
      card.className = 'offer-card';
      card.innerHTML = `<h3>${escapeHtml(offer.name)}</h3><p>Adicione outra playlist à sua biblioteca.</p><a href="${escapeHtml(offer.checkout_url)}" target="_blank" rel="noopener">Conhecer acesso ↗</a>`;
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
    closePlaylist();
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
        memberSongsCache = [...memberSongsCache, ...legacyUpcomingSongs()];
        const counts = new Map();
        memberSongsCache.forEach(song => counts.set(playlistKeyForSong(song), (counts.get(playlistKeyForSong(song)) || 0) + 1));
        playlistRows = fallbackPlaylists.map(item => ({...item, song_count: counts.get(item.playlist_id) || item.song_count}));
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
