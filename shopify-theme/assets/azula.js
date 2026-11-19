/* =========================================================
   AZULA theme script
   Visual behaviour is unchanged from the original site; cart, search
   and product forms are connected to Shopify's storefront APIs.
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const config = window.azula || { routes: {}, strings: {}, cartType: 'drawer' };
  const routes = config.routes;
  const strings = config.strings;
  const designMode = Boolean(window.Shopify && window.Shopify.designMode);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cartRoot = routes.root || '/';
  const fmt = (template, values) => String(template || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (key in values ? values[key] : ''));

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };

  /* ---------- Header: solid on scroll ---------- */
  const getHeader = () => $('#header');
  const onScroll = () => { const header = getHeader(); if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile navigation ---------- */
  const setMenu = (open) => {
    const nav = $('#nav');
    const burger = $('#burger');
    const header = getHeader();
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    if (header) header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? strings.closeMenu : strings.openMenu);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('#burger')) {
      setMenu($('#burger').getAttribute('aria-expanded') !== 'true');
    } else if (e.target.closest('#nav a')) {
      setMenu(false);
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', () => setMenu(false));

  /* ---------- Scroll reveal ---------- */
  let revealObserver = null;
  if ('IntersectionObserver' in window && !reducedMotion && !designMode) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  }
  const initReveal = (root = document) => {
    $$('.reveal', root).forEach((el) => {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-in');
    });
  };

  /* ---------- Hero parallax (pointer devices only) ---------- */
  const initParallax = (root = document) => {
    const hero = $('.hero', root);
    if (!hero || reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const layers = [['.hero__glow', 8], ['.hero__shots', 14]].map(([sel, depth]) => [$(sel, hero), depth]).filter(([el]) => el);
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
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  };
  const openOverlay = (panel, focusEl) => {
    if (!panel) return;
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
    setTimeout(() => { const target = focusEl && focusEl(); if (openPanel === panel && target) target.focus({ preventScroll: true }); }, 80);
  };
  backdrop.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });

  /* ---------- Cart (Shopify Cart API + Section Rendering API) ---------- */
  const drawer = () => $('#bagDrawer');
  const cartPage = () => $('[data-cart-page]');
  const openBag = () => openOverlay(drawer(), () => $('.drawer__close', drawer()));

  const sectionsToRender = () => {
    const ids = [];
    if (drawer()) ids.push('cart-drawer');
    const page = cartPage();
    if (page && page.dataset.sectionId) ids.push(page.dataset.sectionId);
    return ids;
  };

  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');

  const renderSections = (sections) => {
    if (!sections) return;
    const drawerHTML = sections['cart-drawer'];
    const current = drawer();
    if (drawerHTML && current) {
      const fresh = $('#bagDrawer', parse(drawerHTML));
      if (fresh) {
        current.innerHTML = fresh.innerHTML;
        current.dataset.cartCount = fresh.dataset.cartCount;
        updateCount(Number(fresh.dataset.cartCount));
      }
    }
    const page = cartPage();
    if (page && sections[page.dataset.sectionId]) {
      const fresh = $('[data-cart-page]', parse(sections[page.dataset.sectionId]));
      if (fresh) page.innerHTML = fresh.innerHTML;
    }
  };

  const updateCount = (count) => {
    const badge = $('#cartCount');
    const button = $('#cartBtn');
    if (!badge || Number.isNaN(count)) return;
    const changed = badge.textContent !== String(count);
    badge.textContent = count;
    if (button && button.dataset.labelOne) {
      button.setAttribute('aria-label', (count === 1 ? button.dataset.labelOne : button.dataset.labelOther).replace('__COUNT__', count));
    }
    if (changed) {
      badge.classList.remove('bump');
      void badge.offsetWidth; // restart animation
      badge.classList.add('bump');
    }
  };

  const request = async (url, body) => {
    const isForm = body instanceof FormData;
    const response = await fetch(url, {
      method: 'POST',
      headers: isForm ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: isForm ? body : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status) {
      const message = data.description || data.message || strings.error;
      throw new Error(typeof message === 'string' ? message : strings.error);
    }
    return data;
  };

  const afterAdd = (data, title) => {
    renderSections(data.sections);
    if (config.cartType === 'page') {
      window.location.href = routes.cart;
    } else if (config.cartType === 'drawer' && drawer() && !cartPage()) {
      openBag();
    } else {
      showToast(fmt(strings.added, { title }));
    }
  };

  // Quick add buttons on cards
  document.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-add-variant]');
    if (!button || button.disabled) return;
    e.preventDefault();
    button.classList.add('is-loading');
    try {
      const data = await request(`${routes.cartAdd}.js`, {
        items: [{ id: Number(button.dataset.addVariant), quantity: 1 }],
        sections: sectionsToRender(),
        sections_url: window.location.pathname,
      });
      afterAdd(data, button.dataset.title || '');
    } catch (error) {
      showToast(error.message);
    } finally {
      button.classList.remove('is-loading');
    }
  });

  // Product forms
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-type="add-to-cart-form"]');
    if (!form) return;
    e.preventDefault();
    const button = $('[data-add-button]', form);
    if (button && button.disabled) return;
    if (button) button.classList.add('is-loading');
    const body = new FormData(form);
    body.append('sections', sectionsToRender().join(','));
    body.append('sections_url', window.location.pathname);
    try {
      const data = await request(`${routes.cartAdd}.js`, body);
      const quantity = Number(body.get('quantity')) || 1;
      const title = data.product_title || '';
      afterAdd(data, quantity > 1 ? `${quantity} × ${title}` : title);
    } catch (error) {
      showToast(error.message);
    } finally {
      if (button) button.classList.remove('is-loading');
    }
  });

  // Quantity +/− and remove in the drawer and on the cart page
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('.bag__item [data-line]');
    if (!link) return;
    e.preventDefault();
    const list = link.closest('.bag__list');
    const inDrawer = Boolean(link.closest('#bagDrawer'));
    const line = Number(link.dataset.line);
    const quantity = Number(link.dataset.quantity);
    const control = link.classList.contains('bag__remove') ? 'remove' : (quantity > Number($('.qty > span', link.closest('.bag__item')).textContent) ? 'more' : 'less');
    if (list) list.classList.add('is-updating');
    try {
      const data = await request(`${routes.cartChange}.js`, {
        line, quantity, sections: sectionsToRender(), sections_url: window.location.pathname,
      });
      renderSections(data.sections);
      // lists are re-rendered: keep keyboard focus on the same control
      const scope = inDrawer ? drawer() : cartPage();
      const row = scope && $(`.bag__item[data-line="${line}"]`, scope);
      let target = null;
      if (row && control !== 'remove') target = control === 'more' ? $$('.qty a', row)[1] : $$('.qty a', row)[0];
      if (!target && inDrawer) target = $('.drawer__close', drawer());
      if (target) target.focus();
    } catch (error) {
      showToast(error.message);
      if (list) list.classList.remove('is-updating');
    }
  });

  // Drawer close button and cart icon
  document.addEventListener('click', (e) => {
    if (e.target.closest('#bagDrawer [data-close]')) { closeOverlay(); return; }
    const icon = e.target.closest('#cartBtn');
    if (icon && config.cartType === 'drawer' && drawer() && !cartPage()) {
      e.preventDefault();
      openBag();
    }
  });

  // Keep the count right when the visitor comes back via the browser's back button
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    fetch(`${cartRoot}cart.js`).then((r) => r.json()).then((cart) => updateCount(cart.item_count)).catch(() => {});
  });

  /* ---------- Product page: quantity, variants, gallery ---------- */
  const initProduct = (root = document) => {
    $$('[data-product-section]', root).forEach((section) => {
      const qtyInput = $('[data-qty-input]', section);
      $$('[data-qty-step]', section).forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!qtyInput) return;
          const next = Math.min(99, Math.max(1, (Number(qtyInput.value) || 1) + Number(btn.dataset.qtyStep)));
          qtyInput.value = next;
        });
      });

      const mainMedia = $('[data-main-media]', section);
      const showMedia = (mediaId) => {
        const tpl = $(`template[data-media-template="${mediaId}"]`, section);
        if (!tpl || !mainMedia) return;
        mainMedia.replaceChildren(tpl.content.cloneNode(true));
        $$('[data-thumb]', section).forEach((thumb) => {
          if (thumb.dataset.mediaId === String(mediaId)) thumb.setAttribute('aria-current', 'true');
          else thumb.removeAttribute('aria-current');
        });
      };
      $$('[data-thumb]', section).forEach((thumb) => thumb.addEventListener('click', () => showMedia(thumb.dataset.mediaId)));

      const picker = $('[data-variant-picker]', section);
      if (!picker) return;
      let variants = [];
      try { variants = JSON.parse($('[data-variants]', picker).textContent); } catch { return; }
      const idInput = $('[data-variant-id]', section);
      const addButton = $('[data-add-button]', section);
      const addLabel = $('[data-add-label]', section);
      const priceEl = $('[data-price]', section);
      const sizeEl = $('[data-size]', section);
      const unitEl = $('[data-unit-price]', section);
      const savingEl = $('[data-saving]', section);

      const selected = () => $$('fieldset', picker).map((fs) => { const checked = $('input:checked', fs); return checked ? checked.value : null; });

      const markUnavailable = (current) => {
        // Grey out values that would lead to a sold-out or missing combination
        $$('input[data-option-position]', picker).forEach((input) => {
          const pos = Number(input.dataset.optionPosition) - 1;
          const combo = current.slice();
          combo[pos] = input.value;
          const match = variants.find((v) => v.options.every((o, i) => o === combo[i]));
          input.nextElementSibling.classList.toggle('is-unavailable', !match || !match.available);
        });
      };

      const update = () => {
        const options = selected();
        const variant = variants.find((v) => v.options.every((o, i) => o === options[i]));
        markUnavailable(options);
        if (!variant) {
          if (addButton) addButton.disabled = true;
          if (addLabel) addLabel.textContent = strings.unavailable;
          return;
        }
        if (idInput) idInput.value = variant.id;
        if (addButton) addButton.disabled = !variant.available;
        if (addLabel) addLabel.textContent = variant.available ? strings.addToCart : strings.soldOut;
        if (priceEl) priceEl.innerHTML = variant.price + (variant.compare ? ` <s class="price__compare">${variant.compare}</s>` : '');
        if (sizeEl && sizeEl.dataset.fromMetafield !== 'true') sizeEl.textContent = variant.size;
        if (unitEl) unitEl.innerHTML = variant.unit;
        if (savingEl) {
          savingEl.textContent = variant.saving || '';
          savingEl.hidden = !variant.saving;
        }
        if (variant.media) showMedia(variant.media);
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      };
      picker.addEventListener('change', update);
      markUnavailable(selected());
    });
  };

  /* ---------- Header search bar (Shopify predictive search) ---------- */
  const initSearchBar = () => {
    const bar = $('#searchBar');
    if (!bar || !routes.predictiveSearch) return;
    const input = $('#barInput', bar);
    const results = $('#barResults', bar);
    const suggestions = results ? results.innerHTML : '';
    let controller = null;
    let timer = 0;

    const run = () => {
      const q = input.value.trim();
      if (controller) controller.abort();
      if (!q) { results.innerHTML = suggestions; return; }
      controller = new AbortController();
      const params = new URLSearchParams({
        q, section_id: 'predictive-search',
        'resources[type]': 'product,collection,page,article',
        'resources[limit]': '6',
        'resources[options][fields]': 'title,product_type,variants.title,vendor,tag,body',
      });
      fetch(`${routes.predictiveSearch}?${params}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then((html) => {
          const section = $('#shopify-section-predictive-search', parse(html));
          results.innerHTML = section ? section.innerHTML : '';
        })
        .catch(() => {});
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 180); });
    bar.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeOverlay(); });

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('#searchBtn');
      if (!trigger || document.body.classList.contains('template-search')) return;
      e.preventDefault();
      openOverlay(bar, () => input);
    });
  };

  /* ---------- Reviews carousel ---------- */
  const initReviews = (root = document) => {
    $$('[data-reviews-track]', root).forEach((track) => {
      if (track.dataset.ready) return;
      track.dataset.ready = 'true';
      const stage = track.closest('.reviews__stage');
      const originals = [...track.children];
      if (originals.length < 2) return;
      let period = 0; // width of one full set of reviews
      const step = () => originals[1].offsetLeft - originals[0].offsetLeft;

      if (!reducedMotion) {
        // a second, hidden copy makes the row loop without a visible jump
        originals.forEach((li) => {
          const clone = li.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.removeAttribute('data-shopify-editor-block');
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
      const SPEED = Number(track.dataset.speed) || 28; // pixels per second
      const RESUME_AFTER = Number(track.dataset.resume) || 7000;
      const PRESS_TIMEOUT = RESUME_AFTER + 8000; // safety net if a "finger lifted" event never arrives
      let pos = 0;
      let last = 0;
      let visible = false;
      let pausedUntil = 0;
      let pressedAt = 0; // > 0 while a finger or the mouse button is down on the row
      const touched = () => { pausedUntil = performance.now() + RESUME_AFTER; };
      const press = () => { pressedAt = performance.now(); touched(); };
      const lift = () => { pressedAt = 0; touched(); };
      const tick = (now) => {
        if (!track.isConnected) return; // section was removed in the theme editor
        const pressing = pressedAt && now - pressedAt < PRESS_TIMEOUT;
        if (visible && !document.hidden && !pressing && now >= pausedUntil && !designMode) {
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
      const prev = stage && $('[data-reviews-prev]', stage);
      const next = stage && $('[data-reviews-next]', stage);
      if (prev) prev.addEventListener('click', () => move(-1));
      if (next) next.addEventListener('click', () => move(1));
      track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
      });
    });
  };

  /* ---------- Magazine topic filter ---------- */
  const initFilter = (root = document) => {
    const chips = $$('.chips [data-filter]', root);
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => {
          c.classList.toggle('is-active', c === chip);
          c.setAttribute('aria-pressed', String(c === chip));
        });
        const filter = chip.dataset.filter;
        $$('#articles .article').forEach((a) => {
          const tags = (a.dataset.cat || '').split('|');
          a.hidden = filter !== 'all' && !tags.includes(filter);
          a.classList.add('is-in');
        });
      });
    });
  };

  /* ---------- Start ---------- */
  const initSection = (root) => {
    initReveal(root);
    initParallax(root);
    initProduct(root);
    initReviews(root);
    initFilter(root);
  };

  // cart icon label templates for one/many items (translated in Liquid)
  const cartBtn = $('#cartBtn');
  if (cartBtn && config.strings.cartOne) {
    cartBtn.dataset.labelOne = config.strings.cartOne;
    cartBtn.dataset.labelOther = config.strings.cartOther;
  }

  onScroll();
  initSection(document);
  initSearchBar();

  /* ---------- Theme editor ---------- */
  document.addEventListener('shopify:section:load', (e) => {
    initSection(e.target);
    onScroll();
  });
  document.addEventListener('shopify:section:select', (e) => {
    $$('.reveal', e.target).forEach((el) => el.classList.add('is-in'));
  });
  document.addEventListener('shopify:block:select', (e) => {
    const block = e.target;
    const track = block.closest('[data-reviews-track]');
    if (track) track.scrollTo({ left: block.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  });
})();
