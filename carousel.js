/**
 * RYVANTA 2026 — Sponsor Carousel & Animated Background Particles
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

/**
 * Animated Floating Energy Particles Canvas
 */
function initBgParticles() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const particleCount = Math.min(Math.floor((width * height) / 16000), 75);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.6,
      alpha: Math.random() * 0.6 + 0.2,
      speedY: Math.random() * 0.45 + 0.15,
      speedX: (Math.random() - 0.5) * 0.25,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let p of particles) {
      p.y -= p.speedY;
      p.x += p.speedX;
      p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.005;

      if (p.y < -10) p.y = height + 10;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 127, ${Math.max(0.15, Math.min(0.85, p.alpha))})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff7f';
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  animate();
}

// Auto-init on DOM load
function initAll() {
  initSponsorCarousel();
  initBgParticles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
