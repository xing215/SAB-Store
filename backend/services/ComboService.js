const Combo = require('../models/Combo');
const Product = require('../models/Product');

/**
 * Service for handling combo logic
 */
class ComboService {
	/**
	 * Detect and apply best combo to cart items
	 * @param {Array} items - Array of { productId, quantity }
	 * @param {boolean} silent - Whether to apply silently without warnings
	 * @returns {Object} Result with applied combo info
	 */
	static async detectAndApplyBestCombo(items, silent = false) {
		try {
			if (!items || !Array.isArray(items) || items.length === 0) {
				return {
					success: true,
					hasCombo: false,
					originalItems: items,
					finalItems: items,
					message: null
				};
			}

			// Get product details for all items
			const productIds = items.map(item => item.productId);
			const products = await Product.find({ _id: { $in: productIds } });

			// Create products with quantities
			const productsWithQuantities = items.map(item => {
				const product = products.find(p => p._id.toString() === item.productId);
				return {
					product,
					quantity: item.quantity,
					originalItem: item
				};
			}).filter(item => item.product); // Remove items where product not found

			// Get active combos sorted by priority
			const combos = await Combo.findActive();

			// Find the best applicable combo
			let bestCombo = null;
			let maxSavings = 0;

			for (const combo of combos) {
				if (combo.canApplyToProducts(productsWithQuantities)) {
					const savings = combo.calculateSavings(productsWithQuantities);
					if (savings > maxSavings) {
						maxSavings = savings;
						bestCombo = combo;
					}
				}
			}

			// If no beneficial combo found, return original items
			if (!bestCombo || maxSavings <= 0) {
				return {
					success: true,
					hasCombo: false,
					originalItems: items,
					finalItems: items,
					message: null
				};
			}

			// Apply the best combo
			const comboApplication = this.applyComboToItems(bestCombo, productsWithQuantities);

			return {
				success: true,
				hasCombo: true,
				combo: bestCombo,
				savings: maxSavings,
				originalItems: items,
				finalItems: comboApplication.finalItems,
				remainingItems: comboApplication.remainingItems,
				message: silent ? null : `Đã tự động chuyển sang combo "${bestCombo.name}" vì rẻ hơn ${this.formatCurrency(maxSavings)}. Vui lòng kiểm tra đơn hàng.`
			};

		} catch (error) {
			console.error('Combo detection error:', error);
			return {
				success: false,
				error: error.message,
				hasCombo: false,
				originalItems: items,
				finalItems: items
			};
		}
	}

	/**
	 * Apply combo to cart items
	 * @param {Object} combo - The combo to apply
	 * @param {Array} productsWithQuantities - Products with quantities
	 * @returns {Object} Application result
	 */
	static applyComboToItems(combo, productsWithQuantities) {
		const finalItems = [];
		const remainingItems = [];
		const usedProducts = new Map();

		// Track how many of each category we need for the combo
		const categoryNeeds = new Map();
		combo.categoryRequirements.forEach(req => {
			categoryNeeds.set(req.category, req.quantity);
		});

		// Collect products by category
		const productsByCategory = new Map();
		productsWithQuantities.forEach(item => {
			const category = item.product.category;
			if (!productsByCategory.has(category)) {
				productsByCategory.set(category, []);
			}
			productsByCategory.get(category).push(item);
		});

		// Apply combo - select products for combo
		const comboProducts = [];
		for (const [category, requiredQuantity] of categoryNeeds) {
			const categoryProducts = productsByCategory.get(category) || [];
			let selectedQuantity = 0;

			for (const item of categoryProducts) {
				const availableQuantity = item.quantity - (usedProducts.get(item.product._id.toString()) || 0);
				const neededQuantity = Math.min(availableQuantity, requiredQuantity - selectedQuantity);

				if (neededQuantity > 0) {
					comboProducts.push({
						productId: item.product._id,
						productName: item.product.name,
						price: item.product.price,
						quantity: neededQuantity,
						isComboItem: true,
						comboId: combo._id,
						comboName: combo.name
					});

					// Track used quantity
					const productId = item.product._id.toString();
					usedProducts.set(productId, (usedProducts.get(productId) || 0) + neededQuantity);
					selectedQuantity += neededQuantity;

					if (selectedQuantity >= requiredQuantity) {
						break;
					}
				}
			}
		}

		// Add combo as a single item with combo price
		finalItems.push({
			comboId: combo._id,
			comboName: combo.name,
			price: combo.price,
			quantity: 1,
			isCombo: true,
			comboProducts: comboProducts
		});

		// Add remaining individual items
		productsWithQuantities.forEach(item => {
			const productId = item.product._id.toString();
			const usedQuantity = usedProducts.get(productId) || 0;
			const remainingQuantity = item.quantity - usedQuantity;

			if (remainingQuantity > 0) {
				const remainingItem = {
					productId: item.product._id,
					productName: item.product.name,
					price: item.product.price,
					quantity: remainingQuantity
				};
				finalItems.push(remainingItem);
				remainingItems.push(remainingItem);
			}
		});

		return {
			finalItems,
			remainingItems,
			comboProducts
		};
	}

	/**
	 * Get all active combos
	 */
	static async getActiveCombos() {
		try {
			return await Combo.findActive();
		} catch (error) {
			console.error('Get active combos error:', error);
			return [];
		}
	}

	/**
	 * Check if given products can satisfy any combo
	 * @param {Array} items - Array of { productId, quantity }
	 * @returns {Array} Array of applicable combos with savings
	 */
	static async getApplicableCombos(items) {
		try {
			const productIds = items.map(item => item.productId);
			const products = await Product.find({ _id: { $in: productIds } });

			const productsWithQuantities = items.map(item => {
				const product = products.find(p => p._id.toString() === item.productId);
				return {
					product,
					quantity: item.quantity
				};
			}).filter(item => item.product);

			const combos = await Combo.findActive();

			const applicableCombos = combos.filter(combo => {
				return combo.canApplyToProducts(productsWithQuantities);
			});

			return applicableCombos.map(combo => {
				const savings = combo.calculateSavings(productsWithQuantities);
				return {
					...combo.toObject(),
					savings,
					isBetterDeal: savings > 0
				};
			}).sort((a, b) => b.savings - a.savings);

		} catch (error) {
			console.error('Get applicable combos error:', error);
			return [];
		}
	}

	/**
	 * Convert combo items back to individual product items for order processing
	 * @param {Array} items - Items that may contain combos
	 * @returns {Array} Individual product items
	 */
	static expandComboItems(items) {
		const expandedItems = [];

		items.forEach(item => {
			if (item.isCombo && item.comboProducts) {
				// Add individual products from combo
				item.comboProducts.forEach(comboProduct => {
					expandedItems.push({
						productId: comboProduct.productId,
						productName: comboProduct.productName,
						price: comboProduct.price,
						quantity: comboProduct.quantity,
						fromCombo: true,
						comboId: item.comboId,
						comboName: item.comboName
					});
				});
			} else if (!item.isCombo) {
				// Add regular product item
				expandedItems.push(item);
			}
		});

		return expandedItems;
	}

	/**
	 * Format currency for Vietnamese Dong
	 * @param {number} amount 
	 * @returns {string}
	 */
	static formatCurrency(amount) {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND'
		}).format(amount);
	}

	/**
	 * Get product categories for combo configuration
	 */
	static async getProductCategories() {
		try {
			return await Product.distinct('category', { isActive: true, available: true });
		} catch (error) {
			console.error('Get product categories error:', error);
			return [];
		}
	}
}

module.exports = ComboService;
