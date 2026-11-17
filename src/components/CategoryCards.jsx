import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { categories, products } from '../data.js';

export default function CategoryCards() {
  return (
    <div className="cats">
      {categories.map((c) => {
        const n = products.filter((p) => p.category === c.id).length;
        return (
          <Link key={c.id} className={`cat tone-${c.tone}`} to={`/tien-ich?cat=${c.id}`}>
            <span>
              {c.name}
              <small>{n ? `${n} tiện ích` : 'Sắp ra mắt'}</small>
            </span>
            <i><Icon name={c.icon} /></i>
          </Link>
        );
      })}
    </div>
  );
}
