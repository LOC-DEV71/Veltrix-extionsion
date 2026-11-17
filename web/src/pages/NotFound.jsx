import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty" style={{ marginTop: 48 }}>
      <strong>Không tìm thấy trang này</strong>
      <Link className="link" to="/">Về trang chủ</Link>
    </div>
  );
}
