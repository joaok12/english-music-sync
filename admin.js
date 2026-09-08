(() => {
  const config = window.SUPABASE_CONFIG || {};
  const hasConfig = config.anonKey && !config.anonKey.startsWith('COLE_AQUI');
  const loginCard = document.getElementById('adminLoginCard');
  const loginForm = document.getElementById('adminLoginForm');
  const loginEmail = document.getElementById('adminEmail');
  const loginPassword = document.getElementById('adminPassword');
  const loginStatus = document.getElementById('adminLoginStatus');
  const app = document.getElementById('adminApp');
  const status = document.getElementById('adminStatus');
  const logout = document.getElementById('adminLogout');
  const nav = document.getElementById('adminNav');
  const mobileNav = document.querySelector('.admin-mobile-nav');
  const sidebar = document.querySelector('.admin-sidebar');
  const songForm = document.getElementById('adminSongForm');
  const songId = document.getElementById('adminSongId');
  const songTitle = document.getElementById('adminSongTitle');
  const songSubtitle = document.getElementById('adminSongSubtitle');
  const songIcon = document.getElementById('adminSongIcon');
  const songCover = document.getElementById('adminSongCover');
  const songAudio = document.getElementById('adminSongAudio');
  const songLyrics = document.getElementById('adminSongLyrics');
  const songReleaseAt = document.getElementById('adminSongReleaseAt');
  const songPublished = document.getElementById('adminSongPublished');
  const songPlaylistChoices = document.getElementById('adminSongPlaylistChoices');
  const saveSong = document.getElementById('adminSaveSong');
  const clearSong = document.getElementById('adminClearSong');
  const songStatus = document.getElementById('adminSongStatus');
  const songList = document.getElementById('adminSongList');
  const playlistForm = document.getElementById('adminPlaylistForm');
  const playlistId = document.getElementById('adminPlaylistId');
  const playlistTitle = document.getElementById('adminPlaylistTitle');
  const playlistSubtitle = document.getElementById('adminPlaylistSubtitle');
  const playlistCover = document.getElementById('adminPlaylistCover');
  const playlistReleaseAt = document.getElementById('adminPlaylistReleaseAt');
  const playlistSortOrder = document.getElementById('adminPlaylistSortOrder');
  const playlistPublished = document.getElementById('adminPlaylistPublished');
  const playlistSongChoices = document.getElementById('adminPlaylistSongChoices');
  const savePlaylist = document.getElementById('adminSavePlaylist');
  const clearPlaylist = document.getElementById('adminClearPlaylist');
  const playlistStatus = document.getElementById('adminPlaylistStatus');
  const playlistList = document.getElementById('adminPlaylistList');
  const productList = document.getElementById('adminProductList');
  const productRuleForm = document.getElementById('adminProductRuleForm');
  const productRuleId = document.getElementById('adminProductRuleId');
  const productRuleHublaId = document.getElementById('adminProductRuleHublaId');
  const productRuleName = document.getElementById('adminProductRuleName');
  const productRulePlaylist = document.getElementById('adminProductRulePlaylist');
  const productRulePrice = document.getElementById('adminProductRulePrice');
  const productRuleCheckout = document.getElementById('adminProductRuleCheckout');
  const productRuleOrderBump = document.getElementById('adminProductRuleOrderBump');
  const productRuleActive = document.getElementById('adminProductRuleActive');
  const saveProductRule = document.getElementById('adminSaveProductRule');
  const clearProductRule = document.getElementById('adminClearProductRule');
  const productRuleStatus = document.getElementById('adminProductRuleStatus');
  const productRuleList = document.getElementById('adminProductRuleList');

  if (!hasConfig || !window.supabase?.createClient) {
    loginStatus.className = 'admin-status error';
    loginStatus.textContent = 'A chave pública do Supabase ainda precisa ser configurada.';
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey);
  let songs = [];
  let playlists = [];
  let products = [];
  let productRules = [];
  let currentView = 'dashboard';

  const viewMeta = {
    dashboard: ['INGLÊS CANTANDO', 'Visão geral', 'Uma visão rápida do seu catálogo e das próximas liberações.'],
    songs: ['CATÁLOGO', 'Músicas', 'Adicione letras e áudio, depois sincronize cada faixa no seu tempo.'],
    playlists: ['ORGANIZAÇÃO', 'Playlists', 'Monte coleções, capas e a ordem das músicas para seus alunos.'],
    products: ['ACESSOS', 'Produtos e order bumps', 'Defina quais produtos da Hubla liberam cada música.']
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function setStatus(element, message, error = false) {
    if (!element) return;
    element.className = `admin-status${error ? ' error' : ''}`;
    element.textContent = message || '';
  }

  function slugify(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
  }

  function extension(file, fallback) {
    const name = String(file?.name || '').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    return name || fallback;
  }

  function audioDuration(file) {
    if (!file) return Promise.resolve(null);
    return new Promise(resolve => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      const cleanup = () => { audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); };
      const finish = value => { cleanup(); resolve(Number.isFinite(value) && value > 0 ? value : null); };
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
    const {error} = await client.storage.from('song-media').upload(path, file, {
      upsert: true, contentType: file.type || undefined, cacheControl: '31536000'
    });
    if (error) throw error;
    return path;
  }

  function recordData(data) { return Array.isArray(data) ? data[0] : data; }

  function isMissingRpc(error) {
    const text = String(error?.message || error || '');
    return error?.code === 'PGRST202' || /could not find the function|function .* does not exist|schema cache/i.test(text);
  }

  function toIso(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function toDateTimeInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = number => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function dateLabel(value, includeTime = true) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: 'short', ...(includeTime ? {hour: '2-digit', minute: '2-digit'} : {})}).format(date).replace('.', '');
  }

  function isFuture(value) {
    return Boolean(value && new Date(value).getTime() > Date.now());
  }

  function fallbackPlaylistCover(playlist) {
    const slug = String(playlist?.slug || '').toLowerCase();
    if (slug === '50-girias') return 'assets/covers/50-girias.webp';
    if (slug === 'ingles-cantando') return 'assets/branding/logo.png';
    return 'assets/branding/logo.png';
  }

  async function signedCover(path, fallback) {
    if (path) {
      const {data} = await client.storage.from('song-media').createSignedUrl(path, 3600);
      if (data?.signedUrl) return data.signedUrl;
    }
    return fallback;
  }

  function selectedValues(container) {
    return [...container.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
  }

  function renderSongPlaylistChoices(selected = []) {
    const chosen = new Set(selected || []);
    songPlaylistChoices.replaceChildren();
    if (!playlists.length) {
      songPlaylistChoices.innerHTML = '<p class="admin-empty">Crie uma playlist para selecionar aqui.</p>';
      return;
    }
    playlists.forEach(playlist => {
      const label = document.createElement('label');
      label.className = 'admin-choice';
      label.innerHTML = `<input type="checkbox" value="${escapeHtml(playlist.id)}"${chosen.has(playlist.id) ? ' checked' : ''}><span>${escapeHtml(playlist.title)}</span>`;
      songPlaylistChoices.append(label);
    });
  }

  function renderPlaylistSongChoices(selected = []) {
    const chosen = new Set(selected || []);
    playlistSongChoices.replaceChildren();
    if (!songs.length) {
      playlistSongChoices.innerHTML = '<p class="admin-empty">Cadastre uma música para selecionar aqui.</p>';
      return;
    }
    songs.forEach(song => {
      const label = document.createElement('label');
      label.className = 'admin-choice';
      label.innerHTML = `<input type="checkbox" value="${escapeHtml(song.id)}"${chosen.has(song.id) ? ' checked' : ''}><span>${escapeHtml(song.icon || '🎵')} ${escapeHtml(song.title)}</span>`;
      playlistSongChoices.append(label);
    });
  }

  function renderProductRulePlaylistChoices(selected = '') {
    productRulePlaylist.replaceChildren();
    if (!playlists.length) {
      productRulePlaylist.innerHTML = '<option value="">Crie uma playlist primeiro</option>';
      return;
    }
    playlists.forEach(playlistItem => {
      const option = document.createElement('option');
      option.value = playlistItem.id;
      option.textContent = playlistItem.title;
      option.selected = playlistItem.id === selected;
      productRulePlaylist.append(option);
    });
  }

  function moneyLabel(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return 'Valor não configurado';
    return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(amount);
  }

  function resetProductRuleForm() {
    productRuleForm.reset();
    productRuleId.value = '';
    productRuleActive.checked = true;
    document.getElementById('productRuleFormTitle').textContent = 'Nova regra de produto';
    saveProductRule.textContent = 'Salvar regra';
    renderProductRulePlaylistChoices();
    setStatus(productRuleStatus, '');
  }

  function editProductRule(rule) {
    productRuleId.value = rule.id || '';
    productRuleHublaId.value = rule.hubla_product_id || '';
    productRuleName.value = rule.name_contains || '';
    productRulePrice.value = rule.price ?? '';
    productRuleCheckout.value = rule.checkout_url || '';
    productRuleOrderBump.checked = Boolean(rule.is_order_bump);
    productRuleActive.checked = rule.is_active !== false;
    renderProductRulePlaylistChoices(rule.playlist_id || '');
    document.getElementById('productRuleFormTitle').textContent = 'Editar regra de produto';
    saveProductRule.textContent = 'Salvar alterações';
    openView('products');
    productRuleHublaId.focus({preventScroll: true});
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function renderProductRules() {
    productRuleList.replaceChildren();
    document.getElementById('adminProductRuleCount').textContent = productRules.length;
    if (!productRules.length) {
      productRuleList.innerHTML = '<p class="admin-empty">Nenhuma regra criada. Use um ID ou palavra do nome para automatizar o próximo produto.</p>';
      return;
    }
    productRules.forEach(rule => {
      const item = document.createElement('article');
      item.className = 'admin-rule-row';
      const matcher = rule.hubla_product_id
        ? `ID: ${escapeHtml(rule.hubla_product_id)}`
        : `Nome contém: “${escapeHtml(rule.name_contains)}”`;
      const tags = [
        rule.is_order_bump ? '<span class="admin-tag soon">Order bump</span>' : '<span class="admin-tag">Produto principal</span>',
        rule.is_active ? '<span class="admin-tag">Ativa</span>' : '<span class="admin-tag draft">Pausada</span>'
      ];
      item.innerHTML = `<div><strong>${escapeHtml(rule.playlist_title)}</strong><small>${matcher}</small><div class="admin-item-tags">${tags.join('')}<span class="admin-meta">${escapeHtml(moneyLabel(rule.price))}</span></div></div><div class="admin-card-actions"><button type="button" data-edit-product-rule="${escapeHtml(rule.id)}">Editar</button><button type="button" data-delete-product-rule="${escapeHtml(rule.id)}">Excluir</button></div>`;
      item.querySelector('[data-edit-product-rule]').addEventListener('click', () => editProductRule(rule));
      item.querySelector('[data-delete-product-rule]').addEventListener('click', async () => {
        if (!window.confirm('Excluir esta regra automática?')) return;
        try {
          const {error} = await client.rpc('admin_delete_product_rule', {p_id: rule.id});
          if (error) throw error;
          setStatus(productRuleStatus, 'Regra excluída.');
          await refresh();
        } catch (error) { setStatus(productRuleStatus, error.message || 'Não foi possível excluir a regra.', true); }
      });
      productRuleList.append(item);
    });
  }

  function resetSongForm() {
    songForm.reset();
    songId.value = '';
    songIcon.value = '🎵';
    songPublished.checked = false;
    songReleaseAt.value = '';
    songForm.dataset.coverPath = '';
    songForm.dataset.audioPath = '';
    document.getElementById('songFormTitle').textContent = 'Adicionar música';
    saveSong.textContent = 'Salvar música';
    renderSongPlaylistChoices();
    setStatus(songStatus, '');
  }

  function editSong(song) {
    songId.value = song.id;
    songTitle.value = song.title || '';
    songSubtitle.value = song.subtitle || '';
    songIcon.value = song.icon || '🎵';
    songLyrics.value = (song.lyrics || []).map(block => [block.pt, block.en1, block.en2].filter(Boolean).join('\n')).join('\n\n');
    songReleaseAt.value = toDateTimeInput(song.release_at);
    songPublished.checked = Boolean(song.is_published);
    songForm.dataset.coverPath = song.cover_path || '';
    songForm.dataset.audioPath = song.audio_path || '';
    document.getElementById('songFormTitle').textContent = `Editar: ${song.title}`;
    saveSong.textContent = 'Salvar alterações';
    renderSongPlaylistChoices(song.playlist_ids || []);
    openView('songs');
    songTitle.focus({preventScroll: true});
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function resetPlaylistForm() {
    playlistForm.reset();
    playlistId.value = '';
    playlistSortOrder.value = String(playlists.length);
    playlistPublished.checked = true;
    playlistReleaseAt.value = '';
    playlistForm.dataset.coverPath = '';
    document.getElementById('playlistFormTitle').textContent = 'Nova playlist';
    savePlaylist.textContent = 'Salvar playlist';
    renderPlaylistSongChoices();
    setStatus(playlistStatus, '');
  }

  function editPlaylist(playlist) {
    playlistId.value = playlist.id;
    playlistTitle.value = playlist.title || '';
    playlistSubtitle.value = playlist.subtitle || '';
    playlistSortOrder.value = String(Number(playlist.sort_order) || 0);
    playlistReleaseAt.value = toDateTimeInput(playlist.release_at);
    playlistPublished.checked = Boolean(playlist.is_published);
    playlistForm.dataset.coverPath = playlist.cover_path || '';
    document.getElementById('playlistFormTitle').textContent = `Editar: ${playlist.title}`;
    savePlaylist.textContent = 'Salvar alterações';
    renderPlaylistSongChoices(playlist.song_ids || []);
    openView('playlists');
    playlistTitle.focus({preventScroll: true});
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function renderDashboard() {
    document.getElementById('statSongs').textContent = songs.length;
    document.getElementById('statPublished').textContent = `${songs.filter(song => song.is_published).length} publicadas`;
    document.getElementById('statPlaylists').textContent = playlists.length;
    document.getElementById('statPlaylistSongs').textContent = `${playlists.reduce((total, item) => total + Number(item.song_count || item.song_ids?.length || 0), 0)} faixas organizadas`;
    document.getElementById('statProducts').textContent = products.length;
    const upcoming = songs.filter(song => isFuture(song.release_at)).sort((a, b) => new Date(a.release_at) - new Date(b.release_at)).slice(0, 6);
    const list = document.getElementById('adminUpcomingList');
    list.replaceChildren();
    if (!upcoming.length) {
      list.innerHTML = '<p class="admin-empty">Nenhuma música com timer ativo.</p>';
      return;
    }
    upcoming.forEach(song => {
      const item = document.createElement('div');
      item.className = 'admin-upcoming-item';
      item.innerHTML = `<div><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml((song.playlist_names || []).join(' · ') || 'Sem playlist')}</small></div><time class="admin-upcoming-date">${escapeHtml(dateLabel(song.release_at))}</time>`;
      list.append(item);
    });
  }

  function renderSongs() {
    songList.replaceChildren();
    document.getElementById('adminSongListCount').textContent = songs.length;
    if (!songs.length) {
      songList.innerHTML = '<p class="admin-empty">Nenhuma música cadastrada ainda.</p>';
      return;
    }
    songs.forEach(song => {
      const item = document.createElement('article');
      item.className = 'admin-song-card';
      const playlistNames = song.playlist_names || [];
      const tags = [song.is_published ? '<span class="admin-tag">Publicada</span>' : '<span class="admin-tag draft">Rascunho</span>'];
      if (isFuture(song.release_at)) tags.push(`<span class="admin-tag soon">Em breve · ${escapeHtml(dateLabel(song.release_at))}</span>`);
      item.innerHTML = `<div class="admin-item-main"><div class="admin-item-art">${escapeHtml(song.icon || '🎵')}</div><div class="admin-item-copy"><strong>${escapeHtml(song.title)}</strong><small>${song.lyrics?.length || 0} partes${playlistNames.length ? ` · ${escapeHtml(playlistNames.join(' · '))}` : ' · sem playlist'}</small><div class="admin-item-tags">${tags.join('')}</div></div></div><div class="admin-card-actions"><a class="primary" href="sincronizar.html?song=remote_${encodeURIComponent(song.id)}">Sincronizar</a><button type="button" data-edit-song="${escapeHtml(song.id)}">Editar</button></div>`;
      item.querySelector('[data-edit-song]').addEventListener('click', () => editSong(song));
      songList.append(item);
    });
  }

  async function renderPlaylists() {
    playlistList.replaceChildren();
    document.getElementById('adminPlaylistListCount').textContent = playlists.length;
    if (!playlists.length) {
      playlistList.innerHTML = '<p class="admin-empty">Nenhuma playlist cadastrada ainda.</p>';
      return;
    }
    for (const playlist of playlists) {
      const item = document.createElement('article');
      item.className = 'admin-playlist-card';
      const cover = await signedCover(playlist.cover_path, fallbackPlaylistCover(playlist));
      const tags = [playlist.is_published ? '<span class="admin-tag">Visível</span>' : '<span class="admin-tag draft">Oculta</span>'];
      if (isFuture(playlist.release_at)) tags.push(`<span class="admin-tag soon">Libera · ${escapeHtml(dateLabel(playlist.release_at))}</span>`);
      item.innerHTML = `<div class="admin-item-main"><div class="admin-item-art"><img src="${escapeHtml(cover)}" alt="" loading="lazy"></div><div class="admin-item-copy"><strong>${escapeHtml(playlist.title)}</strong><small>${Number(playlist.song_count || playlist.song_ids?.length || 0)} música(s)${playlist.subtitle ? ` · ${escapeHtml(playlist.subtitle)}` : ''}</small><div class="admin-item-tags">${tags.join('')}</div></div></div><div class="admin-card-actions"><button type="button" data-edit-playlist="${escapeHtml(playlist.id)}">Editar</button></div>`;
      item.querySelector('[data-edit-playlist]').addEventListener('click', () => editPlaylist(playlist));
      playlistList.append(item);
    }
  }

  function renderProducts() {
    productList.replaceChildren();
    document.getElementById('adminProductListCount').textContent = products.length;
    if (!products.length) {
      productList.innerHTML = '<p class="admin-empty">Nenhum produto recebido da Hubla ainda. Faça um evento de teste ou uma venda para ele aparecer.</p>';
      return;
    }
    products.forEach(product => {
      const item = document.createElement('div');
      item.className = 'admin-product-row';
      const options = songs.map(song => `<option value="${escapeHtml(song.id)}"${(product.song_ids || []).includes(song.id) ? ' selected' : ''}>${escapeHtml(song.icon || '🎵')} ${escapeHtml(song.title)}</option>`).join('');
      const playlistOptions = playlists.map(item => `<option value="${escapeHtml(item.id)}"${item.id === product.playlist_id ? ' selected' : ''}>${escapeHtml(item.title)}</option>`).join('');
      const activeTag = product.is_active === false ? '<span class="admin-tag draft">Desativado</span>' : '<span class="admin-tag">Ativo</span>';
      const typeTag = product.is_order_bump ? '<span class="admin-tag soon">Order bump</span>' : '<span class="admin-tag">Principal</span>';
      item.innerHTML = `<div class="admin-product-heading"><div><strong>${escapeHtml(product.name)}</strong><span class="admin-meta">Hubla: ${escapeHtml(product.hubla_product_id)}</span></div><div class="admin-item-tags">${activeTag}${typeTag}</div></div><div class="admin-product-config"><label class="admin-meta">Playlist<select class="admin-product-playlist" aria-label="Playlist liberada para ${escapeHtml(product.name)}"><option value="">Sem playlist</option>${playlistOptions}</select></label><label class="admin-meta">Valor (R$)<input class="admin-product-price" type="number" min="0" step="0.01" placeholder="29,90" value="${escapeHtml(product.price ?? '')}"></label><label class="admin-meta admin-product-check"><input class="admin-product-order-bump" type="checkbox"${product.is_order_bump ? ' checked' : ''}> Order bump</label><label class="admin-meta admin-product-checkout">Checkout<input class="admin-checkout-input" type="url" placeholder="https://pay.hub.la/..." value="${escapeHtml(product.checkout_url || '')}"></label></div><div class="admin-product-link"><select multiple size="${Math.min(Math.max(songs.length, 2), 6)}" aria-label="Músicas liberadas para ${escapeHtml(product.name)}">${options}</select><button type="button">Salvar configuração</button></div>`;
      const select = item.querySelector('.admin-product-link select');
      const playlistSelect = item.querySelector('.admin-product-playlist');
      const priceInput = item.querySelector('.admin-product-price');
      const orderBumpInput = item.querySelector('.admin-product-order-bump');
      const checkoutInput = item.querySelector('.admin-checkout-input');
      item.querySelector('button').addEventListener('click', async () => {
        const selected = new Set([...select.selectedOptions].map(option => option.value));
        const previous = new Set(product.song_ids || []);
        try {
          const checkout = checkoutInput.value.trim();
          const price = priceInput.value.trim() ? Number(priceInput.value) : null;
          if (price != null && (!Number.isFinite(price) || price < 0)) throw new Error('Informe um valor válido.');
          const accessResult = await client.rpc('admin_update_product_access', {
            p_hubla_product_id: product.hubla_product_id,
            p_playlist_id: playlistSelect.value || null,
            p_is_order_bump: orderBumpInput.checked,
            p_price: price,
            p_checkout_url: checkout || null
          });
          if (accessResult.error) throw accessResult.error;
          const checkoutResult = await client.rpc('admin_update_product_checkout', {p_hubla_product_id: product.hubla_product_id, p_checkout_url: checkout || null});
          if (checkoutResult.error) throw checkoutResult.error;
          for (const id of songs.map(song => song.id)) {
            if (selected.has(id) === previous.has(id)) continue;
            const {error} = await client.rpc('admin_link_product_song', {p_hubla_product_id: product.hubla_product_id, p_song_id: id, p_link: selected.has(id)});
            if (error) throw error;
          }
          product.song_ids = [...selected];
          product.checkout_url = checkout || null;
          product.playlist_id = playlistSelect.value || null;
          product.is_order_bump = orderBumpInput.checked;
          product.price = price;
          setStatus(status, `Configuração de “${product.name}” salva.`);
          await refresh();
        } catch (error) { setStatus(status, error.message || 'Não foi possível salvar os vínculos.', true); }
      });
      productList.append(item);
    });
    renderProductRules();
  }

  function updateCounters() {
    document.getElementById('navSongCount').textContent = songs.length;
    document.getElementById('navPlaylistCount').textContent = playlists.length;
    document.getElementById('navProductCount').textContent = products.length;
  }

  async function refresh() {
    const [songResult, playlistResult, productResult, productRuleResult] = await Promise.all([
      client.rpc('admin_list_songs'),
      client.rpc('admin_list_playlists'),
      client.rpc('admin_list_products'),
      client.rpc('admin_list_product_rules')
    ]);
    if (songResult.error) throw songResult.error;
    if (productResult.error) throw productResult.error;
    songs = songResult.data || [];
    products = productResult.data || [];
    playlists = playlistResult.error ? [] : (playlistResult.data || []);
    productRules = productRuleResult.error && !isMissingRpc(productRuleResult.error) ? [] : (productRuleResult.data || []);
    updateCounters();
    renderSongPlaylistChoices();
    renderPlaylistSongChoices();
    renderProductRulePlaylistChoices(productRuleId.value || '');
    renderSongs();
    await renderPlaylists();
    renderProducts();
    renderProductRules();
    renderDashboard();
    if (playlistResult.error) {
      setStatus(status, 'Músicas carregadas. A migração de playlists ainda precisa ser aplicada no Supabase.', true);
    } else {
      setStatus(status, `${songs.length} música(s) · ${playlists.length} playlist(s) · ${products.length} produto(s)`);
    }
  }

  function openView(view) {
    if (!viewMeta[view]) view = 'dashboard';
    currentView = view;
    document.querySelectorAll('[data-view-panel]').forEach(panel => { panel.hidden = panel.dataset.viewPanel !== view; });
    nav.querySelectorAll('[data-admin-view]').forEach(button => button.classList.toggle('is-active', button.dataset.adminView === view));
    const [eyebrow, title, subtitle] = viewMeta[view];
    document.getElementById('adminPageEyebrow').textContent = eyebrow;
    document.getElementById('adminPageTitle').textContent = title;
    document.getElementById('adminPageSubtitle').textContent = subtitle;
    sidebar.classList.remove('is-open');
    if (mobileNav) mobileNav.setAttribute('aria-expanded', 'false');
  }

  async function showApp(session) {
    if (!session) { loginCard.hidden = false; app.hidden = true; return; }
    loginCard.hidden = true;
    app.hidden = false;
    try {
      const {data: isAdmin, error} = await client.rpc('is_admin');
      if (error || !isAdmin) throw error || new Error('Esta conta não tem autorização administrativa.');
      await refresh();
    } catch (error) {
      setStatus(status, error.message || 'Não foi possível carregar o painel.', true);
      if (/autorização|permission|jwt/i.test(error.message || '')) {
        await client.auth.signOut();
        loginCard.hidden = false;
        app.hidden = true;
      }
    }
  }

  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-admin-view]');
    if (button) openView(button.dataset.adminView);
  });
  mobileNav?.addEventListener('click', () => {
    const open = sidebar.classList.toggle('is-open');
    mobileNav.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-admin-action]');
    if (!action) return;
    const type = action.dataset.adminAction;
    if (type === 'new-song') { openView('songs'); resetSongForm(); songTitle.focus({preventScroll: true}); }
    if (type === 'new-playlist') { openView('playlists'); resetPlaylistForm(); playlistTitle.focus({preventScroll: true}); }
    if (type === 'go-songs') openView('songs');
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;
    if (!email || !loginEmail.validity.valid) return setStatus(loginStatus, 'Informe um e-mail válido.', true);
    if (!password) return setStatus(loginStatus, 'Informe a senha do painel.', true);
    const button = loginForm.querySelector('button');
    button.disabled = true;
    button.querySelector('span').textContent = 'Entrando…';
    try {
      const {data, error} = await client.auth.signInWithPassword({email, password});
      if (error || !data?.session) throw error || new Error('Não foi possível entrar no painel.');
      const {data: isAdmin, error: roleError} = await client.rpc('is_admin');
      if (roleError || !isAdmin) { await client.auth.signOut(); throw new Error('Esta conta não tem autorização administrativa.'); }
      loginPassword.value = '';
      setStatus(loginStatus, 'Acesso autorizado. Carregando o painel…');
      await showApp(data.session);
    } catch (error) { setStatus(loginStatus, error.message || 'E-mail ou senha inválidos.', true); }
    finally { button.disabled = false; button.querySelector('span').textContent = 'Entrar no painel'; }
  });

  logout.addEventListener('click', async () => { await client.auth.signOut(); window.location.replace('admin.html'); });
  clearSong.addEventListener('click', resetSongForm);
  clearPlaylist.addEventListener('click', resetPlaylistForm);
  clearProductRule.addEventListener('click', resetProductRuleForm);

  productRuleForm.addEventListener('submit', async event => {
    event.preventDefault();
    const hublaId = productRuleHublaId.value.trim() || null;
    const nameContains = productRuleName.value.trim() || null;
    if (!hublaId && !nameContains) return setStatus(productRuleStatus, 'Informe o ID ou uma palavra do nome.', true);
    if (!productRulePlaylist.value) return setStatus(productRuleStatus, 'Escolha a playlist liberada.', true);
    const price = productRulePrice.value.trim() ? Number(productRulePrice.value) : null;
    if (price != null && (!Number.isFinite(price) || price < 0)) return setStatus(productRuleStatus, 'Informe um valor válido.', true);
    saveProductRule.disabled = true;
    saveProductRule.textContent = 'Salvando…';
    try {
      const {error} = await client.rpc('admin_upsert_product_rule', {
        p_id: productRuleId.value || null,
        p_hubla_product_id: hublaId,
        p_name_contains: nameContains,
        p_playlist_id: productRulePlaylist.value,
        p_is_order_bump: productRuleOrderBump.checked,
        p_price: price,
        p_checkout_url: productRuleCheckout.value.trim() || null,
        p_is_active: productRuleActive.checked
      });
      if (error) throw error;
      resetProductRuleForm();
      setStatus(productRuleStatus, 'Regra salva. Produtos existentes e próximos eventos serão atualizados automaticamente.');
      await refresh();
    } catch (error) { setStatus(productRuleStatus, error.message || 'Não foi possível salvar a regra.', true); }
    finally { saveProductRule.disabled = false; saveProductRule.textContent = productRuleId.value ? 'Salvar alterações' : 'Salvar regra'; }
  });

  songForm.addEventListener('submit', async event => {
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
      const payload = {p_id: id, p_title: songTitle.value.trim(), p_slug: slugify(songTitle.value), p_subtitle: songSubtitle.value.trim() || null, p_icon: songIcon.value.trim() || '🎵', p_cover_path: songForm.dataset.coverPath || null, p_audio_path: songForm.dataset.audioPath || null, p_duration_seconds: durationForSave, p_lyrics: lyrics, p_is_published: songPublished.checked, p_sort_order: Number(existingSong?.sort_order) || 0};
      const first = await client.rpc('admin_upsert_song', payload);
      if (first.error) throw first.error;
      const saved = recordData(first.data);
      if (!saved?.id) throw new Error('O Supabase não retornou a música criada.');
      const coverPath = songCover.files[0] ? `${saved.id}/cover.${extension(songCover.files[0], 'jpg')}` : (saved.cover_path || null);
      const audioPath = audioFile ? `${saved.id}/audio.${extension(audioFile, 'mp3')}` : (saved.audio_path || null);
      await upload(songCover.files[0], coverPath);
      await upload(audioFile, audioPath);
      if (coverPath !== saved.cover_path || audioPath !== saved.audio_path) {
        const second = await client.rpc('admin_upsert_song', {...payload, p_id: saved.id, p_cover_path: coverPath, p_audio_path: audioPath});
        if (second.error) throw second.error;
      }
      const releaseResult = await client.rpc('admin_update_song_release', {p_song_id: saved.id, p_release_at: toIso(songReleaseAt.value)});
      if (releaseResult.error && !isMissingRpc(releaseResult.error)) throw releaseResult.error;
      const playlistResult = await client.rpc('admin_set_song_playlists', {p_song_id: saved.id, p_playlist_ids: selectedValues(songPlaylistChoices)});
      if (playlistResult.error && !isMissingRpc(playlistResult.error)) throw playlistResult.error;
      songId.value = saved.id;
      songForm.dataset.coverPath = coverPath || '';
      songForm.dataset.audioPath = audioPath || '';
      const featureWarning = releaseResult.error || playlistResult.error;
      setStatus(songStatus, featureWarning
        ? `“${songTitle.value.trim()}” salva. A organização de playlists e o timer ficam disponíveis depois de aplicar a migração do Supabase.`
        : `“${songTitle.value.trim()}” salva. Agora você pode abrir Sincronizar.`);
      await refresh();
    } catch (error) { setStatus(songStatus, error.message || 'Não foi possível salvar a música.', true); }
    finally { saveSong.disabled = false; saveSong.textContent = songId.value ? 'Salvar alterações' : 'Salvar música'; }
  });

  playlistForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!playlistTitle.value.trim()) return setStatus(playlistStatus, 'Informe o nome da playlist.', true);
    savePlaylist.disabled = true;
    savePlaylist.textContent = 'Salvando…';
    try {
      const selectedSongIds = selectedValues(playlistSongChoices);
      const id = playlistId.value || null;
      const existing = id ? playlists.find(item => item.id === id) : null;
      const payload = {p_id: id, p_title: playlistTitle.value.trim(), p_slug: slugify(playlistTitle.value), p_subtitle: playlistSubtitle.value.trim() || null, p_cover_path: playlistForm.dataset.coverPath || null, p_release_at: toIso(playlistReleaseAt.value), p_is_published: playlistPublished.checked, p_sort_order: Number(playlistSortOrder.value) || Number(existing?.sort_order) || 0, p_song_ids: selectedSongIds};
      const first = await client.rpc('admin_upsert_playlist', payload);
      if (first.error) throw first.error;
      const saved = recordData(first.data);
      if (!saved?.id) throw new Error('O Supabase não retornou a playlist criada.');
      const coverPath = playlistCover.files[0] ? `playlists/${saved.id}/cover.${extension(playlistCover.files[0], 'jpg')}` : (saved.cover_path || null);
      await upload(playlistCover.files[0], coverPath);
      if (coverPath !== saved.cover_path) {
        const second = await client.rpc('admin_upsert_playlist', {...payload, p_id: saved.id, p_cover_path: coverPath});
        if (second.error) throw second.error;
      }
      playlistId.value = saved.id;
      playlistForm.dataset.coverPath = coverPath || '';
      setStatus(playlistStatus, `“${playlistTitle.value.trim()}” salva com ${selectedSongIds.length} música(s).`);
      await refresh();
    } catch (error) { setStatus(playlistStatus, error.message || 'Não foi possível salvar a playlist.', true); }
    finally { savePlaylist.disabled = false; savePlaylist.textContent = playlistId.value ? 'Salvar alterações' : 'Salvar playlist'; }
  });

  client.auth.onAuthStateChange((_event, session) => { showApp(session).catch(error => setStatus(status, error.message, true)); });
  client.auth.getSession().then(({data: {session}}) => showApp(session)).catch(error => setStatus(loginStatus, error.message, true));
})();
