/* global document */
/* global SmoothScroll */

// SMOOTHSCROLL //

// eslint-disable-next-line no-unused-vars
const scroll = new SmoothScroll('a[href*="#"]', {
  // Easing pattern to use.
  easing: 'easeInOutCubic',
  // How far to offset the scrolling anchor location in pixels.
  offset: 64
});

// MOBILE MENU //

const menuOpen = document.getElementById('js-navOpen');
const menuClose = document.getElementById('js-navClose');
const metabarNav = document.getElementById('js-metabarNav');

menuOpen.addEventListener('click', () => {
  metabarNav.classList.add('open');
});

menuClose.addEventListener('click', () => {
  metabarNav.classList.remove('open');
});

// EMBEDLY //

const embeds = document.getElementsByClassName('embedly-card');

// Set default options for Embedly cards.
for (let i = 0; i < embeds.length; i += 1) {
  embeds[i].setAttribute('data-card-controls', '0');
  embeds[i].setAttribute('data-card-align', 'left');
  embeds[i].setAttribute('data-card-recommend', '0');
  embeds[i].setAttribute('data-card-chrome', '0');
}
