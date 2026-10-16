// Движок дыхательной сессии: фазы, таймер, прогресс.
// Время считается по часам (performance.now), а не по кадрам — так сессия
// не «замирает», если requestAnimationFrame троттлится. Кадры только для анимации,
// плюс сторожевой интервал для надёжности.
import { TG } from './telegram.js?v38';

export const PHASES = {
  INHALE: { key: 'INHALE', label: 'Вдох' },
  HOLD_IN: { key: 'HOLD_IN', label: 'Задержка' },
  EXHALE: { key: 'EXHALE', label: 'Выдох' },
  HOLD_OUT: { key: 'HOLD_OUT', label: 'Задержка' },
};

function buildSequence(p) {
  const seq = [];
  if (p.inhaleSec > 0) seq.push({ phase: 'INHALE', dur: p.inhaleSec });
  if (p.holdInSec > 0) seq.push({ phase: 'HOLD_IN', dur: p.holdInSec });
  if (p.exhaleSec > 0) seq.push({ phase: 'EXHALE', dur: p.exhaleSec });
  if (p.holdOutSec > 0) seq.push({ phase: 'HOLD_OUT', dur: p.holdOutSec });
  return seq;
}

export class BreathSession {
  constructor(pattern, minutes, handlers = {}) {
    this.pattern = pattern;
    this.totalSec = minutes * 60;
    this.seq = buildSequence(pattern);
    this.cycleSec = this.seq.reduce((s, x) => s + x.dur, 0) || 1;
    this.handlers = handlers; // { onTick, onPhase, onDone }
    this.paused = false;
    this.running = false;
    this._startTs = 0;
    this._pausedAt = 0;
    this._pausedTotal = 0;
    this._lastPhase = null;
    this._raf = null;
    this._timer = null;
  }

  start() {
    this.running = true;
    this._startTs = performance.now();
    this._pausedAt = 0;
    this._pausedTotal = 0;
    this._tick();
    const frame = () => {
      if (!this.running) return;
      this._tick();
      this._raf = requestAnimationFrame(frame);
    };
    this._raf = requestAnimationFrame(frame);
    // Сторожевой интервал: гарантирует ход времени, даже если кадров нет.
    this._timer = setInterval(() => { if (this.running) this._tick(); }, 200);
  }

  elapsedSec() {
    if (!this.running) return this._frozen != null ? this._frozen : 0;
    const now = performance.now();
    let e = (now - this._startTs - this._pausedTotal) / 1000;
    if (this.paused && this._pausedAt) e -= (now - this._pausedAt) / 1000;
    return Math.max(0, e);
  }

  get elapsed() { return this.elapsedSec(); }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this._pausedAt = performance.now();
  }
  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this._pausedTotal += performance.now() - this._pausedAt;
    this._pausedAt = 0;
  }
  toggle() {
    this.paused ? this.resume() : this.pause();
    return this.paused;
  }

  stop() {
    if (!this.running) return;
    this._frozen = this.elapsedSec();
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._timer) clearInterval(this._timer);
    this._raf = null;
    this._timer = null;
  }

  _tick() {
    if (!this.running) return;
    const sec = this.elapsedSec();
    if (sec >= this.totalSec) {
      this._emit(this.totalSec, true);
      this.stop();
      if (this.handlers.onDone) this.handlers.onDone(this.summary());
      return;
    }
    this._emit(sec, false);
  }

  _emit(elapsedSec, done) {
    const inCycle = elapsedSec % this.cycleSec;
    let acc = 0, cur = this.seq[0], local = 0;
    for (const s of this.seq) {
      if (inCycle < acc + s.dur) { cur = s; local = inCycle - acc; break; }
      acc += s.dur;
    }
    // масштаб шара
    let scale = 0.6;
    const t = cur.dur > 0 ? local / cur.dur : 1;
    if (cur.phase === 'INHALE') scale = 0.6 + 0.4 * t;
    else if (cur.phase === 'HOLD_IN') scale = 1.0;
    else if (cur.phase === 'EXHALE') scale = 1.0 - 0.4 * t;
    else scale = 0.6;

    if (cur.phase !== this._lastPhase) {
      this._lastPhase = cur.phase;
      TG.haptic('impact', cur.phase === 'INHALE' ? 'medium' : 'light');
      if (this.handlers.onPhase) this.handlers.onPhase(PHASES[cur.phase], cur.dur);
    }

    const cycles = Math.floor(elapsedSec / this.cycleSec);
    const cycleProgress = this.cycleSec > 0 ? (elapsedSec % this.cycleSec) / this.cycleSec : 0;
    if (this.handlers.onTick) {
      this.handlers.onTick({
        phase: PHASES[cur.phase],
        phaseKey: cur.phase,
        phaseLeft: Math.max(0, Math.ceil(cur.dur - local)),
        phaseProgress: cur.dur > 0 ? Math.min(1, Math.max(0, local / cur.dur)) : 1,
        cycleProgress,
        scale,
        remaining: Math.max(0, this.totalSec - elapsedSec),
        elapsed: elapsedSec,
        cycles,
        paused: this.paused,
        progress: this.totalSec > 0 ? elapsedSec / this.totalSec : 1,
        done,
      });
    }
  }

  summary() {
    return {
      patternId: this.pattern.id,
      patternName: this.pattern.name,
      minutes: Math.max(1, Math.round(this.totalSec / 60)),
      cycles: Math.floor(this.totalSec / this.cycleSec),
    };
  }
}

export function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
