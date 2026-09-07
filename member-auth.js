(() => {
  const form = document.getElementById('memberLoginForm');
  const emailInput = document.getElementById('memberEmail');
  const cpfInput = document.getElementById('memberCpf');
  const status = document.getElementById('loginStatus');
  const button = form.querySelector('button');
  const config = window.SUPABASE_CONFIG || {};

  cpfInput.addEventListener('input', () => {
    const digits = cpfInput.value.replace(/\D/g, '').slice(0, 11);
    cpfInput.value = digits.length > 9
      ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
      : digits.length > 6
        ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
        : digits.length > 3 ? `${digits.slice(0, 3)}.${digits.slice(3)}` : digits;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.className = 'member-status';
    status.textContent = '';
    const email = emailInput.value.trim().toLowerCase();
    const cpf = cpfInput.value.replace(/\D/g, '');
    if (!email || cpf.length !== 11) {
      status.className = 'member-status error';
      status.textContent = 'Informe um e-mail e um CPF válidos.';
      return;
    }
    if (!config.functionsBase) {
      status.className = 'member-status error';
      status.textContent = 'A integração ainda não foi configurada.';
      return;
    }
    button.disabled = true;
    button.textContent = 'Conferindo acesso…';
    try {
      const response = await fetch(`${config.functionsBase}/member-login`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, cpf})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.action_link) throw new Error(data.error || 'Não foi possível confirmar o acesso.');
      status.textContent = 'Acesso confirmado. Abrindo sua biblioteca…';
      window.location.assign(data.action_link);
    } catch (error) {
      status.className = 'member-status error';
      status.textContent = error.message || 'Não foi possível entrar agora.';
      button.disabled = false;
      button.textContent = 'Entrar na minha biblioteca';
    }
  });
})();
