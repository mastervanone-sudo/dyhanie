// Музыкальная библиотека — 1:1 с нативным приложением (MusicLibrary.kt).
// Файлы лежат рядом: audio/music/<file>.

const BASE = 'audio/music/';

export const TRACKS = [
  { id: 'cosmic_om', title: 'Cosmic Om', subtitle: 'Медитативный эмбиент', file: 'cosmic_om.ogg' },
  { id: 'slow_cosmic_flight', title: 'Slow Cosmic Flight', subtitle: 'Медленный космический полёт', file: 'slow_cosmic_flight.ogg' },
  { id: 'celestial_bamboo', title: 'Celestial Bamboo', subtitle: 'Бамбуковая флейта', file: 'celestial_bamboo.ogg' },
  { id: 'cosmic_breath', title: 'Космическое дыхание', subtitle: 'Глубокий космос', file: 'cosmic_breath.ogg' },
  { id: 'breath_of_dizi', title: 'Breath of the Dizi', subtitle: 'Дыхание флейты дидзы', file: 'breath_of_dizi.ogg' },
  { id: 'forward_motion', title: 'Forward Motion', subtitle: 'Движение вперёд', file: 'forward_motion.ogg' },
  { id: 'flowing_bamboo', title: 'Flowing Bamboo', subtitle: 'Поток бамбуковой флейты', file: 'flowing_bamboo.mp3' },
  { id: 'flowing_bamboo_2', title: 'Flowing Bamboo II', subtitle: 'Поток бамбуковой флейты II', file: 'flowing_bamboo_2.mp3' },
  { id: 'cosmic_qigong', title: 'Космический цигун', subtitle: 'Цигун-медитация', file: 'cosmic_qigong.mp3' },
  { id: 'breath_of_the_bell', title: 'Breath of the Bell', subtitle: 'Дыхание колокола', file: 'breath_of_the_bell.mp3' },
  { id: 'breath_of_the_bell_2', title: 'Breath of the Bell II', subtitle: 'Дыхание колокола II', file: 'breath_of_the_bell_2.mp3' },
];

export const MusicLibrary = {
  tracks: TRACKS,
  get default() { return TRACKS[0]; },
  byId(id) { return TRACKS.find((t) => t.id === id) || TRACKS[0]; },
  url(id) { return BASE + this.byId(id).file; },
  ids() { return TRACKS.map((t) => t.id); },
};
