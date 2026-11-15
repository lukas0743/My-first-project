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
      ['.hero__glow', 8],
      ['.hero__shots', 14],
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
    'Shampoo': { price: 24.9, meta: '500 ml', bottles: ['shampoo'], href: 'shampoo.html' },
    'Conditioner': { price: 24.9, meta: '500 ml', bottles: ['conditioner'], href: 'conditioner.html' },
    'The Duo': { price: 44.9, meta: '2 × 500 ml', bottles: ['shampoo', 'conditioner'], href: 'duo.html' },
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

  /* ---------- Overlays (bag drawer + search bar) ---------- */
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  document.body.append(backdrop);
  let openPanel = null;
  let lastFocus = null;
  const closeOverlay = () => {
    if (!openPanel) return;
    openPanel.classList.remove('is-open');
    openPanel.inert = true;
    backdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
    openPanel = null;
    if (lastFocus) lastFocus.focus();
  };
  const openOverlay = (panel, focusEl) => {
    if (openPanel === panel) return;
    const opener = openPanel ? lastFocus : document.activeElement;
    closeOverlay();
    setMenu(false);
    lastFocus = opener;
    openPanel = panel;
    panel.inert = false;
    panel.classList.add('is-open');
    backdrop.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    // wait until the panel is visible, otherwise the browser refuses to focus it
    setTimeout(() => { if (openPanel === panel) focusEl.focus({ preventScroll: true }); }, 80);
  };
  backdrop.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });

  /* ---------- Bag rendering (drawer + cart.html) ---------- */
  const drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.id = 'bagDrawer';
  drawer.inert = true;
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Shopping bag');
  drawer.innerHTML = `
    <header class="drawer__head">
      <h2 class="drawer__title">Your Bag <span id="drawerCount"></span></h2>
      <button class="drawer__close" type="button" data-close aria-label="Close bag"><svg aria-hidden="true"><use href="#i-plus"/></svg></button>
    </header>
    <div class="drawer__body">
      <div class="drawer__empty" id="drawerEmpty">
        <p>Your bag is still empty.</p>
        <a class="btn btn--bronze btn--sm" href="shop.html">Shop the Collection</a>
      </div>
      <ul class="bag__list bag__list--compact" id="drawerList" aria-label="Items in your bag"></ul>
    </div>
    <footer class="drawer__foot" id="drawerFoot">
      <p class="drawer__total"><span>Subtotal</span><strong id="drawerTotal"></strong></p>
      <p class="drawer__note">Shipping is calculated at checkout.</p>
      <button class="btn btn--bronze" type="button" data-checkout>Checkout</button>
      <a class="link-arrow" href="cart.html">View full bag <svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
    </footer>`;
  document.body.append(drawer);

  const bagList = $('#bagList');
  const itemsHTML = () => Object.keys(bag).map((name) => {
    const item = CATALOG[name];
    const thumbs = item.bottles.map((b) => `<img src="assets/${b}.jpg" alt="" width="1122" height="1402">`).join('');
    return `<li class="bag__item" data-name="${name}">
        <a class="bag__thumb" href="${item.href}" aria-label="${name}">${thumbs}</a>
        <div>
          <h3 class="bag__name">${name}</h3>
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

  const renderCart = () => {
    const names = Object.keys(bag);
    const count = names.reduce((sum, name) => sum + bag[name], 0);
    const total = names.reduce((sum, name) => sum + CATALOG[name].price * bag[name], 0);
    const html = itemsHTML();

    cartCount.textContent = count;
    cartBtn.setAttribute('aria-label', `Shopping bag, ${count} item${count === 1 ? '' : 's'}`);

    $('#drawerCount').textContent = count ? `(${count})` : '';
    $('#drawerList').innerHTML = html;
    $('#drawerEmpty').hidden = names.length > 0;
    $('#drawerFoot').hidden = names.length === 0;
    $('#drawerTotal').textContent = euro(total);

    if (bagList) {
      bagList.innerHTML = html;
      $('#bagEmpty').hidden = names.length > 0;
      $('#bagFull').hidden = names.length === 0;
      $('#bagSubtotal').textContent = euro(total);
      $('#bagTotal').textContent = euro(total);
    }
  };

  const onBagClick = (e) => {
    if (e.target.closest('[data-close]')) return closeOverlay();
    if (e.target.closest('[data-checkout]')) return showToast('Checkout is not connected yet');
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    const row = btn.closest('.bag__item');
    const name = row.dataset.name;
    const list = row.parentElement;
    if (btn.dataset.step === 'remove') delete bag[name];
    else bag[name] += Number(btn.dataset.step);
    if (bag[name] <= 0) delete bag[name];
    store.set(bag);
    renderCart();
    // lists are re-rendered: keep keyboard focus on the same control
    const again = list.querySelector(`[data-name="${name}"] [data-step="${btn.dataset.step}"]`);
    if (again) again.focus();
    else if (list.id === 'drawerList') $('.drawer__close').focus();
  };
  drawer.addEventListener('click', onBagClick);
  if (bagList) {
    bagList.addEventListener('click', onBagClick);
    $('#checkoutBtn').addEventListener('click', () => showToast('Checkout is not connected yet'));
  }
  renderCart();

  const openBag = () => openOverlay(drawer, $('.drawer__close'));
  // on cart.html the icon simply stays a link to the page you are on
  if (!bagList) cartBtn.addEventListener('click', (e) => { e.preventDefault(); openBag(); });

  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.add;
      const qtyEl = 'useQty' in btn.dataset ? $('#pdpQty') : null;
      const qty = qtyEl ? Number(qtyEl.textContent) : 1;
      bag[name] = (bag[name] || 0) + qty;
      store.set(bag);
      renderCart();
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth; // restart animation
      cartCount.classList.add('bump');
      if (bagList) showToast(`${qty > 1 ? qty + ' × ' : ''}${name} added to your bag`);
      else openBag();
    });
  });

  /* ---------- Product page quantity ---------- */
  const pdpQty = $('#pdpQty');
  if (pdpQty) $$('[data-qty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pdpQty.textContent = Math.min(10, Math.max(1, Number(pdpQty.textContent) + Number(btn.dataset.qty)));
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

  /* ---------- Search (header search bar + search.html) ---------- */
  const INDEX = [
    ['Product', 'Shampoo', 'Strengthen · Nourish · Balance', 'shampoo.html', 'rosemary aloe vera argan oil cleanse scalp'],
    ['Product', 'Conditioner', 'Hydrate · Repair · Restore', 'conditioner.html', 'argan oil aloe vera rosemary care shine'],
    ['Product', 'The Duo', 'Shampoo & Conditioner set', 'duo.html', 'set bundle'],
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
  const findHits = (query) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return INDEX.filter((entry) => {
      const text = entry.join(' ').toLowerCase();
      return words.every((w) => text.includes(w));
    });
  };
  const renderHits = (listEl, hits) => {
    listEl.replaceChildren(...hits.map(([type, title, desc, href]) => {
      const li = document.createElement('li');
      li.innerHTML = '<a><span class="search__type"></span><span class="search__title"><span></span><span class="search__desc"></span></span><svg aria-hidden="true"><use href="#i-arrow"/></svg></a>';
      li.firstChild.href = href;
      li.querySelector('.search__type').textContent = type;
      li.querySelector('.search__title span').textContent = title;
      li.querySelector('.search__desc').textContent = desc;
      return li;
    }));
  };
  const countLabel = (query, n) => (query.trim() ? `${n} result${n === 1 ? '' : 's'}` : 'Suggestions');

  // search.html
  const searchForm = $('#searchForm');
  if (searchForm) {
    const input = $('#searchInput');
    const runSearch = () => {
      const hits = findHits(input.value);
      $('#searchCount').textContent = countLabel(input.value, hits.length);
      renderHits($('#searchResults'), hits);
    };
    input.value = new URLSearchParams(location.search).get('q') || '';
    input.addEventListener('input', runSearch);
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });
    runSearch();
    input.focus();
  }

  // search bar that drops down from the header
  const searchLink = $('.icon-btn[href="search.html"]');
  if (searchLink && !searchForm) {
    const bar = document.createElement('div');
    bar.className = 'searchbar';
    bar.inert = true;
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-modal', 'true');
    bar.setAttribute('aria-label', 'Search');
    bar.innerHTML = `
      <div class="container searchbar__inner">
        <form class="searchbar__form" role="search" action="search.html">
          <svg aria-hidden="true"><use href="#i-search"/></svg>
          <label class="sr-only" for="barInput">Search AZULA</label>
          <input type="search" id="barInput" name="q" placeholder="Search products, ingredients, articles …" autocomplete="off">
          <button class="drawer__close" type="button" data-close aria-label="Close search"><svg aria-hidden="true"><use href="#i-plus"/></svg></button>
        </form>
        <p class="search__count" id="barCount" role="status" aria-live="polite"></p>
        <ul class="search__results" id="barResults"></ul>
        <a class="link-arrow" id="barAll" href="search.html">See all results <svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
      </div>`;
    document.body.append(bar);
    const barInput = $('#barInput');
    const runBar = () => {
      const q = barInput.value;
      const hits = findHits(q);
      $('#barCount').textContent = countLabel(q, hits.length);
      renderHits($('#barResults'), q.trim() ? hits.slice(0, 5) : hits.slice(0, 3));
      const all = $('#barAll');
      all.href = 'search.html' + (q.trim() ? '?q=' + encodeURIComponent(q.trim()) : '');
      all.hidden = hits.length === 0;
    };
    barInput.addEventListener('input', runBar);
    bar.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeOverlay(); });
    searchLink.addEventListener('click', (e) => {
      e.preventDefault();
      runBar();
      openOverlay(bar, barInput);
    });
  }

  /* ---------- Reviews carousel ---------- */
  const track = $('#reviewsTrack');
  if (track) {
    const originals = [...track.children];
    let period = 0; // width of one full set of reviews
    const step = () => originals[1].offsetLeft - originals[0].offsetLeft;

    if (!reducedMotion) {
      // a second, hidden copy makes the row loop without a visible jump
      originals.forEach((li) => {
        const clone = li.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        // not `inert`: inert cards ignore the mouse, which broke dragging and links
        clone.querySelectorAll('a').forEach((link) => { link.tabIndex = -1; });
        track.append(clone);
      });
      const measure = () => { period = track.children[originals.length].offsetLeft - originals[0].offsetLeft; };
      measure();
      window.addEventListener('resize', measure);
    }

    const wrap = () => {
      if (!period) return;
      if (track.scrollLeft >= period) track.scrollLeft -= period;
      else if (track.scrollLeft <= 0) track.scrollLeft += period;
    };

    // Slow automatic drift. Any interaction pauses it; it always starts again
    // RESUME_AFTER milliseconds after the last interaction.
    const SPEED = 28; // pixels per second
    const RESUME_AFTER = 7000;
    const PRESS_TIMEOUT = 15000; // safety net if a "finger lifted" event never arrives
    let pos = 0;
    let last = 0;
    let visible = false;
    let pausedUntil = 0;
    let pressedAt = 0; // > 0 while a finger or the mouse button is down on the row
    const touched = () => { pausedUntil = performance.now() + RESUME_AFTER; };
    const press = () => { pressedAt = performance.now(); touched(); };
    const lift = () => { pressedAt = 0; touched(); };
    const tick = (now) => {
      const pressing = pressedAt && now - pressedAt < PRESS_TIMEOUT;
      if (visible && !document.hidden && !pressing && now >= pausedUntil) {
        const dt = Math.min(now - last, 100);
        pos += (SPEED * dt) / 1000;
        if (pos >= period) pos -= period;
        track.scrollLeft = pos;
      } else {
        wrap();
        pos = track.scrollLeft; // carry on from wherever the visitor left the row
      }
      last = now;
      requestAnimationFrame(tick);
    };

    if (period) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(track);
      track.addEventListener('touchstart', press, { passive: true });
      track.addEventListener('touchmove', press, { passive: true });
      track.addEventListener('touchend', lift, { passive: true });
      track.addEventListener('touchcancel', lift, { passive: true });
      // only sideways scrolling pauses the row, not scrolling down the page across it
      track.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) touched(); }, { passive: true });
      track.addEventListener('keydown', touched);
      requestAnimationFrame((now) => { last = now; tick(now); });
    }

    // drag with the mouse (touch swiping works natively)
    let drag = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
      press();
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      press();
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      drag.moved = true;
      track.classList.add('is-dragging');
      let left = drag.left - dx;
      if (period) left = ((left % period) + period) % period;
      track.scrollLeft = left;
    });
    const endDrag = () => {
      if (!drag) return;
      drag = null;
      lift();
      // keep the class for one tick so the click that ends a drag does not open a link
      setTimeout(() => track.classList.remove('is-dragging'), 0);
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('blur', endDrag);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    const move = (dir) => {
      touched();
      wrap();
      track.scrollBy({ left: dir * step(), behavior: reducedMotion ? 'auto' : 'smooth' });
    };
    $('#reviewsPrev').addEventListener('click', () => move(-1));
    $('#reviewsNext').addEventListener('click', () => move(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    });
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
