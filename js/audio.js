// Аудио-движок: музыка (HTMLAudio), сольфеджио и звук дыхания (WebAudio),
// голосовые подсказки и метроном. Порт BreathAudioEngine + SolfeggioEngine +
// SampleBreathSoundEngine из нативного приложения.
// Всё звучание проходит через master-узел, с которого снимается спектр для
// визуализации орба (аудио-реакция).
import { MusicLibrary } from './music.js?v19';

const CUES = {
  voice_inhale: 'audio/cues/voice_inhale.ogg',
  voice_hold: 'audio/cues/voice_hold.ogg',
  voice_exhale: 'audio/cues/voice_exhale.ogg',
  metronome_tick: 'audio/cues/metronome_tick.ogg',
  metronome_accent: 'audio/cues/metronome_accent.ogg',
};

// Характеры дыхания — как BreathVariants.kt.
export const BREATH_VARIANTS = [
  {
    id: 'recorded2', title: 'Запись 2', subtitle: 'Дыхание из аудио (вариант 2)',
    inFull: 'audio/breath/breath_in2.ogg', outFull: 'audio/breath/breath_out2.ogg',
    inLoop: 'audio/breath/breath_in2_loop.ogg', outLoop: 'audio/breath/breath_out2_loop.ogg',
  },
  {
    id: 'recorded', title: 'Запись 1', subtitle: 'Дыхание из аудио (вариант 1)',
    inFull: 'audio/breath/breath_in.ogg', outFull: 'audio/breath/breath_out.ogg',
    inLoop: 'audio/breath/breath_in_loop.ogg', outLoop: 'audio/breath/breath_out_loop.ogg',
  },
];

