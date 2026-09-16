/**
 * RYVANTA 2026 — Countdown Timer  |  timer.js
 * ─────────────────────────────────────────────────────────────
 * • Accurate time-based countdown (requestAnimationFrame)
 * • Pause / Resume with exact state preservation
 * • Custom duration setting
 * • Infinite seamless sponsor carousel (CSS animation, no JS scroll)
 * • Keyboard shortcuts: Space = pause, F = fullscreen, G = gear menu
 * • Fullscreen API support
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   CONFIG  — edit these values to customise the event
═══════════════════════════════════════════════════════════ */
const CONFIG = {
  /** Initial countdown in seconds (5 hours = 18000) */
  initialSeconds: 5 * 60 * 60,

  /** Carousel scroll speed in pixels per second */
  carouselSpeed: 60,

  /** Sponsor logo paths — add / remove / replace as needed */
  sponsors: [
    'sponsor1.jpeg',
    'sponsor2.jpeg',
    'sponsor3.jpeg',
    'sponsor4.jpeg',
    'sponsor5.jpeg',
    'sponsor6.jpeg',
    'sponsor7.jpeg',
  ],

  /** Message shown inside the pause banner */
  pauseMessage: 'TIMER PAUSED',
};

/* ═══════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════ */
const state = {
  totalSeconds:    CONFIG.initialSeconds,  // total duration when (re)set
  remaining:       CONFIG.initialSeconds,  // current remaining seconds (float OK)
  running:         false,
  started:         false,                  // has START been pressed yet?
  lastTimestamp:   null,                   // performance.now() at last rAF
  rafId:           null,
  finished:        false,
};

/* ═══════════════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const dom = {
  hours:             $('hours'),
  minutes:           $('minutes'),
  seconds:           $('seconds'),
  colon1:            $('colon1'),
  colon2:            $('colon2'),
  pauseBanner:       $('pauseBanner'),
  pauseLabel:        $('pauseLabel'),
  digitsRow:         $('digitsRow'),
  timesupScreen:     $('timesupScreen'),
  startScreen:       $('startScreen'),
  startBtn:          $('startBtn'),
  launchScreen:      $('launchScreen'),
  launchDigit:       $('launchDigit'),
  launchMsg:         $('launchMsg'),
  launchRing:        $('launchRing'),
  pauseBtn:          $('pauseBtn'),
  pauseBtnIcon:      $('pauseBtnIcon'),
  pauseBtnText:      $('pauseBtnText'),
  resetBtn:          $('resetBtn'),
  fullscreenBtn:     $('fullscreenBtn'),
  gearBtn:           $('gearBtn'),
  ctrlDrawer:        $('ctrlDrawer'),
  durationHours:     $('durationHours'),
  durationMinutes:   $('durationMinutes'),
  setDurationBtn:    $('setDurationBtn'),
  carouselTrack:     $('carouselTrack'),
  pauseMessageInput: $('pauseMessageInput'),
};

/* ═══════════════════════════════════════════════════════════
   TIMER CORE
═══════════════════════════════════════════════════════════ */

/** Format an integer as zero-padded 2-digit string */
function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

/** Render current remaining seconds to DOM */
function renderTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hStr = pad2(h);
  const mStr = pad2(m);
  const sStr = pad2(s);

  if (dom.hours.textContent   !== hStr) { dom.hours.textContent   = hStr; triggerTick(dom.hours);   }
  if (dom.minutes.textContent !== mStr) { dom.minutes.textContent = mStr; triggerTick(dom.minutes); }
  if (dom.seconds.textContent !== sStr) { dom.seconds.textContent = sStr; triggerTick(dom.seconds); }

  // Update document title (handy for the organiser to see at a glance)
  document.title = `${hStr}:${mStr}:${sStr} — RYVANTA 2026`;
}

/** Brief CSS animation on digit change */
function triggerTick(el) {
  el.classList.remove('tick');
  // Force reflow so the animation restarts
  void el.offsetWidth;
  el.classList.add('tick');
}

