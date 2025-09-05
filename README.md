# SAB Lanyard

## 🏗️ Kiến trúc hệ thống

- **Backend**: ExpressJS, MongoDB, JWT, REST API, gửi email xác nhận, xuất Excel, bảo mật với Helmet, Rate Limit, CORS.
- **Frontend**: ReactJS, React Router, Context API, TailwindCSS, Toastify, SweetAlert2.
- **Triển khai**: Docker Compose, hỗ trợ phát triển trên Windows & Linux.

## 🚀 Tính năng

### Khách hàng
- Xem danh sách sản phẩm, giá, hình ảnh
- Thêm/bớt sản phẩm vào giỏ hàng
- Đặt hàng với thông tin sinh viên, email, ghi chú
- Theo dõi trạng thái đơn hàng

### Quản trị viên
- Quản lý sản phẩm, đơn hàng, seller
- Quản lý đơn đặt trước
- Thống kê doanh số, xuất dữ liệu

### Seller
- Quản lý đơn đặt trước
- Quản lý bán trực tiếp

## ⚙️ Cài đặt

### Yêu cầu
- Docker & Docker Compose
- Node.js 16+

### Khởi động nhanh
```bash
git clone <repository-url>
cd MiniPreorder
cp backend/.env.example backend/.env
# Cập nhật thông tin trong backend/.env
docker-compose up --build
```

Truy cập:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:3000/admin
- Seller Dashboard: http://localhost:3000/seller