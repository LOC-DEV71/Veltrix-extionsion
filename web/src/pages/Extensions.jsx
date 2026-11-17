import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { categories, categoryOf, searchProducts } from '../data.js';

export default function Extensions() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const cat = params.get('cat') || '';
  const results = searchProducts(q, cat);

  function pick(id) {
    const next = new URLSearchParams(params);
    if (id) next.set('cat', id);
    else next.delete('cat');
    setParams(next, { replace: true });
  }

  const title = q ? `Kết quả cho “${q}”` : cat ? categoryOf(cat)?.name || 'Tiện ích' : 'Tất cả tiện ích';

  return (
    <section className="section" style={{ marginTop: 32 }}>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{results.length} tiện ích</p>

      <div className="chips" role="group" aria-label="Lọc theo danh mục">
        <button type="button" className="chip" aria-pressed={!cat} onClick={() => pick('')}>Tất cả</button>
        {categories.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => pick(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {results.length ? (
        <div className="grid">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="empty">
          <strong>{q ? 'Không tìm thấy tiện ích nào' : 'Danh mục này sắp có tiện ích'}</strong>
          {q ? 'Thử từ khóa khác, ví dụ “quảng cáo” hoặc “youtube”.' : 'Quay lại sau nhé!'}
        </div>
      )}
    </section>
  );
}
