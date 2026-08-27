(function () {
  function formatPrice(paise) {
    if (window.TWCart && window.TWCart.formatPrice) {
      return window.TWCart.formatPrice(paise);
    }
    return '₹' + (paise / 100).toFixed(2);
  }

  function escapeHtml(value) {
    const el = document.createElement('div');
    el.textContent = value;
    return el.innerHTML;
  }

  function parseImages(images) {
    if (Array.isArray(images)) return images;
    try {
      return JSON.parse(images || '[]');
    } catch {
      return [];
    }
  }

  function renderCompactResult(product) {
    const images = parseImages(product.images);
    const image = images[0] || '/logo.png';
    const compare =
      product.onSale && product.variants && product.variants[0] && product.variants[0].compareAtPrice
        ? `<span class="search-result__compare">${formatPrice(product.variants[0].compareAtPrice)}</span>`
        : '';
    const badge = product.onSale ? '<span class="search-result__badge">Sale</span>' : '';

    return `
      <a href="/products/${escapeHtml(product.slug)}" class="search-result" role="listitem">
        <div class="search-result__thumb-wrap">
          ${badge}
          <img class="search-result__thumb" src="${escapeHtml(image)}" alt="" loading="lazy" width="76" height="100" />
        </div>
        <div class="search-result__body">
          <span class="search-result__title">${escapeHtml(product.title)}</span>
          <div class="search-result__price">
            <span class="search-result__price-current">From ${formatPrice(product.minPrice)}</span>
            ${compare}
          </div>
        </div>
      </a>
    `;
  }

  function renderCard(product) {
    const images = parseImages(product.images);
    const image = images[0] || '/logo.png';
    const compare =
      product.onSale && product.variants && product.variants[0] && product.variants[0].compareAtPrice
        ? `<span class="search-card__compare">${formatPrice(product.variants[0].compareAtPrice)}</span>`
        : '';
    const badge = product.onSale ? '<span class="search-card__badge">Sale</span>' : '';

    return `
      <a href="/products/${escapeHtml(product.slug)}" class="search-card" role="listitem">
        <div class="search-card__img-wrap">
          ${badge}
          <img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)}" loading="lazy" width="400" height="560" />
        </div>
        <h3 class="search-card__title">${escapeHtml(product.title)}</h3>
        <div class="search-card__price">
          <span class="search-card__price-current">From ${formatPrice(product.minPrice)}</span>
          ${compare}
        </div>
      </a>
    `;
  }

  async function fetchResults(query, limit) {
    const response = await fetch(
      `/api/products?search=${encodeURIComponent(query)}&limit=${limit || 8}`,
    );
    if (!response.ok) throw new Error('search failed');
    return response.json();
  }

  function init(root) {
    if (root.dataset.predictiveReady === 'true') return;
    root.dataset.predictiveReady = 'true';

    const inputSelector = root.getAttribute('data-predictive-input-selector');
    const input = inputSelector
      ? document.querySelector(inputSelector)
      : root.querySelector('[data-predictive-input]');
    const grid = root.querySelector('[data-predictive-grid]');
    const meta = root.querySelector('[data-predictive-meta]');
    const countEl = root.querySelector('[data-predictive-count]');
    const queryEl = root.querySelector('[data-predictive-query]');
    const viewAll = root.querySelector('[data-predictive-view-all]');
    const empty = root.querySelector('[data-predictive-empty]');
    const loading = root.querySelector('[data-predictive-loading]');
    const hint = root.querySelector('[data-predictive-hint]');
    const clearBtn = inputSelector
      ? document.querySelector('[data-predictive-clear]')
      : root.querySelector('[data-predictive-clear]');
    const dropdown = root.querySelector('[data-search-dropdown]');
    const header = root.closest('[data-header]');
    const limit = parseInt(root.getAttribute('data-predictive-limit') || '8', 10);
    const updateUrl = root.getAttribute('data-predictive-update-url') === 'true';
    const variant = root.getAttribute('data-predictive-variant') || 'grid';
    const renderItem = variant === 'compact' ? renderCompactResult : renderCard;

    if (!input || !grid) return;

    const form = input.closest('form');
    let timer = null;
    let requestId = 0;

    function setVisible(el, show) {
      if (!el) return;
      el.hidden = !show;
    }

    function setDropdownOpen(open) {
      if (!dropdown || inputSelector) return;
      if (open) {
        dropdown.removeAttribute('hidden');
        header?.classList.add('is-search-active');
      } else {
        dropdown.setAttribute('hidden', '');
        header?.classList.remove('is-search-active');
      }
    }

    function reset() {
      grid.innerHTML = '';
      setVisible(meta, false);
      setVisible(empty, false);
      setVisible(loading, false);
      setVisible(hint, false);
      setDropdownOpen(false);
      if (clearBtn) clearBtn.hidden = !input.value.trim();
    }

    async function runSearch(query) {
      const trimmed = query.trim();
      if (!trimmed) {
        reset();
        if (updateUrl) {
          const url = new URL(window.location.href);
          url.searchParams.delete('q');
          window.history.replaceState({}, '', url.pathname);
          document.title = 'Search — The Wall Records';
        }
        return;
      }

      setDropdownOpen(true);
      setVisible(hint, false);
      setVisible(empty, false);
      setVisible(loading, true);
      if (clearBtn) clearBtn.hidden = false;

      const currentRequest = ++requestId;

      try {
        const items = await fetchResults(trimmed, limit);
        if (currentRequest !== requestId) return;

        setVisible(loading, false);

        if (!items.length) {
          grid.innerHTML = '';
          setVisible(meta, false);
          setVisible(empty, true);
          return;
        }

        grid.innerHTML = items.map(renderItem).join('');
        if (countEl) countEl.textContent = String(items.length);
        if (queryEl) queryEl.textContent = trimmed;
        if (viewAll) viewAll.href = `/search?q=${encodeURIComponent(trimmed)}`;
        if (updateUrl) {
          const url = new URL(window.location.href);
          url.searchParams.set('q', trimmed);
          window.history.replaceState({}, '', url);
          document.title = `Search: ${trimmed} — The Wall Records`;
        }
        setVisible(meta, true);
      } catch {
        if (currentRequest !== requestId) return;
        setVisible(loading, false);
        setVisible(empty, true);
      }
    }

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const trimmed = input.value.trim();
      if (!trimmed) return;
      if (updateUrl) {
        runSearch(trimmed);
        return;
      }
      window.location.href = `/search?q=${encodeURIComponent(trimmed)}`;
    });

    input.addEventListener('input', () => {
      if (clearBtn) clearBtn.hidden = !input.value;
      clearTimeout(timer);
      timer = setTimeout(() => runSearch(input.value), 120);
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      reset();
      input.focus();
    });

    if (input.value.trim()) {
      if (clearBtn) clearBtn.hidden = false;
      runSearch(input.value);
    } else {
      reset();
    }
  }

  function boot() {
    document.querySelectorAll('[data-predictive-search]').forEach(init);
  }

  window.TWPredictiveSearch = { init, boot };
  boot();
  document.addEventListener('astro:page-load', boot);
})();
