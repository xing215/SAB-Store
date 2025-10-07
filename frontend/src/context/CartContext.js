import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
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
	const [comboDetection, setComboDetection] = useState({
		hasCombo: false,
		combo: null,
		savings: 0,
		message: null,
		isChecking: false,
		optimalPricing: null
	});

	// Store previous combo state for comparison
	const [previousComboState, setPreviousComboState] = useState({
		hasCombo: false,
		comboIds: [],
		totalSavings: 0
	});

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

		// Check for combos when cart changes
		if (cart.items.length > 0) {
			checkForCombos();
		} else {
			setComboDetection({
				hasCombo: false,
				combo: null,
				savings: 0,
				message: null,
				isChecking: false,
				optimalPricing: null
			});

			// Reset previous combo state when cart is empty
			setPreviousComboState({
				hasCombo: false,
				comboIds: [],
				totalSavings: 0
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cart]);

	// Helper function to compare combo states
	const hasComboChanged = (newComboData, previousState) => {
		// If no combo now and no combo before = no change
		if (!newComboData.hasCombo && !previousState.hasCombo) {
			return false;
		}

		// If combo status changed (had combo -> no combo, or no combo -> has combo)
		if (newComboData.hasCombo !== previousState.hasCombo) {
			return true;
		}

		// If both have combos, check if savings amount changed significantly
		if (newComboData.hasCombo && previousState.hasCombo) {
			const savingsDiff = Math.abs(newComboData.savings - previousState.totalSavings);
			// Only consider it changed if savings difference is more than 1000 VND
			return savingsDiff > 1000;
		}

		return false;
	};

	// Check for applicable combos and calculate optimal pricing
	const checkForCombos = useCallback(async () => {
		if (cart.items.length === 0) return;

		setComboDetection(prev => ({ ...prev, isChecking: true }));

		try {
			const items = cart.items.map(item => ({
				productId: item.productId,
				quantity: item.quantity
			}));

			// Use the new pricing endpoint for optimal calculations
			const response = await fetch('/api/combos/pricing', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ items }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('Pricing API error:', response.status, errorData);
				throw new Error(errorData.message || `Server error: ${response.status}`);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.message || 'Failed to calculate pricing');
			}

			const newComboData = {
				hasCombo: result.success && result.data.summary.totalSavings > 0,
				savings: result.success ? result.data.summary.totalSavings : 0,
				combos: result.success ? result.data.combos : []
			};

			// Check if combo state has actually changed
			const comboHasChanged = hasComboChanged(newComboData, previousComboState);

			if (newComboData.hasCombo) {
				setComboDetection({
					hasCombo: true,
					combo: newComboData.combos.length > 0 ? newComboData.combos[0] : null,
					savings: newComboData.savings,
					message: `Tiết kiệm ${formatCurrency(newComboData.savings)} với combo tối ưu`,
					isChecking: false,
					optimalPricing: result.data
				});

				// Only show toast notification if combo state has changed
				if (comboHasChanged) {
					toast.info(
						`Đã tối ưu giá với combo! Tiết kiệm ${formatCurrency(newComboData.savings)}`,
						{
							position: "bottom-right",
							autoClose: 5000,
							hideProgressBar: false,
							closeOnClick: true,
							pauseOnHover: true,
						}
					);
				}

				// Update previous combo state
				setPreviousComboState({
					hasCombo: true,
					comboIds: newComboData.combos.map(combo => combo._id || combo.id),
					totalSavings: newComboData.savings
				});
			} else {
				setComboDetection({
					hasCombo: false,
					combo: null,
					savings: 0,
					message: null,
					isChecking: false,
					optimalPricing: result.success ? result.data : null
				});

				// Update previous combo state
				setPreviousComboState({
					hasCombo: false,
					comboIds: [],
					totalSavings: 0
				});
			}
		} catch (error) {
			console.error('Combo detection error:', error.message || error);
			setComboDetection({
				hasCombo: false,
				combo: null,
				savings: 0,
				message: null,
				isChecking: false,
				optimalPricing: null
			});

			// Reset previous combo state on error
			setPreviousComboState({
				hasCombo: false,
				comboIds: [],
				totalSavings: 0
			});
		}
	}, [cart, previousComboState]);

	// Cart Actions
	const addToCart = (product) => {
		dispatch({
			type: CART_ACTIONS.ADD_ITEM,
			payload: {
				productId: product._id,
				productName: product.name,
				price: product.price,
				image: product.imageUrl
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
		// Use optimal pricing if available
		if (comboDetection.optimalPricing) {
			return comboDetection.optimalPricing.summary.finalTotal;
		}

		// Fallback to base total from individual items
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

	// Get pricing breakdown for display
	const getPricingBreakdown = () => {
		if (comboDetection.optimalPricing) {
			return comboDetection.optimalPricing;
		}

		// Return basic breakdown if no optimal pricing
		const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
		return {
			summary: {
				originalTotal: total,
				finalTotal: total,
				totalSavings: 0,
				savingsPercentage: '0'
			},
			combos: [],
			individualItems: cart.items.map(item => ({
				productId: item.productId,
				productName: item.productName,
				price: item.price,
				quantity: item.quantity,
				subtotal: item.price * item.quantity
			})),
			breakdown: [{
				type: 'individual',
				items: cart.items.map(item => ({
					productId: item.productId,
					productName: item.productName,
					price: item.price,
					quantity: item.quantity,
					subtotal: item.price * item.quantity
				})),
				totalPrice: total
			}]
		};
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
		formatCurrency,
		comboDetection,
		checkForCombos,
		getPricingBreakdown
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
