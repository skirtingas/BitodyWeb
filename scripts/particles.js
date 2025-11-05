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
    // Dust density: ~1 per 24k px, clamped
    const base = Math.round(area / 24000);
    return Math.max(70, Math.min(200, base));
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
      const size = rand(2.0, 4.6); // px, large enough to survive 5px blur
      const vy = rand(0.02, 0.08); // downward px per ms (slow float)
      const vx = rand(-0.03, 0.03); // slight horizontal drift
      const alpha = rand(0.18, 0.35); // a bit stronger so blur won't erase it
      const shape = Math.random() < 0.6 ? 'circle' : 'square';
      state.dust.push({
        x: rand(0, state.w),
        y: rand(-state.h, state.h),
        size,
        vx,
        vy,
        alpha,
        shape,
      });
    }
  }

  function drawDust(p) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#ffffff';
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // axis-aligned small square
      const s = p.size;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
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
      if (p.y - p.size / 2 > state.h + 2) {
        p.y = -rand(0, state.h * 0.2);
        p.x = rand(0, state.w);
        p.size = rand(2.0, 4.6);
        p.vy = rand(0.02, 0.08);
        p.vx = rand(-0.03, 0.03);
        p.alpha = rand(0.18, 0.35);
        p.shape = Math.random() < 0.6 ? 'circle' : 'square';
      }
      // wrap horizontally if drifting off-screen
      if (p.x < -6) p.x = state.w + 6;
      else if (p.x > state.w + 6) p.x = -6;

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
