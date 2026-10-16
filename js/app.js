import { PATTERNS, GOALS, breathsPerMinute, getPattern } from './patterns.js?v35';
import { Progress, ACHIEVEMENTS, isCustomPatternId } from './store.js?v35';
import { ARTICLES, articleById } from './knowledge.js?v35';
import { MusicLibrary } from './music.js?v35';
import { SOLFEGGIO, toneByHz } from './solfeggio.js?v35';
import { BINAURAL, binauralByHz } from './binaural.js?v35';
import { ENERGY_MODES, MODE_DESCRIPTIONS, ENERGY_PRESETS, energyProgramById, EnergyInfo, EnergyPartners } from './energy.js?v35';
import { MatrixBase } from './matrix.js?v35';
import { Audio, BREATH_VARIANTS } from './audio.js?v35';
import { OrbVisuals, VISUAL_LEVELS, VISUAL_LABELS } from './visuals.js?v35';
import { TG, loadScript } from './telegram.js?v35';
import { BreathSession, fmtClock } from './session.js?v35';
import { TON } from './ton.js?v35';
import { STARS, PLANS } from './stars.js?v35';
import { Referral } from './referral.js?v35';
import { APP_VERSION } from './config.js?v35';

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
const PREMIUM_TEST = false;

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
  Audio.binauralOn = s.binauralOn;
  Audio.binauralHz = s.binauralHz;
  Audio.binauralVolume = s.binauralVolume;
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
    ${item('community', 'Сообщество', '👥')}
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
    <h3>Программы</h3>
    <button class="hub-card" onclick="window.__openEnergy()">
      <div class="hub-ico">🔷</div>
      <div><div class="hub-t">Энергодыхание Романа Карловского</div>
      <div class="hub-d">Связное частое и медленное дыхание под музыку и подсказки — отдельный плеер по этапам.</div>
      <div class="hub-m" style="color:var(--gold)">Есть противопоказания</div></div>
    </button>
    <button class="hub-card dim" onclick="window.__wip()">
      <div class="hub-ico">🌀</div>
      <div><div class="hub-t">Матрица Гаряева</div>
      <div class="hub-d">Метод волновой генетики: звуковые программы и описание методики</div>
      <div class="hub-m">В разработке</div></div>
    </button>
    ${navBar()}`;
}

function patternCard(p) {
  const phases = [
    ['INHALE', 'Вдох', p.inhaleSec],
    ['HOLD_IN', 'Задержка', p.holdInSec],
    ['EXHALE', 'Выдох', p.exhaleSec],
    ['HOLD_OUT', 'Задержка', p.holdOutSec],
  ].filter((x) => x[2] > 0);
  const segs = phases.map(([k, , d]) => `<div class="p-seg" style="flex:${d} 1 0%;background:${PHASE_COLORS[k]}"></div>`).join('');
  const legend = phases.map(([k, label, d]) => `<span><i style="background:${PHASE_COLORS[k]}"></i>${label} ${fmtSec(d)}</span>`).join('');
  return `<button class="card big" onclick="window.__open('${p.id}')">
    <div class="card-top">
      ${goalChip(p.goal)}
      <span class="bpm">${breathsPerMinute(p)} дых/мин</span>
    </div>
    <div class="card-name">${p.name}</div>
    <div class="card-desc">${p.shortDescription}</div>
    <div class="p-score">${segs}</div>
    <div class="p-legend">${legend}</div>
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
// Цвета фаз. Вдох и первая задержка — местами (по схеме).
// Задержка после выдоха — тёплый янтарный, чтобы не терялась на тёмном фоне.
const PHASE_COLORS = {
  INHALE: '#A78BFA', HOLD_IN: '#6EE7D0', EXHALE: '#7CA6F8', HOLD_OUT: '#E0A94F',
};
// Отдельные «свечные» цвета фаз — светлее, чтобы свечение не пропадало на задержке/выдохе.
const PHASE_GLOW = {
  INHALE: '#8B8CF8', HOLD_IN: '#40D1BE', EXHALE: '#5E82F7', HOLD_OUT: '#F2C879',
};

function currentPhaseColor() { return state.phaseGlow || PHASE_GLOW.INHALE; }

// Плавный цвет по фазе: в пределах перехода между фазами цвета смешиваются.
function hexRgb(hex) {
  const h = (hex || '#ffffff').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(a) {
  return '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
function rgba(hex, a) {
  const c = hexRgb(hex);
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
}
function phaseColorAt(pattern, p) {
  const phases = [
    { c: PHASE_GLOW.INHALE, d: pattern.inhaleSec },
    { c: PHASE_GLOW.HOLD_IN, d: pattern.holdInSec },
    { c: PHASE_GLOW.EXHALE, d: pattern.exhaleSec },
    { c: PHASE_GLOW.HOLD_OUT, d: pattern.holdOutSec },
  ].filter((x) => x.d > 0);
  if (!phases.length) return PHASE_GLOW.INHALE;
  const total = phases.reduce((s, x) => s + x.d, 0);
  const cum = [0];
  phases.forEach((x) => cum.push(cum[cum.length - 1] + x.d / total));
  const n = phases.length, w = 0.06;
  const stops = [[hexRgb(phases[0].c), 0]];
  for (let i = 1; i < n; i++) {
    stops.push([hexRgb(phases[i - 1].c), Math.max(0, cum[i] - w)]);
    stops.push([hexRgb(phases[i].c), Math.min(1, cum[i] + w)]);
  }
  stops.push([hexRgb(phases[n - 1].c), Math.max(0, 1 - w)]);
  stops.push([hexRgb(phases[0].c), 1]);
  p = ((p % 1) + 1) % 1;
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][1]) {
      const a = stops[i - 1], b = stops[i];
      const span = (b[1] - a[1]) || 1;
      const t = Math.max(0, Math.min(1, (p - a[1]) / span));
      return rgbHex([0, 1, 2].map((k) => a[0][k] + (b[0][k] - a[0][k]) * t));
    }
  }
  return rgbHex(stops[stops.length - 1][0]);
}

