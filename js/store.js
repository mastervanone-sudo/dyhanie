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
}

export const Progress = new ProgressStore();
export { DAILY_XP_CAP, levelOf };
