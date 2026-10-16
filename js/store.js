// Прогресс и геймификация. Хранится в Telegram CloudStorage, с фолбэком на localStorage.

const KEY = 'breathe_progress_v1';
const DAILY_XP_CAP = 60; // защита от накрутки и от «дышать ради денег» слишком много

function today() {
  return new Date().toISOString().slice(0, 10);
}
function dayBefore(d) {
  const t = new Date(d + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

export const ACHIEVEMENTS = [
  { id: 'first_session', title: 'Первый вдох', desc: 'Провести первую практику', icon: '🌱' },
  { id: 'streak_3', title: 'Три дня подряд', desc: 'Серия 3 дня', icon: '🔥' },
  { id: 'streak_7', title: 'Неделя практики', desc: 'Серия 7 дней', icon: '🏅' },
  { id: 'minutes_60', title: 'Час дыхания', desc: '60 минут суммарно', icon: '⏳' },
  { id: 'minutes_300', title: 'Пять часов', desc: '300 минут суммарно', icon: '🧘' },
  { id: 'explorer_5', title: 'Исследователь', desc: 'Попробовать 5 практик', icon: '🧭' },
  { id: 'level_5', title: 'Опытный', desc: 'Достичь 5 уровня', icon: '⭐' },
];

function defaults() {
  return {
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastDay: null,
    totalMinutes: 0,
    sessions: 0,
    practicesTried: [],
    day: today(),
    dayXp: 0,
    achievements: [],
    premium: false,
    wallet: null,
    onboardingSeen: false,
    customPatterns: [],
    session: defaultSession(),
    sessionsLog: [],
    journal: [],
    openDays: {},
    profileName: '',
    lightTheme: false,
    lang: '',
    energyPrograms: [],
    energyPresetFirstDay: 0,
  };
}

function defaultSession() {
  return {
    musicOn: true, musicVolume: 1.0, trackId: 'cosmic_om', playlistMode: false, playlistIds: [],
    voiceOn: true, metronomeOn: false,
    breathOn: true, breathVolume: 0.8, breathVariant: 'recorded2',
    solfeggioOn: true, solfeggioHz: 528, solfeggioVolume: 0.35,
    binauralOn: false, binauralHz: 10, binauralVolume: 0.3,
    vibrateOn: false,
    visual: 'medium',
  };
}

function levelOf(xp) {
  return Math.floor(xp / 100) + 1;
}
function xpIntoLevel(xp) {
  return xp % 100;
}

class ProgressStore {
  constructor() {
    this.data = defaults();
  }
  get _tg() {
    return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  }

  _inTelegram() {
    const w = this._tg;
    if (!w) return false;
    try { return typeof w.initData === 'string' && w.initData.length > 0; } catch (e) { return false; }
  }

  _cloudGet(key) {
    return new Promise((resolve) => {
      const w = this._tg;
      if (w && w.CloudStorage && this._inTelegram()) {
        try {
          w.CloudStorage.getItem(key, (err, val) => resolve(err || !val ? localStorage.getItem(key) : val));
          return;
        } catch (e) {}
      }
      resolve(localStorage.getItem(key));
    });
  }
  _cloudSet(key, val) {
    return new Promise((resolve) => {
      const w = this._tg;
      if (w && w.CloudStorage && this._inTelegram()) {
        try {
          w.CloudStorage.setItem(key, val, () => resolve(true));
          return;
        } catch (e) {}
      }
      localStorage.setItem(key, val);
      resolve(true);
    });
  }

  async load() {
    const raw = await this._cloudGet(KEY);
    if (raw) {
      try { this.data = Object.assign(defaults(), JSON.parse(raw)); } catch (e) { this.data = defaults(); }
    }
    this.data.session = Object.assign(defaultSession(), this.data.session || {});
    this.data.sessionsLog = this.data.sessionsLog || [];
    this.data.journal = this.data.journal || [];
    this.data.openDays = this.data.openDays || {};
    this._rollDay();
    return this.data;
  }

  async save() {
    await this._cloudSet(KEY, JSON.stringify(this.data));
  }

  _rollDay() {
    const t = today();
    if (this.data.day !== t) {
      this.data.day = t;
      this.data.dayXp = 0;
    }
  }

  get level() { return levelOf(this.data.xp); }
  get xpIntoLevel() { return xpIntoLevel(this.data.xp); }
  get xpToNext() { return 100 - xpIntoLevel(this.data.xp); }
  get dayXpLeft() { this._rollDay(); return Math.max(0, DAILY_XP_CAP - this.data.dayXp); }

  // Завершение сессии. Награда — за регулярность, не за интенсивность.
  recordSession({ minutes, patternId }) {
    this._rollDay();
    const d = this.data;
    const t = today();

    // серия дней
    if (d.lastDay === t) {
      // уже практиковали сегодня
    } else if (d.lastDay && dayBefore(t) === d.lastDay) {
      d.streak += 1;
    } else {
      d.streak = 1;
    }
    d.lastDay = t;
    d.bestStreak = Math.max(d.bestStreak, d.streak);

    const base = 10 + Math.max(1, Math.floor(minutes));
    const gain = Math.min(base, Math.max(0, DAILY_XP_CAP - d.dayXp));
    d.dayXp += gain;
    d.xp += gain;

    d.sessions += 1;
    d.totalMinutes += minutes;
    if (!d.practicesTried.includes(patternId)) d.practicesTried.push(patternId);

    const unlocked = this._checkAchievements();
    return { xpGain: gain, capped: gain < base, unlocked };
  }

  _checkAchievements() {
    const d = this.data;
    const unlocked = [];
    const has = (id) => d.achievements.includes(id);
    const grant = (id) => { if (!has(id)) { d.achievements.push(id); unlocked.push(id); } };
    if (d.sessions >= 1) grant('first_session');
    if (d.streak >= 3) grant('streak_3');
    if (d.streak >= 7) grant('streak_7');
    if (d.totalMinutes >= 60) grant('minutes_60');
    if (d.totalMinutes >= 300) grant('minutes_300');
    if (d.practicesTried.length >= 5) grant('explorer_5');
    if (this.level >= 5) grant('level_5');
    return unlocked;
  }

  setPremium(v) { this.data.premium = !!v; }
  setWallet(addr) { this.data.wallet = addr || null; }

  setOnboardingSeen(v) { this.data.onboardingSeen = !!v; }

  get session() { return this.data.session; }
  setSession(patch) { Object.assign(this.data.session, patch || {}); }

  // ---------- история сессий ----------
  get sessionsLog() { return this.data.sessionsLog || []; }
  addSessionLog(entry) {
    this.data.sessionsLog.unshift(entry);
    if (this.data.sessionsLog.length > 1000) this.data.sessionsLog.length = 1000;
    return entry;
  }

  // ---------- дневник состояний ----------
  get journal() { return this.data.journal || []; }
  addJournal(entry) {
    entry.id = entry.id || Date.now();
    this.data.journal.unshift(entry);
    return entry;
  }
  getJournal(id) { return this.journal.find((j) => String(j.id) === String(id)) || null; }
  updateJournal(entry) {
    const i = this.journal.findIndex((j) => String(j.id) === String(entry.id));
    if (i >= 0) this.data.journal[i] = entry; else this.data.journal.unshift(entry);
    return entry;
  }
  deleteJournal(id) { this.data.journal = this.journal.filter((j) => String(j.id) !== String(id)); }

  // ---------- открытия приложения ----------
  get openDays() { return this.data.openDays || {}; }
  recordOpen(day) { this.data.openDays[day] = (this.data.openDays[day] || 0) + 1; }

  setName(name) { this.data.profileName = (name || '').trim().slice(0, 30); }
  setLightTheme(v) { this.data.lightTheme = !!v; }

  // ---------- свои программы энергодыхания ----------
  get energyPrograms() { return this.data.energyPrograms || []; }
  getEnergyProgram(id) { return this.energyPrograms.find((p) => p.id === id) || null; }
  upsertEnergyProgram(p) {
    p.id = p.id || ('custom_' + Date.now());
    const i = this.energyPrograms.findIndex((x) => x.id === p.id);
    if (i >= 0) this.data.energyPrograms[i] = p; else this.data.energyPrograms.push(p);
    return p;
  }
  deleteEnergyProgram(id) { this.data.energyPrograms = this.energyPrograms.filter((p) => p.id !== id); }
  get energyPresetFirstDay() { return this.data.energyPresetFirstDay || 0; }
  setEnergyFirstDay(day) { if (!this.data.energyPresetFirstDay) this.data.energyPresetFirstDay = day; }

  // ---------- свои ритмы ----------
  get customPatterns() { return this.data.customPatterns || []; }
  getCustom(id) { return this.customPatterns.find((p) => p.id === id) || null; }

  addCustom(p) {
    const id = p.id || 'custom_' + Date.now().toString(36);
    const item = normalizeCustom(p, id);
    this.data.customPatterns = this.customPatterns.filter((x) => x.id !== id).concat(item);
    return item;
  }

  deleteCustom(id) {
    this.data.customPatterns = this.customPatterns.filter((x) => x.id !== id);
  }
}

export function isCustomPatternId(id) {
  return typeof id === 'string' && id.startsWith('custom_');
}

function normalizeCustom(p, id) {
  const inhaleSec = clampSec(p.inhaleSec, 1);
  const holdInSec = clampSec(p.holdInSec, 0);
  const exhaleSec = clampSec(p.exhaleSec, 1);
  const holdOutSec = clampSec(p.holdOutSec, 0);
  const minMinutes = Math.max(1, Math.round(p.minMinutes || 2));
  const maxMinutes = Math.max(minMinutes, Math.round(p.maxMinutes || 20));
  const defaultMinutes = Math.min(maxMinutes, Math.max(minMinutes, Math.round(p.defaultMinutes || 5)));
  const scheme = [inhaleSec, holdInSec, exhaleSec, holdOutSec].filter((x) => x > 0).join('·');
  return {
    id,
    name: (p.name || 'Свой ритм').trim().slice(0, 40),
    goal: p.goal || 'FOCUS',
    inhaleSec, holdInSec, exhaleSec, holdOutSec,
    defaultMinutes, minMinutes, maxMinutes,
    shortDescription: p.shortDescription || ('Свой ритм ' + scheme),
    longDescription: p.longDescription || 'Ваш собственный дыхательный ритм. Настраивайте фазы под своё состояние.',
    benefits: p.benefits || [],
    scienceText: p.scienceText || '',
    custom: true,
  };
}

function clampSec(v, min) {
  const n = Number(v);
  if (!isFinite(n)) return min;
  return Math.min(30, Math.max(min, Math.round(n * 10) / 10));
}

export const Progress = new ProgressStore();
export { DAILY_XP_CAP, levelOf };
