const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

const fixProductCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zartaaz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log('Available categories:');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug}): ${cat._id}`);
    });

    // Get all products
    const products = await Product.find({});
    console.log(`\nFound ${products.length} products:`);
    
    for (const product of products) {
      console.log(`- ${product.name}: category = ${product.category} (type: ${typeof product.category})`);
    }

    // Fix products with undefined or invalid categories
    const ethnicCategory = categories.find(c => c.slug === 'ethnic-wear');
    if (ethnicCategory) {
      const result = await Product.updateMany(
        { 
          $or: [
            { category: undefined },
            { category: null },
            { category: 'undefined' }
          ]
        },
        { category: ethnicCategory._id }
      );
      console.log(`\nFixed ${result.modifiedCount} products with undefined categories to use 'Ethnic Wear'`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixProductCategories();
