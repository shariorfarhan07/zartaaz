const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
  {
    name: 'Ethnic Wear',
    slug: 'ethnic-wear',
    description: 'Traditional and ethnic clothing for women',
    image: {
      url: '/placeholder-product.jpg',
      alt: 'Ethnic Wear Collection'
    },
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Casual',
    slug: 'casual',
    description: 'Comfortable and stylish casual wear',
    image: {
      url: '/placeholder-product.jpg',
      alt: 'Casual Wear Collection'
    },
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Formal',
    slug: 'formal',
    description: 'Professional and elegant formal wear',
    image: {
      url: '/placeholder-product.jpg',
      alt: 'Formal Wear Collection'
    },
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion accessories and jewelry',
    image: {
      url: '/placeholder-product.jpg',
      alt: 'Accessories Collection'
    },
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Shoes and footwear for all occasions',
    image: {
      url: '/placeholder-product.jpg',
      alt: 'Footwear Collection'
    },
    isActive: true,
    sortOrder: 5
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zartaaz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Display created categories
    createdCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });

    console.log('Category seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
