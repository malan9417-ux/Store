const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');

dotenv.config();

const categories = [
  { name: 'Electronics', description: 'Latest gadgets and electronics' },
  { name: 'Clothing', description: 'Fashion and apparel' },
  { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
  { name: 'Sports', description: 'Sports equipment and accessories' }
];

const products = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 99.99,
    category: 'Electronics',
    brand: 'AudioTech',
    stock: 50,
    images: [{ url: '/images/headphones.jpg', alt: 'Wireless Headphones' }]
  },
  {
    name: 'Smartphone',
    description: 'Latest smartphone with advanced features',
    price: 699.99,
    salePrice: 649.99,
    category: 'Electronics',
    brand: 'TechBrand',
    stock: 30,
    images: [{ url: '/images/smartphone.jpg', alt: 'Smartphone' }]
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Category.deleteMany();
    await Product.deleteMany();
    
    // Create categories
    const createdCategories = await Category.insertMany(categories);
    
    // Map category names to IDs
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    
    // Add category IDs to products
    const productsWithCategories = products.map(product => ({
      ...product,
      category: categoryMap[product.category]
    }));
    
    await Product.insertMany(productsWithCategories);
    
    console.log('Data Imported Successfully');
    process.exit();
  } catch (error) {
    console.error('Error with data import:', error);
    process.exit(1);
  }
};

importData();
