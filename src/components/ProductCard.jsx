import { Link } from 'react-router-dom';
import Cover from './Cover.jsx';
import { categoryOf, formatSize, glowOf } from '../data.js';

export default function ProductCard({ product }) {
  const cat = categoryOf(product.category);
  return (
    <Link className="card" to={`/tien-ich/${product.id}`}>
      <div className="card-cover" style={{ '--glow': glowOf(product) }}>
        <Cover product={product} />
      </div>
      <div className="card-meta">
        <img src={product.icon} alt="" />
        <div>
          <h3>{product.name}</h3>
          <p>{product.short}</p>
          <p className="sub">{cat?.name} · v{product.version} · {formatSize(product.size)}</p>
        </div>
      </div>
    </Link>
  );
}
