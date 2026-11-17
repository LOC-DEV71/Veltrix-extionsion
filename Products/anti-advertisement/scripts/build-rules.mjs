// Tạo luật chặn quảng cáo cho extension từ danh sách lọc công khai (EasyList + ABPVN cho web Việt).
// Chạy: node scripts/build-rules.mjs   (tải danh sách mới nhất, ghi rules/*.json và cosmetic.json)
// - Luật mạng (||ads.com^$script,third-party...) → declarativeNetRequest (chặn tải). Chrome cho tối đa ~30.000 luật tĩnh
//   mỗi extension: ưu tiên ABPVN (web Việt) rồi tới EasyList.
// - Luật ẩn phần tử (##.banner, vnexpress.net##.ads) → CSS ẩn khung quảng cáo còn sót (cosmetic.json).
// Luật dùng tính năng Chrome không có (regex, $redirect, $removeparam, $csp...) thì bỏ qua: một luật hỏng làm hỏng cả bộ.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LISTS = [
  { id: 'abpvn', url: 'https://raw.githubusercontent.com/abpvn/abpvn/master/filter/abpvn.txt' },
  { id: 'easylist', url: 'https://easylist.to/easylist/easylist.txt' },
];
const MAX_RULES = 29000;
/** Máy chủ quảng cáo / theo dõi quảng cáo lớn nhất: luôn chặn (đặt đầu bộ luật chính). */
const CORE_AD_DOMAINS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com', 'adservice.google.com.vn', 'pagead2.googlesyndication.com',
  'googletagservices.com', 'imasdk.googleapis.com', '2mdn.net', 'adnxs.com', 'adsrvr.org', 'criteo.com', 'criteo.net', 'taboola.com', 'outbrain.com',
  'amazon-adsystem.com', 'pubmatic.com', 'rubiconproject.com', 'openx.net', 'casalemedia.com', 'smartadserver.com', 'adform.net', 'yieldmo.com',
  'teads.tv', 'propellerads.com', 'popads.net', 'popcash.net', 'adsterra.com', 'exoclick.com', 'juicyads.com', 'mgid.com', 'revcontent.com',
  'zedo.com', 'media.net', 'adcolony.com', 'applovin.com', 'unityads.unity3d.com', 'moatads.com', 'scorecardresearch.com',
  'admicro.vn', 'adtimaserver.vn', 'eclick.vn', 'ambientplatform.vn', 'yomedia.vn', 'novanet.vn', 'adnetwork.vn',
];

