const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#site-nav');
menuButton.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', open); });
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); }));

const form = document.querySelector('#contact-form');
if (form) {
  const status = document.querySelector('#form-status');
  let turnstileToken = '';
  let turnstileLoaded = false;

  async function initializeTurnstile() {
    const config = await fetch('/api/site-config').then((response) => response.json());
    if (!config.turnstileSiteKey) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true;
    script.onload = () => { window.turnstile.render('#turnstile', { sitekey: config.turnstileSiteKey, callback: (token) => { turnstileToken = token; } }); turnstileLoaded = true; };
    document.head.append(script);
  }
  initializeTurnstile().catch(() => {});

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); status.className = 'form-status';
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Sending…'; status.textContent = '';
    const formData = new FormData(form);
    formData.append('turnstileToken', turnstileToken);
    
    const imageFiles = formData.getAll('images').filter(file => file.size > 0);
    if (imageFiles.length > 3) {
      status.textContent = 'Please select a maximum of 3 images.'; status.classList.add('error');
      button.disabled = false; button.textContent = 'Send estimate request';
      return;
    }

    try {
      const response = await fetch('/api/contact', { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Please try again or call us.');
      form.reset(); turnstileToken = '';
      if (turnstileLoaded && window.turnstile) window.turnstile.reset();
      document.getElementById('success-modal').showModal();
    } catch (error) { status.textContent = error.message; status.classList.add('error'); }
    button.disabled = false; button.textContent = 'Send estimate request';
  });
}
