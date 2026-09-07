// Preferências da tela de cantar. Elas ficam no navegador e se aplicam a todas as músicas.
(() => {
  const panel = document.getElementById('appearanceSettings');
  const trigger = document.getElementById('openSettings');
  const promo = document.getElementById('promoHeader');
  const title = document.getElementById('songOnlyHeader');
  const adminPricing = document.getElementById('adminPricingSettings');
  const showPromo = document.getElementById('showPromo');
  const themes = new Set(['original', 'usa-claro', 'usa-blur', 'aurora', 'oceano', 'floresta', 'ambar']);
  const themeKey = 'KARAOKE_APPEARANCE_THEME';
  const promoKey = 'KARAOKE_SHOW_PROMO';
  let isAdmin = false;

  function readPreference(key, fallback = '') {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }

  function savePreference(key, value) {
    try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
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

  resolveAdmin().then(admin => {
    isAdmin = admin;
    adminPricing.hidden = !admin;
    if (admin) {
      setPromoVisible(readPreference(promoKey, 'false') === 'true');
    } else {
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
