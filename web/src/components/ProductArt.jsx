// Hình minh họa vẽ bằng SVG cho từng tiện ích (thay cho ảnh chụp màn hình).
// Chọn theo trường "art" trong products.json.
import { useId } from 'react';

function AdblockArt({ uid }) {
  return (
    <svg viewBox="0 0 400 250" className="art" role="img" aria-label="Trình duyệt với ô quảng cáo bị chặn">
      <defs>
        <linearGradient id={`${uid}-badge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`${uid}-img`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#a5f3fc" />
        </linearGradient>
        <filter id={`${uid}-sh`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity=".35" />
        </filter>
      </defs>
      <g filter={`url(#${uid}-sh)`}>
        <rect x="40" y="30" width="320" height="196" rx="14" fill="#fbfaff" />
      </g>
      <path d="M54 30h292a14 14 0 0 1 14 14v16H40V44a14 14 0 0 1 14-14Z" fill="#ebe8f7" />
      <circle cx="58" cy="45" r="4" fill="#f87171" />
      <circle cx="71" cy="45" r="4" fill="#fbbf24" />
      <circle cx="84" cy="45" r="4" fill="#34d399" />
      <rect x="104" y="37" width="180" height="16" rx="8" fill="#fff" />
      <rect x="114" y="43" width="70" height="4" rx="2" fill="#cfcae4" />

      <rect x="60" y="76" width="160" height="12" rx="6" fill="#2b2350" />
      <rect x="60" y="98" width="164" height="7" rx="3.5" fill="#dcd8ec" />
      <rect x="60" y="111" width="146" height="7" rx="3.5" fill="#dcd8ec" />
      <rect x="60" y="124" width="156" height="7" rx="3.5" fill="#dcd8ec" />
      <rect x="60" y="142" width="164" height="64" rx="9" fill={`url(#${uid}-img)`} />
      <path d="M72 198l26-26 18 16 22-24 30 34Z" fill="#fff" opacity=".55" />

      <rect x="242" y="76" width="100" height="130" rx="10" fill="#fff1f2" stroke="#fb7185" strokeWidth="2" strokeDasharray="6 5" />
      <text x="292" y="136" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fda4af" fontFamily="inherit">AD</text>
      <path d="M266 104l52 52M318 104l-52 52" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
      <text x="292" y="190" textAnchor="middle" fontSize="11" fontWeight="700" fill="#e11d48" fontFamily="inherit">Đã chặn</text>

      <g filter={`url(#${uid}-sh)`}>
        <circle cx="352" cy="36" r="27" fill={`url(#${uid}-badge)`} />
      </g>
      <path d="M352 22l-11 4v8c0 7 4.7 11.4 11 12.6 6.3-1.2 11-5.6 11-12.6v-8l-11-4Z" fill="#fff" />
      <path d="M347 34.5l3.5 3.5 6.5-7" stroke="#6d28d9" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="360" y="52" width="34" height="18" rx="9" fill="#ef4444" stroke="#fff" strokeWidth="2" />
      <text x="377" y="65" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="inherit">128</text>
    </svg>
  );
}

function AmbientArt({ uid }) {
  const scene = `url(#${uid}-scene)`;
  return (
    <svg viewBox="0 0 400 250" className="art" role="img" aria-label="Video YouTube với ánh sáng màu tỏa ra xung quanh">
      <defs>
        <linearGradient id={`${uid}-scene`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f97316" />
          <stop offset=".45" stopColor="#ec4899" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <clipPath id={`${uid}-clip`}>
          <rect x="96" y="58" width="208" height="117" rx="10" />
        </clipPath>
      </defs>

      <rect x="56" y="30" width="288" height="172" rx="30" fill={scene} filter={`url(#${uid}-blur)`} opacity=".95" />

      <g clipPath={`url(#${uid}-clip)`}>
        <rect x="96" y="58" width="208" height="117" fill={scene} />
        <circle cx="246" cy="100" r="15" fill="#fde68a" />
        <path d="M96 175l46-50 30 28 40-46 50 40 42-18v46Z" fill="#1e1b4b" opacity=".75" />
        <path d="M96 175l60-30 44 18 52-26 52 38Z" fill="#140f33" opacity=".85" />
        <rect x="108" y="160" width="184" height="3" rx="1.5" fill="#fff" opacity=".35" />
        <rect x="108" y="160" width="84" height="3" rx="1.5" fill="#fff" />
        <circle cx="192" cy="161.5" r="4.5" fill="#fff" />
      </g>
      <rect x="96" y="58" width="208" height="117" rx="10" fill="none" stroke="rgba(255,255,255,.25)" />

      <rect x="250" y="206" width="104" height="28" rx="14" fill="rgba(16,12,36,.88)" stroke="#a855f7" strokeOpacity=".7" />
      <circle cx="266" cy="220" r="4.5" fill="#10b981" />
      <text x="277" y="224" fontSize="11.5" fontWeight="700" fill="#fff" fontFamily="inherit">Veltrix ON</text>
      <rect x="132" y="206" width="104" height="28" rx="14" fill="rgba(16,12,36,.88)" stroke="#fbbf24" strokeOpacity=".7" />
      <text x="184" y="224" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fef3c7" fontFamily="inherit">★ Chất lượng 4K</text>
    </svg>
  );
}

function ThemeArt({ uid }) {
  return (
    <svg viewBox="0 0 400 250" className="art" role="img" aria-label="Ba cửa sổ trình duyệt với ba bảng màu giao diện khác nhau">
      <defs>
        <linearGradient id={`${uid}-acc1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${uid}-acc2`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id={`${uid}-acc3`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="1" stopColor="#db2777" />
        </linearGradient>
        <filter id={`${uid}-sh`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000" floodOpacity=".38" />
        </filter>
      </defs>

      {/* Cửa sổ 1 (trái sau): Đêm Xanh / Rừng Thông */}
      <g filter={`url(#${uid}-sh)`} transform="translate(34 26)">
        <rect width="196" height="126" rx="11" fill="#0b1220" stroke="#22304a" />
        <path d="M11 0h174a11 11 0 0 1 11 11v13H0V11A11 11 0 0 1 11 0Z" fill="#111a2e" />
        <circle cx="14" cy="12" r="3.2" fill="#f87171" />
        <circle cx="24" cy="12" r="3.2" fill="#fbbf24" />
        <circle cx="34" cy="12" r="3.2" fill="#34d399" />
        <rect x="48" y="7" width="96" height="10" rx="5" fill="#1a2640" />
        <rect x="14" y="36" width="110" height="62" rx="7" fill="#111a2e" />
        <rect x="22" y="86" width="64" height="4" rx="2" fill={`url(#${uid}-acc2)`} />
        <rect x="132" y="36" width="50" height="16" rx="5" fill="#1a2640" />
        <rect x="132" y="58" width="50" height="16" rx="5" fill="#1a2640" />
        <rect x="132" y="82" width="50" height="16" rx="8" fill={`url(#${uid}-acc2)`} />
        <rect x="14" y="106" width="84" height="7" rx="3.5" fill="#94a3b8" opacity=".5" />
      </g>

      {/* Cửa sổ 2 (phải giữa): Sakura Sáng */}
      <g filter={`url(#${uid}-sh)`} transform="translate(170 42)">
        <rect width="196" height="126" rx="11" fill="#fff6f9" stroke="#f3d2df" />
        <path d="M11 0h174a11 11 0 0 1 11 11v13H0V11A11 11 0 0 1 11 0Z" fill="#fde7ef" />
        <circle cx="14" cy="12" r="3.2" fill="#f87171" />
        <circle cx="24" cy="12" r="3.2" fill="#fbbf24" />
        <circle cx="34" cy="12" r="3.2" fill="#34d399" />
        <rect x="48" y="7" width="96" height="10" rx="5" fill="#ffffff" />
        <rect x="14" y="36" width="44" height="76" rx="7" fill="#ffffff" stroke="#f3d2df" />
        <rect x="66" y="36" width="116" height="42" rx="7" fill="#ffffff" stroke="#f3d2df" />
        <rect x="76" y="46" width="68" height="7" rx="3.5" fill="#2b1720" opacity=".75" />
        <rect x="76" y="60" width="46" height="10" rx="5" fill={`url(#${uid}-acc3)`} />
        <rect x="66" y="86" width="116" height="26" rx="7" fill="#fde7ef" />
      </g>

      {/* Cửa sổ 3 (chính giữa trước): Veltrix Tím */}
      <g filter={`url(#${uid}-sh)`} transform="translate(96 68)">
        <rect width="208" height="132" rx="12" fill="#120f24" stroke="#a78bfa" strokeOpacity=".65" strokeWidth="1.5" />
        <path d="M12 0h184a12 12 0 0 1 12 12v14H0V12A12 12 0 0 1 12 0Z" fill="#1b1733" />
        <circle cx="15" cy="13" r="3.5" fill="#f87171" />
        <circle cx="26" cy="13" r="3.5" fill="#fbbf24" />
        <circle cx="37" cy="13" r="3.5" fill="#34d399" />
        <rect x="52" y="8" width="108" height="10" rx="5" fill="#272050" />
        <rect x="16" y="38" width="118" height="64" rx="8" fill="#1b1733" stroke="#2d2752" />
        <circle cx="75" cy="66" r="13" fill={`url(#${uid}-acc1)`} />
        <path d="M72 60l9 6-9 6Z" fill="#fff" />
        <rect x="26" y="90" width="98" height="4" rx="2" fill="#272050" />
        <rect x="26" y="90" width="58" height="4" rx="2" fill="#a78bfa" />
        <rect x="142" y="38" width="50" height="20" rx="6" fill={`url(#${uid}-acc1)`} />
        <rect x="142" y="64" width="50" height="16" rx="5" fill="#1b1733" />
        <rect x="142" y="86" width="50" height="16" rx="5" fill="#1b1733" />
        <rect x="16" y="110" width="88" height="8" rx="4" fill="#ece9ff" opacity=".85" />
        <rect x="112" y="110" width="54" height="8" rx="4" fill="#a8a2cc" opacity=".5" />
      </g>

      {/* Dãy chấm màu bảng theme phía dưới */}
      <g filter={`url(#${uid}-sh)`}>
        <rect x="102" y="210" width="196" height="28" rx="14" fill="rgba(18,15,36,.92)" stroke="#2d2752" />
        {[
          '#a78bfa',
          '#22d3ee',
          '#4ade80',
          '#fb923c',
          '#e5e5e5',
          '#db2777',
          '#0d9488',
          '#b45309'
        ].map((color, i) => (
          <g key={color} transform={`translate(${122 + i * 22} 224)`}>
            <circle r="7" fill={color} />
            {i === 0 && <circle r="9.5" fill="none" stroke="#fff" strokeWidth="1.5" />}
          </g>
        ))}
      </g>
    </svg>
  );
}

function GuideArt() {
  const steps = ['Tải file .zip', 'Giải nén', 'Nạp vào trình duyệt'];
  return (
    <svg viewBox="0 0 400 250" className="art" role="img" aria-label="Ba bước cài tiện ích">
      {steps.map((s, i) => (
        <g key={s} transform={`translate(${70 + i * 14} ${44 + i * 58})`}>
          <rect width="250" height="46" rx="23" fill={i === 2 ? '#fff' : 'rgba(255,255,255,.12)'} stroke="rgba(255,255,255,.3)" />
          <circle cx="23" cy="23" r="15" fill={i === 2 ? '#6d28d9' : '#fff'} />
          <text x="23" y="28" textAnchor="middle" fontSize="15" fontWeight="800" fill={i === 2 ? '#fff' : '#2a1260'} fontFamily="inherit">{i + 1}</text>
          <text x="50" y="28.5" fontSize="15" fontWeight="700" fill={i === 2 ? '#2a1260' : '#fff'} fontFamily="inherit">{s}</text>
        </g>
      ))}
    </svg>
  );
}

const ARTS = { adblock: AdblockArt, ambient: AmbientArt, theme: ThemeArt, guide: GuideArt };

export default function ProductArt({ kind }) {
  // id riêng cho mỗi hình để gradient/filter không đụng nhau khi có nhiều hình trên trang
  const uid = 'art' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const Art = ARTS[kind];
  return Art ? <Art uid={uid} /> : null;
}