// Привязка визуализатора к текущему DOM экрана практики (вызывается после каждого рендера).
function bindVisuals() {
  const cv = document.getElementById('cosmos');
  const orb = document.getElementById('orb');
  if (!cv || !orb) return;
  OrbVisuals.attach(cv, orb, () => {
    const r = orb.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
  });
  OrbVisuals.setSampler(() => Audio.getLevels());
  OrbVisuals.setIntensity(Progress.session.visual || 'medium');
  OrbVisuals.setPhase(currentPhaseColor());
  if (!OrbVisuals.running) OrbVisuals.start();
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

// Кольцо цикла: четыре цветных сегмента по цветам фаз (как в партитуре).
function cycleArcsHtml(pattern) {
  const phases = [
    { color: PHASE_COLORS.INHALE, d: pattern.inhaleSec },
    { color: PHASE_COLORS.HOLD_IN, d: pattern.holdInSec },
    { color: PHASE_COLORS.EXHALE, d: pattern.exhaleSec },
    { color: PHASE_COLORS.HOLD_OUT, d: pattern.holdOutSec },
  ].filter((x) => x.d > 0);
  const total = phases.reduce((s, x) => s + x.d, 0) || 1;
  const R = 129, C = 2 * Math.PI * R;
  let cum = 0;
  return phases.map((p, i) => {
    const rot = (-90 + cum * 360).toFixed(3);
    cum += p.d / total;
    // Изначально пусто — сегмент открывается по мере прохождения цикла (обновляется в onTick).
    const dash = `0 ${C.toFixed(2)}`;
    return `<circle id="cycleGlow${i}" cx="137" cy="137" r="${R}" fill="none" stroke="${rgba(p.color, 0.26)}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${dash}" transform="rotate(${rot} 137 137)"></circle>`
      + `<circle id="cycleArc${i}" cx="137" cy="137" r="${R}" fill="none" stroke="${p.color}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${dash}" transform="rotate(${rot} 137 137)"></circle>`;
  }).join('');
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
    <canvas id="cosmos" class="cosmos"></canvas>
    <div class="s-top">
      <button class="back light" onclick="window.__stop()">‹</button>
      <span class="s-title" id="sName">${p.name}</span>
      <span class="s-remain" id="sRemain">${fmtClock(state.minutes * 60)}</span>
    </div>
    <div class="orb-wrap">
      <svg class="orb-svg" viewBox="0 0 310 310" aria-hidden="true">
        <circle class="ring-track" cx="155" cy="155" r="149"></circle>
        <circle class="ring-overall" id="ringOverall" cx="155" cy="155" r="149" stroke-dasharray="936.2" stroke-dashoffset="936.2"></circle>
      </svg>
      <div class="cycle-ring">
        <svg class="cycle-svg" viewBox="0 0 274 274" aria-hidden="true">
          <circle class="cycle-track" cx="137" cy="137" r="129"></circle>
          ${cycleArcsHtml(state.pattern)}
        </svg>
        <div class="cycle-dot" id="cycleDot"></div>
      </div>
      <div class="orb" id="orb"><div class="orb-inner"><span id="phase">Вдох</span>
        <span class="orb-left" id="phaseLeft">4</span></div></div>
    </div>
    <div class="practice-progress">
      <div class="pp-bar"><div class="pp-fill" id="overallFill" style="width:0%"></div></div>
      <div class="pp-times">
        <span id="overallLeft">0:00</span>
        <span class="muted">${fmtClock(state.minutes * 60)}</span>
      </div>
    </div>
    <div class="s-meta">
      <div><b id="elapsed">0:00</b><span>время</span></div>
      <div><b id="cycles">0</b><span>циклов</span></div>
    </div>
    <div class="s-actions">
      <button class="primary" id="pauseBtn" onclick="window.__pause()">Пауза</button>
      <button class="ghost" onclick="window.__stop()">Стоп</button>
    </div>
    <button class="ghost" onclick="window.__openMusicSheet()">♪ Музыка и партитура</button>
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
      ${toggleRow('Дыхание', s.breathOn, 'window.__setBreath')}
      ${toggleRow('Голос', s.voiceOn, 'window.__setVoice')}
      ${toggleRow('Метроном', s.metronomeOn, 'window.__setMetronome')}
      ${toggleRow('Вибрация', s.vibrateOn, 'window.__setVibrate')}
      ${toggleRow('Частота сольфеджио', s.solfeggioOn, 'window.__setSolfeggio')}
      ${toggleRow('Бинауральные ритмы', s.binauralOn, 'window.__setBinaural')}
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
      <h3>Бинауральные ритмы</h3>
      <button class="list-row pick" onclick="window.__openBinaural()">${binauralByHz(s.binauralHz).hz} Гц — ${binauralByHz(s.binauralHz).title} · ${binauralByHz(s.binauralHz).label} <span class="tag">Выбрать</span></button>
      <label class="field-label">Громкость ритма</label>
      <input type="range" min="0" max="1" step="0.01" value="${s.binauralVolume}" oninput="window.__setBinauralVolume(this.value)" />
      <p class="muted">Нужны наушники: в левое и правое ухо подаются близкие частоты, а мозг слышит разницу — это и есть ритм.</p>
      <h3>Эффекты орба</h3>
      <div class="chips">${VISUAL_LEVELS.map((l) => `<button class="chip ${s.visual === l ? 'on' : ''}" onclick="window.__setVisual('${l}')">${VISUAL_LABELS[l]}</button>`).join('')}</div>
      <p class="muted">Космос и реакция на музыку: «Средне» — заметно, «Слабо» — сдержанно, «Выкл» — без эффектов.</p>
      <h3>Звук дыхания</h3>
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

function screenBinaural() {
  const cur = Progress.session.binauralHz;
  const list = BINAURAL.map((b) =>
    `<button class="list-row pick ${b.hz === cur ? 'sel' : ''}" onclick="window.__selectBinaural(${b.hz})">
      <span class="dot" style="background:${b.color}"></span>
      <span class="list-col">
        <span class="list-t" style="color:${b.color}">${b.hz} Гц — ${b.title} · ${b.label}</span>
        <span class="muted">${b.desc}</span>
      </span>
      ${b.hz === cur ? '<span class="tag">играет</span>' : ''}
    </button>`).join('');
  return `${header('Бинауральные ритмы', true)}
    <p class="sub">Бинауральные ритмы работают в наушниках: в левое и правое ухо подаются две близкие частоты, а мозг воспринимает их разницу как ритм (биение). Значения традиционные, не являются медицинской рекомендацией.</p>
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

function todayMinutes() {
  const t = todayEpoch();
  return Math.round(Progress.sessionsLog.filter((s) => s.dayEpochDay === t).reduce((a, s) => a + s.seconds, 0) / 60);
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
  const ach = ACHIEVEMENTS.map((a) => {
    const on = d.achievements.includes(a.id);
    return `<div class="ach ${on ? 'on' : ''}"><div class="ach-ico">${a.icon}</div>
      <div class="ach-t">${a.title}</div><div class="ach-d">${a.desc}</div></div>`;
  }).join('');

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
    <h3>Достижения</h3>
    <div class="ach-grid">${ach}</div>
    <button class="ghost" onclick="window.__go('stats')">Вся история практик</button>
    <p class="muted" style="text-align:center;margin:16px 0 4px">«Дыхание» · версия ${APP_VERSION}</p>
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

// ---------- энергодыхание ----------
let bgEl = null;
let extEl = null;
let epTimer = null;
let audioPoll = null;

function playBg(trackId, vol) {
  if (!bgEl) { bgEl = new window.Audio(); bgEl.loop = true; }
  bgEl.src = MusicLibrary.url(trackId);
  bgEl.volume = vol;
  bgEl.play().catch(() => {});
}
function stopBg() { if (bgEl) { bgEl.pause(); bgEl.currentTime = 0; } }

function energyCard(title, subtitle, enabled, handler) {
  return `<button class="hub-card ${enabled ? '' : 'dim'}" onclick="window.${handler}()">
    <div class="hub-ico">🔷</div>
    <div><div class="hub-t">${title}</div>
    <div class="hub-d">${subtitle}</div></div>
  </button>`;
}

function screenEnergy() {
  const ack = !!state.energyAck;
  return `${header('Энергодыхание', true)}
    <p class="sub">${EnergyInfo.title}</p>
    <p>${EnergyInfo.intro[0]}</p>
    <button class="mini" onclick="window.__energyAbout()">О методе и противопоказаниях ›</button>
    <label class="check-row"><input type="checkbox" ${ack ? 'checked' : ''} onchange="window.__energyAck(this.checked)"><span>Я ознакомился с противопоказаниями</span></label>
    ${energyCard('Прокачай свой мозг', 'Аудио-практики', ack, '__energyCourse')}
    ${energyCard('Создать своё энергодыхание', 'Собрать программу по этапам', ack, '__energyBuilder')}
    ${energyCard('Быстрый старт по этапам', 'Готовая программа: короткая / стандарт / глубокая', ack, '__energyPreset')}
    ${!ack ? '<p class="muted">Отметьте согласие выше, чтобы открыть практики.</p>' : ''}`;
}

function screenEnergyAbout() {
  const h = (t) => `<h3>${t}</h3>`;
  return `${header('О методе', true)}
    ${h('Как это работает')}${EnergyInfo.intro.map((p) => `<p>${p}</p>`).join('')}
    ${h('Дыхание и ритмы мозга')}${EnergyInfo.brainRhythms.map((p) => `<p class="muted">${p}</p>`).join('')}
    ${h('Что происходит в процессе')}${EnergyInfo.process.map((p) => `<p>${p}</p>`).join('')}
    ${h('Результаты практики')}${EnergyInfo.results.map((p) => `<p>${p}</p>`).join('')}
    ${h('Научное подтверждение')}${EnergyInfo.science.map((p) => `<p class="muted">${p}</p>`).join('')}
    <div class="info-card warn"><h3>Противопоказания</h3>${EnergyInfo.contraindications.map((p) => `<p>${p}</p>`).join('')}</div>`;
}

function fmtMinSec(sec) { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }

function screenEnergyPreset() {
  const firstDay = Progress.energyPresetFirstDay;
  const today = todayEpoch();
  const premium = isPremium();
  const unlocked = (id) => id === 'short' || (id === 'standard' && firstDay > 0 && today > firstDay) || (id === 'deep' && premium);
  const preset = state.energyPreset || (unlocked('standard') ? 'standard' : 'short');
  const program = energyProgramById(preset);
  const chips = ENERGY_PRESETS.map((p) => `<button class="${p.id === preset ? 'primary' : 'ghost'} chip-btn" onclick="window.__epSelect('${p.id}')">${p.title}${unlocked(p.id) ? '' : ' 🔒'}</button>`).join('');
  const hint = !unlocked('standard')
    ? 'Сейчас доступна только «Короткая». На следующий день откроется «Стандарт», а «Глубокая» — в Premium.'
    : (preset === 'deep' && !premium ? '«Глубокая» доступна в Premium.' : 'Прогрессия: «Короткая» → «Стандарт» (со следующего дня) → «Глубокая» (Premium).');
  return `${header('Быстрый старт по этапам', true)}
    <p class="sub">Готовая программа: настройка → разогрев → связное частое дыхание → медленное глубокое → интеграция.</p>
    <h3>Длительность</h3>
    <div class="row-3">${chips}</div>
    <p class="muted">${hint}</p>
    <p class="tag">Всего: ${Math.floor(program.totalSeconds / 60)} мин ${program.totalSeconds % 60} сек</p>
    ${program.stages.map((s) => `<p>• ${s.title} — ${fmtMinSec(s.seconds)}</p>`).join('')}
    <button class="primary" onclick="window.__energyStart()">Начать</button>`;
}

function screenEnergyCourse() {
  return `${header('Прокачай свой мозг', true)}
    <p class="sub">Аудио-практики</p>
    <p>Поздравляем вас с решением стать участником программы «Дыхание и мозг». Мы уверены, этот курс станет для вас настоящим открытием: он поможет восстановить энергию, улучшить сон, наладить работу внимания и дать вам новый инструмент управления своим состоянием.</p>
    <label class="field-label">Выбрать аудио-практику с устройства</label>
    <input class="text-input" type="file" accept="audio/*" onchange="window.__pickAudio(this)" />
    <p class="muted">Выберите аудиофайл практики — он откроется в плеере.</p>`;
}

function screenEnergyBuilder() {
  const programs = Progress.energyPrograms;
  const rows = programs.length
    ? programs.map((p) => `<div class="list-row"><span class="list-col"><span class="list-t">${p.title}</span>
        <span class="muted">${p.stages.length} этап(ов) · ${fmtMinSec(p.stages.reduce((s, x) => s + x.seconds, 0))}</span></span>
        <button class="mini" onclick="window.__eeEdit('${p.id}')">Изменить</button>
        <button class="mini" onclick="window.__energyPlayCustom('${p.id}')">Играть</button></div>`).join('')
    : `<p class="muted">Пока нет своих программ. Создайте первую — задайте этапы с названием, длительностью и подсказкой.</p>`;
  return `${header('Своё энергодыхание', true)}
    <p class="sub">Соберите программу по этапам и запускайте её как практику.</p>
    <button class="ghost" onclick="window.__eeNew()">＋ Создать свою программу</button>
    <div class="list">${rows}</div>`;
}

function screenEnergyEdit() {
  const e = state.energyEdit;
  const modeBtns = (i, mode) => Object.keys(ENERGY_MODES).map((m) =>
    `<button class="chip ${mode === m ? 'on' : ''}" onclick="window.__eeMode(${i},'${m}')">${ENERGY_MODES[m].label}</button>`).join('');
  const stages = e.stages.map((s, i) => `<div class="stage-card">
    <div class="j-top"><span class="list-t">Этап ${i + 1}</span>
      ${e.stages.length > 1 ? `<button class="mini" onclick="window.__eeDel(${i})">Удалить</button>` : ''}</div>
    <input class="text-input" maxlength="40" value="${s.title}" oninput="window.__eeField(${i},'title',this.value)" placeholder="Название этапа" />
    <label class="field-label">Длительность: <span id="eeSec-${i}">${fmtMinSec(s.seconds)}</span></label>
    <input type="range" min="5" max="1200" step="5" value="${s.seconds}" oninput="window.__eeField(${i},'seconds',this.value)" />
    <input class="text-input" maxlength="160" value="${s.guidance}" oninput="window.__eeField(${i},'guidance',this.value)" placeholder="Подсказка" />
    <div class="chips">${modeBtns(i, s.mode)}</div>
    <p class="muted">${MODE_DESCRIPTIONS[s.mode]}</p>
  </div>`).join('');
  return `${header(e.id ? 'Изменить программу' : 'Новая программа', true)}
    <label class="field-label">Название</label>
    <input class="text-input" maxlength="60" value="${e.title}" oninput="window.__eeTitle(this.value)" />
    ${stages}
    <button class="ghost" onclick="window.__eeAdd()">＋ Добавить этап</button>
    <button class="primary" onclick="window.__eeSave()">Сохранить</button>
    ${e.id ? '<button class="ghost" onclick="window.__eeDelete()">Удалить программу</button>' : ''}`;
}

function partnerLinksHtml() {
  const premium = isPremium();
  return `<h3>Партнёрские бонусы</h3>
    <button class="ghost" onclick="window.__openUrl('${EnergyPartners.CLUB_URL}')">Закрытый клуб</button>
    <button class="ghost" onclick="window.__openUrl('${EnergyPartners.COURSE_URL}')">Курсы и тарифы</button>
    ${premium
      ? `<div class="copy-row"><span class="tag">Промокод: ${EnergyPartners.PROMO}</span><button class="mini" onclick="window.__copy('${EnergyPartners.PROMO}')">Копировать</button></div>`
      : `<p class="muted">Промокод школы энергодыхания на скидку курсов — в Premium.</p><button class="ghost" onclick="window.__go('premium')">Открыть купон в Premium</button>`}`;
}

function stageAt(program, elapsed) {
  let acc = 0, idx = 0;
  for (let i = 0; i < program.stages.length; i++) {
    if (elapsed < acc + program.stages[i].seconds) { idx = i; return { idx, acc, stage: program.stages[i] }; }
    acc += program.stages[i].seconds;
    idx = i;
  }
  return { idx, acc: acc - (program.stages[idx] ? program.stages[idx].seconds : 0), stage: program.stages[idx] };
}

function screenEnergyPlayer() {
  const program = state.energyProgram;
  if (!program) return `${header('Энергодыхание', true)}<p>Программа не найдена.</p>`;
  if (state.epFinished) {
    return `${header('Энергодыхание', true)}
      <div class="done"><div class="done-ico">🔷</div><h2>Готово!</h2>
      <p>Энергодыхание · ${program.presetTitle} · ${Math.floor(program.totalSeconds / 60)} мин</p>
      <p class="muted">Побудь в тишине пару минут.</p>
      <button class="primary" onclick="window.__epExit()">Назад</button></div>`;
  }
  const cur = stageAt(program, state.epElapsed || 0);
  const color = ENERGY_MODES[cur.stage.mode].color;
  const list = program.stages.map((s, i) => `<div class="ep-item ${i === cur.idx ? 'on' : ''}" id="epItem-${i}">${fmtMinSec(s.seconds)} &nbsp; ${s.title}</div>`).join('');
  return `<div class="session">
    <div class="s-top"><button class="back light" onclick="window.__epExit()">‹</button>
      <span class="s-title">Энергодыхание · ${program.presetTitle}</span>
      <span class="s-remain" id="epRemain">${fmtClock(program.totalSeconds - (state.epElapsed || 0))}</span></div>
    <div class="ep-orb-wrap">
      <div class="ep-orb" id="epOrb" style="background:${color}"><div class="orb-inner"><span id="epStage">${cur.stage.title}</span>
        <span class="orb-left" id="epStageLeft">${cur.stage.seconds - (state.epElapsed - cur.acc)}</span></div></div>
    </div>
    <p class="ep-guide" id="epGuide">${cur.stage.guidance}</p>
    <div class="overall"><div class="overall-fill" id="epFill" style="width:${((state.epElapsed || 0) / program.totalSeconds * 100).toFixed(1)}%"></div></div>
    <div class="s-actions">
      <button class="primary" id="epPause" onclick="window.__epPause()">Пауза</button>
      <button class="ghost" onclick="window.__epSkip()">Пропустить</button>
    </div>
    ${toggleRow('Музыка', state.epMusic !== false, 'window.__epMusic')}
    <div class="ep-list">${list}</div>
    ${partnerLinksHtml()}
  </div>`;
}

function epTick() {
  const program = state.energyProgram;
  if (!program || !state.epRunning) return;
  state.epElapsed += 1;
  if (state.epElapsed >= program.totalSeconds) { state.epElapsed = program.totalSeconds; epFinish(); return; }
  const cur = stageAt(program, state.epElapsed);
  const color = ENERGY_MODES[cur.stage.mode].color;
  const orb = document.getElementById('epOrb');
  if (orb) orb.style.background = color;
  const st = document.getElementById('epStage'); if (st) st.textContent = cur.stage.title;
  const sl = document.getElementById('epStageLeft'); if (sl) sl.textContent = cur.stage.seconds - (state.epElapsed - cur.acc);
  const gd = document.getElementById('epGuide'); if (gd) gd.textContent = cur.stage.guidance;
  const rm = document.getElementById('epRemain'); if (rm) rm.textContent = fmtClock(program.totalSeconds - state.epElapsed);
  const fl = document.getElementById('epFill'); if (fl) fl.style.width = (state.epElapsed / program.totalSeconds * 100).toFixed(1) + '%';
  program.stages.forEach((s, i) => {
    const el = document.getElementById('epItem-' + i);
    if (el) el.classList.toggle('on', i === cur.idx);
  });
}

function startEpTimer() {
  if (epTimer) clearInterval(epTimer);
  epTimer = setInterval(epTick, 1000);
}

function epFinish() {
  if (epTimer) { clearInterval(epTimer); epTimer = null; }
  stopBg();
  state.epFinished = true;
  state.epRunning = false;
  Progress.addSessionLog({
    patternId: 'energy_' + state.energyProgram.presetId, patternName: 'Энергодыхание',
    startedAt: state.epStartedAt || Date.now(), seconds: state.energyProgram.totalSeconds,
    completed: true, dayEpochDay: todayEpoch(),
  });
  Progress.save();
  render();
}

// ---------- матрица Гаряева ----------
function screenMatrix() {
  return `${header('Матрица Гаряева', true)}
    ${MatrixBase.intro.map((p) => `<p class="muted">${p}</p>`).join('')}
    <h3>Аудио-матрицы</h3>
    <input class="text-input" type="file" accept="audio/*" onchange="window.__pickAudio(this)" />
    <p class="muted">Выберите аудио-матрицу с устройства — она откроется в плеере.</p>
    <h3>Программы</h3>
    ${MatrixBase.entries.map((e) => `<div class="info-card"><h3>${e.title}</h3><p>${e.desc}</p></div>`).join('')}
    <p class="muted">${MatrixBase.disclaimer}</p>`;
}

// ---------- универсальный аудиоплеер (файл с устройства) ----------
function screenAudio() {
  const name = state.audioName || 'Аудио';
  return `${header('Аудио', true)}
    <p class="sub">${name}</p>
    <label class="field-label">Позиция</label>
    <input type="range" id="audioSeek" min="0" max="1000" value="0" oninput="window.__audioSeek(this.value)" />
    <div class="row-2"><span class="muted" id="audioPos">0:00</span><span class="muted" id="audioDur" style="margin-left:auto">0:00</span></div>
    <button class="primary" id="audioBtn" onclick="window.__audioToggle()">Пауза</button>
    <button class="ghost" onclick="window.__audioRestart()">Сначала</button>
    <p class="muted">Прослушивайте в спокойной обстановке, лучше в наушниках. При дискомфорте сделайте паузу.</p>`;
}

function startAudioPoll() {
  stopAudioPoll();
  audioPoll = setInterval(() => {
    if (!extEl) return;
    const d = extEl.duration || 0;
    const p = extEl.currentTime || 0;
    const seek = document.getElementById('audioSeek');
    if (seek && d > 0 && !seek.dataset.dragging) seek.value = Math.round(p / d * 1000);
    const pos = document.getElementById('audioPos'); if (pos) pos.textContent = fmtClock(p);
    const dur = document.getElementById('audioDur'); if (dur) dur.textContent = fmtClock(d);
    const btn = document.getElementById('audioBtn'); if (btn) btn.textContent = extEl.paused ? 'Играть' : 'Пауза';
  }, 500);
}
function stopAudioPoll() { if (audioPoll) { clearInterval(audioPoll); audioPoll = null; } }

// ---------- прогресс ----------
function journalRowsHtml() {
  return Progress.journal.length
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
    : '<p class="muted">Пока пусто. Добавьте первую запись — и здесь появятся ваши заметки.</p>';
}

function screenProgress() {
  const d = Progress.data;
  const month = state.profileMonth || { y: new Date().getFullYear(), m: new Date().getMonth() };
  const days = buildDayMap();
  const used = todayMinutes();
  const limit = Progress.data.premium ? '∞ (Premium)' : '30';
  return `${header('Прогресс')}
    <div class="level-card">
      <div class="level-num">Уровень ${Progress.level}</div>
      <div class="bar"><div class="bar-fill" style="width:${Progress.xpIntoLevel}%"></div></div>
      <div class="muted">${Progress.xpIntoLevel} / 100 XP · до следующего ${Progress.xpToNext} XP</div>
    </div>
    <div class="stats-row">
      <div class="stat"><b>${d.sessions}</b><span>практик</span></div>
      <div class="stat"><b>${d.streak}</b><span>серия</span></div>
      <div class="stat"><b>${d.bestStreak}</b><span>рекорд</span></div>
      <div class="stat"><b>${Math.round(d.totalMinutes)}</b><span>минут</span></div>
    </div>
    <button class="ghost" onclick="window.__share()">Поделиться результатом</button>
    <button class="hub-card" onclick="window.__openDiary()">
      <div class="hub-ico">📔</div>
      <div><div class="hub-t">Дневник состояний</div>
      <div class="hub-d">Записывайте самочувствие и инсайты после практик</div>
      <div class="hub-m">${Progress.journal.length} записей</div></div>
    </button>
    <h3>Календарь активности</h3>
    ${activityCalendarHtml(month, days)}
    ${state.selectedDay ? dayDetailsHtml(state.selectedDay, days) : ''}
    <p class="muted">Сегодня практики: ${used} мин из ${limit}</p>
    ${navBar()}`;
}

function screenDiary() {
  return `${header('Дневник состояний', true)}
    <div class="info-card">
      <h3>Зачем записывать</h3>
      <p>Отмечайте самочувствие и мысли после практик — так виден прогресс, легче замечать, что помогает, и удерживается мотивация.</p>
    </div>
    <button class="primary" onclick="window.__addJournal()">＋ Запись о состоянии</button>
    <div class="j-list">${journalRowsHtml()}</div>
    ${navBar()}`;
}

function screenCommunity() {
  return `${header('Сообщество')}
    <div class="info-card">
      <h3>В разработке</h3>
      <p>Раздел «Сообщество» скоро появится — ждите обновлений!</p>
    </div>
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
    <button class="ghost" onclick="window.__openReferral()">🤝 Пригласи друга — 10%</button>
    ${navBar()}`;
}

// ---------- партнёрская программа ----------
function screenReferral() {
  const r = state.referral;
  if (!r) return `${header('Пригласи друга', true)}<p class="sub">Загрузка…</p>${navBar()}`;
  const link = Referral.link(r.refCode);
  return `${header('Пригласи друга', true)}
    <p class="sub">Приглашайте друзей и получайте <b>${r.percent}%</b> от каждой их оплаты звёздами.</p>
    <div class="info-card">
      <h3>Ваша ссылка</h3>
      <p class="mono" style="word-break:break-all">${link}</p>
      <div class="row-2">
        <button class="ghost" onclick="window.__copyRef('${link}')">Копировать</button>
        <button class="primary" onclick="window.__shareRef('${link}')">Поделиться</button>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat"><b>${r.invited}</b><span>приглашено</span></div>
      <div class="stat"><b>${r.earnedStars}★</b><span>начислено</span></div>
      <div class="stat"><b>${r.balanceStars}★</b><span>к выплате</span></div>
    </div>
    <h3>Выплата</h3>
    <p class="muted">Заработанные звёзды перечисляем в TON на ваш кошелёк (после холда Telegram). Укажите адрес и запросите выплату.</p>
    <input class="text-input" value="${r.wallet || ''}" placeholder="TON-кошелёк (EQ…)" oninput="window.__refWallet(this.value)" />
    <button class="primary" onclick="window.__refPayout()">Запросить выплату</button>
    ${navBar()}`;
}

function render() {
  let html = '';
  if (state.screen === 'onboarding') html = screenOnboarding();
  else if (state.screen === 'home') html = screenHome();
  else if (state.screen === 'detail') html = screenDetail();
  else if (state.screen === 'session') html = screenSession();
  else if (state.screen === 'progress') html = screenProgress();
  else if (state.screen === 'diary') html = screenDiary();
  else if (state.screen === 'community') html = screenCommunity();
  else if (state.screen === 'wallet') html = screenWallet();
  else if (state.screen === 'premium') html = screenPremium();
  else if (state.screen === 'referral') html = screenReferral();
  else if (state.screen === 'editor') html = screenEditor();
  else if (state.screen === 'knowledge') html = screenKnowledge();
  else if (state.screen === 'knowledgeDetail') html = screenKnowledgeDetail();
  else if (state.screen === 'music') html = screenMusic();
  else if (state.screen === 'solfeggio') html = screenSolfeggio();
  else if (state.screen === 'binaural') html = screenBinaural();
  else if (state.screen === 'playlist') html = screenPlaylist();
  else if (state.screen === 'profile') html = screenProfile();
  else if (state.screen === 'journalEditor') html = screenJournalEditor();
  else if (state.screen === 'stats') html = screenStats();
  else if (state.screen === 'energy') html = screenEnergy();
  else if (state.screen === 'energyAbout') html = screenEnergyAbout();
  else if (state.screen === 'energyPreset') html = screenEnergyPreset();
  else if (state.screen === 'energyCourse') html = screenEnergyCourse();
  else if (state.screen === 'energyBuilder') html = screenEnergyBuilder();
  else if (state.screen === 'energyEdit') html = screenEnergyEdit();
  else if (state.screen === 'energyPlayer') html = screenEnergyPlayer();
  else if (state.screen === 'matrix') html = screenMatrix();
  else if (state.screen === 'audio') html = screenAudio();
  if (state.rename) html += renameModalHtml();
  // Если практика идёт, но мы на другом экране — показываем кнопку возврата.
  if (state.session && state.screen !== 'session') {
    html += `<button class="resume-practice" onclick="window.__resumeSession()">▶ Вернуться к практике</button>`;
  }
  app.innerHTML = html;
  if (state.screen === 'session' && state.session) bindVisuals();
}

// ---------- навигация ----------
window.__go = (s) => { TG.haptic('select'); go(s); };
window.__open = (id) => { const p = findPattern(id); if (p) go('detail', { pattern: p, minutes: p.defaultMinutes }); };
window.__back = () => {
  const s = state.screen;
  if (s === 'knowledgeDetail') go('knowledge');
  else if (s === 'journalEditor' || s === 'stats') go('profile');
  else if (s === 'referral') go('premium');
  else if (s === 'diary') go('progress');
  else if (s === 'wallet') go('profile');
  else if (s === 'energyAbout' || s === 'energyPreset' || s === 'energyCourse' || s === 'energyBuilder') go('energy');
  else if (s === 'energyEdit') go('energyBuilder');
  else if (s === 'audio') { stopAudioPoll(); if (extEl) extEl.pause(); go(state.audioBack || 'home'); }
  else if (s === 'music' || s === 'solfeggio' || s === 'playlist' || s === 'binaural') go(state.session ? 'session' : 'home');
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

// ---------- энергодыхание / матрица ----------
window.__openEnergy = () => go('energy');
window.__openMatrix = () => go('matrix');
window.__openDiary = () => go('diary');
window.__wip = () => alert('Раздел в разработке — ждите обновлений.');
window.__energyAck = (v) => { state.energyAck = v; render(); };
window.__energyAbout = () => go('energyAbout');
window.__energyPreset = () => go('energyPreset');
window.__energyCourse = () => { if (state.energyAck) go('energyCourse'); };
window.__energyBuilder = () => { if (state.energyAck) go('energyBuilder'); };
window.__openUrl = (url) => TG.openLink(url);
window.__copy = (text) => {
  try { navigator.clipboard.writeText(text); alert('Промокод скопирован'); }
  catch (e) { alert('Промокод: ' + text); }
};
window.__epSelect = (id) => {
  const firstDay = Progress.energyPresetFirstDay, today = todayEpoch(), premium = isPremium();
  const unlocked = id === 'short' || (id === 'standard' && firstDay > 0 && today > firstDay) || (id === 'deep' && premium);
  if (!unlocked) { go('premium'); return; }
  state.energyPreset = id;
  render();
};
window.__energyStart = () => {
  const preset = state.energyPreset || 'short';
  if (preset === 'short') { Progress.setEnergyFirstDay(todayEpoch()); Progress.save(); }
  startEnergy(energyProgramById(preset));
};
window.__energyPlayCustom = (id) => {
  const p = Progress.getEnergyProgram(id);
  if (!p) return;
  startEnergy({ presetId: p.id, presetTitle: p.title, title: p.title, totalSeconds: p.stages.reduce((s, x) => s + x.seconds, 0), stages: p.stages });
};
function startEnergy(program) {
  Audio.unlock();
  state.energyProgram = program;
  state.epElapsed = 0;
  state.epRunning = true;
  state.epFinished = false;
  state.epMusic = true;
  state.epStartedAt = Date.now();
  go('energyPlayer');
  playBg(MusicLibrary.default.id, 0.6);
  startEpTimer();
}
window.__epPause = () => {
  state.epRunning = !state.epRunning;
  if (bgEl) { if (state.epRunning) bgEl.play().catch(() => {}); else bgEl.pause(); }
  const b = document.getElementById('epPause');
  if (b) b.textContent = state.epRunning ? 'Пауза' : 'Продолжить';
};
window.__epSkip = () => {
  const program = state.energyProgram;
  const cur = stageAt(program, state.epElapsed);
  state.epElapsed = cur.acc + cur.stage.seconds;
  if (state.epElapsed >= program.totalSeconds) { state.epElapsed = program.totalSeconds; epFinish(); return; }
  epTick();
};
window.__epMusic = (v) => { state.epMusic = v; if (bgEl) bgEl.volume = v ? 0.6 : 0; };
window.__epExit = () => {
  if (epTimer) { clearInterval(epTimer); epTimer = null; }
  stopBg();
  state.epFinished = false;
  state.epRunning = false;
  go('energy');
};
window.__eeNew = () => {
  state.energyEdit = {
    id: '', title: 'Моё энергодыхание',
    stages: [
      { title: 'Настройка', seconds: 45, guidance: 'Дыши спокойно, расслабься.', mode: 'CALM' },
      { title: 'Связное частое дыхание', seconds: 300, guidance: 'Дыши связно и часто, без пауз.', mode: 'FAST' },
      { title: 'Интеграция', seconds: 120, guidance: 'Дыши спокойно, расслабься.', mode: 'INTEGRATE' },
    ],
  };
  go('energyEdit');
};
window.__eeEdit = (id) => {
  const p = Progress.getEnergyProgram(id);
  if (!p) return;
  state.energyEdit = { id: p.id, title: p.title, stages: p.stages.map((s) => ({ ...s })) };
  go('energyEdit');
};
window.__eeTitle = (v) => { state.energyEdit.title = v; };
window.__eeField = (i, field, v) => {
  const st = state.energyEdit.stages[i];
  if (field === 'seconds') {
    st.seconds = Math.min(1200, Math.max(5, (Math.round(parseInt(v, 10) / 5) * 5) || 5));
    const el = document.getElementById('eeSec-' + i);
    if (el) el.textContent = fmtMinSec(st.seconds);
  } else st[field] = v;
};
window.__eeMode = (i, mode) => { state.energyEdit.stages[i].mode = mode; render(); };
window.__eeAdd = () => { state.energyEdit.stages.push({ title: 'Новый этап', seconds: 60, guidance: '', mode: 'CALM' }); render(); };
window.__eeDel = (i) => { const s = state.energyEdit.stages; if (s.length > 1) { s.splice(i, 1); render(); } };
window.__eeSave = async () => {
  const e = state.energyEdit;
  Progress.upsertEnergyProgram({
    id: e.id || undefined,
    title: (e.title || '').trim() || 'Моё энергодыхание',
    stages: e.stages.map((s) => ({ title: s.title, seconds: s.seconds, guidance: s.guidance, mode: s.mode })),
  });
  await Progress.save();
  go('energyBuilder');
};
window.__eeDelete = async () => {
  if (!confirm('Удалить программу?')) return;
  Progress.deleteEnergyProgram(state.energyEdit.id);
  await Progress.save();
  go('energyBuilder');
};
window.__pickAudio = (input) => {
  const f = input.files && input.files[0];
  if (!f) return;
  if (extEl) extEl.pause();
  extEl = new window.Audio();
  extEl.src = URL.createObjectURL(f);
  state.audioName = f.name.replace(/\.[^.]+$/, '');
  state.audioBack = state.screen;
  extEl.play().catch(() => {});
  go('audio');
  startAudioPoll();
};
window.__audioToggle = () => { if (!extEl) return; if (extEl.paused) extEl.play().catch(() => {}); else extEl.pause(); };
window.__audioSeek = (v) => { if (!extEl) return; const d = extEl.duration || 0; if (d > 0) extEl.currentTime = (parseInt(v, 10) / 1000) * d; };
window.__audioRestart = () => { if (extEl) { extEl.currentTime = 0; extEl.play().catch(() => {}); } };

// ---------- сессия ----------
window.__start = () => {
  // Если практика уже идёт — не плодим вторую, а возвращаемся к текущей.
  if (state.session) { go('session'); return; }
  // Дневной лимит 30 минут для не-Premium
  if (!Progress.data.premium && todayMinutes() >= 30) {
    alert('Дневной лимит 30 минут исчерпан.\n\nС Premium — практики без ограничений.');
    go('premium');
    return;
  }
  Audio.unlock();
  applySessionToAudio();
  state.phaseGlow = PHASE_GLOW.INHALE;
  go('session');
  Audio.startSession();
  const total = state.minutes * 60;
  state.sessionStart = Date.now();
  let lastSec = -1;
  let accentPending = false;
  const session = new BreathSession(state.pattern, state.minutes, {
    onPhase: (ph, durSec) => {
      accentPending = true;
      state.phaseGlow = PHASE_GLOW[ph.key] || state.phaseGlow;
      OrbVisuals.setPhase(state.phaseGlow);
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
      const overall = 1 - t.remaining / total;
      const fill = document.getElementById('overallFill');
      if (fill) fill.style.width = (overall * 100).toFixed(1) + '%';
      const C1 = 936.2;
      const ro = document.getElementById('ringOverall');
      if (ro) ro.setAttribute('stroke-dashoffset', (C1 * (1 - overall)).toFixed(2));
      const cp = t.cycleProgress || 0;
      const col = phaseColorAt(state.pattern, cp);
      // Открываем цветные сегменты кольца за точкой по мере прохождения цикла.
      const ph = [
        { d: state.pattern.inhaleSec }, { d: state.pattern.holdInSec },
        { d: state.pattern.exhaleSec }, { d: state.pattern.holdOutSec },
      ].filter((x) => x.d > 0);
      const phTotal = ph.reduce((s, x) => s + x.d, 0) || 1;
      const Cc = 2 * Math.PI * 129;
      let cum = 0;
      ph.forEach((x, i) => {
        const frac = x.d / phTotal;
        const len = Math.max(0, Math.min(frac, cp - cum)) * Cc;
        const dash = len.toFixed(2) + ' ' + Math.max(1, Cc - len).toFixed(2);
        const a = document.getElementById('cycleArc' + i);
        if (a) a.setAttribute('stroke-dasharray', dash);
        const g = document.getElementById('cycleGlow' + i);
        if (g) g.setAttribute('stroke-dasharray', dash);
        cum += frac;
      });
      const dot = document.getElementById('cycleDot');
      if (dot) {
        // Позиция точки — через left/top (без transform: transform создавал слой, который «швырил»).
        const ang = cp * 2 * Math.PI;
        const dx = 137 + 129 * Math.sin(ang);
        const dy = 137 - 129 * Math.cos(ang);
        dot.style.left = dx.toFixed(1) + 'px';
        dot.style.top = dy.toFixed(1) + 'px';
        dot.style.background = col;
        dot.style.boxShadow = '0 0 10px ' + col;
      }
      const ol = document.getElementById('overallLeft');
      if (ol) ol.textContent = fmtClock(t.elapsed);
      const mark = document.getElementById('scoreMark');
      if (mark) {
        const p = t.cycleProgress || 0;
        mark.style.left = (p * 100).toFixed(2) + '%';
        // на стыке цикла линия мягко гаснет у правого края и появляется у левого
        const edge = 0.08;
        let o = 1;
        if (p < edge) o = p / edge;
        else if (p > 1 - edge) o = (1 - p) / edge;
        mark.style.opacity = Math.max(0, Math.min(1, o)).toFixed(2);
      }
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
      OrbVisuals.stop();
      state.phaseGlow = null;
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
  bindVisuals();
  session.start();
};

window.__resumeSession = () => { if (state.session) go('session'); };
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
  OrbVisuals.stop();
  state.phaseGlow = null;
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
window.__setVisual = (v) => {
  Progress.setSession({ visual: v });
  Progress.save();
  OrbVisuals.setIntensity(v);
  if (v !== 'off' && state.screen === 'session' && !OrbVisuals.running) OrbVisuals.start();
  render();
};
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
window.__setBinaural = (v) => { Audio.setBinaural(v); persistAndRerender({ binauralOn: v }); render(); };
window.__setBinauralVolume = (v) => { Audio.setBinauralVolume(parseFloat(v)); Progress.setSession({ binauralVolume: parseFloat(v) }); };
window.__openBinaural = () => go('binaural');
window.__selectBinaural = (hz) => {
  Audio.setBinauralHz(hz);
  persistAndRerender({ binauralHz: hz });
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

// партнёрская программа
window.__openReferral = async () => {
  const fallback = { refCode: '', invited: 0, earnedStars: 0, balanceStars: 0, wallet: '', percent: 10 };
  go('referral');
  if (Referral.configured) {
    try { state.referral = await Referral.me(); } catch (e) { state.referral = state.referral || fallback; }
  } else {
    state.referral = fallback;
  }
  if (state.screen === 'referral') render();
};
window.__copyRef = (link) => { try { navigator.clipboard.writeText(link); alert('Ссылка скопирована'); } catch (e) { alert(link); } };
window.__shareRef = (link) => TG.share(link, 'Попробуй «Дыхание» — дыхательные практики и энергодыхание в Telegram');
window.__refWallet = (v) => { state.refWallet = v; };
window.__refPayout = async () => {
  const w = (state.refWallet || (state.referral && state.referral.wallet) || '').trim();
  try { state.referral = await Referral.payout(w); alert('Заявка на выплату создана'); render(); }
  catch (e) { alert('Не удалось: ' + e.message); }
};

window.__onWalletChange = () => { if (state.screen === 'wallet') render(); };
window.__onPremiumChange = () => { if (state.screen === 'premium') render(); };

// ---------- сворачивание приложения ----------
// При уходе в фон ставим практику на паузу (аудио и таймер), чтобы при возврате
// не было «прыжка» времени и недописанных сессий.
document.addEventListener('visibilitychange', () => {
  try {
  if (!document.hidden) return;
  if (state.session && !state.session.paused) {
    state.session.pause();
    Audio.pauseSession();
    const b = document.getElementById('pauseBtn');
    if (b) b.textContent = 'Продолжить';
  }
  if (state.energyProgram && state.epRunning && state.screen === 'energyPlayer') {
    state.epRunning = false;
    if (bgEl) bgEl.pause();
    const b = document.getElementById('epPause');
    if (b) b.textContent = 'Продолжить';
  }
  if (state.screen === 'audio' && extEl && !extEl.paused) {
    extEl.pause();
  }
  } catch (e) { console.error('visibility handler', e); }
});

// Изменение размера окна (в т.ч. Telegram разворачивает/сворачивает вью) —
// пересчитываем канвас космоса, чтобы не было тёмных полос по краям.
window.addEventListener('resize', () => { if (state.screen === 'session' && state.session) bindVisuals(); });
window.addEventListener('orientationchange', () => { if (state.screen === 'session' && state.session) bindVisuals(); });

// ---------- запуск ----------
function withTimeout(p, ms) {
  return Promise.race([p, new Promise((r) => setTimeout(() => r(false), ms))]);
}
(async function boot() {
  try {
    // Ждём только то, что реально нужно для первого кадра (скрипт Telegram).
    await withTimeout(loadScript('https://telegram.org/js/telegram-web-app.js'), 3000);
    TG.ready();
    await Progress.load();
    applyTheme();
    Progress.recordOpen(todayEpoch());
    applySessionToAudio();

    const q = new URLSearchParams(location.search);
    const s = q.get('s');
    if (s === 'home' || s === 'progress' || s === 'wallet' || s === 'premium' || s === 'knowledge'
        || s === 'music' || s === 'solfeggio' || s === 'playlist' || s === 'binaural' || s === 'profile' || s === 'stats'
        || s === 'energy' || s === 'energyAbout' || s === 'energyPreset' || s === 'energyCourse'
        || s === 'energyBuilder' || s === 'matrix') {
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

    // ---- Дальше — в фоне, чтобы НЕ тормозить запуск ----
    // (сервер на free-тарифе «просыпается» до минуты; UI уже показан)
    loadScript('https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js').then(() => {
      try { TON.init(new URL('tonconnect-manifest.json', location.href).href); } catch (e) {}
    });
    STARS.syncPremium().catch(() => {});
    try { const sp = TG.startParam; if (sp && sp.indexOf('ref_') === 0) Referral.claim(sp.slice(4)).catch(() => {}); } catch (e) {}
  } catch (e) {
    console.error('BOOT FAIL', e);
    const el = document.getElementById('app');
    if (el) el.textContent = 'BOOT FAIL: ' + (e && e.message ? e.message : e);
  }
})();
