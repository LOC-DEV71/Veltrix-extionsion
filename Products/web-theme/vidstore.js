// Kho video nền: IndexedDB của extension. Video vài chục MB nên KHÔNG để trong chrome.storage (mỗi lần đổi cài đặt, mọi
// tab sẽ đọc lại cả video). Chỉ popup.js (lưu) và bg.js (phát) dùng, cả hai đều là trang của extension nên cùng kho.
(function (root) {
  const DB = 'veltrix-theme', STORE = 'media', KEY = 'bgVideo';
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => { db.close(); res(req?.result); };
      t.onerror = () => { db.close(); rej(t.error); };
    });
  };
  root.VeltrixVideo = {
    put: (blob) => tx('readwrite', (s) => s.put(blob, KEY)),
    get: () => tx('readonly', (s) => s.get(KEY)),
    clear: () => tx('readwrite', (s) => s.delete(KEY)),
  };
})(globalThis);
