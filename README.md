# Veltrix-extionsion

Veltrix Store — web tải tiện ích miễn phí cho Chrome & Edge (cài bằng file .zip). React + Vite.

## Chạy thử

```
npm install
npm run dev
```

## Cập nhật extension

File .zip trong `public/downloads/`, icon trong `public/icons/` và `src/data/catalog.json` được tạo từ thư mục `Products/` (nằm ngoài repo này) bằng:

```
npm run zips
```

Chạy lệnh này trên máy mỗi khi sửa extension hoặc `products.json`, rồi commit các file vừa tạo.

## Deploy lên Vercel

Import repo, Vercel tự nhận Vite: Build Command `npm run build`, Output `dist`. Đường dẫn con (`/tien-ich/...`) đã được cấu hình trong `vercel.json`.
