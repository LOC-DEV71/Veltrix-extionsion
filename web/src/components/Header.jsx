import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from './Icon.jsx';

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(currentTheme);

  // Giữ ô tìm kiếm khớp với URL (vd khi bấm Back)
  useEffect(() => {
    setQuery(location.pathname === '/tien-ich' ? params.get('q') || '' : '');
  }, [location.pathname, params]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function search(value) {
    setQuery(value);
    const next = new URLSearchParams(location.pathname === '/tien-ich' ? params : undefined);
    if (value.trim()) next.set('q', value);
    else next.delete('q');
    const qs = next.toString();
    navigate(`/tien-ich${qs ? `?${qs}` : ''}`, { replace: location.pathname === '/tien-ich' });
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('veltrix-theme', next); } catch { /* bỏ qua */ }
    setTheme(next);
  }

  // Chỉ hàng logo + tìm kiếm + nút giao diện dính trên cùng; thanh tab cuộn đi theo trang.
  return (
    <>
    <header className={`topbar${scrolled ? ' scrolled' : ''}`}>
      <div className="topbar-row">
        <NavLink
          className="brand"
          to="/"
          onClick={() => {
            // Đang ở trang chủ thì URL không đổi nên ScrollToTop không chạy: tự cuộn lên
            if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img src="/logo.png" alt="" width="36" height="36" />
          <span>Veltrix Store</span>
        </NavLink>
        <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); search(query); }}>
          <Icon name="search" />
          <input
            type="search"
            placeholder="Tìm kiếm tiện ích"
            autoComplete="off"
            aria-label="Tìm kiếm tiện ích"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
        </form>
        <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
    <nav className="tabs" aria-label="Mục chính">
      <NavLink to="/" end>Khám phá</NavLink>
      <NavLink to="/tien-ich">Tiện ích</NavLink>
      <NavLink to="/huong-dan">Cách cài</NavLink>
    </nav>
    </>
  );
}
