// Chặn quảng cáo: luật mạng tĩnh (rules/ads.json) do Chrome tự chặn; ở đây lo phần ẩn khung quảng cáo (CSS), danh sách trang
// được phép quảng cáo (tắt chặn theo trang), số quảng cáo đã chặn trên biểu tượng.
const ALLOW_BASE = 900000; // id luật động "cho phép trang này"
let cosmetic = null;

async function loadCosmetic() {
  if (!cosmetic) cosmetic = await (await fetch(chrome.runtime.getURL('cosmetic.json'))).json();
  return cosmetic;
}

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

async function allowed() {
  return (await chrome.storage.local.get('allow')).allow ?? [];
}

/** Trang (hoặc tên miền cha) có trong danh sách cho phép quảng cáo không. */
async function isAllowed(host) {
  const list = await allowed();
  return list.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Đồng bộ luật động: mỗi trang được phép = một luật allowAllRequests. */
async function syncAllowRules() {
  const list = await allowed();
  const old = (await chrome.declarativeNetRequest.getDynamicRules()).filter((r) => r.id >= ALLOW_BASE).map((r) => r.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old,
    addRules: list.map((d, i) => ({
      id: ALLOW_BASE + i, priority: 100, action: { type: 'allowAllRequests' },
      condition: { requestDomains: [d], resourceTypes: ['main_frame', 'sub_frame'] },
    })),
  });
}

/** CSS ẩn khung quảng cáo cho trang: luật chung + luật riêng của tên miền (trừ luật "không ẩn" của trang đó). */
const cssCache = new Map();
async function cssFor(host) {
  if (cssCache.has(host)) return cssCache.get(host);
  const css = await buildCss(host);
  if (cssCache.size > 50) cssCache.clear();
  cssCache.set(host, css);
  return css;
}
async function buildCss(host) {
  const c = await loadCosmetic();
  const parts = host.split('.');
  const domains = parts.map((_, i) => parts.slice(i).join('.')).filter((d) => d.includes('.'));
  const unhide = new Set(domains.flatMap((d) => c.unhide[d] ?? []));
  const selectors = [...c.generic, ...domains.flatMap((d) => c.specific[d] ?? [])].filter((s) => !unhide.has(s));
  // Mỗi selector một khối: selector lạ (trình duyệt không hiểu) chỉ hỏng khối của nó, không hỏng cả trang CSS.
  return selectors.map((s) => `${s}{display:none!important}`).join('\n');
}

// ---- Đếm quảng cáo bị chặn theo tab (tự đếm: getMatchedRules của Chrome chỉ cho ~20 lần hỏi / 10 phút).
// Yêu cầu bị luật chặn của extension báo lỗi ERR_BLOCKED_BY_CLIENT; mở trang mới trong tab thì đếm lại từ 0.
// Service worker có thể bị Chrome tắt: số lưu trong storage.session (mất khi đóng trình duyệt).
const counts = new Map();
let saveTimer = 0;
const persistCounts = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => chrome.storage.session.set({ counts: Object.fromEntries(counts) }).catch(() => {}), 500);
};
const ready = chrome.storage.session.get('counts').then(({ counts: saved }) => { for (const [k, v] of Object.entries(saved ?? {})) if (!counts.has(Number(k))) counts.set(Number(k), v); }).catch(() => {});
// Số Chrome ghi nhận (getMatchedRules): hỏi chung mọi tab, tối đa 1 lần / 30 giây (Chrome giới hạn ~20 lần / 10 phút), chia theo tab.
let matched = { at: 0, byTab: new Map() };
async function refreshMatched() {
  if (Date.now() - matched.at < 30000) return matched.byTab;
  matched.at = Date.now();
  try {
    await allowReady;
    const byTab = new Map();
    for (const m of (await chrome.declarativeNetRequest.getMatchedRules()).rulesMatchedInfo) {
      if (m.tabId < 0 || m.rule.rulesetId === '_dynamic' || allowIds[m.rule.rulesetId]?.has(m.rule.ruleId)) continue;
      byTab.set(m.tabId, (byTab.get(m.tabId) ?? 0) + 1);
    }
    matched.byTab = byTab;
  } catch { /* quá giới hạn số lần hỏi: dùng số cũ */ }
  return matched.byTab;
}
async function blockedIn(tabId) {
  await ready;
  if (tabId === undefined) return 0;
  const fromChrome = (await refreshMatched()).get(tabId) ?? 0;
  return Math.max(fromChrome, counts.get(tabId) ?? 0);
}
chrome.webRequest.onBeforeRequest.addListener((d) => {
  if (d.type === 'main_frame' && d.tabId >= 0) { counts.set(d.tabId, 0); persistCounts(); }
}, { urls: ['<all_urls>'], types: ['main_frame'] });
const bump = (tabId) => { counts.set(tabId, (counts.get(tabId) ?? 0) + 1); persistCounts(); };
// Extension cài dạng "giải nén" (thư mục): Chrome báo từng lần luật khớp (onRuleMatchedDebug). Yêu cầu bị luật chặn KHÔNG đi qua
// webRequest (đã thử 2026-11-17: đếm ra 0). Bỏ luật cho phép (allow-ids.json) và luật "cho phép trang này" (luật động).
let allowIds = null;
const allowReady = fetch(chrome.runtime.getURL('rules/allow-ids.json')).then((r) => r.json()).then((j) => { allowIds = { ads: new Set(j.ads), ads_more: new Set(j.ads_more) }; }).catch(() => { allowIds = { ads: new Set(), ads_more: new Set() }; });
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
    const { rule, request } = info;
    if (request.tabId < 0 || rule.rulesetId === '_dynamic' || rule.rulesetId === '_session') return;
    await allowReady;
    if (allowIds[rule.rulesetId]?.has(rule.ruleId)) return;
    bump(request.tabId);
  });
} else {
  // Bản cài từ cửa hàng (không có onRuleMatchedDebug): dựa vào lỗi ERR_BLOCKED_BY_CLIENT nếu trình duyệt có báo.
  chrome.webRequest.onErrorOccurred.addListener((d) => { if (d.tabId >= 0 && d.error === 'net::ERR_BLOCKED_BY_CLIENT') bump(d.tabId); }, { urls: ['<all_urls>'] });
}
chrome.tabs.onRemoved.addListener((tabId) => { counts.delete(tabId); persistCounts(); });

