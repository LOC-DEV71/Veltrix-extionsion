import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { products } from './data.js';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Extensions from './pages/Extensions.jsx';
import Detail from './pages/Detail.jsx';
import Guide from './pages/Guide.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tien-ich" element={<Extensions />} />
          <Route path="/tien-ich/:id" element={<Detail />} />
          <Route path="/huong-dan" element={<Guide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand small"><img src="/logo.png" alt="" width="28" height="28" /><span>Veltrix Store</span></div>
            <p>Tiện ích miễn phí cho Chrome & Edge. Cài bằng file .zip, không cần tài khoản, không gửi dữ liệu của bạn đi đâu.</p>
          </div>
          <nav aria-label="Tiện ích">
            <h4>Tiện ích</h4>
            {products.map((p) => <Link key={p.id} to={`/tien-ich/${p.id}`}>{p.name}</Link>)}
            <Link to="/tien-ich">Tất cả tiện ích</Link>
          </nav>
          <nav aria-label="Hỗ trợ">
            <h4>Hỗ trợ</h4>
            <Link to="/huong-dan">Cách cài</Link>
            <Link to="/huong-dan#hoi-dap">Câu hỏi thường gặp</Link>
          </nav>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Veltrix Store · extension.veltrixhost.cloud</div>
      </footer>
    </>
  );
}
