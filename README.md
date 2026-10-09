# Дыхание — Telegram Mini App

Мини-приложение ВКонтакте-независимое: дыхательные практики внутри Telegram, геймификация (XP, серии, уровни, достижения), TON Connect и оплата Premium через Telegram Stars.

Технологии: чистый HTML/CSS/JS (ES-модули), без сборщика. Внешние библиотеки подгружаются асинхронно с CDN:
- `telegram-web-app.js` — Telegram WebApp API
- `@tonconnect/ui` — подключение TON-кошелька

## Структура
```
index.html               точка входа
css/app.css              стили (тема приложения)
js/patterns.js           практики (перенесено из нативного приложения)
js/session.js            движок дыхательной сессии (фазы, таймер)
js/store.js              прогресс и геймификация (Telegram CloudStorage + фолбэк localStorage)
js/telegram.js           обёртка Telegram WebApp + загрузчик скриптов
js/ton.js                TON Connect
js/stars.js              Telegram Stars (Premium)
js/app.js                экраны и роутер
tonconnect-manifest.json манифест TON Connect
icon.png                 иконка (512×512)
```

## Локальный запуск
Нужен любой статичный сервер (ES-модули не грузятся с `file://`):
```
python -m http.server 8765
```
Открыть http://localhost:8765/ — вне Telegram работает в режиме «гостя» (прогресс в localStorage).

Быстрый переход к экрану: `?s=progress`, `?s=wallet`, `?s=premium`, `?s=session&p=box_4444`.

## Геймификация
- XP за завершённую практику: `10 + минуты`, но не больше **60 XP в день** (защита от накрутки и от «дышать ради награды» слишком много).
- Уровень = `XP / 100 + 1`.
- Серия дней — за регулярность, а не за интенсивность.
- Достижения: первая практика, серии 3/7 дней, 60/300 минут, 5 практик, 5 уровень.

## Деплой на GitHub Pages
Файлы кладутся в корень репозитория, Pages — с ветки `main`, папка `/`.

После деплоя обновить `tonconnect-manifest.json`:
```json
{ "url": "https://<аккаунт>.github.io/<репозиторий>/",
  "name": "Дыхание",
  "iconUrl": "https://<аккаунт>.github.io/<репозиторий>/icon.png" }
```

## Настройка бота (@BotFather)
1. `/newbot` — создать бота, получить токен (хранить в секрете, только на сервере).
2. `/newapp` (или в настройках бота → Mini App) — указать URL мини-приложения (адрес GitHub Pages).
3. `/setmenubutton` — кнопка запуска мини-аппа в боте.
4. Проверить, что в `initData` приходит `user` — от него зависит имя и облачный прогресс.

## Telegram Stars (Premium)
Оплата цифровых товаров в Telegram — только через Stars (XTR). Нужен бэкенд:
1. Сервер принимает `initData` (валидирует подпись по токену бота).
2. Создаёт счёт: Bot API `createInvoiceLink` с `currency=XTR`.
3. Присылает ссылку мини-аппу, тот открывает `WebApp.openInvoice`.
4. Webhook `successful_payment` → активирует Premium.
В `js/stars.js` укажи `API_BASE` своего сервера — тогда оплата заработает.

## TON Connect
Кошелёк не обязателен для практик. Используется для будущих NFT-достижений и оплаты в TON. Манифест должен быть доступен по HTTPS.

## Перед релизом
- Убрать отладочный перехват ошибок в `index.html` (окно с `JS ERROR`).
- Проверить мини-апп в реальном Telegram (десктоп + Android + iOS).
