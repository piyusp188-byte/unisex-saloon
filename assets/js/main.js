/**
 * Amarr Salon — main.js
 * Handles: nav scroll, mobile drawer, hero video, IntersectionObserver
 * scroll-reveal, FAQ accordion, cookie banner, back-to-top.
 */

'use strict';

/* ── Utility ─────────────────────────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── On DOM Ready ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initNav();
  initHeroVideo();
  initScrollReveal();
  initFAQ();
  initCookieBanner();
  initNavHighlight();
});

/* ────────────────────────────────────────────────────────────────────────────
   PAGE LOADER
   ──────────────────────────────────────────────────────────────────────────── */
function initPageLoader() {
  const loader = qs('.page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('loaded'), 400);
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   HEADER: scroll-based glass + mobile drawer
   ──────────────────────────────────────────────────────────────────────────── */
function initNav() {
  const header  = qs('.site-header');
  const toggle  = qs('.mobile-nav-toggle');
  const navMenu = qs('.nav-links');
  if (!header) return;

  // Scroll-based glass effect
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!toggle || !navMenu) return;

  // Mobile drawer
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    navMenu.classList.toggle('open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  });

  // Close on nav-link click
  qsa('.nav-link', navMenu).forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !toggle.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   ACTIVE NAV LINK — highlight link matching current section in view
   ──────────────────────────────────────────────────────────────────────────── */
function initNavHighlight() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = navLinks.find(l => l.getAttribute('href') === `#${entry.target.id}`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));
}

/* ────────────────────────────────────────────────────────────────────────────
   HERO VIDEO — robust playback + pause/play control + IntersectionObserver
   ──────────────────────────────────────────────────────────────────────────── */
function initHeroVideo() {
  const video     = qs('.hero-video-bg');
  const pauseBtn  = qs('#hero-video-toggle');

  if (!video) return;

  // Respect prefers-reduced-motion and data-saver
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  if (prefersReducedMotion || saveData) {
    video.style.display = 'none'; // Show poster only
    return;
  }

  // Attempt autoplay; recover silently on NotAllowedError
  video.play().catch(() => {
    /* Autoplay blocked — poster stays visible; user can tap play */
  });

  // Pause/Play toggle button
  if (pauseBtn) {
    const iconPlay  = pauseBtn.querySelector('.icon-play');
    const iconPause = pauseBtn.querySelector('.icon-pause');

    const updateBtn = () => {
      const paused = video.paused;
      pauseBtn.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
      if (iconPlay)  iconPlay.style.display  = paused ? '' : 'none';
      if (iconPause) iconPause.style.display = paused ? 'none' : '';
    };

    pauseBtn.addEventListener('click', () => {
      video.paused ? video.play() : video.pause();
      updateBtn();
    });

    video.addEventListener('play',  updateBtn);
    video.addEventListener('pause', updateBtn);
    updateBtn();
  }

  // Pause when hero is off-screen (save CPU/battery)
  const heroSection = qs('.hero-section');
  if (heroSection && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, { threshold: 0.1 });
    obs.observe(heroSection);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver
   ──────────────────────────────────────────────────────────────────────────── */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: just show everything
    qsa('.reveal, .reveal-left, .reveal-right').forEach(el => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  qsa('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));
}

/* ────────────────────────────────────────────────────────────────────────────
   FAQ ACCORDION
   ──────────────────────────────────────────────────────────────────────────── */
function initFAQ() {
  const items = qsa('.faq-item');
  items.forEach(item => {
    const btn    = qs('.faq-question', item);
    const answer = qs('.faq-answer',   item);
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      items.forEach(other => {
        other.classList.remove('open');
        const otherBtn = qs('.faq-question', other);
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   COOKIE CONSENT BANNER
   ──────────────────────────────────────────────────────────────────────────── */
function initCookieBanner() {
  const banner   = qs('.cookie-banner');
  const acceptBtn = qs('#cookie-accept');
  const declineBtn = qs('#cookie-decline');
  if (!banner) return;

  const COOKIE_KEY = 'amarr_cookie_consent';
  if (localStorage.getItem(COOKIE_KEY)) return;

  setTimeout(() => banner.classList.add('visible'), 1800);

  const dismiss = (accepted) => {
    localStorage.setItem(COOKIE_KEY, accepted ? 'accepted' : 'declined');
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 600);
  };

  if (acceptBtn)  acceptBtn.addEventListener('click',  () => dismiss(true));
  if (declineBtn) declineBtn.addEventListener('click', () => dismiss(false));
}
