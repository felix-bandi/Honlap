// Desktop-only layout helper: make right column match left image column height and allow internal scroll.
// Falls back gracefully when JS is disabled.
(function () {
  const mq = window.matchMedia('(min-width: 901px)');

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function applyHeights(card) {
    const pic = card.querySelector('picture');
    const text = card.querySelector('.card-text');
    if (!pic || !text) return;

    // Reset any inline height first to measure natural size
    text.style.height = '';

    // Measure left column height (including borders/padding)
    const leftH = pic.clientHeight;
    if (!leftH) return;

    // Card padding accounts for internal spacing, text gets the remaining
    // Constrain to avoid negative or absurd values
    const target = clamp(leftH, 0, 100000);
    text.style.height = target + 'px';
    text.style.overflowY = 'auto';
  }

  function applyAll() {
    if (!mq.matches) {
      // On mobile, clear any desktop inline heights
      document.querySelectorAll('.card .card-text').forEach(el => {
        el.style.height = '';
        el.style.overflowY = '';
      });
      return;
    }
    document.querySelectorAll('.card').forEach(applyHeights);
  }

  // Observe changes in left column size (e.g., image loads or resizes)
  const resizeObservers = new WeakMap();
  function observeCard(card) {
    if (resizeObservers.has(card)) return;
    const pic = card.querySelector('picture');
    if (!pic) return;
    const ro = new ResizeObserver(() => applyHeights(card));
    ro.observe(pic);
    resizeObservers.set(card, ro);
  }

  function init() {
    applyAll();
    document.querySelectorAll('.card').forEach(observeCard);
  }

  // Run on load and on viewport resize
  window.addEventListener('load', init, { passive: true });
  window.addEventListener('resize', applyAll, { passive: true });
  mq.addEventListener('change', applyAll);
})();