const TYPES = {
  script: 'script', image: 'image', stylesheet: 'stylesheet', object: 'object', xmlhttprequest: 'xmlhttprequest',
  subdocument: 'sub_frame', media: 'media', font: 'font', ping: 'ping', websocket: 'websocket', other: 'other',
};
const ALL_TYPES = ['sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'media', 'websocket', 'other'];
const IGNORED_OPTS = new Set(['match-case', 'important', 'first-party', '1p', '3p', 'all', 'popunder']);
const ascii = (s) => /^[\x20-\x7e]*$/.test(s);

/** Một dòng luật mạng → luật declarativeNetRequest, hoặc null nếu không đổi được. */
function networkRule(line) {
  let allow = false;
  if (line.startsWith('@@')) { allow = true; line = line.slice(2); }
  if (line.startsWith('/') && line.endsWith('/')) return null; // regex: bỏ
  let filter = line, opts = '';
  const dollar = line.lastIndexOf('$');
  if (dollar > 0 && /^[\w~=,.|\-*]+$/.test(line.slice(dollar + 1))) { filter = line.slice(0, dollar); opts = line.slice(dollar + 1); }
  if (!filter || !ascii(filter) || filter.length > 300 || /^\|\|?\*?$/.test(filter)) return null;
  // Chrome không nhận '||*' ở đầu: '||*.servimg.com' = mọi tên miền con = '||servimg.com'.
  filter = filter.replace(/^\|\|\*\.?/, '||').replace(/^\*+/, '');
  if (!filter || filter === '||' || filter === '|') return null;
  if (/\|.+\|.+/.test(filter.replace(/^\|\|/, ''))) return null;
  const condition = {};
  let types = null; const excluded = [];
  for (const o of opts ? opts.split(',') : []) {
    const neg = o.startsWith('~'); const key = neg ? o.slice(1) : o;
    if (key === 'third-party' || key === '3p') condition.domainType = neg ? 'firstParty' : 'thirdParty';
    else if (key.startsWith('domain=')) {
      const doms = key.slice(7).split('|').filter(Boolean);
      if (!doms.every((d) => ascii(d) && !d.includes('*'))) return null;
      const inc = doms.filter((d) => !d.startsWith('~')).map((d) => d.toLowerCase());
      const exc = doms.filter((d) => d.startsWith('~')).map((d) => d.slice(1).toLowerCase());
      if (inc.length) condition.initiatorDomains = inc;
      if (exc.length) condition.excludedInitiatorDomains = exc;
    } else if (TYPES[key]) { if (neg) excluded.push(TYPES[key]); else (types ??= []).push(TYPES[key]); }
    else if (key === 'document' && !neg && allow) (types ??= []).push('main_frame');
    else if (IGNORED_OPTS.has(key)) continue;
    else return null; // $redirect, $csp, $removeparam, $popup...: Chrome không có / không cần
  }
  if (types) condition.resourceTypes = types;
  else if (excluded.length) condition.resourceTypes = ALL_TYPES.filter((t) => !excluded.includes(t));
  else condition.resourceTypes = ALL_TYPES;
  condition.urlFilter = filter;
  return { priority: allow ? 3 : 1, action: { type: allow ? 'allow' : 'block' }, condition };
}

async function main() {
  const rules = [];
  // Luật Chrome từ chối (công cụ check-rules.mjs dò ra khi nạp thử): bỏ, vì một luật hỏng làm Chrome bỏ cả bộ.
  const badFile = path.join(ROOT, 'scripts', 'bad.json');
  const bad = new Set(fs.existsSync(badFile) ? JSON.parse(fs.readFileSync(badFile, 'utf8')) : []);
  const generic = new Set();
  const specific = {}; // tên miền → [selector]
  const unhide = {};   // tên miền → [selector] không ẩn
  const counts = {};
  for (const list of LISTS) {
    const res = await fetch(list.url);
    if (!res.ok) throw new Error(`${list.id}: HTTP ${res.status}`);
    const lines = (await res.text()).split(/\r?\n/);
    let net = 0, css = 0;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('!') || line.startsWith('[')) continue;
      const cos = line.match(/^([^#]*)(##|#@#)(.+)$/);
      if (cos) {
        const [, doms, sep, sel] = cos;
        if (sel.startsWith('+js') || /:(-abp-|has-text|xpath|matches-css|upward|remove|style)/.test(sel) || !ascii(doms)) continue;
        const domains = doms.split(',').map((d) => d.trim().toLowerCase()).filter((d) => d && !d.startsWith('~'));
        if (sep === '#@#') { for (const d of domains) (unhide[d] ??= []).push(sel); continue; }
        if (!domains.length) generic.add(sel);
        else for (const d of domains) (specific[d] ??= []).push(sel);
        css++;
        continue;
      }
      if (line.includes('#?#') || line.includes('#$#') || line.includes('#%#')) continue;
      const rule = networkRule(line);
      if (rule && !bad.has(line)) { rule.src = line; rule.list = list.id; rules.push(rule); net++; }
    }
    counts[list.id] = { net, css };
  }
  // Chrome cho ~30.000 luật: xếp ưu tiên rồi mới cắt (EasyList để luật máy chủ quảng cáo chính ở CUỐI file, cắt theo thứ tự
  // file thì mất luật googlesyndication / doubleclick, đã gặp 2026-11-17). Ưu tiên: luật cho phép (tránh hỏng trang) → chặn hẳn
  // tên miền quảng cáo (||x.com^) → ABPVN (web Việt) → luật theo đường dẫn → luật chỉ áp cho vài trang.
  const score = (r) => {
    if (r.action.type === 'allow') return 0;
    const domainOnly = /^\|\|[a-z0-9.-]+\^?$/.test(r.condition.urlFilter) && !r.condition.initiatorDomains;
    if (domainOnly) return 1;
    if (r.list === 'abpvn') return 2;
    if (!r.condition.initiatorDomains) return 3;
    return 4;
  };
  // Tên miền quảng cáo lớn nhất: luôn ở đầu bộ luật đầu tiên (bộ Chrome bảo đảm chạy).
  const core = CORE_AD_DOMAINS.map((d) => ({ priority: 1, action: { type: 'block' }, condition: { urlFilter: `||${d}^`, resourceTypes: ALL_TYPES }, src: `||${d}^` }));
  const coreSet = new Set(core.map((r) => r.condition.urlFilter.replace(/\^$/, '')));
  const total = rules.length;
  rules.sort((a, b) => score(a) - score(b));
  const all = [...core, ...rules.filter((r) => !(coreSet.has(r.condition.urlFilter.replace(/\^$/, '')) && !r.condition.initiatorDomains && r.action.type === 'block'))];
  for (const r of all) delete r.list;
  // 2 bộ: bộ đầu (≤ 29.000, Chrome bảo đảm chạy) + bộ thêm (dùng phần sức chứa dư chung của trình duyệt, thường vẫn còn).
  const first = all.slice(0, MAX_RULES), more = all.slice(MAX_RULES, MAX_RULES * 2);
  console.log(`Có ${total} luật mạng: bộ chính ${first.length}, bộ thêm ${more.length}.`);
  first.forEach((r, i) => { r.id = i + 1; });
  more.forEach((r, i) => { r.id = i + 1; });
  // Dòng gốc của từng luật (để check-rules.mjs biết luật id N là dòng nào), không đưa vào file luật của extension.
  const strip = (list) => list.map((r) => { const src = r.src; delete r.src; return src; });
  fs.writeFileSync(path.join(ROOT, 'scripts', 'sources.json'), JSON.stringify({ ads: strip(first), ads_more: strip(more) }));
  fs.mkdirSync(path.join(ROOT, 'rules'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'rules', 'ads.json'), JSON.stringify(first));
  fs.writeFileSync(path.join(ROOT, 'rules', 'ads_more.json'), JSON.stringify(more));
  // Id các luật CHO PHÉP (không phải chặn): background bỏ qua khi đếm số quảng cáo đã chặn.
  fs.writeFileSync(path.join(ROOT, 'rules', 'allow-ids.json'), JSON.stringify({ ads: first.filter((r) => r.action.type !== 'block').map((r) => r.id), ads_more: more.filter((r) => r.action.type !== 'block').map((r) => r.id) }));
  const rules2 = first.length + more.length;
  fs.writeFileSync(path.join(ROOT, 'cosmetic.json'), JSON.stringify({ generic: [...generic], specific, unhide }));
  fs.writeFileSync(path.join(ROOT, 'rules', 'info.json'), JSON.stringify({ builtAt: new Date().toISOString(), counts, rules: rules2, generic: generic.size, sites: Object.keys(specific).length }, null, 1));
  console.log(`Luật chặn: ${rules2} · ẩn chung: ${generic.size} · ẩn theo trang: ${Object.keys(specific).length} trang`, counts);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
