const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

async function refresh() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const st = await chrome.runtime.sendMessage({ type: 'state', url: tab?.url ?? '', tabId: tab?.id });
  $('all').checked = !st.off;
  const usable = Boolean(st.host);
  $('main').hidden = !usable;
  $('empty').hidden = usable;
  if (!usable) return { tab, st };

  const active = !st.off && !st.allowed;
  $('host').textContent = st.host;
  $('favicon').src = tab?.favIconUrl || 'icon.png';
  $('count').textContent = active ? fmt(st.blocked) : '—';
  $('countLabel').textContent = st.off ? 'Đang tạm tắt chặn trên mọi trang' : st.allowed ? 'Không chặn trên trang này' : 'quảng cáo đã chặn trên trang này';
  $('countLabel').className = active ? '' : 'state';
  $('site').checked = !st.allowed;
  $('site').disabled = st.off;
  $('siteLabel').textContent = `Chặn trên ${st.host}`;

  // Số liệu đã lưu của trang (content script ghi, cộng dồn qua các lần mở).
  try {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => localStorage.getItem('veltrixAdblock') });
    const d = result ? JSON.parse(result) : null;
    $('total').textContent = fmt(Math.max(d?.total ?? 0, active ? st.blocked : 0));
    $('visits').textContent = fmt(d?.visits ?? 1);
  } catch { /* trang không cho đọc */ }
  return { tab, st };
}

$('site').onchange = async () => {
  const { tab, st } = await refresh();
  await chrome.runtime.sendMessage({ type: 'toggleSite', host: st.host });
  chrome.tabs.reload(tab.id);
  window.close();
};
$('all').onchange = async () => {
  const { tab } = await refresh();
  await chrome.runtime.sendMessage({ type: 'toggleAll' });
  if (tab?.id) chrome.tabs.reload(tab.id);
  window.close();
};
// Liên kết thương hiệu: mở tab mới (popup đóng ngay sau khi bấm).
$('store').onclick = (e) => { e.preventDefault(); chrome.tabs.create({ url: 'https://extension.veltrixhost.cloud' }); window.close(); };
refresh();
fetch(chrome.runtime.getURL('rules/info.json')).then((r) => r.json()).then((i) => {
  $('foot').textContent = `${fmt(i.rules)} luật · ${new Date(i.builtAt).toLocaleDateString('vi-VN')}`;
}).catch(() => {});
