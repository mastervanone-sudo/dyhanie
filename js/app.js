import { PATTERNS, GOALS, breathsPerMinute, getPattern } from './patterns.js';
import { Progress, ACHIEVEMENTS } from './store.js';
import { TG, loadScript } from './telegram.js';
import { BreathSession, fmtClock } from './session.js';
import { TON } from './ton.js';
import { STARS, PLANS } from './stars.js';

const app = document.getElementById('app');
const state = { screen: 'home', pattern: null, minutes: 5, session: null };

const go = (screen, opts = {}) => {
  state.screen = screen;
  Object.assign(state, opts);
  render();
  window.scrollTo(0, 0);
};

// ---------- общие части ----------
function header(title, back) {
  return `<header class="hdr">
    ${back ? `<button class="back" onclick="window.__back()">‹</button>` : ''}
    <h1>${title}</h1>
  </header>`;
}

function navBar() {
  const item = (id, label, icon) =>
    `<button class="nav-item ${state.screen === id ? 'active' : ''}" onclick="window.__go('${id}')">
       <span class="nav-ico">${icon}</span><span>${label}</span></button>`;
  return `<nav class="tabbar">
    ${item('home', 'Практики', '🫁')}
    ${item('progress', 'Прогресс', '⭐')}
    ${item('wallet', 'Кошелёк', '💎')}
    ${item('premium', 'Premium', '👑')}
  </nav>`;
}

// ---------- экраны ----------
function screenHome() {
  const cards = PATTERNS.map((p) => `
    <button class="card" onclick="window.__open('${p.id}')">
      <div class="card-top">
        <span class="goal" style="--c:${GOALS[p.goal].color}">${GOALS[p.goal].label}</span>
        <span class="bpm">${breathsPerMinute(p)} дых/мин</span>
      </div>
      <div class="card-name">${p.name}</div>
      <div class="card-desc">${p.shortDescription}</div>
    </button>`).join('');

  return `${header('Дыхание')}
    <p class="sub">Привет, ${TG.name()}. Дыши в ритме и получай опыт за регулярность.</p>
    <div class="stats-row">
      <div class="stat"><b>${Progress.level}</b><span>уровень</span></div>
      <div class="stat"><b>${Progress.data.streak}</b><span>серия дней</span></div>
      <div class="stat"><b>${Math.round(Progress.data.totalMinutes)}</b><span>минут</span></div>
    </div>
    <div class="cards">${cards}</div>
    ${navBar()}`;
}

function screenDetail() {
  const p = state.pattern;
  const scheme = [p.inhaleSec, p.holdInSec, p.exhaleSec, p.holdOutSec].filter((x) => x > 0).join('·');
  return `${header(p.name, true)}
    <div class="chip-row">
      <span class="goal" style="--c:${GOALS[p.goal].color}">${GOALS[p.goal].label}</span>
      <span class="bpm">${breathsPerMinute(p)} дых/мин</span>
      <span class="bpm">схема ${scheme}</span>
    </div>
    <p>${p.longDescription}</p>
    <h3>Что даёт</h3>
    <ul>${p.benefits.map((b) => `<li>${b}</li>`).join('')}</ul>
    <h3>Наука</h3>
    <p class="muted">${p.scienceText}</p>
    <h3>Длительность</h3>
    <input id="mins" type="range" min="${p.minMinutes}" max="${p.maxMinutes}" value="${state.minutes}"
      oninput="window.__setMins(this.value)" />
    <div class="mins-label"><b id="minsVal">${state.minutes}</b> мин</div>
    <button class="primary" onclick="window.__start()">Начать практику</button>
    ${navBar()}`;
}

