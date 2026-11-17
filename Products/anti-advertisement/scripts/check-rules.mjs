// Nạp thử extension vào Edge chạy ngầm, đọc lỗi luật Chrome báo ("Rule with id N ..."), ghi dòng gốc của luật đó vào bad.json,
// dựng lại bộ luật, lặp tới khi Chrome nhận cả bộ. Chạy: node scripts/check-rules.mjs  (sau build-rules.mjs)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const badFile = path.join(ROOT, 'scripts', 'bad.json');

function loadError() {
  return new Promise((resolve) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-adcheck-'));
    const p = spawn(EDGE, ['--headless=new', `--user-data-dir=${dir}`, `--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`, '--enable-logging=stderr', '--v=0', 'about:blank']);
    let out = '';
    const done = (v) => { clearTimeout(timer); try { p.kill(); } catch { /* đã tắt */ } setTimeout(() => fs.rmSync(dir, { recursive: true, force: true }), 1500); resolve(v); };
    p.stderr.on('data', (d) => {
      out += d;
      const m = out.match(/(\w+)\.json: Rule with id (\d+)[^\n]*/);
      if (m) done({ file: m[1], id: Number(m[2]), text: m[0] });
      else if (/couldn't load the extension[^\n]*/i.test(out)) done({ id: 0, text: out.match(/couldn't load the extension[^\n]*/i)[0] });
    });
    const timer = setTimeout(() => done(null), 12000);
  });
}

for (let round = 1; round <= 200; round++) {
  const err = await loadError();
  if (!err) { console.log(`✓ Chrome nhận cả bộ luật (vòng ${round}).`); break; }
  if (!err.id) { console.log('Lỗi khác:', err.text); break; }
  const sources = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'sources.json'), 'utf8'));
  const line = sources[err.file][err.id - 1];
  const bad = fs.existsSync(badFile) ? JSON.parse(fs.readFileSync(badFile, 'utf8')) : [];
  bad.push(line);
  fs.writeFileSync(badFile, JSON.stringify(bad, null, 1));
  console.log(`vòng ${round}: bỏ luật ${err.id} "${line}" (${err.text.replace(/^.*Rule with id \d+ /, '')})`);
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-rules.mjs')], { stdio: 'ignore' });
}
