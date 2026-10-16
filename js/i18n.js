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

  // ===== КОНТЕНТ: практики =====
  'Квадратное дыхание': 'Box Breathing',
  'Ровный ритм 4-4-4-4 для концентрации и собранности.': 'An even 4-4-4-4 rhythm for focus and composure.',
  'Квадратное (боксовое) дыхание используют военные лётчики и спецслужбы для сохранения ясности в стрессовой ситуации. Четыре равные фазы — вдох, задержка, выдох, задержка — выравнивают ритм и возвращают контроль над вниманием.':
    'Box breathing is used by military pilots and special forces to stay clear-headed under stress. Four equal phases — inhale, hold, exhale, hold — steady the rhythm and restore control over attention.',
  'Повышает концентрацию и устойчивость к стрессу': 'Improves focus and stress resilience',
  'Выравнивает пульс и дыхание': 'Steadies the pulse and breathing',
  'Помогает быстро собраться перед задачей': 'Helps you pull yourself together before a task',
  'Медленное дыхание примерно 6 раз в минуту синхронизирует работу сердца и лёгких (кардиореспираторная синхронизация), повышает вариабельность сердечного ритма (ВСР/HRV) и усиливает парасимпатический тонус — физиологический маркер спокойствия. Задержки в цикле тренируют устойчивость к накоплению CO₂ и снижают реакцию тревоги.':
    'Slow breathing at about 6 breaths per minute synchronizes heart and lungs, raises heart-rate variability (HRV) and boosts parasympathetic tone — a physiological marker of calm. The holds train tolerance to CO₂ and reduce the anxiety response.',
  'Дыхание 4-7-8': '4-7-8 Breathing',
  'Длинный выдох для быстрого успокоения и сна.': 'A long exhale for quick calming and sleep.',
  'Метод 4-7-8 популяризировал доктор Эндрю Вейл. Вдох на 4, задержка на 7 и очень длинный выдох на 8 замедляют сердечный ритм и переключают нервную систему в режим отдыха. Удобно делать перед сном.':
    'Dr. Andrew Weil popularized the 4-7-8 method. Inhale for 4, hold for 7 and a very long exhale for 8 slow the heart rate and switch the nervous system into rest mode. Handy before sleep.',
  'Снижает тревожность и напряжение': 'Reduces anxiety and tension',
  'Помогает быстрее заснуть': 'Helps you fall asleep faster',
  'Замедляет пульс благодаря длинному выдоху': 'Slows the pulse thanks to the long exhale',
  'Удлинённый выдох активирует барорецепторы и блуждающий нерв: на выдохе пульс физиологически замедляется. Практика удлинённого выдоха устойчиво связана со снижением симпатической активности, падением уровня кортизола и ростом ВСР, что субъективно ощущается как расслабление.':
    'A lengthened exhale activates baroreceptors and the vagus nerve: during the exhale the pulse physiologically slows. Practicing a longer exhale is consistently linked to lower sympathetic activity, lower cortisol and higher HRV, felt as relaxation.',
  'Когерентное дыхание': 'Coherent Breathing',
  '5.5 секунд вдох и выдох без задержек — золотой ритм.': '5.5 seconds in and out with no holds — the golden rhythm.',
  'Ровное дыхание по 5,5 секунды на вдох и выдох даёт примерно 5,5 дыханий в минуту. Это резонансная частота, на которой сердце, дыхание и кровяное давление работают максимально согласованно.':
    'Even breathing of 5.5 seconds in and out gives about 5.5 breaths per minute. This is the resonance frequency at which heart, breathing and blood pressure work in the greatest harmony.',
  'Максимально повышает HRV': 'Maximizes HRV',
  'Снижает давление и уровень стресса': 'Lowers blood pressure and stress',
  'Подходит для длительной ежедневной практики': 'Great for long daily practice',
  'Резонансное дыхание около 5,5 раза в минуту максимизирует амплитуду колебаний сердечного ритма и усиливает барорефлекс — главный механизм саморегуляции сердечно-сосудистой системы. В исследованиях регулярная практика снижает тревогу, улучшает настроение и качество сна.':
    'Resonance breathing at about 5.5 breaths per minute maximizes heart-rate oscillations and strengthens the baroreflex — the main self-regulation mechanism of the cardiovascular system. In studies, regular practice reduces anxiety and improves mood and sleep.',
  'Успокаивающее 3-6': 'Calming 3-6',
  'Выдох вдвое длиннее вдоха — простое средство от стресса.': 'Exhale twice as long as inhale — a simple anti-stress tool.',
  'Простейшая антистресс-техника: короткий вдох на 3 и долгий выдох на 6. Соотношение 1:2 делает дыхание медленным и заставляет организм успокаиваться. Легко освоить новичку.':
    'The simplest anti-stress technique: a short inhale for 3 and a long exhale for 6. The 1:2 ratio makes breathing slow and calms the body. Easy for beginners.',
  'Мгновенно снимает острое напряжение': 'Instantly relieves acute tension',
  'Проста в освоении': 'Easy to learn',
  'Хороша в моменты волнения и паники': 'Great in moments of worry and panic',
  'Соотношение вдоха и выдоха 1:2 удлиняет фазу парасимпатической активности, связанной с выдохом. Это снижает частоту сердечных сокращений и субъективный уровень стресса даже после одной короткой сессии, что подтверждают исследования медленного дыхания.':
    'A 1:2 inhale-to-exhale ratio lengthens the parasympathetic phase tied to the exhale. This lowers heart rate and subjective stress even after one short session, as slow-breathing studies confirm.',
  'Бодрящее 2-2': 'Energizing 2-2',
  'Быстрое ровное дыхание для тонуса и прилива энергии.': 'Fast even breathing for tone and an energy boost.',
  'Ускоренное ровное дыхание по 2 секунды повышает насыщение кислородом и тонус. Делайте короткими подходами, когда нужно взбодриться без кофе. Не выполняйте при головокружении.':
    'Fast, even breathing at 2 seconds raises oxygenation and tone. Do it in short bouts when you need a lift without coffee. Don’t do it if you feel dizzy.',
  'Повышает тонус и бодрость': 'Raises tone and alertness',
  'Ускоряет пульс и кровоток': 'Speeds up the pulse and blood flow',
  'Помогает перед тренировкой': 'Helps before a workout',
  'Умеренно учащённое дыхание повышает симпатическую активность и уровень возбуждения нервной системы, улучшая субъективную бодрость и готовность к нагрузке. Важно не переусердствовать: гипервентиляция может вызвать головокружение, поэтому подходы ограничены по времени.':
    'Moderately faster breathing raises sympathetic activity and arousal, improving subjective alertness and readiness for effort. Don’t overdo it: hyperventilation can cause dizziness, so bouts are time-limited.',
  'Метод Бутейко': 'Buteyko Method',
  'Мягкое носовое дыхание с уменьшением объёма и комфортными паузами.': 'Gentle nasal breathing with reduced volume and comfortable pauses.',
  'Метод Бутейко — техника произвольного уменьшения глубины дыхания. Дышат только через нос, спокойно и поверхностно, расслабляя диафрагму, а после выдоха делают небольшую комфортную паузу. Цель — нормализовать дыхание и повысить устойчивость к углекислому газу (CO₂). Это упрощённая ознакомительная версия: полный метод осваивают под руководством специалиста.':
    'The Buteyko method is a technique of deliberately reducing breathing depth. You breathe only through the nose, calmly and shallowly, relaxing the diaphragm, and take a short comfortable pause after the exhale. The goal is to normalize breathing and improve tolerance to carbon dioxide (CO₂). This is a simplified introductory version: the full method is learned under a specialist.',
  'Успокаивает дыхание и снижает гипервентиляцию': 'Calms breathing and reduces hyperventilation',
  'Тренирует терпимость к CO₂': 'Trains CO₂ tolerance',
  'Помогает при ощущении нехватки воздуха и тревоге': 'Helps with breathlessness and anxiety',
  'Учит дышать носом и расслаблять диафрагму': 'Teaches nasal breathing and diaphragm relaxation',
  'В основе метода — представление о хронической гипервентиляции и снижении уровня CO₂ (гипокапнии), из-за которой нарушается доставка кислорода тканям. Мягкое уменьшение объёма дыхания и удлинённые паузы повышают толерантность к CO₂ и нормализуют дыхательный паттерн; в исследованиях при бронхиальной астме метод Бутейко связан с улучшением симптомов, хотя данные неоднородны и он не заменяет базовую терапию.':
    'The method rests on the idea of chronic hyperventilation and low CO₂ (hypocapnia), which impairs oxygen delivery to tissues. Gently reducing breathing volume and lengthening pauses raise CO₂ tolerance and normalize the breathing pattern; in asthma studies the Buteyko method is linked to symptom improvement, though the data are mixed and it does not replace basic therapy.',

  // ===== КОНТЕНТ: база знаний =====
  'Медленное дыхание против стресса': 'Slow breathing against stress',
  'Как размеренный выдох успокаивает нервную систему за пару минут.': 'How a measured exhale calms the nervous system in a couple of minutes.',
  'Когда мы волнуемся, дыхание становится частым и поверхностным — так работает симпатическая система «бей или беги». Медленное дыхание запускает обратный механизм: активируется парасимпатическая (восстанавливающая) система, и тело переходит в режим отдыха.':
    'When we are anxious, breathing becomes fast and shallow — that is the sympathetic “fight or flight” system. Slow breathing triggers the opposite: the parasympathetic (restoring) system activates and the body shifts into rest mode.',
  'Ключевой рычаг — длинный выдох. На выдохе пульс физиологически замедляется, и удлинение выдоха закрепляет этот эффект. Поэтому техники с выдохом в 1,5–2 раза длиннее вдоха (например, 3-6 или 4-7-8) так быстро снимают напряжение.':
    'The key lever is a long exhale. During the exhale the pulse physiologically slows, and lengthening the exhale reinforces this. That is why techniques with an exhale 1.5–2 times longer than the inhale (such as 3-6 or 4-7-8) relieve tension so quickly.',
  'Исследования показывают: всего 5 минут медленного дыхания снижают субъективную тревожность и повышают вариабельность сердечного ритма (ВСР/HRV) — объективный маркер спокойствия и гибкости нервной системы.':
    'Studies show that just 5 minutes of slow breathing lowers subjective anxiety and raises heart-rate variability (HRV) — an objective marker of calm and nervous-system flexibility.',
  'Дыхание и мозг: внимание и ясность': 'Breathing and the brain: attention and clarity',
  'Почему ровный ритм помогает сосредоточиться и думать чётче.': 'Why an even rhythm helps you focus and think more clearly.',
  'Ровное дыхание по 5–6 раз в минуту синхронизирует работу сердца, лёгких и мозга (кардиореспираторная синхронизация). Такой ритм успокаивает мозговые сети, отвечающие за «блуждание» мыслей, и облегчает концентрацию.':
    'Even breathing at 5–6 breaths per minute synchronizes heart, lungs and brain (cardiorespiratory coupling). This rhythm quiets the brain networks behind mind-wandering and eases concentration.',
  'Особенно полезна «квадратная» схема 4-4-4-4: равные фазы делают дыхание предсказуемым, а внимание — устойчивым. Это простой способ «перезагрузиться» перед задачей или во время стрессового разговора.':
    'The “box” 4-4-4-4 pattern is especially useful: equal phases make breathing predictable and attention steady. It is a simple way to reset before a task or during a stressful conversation.',
  'Есть данные, что регулярная практика дыхания улучшает рабочую память и устойчивость внимания (в том числе у студентов). Эффект скорее похож на тренировку, чем на чудо: важно практиковаться регулярно.':
    'There is evidence that regular breathing practice improves working memory and sustained attention (including in students). The effect is more like training than a miracle: regular practice matters.',
  'Дыхание и сон': 'Breathing and sleep',
  'Как перед сном помочь себе заснуть без таблеток.': 'How to help yourself fall asleep without pills.',
  'Засыпание — это переход от напряжения к расслаблению. Вдох слегка ускоряет пульс и бодрит, а длинный выдох снимает возбуждение. Поэтому вечерние техники строят вокруг удлинённого выдоха — например, 4-7-8.':
    'Falling asleep is a shift from tension to relaxation. The inhale slightly speeds the pulse and wakes you; a long exhale reduces arousal. That is why evening techniques center on a lengthened exhale — for example, 4-7-8.',
  'Практика 4-7-8: вдох на 4 счёта, задержка на 7 и долгий выдох на 8. Здесь важна не точность секундомера, а соотношение: выдох заметно длиннее вдоха. 4–6 циклов лежа обычно достаточно, чтобы тело «переключилось» на сон.':
    'The 4-7-8 practice: inhale for 4, hold for 7 and a long exhale for 8. What matters is not stopwatch precision but the ratio: the exhale noticeably longer than the inhale. 4–6 cycles lying down is usually enough for the body to switch toward sleep.',
  'Если лежите без сна дольше 20 минут — не заставляйте себя. Лучше встать, сделать ещё одну короткую сессию дыхания и вернуться в кровать спокойным. Дыхание — не снотворное, а мягкая поддержка для перехода ко сну.':
    'If you lie awake for more than 20 minutes, don’t force it. Better to get up, do another short breathing session and return to bed calm. Breathing is not a sleeping pill but gentle support for the transition to sleep.',
  'Дыхание, пульс и давление': 'Breathing, pulse and pressure',
  'Какой ритм называют «золотым» для сердца и сосудов.': 'Which rhythm is called “golden” for the heart and vessels.',
  'При дыхании примерно 6 раз в минуту (вдох и выдох по ~5,5 секунды) возникает резонанс: колебания пульса максимально усиливаются, а барорефлекс — главный механизм саморегуляции сердца — тренируется. Это называют когерентным дыханием.':
    'Breathing at about 6 times per minute (inhale and exhale of ~5.5 seconds each) creates resonance: heart-rate oscillations peak and the baroreflex — the heart’s main self-regulation mechanism — is trained. This is called coherent breathing.',
  'В исследованиях регулярная практика медленного дыхания сопровождается небольшим, но устойчивым снижением артериального давления, особенно у людей с его повышенным фоном. Эффект накапливается со временем и работает лучше в сочетании с обычными рекомендациями врача.':
    'In studies, regular slow breathing practice is accompanied by a small but steady drop in blood pressure, especially in people with elevated levels. The effect builds over time and works best alongside a doctor’s usual advice.',
  'Важно: дыхательные практики не заменяют лечение. Если у вас есть сердечно-сосудистые заболевания или вы принимаете препараты, обсудите практику с врачом.':
    'Important: breathing practices do not replace treatment. If you have cardiovascular disease or take medication, discuss the practice with your doctor.',
  'Задержки дыхания и терпимость к CO₂': 'Breath holds and CO₂ tolerance',
  'Почему задержки успокаивают и снижают реакцию тревоги.': 'Why holds calm you and reduce the anxiety response.',
  'Тревога часто проявляется как повышенная чувствительность к собственному дыханию и к росту углекислого газа (CO₂) в крови. Короткие контролируемые задержки постепенно приучают организм спокойнее переносить этот сигнал.':
    'Anxiety often shows up as increased sensitivity to your own breathing and to rising carbon dioxide (CO₂) in the blood. Short, controlled holds gradually teach the body to tolerate this signal more calmly.',
  'Это снижает «реакцию тревоги»: то, что раньше пугало (нехватка воздуха), становится привычным и безопасным. Поэтому практики с задержками часто входят в программы при панических состояниях — но только под спокойным, не форсированным контролем.':
    'This lowers the “anxiety response”: what once frightened you (a sense of air shortage) becomes familiar and safe. That is why holds are often part of programs for panic states — but only under calm, gentle control.',
  'Правило простое: задержка должна оставаться комфортной. Ощущение острой нехватки воздуха или головокружение — знак сократить длительность или вернуться к дыханию без задержек.':
    'The rule is simple: the hold must stay comfortable. A sense of acute air shortage or dizziness is a sign to shorten it or return to breathing without holds.',
  'Как часто практиковать': 'How often to practice',
  'Сколько нужно времени и как не бросить.': 'How much time it takes and how not to quit.',
  'Дыхание не требует часа в день. Для заметного эффекта достаточно регулярности: 5–10 минут ежедневно работают лучше, чем час раз в неделю.':
    'Breathing does not require an hour a day. For a noticeable effect, regularity is enough: 5–10 minutes daily works better than an hour once a week.',
  'Начните с малого: одна сессия на 3–5 минут в удобное время — утром для бодрости или вечером для расслабления. Приложение напомнит, а статистика покажет серию дней.':
    'Start small: one 3–5 minute session at a convenient time — in the morning for energy or in the evening to relax. The app will remind you, and the stats will show your day streak.',
  'Со временем можно добавить второй короткий подход в течение дня (например, перед сном или в момент стресса). Слушайте себя: если появилось головокружение — остановитесь, восстановите обычное дыхание и вернитесь позже.':
    'Over time you can add a second short session during the day (for example before sleep or in a moment of stress). Listen to yourself: if you feel dizzy, stop, restore normal breathing and return later.',
  'Метод энергодыхания Романа Карловского': 'Roman Karlovsky’s energy breathing method',
  'Связное частое дыхание под музыку — авторский метод, защищённый патентом.': 'Connected fast breathing to music — an original method protected by a patent.',
  'Энергодыхание — авторская дыхательная методика, созданная Романом Карловским. В её основе — «связное» дыхание: вдох и выдох идут непрерывно, без пауз, и постепенно перестраиваются от частого и активного ритма к медленному и глубокому. Такой переход тренирует дыхательную и сердечно-сосудистую системы мягко, но последовательно.':
    'Energy breathing is an original breathing method created by Roman Karlovsky. It is based on “connected” breathing: the inhale and exhale run continuously, without pauses, gradually shifting from a fast, active rhythm to a slow, deep one. This transition trains the respiratory and cardiovascular systems gently yet consistently.',
  'Отличительная черта метода — сочетание ритма дыхания со специально подобранной музыкой и голосовым сопровождением. Ритм музыки задаёт темп дыхания, а голос удерживает внимание на фазах. Это снижает «блуждание» мыслей и помогает удерживать ровный ритм без постоянного контроля со стороны практикующего.':
    'A hallmark of the method is combining the breathing rhythm with specially chosen music and voice guidance. The music sets the breathing tempo, while the voice keeps attention on the phases. This reduces mind-wandering and helps keep an even rhythm without constant self-monitoring.',
  'Метод зарегистрирован как объект интеллектуальной собственности: на технику энергодыхания получен патент. Это ставит её в один ряд с признанными авторскими дыхательными системами — такими как метод Бутейко, — которые также прошли официальное признание и имеют своих последователей и исследователей.':
    'The method is registered as intellectual property: a patent was granted for the energy-breathing technique. This places it alongside recognized proprietary breathing systems — such as the Buteyko method — which have also gained official recognition and have their own followers and researchers.',
  'С точки зрения физиологии энергодыхание работает через уже известные механизмы: изменение минутного объёма дыхания, тренировку устойчивости к CO₂ и повышение вариабельности сердечного ритма (HRV). Как и любая интенсивная дыхательная практика, она имеет противопоказания — перед началом ознакомьтесь с ними и при необходимости проконсультируйтесь со специалистом.':
    'Physiologically, energy breathing works through well-known mechanisms: changes in minute ventilation, training CO₂ tolerance and raising heart-rate variability (HRV). Like any intense breathing practice it has contraindications — read them before you start and, if needed, consult a specialist.',

  // ===== КОНТЕНТ: энергодыхание =====
  'Энергодыхание — простая и эффективная практика, созданная Романом Карловским. Она сочетает преимущества разных дыхательных методик и работает сразу на нескольких уровнях: физическом, психологическом и энергетическом.':
    'Energy breathing is a simple and effective practice created by Roman Karlovsky. It combines the strengths of different breathing methods and works on several levels at once: physical, psychological and energetic.',
  'Во время сеанса человек дышит в заданном ритме под голосовое сопровождение и специально подобранную музыку. Это помогает синхронизировать работу тела, сознания и мозга.':
    'During a session you breathe in a set rhythm with voice guidance and specially chosen music. This helps synchronize the work of body, mind and brain.',
  'Дыхание становится инструментом управления вниманием, гормональной системой и ритмами мозга.':
    'Breathing becomes a tool for managing attention, the hormonal system and brain rhythms.',
  'Дельта (0,5–4 Гц) — глубокий сон, восстановление, выработка гормона роста.': 'Delta (0.5–4 Hz) — deep sleep, recovery, growth-hormone release.',
  'Тета (4–7 Гц) — подсознание, креативность, работа с установками.': 'Theta (4–7 Hz) — the subconscious, creativity, working with beliefs.',
  'Альфа (8–12 Гц) — спокойный фокус, снижение тревожности.': 'Alpha (8–12 Hz) — calm focus, less anxiety.',
  'Бета (13–30 Гц) — активное бодрствование, концентрация, действия.': 'Beta (13–30 Hz) — active wakefulness, concentration, action.',
  'Гамма (30–100 Гц) — инсайты, озарения, высокая когнитивная активность.': 'Gamma (30–100 Hz) — insights, sudden clarity, high cognitive activity.',
  'Практика поочерёдно активирует разные ритмы мозга за счёт двух состояний:': 'The practice alternately activates different brain rhythms through two states:',
  '• Связное и частое дыхание — активирует симпатическую нервную систему и усиливает бета- и гамма-активность.': '• Connected, fast breathing — activates the sympathetic nervous system and boosts beta and gamma activity.',
  '• Медленное и глубокое дыхание — включает парасимпатическую систему, погружая в альфа- и тета-ритмы.': '• Slow, deep breathing — engages the parasympathetic system, settling into alpha and theta rhythms.',
  'Такой ритм создаёт эффект умеренной гипоксии, насыщает клетки кислородом и балансирует работу мозга и автономной нервной системы.':
    'This rhythm creates a mild hypoxic effect, saturates cells with oxygen and balances the work of the brain and the autonomic nervous system.',
  'После сессий участники отмечают:': 'After sessions, participants report:',
  '• снижение тревожности и психического напряжения;': '• less anxiety and mental tension;',
  '• внутреннее спокойствие и собранность;': '• inner calm and composure;',
  '• разрешение внутренних конфликтов;': '• resolution of inner conflicts;',
  '• появление инсайтов и новых идей;': '• new insights and ideas;',
  '• прилив сил и рост мотивации;': '• a surge of energy and more motivation;',
  '• снятие телесных и психосоматических блоков.': '• release of bodily and psychosomatic blocks.',
  'Исследование в Сколковском институте науки и технологий показало: дыхательные ритмы (6, 20, 45 и 100 циклов в минуту) напрямую влияют на активность мозга; усиливаются альфа- и тета-волны, снижается избыточная бета-активность; парасимпатическая система активируется, уровень тревожности снижается, а внимание и концентрация растут без перегрузки.':
    'A study at the Skolkovo Institute of Science and Technology showed that breathing rhythms (6, 20, 45 and 100 cycles per minute) directly affect brain activity; alpha and theta waves increase and excessive beta activity drops; the parasympathetic system activates, anxiety falls and attention and concentration improve without overload.',
  '❌ Нельзя дышать за рулём или в воде.': '❌ Do not practice while driving or in water.',
  '❌ Нельзя дышать сразу после еды (после практики — можно).': '❌ Do not practice right after a meal (after practice is fine).',
  '❌ Нельзя дышать в алкогольном или наркотическом опьянении.': '❌ Do not practice while intoxicated.',
  '❌ Нельзя дышать в острые периоды заболеваний (воспаления, после операций, при температуре и т. д.).': '❌ Do not practice during acute illness (inflammation, after surgery, with fever, etc.).',
  '❌ Нельзя выполнять практику беременным; людям с ослаблением или заболеваниями сердечно-сосудистой системы; при эпилепсии, глаукоме, психических расстройствах; при приёме антидепрессантов и других психостимуляторов; лицам младше 18 лет.':
    '❌ Do not perform the practice if pregnant; with weakened or diseased cardiovascular system; with epilepsy, glaucoma, mental disorders; while taking antidepressants or other psychostimulants; under 18 years of age.',
  'Если у вас есть эти противопоказания — заниматься Энергодыханием нельзя.': 'If you have these contraindications, you must not do Energy breathing.',
  'Ваше здоровье — ваша ответственность.': 'Your health is your responsibility.',
  'Связное частое дыхание': 'Connected fast breathing',
  'Медленное глубокое дыхание': 'Slow deep breathing',
  'Устройся удобно, дыши спокойно через нос. Расслабь плечи и живот.': 'Settle in comfortably, breathe calmly through the nose. Relax your shoulders and belly.',
  'Дыхание становится чуть глубже и чаще, связно, без пауз.': 'Breathing becomes a bit deeper and faster, connected, without pauses.',
  'Дыши связно и часто, вдох и выдох без пауз. Следи за самочувствием.': 'Breathe connected and fast, inhale and exhale without pauses. Watch how you feel.',
  'Замедляемся: глубокий вдох, длинный спокойный выдох.': 'Slow down: deep inhale, long calm exhale.',
  'Дыши спокойно, позволь телу и мыслям улечься.': 'Breathe calmly, let your body and thoughts settle.',
  'Настройка: устройся удобно, расслабь плечи и живот, дыши спокойно через нос.': 'Setup: settle in comfortably, relax your shoulders and belly, breathe calmly through the nose.',
  'Разогрев: дыхание становится чуть глубже и чаще, связно, без пауз.': 'Warm-up: breathing becomes a bit deeper and faster, connected, without pauses.',
  'После этапа появляется ощущение внутренней собранности и высокой работоспособности. Мозг работает чётко и ясно, тело чувствует энергию без перегрузки. Бета-ритм помогает включиться в активные действия, принимать решения и достигать целей осознанно.':
    'After this stage you feel inwardly composed and highly capable. The mind is sharp and clear, the body feels energized without overload. The beta rhythm helps you engage in action, make decisions and reach goals mindfully.',
  'Медленное глубокое: включает парасимпатическую систему, погружает в альфа- и тета-ритмы, приносит спокойствие и восстановление.':
    'Slow deep: engages the parasympathetic system, settles into alpha and theta rhythms, bringing calm and recovery.',
  'Интеграция: дыши спокойно, позволь телу и мыслям улечься и закрепи состояние.': 'Integration: breathe calmly, let your body and thoughts settle and lock in the state.',
  'Готовая программа: настройка → разогрев → связное частое дыхание → медленное глубокое → интеграция.': 'Ready program: setup → warm-up → connected fast breathing → slow deep → integration.',
  'Прогрессия: «Короткая» → «Стандарт» (со следующего дня) → «Глубокая» (Premium).': 'Progression: Short → Standard (from the next day) → Deep (Premium).',
  'Сейчас доступна только «Короткая». На следующий день откроется «Стандарт», а «Глубокая» — в Premium.': 'Only Short is available now. Standard unlocks the next day, and Deep is part of Premium.',
  '«Глубокая» доступна в Premium.': 'Deep is available in Premium.',

  // ===== КОНТЕНТ: матрица Гаряева =====
  'Ознакомительный раздел': 'Introductory section',
  'Матрица Гаряева — авторский метод, связанный с именем Петра Гаряева и направлением «волновая генетика». В его основе — представление о том, что слово, звук и ритм несут волновую «программу», которая влияет на состояние человека.':
    'The Garyaev Matrix is an original method linked to Pyotr Garyaev and the field of “wave genetics”. It rests on the idea that word, sound and rhythm carry a wave “program” that affects a person’s state.',
  'На практике «матрицы» — это текстовые и звуковые формулы, которые произносятся или прослушиваются в определённом ритме. Сторонники метода считают, что регулярное повторение таких программ помогает настроить организм на восстановление, спокойствие и ясность.':
    'In practice, “matrices” are text and sound formulas spoken or listened to in a set rhythm. Proponents believe that regularly repeating such programs helps tune the body toward recovery, calm and clarity.',
  'Мы приводим метод в ознакомительном виде, как часть дыхательно-звуковых практик. Научное сообщество относится к волновой генетике неоднозначно, поэтому воспринимайте материал как дополнительный инструмент, а не как замену терапии.':
    'We present the method in an introductory form, as part of breathing and sound practices. The scientific community views wave genetics ambiguously, so treat the material as an additional tool, not a replacement for therapy.',
  'Здоровье': 'Health',
  'Базовая матрица восстановления: произносится спокойно и размеренно, задавая общий настрой на оздоровление.': 'The basic recovery matrix: spoken calmly and evenly, setting an overall tone for healing.',
  'Иммунитет': 'Immunity',
  'Программа поддержки защитных сил организма. Сочетается с ровным дыханием и частотой 528 Гц.': 'A program to support the body’s defenses. Pairs well with even breathing and the 528 Hz frequency.',
  'Матрица снятия напряжения и тревоги. Хорошо работает вместе с удлинённым выдохом (3-6, 4-7-8).': 'A matrix for releasing tension and anxiety. Works well together with a lengthened exhale (3-6, 4-7-8).',
  'Для периодов усталости и после нагрузок: настраивает на отдых и наполнение энергией.': 'For periods of fatigue and after exertion: tunes you toward rest and refilling energy.',
  'Защита': 'Protection',
  'Образно-защитная программа: помогает ощущать внутреннюю устойчивость в стрессовых ситуациях.': 'An image-based protection program: helps you feel inwardly steady in stressful situations.',
  'Материалы раздела носят ознакомительный характер и не являются медицинской рекомендацией. При заболеваниях проконсультируйтесь со специалистом.': 'The materials in this section are for information only and are not medical advice. If you have a condition, consult a specialist.',

  // ===== КОНТЕНТ: сольфеджио =====
  'Облегчение боли': 'Pain relief',
  'Традиционно связывают со снятием боли и напряжения.': 'Traditionally associated with relief of pain and tension.',
  'Считается частотой обновления и восстановления тканей.': 'Considered the frequency of renewal and tissue recovery.',
  'Освобождение от страха': 'Release from fear',
  'Снимает чувство вины, страх и блоки выживания. Заземляет и освобождает.': 'Relieves guilt, fear and survival blocks. Grounds and frees.',
  'Перезагрузка и перемены': 'Reset and change',
  'Стирает прошлые травмы, открывает к изменениям, запускает обновление.': 'Erases past trauma, opens you to change, starts renewal.',
  'Частота любви и ДНК': 'Frequency of love and DNA',
  'Гармонизирует сердце, снижает тревогу, восстанавливает баланс.': 'Harmonizes the heart, reduces anxiety, restores balance.',
  'Гармония отношений': 'Harmony of relationships',
  'Восстанавливает связи, развивает эмпатию, балансирует эмоции.': 'Restores connections, develops empathy, balances emotions.',
  'Очищение и интуиция': 'Cleansing and intuition',
  'Очищает тело и пространство, усиливает ясность мышления и голос.': 'Cleanses body and space, sharpens clarity of thought and voice.',
  'Пробуждение и высшее Я': 'Awakening and higher self',
  'Возвращает к духовному порядку, открывает третий глаз, раскрывает интуицию.': 'Returns to spiritual order, opens the third eye, awakens intuition.',
  'Ясность': 'Clarity',
  'Связь с высшим, ясность сознания и покой.': 'Connection with the higher, clarity of mind and peace.',

  // ===== КОНТЕНТ: бинауральные =====
  'Дельта': 'Delta',
  'Глубокий сон': 'Deep sleep',
  '0,5–4 Гц. Глубокий сон и восстановление, выработка гормона роста.': '0.5–4 Hz. Deep sleep and recovery, growth-hormone release.',
  'Тета': 'Theta',
  'Медитация': 'Meditation',
  '4–8 Гц. Расслабление, креативность, работа с подсознанием и установками.': '4–8 Hz. Relaxation, creativity, working with the subconscious and beliefs.',
  'Альфа': 'Alpha',
  'Спокойный фокус': 'Calm focus',
  '8–13 Гц. Спокойная ясность, снижение тревожности, лёгкая медитация.': '8–13 Hz. Calm clarity, less anxiety, light meditation.',
  'Бета': 'Beta',
  'Концентрация': 'Concentration',
  '13–30 Гц. Активное бодрствование, внимание и решение задач.': '13–30 Hz. Active wakefulness, attention and problem-solving.',
  'Гамма': 'Gamma',
  'Инсайты': 'Insights',
  '30–40 Гц. Высокая когнитивная активность, озарения и собранность.': '30–40 Hz. High cognitive activity, insight and composure.',

  // ===== КОНТЕНТ: музыка =====
  'Медитативный эмбиент': 'Meditative ambient',
  'Медленный космический полёт': 'Slow cosmic flight',
  'Бамбуковая флейта': 'Bamboo flute',
  'Глубокий космос': 'Deep space',
  'Дыхание флейты дидзы': 'Breath of the dizi flute',
  'Движение вперёд': 'Forward motion',
  'Поток бамбуковой флейты': 'Flow of the bamboo flute',
  'Поток бамбуковой флейты II': 'Flow of the bamboo flute II',
  'Цигун-медитация': 'Qigong meditation',
  'Дыхание колокола': 'Breath of the bell',
  'Дыхание колокола II': 'Breath of the bell II',
  'Зациклен': 'looped',
  'зациклен': 'looped',

  // ===== КОНТЕНТ: характер дыхания =====
  'Запись 2': 'Recording 2',
  'Запись 1': 'Recording 1',
  'Запись 3': 'Recording 3',
  'Дыхание из аудио (вариант 2)': 'Breath from audio (take 2)',
  'Дыхание из аудио (вариант 1)': 'Breath from audio (take 1)',
  'Новая запись (вариант 3)': 'New recording (take 3)',

  'Восстановление': 'Recovery',
  'Космическое дыхание': 'Cosmic breathing',
  'Космический цигун': 'Cosmic qigong',

  // ===== КОНТЕНТ: служебные сообщения =====
  'Дневной лимит 30 минут исчерпан.': 'Daily limit of 30 minutes reached.',
  'С Premium — практики без ограничений.': 'With Premium — practice without limits.',
  'Раздел в разработке — ждите обновлений.': 'Section under development — stay tuned.',
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