function screenSession() {
  return `<div class="session">
    <div class="s-top"><button class="back light" onclick="window.__stop()">✕</button>
      <span id="sName">${state.pattern.name}</span></div>
    <div class="orb-wrap">
      <div class="orb-ring"></div>
      <div class="orb" id="orb"><span id="phase">Вдох</span></div>
    </div>
    <div class="s-meta">
      <div><b id="phaseLeft">4</b><span>сек в фазе</span></div>
      <div><b id="remaining">5:00</b><span>осталось</span></div>
      <div><b id="cycles">0</b><span>циклов</span></div>
    </div>
    <div class="s-actions">
      <button class="primary" id="pauseBtn" onclick="window.__pause()">Пауза</button>
      <button class="ghost" onclick="window.__stop()">Стоп</button>
    </div>
  </div>`;
}

function screenProgress() {
  const d = Progress.data;
  const ach = ACHIEVEMENTS.map((a) => {
    const on = d.achievements.includes(a.id);
    return `<div class="ach ${on ? 'on' : ''}"><div class="ach-ico">${a.icon}</div>
      <div class="ach-t">${a.title}</div><div class="ach-d">${a.desc}</div></div>`;
  }).join('');
  return `${header('Прогресс')}
    <div class="level-card">
      <div class="level-num">Уровень ${Progress.level}</div>
      <div class="bar"><div class="bar-fill" style="width:${Progress.xpIntoLevel}%"></div></div>
      <div class="muted">${Progress.xpIntoLevel} / 100 XP · до следующего ${Progress.xpToNext} XP</div>
      <div class="muted">Сегодня можно набрать ещё ${Progress.dayXpLeft} XP (дневной лимит)</div>
    </div>
    <div class="stats-row">
      <div class="stat"><b>${d.sessions}</b><span>практик</span></div>
      <div class="stat"><b>${d.streak}</b><span>серия</span></div>
      <div class="stat"><b>${d.bestStreak}</b><span>рекорд</span></div>
      <div class="stat"><b>${Math.round(d.totalMinutes)}</b><span>минут</span></div>
    </div>
    <h3>Достижения</h3>
    <div class="ach-grid">${ach}</div>
    <button class="ghost" onclick="window.__share()">Поделиться результатом</button>
    ${navBar()}`;
}

function screenWallet() {
  const connected = TON.connected;
  return `${header('Кошелёк')}
    <p class="sub">Подключите кошелёк TON, чтобы получать NFT-достижения и платить в TON. Кошелёк не нужен для самих практик.</p>
    ${connected
      ? `<div class="wallet-card"><div>Подключено</div><div class="mono">${TON.shortAddress()}</div>
         <button class="ghost" onclick="window.__tonDisconnect()">Отключить</button></div>`
      : `<button class="primary" onclick="window.__tonConnect()">Подключить TON-кошелёк</button>`}
    ${!TON.available ? '<p class="muted">TON Connect не загрузился (нет интернета или открыто вне Telegram).</p>' : ''}
    <h3>Зачем кошелёк</h3>
    <ul>
      <li>NFT-значки за серии и уровни (позже)</li>
      <li>Оплата Premium в TON (альтернатива Stars)</li>
      <li>Перенос прогресса между устройствами по адресу</li>
    </ul>
    ${navBar()}`;
}

function screenPremium() {
  const plans = PLANS.map((pl) => `
    <button class="plan" onclick="window.__buy('${pl.id}')">
      <div><div class="plan-t">${pl.title}</div><div class="muted">${pl.days} дней</div></div>
      <div class="plan-p">${pl.stars} ★</div>
    </button>`).join('');
  return `${header('Premium')}
    <p class="sub">Откройте всё: все практики, энергодыхание, музыку и партнёрские материалы.</p>
    ${Progress.data.premium ? '<div class="wallet-card"><div>Premium активен ✓</div></div>' : ''}
    <div class="plans">${plans}</div>
    <p class="muted">Оплата — Telegram Stars (XTR). Цифровые товары в Telegram продаются через Stars; создание счёта делает бэкенд с ботом.</p>
    ${navBar()}`;
}

function render() {
  let html = '';
  if (state.screen === 'home') html = screenHome();
  else if (state.screen === 'detail') html = screenDetail();
  else if (state.screen === 'session') html = screenSession();
  else if (state.screen === 'progress') html = screenProgress();
  else if (state.screen === 'wallet') html = screenWallet();
  else if (state.screen === 'premium') html = screenPremium();
  app.innerHTML = html;
}

