// Progressive enhancement only: the site works fully without JavaScript.
document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav-toggle'), nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => { const open = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
});
