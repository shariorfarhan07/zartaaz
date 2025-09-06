const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

// Mapping of old category strings to new category slugs
const categoryMapping = {
  'ethnic': 'ethnic-wear',
  'casual': 'casual',
  'formal': 'formal',
  'accessories': 'accessories',
  'footwear': 'footwear'
};

const migrateProductCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zartaaz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories`);

    // Create a mapping from slug to category ID
    const categorySlugToId = {};
    categories.forEach(cat => {
      categorySlugToId[cat.slug] = cat._id;
    });

    // Get all products with old category format
    const products = await Product.find({
      category: { $type: 'string' } // Products with string category (old format)
    });

    console.log(`Found ${products.length} products to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const oldCategory = product.category;
        const newCategorySlug = categoryMapping[oldCategory];
        
        if (newCategorySlug && categorySlugToId[newCategorySlug]) {
          const newCategoryId = categorySlugToId[newCategorySlug];
          
          await Product.findByIdAndUpdate(product._id, {
            category: newCategoryId
          });
          
          console.log(`✓ Migrated product "${product.name}" from "${oldCategory}" to "${newCategorySlug}"`);
          migratedCount++;
        } else {
          console.log(`⚠ Skipped product "${product.name}" - unknown category: "${oldCategory}"`);
          errorCount++;
        }
      } catch (error) {
        console.error(`✗ Error migrating product "${product.name}":`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration completed!');
    console.log(`✓ Successfully migrated: ${migratedCount} products`);
    console.log(`⚠ Skipped/Errors: ${errorCount} products`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateProductCategories();
