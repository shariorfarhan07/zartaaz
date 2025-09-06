const mongoose = require('mongoose');
const Product = require('../models/Product');
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

const addSaleProducts = async () => {
  try {
    console.log('Adding sample products with discount prices...');
    
    // Get a category to assign products to
    const category = await Category.findOne({ isActive: true });
    if (!category) {
      console.log('No active categories found. Please add categories first.');
      return;
    }

    const saleProducts = [
      {
        name: 'Elegant Floral Dress',
        description: 'Beautiful floral dress perfect for summer occasions. Made with premium cotton blend for comfort and style.',
        price: 89.99,
        originalPrice: 129.99,
        discountPrice: 69.99,
        onSale: true,
        category: category._id,
        brand: 'Zartaaz',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop',
            alt: 'Elegant Floral Dress'
          }
        ],
        variants: [
          { size: 'S', color: 'Pink', stock: 10, sku: 'EFD-S-PINK' },
          { size: 'M', color: 'Pink', stock: 15, sku: 'EFD-M-PINK' },
          { size: 'L', color: 'Pink', stock: 8, sku: 'EFD-L-PINK' },
          { size: 'S', color: 'Blue', stock: 12, sku: 'EFD-S-BLUE' },
          { size: 'M', color: 'Blue', stock: 18, sku: 'EFD-M-BLUE' }
        ],
        isActive: true,
        featured: true
      },
      {
        name: 'Classic Denim Jacket',
        description: 'Timeless denim jacket with modern fit. Perfect for layering and casual outings.',
        price: 79.99,
        originalPrice: 99.99,
        salePrice: 59.99,
        onSale: true,
        category: category._id,
        brand: 'Zartaaz',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=600&fit=crop',
            alt: 'Classic Denim Jacket'
          }
        ],
        variants: [
          { size: 'S', color: 'Blue', stock: 5, sku: 'CDJ-S-BLUE' },
          { size: 'M', color: 'Blue', stock: 8, sku: 'CDJ-M-BLUE' },
          { size: 'L', color: 'Blue', stock: 6, sku: 'CDJ-L-BLUE' },
          { size: 'XL', color: 'Blue', stock: 4, sku: 'CDJ-XL-BLUE' }
        ],
        isActive: true,
        featured: false
      },
      {
        name: 'Silk Scarf Collection',
        description: 'Luxurious silk scarves in various patterns. Perfect accessory for any outfit.',
        price: 45.99,
        originalPrice: 65.99,
        discountPrice: 35.99,
        onSale: true,
        category: category._id,
        brand: 'Zartaaz',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=600&fit=crop',
            alt: 'Silk Scarf Collection'
          }
        ],
        variants: [
          { size: 'One Size', color: 'Floral', stock: 20, sku: 'SSC-OS-FLORAL' },
          { size: 'One Size', color: 'Geometric', stock: 15, sku: 'SSC-OS-GEOMETRIC' },
          { size: 'One Size', color: 'Solid', stock: 25, sku: 'SSC-OS-SOLID' }
        ],
        isActive: true,
        featured: true
      },
      {
        name: 'Comfortable Sneakers',
        description: 'Stylish and comfortable sneakers perfect for everyday wear. Lightweight and breathable.',
        price: 69.99,
        originalPrice: 89.99,
        salePrice: 49.99,
        onSale: true,
        category: category._id,
        brand: 'Zartaaz',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop',
            alt: 'Comfortable Sneakers'
          }
        ],
        variants: [
          { size: 'S', color: 'White', stock: 10, sku: 'CS-S-WHITE' },
          { size: 'M', color: 'White', stock: 12, sku: 'CS-M-WHITE' },
          { size: 'L', color: 'White', stock: 8, sku: 'CS-L-WHITE' },
          { size: 'XL', color: 'White', stock: 6, sku: 'CS-XL-WHITE' },
          { size: 'S', color: 'Black', stock: 15, sku: 'CS-S-BLACK' },
          { size: 'M', color: 'Black', stock: 18, sku: 'CS-M-BLACK' }
        ],
        isActive: true,
        featured: false
      }
    ];

    // Add products to database
    const createdProducts = await Product.insertMany(saleProducts);
    console.log(`Successfully added ${createdProducts.length} sale products:`);
    
    createdProducts.forEach(product => {
      console.log(`- ${product.name} (${product.discountPrice || product.salePrice ? 'On Sale' : 'Regular'})`);
    });
    
    console.log('\nSale products added successfully!');
  } catch (error) {
    console.error('Error adding sale products:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await addSaleProducts();
};

runScript();
