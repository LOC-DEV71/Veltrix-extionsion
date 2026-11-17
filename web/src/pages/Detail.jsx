import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import InstallSteps from '../components/InstallSteps.jsx';
import Cover from '../components/Cover.jsx';
import { useToast } from '../components/Toast.jsx';
import { categoryOf, findProduct, formatDate, formatSize, glowOf } from '../data.js';
import NotFound from './NotFound.jsx';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'permissions', label: 'Quyền truy cập' },
  { id: 'install', label: 'Cách cài' }
];

export default function Detail() {
  const { id } = useParams();
  const product = findProduct(id);
  const [tab, setTab] = useState('overview');
  const [browser, setBrowser] = useState('chrome');
  const toast = useToast();

  if (!product) return <NotFound />;
  const cat = categoryOf(product.category);

  function onDownload() {
    toast('Đang tải… Xem tab “Cách cài” để cài vào trình duyệt.');
    setTab('install');
  }

  return (
    <article>
      <Link className="crumb" to="/tien-ich"><Icon name="back" />Tất cả tiện ích</Link>

      <div className="detail-head">
        <img src={product.icon} alt="" />
        <div className="detail-title">
          <h1>{product.name}</h1>
          <div className="by">
            <span>Phát triển bởi <Link to="/">Veltrix Store</Link></span>
            <span className="pill">{cat?.name}</span>
            <span className="pill">v{product.version}</span>
          </div>
        </div>
        <a className="btn" href={product.zipUrl} download onClick={onDownload}>
          <Icon name="download" /> Tải .zip <small>{formatSize(product.size)}</small>
        </a>
      </div>

      <div className="detail-banner" style={{ '--glow': glowOf(product) }}>
        <Cover product={product} eager />
      </div>

      <div className="detail-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="detail-body">
        <div className="prose" role="tabpanel">
          {tab === 'overview' && (
            <>
              <h3>Tổng quan</h3>
              {product.description.map((para, i) => <p key={i}>{para}</p>)}
              <h3>Tính năng</h3>
              <ul className="ticks">
                {product.features.map((f) => <li key={f}><Icon name="check" />{f}</li>)}
              </ul>
              {product.notes?.length > 0 && (
                <>
                  <h3>Lưu ý</h3>
                  <ul className="ticks warn">
                    {product.notes.map((n) => <li key={n}><Icon name="alert" />{n}</li>)}
                  </ul>
                </>
              )}
            </>
          )}

          {tab === 'permissions' && (
            <>
              <h3>Tiện ích này có thể</h3>
              <ul className="ticks perm">
                {product.permissions.map((p) => <li key={p}><Icon name="key" />{p}</li>)}
              </ul>
              <p style={{ marginTop: 20, color: 'var(--muted)' }}>
                Trình duyệt sẽ hiện danh sách quyền này khi bạn cài. Mã nguồn nằm ngay trong file .zip, bạn có thể mở ra xem.
              </p>
            </>
          )}

          {tab === 'install' && (
            <>
              <div className="seg" role="group" aria-label="Chọn trình duyệt">
                {['chrome', 'edge'].map((b) => (
                  <button key={b} type="button" aria-pressed={browser === b} onClick={() => setBrowser(b)}>
                    {b === 'chrome' ? 'Chrome' : 'Edge'}
                  </button>
                ))}
              </div>
              <InstallSteps browser={browser} folder={product.zipFolder} />
              <p style={{ marginTop: 20 }}>
                Gặp lỗi? Xem <Link className="link" to="/huong-dan#hoi-dap">câu hỏi thường gặp</Link>.
              </p>
            </>
          )}
        </div>

        <aside className="info">
          <h3>Thông tin</h3>
          <dl>
            <div><dt>Phiên bản</dt><dd>{product.version}</dd></div>
            <div><dt>Cập nhật</dt><dd>{formatDate(product.updated)}</dd></div>
            <div><dt>Dung lượng</dt><dd>{formatSize(product.size)}</dd></div>
            <div><dt>Trình duyệt</dt><dd>Chrome, Edge (bản mới)</dd></div>
            <div><dt>Ngôn ngữ</dt><dd>Tiếng Việt</dd></div>
            <div><dt>Giá</dt><dd>Miễn phí</dd></div>
          </dl>
        </aside>
      </div>
    </article>
  );
}
