const { connectDB } = require('./lib/database');
const { auth } = require('./lib/auth');
const Product = require('./models/Product');
require('dotenv').config();

async function initDatabase() {
	try {
		// Connect to MongoDB using Mongoose
		await connectDB();
		console.log('✅ Connected to MongoDB via Mongoose');

		// Admin credentials from environment
		const adminEmail = process.env.ADMIN_EMAIL || 'sab@fit.hcmus.edu.vn';
		const adminUsername = process.env.ADMIN_USERNAME || 'admin';
		const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

		// Check if admin user already exists using better-auth
		const existingAdminSession = await auth.api.listUsers({
			query: {
				searchValue: adminEmail,
				searchField: "email",
				limit: 1
			}
		});

		if (existingAdminSession.users && existingAdminSession.users.length > 0) {
			console.log('ℹ️  Admin user already exists');
		} else {
			// Create admin user using better-auth admin plugin
			const adminResult = await auth.api.createUser({
				email: adminEmail,
				name: 'System Administrator',
				username: adminUsername,
				password: adminPassword,
				role: 'admin'
			});

			if (adminResult.user) {
				console.log('✅ Created admin user');
				console.log(`   Email: ${adminEmail}`);
				console.log(`   Username: ${adminUsername}`);
				console.log('   Password: [HIDDEN]');
				console.log('   Role: admin');
			} else {
				console.error('❌ Failed to create admin user:', adminResult.error);
			}
		}

		// Create sample products using Mongoose
		const existingProducts = await Product.countDocuments();

		if (existingProducts === 0) {
			const sampleProducts = [
				{
					name: "Áo thun SAB",
					price: 150000,
					image: "/fallback-product.png",
					description: "Áo thun chất lượng cao với logo SAB",
					status: "active",
					category: "Đồ mặc",
					available: true
				},
				{
					name: "Mũ SAB",
					price: 100000,
					image: "/fallback-product.png",
					description: "Mũ snapback phong cách với logo SAB",
					status: "active",
					category: "Phụ kiện",
					available: true
				}
			];

			await Product.insertMany(sampleProducts);
			console.log('✅ Created sample products');
		}

		console.log('✅ Database initialization completed successfully!');

	} catch (error) {
		console.error('❌ Error initializing database:', error);
		process.exit(1);
	}
}

initDatabase();
