import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-shopping-cart text-primary-400"></i>
              <h3 className="text-xl font-bold">Mini Preorder</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Hệ thống đặt hàng trước nhanh chóng và tiện lợi. 
              Đặt món ăn, thức uống một cách dễ dàng.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên kết nhanh</h4>
            <div className="space-y-2">
              <Link 
                to="/" 
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Trang chủ
              </Link>
              <Link 
                to="/order-tracking" 
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Tra cứu đơn hàng
              </Link>
              <a 
                href="#contact" 
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Liên hệ
              </a>
              <a 
                href="#about" 
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Về chúng tôi
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Thông tin liên hệ</h4>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2">
                <i className="fas fa-phone text-primary-400"></i>
                <span>0123 456 789</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-envelope text-primary-400"></i>
                <span>support@minipreorder.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-map-marker-alt text-primary-400"></i>
                <span>Địa chỉ của bạn</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock text-primary-400"></i>
                <span>Thứ 2 - Chủ nhật: 7:00 - 22:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Mini Preorder System. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
