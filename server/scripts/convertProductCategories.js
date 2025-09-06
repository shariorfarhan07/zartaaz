const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

const convertProductCategories = async () => {
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
    console.log(`\nFound ${products.length} products`);

    // Create mapping from old category strings to new category IDs
    const categoryMapping = {
      'ethnic': categories.find(c => c.slug === 'ethnic-wear')?._id,
      'casual': categories.find(c => c.slug === 'casual')?._id,
      'formal': categories.find(c => c.slug === 'formal')?._id,
      'accessories': categories.find(c => c.slug === 'accessories')?._id,
      'footwear': categories.find(c => c.slug === 'footwear')?._id
    };

    // Default to ethnic wear if no category found
    const defaultCategoryId = categories.find(c => c.slug === 'ethnic-wear')?._id;

    let updatedCount = 0;

    for (const product of products) {
      try {
        let newCategoryId = null;
        
        // Check if category is already an ObjectId
        if (mongoose.Types.ObjectId.isValid(product.category)) {
          console.log(`✓ Product "${product.name}" already has valid category ID: ${product.category}`);
          continue;
        }

        // Map old string categories to new IDs
        if (typeof product.category === 'string' && categoryMapping[product.category]) {
          newCategoryId = categoryMapping[product.category];
        } else {
          // Use default category for undefined or unknown categories
          newCategoryId = defaultCategoryId;
        }

        if (newCategoryId) {
          // Use direct MongoDB update to bypass validation
          await mongoose.connection.db.collection('products').updateOne(
            { _id: product._id },
            { $set: { category: newCategoryId } }
          );
          
          console.log(`✓ Updated product "${product.name}" category to: ${newCategoryId}`);
          updatedCount++;
        } else {
          console.log(`⚠ Could not find category for product "${product.name}"`);
        }
      } catch (error) {
        console.error(`✗ Error updating product "${product.name}":`, error.message);
      }
    }

    console.log(`\nConversion completed! Updated ${updatedCount} products.`);

    // Verify the results
    console.log('\nVerifying results:');
    const updatedProducts = await Product.find({}).populate('category', 'name slug');
    updatedProducts.forEach(product => {
      console.log(`- ${product.name}: ${product.category?.name || 'No category'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

convertProductCategories();
