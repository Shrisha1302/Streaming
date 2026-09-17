/**
 * RYVANTA 2026 — Sponsor Carousel
 * Renders and animates sponsors in an infinite seamless loop moving Left to Right.
 */

'use strict';

const SPONSORS_CONFIG = {
  /** Carousel scroll speed in pixels per second */
  carouselSpeed: 55,

  /** Sponsor logo paths */
  sponsors: [
    'sponsor1.jpeg',
    'sponsor2.jpeg',
    'sponsor3.jpeg',
    'sponsor4.jpeg',
    'sponsor5.jpeg',
    'sponsor6.jpeg',
    'sponsor7.jpeg',
  ],
};

function initSponsorCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  // Clear any existing content
  track.innerHTML = '';

  // Build sets for infinite loop
  const makeSet = () =>
    SPONSORS_CONFIG.sponsors.map(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = src.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      img.className = 'sponsor-logo';
      img.loading = 'lazy';
      img.draggable = false;
      return img;
    });

  // Duplicate set trick for infinite scrolling
  const set1 = makeSet();
  const set2 = makeSet();

  [...set1, ...set2].forEach(img => track.appendChild(img));

  function updateCarouselKeyframe(halfWidth) {
    const existingStyle = document.getElementById('carousel-keyframe-style');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'carousel-keyframe-style';
    // Translate from -halfWidth to 0 creates smooth Left to Right motion
    style.textContent = `
      @keyframes scrollRight {
        from { transform: translateX(-${halfWidth}px); }
        to   { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  const setDuration = () => {
    const halfWidth = track.scrollWidth / 2;
    if (halfWidth <= 0) return;
    const duration = halfWidth / SPONSORS_CONFIG.carouselSpeed;
    track.style.animation = `scrollRight ${duration}s linear infinite`;
    updateCarouselKeyframe(halfWidth);
  };

  const firstImg = set1[0];
  if (firstImg.complete) {
    setTimeout(setDuration, 100);
  } else {
    firstImg.addEventListener('load', () => setTimeout(setDuration, 100));
    setTimeout(setDuration, 1200);
  }

  window.addEventListener('resize', setDuration);
}

// Auto-init on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSponsorCarousel);
} else {
  initSponsorCarousel();
}
