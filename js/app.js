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

function applyTheme() {
  document.documentElement.classList.toggle('light', !!Progress.data.lightTheme);
}

function newJournal(extra) {
  return Object.assign({
    id: 0, createdAt: Date.now(), dayEpochDay: todayEpoch(),
    patternName: null, seconds: 0,
    calm: 0, energy: 0, focus: 0, tags: [], text: '', favorite: false,
  }, extra || {});
}

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
    ${item('profile', 'Профиль', '👤')}
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

  return `<header class="hdr">
      <h1>Дыхательные практики</h1>
      <button class="avatar-btn" style="margin-left:auto" onclick="window.__go('profile')">👤</button>
    </header>
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

// ---------- профиль ----------
const JOURNAL_TAGS = ['Спокойствие', 'Легче', 'Тревога ушла', 'Ясность', 'Прилив сил', 'Сонливость', 'Напряжение', 'Тепло', 'Благодарность', 'Сосредоточенность'];
const JOURNAL_PROMPTS = ['Что заметили в теле?', 'Что изменилось в мыслях?', 'Что забираете с этого дыхания?', 'Одна мысль, которую хочется сохранить', 'Что отпустили?'];

function rankForLevel(level) {
  if (level <= 4) return 'Новичок';
  if (level <= 9) return 'Ученик';
  if (level <= 19) return 'Практик';
  if (level <= 29) return 'Дышащий';
  if (level <= 39) return 'Мастер дыхания';
  if (level <= 49) return 'Хранитель ритма';
  if (level <= 59) return 'Гуру дыхания';
  if (level <= 69) return 'Мастер энергии';
  if (level <= 79) return 'Хранитель энергии';
  if (level <= 89) return 'Магистр дыхания';
  if (level <= 99) return 'Просветлённый';
  return 'Легенда';
}

function epochDayOf(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}
function todayEpoch() { return epochDayOf(new Date()); }

function profileName() {
  return Progress.data.profileName || TG.name() || 'Практик';
}
function avatarInitial() {
  const n = profileName().trim();
  return n ? n[0].toUpperCase() : 'Д';
}
function avatarInner() {
  const u = TG.user;
  const photo = u && u.photo_url;
  if (photo) return `<img src="${photo}" alt="avatar">`;
  return avatarInitial();
}

function buildDayMap() {
  const days = {};
  for (const s of Progress.sessionsLog) {
    const d = days[s.dayEpochDay] || (days[s.dayEpochDay] = { minutes: 0, sessions: 0, completed: 0, opens: 0 });
    d.sessions += 1;
    d.minutes += Math.floor(s.seconds / 60);
    if (s.completed) d.completed += 1;
  }
  for (const k of Object.keys(Progress.openDays)) {
    const day = days[k] || (days[k] = { minutes: 0, sessions: 0, completed: 0, opens: 0 });
    day.opens = Progress.openDays[k];
  }
  return days;
}

function favoritePattern() {
  const counts = {};
  for (const s of Progress.sessionsLog) counts[s.patternName] = (counts[s.patternName] || 0) + 1;
  let best = null, bestN = 0;
  for (const k of Object.keys(counts)) if (counts[k] > bestN) { best = k; bestN = counts[k]; }
  return best;
}

function screenProfile() {
  const d = Progress.data;
  const level = Progress.level;
  const rank = rankForLevel(level);
  const ring = Progress.xpIntoLevel;
  const fav = favoritePattern() || '—';
  const premium = Progress.data.premium;
  const month = state.profileMonth || { y: new Date().getFullYear(), m: new Date().getMonth() };
  const days = buildDayMap();

  const journalRows = Progress.journal.length
    ? Progress.journal.map((e) => {
        const ratings = [];
        if (e.calm) ratings.push(`Спокойствие ${e.calm}`);
        if (e.energy) ratings.push(`Энергия ${e.energy}`);
        if (e.focus) ratings.push(`Фокус ${e.focus}`);
        const tags = (e.tags || []).join(' · ');
        return `<div class="j-row">
          <div class="j-top">
            <div><div class="muted">${ruDate(e.dayEpochDay)}</div>
            ${e.patternName ? `<div>${e.patternName}</div>` : ''}</div>
            <button class="star ${e.favorite ? 'on' : ''}" onclick="window.__jFav('${e.id}')">★</button>
          </div>
          ${ratings.length ? `<div class="j-meta">${ratings.join(' · ')}</div>` : ''}
          ${tags ? `<div class="muted">${tags}</div>` : ''}
          ${e.text ? `<div class="j-text">${e.text}</div>` : ''}
          <button class="mini" onclick="window.__openJournal('${e.id}')">Открыть</button>
        </div>`;
      }).join('')
    : '<p class="muted">Записывайте, как вы себя чувствуете и какие приходят мысли после практики.</p>';

  return `${header('Профиль', true)}
    <div class="prof-head">
      <div class="ring" style="--p:${ring}">
        <button class="avatar" onclick="window.__go('profile')">${avatarInner()}</button>
      </div>
      <div class="prof-id">
        <div class="prof-name">${profileName()}</div>
        <div class="prof-rank">${rank} · уровень ${level}</div>
        <div class="muted">${level >= 100 ? 'Максимальный уровень' : `до следующего уровня ${Progress.xpToNext} XP`}</div>
      </div>
      <button class="mini" onclick="window.__openRename()">Имя</button>
    </div>
    <div class="stats-row">
      <div class="stat"><b>${d.sessions}</b><span>практик</span></div>
      <div class="stat"><b>${Math.round(d.totalMinutes)}</b><span>минут</span></div>
      <div class="stat"><b>${d.streak}</b><span>серия</span></div>
    </div>
    <div class="stats-row">
      <div class="stat"><b>${d.bestStreak}</b><span>рекорд</span></div>
      <div class="stat wide"><b>${fav}</b><span>любимый ритм</span></div>
    </div>
    ${toggleRow('Светлая тема', Progress.data.lightTheme, 'window.__setLightTheme')}
    <button class="hub-card" onclick="window.__go('premium')">
      <div class="hub-ico">👑</div>
      <div><div class="hub-t">Premium</div>
      <div class="hub-d">${premium ? 'Подписка активна' : 'Свои треки, плейлисты и курс без ограничений'}</div></div>
    </button>
    <button class="hub-card" onclick="window.__go('wallet')">
      <div class="hub-ico">💎</div>
      <div><div class="hub-t">Кошелёк TON</div>
      <div class="hub-d">NFT-достижения и оплата в TON</div></div>
    </button>
    <h3>Дневник состояний</h3>
    <button class="ghost" onclick="window.__addJournal()">＋ Запись о состоянии</button>
    <div class="j-list">${journalRows}</div>
    <h3>Календарь активности</h3>
    ${activityCalendarHtml(month, days)}
    ${state.selectedDay ? dayDetailsHtml(state.selectedDay, days) : ''}
    <button class="ghost" onclick="window.__go('stats')">Вся история практик</button>
    ${navBar()}`;
}

function ruDate(epochDay) {
  const dt = new Date(epochDay * 86400000);
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}
function ruMonth(y, m) {
  const dt = new Date(Date.UTC(y, m, 1));
  const s = dt.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function intensity(minutes) {
  if (minutes >= 10) return .9;
  if (minutes >= 5) return .6;
  if (minutes >= 1) return .4;
  return .25;
}

function activityCalendarHtml(month, days) {
  const firstDay = new Date(Date.UTC(month.y, month.m, 1));
  const offset = (firstDay.getUTCDay() + 6) % 7; // Пн=0
  const len = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const today = todayEpoch();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push('');
  for (let d = 1; d <= len; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push('');
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const dow = '<div class="cal-dow">' + ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((x) => `<span>${x}</span>`).join('') + '</div>';
  const body = weeks.map((w) => '<div class="cal-week">' + w.map((d) => {
    if (!d) return '<span class="cal-cell"></span>';
    const epoch = epochDayOf(new Date(Date.UTC(month.y, month.m, d)));
    const st = days[epoch];
    const practiced = st && st.sessions > 0;
    const opened = st && st.opens > 0;
    const isToday = epoch === today;
    const sel = state.selectedDay === epoch;
    const cls = ['cal-cell'];
    if (practiced) cls.push('done');
    else if (opened) cls.push('opened');
    if (isToday) cls.push('today');
    if (sel) cls.push('sel');
    const alpha = practiced ? `style="--a:${intensity(st.minutes)}"` : '';
    return `<button class="${cls.join(' ')}" ${alpha} onclick="window.__selDay(${epoch})">${d}</button>`;
  }).join('') + '</div>').join('');
  return `<div class="cal">
    <div class="cal-head">
      <button class="mini" onclick="window.__calPrev()">‹</button>
      <span>${ruMonth(month.y, month.m)}</span>
      <button class="mini" onclick="window.__calNext()">›</button>
    </div>
    ${dow}${body}
    <p class="muted">Насыщеннее — больше минут практики. Серый — только открывал приложение.</p>
  </div>`;
}

function dayDetailsHtml(epoch, days) {
  const st = days[epoch];
  const items = Progress.sessionsLog.filter((s) => s.dayEpochDay === epoch).sort((a, b) => b.startedAt - a.startedAt);
  const rows = items.length
    ? items.map((s) => `<div class="list-row"><span class="list-col"><span class="list-t">${s.patternName}</span>
        <span class="muted">${ruTime(s.startedAt)}</span></span>
        <span class="tag">${durationText(s.seconds)} · ${s.completed ? 'полностью' : 'прервано'}</span></div>`).join('')
    : `<p class="muted">Практик в этот день нет.${st && st.opens ? ` Открытий приложения: ${st.opens}.` : ''}</p>`;
  return `<div class="day-details"><h3>${ruDate(epoch)}</h3>${rows}${items.length && st && st.opens ? `<p class="muted">Открытий приложения: ${st.opens}</p>` : ''}</div>`;
}

function durationText(sec) { return sec >= 60 ? `${Math.floor(sec / 60)} мин` : `${sec} сек`; }
function ruTime(ms) {
  return new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function screenJournalEditor() {
  const j = state.journal;
  const prompt = state.journalPrompt;
  const tags = JOURNAL_TAGS.map((t) => `<button class="chip ${j.tags.includes(t) ? 'on' : ''}" onclick="window.__jTag('${t}')">${t}</button>`).join('');
  return `${header(j.id ? 'Запись дневника' : 'Новая запись', true)}
    <p class="muted">${new Date(j.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    ${j.patternName ? `<p class="tag">Практика: ${j.patternName}${j.seconds > 0 ? ` · ${Math.floor(j.seconds / 60)} мин` : ''}</p>` : ''}
    <h3>Как вы себя чувствуете?</h3>
    ${ratingRow('Спокойствие', 'calm', j.calm)}
    ${ratingRow('Энергия', 'energy', j.energy)}
    ${ratingRow('Фокус', 'focus', j.focus)}
    <h3>Состояния</h3>
    <div class="chips">${tags}</div>
    <h3>Инсайты</h3>
    <textarea class="text-area" placeholder="${prompt}" oninput="window.__jText(this.value)">${j.text}</textarea>
    <label class="check-row"><input type="checkbox" ${j.favorite ? 'checked' : ''} onchange="window.__jFavEdit(this.checked)"><span>В избранное ★</span></label>
    <button class="primary" onclick="window.__jSave()">Сохранить</button>
    ${j.id ? '<button class="ghost" onclick="window.__jDelete()">Удалить запись</button>' : ''}
    ${navBar()}`;
}

function ratingRow(label, field, value) {
  const dots = [1, 2, 3, 4, 5].map((i) =>
    `<button class="rate ${i <= value ? 'on' : ''}" onclick="window.__jRate('${field}',${i})">${i}</button>`).join('');
  return `<div class="rate-row"><span>${label}</span><div class="rates">${dots}</div></div>`;
}

function screenStats() {
  const sessions = Progress.sessionsLog;
  const totalMinutes = Math.round(Progress.data.totalMinutes);
  const rows = sessions.length
    ? sessions.map((s) => `<div class="list-row"><span class="list-col">
        <span class="list-t">${s.patternName}</span>
        <span class="muted">${ruDate(s.dayEpochDay)}, ${ruTime(s.startedAt)}</span></span>
        <span class="tag">${Math.floor(s.seconds / 60)} мин · ${s.completed ? 'полностью' : 'прервано'}</span></div>`).join('')
    : '<p class="muted">Пока нет завершённых сессий. Пройди первую практику — и здесь появится история.</p>';
  return `${header('Статистика', true)}
    <div class="stats-row">
      <div class="stat"><b>${sessions.length}</b><span>сессий</span></div>
      <div class="stat"><b>${totalMinutes}</b><span>минут</span></div>
      <div class="stat"><b>${Progress.data.streak}</b><span>серия</span></div>
    </div>
    <h3>История практик</h3>
    <div class="list">${rows}</div>`;
}

function renameModalHtml() {
  return `<div class="sheet-backdrop" onclick="window.__closeRename()">
    <div class="sheet" onclick="event.stopPropagation()">
      <div class="sheet-head"><span>Как вас зовут?</span><button class="back" onclick="window.__closeRename()">✕</button></div>
      <input class="text-input" id="renameInput" maxlength="30" value="${Progress.data.profileName || ''}" placeholder="${TG.name()}" />
      <button class="primary" onclick="window.__saveName()">Сохранить</button>
    </div>
  </div>`;
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
  else if (state.screen === 'profile') html = screenProfile();
  else if (state.screen === 'journalEditor') html = screenJournalEditor();
  else if (state.screen === 'stats') html = screenStats();
  if (state.rename) html += renameModalHtml();
  app.innerHTML = html;
}

// ---------- навигация ----------
window.__go = (s) => { TG.haptic('select'); go(s); };
window.__open = (id) => { const p = findPattern(id); if (p) go('detail', { pattern: p, minutes: p.defaultMinutes }); };
window.__back = () => {
  const s = state.screen;
  if (s === 'knowledgeDetail') go('knowledge');
  else if (s === 'journalEditor' || s === 'stats') go('profile');
  else if (s === 'wallet') go('profile');
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
  state.sessionStart = Date.now();
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
      Progress.addSessionLog({
        patternId: summary.patternId, patternName: summary.patternName,
        startedAt: state.sessionStart || Date.now(), seconds: summary.minutes * 60,
        completed: true, dayEpochDay: todayEpoch(),
      });
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
  if (state.session) {
    const elapsed = Math.round(state.session.elapsed || 0);
    const p = state.pattern;
    if (elapsed > 0) {
      Progress.addSessionLog({
        patternId: p.id, patternName: p.name,
        startedAt: state.sessionStart || Date.now(), seconds: elapsed,
        completed: false, dayEpochDay: todayEpoch(),
      });
      Progress.save();
    }
    state.session.stop();
  }
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

// ---------- профиль ----------
window.__setLightTheme = (v) => { Progress.setLightTheme(v); applyTheme(); Progress.save(); render(); };
window.__openRename = () => { state.rename = true; render(); };
window.__closeRename = () => { state.rename = false; render(); };
window.__saveName = async () => {
  const el = document.getElementById('renameInput');
  Progress.setName(el ? el.value : '');
  await Progress.save();
  state.rename = false;
  render();
};
window.__calPrev = () => {
  const m = state.profileMonth || { y: new Date().getFullYear(), m: new Date().getMonth() };
  let mm = m.m - 1, yy = m.y;
  if (mm < 0) { mm = 11; yy -= 1; }
  state.profileMonth = { y: yy, m: mm };
  state.selectedDay = null;
  render();
};
window.__calNext = () => {
  const m = state.profileMonth || { y: new Date().getFullYear(), m: new Date().getMonth() };
  let mm = m.m + 1, yy = m.y;
  if (mm > 11) { mm = 0; yy += 1; }
  state.profileMonth = { y: yy, m: mm };
  state.selectedDay = null;
  render();
};
window.__selDay = (epoch) => { state.selectedDay = state.selectedDay === epoch ? null : epoch; render(); };

// ---------- дневник ----------
window.__addJournal = () => {
  state.journal = newJournal();
  state.journalPrompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
  go('journalEditor');
};
window.__openJournal = (id) => {
  const j = Progress.getJournal(id);
  if (!j) return;
  state.journal = Object.assign({}, j, { tags: (j.tags || []).slice() });
  state.journalPrompt = JOURNAL_PROMPTS[0];
  go('journalEditor');
};
window.__jRate = (field, i) => { state.journal[field] = state.journal[field] === i ? 0 : i; render(); };
window.__jTag = (t) => {
  const arr = state.journal.tags;
  const i = arr.indexOf(t);
  if (i >= 0) arr.splice(i, 1); else arr.push(t);
  render();
};
window.__jText = (v) => { state.journal.text = v; };
window.__jFavEdit = (v) => { state.journal.favorite = v; };
window.__jFav = async (id) => {
  const j = Progress.getJournal(id);
  if (!j) return;
  j.favorite = !j.favorite;
  Progress.updateJournal(j);
  await Progress.save();
  render();
};
window.__jSave = async () => {
  const j = state.journal;
  Progress.updateJournal(j);
  await Progress.save();
  TG.haptic('notify', 'success');
  go('profile');
};
window.__jDelete = async () => {
  if (!confirm('Удалить запись?')) return;
  Progress.deleteJournal(state.journal.id);
  await Progress.save();
  go('profile');
};

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
    applyTheme();
    Progress.recordOpen(todayEpoch());
    applySessionToAudio();
    await STARS.syncPremium();
    TON.init(new URL('tonconnect-manifest.json', location.href).href);

    const q = new URLSearchParams(location.search);
    const s = q.get('s');
    if (s === 'home' || s === 'progress' || s === 'wallet' || s === 'premium' || s === 'knowledge'
        || s === 'music' || s === 'solfeggio' || s === 'playlist' || s === 'profile' || s === 'stats') {
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
