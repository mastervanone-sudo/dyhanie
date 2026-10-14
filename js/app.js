import { PATTERNS, GOALS, breathsPerMinute, getPattern } from './patterns.js';
import { Progress, ACHIEVEMENTS, isCustomPatternId } from './store.js';
import { ARTICLES, articleById } from './knowledge.js';
import { TG, loadScript } from './telegram.js';
import { BreathSession, fmtClock } from './session.js';
import { TON } from './ton.js';
import { STARS, PLANS } from './stars.js';

const app = document.getElementById('app');
const state = {
  screen: 'home',
  pattern: null,
  minutes: 5,
  session: null,
  article: null,
  editor: null,
};

// Тестовый переключатель Premium (без оплаты). ВЫКЛЮЧИ перед релизом: false.
const PREMIUM_TEST = true;

const go = (screen, opts = {}) => {
  state.screen = screen;
  Object.assign(state, opts);
  render();
  window.scrollTo(0, 0);
};

// Поиск практики среди встроенных и своих ритмов.
function findPattern(id) {
  return getPattern(id) || Progress.getCustom(id);
}

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

function goalChip(goal) {
  const g = GOALS[goal] || GOALS.FOCUS;
  return `<span class="goal" style="--c:${g.color}">${g.label}</span>`;
}

// ---------- онбординг ----------
function screenOnboarding() {
  return `<div class="onb">
    <h1 class="onb-title">Дыши ровно —<br>думай ясно</h1>
    <div class="info-card">
      <h3>Как это работает</h3>
      <p>Вы дышите под голос и музыку в заданном ритме. Приложение подсказывает, когда вдыхать, задерживать дыхание и выдыхать — по кругу на экране, по голосу и по вибрации.</p>
    </div>
    <div class="info-card">
      <h3>Что это даёт</h3>
      <p>Медленное и ровное дыхание снижает уровень стресса, замедляет пульс и успокаивает нервную систему. Бодрящие ритмы, наоборот, повышают тонус. Научные пояснения есть в карточке каждой практики.</p>
    </div>
    <div class="info-card warn">
      <h3>Важно</h3>
      <p>Приложение не является медицинским средством и не заменяет консультацию врача. При головокружении во время практики — остановитесь и восстановите дыхание.</p>
    </div>
    <label class="check-row"><input type="checkbox" id="onbHide"><span>Больше не показывать</span></label>
    <button class="primary" onclick="window.__onboardingDone()">Начать</button>
  </div>`;
}

// ---------- дом ----------
function screenHome() {
  const patternCards = PATTERNS.map(patternCard).join('');
  const custom = Progress.customPatterns;
  const customCards = custom.length
    ? custom.map(patternCard).join('')
    : `<p class="muted">Создайте свой ритм — задайте длительность вдоха, задержек и выдоха.</p>`;

  return `${header('Дыхательные практики')}
    <p class="sub">Привет, ${TG.name()}. Выберите ритм под своё состояние.</p>
    <div class="stats-row">
      <div class="stat"><b>${Progress.level}</b><span>уровень</span></div>
      <div class="stat"><b>${Progress.data.streak}</b><span>серия дней</span></div>
      <div class="stat"><b>${Math.round(Progress.data.totalMinutes)}</b><span>минут</span></div>
    </div>
    <button class="hub-card" onclick="window.__openKnowledge()">
      <div class="hub-ico">📚</div>
      <div><div class="hub-t">База знаний</div>
      <div class="hub-d">Короткие статьи о пользе дыхания и науке</div>
      <div class="hub-m">${ARTICLES.length} статей</div></div>
    </button>
    <div class="cards">${patternCards}</div>
    <h3>Свои ритмы</h3>
    <div class="cards">${customCards}</div>
    <button class="ghost" onclick="window.__newCustom()">+ Создать свой ритм</button>
    ${navBar()}`;
}

function patternCard(p) {
  return `<button class="card" onclick="window.__open('${p.id}')">
    <div class="card-top">
      ${goalChip(p.goal)}
      <span class="bpm">${breathsPerMinute(p)} дых/мин</span>
    </div>
    <div class="card-name">${p.name}</div>
    <div class="card-desc">${p.shortDescription}</div>
  </button>`;
}

// ---------- деталь практики ----------
function fmtSec(sec) {
  return sec % 1 === 0 ? String(sec) : String(sec);
}