/** Main animation loop — called by requestAnimationFrame */
function tick(timestamp) {
  if (!state.running || state.finished) return;

  if (state.lastTimestamp !== null) {
    const elapsed = (timestamp - state.lastTimestamp) / 1000; // seconds
    state.remaining = Math.max(0, state.remaining - elapsed);
  }
  state.lastTimestamp = timestamp;

  renderTimer(state.remaining);

  if (state.remaining <= 0) {
    finishTimer();
    return;
  }

  state.rafId = requestAnimationFrame(tick);
}

/** Called when START is clicked — runs the launch sequence first */
function startTimer() {
  if (state.finished) return;

  if (!state.started) {
    state.started = true;
    // Fade out start screen, then run the 5-4-3-2-1 sequence
    dom.startScreen.classList.add('hidden');
    setTimeout(() => {
      dom.startScreen.style.display = 'none';
      runLaunchSequence();
    }, 550);
    return; // actual timer start happens at end of sequence
  }

  // Resume from pause (no sequence needed)
  beginMainTimer();
}

/**
 * 5-4-3-2-1 countdown, then "And now the hackathon begins..",
 * then calls beginMainTimer().
 */
function runLaunchSequence() {
  const el      = dom.launchDigit;
  const ring    = dom.launchRing;
  const msg     = dom.launchMsg;
  const screen  = dom.launchScreen;

  // Reset state
  el.textContent  = '';
  el.className    = 'launch-digit';
  ring.className  = 'launch-ring';
  msg.className   = 'launch-msg';
  screen.classList.add('active');

  const counts = [5, 4, 3, 2, 1];
  let   step   = 0;

  // Helper: trigger animation restart
  function restartAnim(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth;   // force reflow
    node.classList.add(cls);
  }

  function showNext() {
    if (step < counts.length) {
      el.textContent = counts[step];
      restartAnim(el,   'pop');
      restartAnim(ring, 'pulse');
      step++;
      setTimeout(showNext, 900); // one digit per ~0.9s
    } else {
      // All digits done — show the message
      el.className   = 'launch-digit';  // hide digit instantly
      ring.className = 'launch-ring';
      restartAnim(msg, 'reveal');

      // Hold message for 1.8s then fade out and begin timer
      setTimeout(() => {
        restartAnim(msg, 'fadeout');
        setTimeout(() => {
          screen.classList.remove('active');
          msg.className = 'launch-msg';
          beginMainTimer();
        }, 650);
      }, 1800);
    }
  }

  showNext();
}

/** Actually start the rAF countdown loop (post-sequence or post-resume) */
function beginMainTimer() {
  if (state.finished) return;
  state.running       = true;
  state.lastTimestamp = null;
  state.rafId         = requestAnimationFrame(tick);

  // UI
  dom.pauseBanner.classList.remove('visible');
  dom.pauseBtnIcon.textContent = '⏸';
  dom.pauseBtnText.textContent = 'PAUSE';
  dom.colon1.style.animationPlayState = 'running';
  dom.colon2.style.animationPlayState = 'running';
}

/** Pause the countdown */
function pauseTimer() {
  state.running = false;
  cancelAnimationFrame(state.rafId);
  state.lastTimestamp = null;

  // Read the message from the control-panel input (organiser can pre-set it)
  const inputMsg = dom.pauseMessageInput?.value.trim().toUpperCase();
  // Also sync it to the on-screen label
  dom.pauseLabel.textContent = inputMsg || CONFIG.pauseMessage;

  // UI
  dom.pauseBanner.classList.add('visible');
  dom.pauseBtnIcon.textContent = '▶';
  dom.pauseBtnText.textContent = 'RESUME';
  dom.colon1.style.animationPlayState = 'paused';
  dom.colon2.style.animationPlayState = 'paused';
}

/** Toggle pause/resume */
function togglePause() {
  if (state.finished) return;
  // When resuming after pause, go straight to timer (no launch sequence again)
  state.running ? pauseTimer() : beginMainTimer();
}

