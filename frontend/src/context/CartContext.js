import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';

// Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.LOAD_CART:
      return action.payload;

    case CART_ACTIONS.ADD_ITEM: {
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }]
        };
      }
    }

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload)
      };

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.productId !== productId)
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        )
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return {
        items: []
      };

    default:
      return state;
  }
};

// Initial Cart State
const initialCartState = {
  items: []
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('minipreorder_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('minipreorder_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('minipreorder_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart Actions
  const addToCart = (product) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: {
        productId: product._id,
        productName: product.name,
        price: product.price,
        image: product.image
      }
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`, {
      position: "bottom-right",
      autoClose: 2000
    });
  };

  const removeFromCart = (productId) => {
    const item = cart.items.find(item => item.productId === productId);
    if (item) {
      dispatch({
        type: CART_ACTIONS.REMOVE_ITEM,
        payload: productId
      });
      toast.info(`Đã xóa "${item.productName}" khỏi giỏ hàng`, {
        position: "bottom-right",
        autoClose: 2000
      });
    }
  };

  const updateQuantity = (productId, quantity) => {
    const item = cart.items.find(item => item.productId === productId);
    
    if (quantity <= 0) {
      if (item) {
        removeFromCart(productId);
      }
      return;
    }

    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { productId, quantity }
    });
  };

  const increaseQuantity = (productId) => {
    const item = cart.items.find(item => item.productId === productId);
    if (item && item.quantity < 99) { // Maximum quantity limit
      updateQuantity(productId, item.quantity + 1);
    }
  };

  const decreaseQuantity = (productId) => {
    const item = cart.items.find(item => item.productId === productId);
    if (item) {
      updateQuantity(productId, item.quantity - 1);
    }
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // Cart Calculations
  const getCartTotal = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getItemQuantity = (productId) => {
    const item = cart.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId) => {
    return cart.items.some(item => item.productId === productId);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getItemQuantity,
    isInCart,
    formatCurrency
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook to use Cart Context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
