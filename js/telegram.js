// Обёртка над Telegram WebApp API с безопасными фолбэками для браузера.
// window.Telegram читается динамически: скрипт Telegram грузится асинхронно.
function wa() {
  return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
}

export const TG = {
  get available() { return !!wa(); },
  get initData() { const w = wa(); return w ? w.initData : ''; },
  get user() {
    const w = wa();
    return w && w.initDataUnsafe ? w.initDataUnsafe.user || null : null;
  },

  ready() {
    const w = wa();
    if (!w) return;
    try { w.ready(); } catch (e) {}
    try { w.expand(); } catch (e) {}
  },
  theme() {
    const w = wa();
    return (w && w.themeParams) || {};
  },
  colorScheme() {
    const w = wa();
    return (w && w.colorScheme) || 'dark';
  },
  haptic(type = 'impact', style = 'light') {
    const w = wa();
    if (!w || !w.HapticFeedback) return;
    try {
      if (type === 'impact') w.HapticFeedback.impactOccurred(style);
      else if (type === 'notify') w.HapticFeedback.notificationOccurred(style);
      else if (type === 'select') w.HapticFeedback.selectionChanged();
    } catch (e) {}
  },
  showMainButton(text, onClick) {
    const w = wa();
    if (!w || !w.MainButton) return;
    w.MainButton.setText(text);
    w.MainButton.onClick(onClick);
    w.MainButton.show();
  },
  hideMainButton() {
    const w = wa();
    if (w && w.MainButton) { w.MainButton.offClick(); w.MainButton.hide(); }
  },
  showBackButton(onClick) {
    const w = wa();
    if (!w || !w.BackButton) return;
    w.BackButton.onClick(onClick);
    w.BackButton.show();
  },
  hideBackButton() {
    const w = wa();
    if (w && w.BackButton) { w.BackButton.offClick(); w.BackButton.hide(); }
  },
  share(url, text) {
    const w = wa();
    const link = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
    if (w) { try { w.openTelegramLink(link); return; } catch (e) {} }
    window.open(link, '_blank');
  },
  openLink(url) {
    const w = wa();
    if (w && w.openLink) { try { w.openLink(url); return; } catch (e) {} }
    window.open(url, '_blank');
  },
  name() {
    const u = this.user;
    if (!u) return 'Гость';
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Гость';
  },
};

// Асинхронная подгрузка внешних скриптов (Telegram WebApp, TON Connect) без блокировки.
export function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}
