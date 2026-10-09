// TON Connect — подключение кошелька. Работает, если загружен CDN @tonconnect/ui.
import { Progress } from './store.js';

let tonConnectUI = null;
let manifestUrl = '';

export const TON = {
  get available() { return typeof window.TON_CONNECT_UI !== 'undefined'; },
  get connected() { return !!(tonConnectUI && tonConnectUI.account); },
  get address() { return tonConnectUI && tonConnectUI.account ? tonConnectUI.account.address : null; },

  init(manifest) {
    manifestUrl = manifest;
    if (!this.available) return false;
    try {
      tonConnectUI = new window.TON_CONNECT_UI.TonConnectUI({ manifestUrl });
      tonConnectUI.onStatusChange((wallet) => {
        Progress.setWallet(wallet ? wallet.account.address : null);
        Progress.save();
        if (typeof window.__onWalletChange === 'function') window.__onWalletChange();
      });
      return true;
    } catch (e) {
      console.warn('TON Connect init failed', e);
      return false;
    }
  },

  async open() {
    if (!tonConnectUI) return false;
    try { await tonConnectUI.openModal(); return true; } catch (e) { return false; }
  },

  async disconnect() {
    if (!tonConnectUI) return;
    try { await tonConnectUI.disconnect(); } catch (e) {}
    Progress.setWallet(null);
    await Progress.save();
  },

  shortAddress() {
    const a = this.address;
    if (!a) return '';
    return a.slice(0, 4) + '…' + a.slice(-4);
  },
};