/** Handle timer reaching zero */
function finishTimer() {
  state.finished = true;
  state.running  = false;
  cancelAnimationFrame(state.rafId);
  renderTimer(0);
  dom.timesupScreen.classList.add('active');
  dom.pauseBanner.classList.remove('visible');
  document.title = "TIME'S UP! — RYVANTA 2026";
}

/** Reset to initial or custom duration — returns to START screen */
function resetTimer(seconds) {
  const s = (typeof seconds === 'number' && seconds > 0)
    ? seconds
    : CONFIG.initialSeconds;

  cancelAnimationFrame(state.rafId);
  state.finished      = false;
  state.running       = false;
  state.started       = false;
  state.remaining     = s;
  state.totalSeconds  = s;
  state.lastTimestamp = null;

  // Dismiss any active overlay (launch screen or timesup)
  dom.timesupScreen.classList.remove('active');
  dom.launchScreen.classList.remove('active');
  dom.pauseBanner.classList.remove('visible');
  renderTimer(s);

  // Show the start screen again
  dom.startScreen.style.display = '';
  void dom.startScreen.offsetWidth;
  dom.startScreen.classList.remove('hidden');
  dom.pauseBtnIcon.textContent = '⏸';
  dom.pauseBtnText.textContent = 'PAUSE';
  dom.colon1.style.animationPlayState = 'paused';
  dom.colon2.style.animationPlayState = 'paused';
  document.title = 'RYVANTA 2026 — Countdown Timer';
}

/* ═══════════════════════════════════════════════════════════
   SPONSOR CAROUSEL
═══════════════════════════════════════════════════════════ */

function buildCarousel() {
  const track = dom.carouselTrack;
  track.innerHTML = '';

  if (!CONFIG.sponsors.length) return;

  // Build two full sets so the duplicate-set trick creates seamless loop
  const makeSet = () =>
    CONFIG.sponsors.map(src => {
      const img = document.createElement('img');
      img.src      = src;
      img.alt      = src.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      img.className = 'sponsor-logo';
      img.loading  = 'lazy';
      img.draggable = false;
      return img;
    });

  const set1 = makeSet();
  const set2 = makeSet();

  [...set1, ...set2].forEach(img => track.appendChild(img));

  // After images have loaded, measure actual track width and set animation duration
  // We wait for at least the first image to load before measuring
  const firstImg = set1[0];
  const setDuration = () => {
    // Half the track = one full set width
    const halfWidth = track.scrollWidth / 2;
    const duration  = halfWidth / CONFIG.carouselSpeed; // seconds
    track.style.setProperty('--track-width', `-${halfWidth}px`);
    track.style.animationDuration = `${duration}s`;
    // Override the @keyframes to property to use the measured value
    track.style.setProperty('--half-width', halfWidth + 'px');
    updateCarouselKeyframe(halfWidth);
  };

  if (firstImg.complete) {
    // Small delay so all images have had a chance to layout
    setTimeout(setDuration, 100);
  } else {
    firstImg.addEventListener('load', () => setTimeout(setDuration, 100));
    // Fallback: estimate even if images fail
    setTimeout(setDuration, 1500);
  }
}

/**
 * Inject a dynamic @keyframes rule that translates exactly half the
 * carousel track width — makes the loop perfectly seamless regardless
 * of how many sponsors there are.
 */
