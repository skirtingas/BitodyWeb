// Background floating dust
// Creates a fixed full-screen canvas and renders small circles/squares
// drifting down slowly. Tuned to stay visible behind ~5px backdrop blur.
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
    dust: [],
    lastTime: 0,
    running: !prefersReducedMotion,
  };

  // Determine particle count based on viewport area
  function targetCount() {
    const area = state.w * state.h;
    // Larger circles: lower density ~1 per 60k px, clamped
    const base = Math.round(area / 60000);
    return Math.max(30, Math.min(90, base));
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

    // Adjust particle count smoothly
    const desired = targetCount();
    const diff = desired - state.dust.length;
    if (diff > 0) addDust(diff);
    else if (diff < 0) state.dust.splice(desired);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function addDust(n) {
    for (let i = 0; i < n; i++) {
      const r = rand(3.5, 7.0); // radius in px (diameter 7–14px)
      // Slower float
      const vy = rand(0.003, 0.01) + r * 0.001; // px per ms
      const vx = rand(-0.015, 0.015); // px per ms
      // Less visible (lower alpha), still readable under blur
      const alphaBase = 0.14 - (r - 3.5) * 0.007; // adjusted for particle size
      const alpha = Math.max(0.06, Math.min(0.16, alphaBase + rand(-0.02, 0.02)));
      state.dust.push({
        x: rand(0, state.w),
        y: rand(-state.h, state.h),
        r,
        vx,
        vy,
        alpha,
      });
    }
  }

  function drawDust(p) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function step(now) {
    if (!state.running) return; // paused for reduced motion

    const dt = state.lastTime ? Math.min(32, now - state.lastTime) : 16;
    state.lastTime = now;

    ctx.clearRect(0, 0, state.w, state.h);
    for (const p of state.dust) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // wrap from bottom to top with slight randomization
      if (p.y - p.r > state.h + 2) {
        p.y = -rand(0, state.h * 0.2);
        p.x = rand(0, state.w);
        p.r = rand(3.5, 7.0);
        p.vy = rand(0.003, 0.01) + p.r * 0.001;
        p.vx = rand(-0.015, 0.015);
        const alphaBase = 0.14 - (p.r - 3.5) * 0.007;
        p.alpha = Math.max(0.06, Math.min(0.16, alphaBase + rand(-0.02, 0.02)));
      }
      // wrap horizontally if drifting off-screen
      if (p.x < -14) p.x = state.w + 14;
      else if (p.x > state.w + 14) p.x = -14;

      drawDust(p);
    }
    requestAnimationFrame(step);
  }

  // If reduced motion is preferred, render a static frame only
  function renderStatic() {
    ctx.clearRect(0, 0, state.w, state.h);
    for (const p of state.dust) drawDust(p);
  }

  // Init
  resize();
  addDust(targetCount());

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
