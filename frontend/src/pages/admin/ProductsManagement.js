import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProductsTable from '../../components/admin/ProductsTable';
import ProductModal from '../../components/admin/ProductModal';

const ProductsManagement = () => {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);

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

	const handleEdit = (product) => {
		setEditingProduct(product);
		setShowModal(true);
	};

	const handleAddNew = () => {
		setEditingProduct(null);
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setEditingProduct(null);
	};

	const handleSubmitProduct = async (productData) => {
		try {
			let response;
			if (editingProduct) {
				response = await adminService.updateProduct(editingProduct._id, productData);
			} else {
				response = await adminService.createProduct(productData);
			}

			if (response.success) {
				toast.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công');
				handleCloseModal();
				fetchProducts();
			}
		} catch (error) {
			console.error('Error saving product:', error);
			toast.error('Lỗi khi lưu sản phẩm');
		}
	};

	const handleUploadImage = async (imageFile) => {
		return await adminService.uploadImage(imageFile);
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
					onClick={handleAddNew}
					className="btn-primary"
				>
					<i className="fas fa-plus mr-2"></i>
					Thêm sản phẩm mới
				</button>
			</div>

			{/* Products Table */}
			<div className="card">
				<ProductsTable
					products={products}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</div>

			{/* Modal */}
			<ProductModal
				isOpen={showModal}
				onClose={handleCloseModal}
				product={editingProduct}
				onSubmit={handleSubmitProduct}
				onUploadImage={handleUploadImage}
			/>
		</div>
	);
};

export default ProductsManagement;
