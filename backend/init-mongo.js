// Initialize database with sample data
db = db.getSiblingDB('minipreorder');

// Create admin user
db.admins.insertOne({
  username: 'admin',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
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
    description: 'Cơm tấm sườn nướng với đồ chua',
    price: 35000,
    image: 'https://via.placeholder.com/300x200?text=Cơm+tấm',
    category: 'Đồ ăn',
    available: true,
    createdAt: new Date()
  },
  {
    name: 'Nước ép cam',
    description: 'Nước ép cam tươi nguyên chất',
    price: 15000,
    image: 'https://via.placeholder.com/300x200?text=Nước+ép',
    category: 'Đồ uống',
    available: true,
    createdAt: new Date()
  }
]);

print('Database initialized with sample data');
