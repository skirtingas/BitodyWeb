// Subtle glowing particles background
// Creates a fixed full-screen canvas and renders slow-moving soft glows.
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
    particles: [],
    lastTime: 0,
    running: !prefersReducedMotion,
  };

  // Determine particle count based on viewport area
  function targetCount() {
    const area = state.w * state.h;
    // Rough density: ~1 particle per 30k-60k pixels, clamped
    const base = Math.round(area / 45000);
    return Math.max(20, Math.min(80, base));
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
    const diff = desired - state.particles.length;
    if (diff > 0) addParticles(diff);
    else if (diff < 0) state.particles.splice(desired);
  }

  // Palette: subtle cool whites
  const COLORS = [
    'rgba(255,255,255,0.06)',
    'rgba(255,255,255,0.04)',
    'rgba(255,255,255,0.03)'
  ];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function addParticles(n) {
    for (let i = 0; i < n; i++) {
      const r = rand(40, 140); // radius of glow
      const speed = rand(0.02, 0.08); // px per ms
      const angle = rand(0, Math.PI * 2);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      state.particles.push({
        x: rand(-r, state.w + r),
        y: rand(-r, state.h + r),
        r,
        vx,
        vy,
        color: COLORS[Math.floor(rand(0, COLORS.length))],
      });
    }
  }

  function drawParticle(p) {
    // Soft radial gradient glow
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    // inner brighter, outer fades to 0
    g.addColorStop(0, p.color);
    g.addColorStop(0.2, p.color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function step(now) {
    if (!state.running) return; // paused for reduced motion

    const dt = state.lastTime ? Math.min(32, now - state.lastTime) : 16;
    state.lastTime = now;

    ctx.clearRect(0, 0, state.w, state.h);

    // Blend glows additively but keep it subtle
    ctx.globalCompositeOperation = 'lighter';

    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // gentle wrap-around with padding
      const pad = p.r * 1.2;
      if (p.x < -pad) p.x = state.w + pad;
      else if (p.x > state.w + pad) p.x = -pad;
      if (p.y < -pad) p.y = state.h + pad;
      else if (p.y > state.h + pad) p.y = -pad;

      drawParticle(p);
    }

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(step);
  }

  // If reduced motion is preferred, render a static frame only
  function renderStatic() {
    ctx.clearRect(0, 0, state.w, state.h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of state.particles) drawParticle(p);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Init
  resize();
  addParticles(targetCount());

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
