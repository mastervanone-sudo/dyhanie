// Движок дыхательной сессии: фазы, таймер, прогресс.
import { TG } from './telegram.js';

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
    this.cycleSec = this.seq.reduce((s, x) => s + x.dur, 0);
    this.handlers = handlers; // { onTick, onPhase, onDone }
    this.elapsed = 0;
    this.paused = false;
    this.running = false;
    this._lastPhase = null;
    this._lastTs = 0;
    this._raf = null;
  }

  start() {
    this.running = true;
    this._lastTs = performance.now();
    this._loop(this._lastTs);
  }

  pause() {
    this.paused = true;
  }
  resume() {
    if (!this.running) return;
    this.paused = false;
    this._lastTs = performance.now();
  }
  toggle() {
    this.paused ? this.resume() : this.pause();
    return this.paused;
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _loop(ts) {
    if (!this.running) return;
    const dt = (ts - this._lastTs) / 1000;
    this._lastTs = ts;
    if (!this.paused) {
      this.elapsed += dt;
      if (this.elapsed >= this.totalSec) {
        this.elapsed = this.totalSec;
        this._emit(true);
        this.stop();
        if (this.handlers.onDone) this.handlers.onDone(this.summary());
        return;
      }
      this._emit(false);
    }
    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  _emit(done) {
    const inCycle = this.elapsed % this.cycleSec;
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
      if (this.handlers.onPhase) this.handlers.onPhase(PHASES[cur.phase]);
    }

    const cycles = Math.floor(this.elapsed / this.cycleSec);
    if (this.handlers.onTick) {
      this.handlers.onTick({
        phase: PHASES[cur.phase],
        phaseLeft: Math.max(0, Math.ceil(cur.dur - local)),
        scale,
        remaining: Math.max(0, this.totalSec - this.elapsed),
        cycles,
        paused: this.paused,
        progress: this.elapsed / this.totalSec,
        done,
      });
    }
  }

  summary() {
    return {
      patternId: this.pattern.id,
      patternName: this.pattern.name,
      minutes: Math.max(1, Math.round(this.totalSec / 60)),
      cycles: Math.floor(this.elapsed / this.cycleSec),
    };
  }
}

export function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
