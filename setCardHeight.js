// Mobil viewport magasság dinamikus beállítása JS-sel
function setCardHeight() {
  var vh = window.innerHeight;
  var cards = document.querySelectorAll('.card');
  cards.forEach(function(card) {
    card.style.height = (vh - 80) + 'px'; // 40px border + 40px margin
    card.style.minHeight = (vh - 80) + 'px';
  });
}

window.addEventListener('resize', setCardHeight);
window.addEventListener('orientationchange', setCardHeight);
document.addEventListener('DOMContentLoaded', setCardHeight);
