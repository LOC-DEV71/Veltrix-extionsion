import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import CategoryCards from '../components/CategoryCards.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Cover from '../components/Cover.jsx';
import Icon from '../components/Icon.jsx';
import { FAQ, PROMISES, REASONS } from '../content.js';
import { categoryOf, formatSize, glowOf, products } from '../data.js';

function Spotlight({ product, flip }) {
  return (
    <div className={`spot${flip ? ' flip' : ''}`} style={{ '--glow': glowOf(product) }}>
      <div className="spot-art"><Cover product={product} /></div>
      <div className="spot-text">
        <span className="kicker">{categoryOf(product.category)?.name}</span>
        <h3>{product.heroTitle}</h3>
        <p>{product.description[0]}</p>
        <ul className="ticks">
          {product.features.map((f) => <li key={f}><Icon name="check" />{f}</li>)}
        </ul>
        <div className="spot-actions">
          <a className="btn" href={product.zipUrl} download>
            <Icon name="download" /> Tải .zip <small>{formatSize(product.size)}</small>
          </a>
          <Link className="btn ghost" to={`/tien-ich/${product.id}`}>Xem chi tiết</Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      <ul className="promises">
        {PROMISES.map((p) => (
          <li key={p.title}>
            <i><Icon name={p.icon} /></i>
            <div><strong>{p.title}</strong><span>{p.text}</span></div>
          </li>
        ))}
      </ul>

      <section className="section">
        <div className="section-head">
          <h2>Danh mục</h2>
        </div>
        <CategoryCards />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Tiện ích nổi bật</h2>
            <p>Miễn phí, chạy trên Chrome và Edge</p>
          </div>
          <Link className="link" to="/tien-ich">Xem tất cả</Link>
        </div>
        <div className="grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Tìm hiểu kỹ hơn</h2>
            <p>Mỗi tiện ích làm gì, và làm tốt đến đâu</p>
          </div>
        </div>
        <div className="spots">
          {products.map((p, i) => <Spotlight key={p.id} product={p} flip={i % 2 === 1} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Vì sao chọn Veltrix</h2>
            <p>Tiện ích nhỏ gọn, minh bạch, làm cho người Việt</p>
          </div>
        </div>
        <div className="reasons">
          {REASONS.map((r) => (
            <div className="reason" key={r.title}>
              <i><Icon name={r.icon} /></i>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="howto">
          <div className="howto-text">
            <h2>Cài xong trong 1 phút</h2>
            <p>Không cần Chrome Web Store, không cần tài khoản. Làm một lần là quen.</p>
            <Link className="btn-outline" to="/huong-dan">Xem hướng dẫn chi tiết <Icon name="arrow" /></Link>
          </div>
          <ol className="howto-steps">
            <li><b>1</b><div><strong>Tải file .zip</strong><span>Bấm “Tải .zip” ở tiện ích bạn thích.</span></div></li>
            <li><b>2</b><div><strong>Giải nén</strong><span>Chuột phải → Giải nén tất cả.</span></div></li>
            <li><b>3</b><div><strong>Nạp vào trình duyệt</strong><span>Mở trang Tiện ích → Tải tiện ích đã giải nén.</span></div></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Câu hỏi thường gặp</h2>
          <Link className="link" to="/huong-dan#hoi-dap">Xem tất cả</Link>
        </div>
        <div className="faq">
          {FAQ.slice(0, 4).map((f) => (
            <details key={f.q}>
              <summary>{f.q}<Icon name="down" /></summary>
              <p>{f.a}</p>
              {f.img && <img className="faq-img" src={f.img} alt="" loading="lazy" />}
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
