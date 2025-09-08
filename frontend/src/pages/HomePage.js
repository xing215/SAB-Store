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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { getCartItemCount, getCartTotal, formatCurrency } = useCart();

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productsResponse = await productService.getProducts({ available: true });
        
        if (productsResponse.success) {
          setProducts(productsResponse.data.products);
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="xl:col-span-2">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có sản phẩm
              </h3>
              <p className="text-gray-600 mb-4">
                Hiện tại chưa có sản phẩm nào được bán
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Sidebar - Increased width */}
        <div className="xl:col-span-1" id='cart-sidebar'>
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
                  Xác nhận ({formatCurrency(cartTotal)})
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
