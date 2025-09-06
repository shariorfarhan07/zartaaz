const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
require('dotenv').config();

const sampleProducts = [
  {
    name: "Elegant Floral Kurta",
    description: "Beautiful handcrafted kurta with intricate floral embroidery. Perfect for casual and semi-formal occasions.",
    price: 89.99,
    category: "ethnic",
    subcategory: "kurtas",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500",
        alt: "Elegant Floral Kurta"
      }
    ],
    variants: [
      { size: "S", color: "Blue", colorCode: "#4A90E2", stock: 10, sku: "ZAR001-S-BL" },
      { size: "M", color: "Blue", colorCode: "#4A90E2", stock: 15, sku: "ZAR001-M-BL" },
      { size: "L", color: "Blue", colorCode: "#4A90E2", stock: 8, sku: "ZAR001-L-BL" },
      { size: "S", color: "Pink", colorCode: "#E91E63", stock: 12, sku: "ZAR001-S-PK" },
      { size: "M", color: "Pink", colorCode: "#E91E63", stock: 20, sku: "ZAR001-M-PK" },
      { size: "L", color: "Pink", colorCode: "#E91E63", stock: 6, sku: "ZAR001-L-PK" }
    ],
    rating: 4.5,
    numReviews: 23,
    featured: true,
    fabric: "Cotton",
    careInstructions: "Machine wash cold, hang dry"
  },
  {
    name: "Modern Casual Dress",
    description: "Comfortable and stylish casual dress perfect for everyday wear. Made with premium cotton blend.",
    price: 65.99,
    category: "casual",
    subcategory: "dresses",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
        alt: "Modern Casual Dress"
      }
    ],
    variants: [
      { size: "XS", color: "Black", colorCode: "#000000", stock: 8, sku: "ZAR002-XS-BK" },
      { size: "S", color: "Black", colorCode: "#000000", stock: 15, sku: "ZAR002-S-BK" },
      { size: "M", color: "Black", colorCode: "#000000", stock: 12, sku: "ZAR002-M-BK" },
      { size: "L", color: "Black", colorCode: "#000000", stock: 10, sku: "ZAR002-L-BK" },
      { size: "S", color: "Navy", colorCode: "#001f3f", stock: 18, sku: "ZAR002-S-NV" },
      { size: "M", color: "Navy", colorCode: "#001f3f", stock: 14, sku: "ZAR002-M-NV" }
    ],
    rating: 4.2,
    numReviews: 18,
    featured: true,
    fabric: "Cotton Blend",
    careInstructions: "Machine wash warm, tumble dry low"
  },
  {
    name: "Professional Blazer",
    description: "Sophisticated blazer perfect for office wear and formal occasions. Tailored fit with premium finish.",
    price: 129.99,
    category: "formal",
    subcategory: "blazers",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544957992-20349e4a8d0a?w=500",
        alt: "Professional Blazer"
      }
    ],
    variants: [
      { size: "S", color: "Charcoal", colorCode: "#36454F", stock: 6, sku: "ZAR003-S-CH" },
      { size: "M", color: "Charcoal", colorCode: "#36454F", stock: 8, sku: "ZAR003-M-CH" },
      { size: "L", color: "Charcoal", colorCode: "#36454F", stock: 5, sku: "ZAR003-L-CH" },
      { size: "S", color: "Navy", colorCode: "#001f3f", stock: 7, sku: "ZAR003-S-NV" },
      { size: "M", color: "Navy", colorCode: "#001f3f", stock: 9, sku: "ZAR003-M-NV" }
    ],
    rating: 4.7,
    numReviews: 31,
    featured: false,
    fabric: "Wool Blend",
    careInstructions: "Dry clean only"
  },
  {
    name: "Bohemian Maxi Dress",
    description: "Flowing maxi dress with bohemian prints. Perfect for summer outings and beach vacations.",
    price: 79.99,
    originalPrice: 99.99,
    onSale: true,
    salePrice: 79.99,
    category: "casual",
    subcategory: "dresses",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500",
        alt: "Bohemian Maxi Dress"
      }
    ],
    variants: [
      { size: "XS", color: "Floral", colorCode: "#FF6B6B", stock: 12, sku: "ZAR004-XS-FL" },
      { size: "S", color: "Floral", colorCode: "#FF6B6B", stock: 15, sku: "ZAR004-S-FL" },
      { size: "M", color: "Floral", colorCode: "#FF6B6B", stock: 18, sku: "ZAR004-M-FL" },
      { size: "L", color: "Floral", colorCode: "#FF6B6B", stock: 10, sku: "ZAR004-L-FL" },
      { size: "XL", color: "Floral", colorCode: "#FF6B6B", stock: 8, sku: "ZAR004-XL-FL" }
    ],
    rating: 4.3,
    numReviews: 27,
    featured: true,
    fabric: "Rayon",
    careInstructions: "Hand wash cold, air dry"
  },
  {
    name: "Silk Scarf Collection",
    description: "Premium silk scarves with traditional motifs. Add elegance to any outfit.",
    price: 45.99,
    category: "accessories",
    subcategory: "scarves",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500",
        alt: "Silk Scarf Collection"
      }
    ],
    variants: [
      { size: "One Size", color: "Red", colorCode: "#DC143C", stock: 25, sku: "ZAR005-OS-RD" },
      { size: "One Size", color: "Blue", colorCode: "#4169E1", stock: 30, sku: "ZAR005-OS-BL" },
      { size: "One Size", color: "Gold", colorCode: "#FFD700", stock: 20, sku: "ZAR005-OS-GD" },
      { size: "One Size", color: "Green", colorCode: "#228B22", stock: 22, sku: "ZAR005-OS-GR" }
    ],
    rating: 4.6,
    numReviews: 45,
    featured: false,
    fabric: "100% Silk",
    careInstructions: "Dry clean recommended"
  },
  {
    name: "Embroidered Evening Gown",
    description: "Stunning evening gown with hand-embroidered details. Perfect for special occasions and events.",
    price: 199.99,
    category: "formal",
    subcategory: "gowns",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=500",
        alt: "Embroidered Evening Gown"
      }
    ],
    variants: [
      { size: "S", color: "Burgundy", colorCode: "#800020", stock: 3, sku: "ZAR006-S-BG" },
      { size: "M", color: "Burgundy", colorCode: "#800020", stock: 4, sku: "ZAR006-M-BG" },
      { size: "L", color: "Burgundy", colorCode: "#800020", stock: 2, sku: "ZAR006-L-BG" },
      { size: "S", color: "Emerald", colorCode: "#50C878", stock: 3, sku: "ZAR006-S-EM" },
      { size: "M", color: "Emerald", colorCode: "#50C878", stock: 5, sku: "ZAR006-M-EM" }
    ],
    rating: 4.9,
    numReviews: 12,
    featured: true,
    fabric: "Silk with Embroidery",
    careInstructions: "Professional dry clean only"
  },
  {
    name: "Comfortable Yoga Pants",
    description: "High-quality yoga pants with moisture-wicking fabric. Perfect for workouts and casual wear.",
    price: 39.99,
    category: "casual",
    subcategory: "activewear",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506629905607-d9b1b2e3d5b5?w=500",
        alt: "Comfortable Yoga Pants"
      }
    ],
    variants: [
      { size: "XS", color: "Black", colorCode: "#000000", stock: 20, sku: "ZAR007-XS-BK" },
      { size: "S", color: "Black", colorCode: "#000000", stock: 25, sku: "ZAR007-S-BK" },
      { size: "M", color: "Black", colorCode: "#000000", stock: 30, sku: "ZAR007-M-BK" },
      { size: "L", color: "Black", colorCode: "#000000", stock: 22, sku: "ZAR007-L-BK" },
      { size: "XL", color: "Black", colorCode: "#000000", stock: 18, sku: "ZAR007-XL-BK" },
      { size: "S", color: "Gray", colorCode: "#808080", stock: 15, sku: "ZAR007-S-GY" },
      { size: "M", color: "Gray", colorCode: "#808080", stock: 20, sku: "ZAR007-M-GY" },
      { size: "L", color: "Gray", colorCode: "#808080", stock: 16, sku: "ZAR007-L-GY" }
    ],
    rating: 4.4,
    numReviews: 89,
    featured: false,
    fabric: "Polyester Spandex Blend",
    careInstructions: "Machine wash cold, hang dry"
  },
  {
    name: "Designer Handbag",
    description: "Elegant leather handbag with modern design. Spacious interior with multiple compartments.",
    price: 149.99,
    category: "accessories",
    subcategory: "bags",
    brand: "Zartaaz",
    images: [
      {
        url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
        alt: "Designer Handbag"
      }
    ],
    variants: [
      { size: "One Size", color: "Brown", colorCode: "#8B4513", stock: 8, sku: "ZAR008-OS-BR" },
      { size: "One Size", color: "Black", colorCode: "#000000", stock: 12, sku: "ZAR008-OS-BK" },
      { size: "One Size", color: "Tan", colorCode: "#D2B48C", stock: 6, sku: "ZAR008-OS-TN" }
    ],
    rating: 4.5,
    numReviews: 34,
    featured: false,
    fabric: "Genuine Leather",
    careInstructions: "Clean with leather conditioner"
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://zartaaz_user:zartaaz_password@localhost:27017/zartaaz');
    console.log('📦 Connected to MongoDB for seeding');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} sample products`);

    // Create admin user if doesn't exist
    const adminExists = await User.findOne({ email: 'admin@zartaaz.com' });
    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@zartaaz.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Created admin user: admin@zartaaz.com / admin123');
    }

    console.log('🎉 Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;