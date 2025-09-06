const mongoose = require('mongoose');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zartaaz', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateProductShipping = async () => {
  try {
    console.log('🔄 Updating product shipping information...');

    // Update all products that don't have shipping fields
    const result = await Product.updateMany(
      {
        $or: [
          { shippingCharge: { $exists: false } },
          { freeShippingThreshold: { $exists: false } },
          { shippingMethod: { $exists: false } },
          { estimatedDeliveryDays: { $exists: false } }
        ]
      },
      {
        $set: {
          shippingCharge: 10,
          freeShippingThreshold: 100,
          shippingMethod: 'standard',
          estimatedDeliveryDays: 3
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} products with shipping information`);
    
    // Show some examples
    const sampleProducts = await Product.find({}).limit(3).select('name shippingCharge freeShippingThreshold shippingMethod estimatedDeliveryDays');
    console.log('\n📦 Sample updated products:');
    sampleProducts.forEach(product => {
      console.log(`- ${product.name}: $${product.shippingCharge} shipping, free over $${product.freeShippingThreshold}, ${product.shippingMethod} delivery in ${product.estimatedDeliveryDays} days`);
    });

  } catch (error) {
    console.error('❌ Error updating product shipping:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

updateProductShipping();
