const { connectDB } = require('./lib/database');
const { auth } = require('./lib/auth');
const User = require('./models/User');
const Account = require('./models/Account');
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

		// Check if admin user already exists
		const existingAdmin = await User.findOne({ email: adminEmail });
		if (existingAdmin) {
			console.log('ℹ️  Admin user already exists');
		} else {
			// Create admin user using better-auth password hash
			const ctx = await auth.$context;
			const hashedPassword = await ctx.password.hash(adminPassword);
			const adminUserId = new Date().toISOString();

			// Create admin user using Mongoose
			const adminUser = new User({
				id: adminUserId,
				email: adminEmail,
				emailVerified: true,
				name: 'System Administrator',
				username: adminUsername,
				role: 'admin'
			});
			await adminUser.save();

			// Create account record for the user
			const adminAccount = new Account({
				id: adminUserId + '_credential',
				userId: adminUserId,
				providerId: 'credential',
				accountId: adminUserId,
				password: hashedPassword
			});
			await adminAccount.save(); console.log('✅ Created admin user');
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

	} catch (error) {
		console.error('❌ Error initializing database:', error);
		process.exit(1);
	}
}

initDatabase();