export function breathVariantById(id) {
  return BREATH_VARIANTS.find((v) => v.id === id) || BREATH_VARIANTS[0];
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this._breathSrc = null;

    // музыка
    this.el = null;
    this.musicOn = true;
    this.musicVolume = 1.0;
    this.trackId = MusicLibrary.default.id;
    this.playlistMode = false;
    this.playlistIds = MusicLibrary.ids();
    this.playlistIndex = 0;
    this.playing = false;

    // дыхание
    this.breathOn = true;
    this.breathVolume = 0.8;
    this.breathVariant = 'recorded2';

    // голос и метроном
    this.voiceOn = true;
    this.metronomeOn = false;

    // сольфеджио
    this.solfeggioOn = true;
    this.solfeggioHz = 528;
    this.solfeggioVolume = 0.35;

    // бинауральные ритмы
    this.binauralOn = false;
    this.binauralHz = 10;
    this.binauralVolume = 0.3;

    this.running = false; // сессия идёт (не пауза)
  }

  // ---------- инициализация ----------
  initMusic() {
    if (this.el) return;
    const el = new window.Audio();
    el.preload = 'auto';
    el.loop = true;
    el.src = MusicLibrary.url(this.trackId);
    el.volume = this.musicOn ? this.musicVolume : 0;
    el.addEventListener('ended', () => this._advancePlaylist());
    this.el = el;
    this._connectMusicSource();
  }

  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      // Микшер: всё звучание идёт через master -> destination, а анализатор
      // снимает спектр для визуализации орба.
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      try {
        const an = this.ctx.createAnalyser();
        an.fftSize = 256;
        an.smoothingTimeConstant = 0.75;
        this.master.connect(an);
        this.analyser = an;
        this._freq = new Uint8Array(an.frequencyBinCount);
      } catch (e) {}
    }
    if (this.ctx.state === 'suspended') {
      try { const p = this.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    }
    this._connectMusicSource();
    return this.ctx;
  }

  _out() { return this.master || (this.ctx ? this.ctx.destination : null); }

  _connectMusicSource() {
    if (this._musicSrc || !this.el || !this.ctx || !this.master) return;
    try {
      this._musicSrc = this.ctx.createMediaElementSource(this.el);
      this._musicSrc.connect(this.master);
    } catch (e) { this._musicSrc = null; }
  }

  // Спектр для визуализации: бас/середина/верх и общая громкость (0..1).
  getLevels() {
    if (!this.analyser || !this._freq) return { bass: 0, mid: 0, treble: 0, level: 0 };
    try { this.analyser.getByteFrequencyData(this._freq); } catch (e) { return { bass: 0, mid: 0, treble: 0, level: 0 }; }
    const n = this._freq.length;
    const avg = (a, b) => {
      let s = 0, c = 0;
      for (let i = a; i < b; i++) { s += this._freq[i]; c++; }
      return (c ? s / c : 0) / 255;
    };
    const bass = avg(0, Math.max(1, Math.floor(n * 0.13)));
    const mid = avg(Math.floor(n * 0.13), Math.floor(n * 0.45));
    const treble = avg(Math.floor(n * 0.45), n);
    const level = Math.min(1, bass * 0.6 + mid * 0.3 + treble * 0.1);
    return { bass, mid, treble, level };
  }

  // Разблокировка аудио по жесту пользователя (вызывать из обработчика тапа).
  unlock() {
    this.ensureCtx();
    this.initMusic();
  }

  async _loadBuffer(url) {
    if (this.buffers[url]) return this.buffers[url];
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      this.buffers[url] = buf;
      return buf;
    } catch (e) { return null; }
  }

  async preloadVariant(id) {
    const v = breathVariantById(id);
    await Promise.all([v.inFull, v.outFull, v.inLoop, v.outLoop].map((u) => this._loadBuffer(u)));
  }

  // ---------- музыка ----------
  setTrack(id) {
    this.trackId = id;
    if (!this.playlistMode && this.el) {
      this.el.src = MusicLibrary.url(id);
      this.el.load();
      if (this.playing && this.musicOn) this.el.play().catch(() => {});
    }
  }

  setPlaylistIds(ids) {
    this.playlistIds = ids.length ? ids : MusicLibrary.ids();
  }

  setPlaylistMode(on) {
    if (this.playlistMode === on) return;
    this.playlistMode = on;
    this.playlistIndex = 0;
    if (!this.el) return;
    if (on) {
      this.el.loop = false;
      this.el.src = MusicLibrary.url(this.playlistIds[0]);
      this.el.load();
    } else {
      this.el.loop = true;
      this.el.src = MusicLibrary.url(this.trackId);
      this.el.load();
    }
    if (this.playing && this.musicOn) this.el.play().catch(() => {});
  }

  _advancePlaylist() {
    if (!this.playlistMode) return;
    this.playlistIndex = (this.playlistIndex + 1) % this.playlistIds.length;
    this.el.src = MusicLibrary.url(this.playlistIds[this.playlistIndex]);
    this.el.load();
    if (this.musicOn) this.el.play().catch(() => {});
  }

  currentTrackIndex() { return this.playlistMode ? this.playlistIndex : 0; }

  setMusic(on) {
    this.musicOn = on;
    if (this.el) this.el.volume = on ? this.musicVolume : 0;
    if (on && this.running) this.startMusic(); else if (!on) this.pauseMusic();
  }

  setMusicVolume(v) {
    this.musicVolume = Math.min(1, Math.max(0, v));
    if (this.el) this.el.volume = this.musicOn ? this.musicVolume : 0;
  }

  startMusic() {
    this.initMusic();
    this.playing = true;
    if (this.musicOn) this.el.play().catch(() => {});
  }
  pauseMusic() { if (this.el) this.el.pause(); }
  stopMusic() { if (this.el) { this.el.pause(); this.el.currentTime = 0; } }
  restartMusic() { if (this.el) { this.el.currentTime = 0; if (this.musicOn && this.running) this.el.play().catch(() => {}); } }

  // ---------- сольфеджио ----------
  _ensureSolf() {
    if (this._solf) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this._out());
    const mults = [1, 2, 3];
    const amps = [1, 0.22, 0.10];
    const oscs = mults.map((mult, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const g = ctx.createGain();
      g.gain.value = amps[i] * 0.16;
      o.connect(g); g.connect(gain);
      o.start();
      return o;
    });
    this._solf = { gain, oscs };
    this._applySolfFreq();
    this._applySolfGain();
  }

  _applySolfFreq() {
    if (!this._solf || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._solf.oscs.forEach((o, i) => o.frequency.setTargetAtTime(this.solfeggioHz * (i + 1), now, 0.06));
  }

  _applySolfGain() {
    if (!this._solf || !this.ctx) return;
    const target = (this.solfeggioOn && this.running) ? this.solfeggioVolume : 0;
    this._solf.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
  }

  setSolfeggio(on) { this.solfeggioOn = on; this._ensureSolf(); this._applySolfGain(); }
  setSolfeggioHz(hz) { this.solfeggioHz = hz; this._applySolfFreq(); }
  setSolfeggioVolume(v) { this.solfeggioVolume = Math.min(1, Math.max(0, v)); this._applySolfGain(); }

  // ---------- бинауральные ритмы ----------
  // Базовый тон ~200 Гц; в левое ухо идёт f - ritm/2, в правое — f + ritm/2.
  _ensureBinaural() {
    if (this._bin) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this._out());
    const make = (pan) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const g = ctx.createGain();
      g.gain.value = 0.5;
      o.connect(g);
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        g.connect(p); p.connect(gain);
      } else {
        g.connect(gain);
      }
      o.start();
      return o;
    };
    const left = make(-1);
    const right = make(1);
    this._bin = { gain, left, right };
    this._applyBinauralFreq();
    this._applyBinauralGain();
  }

  _applyBinauralFreq() {
    if (!this._bin || !this.ctx) return;
    const base = 200, half = this.binauralHz / 2, now = this.ctx.currentTime;
    this._bin.left.frequency.setTargetAtTime(base - half, now, 0.1);
    this._bin.right.frequency.setTargetAtTime(base + half, now, 0.1);
  }

  _applyBinauralGain() {
    if (!this._bin || !this.ctx) return;
    const target = (this.binauralOn && this.running) ? this.binauralVolume : 0;
    this._bin.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  setBinaural(on) { this.binauralOn = on; this._ensureBinaural(); this._applyBinauralGain(); }
  setBinauralHz(hz) { this.binauralHz = hz; this._applyBinauralFreq(); }
  setBinauralVolume(v) { this.binauralVolume = Math.min(1, Math.max(0, v)); this._applyBinauralGain(); }

  // ---------- звук дыхания ----------
  setBreath(on) {
    this.breathOn = on;
    if (!on) this._stopBreath();
  }
  setBreathVolume(v) { this.breathVolume = Math.min(1, Math.max(0, v)); }
  setBreathVariant(id) { this.breathVariant = id; this.preloadVariant(id); }

  _stopBreath() {
    if (this._breathSrc) {
      try { this._breathSrc.stop(); } catch (e) {}
      this._breathSrc = null;
    }
  }

  breathPhase(phaseKey, durSec) {
    if (!this.breathOn || !this.running) { this._stopBreath(); return; }
    if (phaseKey === 'INHALE') this._playBreath('in', durSec);
    else if (phaseKey === 'EXHALE') this._playBreath('out', durSec);
    else this._stopBreath();
  }

  async _playBreath(kind, durSec) {
    try {
      await this._playBreathInner(kind, durSec);
    } catch (e) {
      this._stopBreath();
    }
  }

  async _playBreathInner(kind, durSec) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const v = breathVariantById(this.breathVariant);
    const fullUrl = kind === 'in' ? v.inFull : v.outFull;
    const loopUrl = kind === 'in' ? v.inLoop : v.outLoop;
    const full = await this._loadBuffer(fullUrl);
    const loop = await this._loadBuffer(loopUrl);
    this._stopBreath();

    const dur = Math.max(0.2, durSec);
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(this._out());

    const stretch = full ? (full.duration / dur) : 0;
    const src = ctx.createBufferSource();
    if (full && stretch >= 0.42) {
      src.buffer = full;
      src.playbackRate.value = Math.min(3, Math.max(0.42, stretch));
      gain.gain.setValueAtTime(this.breathVolume, now);
      src.connect(gain);
      src.start(now);
      src.stop(now + dur + 0.05);
    } else if (loop) {
      src.buffer = loop;
      src.loop = true;
      const N = 64;
      const curve = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const s = Math.sin(Math.PI * t);
        curve[i] = s * s * this.breathVolume;
      }
      gain.gain.setValueCurveAtTime(curve, now, dur);
      src.connect(gain);
      src.start(now);
      src.stop(now + dur + 0.05);
    } else {
      return;
    }
    this._breathSrc = src;
  }

  // ---------- голос и метроном ----------
  async _playCue(url, vol) {
    try {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const buf = await this._loadBuffer(url);
      if (!buf) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(g); g.connect(this._out());
      src.start();
    } catch (e) {}
  }

  cue(phaseKey) {
    if (!this.voiceOn) return;
    const url = phaseKey === 'INHALE' ? CUES.voice_inhale
      : phaseKey === 'EXHALE' ? CUES.voice_exhale
      : CUES.voice_hold;
    this._playCue(url, 1.0);
  }

  metronome(accent) {
    if (!this.metronomeOn) return;
    this._playCue(accent ? CUES.metronome_accent : CUES.metronome_tick, 0.9);
  }

  // ---------- управление сессией ----------
  startSession() {
    this.running = true;
    this.ensureCtx();
    this.initMusic();
    this.startMusic();
    this._ensureSolf();
    this._applySolfGain();
    this._ensureBinaural();
    this._applyBinauralGain();
    this.preloadVariant(this.breathVariant);
  }

  pauseSession() {
    this.running = false;
    this.pauseMusic();
    this._stopBreath();
    this._applySolfGain();
    this._applyBinauralGain();
  }

  resumeSession() {
    this.running = true;
    if (this.musicOn) this.startMusic();
    this._applySolfGain();
    this._applyBinauralGain();
  }

  stopSession() {
    this.running = false;
    this.stopMusic();
    this._stopBreath();
    this._applySolfGain();
    this._applyBinauralGain();
  }
}

export const Audio = new AudioEngine();
