import ProductArt from './ProductArt.jsx';

// Ảnh bìa của tiện ích: dùng ảnh thật (trường "cover" trong products.json) nếu có,
// chưa có thì vẽ hình minh họa SVG.
export default function Cover({ product, eager }) {
  if (product.cover) {
    return <img className="cover-img" src={product.cover} alt="" loading={eager ? 'eager' : 'lazy'} />;
  }
  return <ProductArt kind={product.art} />;
}