function screenDetail() {
  const p = state.pattern;
  if (!p) return `${header('Практика', true)}<p>Практика не найдена.</p>${navBar()}`;

  const parts = [`Вдох ${fmtSec(p.inhaleSec)}`];
  if (p.holdInSec > 0) parts.push(`Задержка ${fmtSec(p.holdInSec)}`);
  parts.push(`Выдох ${fmtSec(p.exhaleSec)}`);
  if (p.holdOutSec > 0) parts.push(`Задержка ${fmtSec(p.holdOutSec)}`);

  const benefits = (p.benefits && p.benefits.length)
    ? `<h3>Что даёт</h3><ul>${p.benefits.map((b) => `<li>${b}</li>`).join('')}</ul>` : '';
  const science = p.scienceText ? `<h3>Немного науки</h3><p class="muted">${p.scienceText}</p>` : '';
  const customActions = isCustomPatternId(p.id)
    ? `<div class="row-2">
         <button class="ghost" onclick="window.__editCustom('${p.id}')">Изменить</button>
         <button class="ghost" onclick="window.__deleteCustom('${p.id}')">Удалить</button>
       </div>` : '';

  return `${header(p.name, true)}
    <div class="chip-row">
      ${goalChip(p.goal)}
      <span class="bpm">${breathsPerMinute(p)} дых/мин</span>
    </div>
    <div class="phase-diagram">${parts.join('  →  ')}</div>
    <p>${p.longDescription}</p>
    ${benefits}
    ${science}
    <h3>Длительность: <span id="minsVal">${state.minutes}</span> мин</h3>
    <input id="mins" type="range" min="${p.minMinutes}" max="${p.maxMinutes}" value="${state.minutes}"
      oninput="window.__setMins(this.value)" />
    <button class="primary" onclick="window.__start()">Начать практику</button>
    ${customActions}
    ${navBar()}`;
}

// ---------- редактор своего ритма ----------
function screenEditor() {
  const e = state.editor;
  const isNew = !e.id;
  const goalBtn = (g) => {
    const on = e.goal === g;
    return `<button class="${on ? 'primary' : 'ghost'} chip-btn" onclick="window.__setEditorGoal('${g}')">${GOALS[g].label}</button>`;
  };
  return `${header(isNew ? 'Свой ритм' : 'Изменить ритм', true)}
    <label class="field-label">Название</label>
    <input class="text-input" id="edName" maxlength="40" value="${e.name}" oninput="window.__setEditorName(this.value)" />
    <label class="field-label">Цель</label>
    <div class="row-3">${goalBtn('RELAX')}${goalBtn('FOCUS')}${goalBtn('ENERGY')}</div>
    ${phaseSlider('Вдох', 'inhaleSec', e.inhaleSec)}
    ${phaseSlider('Задержка после вдоха', 'holdInSec', e.holdInSec)}
    ${phaseSlider('Выдох', 'exhaleSec', e.exhaleSec)}
    ${phaseSlider('Задержка после выдоха', 'holdOutSec', e.holdOutSec)}
    <h3>Длительность по умолчанию: <span id="edMinVal">${e.defaultMinutes}</span> мин</h3>
    <input type="range" min="1" max="30" value="${e.defaultMinutes}" oninput="window.__setEditorMinutes(this.value)" />
    <p class="cycle-line" id="edCycle">Цикл: ${fmtSec(e.inhaleSec + e.holdInSec + e.exhaleSec + e.holdOutSec)} с · ${bpmOf(e)} дых/мин</p>
    <button class="primary" onclick="window.__saveCustom()">Сохранить</button>
    ${isNew ? '' : '<button class="ghost" onclick="window.__deleteCustom(\'' + e.id + '\')">Удалить</button>'}
    ${navBar()}`;
}

function bpmOf(e) {
  const c = e.inhaleSec + e.holdInSec + e.exhaleSec + e.holdOutSec;
  return c <= 0 ? 0 : Math.round(60 / c);
}

function phaseSlider(label, field, value) {
  return `<label class="field-label">${label}: <span id="ed-${field}">${fmtSec(value)}</span> с</label>
    <input type="range" min="0" max="10" step="0.5" value="${value}"
      oninput="window.__setEditorPhase('${field}', this.value)" />`;
}

// ---------- сессия ----------
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

// ---------- база знаний ----------
function screenKnowledge() {
  const cards = ARTICLES.map((a) => `
    <button class="card" onclick="window.__openArticle('${a.id}')">
      <div class="card-name">${a.title}</div>
      <div class="card-desc">${a.teaser}</div>
      <div class="card-meta">${a.minutes} мин чтения</div>
    </button>`).join('');
  return `${header('База знаний', true)}
    <p class="sub">Короткие статьи о пользе дыхательных практик и их научных подтверждениях.</p>
    <div class="cards">${cards}</div>`;
}

function screenKnowledgeDetail() {
  const a = state.article;
  if (!a) return `${header('Статья', true)}<p>Статья не найдена.</p>`;
  return `${header(a.title, true)}
    <p class="muted">${a.minutes} мин чтения</p>
    ${a.paragraphs.map((p) => `<p>${p}</p>`).join('')}`;
}

// ---------- прогресс ----------
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

// ---------- кошелёк ----------
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