function updateCarouselKeyframe(halfWidth) {
  // Remove old dynamic rule if present
  const existingStyle = document.getElementById('carousel-keyframe-style');
  if (existingStyle) existingStyle.remove();

  const style = document.createElement('style');
  style.id = 'carousel-keyframe-style';
  style.textContent = `
    @keyframes scrollLeft {
      from { transform: translateX(0); }
      to   { transform: translateX(-${halfWidth}px); }
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════
   CONTROL PANEL  —  gear drawer toggle
═══════════════════════════════════════════════════════════ */

function toggleDrawer() {
  const open = dom.ctrlDrawer.classList.toggle('open');
  dom.gearBtn.classList.toggle('open', open);
  dom.gearBtn.setAttribute('aria-expanded', open);
}

/* ═══════════════════════════════════════════════════════════
   FULLSCREEN
═══════════════════════════════════════════════════════════ */

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn('Fullscreen request failed:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

/* ═══════════════════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════════════════ */

/* Pause / Resume button */
dom.pauseBtn.addEventListener('click', togglePause);

/* Reset button */
dom.resetBtn.addEventListener('click', () => {
  const confirmed = confirm('Reset the timer to the original duration?');
  if (confirmed) resetTimer();
});

/* Set custom duration */
dom.setDurationBtn.addEventListener('click', () => {
  const h = parseInt(dom.durationHours.value,  10) || 0;
  const m = parseInt(dom.durationMinutes.value, 10) || 0;
  const totalSecs = h * 3600 + m * 60;
  if (totalSecs <= 0) {
    alert('Please enter a valid duration (at least 1 minute).');
    return;
  }
  CONFIG.initialSeconds = totalSecs;
  resetTimer(totalSecs);
  dom.durationHours.value   = '';
  dom.durationMinutes.value = '';
  toggleDrawer();
});

/* Gear button */
dom.gearBtn.addEventListener('click', toggleDrawer);

/* Close drawer when clicking outside */
document.addEventListener('click', e => {
  if (!dom.ctrlDrawer.contains(e.target) && !dom.gearBtn.contains(e.target)) {
    dom.ctrlDrawer.classList.remove('open');
    dom.gearBtn.classList.remove('open');
  }
});

/* Fullscreen button */
dom.fullscreenBtn.addEventListener('click', toggleFullscreen);

/* Fullscreen change — update button text */
document.addEventListener('fullscreenchange', () => {
  const isFS = !!document.fullscreenElement;
  dom.fullscreenBtn.querySelector('span:last-child').textContent =
    isFS ? 'EXIT FS' : 'FULLSCREEN';
});

/* ── Keyboard shortcuts ───────────────────────────────────── */
document.addEventListener('keydown', e => {
  // Don't hijack shortcuts when typing in inputs or contenteditable
  if (e.target.tagName === 'INPUT' || e.target.contentEditable === 'true') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      // If not yet started, Space triggers START
      if (!state.started) { startTimer(); break; }
      togglePause();
      break;
    case 'KeyF':
      e.preventDefault();
      toggleFullscreen();
      break;
    case 'KeyG':
      e.preventDefault();
      toggleDrawer();
      break;
  }
});

/* ── Prevent context menu on long-press (tablet kiosk mode) ── */
document.addEventListener('contextmenu', e => e.preventDefault());

/* ── Editable pause label ──────────────────────────────────── */
// Block Enter key so it doesn't create a new line
dom.pauseLabel.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); dom.pauseLabel.blur(); }
});

// Clicking the pencil icon focuses the label
document.querySelector('.edit-hint')?.addEventListener('click', () => {
  dom.pauseLabel.focus();
  // Place cursor at end
  const range = document.createRange();
  const sel   = window.getSelection();
  range.selectNodeContents(dom.pauseLabel);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
});

/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */

(function init() {
  // Show initial time without starting the countdown
  renderTimer(state.remaining);
  // Colons start frozen until timer begins
  dom.colon1.style.animationPlayState = 'paused';
  dom.colon2.style.animationPlayState = 'paused';

  buildCarousel();

  // Wire START button
  dom.startBtn.addEventListener('click', startTimer);

  // Sync on-screen label whenever organiser types in the input
  dom.pauseMessageInput?.addEventListener('input', () => {
    if (!state.running && state.started) {
      const v = dom.pauseMessageInput.value.trim().toUpperCase();
      dom.pauseLabel.textContent = v || CONFIG.pauseMessage;
    }
  });
})();
