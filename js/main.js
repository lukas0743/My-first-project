(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: solid on scroll ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', () => setMenu(false));

  /* ---------- Scroll reveal ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Hero parallax (pointer devices only) ---------- */
  const hero = $('.hero');
  if (hero && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const layers = [
      ['.scene__back', 6],
      ['.scene__mid', 10],
      ['.scene__bottles', 16],
      ['.scene__front', 24],
    ].map(([sel, depth]) => [$(sel), depth]);

    let frame = 0;
    hero.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        layers.forEach(([el, depth]) => {
          el.style.transform = `translate(${(-x * depth).toFixed(2)}px, ${(-y * depth * 0.4).toFixed(2)}px)`;
        });
      });
    });
    hero.addEventListener('pointerleave', () => layers.forEach(([el]) => { el.style.transform = ''; }));
  }

  /* ---------- Cart ---------- */
  const cartBtn = $('#cartBtn');
  const cartCount = $('#cartCount');
  const toast = $('#toast');
  const store = {
    get() { try { return parseInt(localStorage.getItem('azula-cart'), 10) || 0; } catch { return 0; } },
    set(n) { try { localStorage.setItem('azula-cart', n); } catch { /* storage unavailable */ } },
  };
  let count = store.get();
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  const renderCart = () => {
    cartCount.textContent = count;
    cartBtn.setAttribute('aria-label', `Shopping bag, ${count} item${count === 1 ? '' : 's'}`);
  };
  renderCart();

  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      count += 1;
      store.set(count);
      renderCart();
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth; // restart animation
      cartCount.classList.add('bump');
      showToast(`${btn.dataset.add} added to your bag`);
    });
  });

  /* ---------- Newsletter (front-end only) ---------- */
  const form = $('#newsletterForm');
  const msg = $('#newsletterMsg');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.elements.email;
    const valid = input.value.trim() !== '' && input.checkValidity();
    msg.classList.toggle('is-error', !valid);
    msg.textContent = valid ? 'Thank you – welcome to the world of AZULA.' : 'Please enter a valid email address.';
    if (valid) form.reset(); else input.focus();
  });

  /* ---------- Magazine filter ---------- */
  const chips = $$('.chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      const filter = chip.dataset.filter;
      $$('#articles .article').forEach((a) => {
        a.hidden = filter !== 'all' && a.dataset.cat !== filter;
        a.classList.add('is-in');
      });
    });
  });

  $('#year').textContent = new Date().getFullYear();
})();
