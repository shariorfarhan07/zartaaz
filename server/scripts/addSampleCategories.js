const mongoose = require('mongoose');
const Category = require('../models/Category');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleCategories = [
  {
    name: 'Ethnic Wear',
    slug: 'ethnic-wear',
    description: 'Traditional and ethnic clothing including sarees, lehengas, and ethnic tops',
    image: {
      url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=300&fit=crop',
      alt: 'Ethnic Wear Collection'
    },
    isActive: true,
    sortOrder: 1,
    metaTitle: 'Ethnic Wear - Traditional Indian Clothing',
    metaDescription: 'Shop beautiful ethnic wear including sarees, lehengas, and traditional outfits',
    keywords: 'ethnic wear, sarees, lehengas, traditional clothing, indian wear'
  },
  {
    name: 'Casual Wear',
    slug: 'casual-wear',
    description: 'Comfortable and stylish casual clothing for everyday wear',
    image: {
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      alt: 'Casual Wear Collection'
    },
    isActive: true,
    sortOrder: 2,
    metaTitle: 'Casual Wear - Everyday Fashion',
    metaDescription: 'Comfortable and trendy casual clothing for daily wear',
    keywords: 'casual wear, everyday clothing, comfortable fashion, daily wear'
  },
  {
    name: 'Formal Wear',
    slug: 'formal-wear',
    description: 'Professional and elegant formal clothing for office and special occasions',
    image: {
      url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=300&fit=crop',
      alt: 'Formal Wear Collection'
    },
    isActive: true,
    sortOrder: 3,
    metaTitle: 'Formal Wear - Professional Clothing',
    metaDescription: 'Elegant formal wear for office and special occasions',
    keywords: 'formal wear, office clothing, professional attire, business wear'
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion accessories including jewelry, bags, and style accessories',
    image: {
      url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop',
      alt: 'Fashion Accessories'
    },
    isActive: true,
    sortOrder: 4,
    metaTitle: 'Fashion Accessories - Jewelry & Style',
    metaDescription: 'Beautiful fashion accessories to complete your look',
    keywords: 'accessories, jewelry, bags, fashion accessories, style'
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Comfortable and stylish footwear for all occasions',
    image: {
      url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
      alt: 'Footwear Collection'
    },
    isActive: true,
    sortOrder: 5,
    metaTitle: 'Footwear - Shoes & Sandals',
    metaDescription: 'Comfortable and stylish footwear for every occasion',
    keywords: 'footwear, shoes, sandals, comfortable shoes, fashion footwear'
  },
  {
    name: 'Winter Collection',
    slug: 'winter-collection',
    description: 'Warm and cozy winter clothing including sweaters, jackets, and coats',
    image: {
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      alt: 'Winter Collection'
    },
    isActive: true,
    sortOrder: 6,
    metaTitle: 'Winter Collection - Warm Clothing',
    metaDescription: 'Stay warm and stylish with our winter collection',
    keywords: 'winter clothing, sweaters, jackets, coats, warm wear'
  },
  {
    name: 'Summer Collection',
    slug: 'summer-collection',
    description: 'Light and breezy summer clothing perfect for hot weather',
    image: {
      url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=300&fit=crop',
      alt: 'Summer Collection'
    },
    isActive: true,
    sortOrder: 7,
    metaTitle: 'Summer Collection - Light & Breezy',
    metaDescription: 'Stay cool and comfortable with our summer collection',
    keywords: 'summer clothing, light wear, breezy fashion, summer style'
  },
  {
    name: 'Party Wear',
    slug: 'party-wear',
    description: 'Glamorous and elegant party wear for special occasions and celebrations',
    image: {
      url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop',
      alt: 'Party Wear Collection'
    },
    isActive: true,
    sortOrder: 8,
    metaTitle: 'Party Wear - Glamorous Fashion',
    metaDescription: 'Look stunning at parties with our glamorous party wear collection',
    keywords: 'party wear, glamorous fashion, special occasions, celebration wear'
  }
];

const addSampleCategories = async () => {
  try {
    console.log('Adding sample categories...');
    
    // Clear existing categories first
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Add sample categories
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`Successfully added ${createdCategories.length} sample categories:`);
    
    createdCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });
    
    console.log('\nSample categories added successfully!');
  } catch (error) {
    console.error('Error adding sample categories:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await addSampleCategories();
};

runScript();
