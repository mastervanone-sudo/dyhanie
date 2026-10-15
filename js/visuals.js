// Космический визуальный слой для экрана практики.
// Canvas 2D: звёздное поле с параллаксом, туманность в цвете фазы,
// рябь и частицы, реагирующие на музыку (данные из WebAudio-анализатора).
// Полностью опционально: уровень эффектов off / low / medium / high.

const PRESETS = {
  off: { stars: 0, particles: 0, ripples: false, react: 0, glow: 0 },
  low: { stars: 70, particles: 0, ripples: false, react: 0.35, glow: 0.45 },
  medium: { stars: 130, particles: 16, ripples: true, react: 0.7, glow: 0.85 },
  high: { stars: 210, particles: 26, ripples: true, react: 1.0, glow: 1.0 },
};

export const VISUAL_LEVELS = ['off', 'low', 'medium', 'high'];
export const VISUAL_LABELS = { off: 'Выкл', low: 'Слабо', medium: 'Средне', high: 'Наглядно' };

function hexToRgb(hex) {
  const h = (hex || '#2fb8a6').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

class Visuals {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.orbEl = null;
    this.getCenter = null;
    this.intensity = 'medium';
    this.sampler = () => ({ bass: 0, mid: 0, treble: 0, level: 0 });
    this.phaseColor = '#2fb8a6';
    this.running = false;
    this._raf = 0;
    this._bound = (ts) => this._frame(ts);
    this.t = 0;
    this._last = 0;
    this.W = 0;
    this.H = 0;
    this.stars = [];
    this.particles = [];
    this.ripples = [];
    this._bassSmooth = 0;
    this._lastSpawn = 0;
    this._reduce = false;
    try { this._reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  }

  preset() { return PRESETS[this.intensity] || PRESETS.medium; }

  attach(canvas, orbEl, getCenter) {
    this.canvas = canvas;
    this.ctx = canvas.getContext ? canvas.getContext('2d') : null;
    this.orbEl = orbEl || null;
    this.getCenter = getCenter || null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    if (w !== this.W || h !== this.H || !this.stars.length) {
      this.W = w; this.H = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._initField();
    }
  }

  _initField() {
    const p = this.preset();
    this.stars = [];
    for (let i = 0; i < p.stars; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        z: Math.random() * 0.8 + 0.2,
        tw: Math.random() * Math.PI * 2,
      });
    }
    this.particles = [];
    for (let i = 0; i < p.particles; i++) {
      this.particles.push({
        ang: Math.random() * Math.PI * 2,
        spd: (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1),
        base: Math.random() * 40 + 10,
        size: Math.random() * 1.6 + 0.8,
        band: Math.random(),
        ph: Math.random() * Math.PI * 2,
      });
    }
    this.ripples = [];
  }

  setIntensity(level) {
    let lv = VISUAL_LEVELS.includes(level) ? level : 'medium';
    if (this._reduce && (lv === 'high' || lv === 'medium')) lv = 'low';
    this.intensity = lv;
    if (this.canvas) this.canvas.style.display = lv === 'off' ? 'none' : 'block';
    this._initField();
  }

  setSampler(fn) { this.sampler = fn || this.sampler; }
  setPhase(color) { this.phaseColor = color || this.phaseColor; }

  start() {
    if (this.intensity === 'off' || !this.ctx) return;
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._bound);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._clearGlow();
  }

  _clearGlow() {
    if (this.orbEl) { try { this.orbEl.style.boxShadow = ''; } catch (e) {} }
  }

  _frame(ts) {
    if (!this.running) return;
    if (document.hidden) { this._raf = requestAnimationFrame(this._bound); return; }
    let dt = (ts - this._last) / 1000;
    this._last = ts;
    if (!isFinite(dt) || dt < 0) dt = 0.016;
    dt = Math.min(dt, 0.05);
    this.t += dt;
    this._draw(dt);
    this._raf = requestAnimationFrame(this._bound);
  }

  _center() {
    if (this.getCenter) { try { const c = this.getCenter(); if (c) return c; } catch (e) {} }
    return { x: this.W / 2, y: this.H / 2, r: 120 };
  }

  _draw(dt) {
    const ctx = this.ctx, p = this.preset();
    if (!ctx) return;
    const L = this.sampler() || { bass: 0, mid: 0, treble: 0, level: 0 };
    this._bassSmooth += (L.bass - this._bassSmooth) * 0.18;
    const react = p.react;
    const c = this._center();
    const rgb = hexToRgb(this.phaseColor);
    const col = (a) => `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;

    ctx.clearRect(0, 0, this.W, this.H);
    ctx.globalCompositeOperation = 'lighter';

    // туманность вокруг орба (дышит с музыкой)
    const glowR = c.r * (2.4 + 0.9 * this._bassSmooth * react);
    const g = ctx.createRadialGradient(c.x, c.y, c.r * 0.4, c.x, c.y, glowR);
    g.addColorStop(0, col((0.05 + 0.18 * L.level * react) * p.glow + 0.03));
    g.addColorStop(0.5, col((0.02 + 0.08 * L.mid * react) * p.glow));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2); ctx.fill();

    // звёзды с параллаксом и мерцанием
    const bright = 0.55 + 0.7 * L.treble * react;
    for (const s of this.stars) {
      const px = s.x + Math.sin(this.t * 0.05 + s.tw) * 6 * s.z;
      const py = s.y - (this.t * 6 * s.z) % (this.H + 40);
      const yy = ((py % (this.H + 40)) + (this.H + 40)) % (this.H + 40) - 20;
      s.tw += dt * (0.5 + s.z);
      const a = (0.25 + 0.55 * Math.abs(Math.sin(s.tw))) * bright;
      ctx.fillStyle = `rgba(224,247,255,${Math.min(1, a)})`;
      ctx.beginPath(); ctx.arc(px, yy, s.size || (0.6 + s.z * 1.2), 0, Math.PI * 2); ctx.fill();
    }

    // рябь от басовых ударов
    if (p.ripples && L.bass > 0.5 && this.t - this._lastSpawn > 0.35) {
      this._lastSpawn = this.t;
      this.ripples.push({ r: c.r * 0.9, max: c.r * 2.2, a: 0.5, spd: c.r * 1.4 });
    }
    for (const rp of this.ripples) {
      rp.r += rp.spd * dt;
      rp.a -= dt * 0.7;
    }
    this.ripples = this.ripples.filter((rp) => rp.a > 0.02 && rp.r < rp.max);
    for (const rp of this.ripples) {
      ctx.strokeStyle = col(Math.max(0, rp.a));
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, rp.r, 0, Math.PI * 2); ctx.stroke();
    }

    // частицы, танцующие вокруг орба под спектр
    for (const q of this.particles) {
      q.ang += q.spd * dt * (1 + L.mid * react);
      const band = q.band < 0.4 ? L.bass : q.band < 0.75 ? L.mid : L.treble;
      const radius = c.r + q.base + band * 70 * react + Math.sin(this.t * 2 + q.ph) * 5;
      const x = c.x + Math.cos(q.ang) * radius;
      const y = c.y + Math.sin(q.ang) * radius * 0.92;
      const a = (0.25 + 0.6 * band) * p.glow;
      ctx.fillStyle = `rgba(198,240,235,${Math.min(0.95, a)})`;
      ctx.beginPath(); ctx.arc(x, y, q.size + band * 1.6, 0, Math.PI * 2); ctx.fill();
    }

    // энергетическое кольцо-оболочка (музыка «на шарике»)
    const ringA = 0.10 + 0.55 * L.level * react;
    ctx.strokeStyle = col(ringA);
    ctx.lineWidth = 2 + 3 * this._bassSmooth * react;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r * (1.06 + 0.06 * L.bass * react), 0, Math.PI * 2); ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';

    // реактивное свечение самого орба
    if (this.orbEl) {
      const spread = 30 + 70 * this._bassSmooth * react + 20 * L.level * react;
      const alpha = 0.25 + 0.45 * L.level * react;
      this.orbEl.style.boxShadow = `0 0 ${spread.toFixed(0)}px ${col(alpha * p.glow)}`;
    }
  }
}

export const OrbVisuals = new Visuals();
