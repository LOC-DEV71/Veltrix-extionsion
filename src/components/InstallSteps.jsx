import Icon from './Icon.jsx';
import { useToast } from './Toast.jsx';

export const BROWSERS = {
  chrome: { label: 'Chrome', url: 'chrome://extensions', dev: 'Developer mode', devVi: 'Chế độ nhà phát triển' },
  edge: { label: 'Edge', url: 'edge://extensions', dev: 'Developer mode', devVi: 'Chế độ dành cho nhà phát triển' }
};

export function CopyUrl({ text }) {
  const toast = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Đã copy ${text}. Dán vào thanh địa chỉ rồi nhấn Enter.`);
    } catch {
      toast(`Không copy được, hãy gõ tay: ${text}`);
    }
  }
  return (
    <button type="button" className="copy" onClick={copy} aria-label={`Copy ${text}`}>
      {text} <Icon name="copy" />
    </button>
  );
}

// Ảnh chụp thật (Chrome trên Windows). Bấm để xem ảnh lớn.
function Shot({ src, alt, wide }) {
  return (
    <a className={`shot${wide ? ' wide' : ''}`} href={src} target="_blank" rel="noopener">
      <img src={src} alt={alt} loading="lazy" />
    </a>
  );
}

// folder: tên thư mục sau khi giải nén (nếu đang ở trang một tiện ích cụ thể)
export default function InstallSteps({ browser, folder }) {
  const b = BROWSERS[browser];
  const shots = browser === 'chrome';
  const name = folder ? <code>{folder}</code> : 'vừa giải nén';
  return (
    <>
      {!shots && <p className="shots-note">Ảnh minh họa chụp trên Chrome. Trên Edge các nút và tên gọi gần giống, vị trí có khác đôi chút như ghi ở từng bước.</p>}
      <ol className="steps">
        <li>
          <div>
            <h4>Tải file .zip</h4>
            <p>Bấm nút <b>Tải .zip</b> ở trang tiện ích. File sẽ nằm trong thư mục <b>Downloads</b>.</p>
            {shots && <Shot src="/guide/1-tai-zip.webp" alt="Nút Tải .zip trên trang tiện ích" wide />}
          </div>
        </li>
        <li>
          <div>
            <h4>Giải nén</h4>
            <p>
              Chuột phải vào file vừa tải → <b>Extract All… / Giải nén tất cả</b> → bấm <b>Extract / Giải nén</b>.
              Bạn sẽ có thư mục {folder ? <code>{folder}</code> : 'cùng tên'}. Để thư mục ở chỗ cố định, <b>đừng xóa sau khi cài</b>.
            </p>
            {shots && (
              <div className="shot-row">
                <Shot src="/guide/2-extract-all.webp" alt="Menu chuột phải với mục Extract All" />
                <Shot src="/guide/3-extract-dialog.webp" alt="Hộp thoại giải nén, nút Extract" />
              </div>
            )}
          </div>
        </li>
        <li>
          <div>
            <h4>Mở trang Tiện ích của {b.label}</h4>
            <p>Trình duyệt không cho web mở trang này trực tiếp. Bấm để copy rồi dán vào thanh địa chỉ, nhấn Enter:</p>
            <CopyUrl text={b.url} />
          </div>
        </li>
        <li>
          <div>
            <h4>Bật {b.dev} / {b.devVi}</h4>
            <p>
              {browser === 'chrome'
                ? <>Công tắc ở <b>góc trên bên phải</b> trang.</>
                : <>Công tắc ở <b>thanh bên trái</b> trang (thu nhỏ cửa sổ thì nằm trong menu ☰).</>}
              {' '}<b>Giữ công tắc này luôn bật</b>: tắt đi thì trình duyệt sẽ tự tắt tiện ích.
            </p>
            {shots && <Shot src="/guide/4-developer-mode.webp" alt="Công tắc Developer mode ở góc trên bên phải" wide />}
          </div>
        </li>
        <li>
          <div>
            <h4>Bấm “Load unpacked / Tải tiện ích đã giải nén”</h4>
            <p>Nút này hiện ra ngay sau khi bật {b.dev}.</p>
            {shots && <Shot src="/guide/5-load-unpacked.webp" alt="Nút Load unpacked" />}
          </div>
        </li>
        <li>
          <div>
            <h4>Chọn thư mục {folder ? '' : 'vừa giải nén'}</h4>
            <p>
              Chọn thư mục {name} (thư mục có file <code>manifest.json</code> bên trong) rồi bấm <b>Select Folder / Chọn thư mục</b>.
              Tiện ích sẽ hiện ngay trong danh sách.
            </p>
            {shots && <Shot src="/guide/6-select-folder.webp" alt="Hộp thoại chọn thư mục tiện ích" wide />}
          </div>
        </li>
        <li>
          <div>
            <h4>Ghim lên thanh công cụ</h4>
            <p>Bấm biểu tượng mảnh ghép 🧩 cạnh thanh địa chỉ → bấm ghim cạnh tên tiện ích. Xong!</p>
          </div>
        </li>
      </ol>
    </>
  );
}
