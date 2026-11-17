import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import ProductArt from './ProductArt.jsx';
import Cover from './Cover.jsx';
import { glowOf, products } from '../data.js';

export default function Hero() {
  const slides = [
    ...products.filter((p) => p.featured).map((p) => ({
      key: p.id,
      product: p,
      glow: glowOf(p),
      eyebrow: p.name,
      title: p.heroTitle || p.name,
      text: p.heroText || p.short,
      cta: 'Xem tiện ích',
      to: `/tien-ich/${p.id}`
    })),
    {
      key: 'guide',
      art: 'guide',
      glow: '#06b6d4',
      eyebrow: 'Hướng dẫn',
      title: 'Cài tiện ích trong 1 phút',
      text: 'Không cần tài khoản. Tải file .zip, giải nén rồi nạp vào Chrome hoặc Edge.',
      cta: 'Xem hướng dẫn',
      to: '/huong-dan'
    }
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const count = slides.length;
  const go = useCallback((step) => setIndex((i) => (i + step + count) % count), [count]);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [paused, go, index]);

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Tiện ích nổi bật">
      {slides.map((s, i) => (
        <div
          key={s.key}
          className={`slide${i === index ? ' active' : ''}`}
          aria-hidden={i !== index}
          aria-roledescription="slide"
          style={{ '--glow': s.glow }}
        >
          <div className="slide-art">{s.product ? <Cover product={s.product} eager /> : <ProductArt kind={s.art} />}</div>
          <div className="slide-text">
            <span className="eyebrow">{s.eyebrow}</span>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            <Link className="btn-outline" to={s.to} tabIndex={i === index ? 0 : -1}>{s.cta}</Link>
          </div>
        </div>
      ))}
      <div className="hero-ctrl">
        <button type="button" onClick={() => go(-1)} aria-label="Slide trước"><Icon name="left" /></button>
        <span className="count">{index + 1} / {count}</span>
        <button type="button" onClick={() => go(1)} aria-label="Slide sau"><Icon name="right" /></button>
        <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Tự chạy' : 'Tạm dừng'}>
          <Icon name={paused ? 'resume' : 'pause'} />
        </button>
      </div>
    </section>
  );
}