// ---------- премиум ----------
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
    ${PREMIUM_TEST ? `<button class="ghost" onclick="window.__togglePremiumTest()">${Progress.data.premium ? '🧪 Тест: отключить Premium' : '🧪 Тест: включить Premium'}</button>` : ''}
    ${navBar()}`;
}

function render() {
  let html = '';
  if (state.screen === 'onboarding') html = screenOnboarding();
  else if (state.screen === 'home') html = screenHome();
  else if (state.screen === 'detail') html = screenDetail();
  else if (state.screen === 'session') html = screenSession();
  else if (state.screen === 'progress') html = screenProgress();
  else if (state.screen === 'wallet') html = screenWallet();
  else if (state.screen === 'premium') html = screenPremium();
  else if (state.screen === 'editor') html = screenEditor();
  else if (state.screen === 'knowledge') html = screenKnowledge();
  else if (state.screen === 'knowledgeDetail') html = screenKnowledgeDetail();
  app.innerHTML = html;
}

// ---------- действия ----------
window.__go = (s) => { TG.haptic('select'); go(s); };
window.__open = (id) => { const p = findPattern(id); if (p) go('detail', { pattern: p, minutes: p.defaultMinutes }); };
window.__back = () => {
  if (state.screen === 'knowledgeDetail') go('knowledge');
  else go('home');
};
window.__setMins = (v) => { state.minutes = parseInt(v, 10); document.getElementById('minsVal').textContent = v; };

window.__onboardingDone = async () => {
  const hide = document.getElementById('onbHide');
  if (hide && hide.checked) { Progress.setOnboardingSeen(true); await Progress.save(); }
  go('home');
};

// база знаний
window.__openKnowledge = () => go('knowledge');
window.__openArticle = (id) => go('knowledgeDetail', { article: articleById(id) });

// свои ритмы
window.__newCustom = () => go('editor', {
  editor: { id: '', name: 'Мой ритм', goal: 'RELAX', inhaleSec: 4, holdInSec: 4, exhaleSec: 4, holdOutSec: 4, defaultMinutes: 5 },
});
window.__editCustom = (id) => {
  const p = Progress.getCustom(id);
  if (!p) return;
  go('editor', {
    editor: {
      id: p.id, name: p.name, goal: p.goal,
      inhaleSec: p.inhaleSec, holdInSec: p.holdInSec, exhaleSec: p.exhaleSec, holdOutSec: p.holdOutSec,
      defaultMinutes: p.defaultMinutes,
    },
  });
};
window.__setEditorName = (v) => { state.editor.name = v; };
window.__setEditorGoal = (g) => { state.editor.goal = g; render(); };
window.__setEditorPhase = (field, v) => {
  state.editor[field] = parseFloat(v);
  const el = document.getElementById('ed-' + field);
  if (el) el.textContent = fmtSec(state.editor[field]);
  updateCycleLine();
};
window.__setEditorMinutes = (v) => {
  state.editor.defaultMinutes = parseInt(v, 10);
  const el = document.getElementById('edMinVal');
  if (el) el.textContent = v;
};
function updateCycleLine() {
  const el = document.getElementById('edCycle');
  if (!el) return;
  const e = state.editor;
  el.textContent = `Цикл: ${fmtSec(e.inhaleSec + e.holdInSec + e.exhaleSec + e.holdOutSec)} с · ${bpmOf(e)} дых/мин`;
}
window.__saveCustom = async () => {
  const e = state.editor;
  const cycle = e.inhaleSec + e.holdInSec + e.exhaleSec + e.holdOutSec;
  if (!e.name.trim() || cycle <= 0) { alert('Задайте название и хотя бы одну фазу больше нуля.'); return; }
  Progress.addCustom({
    id: e.id || undefined,
    name: e.name, goal: e.goal,
    inhaleSec: e.inhaleSec, holdInSec: e.holdInSec, exhaleSec: e.exhaleSec, holdOutSec: e.holdOutSec,
    defaultMinutes: e.defaultMinutes, minMinutes: 1, maxMinutes: 30,
  });
  await Progress.save();
  TG.haptic('notify', 'success');
  go('home');
};
window.__deleteCustom = async (id) => {
  if (!confirm('Удалить этот ритм?')) return;
  Progress.deleteCustom(id);
  await Progress.save();
  go('home');
};

// сессия
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
window.__togglePremiumTest = async () => {
  Progress.setPremium(!Progress.data.premium);
  await Progress.save();
  render();
};

window.__onWalletChange = () => { if (state.screen === 'wallet') render(); };
window.__onPremiumChange = () => { if (state.screen === 'premium') render(); };

// ---------- запуск ----------
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

    // диплинки/быстрый переход: ?s=...&p=...
    const q = new URLSearchParams(location.search);
    const s = q.get('s');
    if (s === 'home' || s === 'progress' || s === 'wallet' || s === 'premium' || s === 'knowledge') {
      render();
      go(s);
    } else if (s === 'session') {
      const p = findPattern(q.get('p')) || PATTERNS[0];
      state.pattern = p; state.minutes = p.defaultMinutes;
      render();
      window.__start();
    } else if (!Progress.data.onboardingSeen) {
      go('onboarding');
    } else {
      render();
    }
  } catch (e) {
    console.error('BOOT FAIL', e);
    const el = document.getElementById('app');
    if (el) el.textContent = 'BOOT FAIL: ' + (e && e.message ? e.message : e);
  }
})();
