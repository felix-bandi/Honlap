(() => {
  // --- 1) Opcionális: --vh hack (2025-ben többnyire felesleges) ---
  const USE_VH_HACK = false; // állítsd true-ra, ha mégis kell

  function setVH() {
    const h = (window.visualViewport && visualViewport.height) || window.innerHeight || 0;
    if (h > 200 && h < 4000) {
      document.documentElement.style.setProperty('--vh', (h * 0.01) + 'px');
    }
  }
  if (USE_VH_HACK) {
    setVH();
    requestAnimationFrame(setVH);
    setTimeout(setVH, 250);
    addEventListener('resize', setVH, { passive: true });
    addEventListener('orientationchange', setVH, { passive: true });
    visualViewport?.addEventListener('resize', setVH, { passive: true });
  }

  // --- 2) Soft snapper (finom hangolás az inerciára) ---
  const track = document.querySelector('.cards');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.slider'));
  if (!slides.length) return;

  // Hangolható paraméterek
  const SNAP_DEBOUNCE_MS = 90;     // ennyi ms csend után „megállt” a görgetés
  const SPEED_THRESHOLD   = 0.0025; // ennél gyorsabbnál engedünk 2 lapot
  const DIST_THRESHOLD    = 0.65;   // >= 0.65 slide-nyi út → engedünk 2 lapot
  const MAX_STEP          = 1;      // alapban max 1; erős suhintásnál lehet 2

  let lastT = performance.now();
  let lastX = track.scrollLeft;
  let snapTimer = null;

  const slideWidth = () => track.clientWidth; // minden .slider 100% széles
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function currentIndexFrom(px) {
    return Math.round(px / slideWidth());
  }

  function scheduleSnap() {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(doSnap, SNAP_DEBOUNCE_MS);
  }

  function doSnap() {
    const now = performance.now();
    const dt = now - lastT || 1;
    const dx = track.scrollLeft - lastX;
    const speed = Math.abs(dx / dt); // px/ms ~ inercias „sebesség”

    const w = slideWidth();
    const idxStart = Math.round(lastX / w);
    const raw = track.scrollLeft / w;           // pl. 2.37
    let idxTarget = Math.round(raw);
    let deltaIdx = idxTarget - idxStart;

    if (Math.abs(deltaIdx) > MAX_STEP) {
      const fracTowardNext = Math.abs(raw - idxStart); // 0..~1
      const allowTwo = (speed > SPEED_THRESHOLD) || (fracTowardNext > DIST_THRESHOLD);
      deltaIdx = Math.sign(deltaIdx) * (allowTwo ? 2 : 1);
      idxTarget = idxStart + deltaIdx;
    }

    idxTarget = clamp(idxTarget, 0, slides.length - 1);
    track.scrollTo({ left: idxTarget * w, behavior: 'smooth' });

    // frissítjük a „legutóbbi” állapotot
    lastX = track.scrollLeft;
    lastT = now;
  }

  track.addEventListener('scroll', () => {
    lastX = track.scrollLeft;
    lastT = performance.now();
    scheduleSnap();
  }, { passive: true });

  // Induláskor és átméretezéskor igazítsuk „egész lapra”
  function snapToNearest() {
    const w = slideWidth();
    const idx = currentIndexFrom(track.scrollLeft);
    track.scrollTo({ left: idx * w });
  }
  addEventListener('resize', snapToNearest, { passive: true });
  addEventListener('orientationchange', snapToNearest, { passive: true });
  window.addEventListener('load', snapToNearest);

})();
