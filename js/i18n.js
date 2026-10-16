// Интернационализация интерфейса. Язык задаёт приложение (хранит в Progress.data.lang),
// а модуль держит его у себя — чтобы не зависеть от экземпляра store.
// Стратегия: интерфейс переводится по словарю русских фраз (текст как ключ),
// контент (тексты практик/статей) пока остаётся русским.

export const LANGS = [
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

let _lang = 'ru';
export function lang() { return _lang; }
export function setLang(id) { _lang = id === 'en' ? 'en' : 'ru'; }

// Русская фраза -> английская. Порядок не важен: применяем длинные раньше коротких.
const EN = {
  // --- навигация ---
  'Практики': 'Practices',
  'Прогресс': 'Progress',
  'Сообщество': 'Community',
  'Профиль': 'Profile',
  'Кошелёк': 'Wallet',
  // --- онбординг ---
  'Дыши ровно —': 'Breathe evenly —',
  'думай ясно': 'think clearly',
  'Как это работает': 'How it works',
  'Вы дышите под голос и музыку в заданном ритме. Приложение подсказывает, когда вдыхать, задерживать дыхание и выдыхать — по кругу на экране, по голосу и по вибрации.':
    'You breathe with voice and music in a set rhythm. The app tells you when to inhale, hold and exhale — on screen, by voice and vibration.',
  'Что это даёт': 'What you get',
  'Медленное и ровное дыхание снижает уровень стресса, замедляет пульс и успокаивает нервную систему. Бодрящие ритмы, наоборот, повышают тонус. Научные пояснения есть в карточке каждой практики.':
    'Slow, even breathing lowers stress, slows the pulse and calms the nervous system. Energizing rhythms, on the contrary, raise your tone. Scientific notes are in each practice card.',
  'Важно': 'Important',
  'Приложение не является медицинским средством и не заменяет консультацию врача. При головокружении во время практики — остановитесь и восстановите дыхание.':
    'This app is not a medical device and does not replace a doctor’s advice. If you feel dizzy during practice — stop and restore your breathing.',
  'Больше не показывать': 'Do not show again',
  'Начать': 'Start',
  // --- дом ---
  'Дыхательные практики': 'Breathing practices',
  'Выберите ритм под своё состояние.': 'Choose a rhythm for your state.',
  'Привет, ': 'Hi, ',
  'Гость': 'Guest',
  'Релакс': 'Relax',
  'Бодрость': 'Energy',
  'до следующего уровня': 'to next level',
  'уровень': 'level',
  'серия дней': 'day streak',
  'минут': 'minutes',
  'База знаний': 'Knowledge base',
  'Короткие статьи о пользе дыхания и науке': 'Short articles on breathing and science',
  'статей': 'articles',
  'Свои ритмы': 'My rhythms',
  'Создайте свой ритм — задайте длительность вдоха, задержек и выдоха.':
    'Create your own rhythm — set inhale, holds and exhale durations.',
  '+ Создать свой ритм': '+ Create your own rhythm',
  'Программы': 'Programs',
  'Энергодыхание Романа Карловского': 'Roman Karlovsky’s Energy Breathing',
  'Связное частое и медленное дыхание под музыку и подсказки — отдельный плеер по этапам.':
    'Connected fast and slow breathing with music and prompts — a separate stage player.',
  'Есть противопоказания': 'Has contraindications',
  'Матрица Гаряева': 'Garyaev Matrix',
  'Метод волновой генетики: звуковые программы и описание методики':
    'Wave genetics method: sound programs and description',
  'В разработке': 'In development',
  'дых/мин': 'breaths/min',
  'дых./мин': 'breaths/min',
  // --- деталь практики ---
  'Начать практику': 'Start practice',
  'Длительность:': 'Duration:',
  'Что даёт': 'Benefits',
  'Немного науки': 'A bit of science',
  'Изменить': 'Edit',
  'Удалить': 'Delete',
  'Практика не найдена.': 'Practice not found.',
  // --- редактор ---
  'Название': 'Name',
  'Цель': 'Goal',
  'Вдох': 'Inhale',
  'Задержка после вдоха': 'Hold after inhale',
  'Выдох': 'Exhale',
  'Задержка после выдоха': 'Hold after exhale',
  'Длительность по умолчанию:': 'Default duration:',
  'Цикл:': 'Cycle:',
  'Сохранить': 'Save',
  'Свой ритм': 'My rhythm',
  'Изменить ритм': 'Edit rhythm',
  'Задержка': 'Hold',
  // --- сессия ---
  'сек в фазе': 'sec in phase',
  'осталось': 'left',
  'циклов': 'cycles',
  'время': 'time',
  'Пауза': 'Pause',
  'Продолжить': 'Resume',
  'Стоп': 'Stop',
  '♪ Музыка и партитура': '♪ Music & score',
  'Вернуться к практике': 'Back to practice',
  // --- партитура/шторка музыки ---
  'Музыкальное сопровождение': 'Music',
  'Партитура дыхания': 'Breathing score',
  'Музыка': 'Music',
  'Дыхание': 'Breathing',
  'Голос': 'Voice',
  'Метроном': 'Metronome',
  'Вибрация': 'Vibration',
  'Частота сольфеджио': 'Solfeggio frequency',
  'Бинауральные ритмы': 'Binaural beats',
  'Громкость музыки': 'Music volume',
  'Трек в начало': 'Restart track',
  'Трек': 'Track',
  'Режим музыки': 'Music mode',
  'Повтор трека': 'Repeat track',
  'По списку': 'Playlist',
  'Настроить список треков': 'Edit track list',
  'Очередь': 'Queue',
  'Громкость частоты': 'Frequency volume',
  'Эффекты орба': 'Orb effects',
  'Выкл': 'Off',
  'Слабо': 'Low',
  'Средне': 'Medium',
  'Наглядно': 'Vivid',
  'Звук дыхания': 'Breath sound',
  'Громкость дыхания': 'Breath volume',
  'Характер дыхания': 'Breath character',
  'выбран': 'selected',
  'играет': 'playing',
  'Выбрать': 'Choose',
  'Выберите трек для практики': 'Choose a track for practice',
  'Частоты сольфеджио': 'Solfeggio frequencies',
  'Плейлист': 'Playlist',
  'Добавить треки': 'Add tracks',
  'В плейлисте': 'In playlist',
  'Порядок воспроизведения в режиме «По списку». Меняйте кнопками ↑ ↓.':
    'Playback order for the “Playlist” mode. Reorder with ↑ ↓.',
  '4 дых./мин · 5 мин': '4 breaths/min · 5 min',
  'Нужны наушники: в левое и правое ухо подаются близкие частоты, а мозг слышит разницу — это и есть ритм.':
    'Headphones required: each ear gets a slightly different frequency and the brain hears the difference — that is the beat.',
  'Космос и реакция на музыку: «Средне» — заметно, «Слабо» — сдержанно, «Выкл» — без эффектов.':
    'Space and music reaction: Medium — noticeable, Low — subtle, Off — no effects.',
  // --- прогресс ---
  'Уровень': 'Level',
  'до следующего': 'to next',
  'XP': 'XP',
  'Поделиться результатом': 'Share result',
  'Дневник состояний': 'Mood diary',
  'Записывайте самочувствие и инсайты после практик': 'Log how you feel and insights after practices',
  'записей': 'entries',
  'Календарь активности': 'Activity calendar',
  'Сегодня практики:': 'Today’s practice:',
  'из': 'of',
  'Сегодня можно набрать ещё': 'You can still earn',
  'дневной лимит': 'daily limit',
  'Насыщеннее — больше минут практики. Серый — только открывал приложение.':
    'Brighter — more minutes practiced. Grey — app opened only.',
  // --- дневник ---
  'Зачем записывать': 'Why log',
  'Отмечайте самочувствие и мысли после практик — так виден прогресс, легче замечать, что помогает, и удерживается мотивация.':
    'Track how you feel and your thoughts after practices — this shows progress, makes it easier to notice what helps and keeps motivation.',
  '＋ Запись о состоянии': '＋ New entry',
  'Пока пусто. Добавьте первую запись — и здесь появятся ваши заметки.':
    'Empty for now. Add your first entry and your notes will appear here.',
  'Новая запись': 'New entry',
  'Запись дневника': 'Diary entry',
  'Как вы себя чувствуете?': 'How do you feel?',
  'Спокойствие': 'Calm',
  'Энергия': 'Energy',
  'Фокус': 'Focus',
  'Состояния': 'States',
  'Инсайты': 'Insights',
  'В избранное': 'Favorite',
  'Как вас зовут?': 'What is your name?',
  'Как вас зовут': 'What is your name?',
  'Открыть': 'Open',
  'Удалить запись': 'Delete entry',
  'Дневник': 'Diary',
  // --- сообщество ---
  'Раздел «Сообщество» скоро появится — ждите обновлений!': 'The Community section is coming soon — stay tuned!',
  // --- профиль ---
  'Имя': 'Name',
  'Светлая тема': 'Light theme',
  'Подписка активна': 'Subscription active',
  'Свои треки, плейлисты и курс без ограничений': 'Your tracks, playlists and the course without limits',
  'Premium активен ✓': 'Premium active ✓',
  'Достижения': 'Achievements',
  'Вся история практик': 'Full practice history',
  'версия': 'version',
  'Практик': 'Practitioner',
  'Новичок': 'Novice',
  'Ученик': 'Learner',
  'Практик ': 'Practitioner ',
  'Дышащий': 'Breather',
  'Мастер дыхания': 'Breathing master',
  'Хранитель ритма': 'Rhythm keeper',
  'Гуру дыхания': 'Breathing guru',
  'Мастер энергии': 'Energy master',
  'Хранитель энергии': 'Energy keeper',
  'Магистр дыхания': 'Master of breathing',
  'Просветлённый': 'Enlightened',
  'Легенда': 'Legend',
  'Первый вдох': 'First breath',
  'Провести первую практику': 'Complete your first practice',
  'Три дня подряд': 'Three days in a row',
  'Серия 3 дня': '3-day streak',
  'Неделя практики': 'A week of practice',
  'Серия 7 дней': '7-day streak',
  'Час дыхания': 'An hour of breathing',
  '60 минут суммарно': '60 minutes total',
  'Пять часов': 'Five hours',
  '300 минут суммарно': '300 minutes total',
  'Исследователь': 'Explorer',
  'Попробовать 5 практик': 'Try 5 practices',
  'Опытный': 'Experienced',
  'Достичь 5 уровня': 'Reach level 5',
  'любимый ритм': 'favorite rhythm',
  'рекорд': 'record',
  'серия': 'streak',
  'практик': 'practices',
  // --- статистика ---
  'Статистика': 'Statistics',
  'сессий': 'sessions',
  'История практик': 'Practice history',
  'Пока нет завершённых сессий. Пройди первую практику — и здесь появится история.':
    'No sessions yet. Complete your first practice and history will appear here.',
  'полностью': 'completed',
  'прервано': 'interrupted',
  // --- база знаний ---
  'мин чтения': 'min read',
  'Короткие статьи о пользе дыхательных практик и их научных подтверждениях.':
    'Short articles on the benefits of breathing practices and their scientific evidence.',
  'Статья': 'Article',
  'Статья не найдена.': 'Article not found.',
  // --- энергодыхание ---
  'О методе': 'About',
  'Я ознакомился с противопоказаниями': 'I have read the contraindications',
  'Отметьте согласие выше, чтобы открыть практики.': 'Check the box above to open the practices.',
  'Прокачай свой мозг': 'Train your brain',
  'Аудио-практики': 'Audio practices',
  'Создать своё энергодыхание': 'Create your own energy breathing',
  'Собрать программу по этапам': 'Build a program by stages',
  'Быстрый старт по этапам': 'Quick start by stages',
  'Готовая программа: короткая / стандарт / глубокая': 'Ready program: short / standard / deep',
  'Длительность': 'Duration',
  'Короткая': 'Short',
  'Стандарт': 'Standard',
  'Глубокая': 'Deep',
  'Всего:': 'Total:',
  'Энергодыхание': 'Energy breathing',
  'Своё энергодыхание': 'My energy breathing',
  '＋ Создать свою программу': '＋ Create a program',
  'Пока нет своих программ. Создайте первую — задайте этапы с названием, длительностью и подсказкой.':
    'No programs yet. Create your first one — set stages with title, duration and hint.',
  'Новая программа': 'New program',
  'Изменить программу': 'Edit program',
  'Название этапа': 'Stage title',
  'Подсказка': 'Hint',
  'Добавить этап': 'Add stage',
  'Удалить программу': 'Delete program',
  'Удалить программу?': 'Delete program?',
  'Настройка': 'Setup',
  'Разогрев': 'Warm-up',
  'Быстро': 'Fast',
  'Медленно': 'Slow',
  'Интеграция': 'Integration',
  'Пропустить': 'Skip',
  'Партнёрские бонусы': 'Partner bonuses',
  'Закрытый клуб': 'Private club',
  'Курсы и тарифы': 'Courses & pricing',
  'Скопировать': 'Copy',
  'Промокод школы энергодыхания на скидку курсов — в Premium.': 'The energy-breathing school promo code is available in Premium.',
  'Открыть купон в Premium': 'Open coupon in Premium',
  'Программа не найдена.': 'Program not found.',
  // --- матрица ---
  'Аудио-матрицы': 'Audio matrices',
  'Выберите аудио-матрицу с устройства — она откроется в плеере.': 'Pick an audio matrix from your device — it opens in the player.',
  'Выберите аудио-практику с устройства': 'Pick an audio practice from your device',
  'Выберите аудиофайл практики — он откроется в плеере.': 'Pick a practice audio file — it opens in the player.',
  'Аудио': 'Audio',
  'Позиция': 'Position',
  'Играть': 'Play',
  'Сначала': 'Restart',
  'Прослушивайте в спокойной обстановке, лучше в наушниках. При дискомфорте сделайте паузу.':
    'Listen in a calm place, preferably with headphones. Pause if you feel discomfort.',
  'Описание практики': 'Practice description',
  // --- премиум ---
  'Откройте всё: все практики, энергодыхание, музыку и партнёрские материалы.':
    'Unlock everything: all practices, energy breathing, music and partner materials.',
  'Оплата — Telegram Stars (XTR). Цифровые товары в Telegram продаются через Stars; создание счёта делает бэкенд с ботом.':
    'Payment via Telegram Stars (XTR). Digital goods in Telegram are sold via Stars; the invoice is created by the backend.',
  '🧪 Тест: включить Premium': '🧪 Test: enable Premium',
  '🧪 Тест: отключить Premium': '🧪 Test: disable Premium',
  '🤝 Пригласи друга — 10%': '🤝 Invite a friend — 10%',
  'Неделя': 'Week',
  'Месяц': 'Month',
  'Год': 'Year',
  'дней': 'days',
  // --- реферал ---
  'Пригласи друга': 'Invite a friend',
  'Приглашайте друзей и получайте': 'Invite friends and earn',
  'от каждой их оплаты звёздами.': 'of every payment they make in Stars.',
  'Ваша ссылка': 'Your link',
  'Копировать': 'Copy',
  'Поделиться': 'Share',
  'приглашено': 'invited',
  'начислено': 'earned',
  'к выплате': 'to pay out',
  'Выплата': 'Payout',
  'Заработанные звёзды перечисляем в TON на ваш кошелёк (после холда Telegram). Укажите адрес и запросите выплату.':
    'Earned Stars are paid out in TON to your wallet (after Telegram’s hold). Enter the address and request a payout.',
  'TON-кошелёк (EQ…)': 'TON wallet (EQ…)',
  'Запросить выплату': 'Request payout',
  'Ссылка скопирована': 'Link copied',
  'Заявка на выплату создана': 'Payout request created',
  'Загрузка…': 'Loading…',
  'Загрузка...': 'Loading…',
  // --- язык ---
  'Язык': 'Language',
  'Выберите язык': 'Choose a language',
  // --- прочее ---
};

const RU_KEYS = Object.keys(EN).sort((a, b) => b.length - a.length);

export function translateStr(s) {
  if (lang() !== 'en' || s == null) return s;
  let out = String(s);
  for (const ru of RU_KEYS) {
    if (out.includes(ru)) out = out.split(ru).join(EN[ru]);
  }
  return out;
}

// Переводит текст внутри DOM-элемента (текстовые узлы, placeholder, title).
export function translateDOM(root) {
  if (lang() !== 'en' || !root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const v = n.nodeValue;
    if (v && /\S/.test(v)) {
      const tr = translateStr(v);
      if (tr !== v) n.nodeValue = tr;
    }
  }
  root.querySelectorAll('[placeholder],[title]').forEach((el) => {
    for (const a of ['placeholder', 'title']) {
      if (el.hasAttribute(a)) {
        const v = el.getAttribute(a);
        const tr = translateStr(v);
        if (tr !== v) el.setAttribute(a, tr);
      }
    }
  });
}
