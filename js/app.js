import { PATTERNS, GOALS, breathsPerMinute, getPattern } from './patterns.js';
import { Progress, ACHIEVEMENTS, isCustomPatternId } from './store.js';
import { ARTICLES, articleById } from './knowledge.js';
import { MusicLibrary } from './music.js';
import { SOLFEGGIO, toneByHz } from './solfeggio.js';
import { Audio, BREATH_VARIANTS } from './audio.js';
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
  musicSheet: false,
};

// Тестовый переключатель Premium (без оплаты). ВЫКЛЮЧИ перед релизом: false.
const PREMIUM_TEST = true;

const go = (screen, opts = {}) => {
  state.screen = screen;
  Object.assign(state, opts);
  render();
  window.scrollTo(0, 0);
};

function findPattern(id) {
  return getPattern(id) || Progress.getCustom(id);
}

function isPremium() { return !!Progress.data.premium; }

function applySessionToAudio() {
  const s = Progress.session;
  Audio.musicOn = s.musicOn;
  Audio.musicVolume = s.musicVolume;
  Audio.trackId = s.trackId;
  Audio.playlistIds = (s.playlistIds && s.playlistIds.length) ? s.playlistIds : MusicLibrary.ids();
  Audio.playlistMode = s.playlistMode;
  Audio.voiceOn = s.voiceOn;
  Audio.metronomeOn = s.metronomeOn;
  Audio.breathOn = s.breathOn;
  Audio.breathVolume = s.breathVolume;
  Audio.breathVariant = s.breathVariant;
  Audio.solfeggioOn = s.solfeggioOn;
  Audio.solfeggioHz = s.solfeggioHz;
  Audio.solfeggioVolume = s.solfeggioVolume;
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

function toggleRow(label, on, handler) {
  return `<label class="switch-row">
    <span>${label}</span>
    <input type="checkbox" ${on ? 'checked' : ''} onchange="${handler}(this.checked)">
  </label>`;
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
const PHASE_COLORS = {
  INHALE: '#6EE7D0', HOLD_IN: '#A78BFA', EXHALE: '#7CA6F8', HOLD_OUT: '#2A3646',
};

function cycleFraction(pattern, phaseKey, progress) {
  const phases = [
    ['INHALE', pattern.inhaleSec],
    ['HOLD_IN', pattern.holdInSec],
    ['EXHALE', pattern.exhaleSec],
    ['HOLD_OUT', pattern.holdOutSec],
  ].filter((x) => x[1] > 0);
  const total = phases.reduce((s, x) => s + x[1], 0) || 1;
  let acc = 0;
  for (const [k, d] of phases) {
    if (k === phaseKey) return (acc + d * Math.min(1, Math.max(0, progress))) / total;
    acc += d;
  }
  return 0;
}

function scoreBarHtml(pattern) {
  const phases = [
    ['INHALE', pattern.inhaleSec],
    ['HOLD_IN', pattern.holdInSec],
    ['EXHALE', pattern.exhaleSec],
    ['HOLD_OUT', pattern.holdOutSec],
  ].filter((x) => x[1] > 0);
  const total = phases.reduce((s, x) => s + x[1], 0) || 1;
  const segs = phases.map(([k, d]) =>
    `<div class="score-seg" style="width:${(d / total) * 100}%;background:${PHASE_COLORS[k]}"></div>`).join('');
  return `<div class="score-bar" id="scoreBar">${segs}<div class="score-mark" id="scoreMark"></div></div>`;
}

function phaseLegendHtml(pattern) {
  const phases = [
    ['INHALE', 'Вдох', pattern.inhaleSec],
    ['HOLD_IN', 'Задержка', pattern.holdInSec],
    ['EXHALE', 'Выдох', pattern.exhaleSec],
    ['HOLD_OUT', 'Задержка', pattern.holdOutSec],
  ].filter((x) => x[2] > 0);
  return `<div class="phase-legend">${phases.map(([k, label, d]) =>
    `<span><i style="background:${PHASE_COLORS[k]}"></i>${label} ${fmtSec(d)}</span>`).join('')}</div>`;
}

function screenSession() {
  const p = state.pattern;
  const sheet = state.musicSheet ? musicSheetHtml(p) : '';
  return `<div class="session">
    <div class="s-top">
      <button class="back light" onclick="window.__stop()">‹</button>
      <span class="s-title" id="sName">${p.name}</span>
      <span class="s-remain" id="sRemain">${fmtClock(state.minutes * 60)}</span>
    </div>
    <div class="orb-wrap">
      <div class="orb-ring"></div>
      <div class="orb" id="orb"><div class="orb-inner"><span id="phase">Вдох</span>
        <span class="orb-left" id="phaseLeft">4</span></div></div>
    </div>
    <div class="overall"><div class="overall-fill" id="overallFill" style="width:0%"></div></div>
    <div class="s-meta">
      <div><b id="elapsed">0:00</b><span>время</span></div>
      <div><b id="cycles">0</b><span>циклов</span></div>
    </div>
    <div class="s-actions">
      <button class="primary" id="pauseBtn" onclick="window.__pause()">Пауза</button>
      <button class="ghost" onclick="window.__stop()">Стоп</button>
    </div>
    <button class="ghost" onclick="window.__openMusicSheet()">♪ Музыка и партитура</button>
    <div class="s-toggles">
      ${toggleRow('Музыка', Progress.session.musicOn, 'window.__setMusic')}
      ${toggleRow('Дыхание', Progress.session.breathOn, 'window.__setBreath')}
      ${toggleRow('Голос', Progress.session.voiceOn, 'window.__setVoice')}
      ${toggleRow('Метроном', Progress.session.metronomeOn, 'window.__setMetronome')}
      ${toggleRow('Вибрация', Progress.session.vibrateOn, 'window.__setVibrate')}
      ${toggleRow('Частота сольфеджио', Progress.session.solfeggioOn, 'window.__setSolfeggio')}
    </div>
    ${sheet}
  </div>`;
}

function musicSheetHtml(pattern) {
  const s = Progress.session;
  const cur = MusicLibrary.byId(s.trackId);
  const queue = (s.playlistIds && s.playlistIds.length ? s.playlistIds : MusicLibrary.ids()).map((id) => MusicLibrary.byId(id));
  const queueHtml = s.playlistMode ? `<h3>Очередь</h3><div class="list">${queue.map((t, i) =>
    `<div class="list-row">${i + 1}. ${t.title}${i === Audio.currentTrackIndex() ? ' <span class="tag">играет</span>' : ''}</div>`).join('')}</div>` : '';
  return `<div class="sheet-backdrop" onclick="window.__closeMusicSheet(event)">
    <div class="sheet" onclick="event.stopPropagation()">
      <div class="sheet-head">
        <span>Музыкальное сопровождение</span>
        <button class="back" onclick="window.__closeMusicSheet()">✕</button>
      </div>
      <div class="now-track">
        <div class="now-art">♪</div>
        <div><div class="list-t">${cur.title}</div>
        <div class="muted">${cur.subtitle}, зациклен</div>
        <div class="now-meta">${breathsPerMinute(pattern)} дых./мин · ${state.minutes} мин</div></div>
      </div>
      <h3>Партитура дыхания</h3>
      ${scoreBarHtml(pattern)}
      ${phaseLegendHtml(pattern)}
      ${toggleRow('Музыка', s.musicOn, 'window.__setMusic')}
      <label class="field-label">Громкость музыки</label>
      <input type="range" min="0" max="1" step="0.01" value="${s.musicVolume}" oninput="window.__setMusicVolume(this.value)" />
      <button class="ghost" onclick="window.__restartMusic()">Трек в начало</button>
      <h3>Трек</h3>
      <button class="list-row pick" onclick="window.__openMusic()">${cur.title} — ${cur.subtitle} <span class="tag">Выбрать</span></button>
      <h3>Режим музыки</h3>
      <div class="row-2">
        <button class="${s.playlistMode ? 'ghost' : 'primary'}" onclick="window.__setPlaylistMode(false)">Повтор трека</button>
        <button class="${s.playlistMode ? 'primary' : 'ghost'}" onclick="window.__setPlaylistMode(true)">По списку${isPremium() ? '' : ' 🔒'}</button>
      </div>
      <button class="ghost" onclick="window.__openPlaylistGate()">Настроить список треков</button>
      ${queueHtml}
      <h3>Частота сольфеджио</h3>
      <button class="list-row pick" onclick="window.__openSolfeggio()">${s.solfeggioHz} Гц — ${toneByHz(s.solfeggioHz).title} <span class="tag">Выбрать</span></button>
      <label class="field-label">Громкость частоты</label>
      <input type="range" min="0" max="1" step="0.01" value="${s.solfeggioVolume}" oninput="window.__setSolfeggioVolume(this.value)" />
      <h3>Звук дыхания</h3>
      ${toggleRow('Вдох и выдох', s.breathOn, 'window.__setBreath')}
      <label class="field-label">Громкость дыхания</label>
      <input type="range" min="0" max="1" step="0.01" value="${s.breathVolume}" oninput="window.__setBreathVolume(this.value)" />
      <label class="field-label">Характер дыхания</label>
      ${BREATH_VARIANTS.map((v) => `<button class="list-row pick ${v.id === s.breathVariant ? 'sel' : ''}" onclick="window.__setBreathVariant('${v.id}')">
        ${v.title} — ${v.subtitle}${v.id === s.breathVariant ? ' <span class="tag">выбран</span>' : ''}</button>`).join('')}
    </div>
  </div>`;
}

// ---------- музыка / сольфеджио / плейлист ----------
function screenMusic() {
  const curId = Progress.session.trackId;
  const list = MusicLibrary.tracks.map((t) =>
    `<button class="list-row pick ${t.id === curId ? 'sel' : ''}" onclick="window.__selectTrack('${t.id}')">
      <span class="dot ${t.id === curId ? 'on' : ''}"></span>
      <span class="list-col"><span class="list-t">${t.title}</span><span class="muted">${t.subtitle}</span></span>
      ${t.id === curId ? '<span class="tag">играет</span>' : ''}
    </button>`).join('');
  return `${header('Музыка', true)}
    <p class="sub">Выберите трек для практики</p>
    <div class="list">${list}</div>`;
}

function screenSolfeggio() {
  const cur = Progress.session.solfeggioHz;
  const list = SOLFEGGIO.map((t) =>
    `<button class="list-row pick ${t.hz === cur ? 'sel' : ''}" onclick="window.__selectSolfeggio(${t.hz})">
      <span class="dot" style="background:${t.color}"></span>
      <span class="list-col">
        <span class="list-t" style="color:${t.color}">${t.hz} Гц <span class="muted">${t.title}</span></span>
        <span class="muted">${t.desc}</span>
      </span>
      ${t.hz === cur ? '<span class="tag">играет</span>' : ''}
    </button>`).join('');
  return `${header('Частоты сольфеджио', true)}
    <p class="sub">Играют мягким тоном вместе с музыкой. Значения традиционные, не являются медицинской рекомендацией.</p>
    <div class="list">${list}</div>`;
}

function screenPlaylist() {
  const ids = (Progress.session.playlistIds && Progress.session.playlistIds.length)
    ? Progress.session.playlistIds.slice() : MusicLibrary.ids();
  const rows = ids.map((id, i) => {
    const t = MusicLibrary.byId(id);
    return `<div class="list-row">
      <span class="tag">${i + 1}.</span>
      <span class="list-col"><span class="list-t">${t.title}</span><span class="muted">${t.subtitle}</span></span>
      <button class="mini" onclick="window.__plMove(${i},-1)">↑</button>
      <button class="mini" onclick="window.__plMove(${i},1)">↓</button>
      <button class="mini" onclick="window.__plRemove(${i})">✕</button>
    </div>`;
  }).join('');
  const available = MusicLibrary.tracks.filter((t) => !ids.includes(t.id));
  const add = available.map((t) =>
    `<button class="list-row pick" onclick="window.__plAdd('${t.id}')">${t.title} — ${t.subtitle} <span class="tag">＋</span></button>`).join('');
  return `${header('Плейлист', true)}
    <p class="sub">Порядок воспроизведения в режиме «По списку». Меняйте кнопками ↑ ↓.</p>
    <h3>В плейлисте</h3>
    <div class="list">${rows || '<p class="muted">Пока пусто — добавьте треки ниже.</p>'}</div>
    <h3>Добавить треки</h3>
    <div class="list">${add || '<p class="muted">Все треки уже в плейлисте.</p>'}</div>
    <p class="muted">Выбрано: ${ids.length}</p>`;
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
  else if (state.screen === 'music') html = screenMusic();
  else if (state.screen === 'solfeggio') html = screenSolfeggio();
  else if (state.screen === 'playlist') html = screenPlaylist();
  app.innerHTML = html;
}

// ---------- навигация ----------
window.__go = (s) => { TG.haptic('select'); go(s); };
window.__open = (id) => { const p = findPattern(id); if (p) go('detail', { pattern: p, minutes: p.defaultMinutes }); };
window.__back = () => {
  const s = state.screen;
  if (s === 'knowledgeDetail') go('knowledge');
  else if (s === 'music' || s === 'solfeggio' || s === 'playlist') go(state.session ? 'session' : 'home');
  else go('home');
};
window.__setMins = (v) => { state.minutes = parseInt(v, 10); document.getElementById('minsVal').textContent = v; };

window.__onboardingDone = async () => {
  const hide = document.getElementById('onbHide');
  if (hide && hide.checked) { Progress.setOnboardingSeen(true); await Progress.save(); }
  go('home');
};

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
  const c = document.getElementById('edCycle');
  if (c) {
    const e = state.editor;
    c.textContent = `Цикл: ${fmtSec(e.inhaleSec + e.holdInSec + e.exhaleSec + e.holdOutSec)} с · ${bpmOf(e)} дых/мин`;
  }
};
window.__setEditorMinutes = (v) => {
  state.editor.defaultMinutes = parseInt(v, 10);
  const el = document.getElementById('edMinVal');
  if (el) el.textContent = v;
};
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

// ---------- сессия ----------
window.__start = () => {
  Audio.unlock();
  applySessionToAudio();
  go('session');
  Audio.startSession();
  const total = state.minutes * 60;
  let lastSec = -1;
  let accentPending = false;
  const session = new BreathSession(state.pattern, state.minutes, {
    onPhase: (ph, durSec) => {
      accentPending = true;
      Audio.cue(ph.key);
      Audio.breathPhase(ph.key, durSec);
      if (Progress.session.vibrateOn) TG.haptic('impact', 'medium');
    },
    onTick: (t) => {
      const orb = document.getElementById('orb');
      if (!orb) return;
      orb.style.transform = `scale(${t.scale})`;
      document.getElementById('phase').textContent = t.paused ? 'Пауза' : t.phase.label;
      document.getElementById('phaseLeft').textContent = t.phaseLeft;
      document.getElementById('elapsed').textContent = fmtClock(t.elapsed);
      document.getElementById('cycles').textContent = t.cycles;
      document.getElementById('sRemain').textContent = fmtClock(t.remaining);
      const fill = document.getElementById('overallFill');
      if (fill) fill.style.width = ((1 - t.remaining / total) * 100).toFixed(1) + '%';
      const mark = document.getElementById('scoreMark');
      if (mark) mark.style.left = (cycleFraction(state.pattern, t.phaseKey, t.progress) * 100).toFixed(1) + '%';
      const btn = document.getElementById('pauseBtn');
      if (btn) btn.textContent = t.paused ? 'Продолжить' : 'Пауза';
      const sec = Math.floor(t.elapsed);
      if (sec !== lastSec) {
        lastSec = sec;
        Audio.metronome(accentPending);
        accentPending = false;
      }
    },
    onDone: (summary) => {
      Audio.stopSession();
      const res = Progress.recordSession(summary);
      Progress.save();
      TG.haptic('notify', 'success');
      state.session = null;
      showDone(summary, res);
    },
  });
  state.session = session;
  session.start();
};

window.__pause = () => {
  if (!state.session) return;
  const paused = state.session.toggle();
  if (paused) Audio.pauseSession(); else Audio.resumeSession();
  const btn = document.getElementById('pauseBtn');
  if (btn) btn.textContent = paused ? 'Продолжить' : 'Пауза';
};
window.__stop = () => {
  if (state.session) state.session.stop();
  state.session = null;
  Audio.stopSession();
  go('home');
};

// музыкальная шторка
window.__openMusicSheet = () => { state.musicSheet = true; render(); };
window.__closeMusicSheet = () => { state.musicSheet = false; render(); };

// переключатели сессии
function persistAndRerender(patch) {
  Progress.setSession(patch);
  Progress.save();
  applySessionToAudio();
}
window.__setMusic = (v) => { Audio.setMusic(v); persistAndRerender({ musicOn: v }); render(); };
window.__setBreath = (v) => { Audio.setBreath(v); persistAndRerender({ breathOn: v }); render(); };
window.__setVoice = (v) => { Audio.voiceOn = v; persistAndRerender({ voiceOn: v }); render(); };
window.__setMetronome = (v) => { Audio.metronomeOn = v; persistAndRerender({ metronomeOn: v }); render(); };
window.__setVibrate = (v) => { persistAndRerender({ vibrateOn: v }); render(); };
window.__setSolfeggio = (v) => { Audio.setSolfeggio(v); persistAndRerender({ solfeggioOn: v }); render(); };
window.__setMusicVolume = (v) => { Audio.setMusicVolume(parseFloat(v)); Progress.setSession({ musicVolume: parseFloat(v) }); };
window.__setSolfeggioVolume = (v) => { Audio.setSolfeggioVolume(parseFloat(v)); Progress.setSession({ solfeggioVolume: parseFloat(v) }); };
window.__setBreathVolume = (v) => { Audio.setBreathVolume(parseFloat(v)); Progress.setSession({ breathVolume: parseFloat(v) }); };
window.__restartMusic = () => Audio.restartMusic();

window.__setPlaylistMode = (on) => {
  if (on && !isPremium()) { go('premium'); return; }
  Audio.setPlaylistMode(on);
  persistAndRerender({ playlistMode: on });
  render();
};
window.__openPlaylistGate = () => { if (isPremium()) go('playlist'); else go('premium'); };
window.__openMusic = () => go('music');
window.__openSolfeggio = () => go('solfeggio');
window.__selectTrack = (id) => {
  Audio.setTrack(id);
  persistAndRerender({ trackId: id });
  go(state.session ? 'session' : 'home');
};
window.__selectSolfeggio = (hz) => {
  Audio.setSolfeggioHz(hz);
  persistAndRerender({ solfeggioHz: hz });
  go(state.session ? 'session' : 'home');
};
window.__setBreathVariant = (id) => {
  Audio.setBreathVariant(id);
  persistAndRerender({ breathVariant: id });
  render();
};

function currentPlaylist() {
  const s = Progress.session;
  return (s.playlistIds && s.playlistIds.length) ? s.playlistIds.slice() : MusicLibrary.ids();
}
function savePlaylist(ids) {
  Audio.setPlaylistIds(ids);
  persistAndRerender({ playlistIds: ids });
}
window.__plMove = (i, dir) => {
  const ids = currentPlaylist();
  const j = i + dir;
  if (j < 0 || j >= ids.length) return;
  const t = ids[i]; ids[i] = ids[j]; ids[j] = t;
  savePlaylist(ids); render();
};
window.__plRemove = (i) => { const ids = currentPlaylist(); ids.splice(i, 1); savePlaylist(ids); render(); };
window.__plAdd = (id) => { const ids = currentPlaylist(); if (!ids.includes(id)) ids.push(id); savePlaylist(ids); render(); };

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
    applySessionToAudio();
    await STARS.syncPremium();
    TON.init(new URL('tonconnect-manifest.json', location.href).href);

    const q = new URLSearchParams(location.search);
    const s = q.get('s');
    if (s === 'home' || s === 'progress' || s === 'wallet' || s === 'premium' || s === 'knowledge'
        || s === 'music' || s === 'solfeggio' || s === 'playlist') {
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
