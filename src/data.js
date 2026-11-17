import catalog from './data/catalog.json';

export const categories = catalog.categories;
export const products = catalog.products;

const GLOW = { privacy: '#7c3aed', video: '#ec4899', tools: '#06b6d4', look: '#22c55e' };

export const glowOf = (product) => GLOW[product.category] || '#7c3aed';
export const categoryOf = (id) => categories.find((c) => c.id === id);
export const findProduct = (id) => products.find((p) => p.id === id);

export function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export function searchProducts(query, category) {
  const q = fold(query.trim());
  return products.filter((p) => {
    if (category && p.category !== category) return false;
    if (!q) return true;
    const hay = fold([p.name, p.short, ...p.tags, ...p.features].join(' '));
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
}
