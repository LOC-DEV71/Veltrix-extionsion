// Đọc file font của extension giúp content.js. content.js tự fetch chrome-extension://…/fonts trên YouTube bị Chrome chặn
// ("Unsafe attempt to load URL … Domains, protocols and ports must match", lỗi người dùng báo 2026-11-19).
// Service worker đọc tài nguyên của chính extension thì luôn được; gửi về dạng base64 (tin nhắn không chở được ArrayBuffer).
importScripts('themes.js');
const ALLOWED = new Set(Object.values(globalThis.VeltrixThemes.FONT_FILES).flat().map((f) => f.file));

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type !== 'font' || !ALLOWED.has(msg.file)) return false;
  fetch(chrome.runtime.getURL('fonts/' + msg.file))
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const u = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000));
      reply({ b64: btoa(bin) });
    })
    .catch(() => reply(null));
  return true; // trả lời bất đồng bộ
});
