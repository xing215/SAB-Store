const { connectDB } = require('./lib/database');
const { auth } = require('./lib/auth');
const Product = require('./models/Product');
const User = require('./models/User');
const Account = require('./models/Account');
const crypto = require('crypto');
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

		// Check if admin user already exists in database
		const existingUser = await User.findOne({
			$or: [{ email: adminEmail }, { username: adminUsername }]
		});

		if (existingUser) {
			console.log('⚠️ Existing admin user found');
		}

		await auth.api.createUser({
			body: {
				email: adminEmail,
				name: 'System Administrator',
				password: adminPassword,
				role: 'admin',
				data: {
					username: adminUsername,
					displayUsername: 'Admin',
				}
			},
		});

		// log all accounts and users in the database
		const allUsers = await User.find();
		const allAccounts = await Account.find();
		console.log(`All users in DB: ${JSON.stringify(allUsers, null, 2)}`);
		console.log(`All accounts in DB: ${JSON.stringify(allAccounts, null, 2)}`);

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
		process.exit(0);

	} catch (error) {
		console.error('❌ Error initializing database:', error);
		process.exit(1);
	}
}

initDatabase();
