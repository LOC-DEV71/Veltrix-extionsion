import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import InstallSteps, { BROWSERS } from '../components/InstallSteps.jsx';
import { FAQ } from '../content.js';

export default function Guide() {
  const [browser, setBrowser] = useState('chrome');
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <section className="section" style={{ marginTop: 32 }}>
        <h1 className="page-title">Cách cài tiện ích</h1>
        <p className="page-sub">Khoảng 1 phút, không cần tài khoản.</p>
        <div className="seg" role="group" aria-label="Chọn trình duyệt">
          {Object.entries(BROWSERS).map(([id, b]) => (
            <button key={id} type="button" aria-pressed={browser === id} onClick={() => setBrowser(id)}>{b.label}</button>
          ))}
        </div>
        <InstallSteps browser={browser} />
      </section>

      <section className="section">
        <div className="section-head"><h2>Cập nhật bản mới</h2></div>
        <ol className="steps">
          <li><div><h4>Tải file .zip bản mới</h4><p>Phiên bản hiện tại ghi ở trang từng tiện ích.</p></div></li>
          <li><div><h4>Giải nén đè lên thư mục cũ</h4><p>Chọn <b>Thay thế</b> khi được hỏi, để tiện ích giữ nguyên cài đặt của bạn.</p></div></li>
          <li><div><h4>Bấm nút tải lại ↻</h4><p>Ở thẻ của tiện ích trong trang <code>{BROWSERS[browser].url}</code>, rồi tải lại các tab đang mở.</p></div></li>
        </ol>
      </section>

      <section className="section" id="hoi-dap">
        <div className="section-head"><h2>Câu hỏi thường gặp</h2></div>
        <div className="faq">
          {FAQ.map((f) => (
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
