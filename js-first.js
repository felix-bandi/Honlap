(function(){
  function setVH(){
    const h = (window.visualViewport && visualViewport.height) || window.innerHeight || 0;
    if (h > 200 && h < 4000) {
      document.documentElement.style.setProperty('--vh', (h * 0.01) + 'px');
    }
  }
  setVH();
  requestAnimationFrame(setVH);
  setTimeout(setVH, 250);

  addEventListener('resize', setVH, {passive:true});
  addEventListener('orientationchange', setVH, {passive:true});
  visualViewport?.addEventListener('resize', setVH, {passive:true});
})();
