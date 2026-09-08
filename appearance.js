// Preferências da tela de cantar. Elas ficam no navegador e se aplicam a todas as músicas.
(() => {
  const panel = document.getElementById('appearanceSettings');
  const trigger = document.getElementById('openSettings');
  const promo = document.getElementById('promoHeader');
  const title = document.getElementById('songOnlyHeader');
  const adminPricing = document.getElementById('adminPricingSettings');
  const showPromo = document.getElementById('showPromo');
  const adminCreative = document.getElementById('adminCreativeSettings');
  const glowSize = document.getElementById('glowSize');
  const glowSizeValue = document.getElementById('glowSizeValue');
  const backgroundBlur = document.getElementById('backgroundBlur');
  const backgroundBlurValue = document.getElementById('backgroundBlurValue');
  const backgroundHeight = document.getElementById('backgroundHeight');
  const backgroundHeightValue = document.getElementById('backgroundHeightValue');
  const headerOffset = document.getElementById('headerOffset');
  const headerOffsetValue = document.getElementById('headerOffsetValue');
  const resetCreativeSettings = document.getElementById('resetCreativeSettings');
  const creativeSaveStatus = document.getElementById('creativeSaveStatus');
  const themes = new Set(['original', 'usa-claro', 'usa-blur', 'aurora', 'oceano', 'floresta', 'ambar']);
  const themeKey = 'KARAOKE_APPEARANCE_THEME';
  const promoKey = 'KARAOKE_SHOW_PROMO';
  const creativeKey = 'KARAOKE_ADMIN_CREATIVE_CONTROLS';
  const creativeDefaults = Object.freeze({glowSize: 20, backgroundBlur: 32, backgroundHeight: 130, headerOffset: 0});
  let isAdmin = false;
  let creativeSaveTimer = null;

  function readPreference(key, fallback = '') {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }

  function savePreference(key, value) {
    try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
  }

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }

  function normaliseCreativeSettings(value = {}) {
    return {
      glowSize: clamp(value.glowSize, 0, 60, creativeDefaults.glowSize),
      backgroundBlur: clamp(value.backgroundBlur, 0, 60, creativeDefaults.backgroundBlur),
      backgroundHeight: clamp(value.backgroundHeight, 40, 260, creativeDefaults.backgroundHeight),
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
    backgroundHeight.value = String(settings.backgroundHeight);
    headerOffset.value = String(settings.headerOffset);
    glowSizeValue.textContent = formatPixels(settings.glowSize);
    backgroundBlurValue.textContent = formatPixels(settings.backgroundBlur);
    backgroundHeightValue.textContent = formatPixels(settings.backgroundHeight);
    headerOffsetValue.textContent = formatPixels(settings.headerOffset, true);
    return settings;
  }

  function applyCreativeSettings(values) {
    const settings = updateCreativeControls(values);
    const root = document.documentElement;
    root.style.setProperty('--karaoke-glow-size', formatPixels(settings.glowSize));
    root.style.setProperty('--karaoke-pointer-glow-size', formatPixels(Math.max(3, Math.round(settings.glowSize / 3))));
    root.style.setProperty('--karaoke-bg-blur', formatPixels(settings.backgroundBlur));
    root.style.setProperty('--karaoke-bg-height', formatPixels(settings.backgroundHeight));
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
    root.style.removeProperty('--karaoke-bg-height');
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

  trigger.addEventListener('click', () => panel.showModal());
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

  [glowSize, backgroundBlur, backgroundHeight, headerOffset].forEach(input => {
    input.addEventListener('input', () => {
      if (!isAdmin) return;
      saveCreativeSettings({
        glowSize: glowSize.value,
        backgroundBlur: backgroundBlur.value,
        backgroundHeight: backgroundHeight.value,
        headerOffset: headerOffset.value
      });
    });
  });

  resetCreativeSettings.addEventListener('click', () => {
    if (!isAdmin) return;
    saveCreativeSettings(creativeDefaults);
  });

  resolveAdmin().then(admin => {
    isAdmin = admin;
    adminPricing.hidden = !admin;
    adminCreative.hidden = !admin;
    if (admin) {
      applyCreativeSettings(readCreativeSettings());
      setPromoVisible(readPreference(promoKey, 'false') === 'true');
    } else {
      clearCreativeSettings();
      setPromoVisible(false);
    }
  });

  window.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.code === 'KeyC') {
      event.preventDefault();
      if (panel.open) panel.close(); else panel.showModal();
    }
  });
})();
