// Nén từng extension trong Products/ thành .zip cho web Veltrix Store
// và tạo web/src/data/catalog.json. Chạy: node scripts/build.mjs (không cần cài thư viện).
// `npm run dev` / `npm run build` trong web/ tự gọi script này.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'web', 'public');
const DATA = path.join(ROOT, 'web', 'src', 'data', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));

// Không đưa vào zip: Chrome cấm tên bắt đầu bằng "_" (vd _metadata), file ẩn, công cụ dựng.
const SKIP_DIRS = new Set(['scripts', 'node_modules']);
const SKIP_FILES = new Set(['Thumbs.db', 'desktop.ini']);

const PERMISSION_TEXT = {
  declarativeNetRequest: 'Chặn hoặc cho phép yêu cầu mạng theo danh sách lọc',
  declarativeNetRequestFeedback: 'Đếm số yêu cầu mạng đã bị chặn',
  storage: 'Lưu cài đặt của tiện ích trên máy bạn',
  unlimitedStorage: 'Lưu ảnh nền dung lượng lớn trên máy bạn',
  scripting: 'Chèn mã và CSS vào trang web',
  tabs: 'Biết địa chỉ trang đang mở trong từng tab',
  webRequest: 'Theo dõi yêu cầu mạng của trang',
  activeTab: 'Truy cập tab hiện tại khi bạn bấm vào tiện ích'
};

function hostText(pattern) {
  if (pattern === '<all_urls>' || /^\*:\/\/\*\/\*$|^https?:\/\/\*\/\*$/.test(pattern)) {
    return 'Đọc và thay đổi dữ liệu trên mọi trang web';
  }
  const m = pattern.match(/^[^:]+:\/\/(\*\.)?([^/]+)/);
  return m ? `Đọc và thay đổi dữ liệu trên ${m[2].replace(/^www\./, '')}` : pattern;
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('_') || ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) out.push(...listFiles(full, base));
    } else if (!SKIP_FILES.has(ent.name) && !ent.name.endsWith('.zip')) {
      out.push({ full, rel: path.relative(base, full).split(path.sep).join('/') });
    }
  }
  return out;
}

// ---- Trình ghi ZIP tối giản (deflate, tên UTF-8) ----
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosTime(d) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  };
}
function writeZip(outPath, entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data, mtime } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const { time, date } = dosTime(mtime);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, comp);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += 30 + nameBuf.length + comp.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(outPath, Buffer.concat([...chunks, cdBuf, end]));
}

// ---- Dựng ----
fs.mkdirSync(path.join(PUBLIC, 'downloads'), { recursive: true });
fs.mkdirSync(path.join(PUBLIC, 'icons'), { recursive: true });
fs.mkdirSync(path.dirname(DATA), { recursive: true });

const products = [];
for (const p of catalog.products) {
  const dir = path.join(ROOT, p.folder);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const files = listFiles(dir);
  let latest = new Date(0);
  const entries = files.map(({ full, rel }) => {
    const st = fs.statSync(full);
    if (st.mtime > latest) latest = st.mtime;
    return { name: `${p.zip}/${rel}`, data: fs.readFileSync(full), mtime: st.mtime };
  });
  const zipRel = `downloads/${p.zip}.zip`;
  writeZip(path.join(PUBLIC, zipRel), entries);
  const size = fs.statSync(path.join(PUBLIC, zipRel)).size;

  const iconRel = `icons/${p.id}.png`;
  fs.copyFileSync(path.join(dir, p.icon), path.join(PUBLIC, iconRel));

  const hosts = new Set(manifest.host_permissions || []);
  for (const cs of manifest.content_scripts || []) (cs.matches || []).forEach((m) => hosts.add(m));
  const permissions = [
    ...[...new Set([...hosts].map(hostText))],
    ...(manifest.permissions || []).map((k) => PERMISSION_TEXT[k] || k)
  ];

  const { folder, icon, ...pub } = p;
  products.push({
    ...pub,
    icon: '/' + iconRel,
    version: manifest.version,
    zipUrl: '/' + zipRel,
    zipFolder: p.zip,
    size,
    updated: latest.toISOString().slice(0, 10),
    permissions
  });
  console.log(`✓ ${p.name} v${manifest.version} → ${zipRel} (${(size / 1024).toFixed(0)} KB, ${files.length} tệp)`);
}

const data = { categories: catalog.categories, products };
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log('✓ web/src/data/catalog.json');
