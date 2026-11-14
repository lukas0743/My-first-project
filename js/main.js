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
  const CATALOG = {
    'Shampoo': { price: 24.9, meta: '500 ml', bottles: ['shampoo'], href: 'shop.html#shampoo' },
    'Conditioner': { price: 24.9, meta: '500 ml', bottles: ['conditioner'], href: 'shop.html#conditioner' },
    'The Duo': { price: 44.9, meta: '2 × 500 ml', bottles: ['shampoo', 'conditioner'], href: 'shop.html#duo' },
  };
  const euro = (n) => '€' + n.toFixed(2);
  const store = {
    get() {
      try {
        const data = JSON.parse(localStorage.getItem('azula-bag')) || {};
        return Object.fromEntries(Object.entries(data).filter(([name, qty]) => CATALOG[name] && qty > 0));
      } catch { return {}; }
    },
    set(bag) { try { localStorage.setItem('azula-bag', JSON.stringify(bag)); } catch { /* storage unavailable */ } },
  };
  let bag = store.get();
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  const renderCart = () => {
    const count = Object.values(bag).reduce((sum, qty) => sum + qty, 0);
    cartCount.textContent = count;
    cartBtn.setAttribute('aria-label', `Shopping bag, ${count} item${count === 1 ? '' : 's'}`);
    renderBagPage();
  };

  /* Bag page (cart.html) */
  const bagList = $('#bagList');
  function renderBagPage() {
    if (!bagList) return;
    const names = Object.keys(bag);
    $('#bagEmpty').hidden = names.length > 0;
    $('#bagFull').hidden = names.length === 0;
    bagList.innerHTML = names.map((name) => {
      const item = CATALOG[name];
      const thumbs = item.bottles.map((b) => `<svg viewBox="0 0 200 520" aria-hidden="true"><use href="#bottle-${b}"/></svg>`).join('');
      return `<li class="bag__item" data-name="${name}">
        <a class="bag__thumb" href="${item.href}" aria-label="${name}">${thumbs}</a>
        <div>
          <h2 class="bag__name">${name}</h2>
          <p class="bag__meta">${item.meta} · ${euro(item.price)}</p>
          <div class="bag__controls">
            <span class="qty">
              <button type="button" data-step="-1" aria-label="Decrease quantity of ${name}">−</button>
              <span aria-label="Quantity">${bag[name]}</span>
              <button type="button" data-step="1" aria-label="Increase quantity of ${name}">+</button>
            </span>
            <button class="bag__remove" type="button" data-step="remove">Remove</button>
          </div>
        </div>
        <span class="bag__price">${euro(item.price * bag[name])}</span>
      </li>`;
    }).join('');
    const total = names.reduce((sum, name) => sum + CATALOG[name].price * bag[name], 0);
    $('#bagSubtotal').textContent = euro(total);
    $('#bagTotal').textContent = euro(total);
  }
  if (bagList) {
    bagList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-step]');
      if (!btn) return;
      const name = btn.closest('.bag__item').dataset.name;
      if (btn.dataset.step === 'remove') delete bag[name];
      else bag[name] += Number(btn.dataset.step);
      if (bag[name] <= 0) delete bag[name];
      store.set(bag);
      renderCart();
    });
    $('#checkoutBtn').addEventListener('click', () => showToast('Checkout is not connected yet'));
  }
  renderCart();

  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.add;
      bag[name] = (bag[name] || 0) + 1;
      store.set(bag);
      renderCart();
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth; // restart animation
      cartCount.classList.add('bump');
      showToast(`${name} added to your bag`);
    });
  });

  /* ---------- Account (front-end only) ---------- */
  const authForm = $('#authForm');
  if (authForm) authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $('#authMsg').textContent = authForm.checkValidity()
      ? 'Sign-in is not connected yet.'
      : 'Please enter your email and a password of at least 6 characters.';
  });

  /* ---------- Search ---------- */
  const searchForm = $('#searchForm');
  if (searchForm) {
    const INDEX = [
      ['Product', 'Shampoo', 'Strengthen · Nourish · Balance', 'shop.html#shampoo', 'rosemary aloe vera cleanse scalp'],
      ['Product', 'Conditioner', 'Hydrate · Repair · Restore', 'shop.html#conditioner', 'argan oil coconut care shine'],
      ['Product', 'The Duo', 'Shampoo & Conditioner set', 'shop.html#duo', 'set bundle'],
      ['Haircare', 'The AZULA Ritual', 'Cleanse, care, result – in three steps', 'shop.html#ritual', 'routine how to use'],
      ['Ingredient', 'Aloe Vera', 'Soothes & Moisturizes', 'ingredients.html', 'scalp moisture'],
      ['Ingredient', 'Rosemary', 'Stimulates Hair Growth', 'ingredients.html', 'growth root'],
      ['Ingredient', 'Argan Oil', 'Nourishes & Adds Shine', 'ingredients.html', 'dry lengths'],
      ['Ingredient', 'Coconut', 'Strengthens & Repairs', 'ingredients.html', 'repair structure'],
      ['Page', 'Our Philosophy', 'Natural Care. Real Results.', 'philosophy.html', 'about brand vegan silicone free natural'],
      ['Magazine', 'Why healthy hair starts at the scalp', 'Scalp Care · 4 min read', 'magazine.html', ''],
      ['Magazine', 'Rosemary: the oldest secret for stronger hair', 'Ingredients · 5 min read', 'magazine.html', ''],
      ['Magazine', 'The two-step evening ritual for lasting shine', 'Ritual · 3 min read', 'magazine.html', ''],
      ['Magazine', 'Argan oil – liquid gold for dry lengths', 'Ingredients · 4 min read', 'magazine.html', ''],
      ['Magazine', 'Silicones explained: what they do to your hair', 'Scalp Care · 6 min read', 'magazine.html', ''],
      ['Magazine', 'How often should you really wash your hair?', 'Ritual · 4 min read', 'magazine.html', ''],
    ];
    const input = $('#searchInput');
    const results = $('#searchResults');
    const countEl = $('#searchCount');
    const runSearch = () => {
      const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = INDEX.filter((entry) => {
        const text = entry.join(' ').toLowerCase();
        return words.every((w) => text.includes(w));
      });
      countEl.textContent = words.length
        ? `${hits.length} result${hits.length === 1 ? '' : 's'}`
        : 'Suggestions';
      results.replaceChildren(...hits.map(([type, title, desc, href]) => {
        const li = document.createElement('li');
        li.innerHTML = '<a><span class="search__type"></span><span class="search__title"><span></span><span class="search__desc"></span></span><svg aria-hidden="true"><use href="#i-arrow"/></svg></a>';
        li.firstChild.href = href;
        li.querySelector('.search__type').textContent = type;
        li.querySelector('.search__title span').textContent = title;
        li.querySelector('.search__desc').textContent = desc;
        return li;
      }));
    };
    input.value = new URLSearchParams(location.search).get('q') || '';
    input.addEventListener('input', runSearch);
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });
    runSearch();
    input.focus();
  }

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
