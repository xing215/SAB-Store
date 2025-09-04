import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { getCartItemCount, getCartTotal, formatCurrency } = useCart();

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [productsResponse, categoriesResponse] = await Promise.all([
          productService.getProducts({ available: true }),
          productService.getCategories()
        ]);
        
        if (productsResponse.success) {
          setProducts(productsResponse.data.products);
          setCategories(['all', ...productsResponse.data.categories]);
        }
        
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Group filtered products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  const cartItemCount = getCartItemCount();
  const cartTotal = getCartTotal();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-danger-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white rounded-2xl p-8 mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          🍕 Chào mừng đến với Mini Preorder
        </h1>
        <p className="text-lg md:text-xl opacity-90 mb-6">
          Đặt món ăn, thức uống yêu thích một cách nhanh chóng và tiện lợi
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <i className="fas fa-clock"></i>
            <span>Giao hàng nhanh</span>
          </div>
          <div className="flex items-center space-x-1">
            <i className="fas fa-shield-alt"></i>
            <span>An toàn</span>
          </div>
          <div className="flex items-center space-x-1">
            <i className="fas fa-heart"></i>
            <span>Chất lượng</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Tìm thấy {filteredProducts.length} sản phẩm
          {searchTerm && (
            <span> cho từ khóa "<strong>{searchTerm}</strong>"</span>
          )}
          {selectedCategory !== 'all' && (
            <span> trong danh mục "<strong>{selectedCategory}</strong>"</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-600 mb-4">
                Thử thay đổi từ khóa tìm kiếm hoặc danh mục
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="btn-primary"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {selectedCategory === 'all' ? (
                // Group by category
                Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <div key={category}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-lg mr-3">
                        {getCategoryIcon(category)}
                      </span>
                      {category}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({categoryProducts.length} món)
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {categoryProducts.map(product => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Single category view
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-lg mr-3">
                      {getCategoryIcon(selectedCategory)}
                    </span>
                    {selectedCategory}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredProducts.length} món)
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Cart />
            
            {/* Checkout Button */}
            {cartItemCount > 0 && (
              <div className="mt-6">
                <Link
                  to="/checkout"
                  className="btn-success w-full text-center block text-lg py-3"
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Thanh toán ({formatCurrency(cartTotal)})
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get category icons
const getCategoryIcon = (category) => {
  const icons = {
    'Đồ ăn': '🍽️',
    'Đồ uống': '🥤',
    'Tráng miệng': '🧁',
    'Khác': '📦'
  };
  return icons[category] || '📦';
};

export default HomePage;
