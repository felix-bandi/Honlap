/* ===== Input-environment detektor (pointer/hover + DPR + első esemény) ===== */
(() => {
  const root = document.documentElement;

  // ---- helpers
  const add = (c) => root.classList.add(c);
  const setData = (k, v) => (root.dataset[k] = String(v));
  const mq = (q) => window.matchMedia(q).matches;
  const raf = (fn) => (window.requestAnimationFrame ? requestAnimationFrame(fn) : setTimeout(fn, 0));

  // ---- állapot
  const state = {
    dpr: window.devicePixelRatio || 1,
    mq: {
      hover: mq("(hover: hover)"),
      anyHover: mq("(any-hover: hover)"),
      fine: mq("(pointer: fine)"),
      coarse: mq("(pointer: coarse)"),
      anyFine: mq("(any-pointer: fine)"),
      anyCoarse: mq("(any-pointer: coarse)")
    },
    hasTouchPoints: (navigator.maxTouchPoints || 0) > 0,
    primary: undefined,   // 'mouse' | 'touch' | 'pen'
    seen: new Set()       // pl. {'mouse','touch'}
  };

  // ---- kezdeti következtetés (heurisztika)
  function inferInitialPrimary() {
    if (state.mq.fine && state.mq.hover) return "mouse";
    if (state.hasTouchPoints || state.mq.coarse) return "touch";
    return undefined;
  }

  // ---- DOM jelölés
  function applyClasses() {
    // reset-eljük az env-* classokat (opcionális; itt idempotens hozzáadás van)
    if (state.mq.hover) add("env-hover");
    if (state.mq.fine) add("env-fine");
    if (state.mq.coarse) add("env-coarse");
    if (state.mq.anyFine) add("env-any-fine");
    if (state.mq.anyCoarse) add("env-any-coarse");
    if (state.hasTouchPoints) add("env-has-touch");

    // látott inputtípusok
    state.seen.forEach((t) => add(`input-${t}`));

    // primary
    if (state.primary) {
      setData("primaryInput", state.primary); // <html data-primary-input="mouse|touch|pen">
      add(`primary-${state.primary}`);
    }

    // DPR (kerekítve is)
    setData("dpr", state.dpr.toFixed(2));
    setData("dprRounded", Math.round(state.dpr));
  }

  // ---- publikus API
  window.getInputEnv = function getInputEnv() {
    return {
      dpr: state.dpr,
      primary: state.primary,
      seen: Array.from(state.seen),
      mq: { ...state.mq },
      hasTouchPoints: state.hasTouchPoints
    };
  };

  // ---- elsődleges input „verseny” (PointerEvent preferált)
  function installDetectors() {
    if (window.PointerEvent) {
      const onPrimaryPointer = (e) => {
        state.primary = e.pointerType;         // 'mouse' | 'touch' | 'pen'
        state.seen.add(e.pointerType);
        applyClasses();
        window.removeEventListener("pointerdown", onPrimaryPointer, true);

        // a következő eltérő típusú pointert egyszer „secondary”-nek jelöljük
        window.addEventListener(
          "pointerdown",
          (e2) => { state.seen.add(e2.pointerType); applyClasses(); },
          { once: true, passive: true, capture: true }
        );
      };
      window.addEventListener("pointerdown", onPrimaryPointer, { once: true, passive: true, capture: true });
      // ha van egy jó kezdeti tippünk, már most ráírjuk:
      state.primary ??= inferInitialPrimary();
      applyClasses();
      return;
    }

    // Fallback: egér vs touch verseny
    let decided = false;
    const decide = (t) => {
      if (decided) return;
      decided = true;
      state.primary = t; state.seen.add(t); applyClasses();
      cleanup();

      // egyszer jelöld a másikat is, ha később felbukkan
      const otherEvt = t === "mouse" ? "touchstart" : "mousedown";
      window.addEventListener(otherEvt, () => { state.seen.add(t === "mouse" ? "touch" : "mouse"); applyClasses(); }, { once: true, passive: true, capture: true });
    };

    const onMouse = () => decide("mouse");
    const onTouch = () => decide("touch");

    function cleanup() {
      window.removeEventListener("mousemove", onMouse, true);
      window.removeEventListener("mousedown", onMouse, true);
      window.removeEventListener("wheel", onMouse, true);
      window.removeEventListener("touchstart", onTouch, true);
      window.removeEventListener("touchmove", onTouch, true);
    }

    window.addEventListener("mousemove", onMouse,   { once: true, passive: true, capture: true });
    window.addEventListener("mousedown", onMouse,   { once: true, passive: true, capture: true });
    window.addEventListener("wheel",     onMouse,   { once: true, passive: true, capture: true });
    window.addEventListener("touchstart",onTouch,   { once: true, passive: true, capture: true });
    window.addEventListener("touchmove", onTouch,   { once: true, passive: true, capture: true });

    state.primary ??= inferInitialPrimary();
    applyClasses();
  }

  // ---- DPR & MQ frissítés (pl. ablak átméretezés / kijelzőváltás)
  function refreshMQ() {
    state.dpr = window.devicePixelRatio || 1;
    state.mq.hover = mq("(hover: hover)");
    state.mq.anyHover = mq("(any-hover: hover)");
    state.mq.fine = mq("(pointer: fine)");
    state.mq.coarse = mq("(pointer: coarse)");
    state.mq.anyFine = mq("(any-pointer: fine)");
    state.mq.anyCoarse = mq("(any-pointer: coarse)");
    state.hasTouchPoints = (navigator.maxTouchPoints || 0) > 0;
    applyClasses();
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => raf(refreshMQ), 120);
  }, { passive: true });

  window.addEventListener("orientationchange", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => raf(refreshMQ), 120);
  }, { passive: true });

  // ---- start
  installDetectors();
  // első apply (késleltetve, hogy class-ok megjelenjenek első festés után)
  raf(applyClasses);
})();
