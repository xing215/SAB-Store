# SAB Lanyard - Project Overview

## Purpose
SAB Lanyard là hệ thống quản lý đơn hàng lanyard cho sinh viên với các tính năng:
- Đặt hàng trực tuyến cho khách hàng
- POS system cho bán hàng trực tiếp tại quầy
- Quản lý đơn hàng, sản phẩm, sellers
- Dashboard thống kê cho admin và seller
- Tích hợp VietQR cho thanh toán

## Tech Stack

### Backend
- **Framework**: Express.js v4.18.2
- **Database**: MongoDB với Mongoose v8.0.0
- **Authentication**: Better-Auth v1.0.0 (username/password, session, RBAC)
- **Security**: Helmet, CORS, Express Rate Limit
- **File Upload**: Multer
- **Export**: ExcelJS
- **Email**: Nodemailer

### Frontend
- **Framework**: React v19.1.1
- **Routing**: React Router v7.8.2
- **State Management**: Context API
- **Styling**: TailwindCSS v3.3.0
- **UI Components**: React Toastify, SweetAlert2
- **HTTP Client**: Axios v1.11.0

### Development
- **Node.js**: 18+
- **Package Manager**: npm/yarn (check lock files)
- **Containerization**: Docker & Docker Compose
- **File Encoding**: UTF-8

## Project Structure
```
SAB-Lanyard/
├── backend/          # Express API server
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── middleware/   # Express middleware
│   ├── services/     # Business logic
│   ├── utils/        # Helper functions
│   └── lib/          # Core libraries (auth, database)
├── frontend/         # React application
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── context/     # Context providers
│       ├── services/    # API services
│       ├── utils/       # Utility functions
│       └── lib/         # Libraries
└── uploads/          # Static file uploads
```

## Key Features
1. **Customer**: Browse products, add to cart, checkout, track orders
2. **Admin**: Dashboard, product/seller/order management, POS system
3. **Seller**: Dashboard, order management, direct sales
4. **Authentication**: Better-Auth with role-based access (admin/seller)
5. **Payment**: VietQR integration for bank transfers
