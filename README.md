# Veltrix-extionsion

Veltrix Store — web tải tiện ích miễn phí cho Chrome & Edge (cài bằng file .zip).

## Cấu trúc

```
Products/           mã nguồn các extension (mỗi thư mục là một extension)
products.json       thông tin hiển thị trên web: tên, mô tả, tính năng, ảnh bìa
scripts/build.mjs   nén Products/* thành .zip + tạo dữ liệu cho web
web/                web React + Vite
```

## Chạy thử

```
cd web
npm install
npm run dev
```

`npm run dev` và `npm run build` tự chạy `scripts/build.mjs`: nén lại các file .zip, chép icon và lấy phiên bản từ `manifest.json`. Không cần nén tay.

## Thêm extension mới

1. Bỏ thư mục extension vào `Products/`.
2. Thêm một mục vào `products.json` (`folder`, `icon`, `zip`, `name`, mô tả…). Ảnh bìa 1600×1000 đặt ở `web/public/thumbs/` và ghi đường dẫn vào `cover`.
3. Commit và push — Vercel tự build lại.

## Deploy lên Vercel

- **Root Directory:** `web`
- **Framework:** Vite (Build Command `npm run build`, Output `dist`)
- Giữ bật “Include files outside the root directory in the Build Step” để script build đọc được `Products/`.
