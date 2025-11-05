// Background rain particles
// Creates a fixed full-screen canvas and renders crisp, subtle falling lines.
(function () {
  const ENABLED = true;
  if (!ENABLED) return;

  // Avoid double init
  if (document.getElementById('bg-canvas')) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    // Canvas not supported
    return;
  }

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const state = {
    w: 0,
    h: 0,
    drops: [],
    lastTime: 0,
    running: !prefersReducedMotion,
  };

  // Determine drop count based on viewport area
  function targetCount() {
    const area = state.w * state.h;
    // Rain density: ~1 drop per 18k px, clamped to keep perf nice
    const base = Math.round(area / 18000);
    return Math.max(80, Math.min(220, base));
  }

  function resize() {
    const { innerWidth, innerHeight } = window;
    state.w = innerWidth;
    state.h = innerHeight;

    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(state.w * dpr);
    canvas.height = Math.floor(state.h * dpr);
    canvas.style.width = state.w + 'px';
    canvas.style.height = state.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Adjust drop count smoothly
    const desired = targetCount();
    const diff = desired - state.drops.length;
    if (diff > 0) addDrops(diff);
    else if (diff < 0) state.drops.splice(desired);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function addDrops(n) {
    for (let i = 0; i < n; i++) {
      const len = rand(8, 22); // length of the streak
      const speed = rand(0.18, 0.55); // vy px per ms
      const wind = rand(-0.05, 0.05); // vx px per ms
      const thickness = rand(0.75, 1.75);
      const alpha = rand(0.08, 0.20);
      state.drops.push({
        x: rand(0, state.w),
        y: rand(-state.h, state.h),
        len,
        speed,
        wind,
        thickness,
        alpha
      });
    }
  }

  function drawDrop(d) {
    ctx.strokeStyle = `rgba(255,255,255,${d.alpha})`;
    ctx.lineWidth = d.thickness;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.wind * 16, d.y + d.len);
    ctx.stroke();
  }

  function step(now) {
    if (!state.running) return; // paused for reduced motion

    const dt = state.lastTime ? Math.min(32, now - state.lastTime) : 16;
    state.lastTime = now;

    ctx.clearRect(0, 0, state.w, state.h);
    ctx.lineCap = 'round';

    for (const d of state.drops) {
      d.x += d.wind * dt;
      d.y += d.speed * dt;

      // wrap from bottom to top with slight randomization
      if (d.y - d.len > state.h + 4) {
        d.y = -rand(0, state.h * 0.3);
        d.x = rand(0, state.w);
        d.len = rand(8, 22);
        d.speed = rand(0.18, 0.55);
        d.wind = rand(-0.05, 0.05);
        d.thickness = rand(0.75, 1.75);
        d.alpha = rand(0.08, 0.20);
      }
      // wrap horizontally if drifting off-screen
      if (d.x < -10) d.x = state.w + 10;
      else if (d.x > state.w + 10) d.x = -10;

      drawDrop(d);
    }
    requestAnimationFrame(step);
  }

  // If reduced motion is preferred, render a static frame only
  function renderStatic() {
    ctx.clearRect(0, 0, state.w, state.h);
    ctx.lineCap = 'round';
    for (const d of state.drops) drawDrop(d);
  }

  // Init
  resize();
  addDrops(targetCount());

  if (state.running) requestAnimationFrame(step);
  else renderStatic();

  // Events
  window.addEventListener('resize', () => {
    resize();
    if (!state.running) renderStatic();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return; // rAF auto-throttles; nothing to do
    if (state.running) {
      state.lastTime = performance.now();
    }
  });
})();