// ---- Lưới an toàn cho tab bật lên: tab vừa được trang khác mở ra (không phải người dùng tự mở) mà trỏ tới / chuyển hướng qua
// tên miền quảng cáo đã biết (luật "||tenmien^" trong bộ luật) thì đóng. Phần chính chặn theo hành vi nằm ở popup-guard.js.
let adDomains = null;
async function loadAdDomains() {
  if (adDomains) return adDomains;
  const set = new Set();
  for (const file of ['rules/ads.json', 'rules/ads_more.json']) {
    try {
      for (const r of await (await fetch(chrome.runtime.getURL(file))).json()) {
        const m = r.action.type === 'block' && !r.condition.initiatorDomains && r.condition.urlFilter.match(/^\|\|([a-z0-9.-]+)\^?$/);
        if (m) set.add(m[1]);
      }
    } catch { /* thiếu file: bỏ qua */ }
  }
  return (adDomains = set);
}
const isAdHost = (host) => {
  for (let h = host; h.includes('.'); h = h.slice(h.indexOf('.') + 1)) if (adDomains.has(h)) return true;
  return false;
};
const popups = new Map(); // tabId mới mở → { at, sourceTabId }
async function checkPopup(tabId, url) {
  const p = popups.get(tabId);
  if (!p || Date.now() - p.at > 10000) { popups.delete(tabId); return; }
  const host = hostOf(url);
  if (!host || (await chrome.storage.local.get('off')).off) return;
  const source = await chrome.tabs.get(p.sourceTabId).catch(() => null);
  if (source?.url && (await isAllowed(hostOf(source.url)))) return;
  await loadAdDomains();
  if (isAdHost(host)) { popups.delete(tabId); chrome.tabs.remove(tabId).catch(() => {}); bump(p.sourceTabId); }
}
chrome.webNavigation.onCreatedNavigationTarget.addListener((d) => {
  popups.set(d.tabId, { at: Date.now(), sourceTabId: d.sourceTabId });
  checkPopup(d.tabId, d.url);
});
chrome.webRequest.onBeforeRedirect.addListener((d) => { if (popups.has(d.tabId)) checkPopup(d.tabId, d.redirectUrl); }, { urls: ['<all_urls>'], types: ['main_frame'] });
chrome.webNavigation.onCommitted.addListener((d) => { if (d.frameId === 0 && popups.has(d.tabId)) checkPopup(d.tabId, d.url); });
chrome.tabs.onRemoved.addListener((tabId) => popups.delete(tabId));

chrome.runtime.onInstalled.addListener(async () => {
  await syncAllowRules();
  chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true });
  chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
});
chrome.runtime.onStartup.addListener(() => chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true }));

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    if (msg?.type === 'hide') {
      // Địa chỉ trang do content script gửi kèm (lúc trang vừa bắt đầu tải, sender.tab có thể chưa có).
      const host = hostOf(msg.url || sender.url || sender.tab?.url || '');
      if (!host || (await isAllowed(host)) || (await chrome.storage.local.get('off')).off) { reply({ ok: false }); return; }
      // Trả CSS để trang tự gắn ngay (chèn từ đây lúc trang vừa bắt đầu tải có thể rơi vào trang trống trước đó, đã gặp khi thử).
      reply({ ok: true, css: await cssFor(host) });
      return;
    }
    if (msg?.type === 'count') {
      // sender.tab có thể thiếu (đã gặp khi thử): tìm tab theo địa chỉ trang.
      const tabId = sender.tab?.id ?? (msg.url ? (await chrome.tabs.query({ url: msg.url.split('#')[0] }).catch(() => []))[0]?.id : undefined);
      reply({ blocked: await blockedIn(tabId) });
      return;
    }
    if (msg?.type === 'state') {
      const host = hostOf(msg.url);
      reply({ host, allowed: host ? await isAllowed(host) : false, off: Boolean((await chrome.storage.local.get('off')).off), blocked: await blockedIn(msg.tabId) });
      return;
    }
    if (msg?.type === 'toggleSite') {
      const list = await allowed();
      const next = list.includes(msg.host) ? list.filter((d) => d !== msg.host) : [...list, msg.host];
      await chrome.storage.local.set({ allow: next });
      await syncAllowRules();
      reply({ allowed: next.includes(msg.host) });
      return;
    }
    if (msg?.type === 'toggleAll') {
      const off = !(await chrome.storage.local.get('off')).off;
      await chrome.storage.local.set({ off });
      await chrome.declarativeNetRequest.updateEnabledRulesets(off ? { disableRulesetIds: ['ads', 'ads_more'] } : { enableRulesetIds: ['ads', 'ads_more'] });
      reply({ off });
      return;
    }
    reply(null);
  })();
  return true;
});
