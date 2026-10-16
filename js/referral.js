// Партнёрская программа: привязка реферала, статистика и заявка на выплату.
// Вся логика — на сервере; здесь только вызовы с проверенным initData.
import { API_BASE, BOT_USERNAME } from './config.js?v34';
import { TG } from './telegram.js?v34';

export const Referral = {
  get configured() { return API_BASE.length > 0; },

  link(code) {
    return code ? `https://t.me/${BOT_USERNAME}?start=ref_${code}` : `https://t.me/${BOT_USERNAME}`;
  },

  async _get(path) {
    const res = await fetch(API_BASE + path + '?initData=' + encodeURIComponent(TG.initData));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  async _post(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ initData: TG.initData }, body || {})),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  me() { return this._get('/me'); },
  claim(code) { return this._post('/referral/claim', { code }); },
  setWallet(wallet) { return this._post('/referral/wallet', { wallet }); },
  payout(wallet) { return this._post('/referral/payout', { wallet }); },
};
