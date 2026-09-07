// Appearance is intentionally kept in memory: reloading restores the original.
(() => {
  const panel = document.getElementById('appearanceSettings');
  const trigger = document.getElementById('openSettings');
  const promo = document.getElementById('promoHeader');
  const title = document.getElementById('songOnlyHeader');
  const themes = new Set(['original','usa-claro','usa-blur','aurora','oceano','floresta','ambar']);
  document.documentElement.dataset.theme = 'original';
  document.getElementById('showPromo').checked = true;
  promo.hidden = false;
  title.hidden = true;
  document.querySelectorAll('input[name="karaokeTheme"]').forEach(input => { input.checked = input.value === 'original'; });
  trigger.addEventListener('click', () => panel.showModal());
  for (const id of ['closeSettings','doneSettings']) {
    document.getElementById(id).addEventListener('click', () => panel.close());
  }
  panel.addEventListener('close', () => trigger.focus());
  panel.addEventListener('click', event => {
    const bounds = panel.getBoundingClientRect();
    if (event.target === panel && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) panel.close();
  });
  document.querySelectorAll('input[name="karaokeTheme"]').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked && themes.has(input.value)) document.documentElement.dataset.theme = input.value;
    });
  });
  document.getElementById('showPromo').addEventListener('change', event => {
    promo.hidden = !event.target.checked;
    title.hidden = event.target.checked;
  });
  window.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.code === 'KeyC') {
      event.preventDefault();
      if (panel.open) panel.close(); else panel.showModal();
    }
  });
})();
