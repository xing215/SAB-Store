const { connectDB } = require('./lib/database');
const { hashPassword } = require('better-auth/crypto');
const Product = require('./models/Product');
const User = require('./models/User');
const Account = require('./models/Account');
const crypto = require('crypto');
require('dotenv').config();

// Generate a UUID v4-like string
function generateId() {
	return crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

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
			console.log('ℹ️  Admin user already exists');
		} else {
			// Use better-auth crypto hashPassword function
			const hashedPassword = await hashPassword(adminPassword);

			// Generate unique IDs
			const userId = generateId();
			const accountId = generateId();

			// Create admin user directly in database
			const adminUser = new User({
				id: userId,
				email: adminEmail,
				emailVerified: true,
				username: adminUsername,
				name: 'System Administrator',
				role: 'admin'
			});

			await adminUser.save();

			// Create credential account for password authentication
			const adminAccount = new Account({
				id: accountId,
				userId: userId,
				providerId: 'credential',
				accountId: adminEmail, // Use email as account identifier
				password: hashedPassword
			});

			await adminAccount.save();

			console.log('✅ Created admin user');
			console.log(`   Email: ${adminEmail}`);
			console.log(`   Username: ${adminUsername}`);
			console.log('   Password: [HIDDEN]');
			console.log('   Role: admin');
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
		process.exit(0);

	} catch (error) {
		console.error('❌ Error initializing database:', error);
		process.exit(1);
	}
}

initDatabase();
