// Telegram Stars — подписка Premium. Оплата цифровых товаров в Telegram идёт через Stars (XTR).
// Создание счёта и подтверждение — на сервере (Bot API createInvoiceLink + webhook).
// Пока бэкенда нет, модуль работает как заготовка и честно сообщает об этом.
import { TG } from './telegram.js?v40';
import { Progress } from './store.js?v40';
import { API_BASE } from './config.js?v40';

export { API_BASE };

export const PLANS = [
  { id: 'week', title: 'Неделя', stars: 39, days: 7 },
  { id: 'month', title: 'Месяц', stars: 249, days: 30 },
  { id: 'year', title: 'Год', stars: 1490, days: 365 },
];

export const STARS = {
  get configured() { return API_BASE.length > 0; },

  async buy(planId) {
    if (!this.configured) {
      alert(
        'Оплата Stars включится после подключения бэкенда и бота.\n\n' +
        'Нужно: 1) создать бота у @BotFather, 2) поднять мини-сервер, ' +
        '3) создать счёт через Bot API (createInvoiceLink, currency=XTR).'
      );
      return { ok: false, reason: 'no_backend' };
    }
    try {
      const res = await fetch(API_BASE + '/stars/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, initData: TG.initData }),
      });
      const data = await res.json();
      if (!data.invoiceLink) return { ok: false, reason: 'no_link' };
      TG.openInvoice(data.invoiceLink, (status) => {
        if (status === 'paid') {
          Progress.setPremium(true);
          Progress.save();
          if (typeof window.__onPremiumChange === 'function') window.__onPremiumChange();
          alert('Premium активирован. Спасибо!');
        }
      });
      return { ok: true };
    } catch (e) {
      alert('Не удалось создать счёт: ' + e.message);
      return { ok: false, reason: 'error' };
    }
  },

  // Синхронизация статуса Premium с сервером (по подписи initData)
  async syncPremium() {
    if (!this.configured || !TG.initData) return;
    try {
      const res = await fetch(API_BASE + '/premium?initData=' + encodeURIComponent(TG.initData));
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.premium) {
        Progress.setPremium(true);
        await Progress.save();
        if (typeof window.__onPremiumChange === 'function') window.__onPremiumChange();
      }
    } catch (e) {}
  },
};
