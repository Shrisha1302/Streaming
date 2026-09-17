/* ═══════════════════════════════════════════════════════════════
   RYVANTA 2026 — Technical Background Animation
   Canvas-based: circuit nodes, data packets, hex grid, binary rain
 ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const canvas = document.getElementById('techCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Colour palette (matches CSS vars) ──────────────────────────
  const C = {
    blue:      '#3d7fff',
    blueDim:   '#1a5fff',
    blueDeep:  '#0d2e80',
    blueFaint: 'rgba(61,127,255,0.12)',
    node:      'rgba(61,127,255,0.75)',
    line:      'rgba(26,95,255,0.18)',
    packet:    'rgba(80,150,255,0.9)',
    hex:       'rgba(61,127,255,0.045)',
    binary:    'rgba(61,127,255,0.22)',
  };

  // ── State ──────────────────────────────────────────────────────
  let W, H, raf;
  let nodes    = [];
  let packets  = [];
  let binary   = [];
  let hexGrid  = [];
  let scanLine = 0;

  // ── Resize ─────────────────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildHexGrid();
    buildBinary();
  }

  // ── Hex grid (static background layer) ────────────────────────
  function buildHexGrid() {
    hexGrid = [];
    const size = 46;          // hex radius
    const col  = size * 2;
    const row  = size * Math.sqrt(3);
    for (let y = -size; y < H + size * 2; y += row) {
      for (let x = -size; x < W + size * 2; x += col) {
        const offset = Math.floor((y / row) % 2) === 0 ? 0 : size;
        hexGrid.push({ x: x + offset, y });
      }
    }
  }

  function drawHex(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + size * Math.cos(a);
      const py = y + size * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function renderHexGrid() {
    ctx.strokeStyle = C.hex;
    ctx.lineWidth = 0.7;
    hexGrid.forEach(h => {
      drawHex(h.x, h.y, 44);
      ctx.stroke();
    });
  }

  // ── Circuit Nodes ──────────────────────────────────────────────
  const NODE_COUNT = Math.min(34, Math.floor(W * H / 42000));

  function spawnNode() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      vx:    (Math.random() - 0.5) * 0.28,
      vy:    (Math.random() - 0.5) * 0.28,
      r:     Math.random() * 2.5 + 1.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    };
  }

  function initNodes() {
    const count = Math.min(34, Math.floor(window.innerWidth * window.innerHeight / 42000));
    nodes = Array.from({ length: count }, spawnNode);
  }

  function updateNodes() {
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += n.pulseSpeed;
      if (n.x < 0) n.x = W;
      if (n.x > W) n.x = 0;
      if (n.y < 0) n.y = H;
      if (n.y > H) n.y = 0;
    });
  }

  function renderNodes() {
    const MAX_DIST = 220;
    // Draw connecting lines between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.35;
          ctx.strokeStyle = `rgba(26,95,255,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();

          // Perpendicular tick marks (circuit aesthetic)
          if (dist < 100 && Math.random() < 0.002) {
            const mx = (nodes[i].x + nodes[j].x) / 2;
            const my = (nodes[i].y + nodes[j].y) / 2;
            const nx = -dy / dist * 6;
            const ny =  dx / dist * 6;
            ctx.strokeStyle = `rgba(61,127,255,${alpha * 1.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mx - nx, my - ny);
            ctx.lineTo(mx + nx, my + ny);
            ctx.stroke();
          }
        }
      }
    }

    // Draw node dots
    nodes.forEach(n => {
      const glow = 0.6 + 0.4 * Math.sin(n.pulse);
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
      grad.addColorStop(0, `rgba(61,127,255,${glow * 0.9})`);
      grad.addColorStop(1, 'rgba(61,127,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = C.node;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ── Data Packets (move along node-to-node paths) ───────────────
  function spawnPacket() {
    if (nodes.length < 2) return;
    const a = Math.floor(Math.random() * nodes.length);
    let b = Math.floor(Math.random() * nodes.length);
    while (b === a) b = Math.floor(Math.random() * nodes.length);
    packets.push({ from: a, to: b, t: 0, speed: 0.004 + Math.random() * 0.006 });
  }

  function initPackets() {
    packets = [];
    for (let i = 0; i < 8; i++) spawnPacket();
  }

  function updatePackets() {
    packets = packets.filter(p => {
      p.t += p.speed;
      return p.t < 1;
    });
    if (packets.length < 8) spawnPacket();
  }

  function renderPackets() {
    packets.forEach(p => {
      if (p.from >= nodes.length || p.to >= nodes.length) return;
      const src = nodes[p.from];
      const dst = nodes[p.to];
      const x = src.x + (dst.x - src.x) * p.t;
      const y = src.y + (dst.y - src.y) * p.t;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
      grad.addColorStop(0, 'rgba(80,150,255,0.95)');
      grad.addColorStop(0.4, 'rgba(61,127,255,0.4)');
      grad.addColorStop(1, 'rgba(61,127,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      const trail = 6;
      for (let i = 1; i <= trail; i++) {
        const tt = Math.max(0, p.t - i * 0.018);
        const tx = src.x + (dst.x - src.x) * tt;
        const ty = src.y + (dst.y - src.y) * tt;
        const a = (1 - i / trail) * 0.25;
        ctx.fillStyle = `rgba(61,127,255,${a})`;
        ctx.beginPath();
        ctx.arc(tx, ty, 3 * (1 - i / trail), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ── Binary Rain (vertical streams) ────────────────────────────
  const BINARY_COLS = 18;

  function buildBinary() {
    binary = [];
    const spacing = W / BINARY_COLS;
    for (let i = 0; i < BINARY_COLS; i++) {
      binary.push({
        x:       spacing * i + spacing / 2,
        y:       Math.random() * -H,
        speed:   0.4 + Math.random() * 0.7,
        chars:   Array.from({ length: 18 }, () => Math.random() > 0.5 ? '1' : '0'),
        opacity: 0.08 + Math.random() * 0.14,
        size:    10 + Math.floor(Math.random() * 6),
        gap:     18 + Math.floor(Math.random() * 8),
      });
    }
  }

  function updateBinary() {
    binary.forEach(col => {
      col.y += col.speed;
      // Randomly flip a char to simulate data stream
      if (Math.random() < 0.04) {
        const idx = Math.floor(Math.random() * col.chars.length);
        col.chars[idx] = col.chars[idx] === '1' ? '0' : '1';
      }
      if (col.y > H + col.chars.length * col.gap) {
        col.y = -col.chars.length * col.gap;
        col.x = (Math.random() * W);
        col.speed = 0.4 + Math.random() * 0.7;
      }
    });
  }

  function renderBinary() {
    ctx.font = `${binary[0]?.size || 12}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    binary.forEach(col => {
      col.chars.forEach((ch, i) => {
        const fade = i === 0 ? 1 : (1 - i / col.chars.length);
        ctx.fillStyle = `rgba(61,127,255,${col.opacity * fade})`;
        ctx.font = `${col.size}px 'Courier New', monospace`;
        ctx.fillText(ch, col.x, col.y + i * col.gap);
      });
    });
  }

  // ── Horizontal scan line sweep ─────────────────────────────────
  function renderScanSweep() {
    scanLine = (scanLine + 0.4) % H;
    const grad = ctx.createLinearGradient(0, scanLine - 60, 0, scanLine + 4);
    grad.addColorStop(0, 'rgba(61,127,255,0)');
    grad.addColorStop(0.85, 'rgba(61,127,255,0.03)');
    grad.addColorStop(1, 'rgba(61,127,255,0.07)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanLine - 60, W, 64);
  }

  // ── Corner circuit decorations ─────────────────────────────────
  function renderCornerDecor() {
    const L = 70;
    const T = 3;
    const corners = [
      { x: 24, y: 24, dx: 1, dy: 1 },
      { x: W - 24, y: 24, dx: -1, dy: 1 },
      { x: 24, y: H - 24, dx: 1, dy: -1 },
      { x: W - 24, y: H - 24, dx: -1, dy: -1 },
    ];
    ctx.strokeStyle = 'rgba(61,127,255,0.4)';
    ctx.lineWidth = T;
    ctx.lineCap = 'round';
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * L);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx * L, c.y);
      ctx.stroke();

      // Small inner tick
      ctx.strokeStyle = 'rgba(61,127,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x + c.dx * 18, c.y);
      ctx.lineTo(c.x + c.dx * 18, c.y + c.dy * 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * 18);
      ctx.lineTo(c.x + c.dx * 10, c.y + c.dy * 18);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(61,127,255,0.4)';
      ctx.lineWidth = T;
    });
  }

  // ── Main loop ──────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    renderHexGrid();
    renderBinary();
    renderNodes();
    renderPackets();
    renderScanSweep();
    renderCornerDecor();

    updateNodes();
    updatePackets();
    updateBinary();

    raf = requestAnimationFrame(draw);
  }

  // ── Boot ───────────────────────────────────────────────────────
  function init() {
    resize();
    initNodes();
    initPackets();
    draw();
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    initNodes();
    initPackets();
    draw();
  });

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
