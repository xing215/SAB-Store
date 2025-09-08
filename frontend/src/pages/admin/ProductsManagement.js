import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { adminService, formatCurrency } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProductsManagement = () => {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		price: '',
		imageUrl: '',
		category: '',
		available: true,
		stockQuantity: ''
	});
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [uploadMethod, setUploadMethod] = useState('url'); // 'url', 'upload', 'path'
	const [uploading, setUploading] = useState(false);

	// Fetch products
	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await adminService.getProducts();
			if (response.success) {
				setProducts(response.data.products);
			}
		} catch (error) {
			console.error('Error fetching products:', error);
			toast.error('Lỗi khi tải danh sách sản phẩm');
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	const handleImageFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImageFile(file);
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const uploadImageFile = async () => {
		if (!imageFile) return null;

		const formDataUpload = new FormData();
		formDataUpload.append('image', imageFile);

		try {
			setUploading(true);
			const response = await fetch('/api/upload/image', {
				method: 'POST',
				body: formDataUpload,
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			const result = await response.json();
			if (result.success) {
				return result.data.imageUrl;
			} else {
				throw new Error(result.message || 'Upload failed');
			}
		} catch (error) {
			console.error('Upload error:', error);
			toast.error('Lỗi khi upload hình ảnh: ' + error.message);
			return null;
		} finally {
			setUploading(false);
		}
	};

	const resetImageInputs = () => {
		setImageFile(null);
		setImagePreview(null);
		setFormData(prev => ({ ...prev, imageUrl: '' }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			let finalImageUrl = formData.imageUrl;

			// Handle file upload if user selected a file
			if (uploadMethod === 'upload' && imageFile) {
				const uploadedUrl = await uploadImageFile();
				if (uploadedUrl) {
					finalImageUrl = uploadedUrl;
				} else {
					return; // Stop if upload failed
				}
			}

			const productData = {
				...formData,
				imageUrl: finalImageUrl,
				price: parseFloat(formData.price),
				stockQuantity: parseInt(formData.stockQuantity) || 0
			};

			let response;
			if (editingProduct) {
				response = await adminService.updateProduct(editingProduct._id, productData);
			} else {
				response = await adminService.createProduct(productData);
			}

			if (response.success) {
				toast.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công');
				setShowModal(false);
				setEditingProduct(null);
				setFormData({
					name: '',
					description: '',
					price: '',
					imageUrl: '',
					category: '',
					available: true,
					stockQuantity: ''
				});
				resetImageInputs();
				setUploadMethod('url');
				fetchProducts();
			}
		} catch (error) {
			console.error('Error saving product:', error);
			toast.error('Lỗi khi lưu sản phẩm');
		}
	};

	const handleEdit = (product) => {
		setEditingProduct(product);
		setFormData({
			name: product.name,
			description: product.description,
			price: product.price.toString(),
			imageUrl: product.imageUrl || '',
			category: product.category,
			available: product.available,
			stockQuantity: product.stockQuantity?.toString() || '0'
		});
		resetImageInputs();
		setUploadMethod('url');
		setShowModal(true);
	};

	const handleDelete = async (productId) => {
		const result = await Swal.fire({
			title: 'Xác nhận xóa sản phẩm',
			text: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#dc2626',
			cancelButtonColor: '#6b7280',
			confirmButtonText: 'Xóa',
			cancelButtonText: 'Hủy'
		});

		if (result.isConfirmed) {
			try {
				const response = await adminService.deleteProduct(productId);
				if (response.success) {
					toast.success('Xóa sản phẩm thành công');
					fetchProducts();
				}
			} catch (error) {
				console.error('Error deleting product:', error);
				toast.error('Lỗi khi xóa sản phẩm');
			}
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-64">
				<LoadingSpinner size="large" text="Đang tải danh sách sản phẩm..." />
			</div>
		);
	}

	return (
		<div className="p-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
					<p className="text-gray-600">Thêm, sửa, xóa và quản lý sản phẩm</p>
				</div>
				<button
					onClick={() => {
						setEditingProduct(null);
						setFormData({
							name: '',
							description: '',
							price: '',
							imageUrl: '',
							category: '',
							available: true,
							stockQuantity: ''
						});
						resetImageInputs();
						setUploadMethod('url');
						setShowModal(true);
					}}
					className="btn-primary"
				>
					<i className="fas fa-plus mr-2"></i>
					Thêm sản phẩm mới
				</button>
			</div>

			{/* Products Table */}
			<div className="card">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Sản phẩm
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Danh mục
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Giá
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Tồn kho
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Trạng thái
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Hành động
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{products.map((product) => (
								<tr key={product._id} className="hover:bg-gray-50">
									<td className="px-6 py-4">
										<div className="flex items-center">
											<img
												src={product.imageUrl || '/fallback-product.png'}
												alt={product.name}
												className="w-16 h-16 object-cover rounded-lg mr-4"
												onError={(e) => {
													e.target.src = '/fallback-product.png';
												}}
											/>
											<div>
												<div className="text-sm font-medium text-gray-900">
													{product.name}
												</div>
												<div className="text-sm text-gray-500 line-clamp-2">
													{product.description}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{product.category}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
										{formatCurrency(product.price)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										<span className={`${product.stockQuantity <= 5 ? 'text-danger-600 font-semibold' : 'text-gray-900'}`}>
											{product.stockQuantity || 0} sản phẩm
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className={`badge ${product.available ? 'badge-success' : 'badge-danger'}`}>
											{product.available ? 'Đang bán' : 'Ngừng bán'}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<button
											onClick={() => handleEdit(product)}
											className="text-primary-600 hover:text-primary-900 mr-3"
										>
											<i className="fas fa-edit mr-1"></i>
											Sửa
										</button>
										<button
											onClick={() => handleDelete(product._id)}
											className="text-danger-600 hover:text-danger-900"
										>
											<i className="fas fa-trash mr-1"></i>
											Xóa
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{products.length === 0 && (
						<div className="text-center py-12">
							<i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có sản phẩm</h3>
							<p className="text-gray-600">Thêm sản phẩm đầu tiên để bắt đầu</p>
						</div>
					)}
				</div>
			</div>

			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold text-gray-900">
									{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
								</h2>
								<button
									onClick={() => setShowModal(false)}
									className="text-gray-500 hover:text-gray-700"
								>
									<i className="fas fa-times text-xl"></i>
								</button>
							</div>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Tên sản phẩm *
										</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleInputChange}
											className="form-input"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Danh mục *
										</label>
										<input
											type="text"
											name="category"
											value={formData.category}
											onChange={handleInputChange}
											className="form-input"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Giá (VND) *
										</label>
										<input
											type="number"
											name="price"
											value={formData.price}
											onChange={handleInputChange}
											className="form-input"
											min="0"
											step="1000"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Số lượng tồn kho
										</label>
										<input
											type="number"
											name="stockQuantity"
											value={formData.stockQuantity}
											onChange={handleInputChange}
											className="form-input"
											min="0"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Mô tả
									</label>
									<textarea
										name="description"
										value={formData.description}
										onChange={handleInputChange}
										className="form-input"
										rows="3"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Hình ảnh sản phẩm
									</label>

									{/* Upload method selector */}
									<div className="mb-3">
										<div className="flex space-x-4">
											<label className="inline-flex items-center">
												<input
													type="radio"
													className="form-radio"
													name="uploadMethod"
													value="url"
													checked={uploadMethod === 'url'}
													onChange={(e) => setUploadMethod(e.target.value)}
												/>
												<span className="ml-2">URL</span>
											</label>
											<label className="inline-flex items-center">
												<input
													type="radio"
													className="form-radio"
													name="uploadMethod"
													value="upload"
													checked={uploadMethod === 'upload'}
													onChange={(e) => setUploadMethod(e.target.value)}
												/>
												<span className="ml-2">Upload file</span>
											</label>
											<label className="inline-flex items-center">
												<input
													type="radio"
													className="form-radio"
													name="uploadMethod"
													value="path"
													checked={uploadMethod === 'path'}
													onChange={(e) => setUploadMethod(e.target.value)}
												/>
												<span className="ml-2">File path</span>
											</label>
										</div>
									</div>

									{/* URL input */}
									{uploadMethod === 'url' && (
										<input
											type="text"
											name="imageUrl"
											value={formData.imageUrl}
											onChange={handleInputChange}
											className="form-input"
											placeholder="https://example.com/image.jpg"
										/>
									)}

									{/* File upload */}
									{uploadMethod === 'upload' && (
										<div>
											<input
												type="file"
												accept="image/*"
												onChange={handleImageFileChange}
												className="form-input"
											/>
											{imagePreview && (
												<div className="mt-2">
													<img
														src={imagePreview}
														alt="Preview"
														className="w-20 h-20 object-cover rounded-lg"
													/>
												</div>
											)}
											{uploading && (
												<div className="mt-2 text-sm text-blue-600">
													Đang upload...
												</div>
											)}
										</div>
									)}

									{/* File path input */}
									{uploadMethod === 'path' && (
										<input
											type="text"
											name="imageUrl"
											value={formData.imageUrl}
											onChange={handleInputChange}
											className="form-input"
											placeholder="/uploads/products/image.jpg"
										/>
									)}

									{/* Image preview for URL/path */}
									{(uploadMethod === 'url' || uploadMethod === 'path') && formData.imageUrl && (
										<div className="mt-2">
											<img
												src={formData.imageUrl}
												alt="Preview"
												className="w-20 h-20 object-cover rounded-lg"
												onError={(e) => {
													e.target.src = '/fallback-product.png';
												}}
											/>
										</div>
									)}
								</div>

								<div className="flex items-center">
									<input
										type="checkbox"
										name="available"
										id="available"
										checked={formData.available}
										onChange={handleInputChange}
										className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
									/>
									<label htmlFor="available" className="ml-2 text-sm text-gray-700">
										Sản phẩm đang được bán
									</label>
								</div>

								<div className="flex justify-end space-x-3 pt-4">
									<button
										type="button"
										onClick={() => setShowModal(false)}
										className="btn-secondary"
									>
										Hủy
									</button>
									<button type="submit" className="btn-primary">
										{editingProduct ? 'Cập nhật' : 'Thêm mới'}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProductsManagement;
