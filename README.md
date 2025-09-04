# Mini Preorder System

Hệ thống đặt hàng trước mini với ExpressJS, ReactJS, và MongoDB.

## Tính năng

### Khách hàng:
- Trang chủ hiển thị danh sách sản phẩm và giá
- Thêm/bớt sản phẩm vào giỏ hàng
- Xem tổng tiền và thanh toán
- Form đặt hàng: Mã số sinh viên, Họ tên, Email, Ghi chú
- Gửi email xác nhận đơn hàng tự động

### Quản trị viên:
- Đăng nhập dashboard tại `/dashboard`
- Xem danh sách đơn hàng
- Quản lý trạng thái đơn hàng (confirmed, paid, delivered, cancelled)
- Tìm kiếm và lọc đơn hàng
- Xuất Excel

## Cài đặt

### Yêu cầu
- Docker & Docker Compose
- Node.js 16+ (để phát triển)

### Chạy dự án

1. Clone repository:
```bash
git clone <repository-url>
cd MiniPreorder
```

2. Tạo file `.env` trong thư mục `backend`:
```bash
cp backend/.env.example backend/.env
```

3. Cập nhật thông tin email trong file `.env`

4. Chạy với Docker:
```bash
docker-compose up --build
```

5. Truy cập:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Dashboard: http://localhost:3000/dashboard

### Phát triển

Chạy trong môi trường phát triển:

1. Backend:
```bash
cd backend
npm install
npm run dev
```

2. Frontend:
```bash
cd frontend
npm install
npm start
```

## Thông tin đăng nhập Admin

- Username: `admin`
- Password: `admin123`

## API Endpoints

### Public
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/orders` - Tạo đơn hàng mới

### Admin
- `POST /api/admin/login` - Đăng nhập admin
- `GET /api/admin/orders` - Lấy danh sách đơn hàng
- `PUT /api/admin/orders/:id` - Cập nhật đơn hàng
- `GET /api/admin/orders/export` - Xuất Excel

## Cơ sở dữ liệu

MongoDB collections:
- `products` - Sản phẩm
- `orders` - Đơn hàng
- `admins` - Tài khoản quản trị

## License

MIT
