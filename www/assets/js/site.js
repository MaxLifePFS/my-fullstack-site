/* MaxLife Academy — maxlife.cc
   Language toggle, mobile nav, scroll reveal. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'maxlife-lang';

  // ---- language ----
  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'zh' ? 'zh-Hans' : 'en');
    document.querySelectorAll('[data-lang-toggle]').forEach(function (b) {
      b.textContent = lang === 'zh' ? 'EN' : '中文';
      b.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
    });
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  apply(saved || (/^zh\b/i.test(navigator.language || '') ? 'zh' : 'en'));

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-lang-toggle]');
    if (!btn) return;
    var next = root.getAttribute('data-lang') === 'zh' ? 'en' : 'zh';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (err) {}
  });

  // ---- mobile nav ----
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- mark current nav item ----
  var here = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav a[href]').forEach(function (a) {
    var target = new URL(a.getAttribute('href'), location.href).pathname
      .replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    if (target === here) a.setAttribute('aria-current', 'page');
  });

  // ---- scroll reveal ----
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
  items.forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(el);
  });
})();
