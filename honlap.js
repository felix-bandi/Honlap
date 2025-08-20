function kartyameretezes(cardSelector) {
  const cards = document.querySelectorAll(cardSelector);

  cards.forEach(card => {
    const img = card.querySelector('img');

    if (img.complete) {
      const h = img.offsetHeight * 1.1; 
      card.style.height = h + 'px';
      img.style.transform = 'translateX(' + (0.05 * h) + 'px)';
    } else {
      img.onload = () => {
        const h = img.offsetHeight * 1.1;
        card.style.height = h + 'px';
        img.style.transform = 'translateX(' + (0.05 * h) + 'px)';
      };
    }

  });
}

kartyameretezes('.card');

window.addEventListener('load', () => kartyameretezes('.card'));
window.addEventListener('resize', () => kartyameretezes('.card'));

