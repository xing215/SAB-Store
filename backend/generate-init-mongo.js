const fs = require('fs');
require('dotenv').config();
const { hashPassword } = require('./utils/auth');

// Get admin credentials from environment variables
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

// Hash the password using bcrypt (same salt rounds as backend: 10)
const hashedPassword = hashPassword(adminPassword);

// Generate the MongoDB initialization script
const initScript = `// Initialize database with sample data
db = db.getSiblingDB('minipreorder');

// Create admin user with environment variables
db.admins.insertOne({
  username: '${adminUsername}',
  password: '${hashedPassword}',
  isActive: true,
  createdAt: new Date()
});

// Create sample products
db.products.insertMany([
  {
    name: 'Bánh mì sandwich',
    description: 'Bánh mì thơm ngon với thịt nguội và rau tươi',
    price: 25000,
    image: 'https://via.placeholder.com/300x200?text=Bánh+mì',
    category: 'Đồ ăn',
    available: true,
    createdAt: new Date()
  },
  {
    name: 'Cà phê sữa đá',
    description: 'Cà phê sữa đá truyền thống Việt Nam',
    price: 20000,
    image: 'https://via.placeholder.com/300x200?text=Cà+phê',
    category: 'Đồ uống',
    available: true,
    createdAt: new Date()
  },
  {
    name: 'Phở bò',
    description: 'Phở bò tái chín với nước dùng thơm ngon',
    price: 45000,
    image: 'https://via.placeholder.com/300x200?text=Phở+bò',
    category: 'Đồ ăn',
    available: true,
    createdAt: new Date()
  },
  {
    name: 'Trà sữa trân châu',
    description: 'Trà sữa ngọt ngào với trân châu dai',
    price: 30000,
    image: 'https://via.placeholder.com/300x200?text=Trà+sữa',
    category: 'Đồ uống',
    available: true,
    createdAt: new Date()
  },
  {
    name: 'Cơm tấm',
    description: 'Cơm tấm sườn nướng thơm lừng',
    price: 40000,
    image: 'https://via.placeholder.com/300x200?text=Cơm+tấm',
    category: 'Đồ ăn',
    available: true,
    createdAt: new Date()
  }
]);

print('Database initialized successfully!');
print('Admin user created: ' + '${adminUsername}');
print('Sample products created!');
`;

// Write the generated script to init-mongo.js
fs.writeFileSync('./init-mongo.js', initScript, 'utf8');
console.log('✅ Generated init-mongo.js with admin credentials:');
console.log(`   Username: ${adminUsername}`);
console.log(`   Password: ${adminPassword}`);
console.log(`   Hash: ${hashedPassword}`);
