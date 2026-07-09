// ===== MaxLife Academy — interactions =====

// Language toggle (EN <-> 中文), persisted across visits
const langToggle = document.getElementById('langToggle');

function setLang(lang) {
  document.body.classList.toggle('lang-zh', lang === 'zh');
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  langToggle.textContent = lang === 'zh' ? 'EN' : '中文';
  localStorage.setItem('maxlife-lang', lang);
}

langToggle.addEventListener('click', () => {
  const isZh = document.body.classList.contains('lang-zh');
  setLang(isZh ? 'en' : 'zh');
});

// Default: saved preference, else browser language
const saved = localStorage.getItem('maxlife-lang');
if (saved) {
  setLang(saved);
} else if (/^zh/i.test(navigator.language)) {
  setLang('zh');
}

// Mobile nav
const burger = document.getElementById('navBurger');
const nav = document.getElementById('mainNav');
burger.addEventListener('click', () => nav.classList.toggle('open'));
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) nav.classList.remove('open');
});

// Scroll-reveal animation (IntersectionObserver + scroll fallback for
// environments where the observer never fires)
const revealEls = new Set(document.querySelectorAll('.reveal'));

function showReveal(el) {
  el.classList.add('visible');
  revealEls.delete(el);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      showReveal(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach((el) => observer.observe(el));

function revealInView() {
  const vh = window.innerHeight;
  revealEls.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh - 40 && r.bottom > 0) showReveal(el);
  });
}
window.addEventListener('scroll', revealInView, { passive: true });
window.addEventListener('load', revealInView);
setTimeout(revealInView, 400);

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
