# SAB Lanyard

## 🏗️ Kiến trúc hệ thống

- **Backend**: ExpressJS, MongoDB, Better-Auth v2, REST API, gửi email xác nhận, xuất Excel, bảo mật với Helmet, Rate Limit, CORS.
- **Frontend**: ReactJS, React Router v6, Context API, TailwindCSS, React Toastify, SweetAlert2.
- **Authentication**: Better-Auth với username/password, session management, role-based access control, admin plugin.
- **Triển khai**: Docker Compose với `compose.yml`, hỗ trợ phát triển trên Windows & Linux.

## 🚀 Tính năng

### Khách hàng
- Xem danh sách sản phẩm với giá, hình ảnh chi tiết
- Thêm/bớt sản phẩm vào giỏ hàng với số lượng tuỳ chỉnh
- Đặt hàng với thông tin sinh viên, email, ghi chú đặc biệt
- Theo dõi trạng thái đơn hàng theo mã tracking

### Quản trị viên (Admin)
- **Dashboard**: Thống kê doanh số, đơn hàng, sản phẩm bán chạy
- **Quản lý sản phẩm**: CRUD sản phẩm, quản lý kho, giá, hình ảnh
- **Quản lý sellers**: Tạo/sửa/xoá tài khoản seller, phân quyền
- **Quản lý đơn hàng**: Xem, cập nhật trạng thái, xuất Excel
- **Bán hàng trực tiếp**: POS system cho bán tại quầy

### Sellers
- **Dashboard**: Thống kê đơn hàng của seller
- **Quản lý đơn đặt trước**: Xác nhận, cập nhật trạng thái đơn hàng
- **Bán hàng trực tiếp**: Tạo đơn hàng tại quầy

## 🔐 Hệ thống xác thực (Better-Auth)

### Đăng nhập thống nhất
- **URL duy nhất**: `/login` - Tự động redirect theo role
- **Admin login**: Sau khi đăng nhập → `/admin/dashboard`
- **Seller login**: Sau khi đăng nhập → `/seller/dashboard`
- **Customer**: Không yêu cầu đăng nhập

### Better-Auth API Endpoints

#### Authentication Core
- `POST /api/auth/sign-in/username` - Đăng nhập với username/password
- `POST /api/auth/sign-out` - Đăng xuất
- `GET /api/auth/get-session` - Lấy thông tin session
- `POST /api/auth/update-user` - Cập nhật thông tin user

#### Admin Plugin (User Management)
- `GET /api/auth/admin/list-users` - Danh sách users/sellers
- `POST /api/auth/admin/create-user` - Tạo user mới (role: seller)
- `POST /api/auth/admin/set-role` - Cập nhật role user
- `POST /api/auth/admin/set-user-password` - Đổi password user
- `POST /api/auth/admin/remove-user` - Xoá user
- `POST /api/auth/admin/ban-user` - Ban user
- `POST /api/auth/admin/unban-user` - Unban user

> **Lưu ý**: Các endpoint user management tự động thay thế các API seller management cũ

## ⚙️ Cài đặt

### Yêu cầu hệ thống
- **Docker** & **Docker Compose** (khuyên dùng Docker Desktop)
- **Node.js 18+** (để development)
- **MongoDB** (tự động cài qua Docker)

### Khởi động nhanh với Docker
```bash
# Clone repository
git clone <repository-url>
cd SAB-Lanyard

# Cấu hình environment variables
cp backend/.env.example backend/.env
# Chỉnh sửa backend/.env theo môi trường của bạn

# Khởi động toàn bộ stack
docker-compose up --build

# Hoặc chạy background
docker-compose up -d --build
```

### Development Setup (Local)
```bash
# Backend setup
cd backend
npm install
npm run dev    # Port 5000

# Frontend setup (terminal mới)
cd frontend
npm install
npm start      # Port 3000
```

## 🌐 URLs truy cập

### Production URLs
- **Trang chủ**: http://localhost:3000
- **Đăng nhập**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Seller Dashboard**: http://localhost:3000/seller/dashboard

### Backend APIs
- **API Base**: http://localhost:5000/api
- **Better-Auth**: http://localhost:5000/api/auth/*
- **Products API**: http://localhost:5000/api/products
- **Orders API**: http://localhost:5000/api/orders

## 📝 Better-Auth Documentation

Better-Auth cung cấp OpenAPI documentation tự động tại:
- **API Docs**: http://localhost:5000/api/auth/reference
- **Admin API Docs**: Endpoints dạng `/api/auth/admin/*`

### Ví dụ sử dụng Admin Plugin
```javascript
// Frontend - Lấy danh sách sellers
const { data: sellers } = await authClient.admin.listUsers({
  filterField: 'role',
  filterValue: 'seller'
});

// Frontend - Tạo seller mới
const { error } = await authClient.admin.createUser({
  email: 'seller@example.com',
  password: 'password123',
  name: 'Tên Seller',
  role: 'seller',
  data: { username: 'seller_username' }
});
```

## 🔧 Cấu hình môi trường

### Backend Environment (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/sab-lanyard
DB_NAME=sab_lanyard

# Better-Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:5000

# Email (tuỳ chọn)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Other configs
PORT=5000
NODE_ENV=development
```

### Frontend Environment (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🐳 Docker Configuration

Hệ thống sử dụng `compose.yml` (Docker Compose v2) với các services:

- **mongodb**: Database chính
- **backend**: ExpressJS API server
- **frontend**: React development server hoặc production build

```yaml
# Ví dụ compose.yml structure
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    
  backend:
    build: ./backend
    ports: ["5000:5000"]
    depends_on: [mongodb]
    
  frontend:
    build: ./frontend  
    ports: ["3000:3000"]
    depends_on: [backend]
```

## 🧪 Testing & Validation

### Kiểm tra syntax
```bash
# Backend
cd backend && npm run lint

# Frontend  
cd frontend && npm run lint
```

### Kiểm tra Better-Auth integration
1. Truy cập `/login` và đăng nhập với admin account
2. Kiểm tra redirect tự động đến admin dashboard
3. Thử các chức năng quản lý seller qua Admin Plugin
4. Kiểm tra session management và logout

## 📊 Monitoring & Logs

### Development Logs
```bash
# Xem logs tất cả services
docker-compose logs -f

# Chỉ xem logs backend
docker-compose logs -f backend

# Chỉ xem logs database
docker-compose logs -f mongodb
```

### Production Monitoring
- Backend logs tự động ghi vào `logs/` directory
- Better-Auth session management tự động
- Database connection status qua health endpoints

## 🚀 Deployment

### Production với Docker
```bash
# Build production images
docker-compose -f compose.prod.yml build

# Deploy với production config
docker-compose -f compose.prod.yml up -d
```

### Environment Variables cho Production
- Cập nhật `BETTER_AUTH_URL` với domain thật
- Sử dụng strong secret key cho `BETTER_AUTH_SECRET`
- Cấu hình email service cho notifications
- Enable HTTPS và cập nhật CORS settings

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit changes với convention: `feat(scope): description`
4. Push branch và tạo Pull Request
5. Đảm bảo tất cả tests pass trước khi merge

## 📞 Support

- **Issues**: Tạo GitHub Issues cho bugs/features
- **Documentation**: Xem Better-Auth docs tại `/api/auth/reference`
- **API Reference**: OpenAPI spec tự động generate