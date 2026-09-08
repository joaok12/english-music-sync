// Preferências da tela de cantar. Elas ficam no navegador e se aplicam a todas as músicas.
(() => {
  const panel = document.getElementById('appearanceSettings');
  const trigger = document.getElementById('openSettings');
  const promo = document.getElementById('promoHeader');
  const title = document.getElementById('songOnlyHeader');
  const adminPricing = document.getElementById('adminPricingSettings');
  const showPromo = document.getElementById('showPromo');
  const headerTitleIconWrap = document.getElementById('headerTitleIconWrap');
  const headerMainTitle = document.querySelector('.header-main-title');
  const headerSubtitle = document.getElementById('headerSubtitle');
  const headerTitleIcon = document.getElementById('headerTitleIcon');
  const headerTitleText = document.getElementById('headerTitleText');
  const headerSubtitleText = document.getElementById('headerSubtitleText');
  const adminCreative = document.getElementById('adminCreativeSettings');
  const glowSize = document.getElementById('glowSize');
  const glowSizeValue = document.getElementById('glowSizeValue');
  const backgroundBlur = document.getElementById('backgroundBlur');
  const backgroundBlurValue = document.getElementById('backgroundBlurValue');
  const backgroundColor = document.getElementById('backgroundColor');
  const backgroundColorValue = document.getElementById('backgroundColorValue');
  const backgroundHeight = document.getElementById('backgroundHeight');
  const backgroundHeightValue = document.getElementById('backgroundHeightValue');
  const backgroundExtent = document.getElementById('backgroundExtent');
  const backgroundExtentValue = document.getElementById('backgroundExtentValue');
  const topScale = document.getElementById('topScale');
  const topScaleValue = document.getElementById('topScaleValue');
  const headerOffset = document.getElementById('headerOffset');
  const headerOffsetValue = document.getElementById('headerOffsetValue');
  const resetCreativeSettings = document.getElementById('resetCreativeSettings');
  const creativeSaveStatus = document.getElementById('creativeSaveStatus');
  const themes = new Set(['original', 'usa-claro', 'usa-blur', 'aurora', 'oceano', 'floresta', 'ambar']);
  const themeKey = 'KARAOKE_APPEARANCE_THEME';
  const promoKey = 'KARAOKE_SHOW_PROMO';
  const headerCopyKey = 'KARAOKE_ADMIN_HEADER_COPY';
  const creativeKey = 'KARAOKE_ADMIN_CREATIVE_CONTROLS';
  const headerCopyDefaults = Object.freeze({icon: '🇺🇸', title: 'Aprenda Inglês Cantando', subtitle: ''});
  const creativeDefaults = Object.freeze({glowSize: 20, backgroundBlur: 32, backgroundColor: '#060812', backgroundHeight: 130, backgroundExtent: 74, topScale: 100, headerOffset: 0});
  const defaultHeaderIconMarkup = headerTitleIconWrap?.innerHTML || '';
  let isAdmin = false;
  let creativeSaveTimer = null;

  function readPreference(key, fallback = '') {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }

  function savePreference(key, value) {
    try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
  }

  function normaliseHeaderCopy(value = {}) {
    return {
      icon: String(value.icon ?? headerCopyDefaults.icon).trim().slice(0, 8) || headerCopyDefaults.icon,
      title: String(value.title ?? headerCopyDefaults.title).trim().slice(0, 100) || headerCopyDefaults.title,
      subtitle: String(value.subtitle ?? headerCopyDefaults.subtitle).trim().slice(0, 180)
    };
  }

  function readHeaderCopy() {
    try {
      const saved = JSON.parse(localStorage.getItem(headerCopyKey) || '{}');
      return normaliseHeaderCopy({...headerCopyDefaults, ...saved});
    } catch {
      return normaliseHeaderCopy(headerCopyDefaults);
    }
  }

  function updateHeaderCopyControls(values) {
    const copy = normaliseHeaderCopy(values);
    headerTitleIcon.value = copy.icon;
    headerTitleText.value = copy.title;
    headerSubtitleText.value = copy.subtitle;
    return copy;
  }

  function applyHeaderCopy(values) {
    const copy = updateHeaderCopyControls(values);
    headerMainTitle.textContent = copy.title;
    headerSubtitle.textContent = copy.subtitle;
    headerSubtitle.hidden = !copy.subtitle;
    if (copy.icon === headerCopyDefaults.icon) {
      headerTitleIconWrap.innerHTML = defaultHeaderIconMarkup;
      headerTitleIconWrap.classList.remove('custom-title-icon');
    } else {
      headerTitleIconWrap.textContent = copy.icon;
      headerTitleIconWrap.classList.add('custom-title-icon');
    }
    return copy;
  }

  function saveHeaderCopy(values) {
    const copy = applyHeaderCopy(values);
    savePreference(headerCopyKey, JSON.stringify(copy));
    creativeSaveStatus.textContent = 'Salvo neste dispositivo';
    clearTimeout(creativeSaveTimer);
    creativeSaveTimer = setTimeout(() => { creativeSaveStatus.textContent = ''; }, 1800);
  }

  function clearHeaderCopy() {
    applyHeaderCopy(headerCopyDefaults);
  }

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }

  function normaliseHexColor(value, fallback) {
    const raw = String(value ?? '').trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(raw)) return raw;
    if (/^#[0-9a-f]{3}$/.test(raw)) return `#${raw.slice(1).split('').map(char => char + char).join('')}`;
    return fallback;
  }

  function hexToRgb(value) {
    const hex = normaliseHexColor(value, creativeDefaults.backgroundColor).slice(1);
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)].join(', ');
  }

  function normaliseCreativeSettings(value = {}) {
    return {
      glowSize: clamp(value.glowSize, 0, 60, creativeDefaults.glowSize),
      backgroundBlur: clamp(value.backgroundBlur, 0, 60, creativeDefaults.backgroundBlur),
      backgroundColor: normaliseHexColor(value.backgroundColor, creativeDefaults.backgroundColor),
      backgroundHeight: clamp(value.backgroundHeight, 40, 260, creativeDefaults.backgroundHeight),
      backgroundExtent: clamp(value.backgroundExtent, 45, 160, creativeDefaults.backgroundExtent),
      topScale: clamp(value.topScale, 70, 150, creativeDefaults.topScale),
      headerOffset: clamp(value.headerOffset, -24, 96, creativeDefaults.headerOffset)
    };
  }

  function readCreativeSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(creativeKey) || '{}');
      return normaliseCreativeSettings({...creativeDefaults, ...saved});
    } catch {
      return normaliseCreativeSettings(creativeDefaults);
    }
  }

  function formatPixels(value, signed = false) {
    const rounded = Math.round(value);
    return `${signed && rounded > 0 ? '+' : ''}${rounded}px`;
  }

  function updateCreativeControls(values) {
    const settings = normaliseCreativeSettings(values);
    glowSize.value = String(settings.glowSize);
    backgroundBlur.value = String(settings.backgroundBlur);
    backgroundColor.value = settings.backgroundColor;
    backgroundHeight.value = String(settings.backgroundHeight);
    backgroundExtent.value = String(settings.backgroundExtent);
    topScale.value = String(settings.topScale);
    headerOffset.value = String(settings.headerOffset);
    glowSizeValue.textContent = formatPixels(settings.glowSize);
    backgroundBlurValue.textContent = formatPixels(settings.backgroundBlur);
    backgroundColorValue.textContent = settings.backgroundColor.toUpperCase();
    backgroundHeightValue.textContent = formatPixels(settings.backgroundHeight);
    backgroundExtentValue.textContent = `${Math.round(settings.backgroundExtent)}%`;
    topScaleValue.textContent = `${Math.round(settings.topScale)}%`;
    headerOffsetValue.textContent = formatPixels(settings.headerOffset, true);
    return settings;
  }

  function applyCreativeSettings(values) {
    const settings = updateCreativeControls(values);
    const root = document.documentElement;
    root.style.setProperty('--karaoke-glow-size', formatPixels(settings.glowSize));
    root.style.setProperty('--karaoke-pointer-glow-size', formatPixels(Math.max(3, Math.round(settings.glowSize / 3))));
    root.style.setProperty('--karaoke-bg-blur', formatPixels(settings.backgroundBlur));
    root.style.setProperty('--karaoke-bg-rgb', hexToRgb(settings.backgroundColor));
    root.style.setProperty('--karaoke-bg-height', formatPixels(settings.backgroundHeight));
    root.style.setProperty('--karaoke-bg-extent', `${settings.backgroundExtent}%`);
    root.style.setProperty('--karaoke-top-scale', String(settings.topScale / 100));
    root.style.setProperty('--karaoke-header-offset', formatPixels(settings.headerOffset, true));
    return settings;
  }

  function saveCreativeSettings(values) {
    const settings = applyCreativeSettings(values);
    savePreference(creativeKey, JSON.stringify(settings));
    creativeSaveStatus.textContent = 'Salvo neste dispositivo';
    clearTimeout(creativeSaveTimer);
    creativeSaveTimer = setTimeout(() => { creativeSaveStatus.textContent = ''; }, 1800);
  }

  function clearCreativeSettings() {
    const root = document.documentElement;
    root.style.removeProperty('--karaoke-glow-size');
    root.style.removeProperty('--karaoke-pointer-glow-size');
    root.style.removeProperty('--karaoke-bg-blur');
    root.style.removeProperty('--karaoke-bg-rgb');
    root.style.removeProperty('--karaoke-bg-height');
    root.style.removeProperty('--karaoke-bg-extent');
    root.style.removeProperty('--karaoke-top-scale');
    root.style.removeProperty('--karaoke-header-offset');
    updateCreativeControls(creativeDefaults);
    creativeSaveStatus.textContent = '';
  }

  function setTheme(value) {
    const theme = themes.has(value) ? value : 'original';
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('input[name="karaokeTheme"]').forEach(input => {
      input.checked = input.value === theme;
    });
  }

  function setPromoVisible(visible) {
    const shouldShow = Boolean(visible && isAdmin);
    promo.hidden = !shouldShow;
    title.hidden = shouldShow;
    showPromo.checked = shouldShow;
  }

  function isDesktopAdmin() {
    return isAdmin && window.matchMedia('(min-width: 900px)').matches;
  }

  function toggleSettingsPanel() {
    if (panel.open) {
      panel.close();
      return;
    }
    if (isDesktopAdmin()) panel.show();
    else panel.showModal();
  }

  async function resolveAdmin() {
    const config = window.SUPABASE_CONFIG || {};
    if (!config.url || !config.anonKey || config.anonKey.startsWith('COLE_AQUI') || !window.supabase?.createClient) return false;
    try {
      const client = window.supabase.createClient(config.url, config.anonKey);
      const {data: {session}} = await client.auth.getSession();
      if (!session) return false;
      const {data, error} = await client.rpc('is_admin');
      return !error && data === true;
    } catch {
      return false;
    }
  }

  setTheme(readPreference(themeKey, 'original'));
  // Usuários comuns sempre começam com o cabeçalho limpo: título + voltar.
  setPromoVisible(false);
  adminPricing.hidden = true;
  adminCreative.hidden = true;
  document.documentElement.classList.remove('is-karaoke-admin');
  clearHeaderCopy();

  trigger.addEventListener('click', toggleSettingsPanel);
  document.getElementById('closeSettings').addEventListener('click', () => panel.close());
  panel.addEventListener('close', () => trigger.focus());
  panel.addEventListener('click', event => {
    const bounds = panel.getBoundingClientRect();
    if (event.target === panel && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) panel.close();
  });

  document.querySelectorAll('input[name="karaokeTheme"]').forEach(input => {
    input.addEventListener('change', () => {
      if (!input.checked || !themes.has(input.value)) return;
      setTheme(input.value);
      savePreference(themeKey, input.value);
    });
  });

  showPromo.addEventListener('change', event => {
    if (!isAdmin) {
      setPromoVisible(false);
      return;
    }
    savePreference(promoKey, String(event.target.checked));
    setPromoVisible(event.target.checked);
  });

  [glowSize, backgroundBlur, backgroundColor, backgroundHeight, backgroundExtent, topScale, headerOffset].forEach(input => {
    input.addEventListener('input', () => {
      if (!isAdmin) return;
      saveCreativeSettings({
        glowSize: glowSize.value,
        backgroundBlur: backgroundBlur.value,
        backgroundColor: backgroundColor.value,
        backgroundHeight: backgroundHeight.value,
        backgroundExtent: backgroundExtent.value,
        topScale: topScale.value,
        headerOffset: headerOffset.value
      });
    });
  });

  [headerTitleIcon, headerTitleText, headerSubtitleText].forEach(input => {
    input.addEventListener('input', () => {
      if (!isAdmin) return;
      saveHeaderCopy({
        icon: headerTitleIcon.value,
        title: headerTitleText.value,
        subtitle: headerSubtitleText.value
      });
    });
  });

  resetCreativeSettings.addEventListener('click', () => {
    if (!isAdmin) return;
    saveCreativeSettings(creativeDefaults);
  });

  resolveAdmin().then(admin => {
    isAdmin = admin;
    document.documentElement.classList.toggle('is-karaoke-admin', admin);
    adminPricing.hidden = !admin;
    adminCreative.hidden = !admin;
    if (admin) {
      applyHeaderCopy(readHeaderCopy());
      applyCreativeSettings(readCreativeSettings());
      setPromoVisible(readPreference(promoKey, 'false') === 'true');
      if (isDesktopAdmin() && !panel.open) panel.show();
    } else {
      clearHeaderCopy();
      clearCreativeSettings();
      setPromoVisible(false);
    }
  });

  window.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.code === 'KeyC') {
      event.preventDefault();
      toggleSettingsPanel();
    }
  });
})();