// ---------- действия ----------
window.__go = (s) => { TG.haptic('select'); go(s); };
window.__open = (id) => { const p = getPattern(id); go('detail', { pattern: p, minutes: p.defaultMinutes }); };
window.__back = () => go('home');
window.__setMins = (v) => { state.minutes = parseInt(v, 10); document.getElementById('minsVal').textContent = v; };

window.__start = () => {
  go('session');
  const s = new BreathSession(state.pattern, state.minutes, {
    onTick: (t) => {
      const orb = document.getElementById('orb');
      const ph = document.getElementById('phase');
      if (!orb) return;
      orb.style.transform = `scale(${t.scale})`;
      ph.textContent = t.paused ? 'Пауза' : t.phase.label;
      document.getElementById('phaseLeft').textContent = t.phaseLeft;
      document.getElementById('remaining').textContent = fmtClock(t.remaining);
      document.getElementById('cycles').textContent = t.cycles;
      const btn = document.getElementById('pauseBtn');
      if (btn) btn.textContent = t.paused ? 'Продолжить' : 'Пауза';
    },
    onDone: (summary) => {
      const res = Progress.recordSession(summary);
      Progress.save();
      TG.haptic('notify', 'success');
      showDone(summary, res);
    },
  });
  state.session = s;
  s.start();
};

window.__pause = () => { if (state.session) state.session.toggle(); };
window.__stop = () => { if (state.session) state.session.stop(); state.session = null; go('home'); };

function showDone(summary, res) {
  const ach = res.unlocked.map((id) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    return a ? `<div class="toast-ach">${a.icon} ${a.title}</div>` : '';
  }).join('');
  app.innerHTML = `<div class="done">
    <div class="done-ico">🫁</div>
    <h2>Готово!</h2>
    <p>${summary.patternName} · ${summary.minutes} мин · ${summary.cycles} циклов</p>
    <div class="done-xp">+${res.xpGain} XP${res.capped ? ' <span class="muted">(дневной лимит)</span>' : ''}</div>
    ${ach}
    <button class="primary" onclick="window.__go('home')">К практикам</button>
    <button class="ghost" onclick="window.__share()">Поделиться</button>
  </div>`;
}

window.__share = () => {
  const d = Progress.data;
  TG.share('https://t.me/', `Я на уровне ${Progress.level} в «Дыхании»: ${Math.round(d.totalMinutes)} минут практики, серия ${d.streak} дней. Попробуй!`);
};

window.__tonConnect = () => TON.open();
window.__tonDisconnect = async () => { await TON.disconnect(); render(); };
window.__buy = (id) => STARS.buy(id);

window.__onWalletChange = () => { if (state.screen === 'wallet') render(); };
window.__onPremiumChange = () => { if (state.screen === 'premium') render(); };

// ---------- запуск ----------
console.log('app.js module executed');
function withTimeout(p, ms) {
  return Promise.race([p, new Promise((r) => setTimeout(() => r(false), ms))]);
}
(async function boot() {
  try {
    await Promise.all([
      withTimeout(loadScript('https://telegram.org/js/telegram-web-app.js'), 3000),
      withTimeout(loadScript('https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js'), 3000),
    ]);
    TG.ready();
    await Progress.load();
    await STARS.syncPremium();
    TON.init(new URL('tonconnect-manifest.json', location.href).href);
    render();

    // диплинки/быстрый переход: ?s=progress|wallet|premium|session&p=id
    const q = new URLSearchParams(location.search);
    const s = q.get('s');
    if (s === 'progress' || s === 'wallet' || s === 'premium') go(s);
    else if (s === 'session') {
      const p = getPattern(q.get('p')) || PATTERNS[0];
      go('detail', { pattern: p, minutes: p.defaultMinutes });
      window.__start();
    }
  } catch (e) {
    console.error('BOOT FAIL', e);
    const el = document.getElementById('app');
    if (el) el.textContent = 'BOOT FAIL: ' + (e && e.message ? e.message : e);
  }
})();
