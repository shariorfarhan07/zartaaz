// MongoDB initialization script
db = db.getSiblingDB('zartaaz');

// Create initial collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('newsletters');
db.createCollection('statuses');

// Add sample status messages
db.statuses.insertMany([
  {
    title: "System Maintenance Scheduled",
    message: "The system will be under maintenance on Sunday from 2 AM to 4 AM EST. Some features may be temporarily unavailable.",
    type: "maintenance",
    priority: "medium",
    targetAudience: "admin",
    isActive: true,
    isDismissible: true,
    actionRequired: false,
    startDate: new Date(),
    createdBy: null,
    createdAt: new Date()
  },
  {
    title: "Database Optimization Complete",
    message: "Recent database optimization has improved query performance by 30%. Monitor system metrics for any issues.",
    type: "success",
    priority: "low",
    targetAudience: "admin",
    isActive: true,
    isDismissible: true,
    actionRequired: false,
    startDate: new Date(),
    createdBy: null,
    createdAt: new Date()
  },
  {
    title: "Low Stock Alert",
    message: "Several products are running low on stock. Please review and update inventory levels.",
    type: "warning",
    priority: "high",
    targetAudience: "admin",
    isActive: true,
    isDismissible: true,
    actionRequired: true,
    actionUrl: "/admin/products",
    actionText: "Review Products",
    startDate: new Date(),
    createdBy: null,
    createdAt: new Date()
  }
]);

// Add sample products
db.products.insertMany([
  {
    name: "Elegant Floral Dress",
    description: "Beautiful floral print dress perfect for any occasion",
    price: 89.99,
    category: "ethnic",
    images: [{
      url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
      alt: "Elegant Floral Dress"
    }],
    variants: [
      { size: "S", color: "Blue", colorCode: "#0066CC", stock: 15, sku: "EFD-S-BLU" },
      { size: "M", color: "Blue", colorCode: "#0066CC", stock: 20, sku: "EFD-M-BLU" },
      { size: "L", color: "Blue", colorCode: "#0066CC", stock: 18, sku: "EFD-L-BLU" },
      { size: "XL", color: "Blue", colorCode: "#0066CC", stock: 12, sku: "EFD-XL-BLU" },
      { size: "S", color: "Pink", colorCode: "#FF69B4", stock: 8, sku: "EFD-S-PNK" },
      { size: "M", color: "Pink", colorCode: "#FF69B4", stock: 10, sku: "EFD-M-PNK" },
      { size: "L", color: "Pink", colorCode: "#FF69B4", stock: 7, sku: "EFD-L-PNK" },
      { size: "XL", color: "Pink", colorCode: "#FF69B4", stock: 5, sku: "EFD-XL-PNK" }
    ],
    totalStock: 95,
    featured: true,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Classic White Blouse",
    description: "Timeless white blouse for professional and casual wear",
    price: 45.99,
    category: "formal",
    images: [{
      url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400",
      alt: "Classic White Blouse"
    }],
    variants: [
      { size: "XS", color: "White", colorCode: "#FFFFFF", stock: 12, sku: "CWB-XS-WHT" },
      { size: "S", color: "White", colorCode: "#FFFFFF", stock: 18, sku: "CWB-S-WHT" },
      { size: "M", color: "White", colorCode: "#FFFFFF", stock: 22, sku: "CWB-M-WHT" },
      { size: "L", color: "White", colorCode: "#FFFFFF", stock: 16, sku: "CWB-L-WHT" },
      { size: "XS", color: "Cream", colorCode: "#F5F5DC", stock: 8, sku: "CWB-XS-CRM" },
      { size: "S", color: "Cream", colorCode: "#F5F5DC", stock: 14, sku: "CWB-S-CRM" },
      { size: "M", color: "Cream", colorCode: "#F5F5DC", stock: 10, sku: "CWB-M-CRM" }
    ],
    totalStock: 100,
    featured: true,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Denim Jacket",
    description: "Stylish denim jacket with modern cut",
    price: 65.99,
    category: "casual",
    images: [{
      url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400",
      alt: "Denim Jacket"
    }],
    variants: [
      { size: "S", color: "Blue", colorCode: "#4169E1", stock: 25, sku: "DJ-S-BLU" },
      { size: "M", color: "Blue", colorCode: "#4169E1", stock: 30, sku: "DJ-M-BLU" },
      { size: "L", color: "Blue", colorCode: "#4169E1", stock: 28, sku: "DJ-L-BLU" },
      { size: "XL", color: "Blue", colorCode: "#4169E1", stock: 20, sku: "DJ-XL-BLU" },
      { size: "S", color: "Black", colorCode: "#000000", stock: 15, sku: "DJ-S-BLK" },
      { size: "M", color: "Black", colorCode: "#000000", stock: 18, sku: "DJ-M-BLK" },
      { size: "L", color: "Black", colorCode: "#000000", stock: 16, sku: "DJ-L-BLK" },
      { size: "XL", color: "Black", colorCode: "#000000", stock: 12, sku: "DJ-XL-BLK" }
    ],
    totalStock: 164,
    featured: false,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "High-Waist Jeans",
    description: "Comfortable high-waist jeans with stretch",
    price: 55.99,
    category: "casual",
    images: [{
      url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
      alt: "High-Waist Jeans"
    }],
    variants: [
      { size: "One Size", color: "Blue", colorCode: "#191970", stock: 35, sku: "HWJ-OS-BLU" },
      { size: "One Size", color: "Black", colorCode: "#000000", stock: 28, sku: "HWJ-OS-BLK" }
    ],
    totalStock: 63,
    featured: true,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Summer Maxi Dress",
    description: "Light and breezy maxi dress for summer days",
    price: 75.99,
    category: "ethnic",
    images: [{
      url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400",
      alt: "Summer Maxi Dress"
    }],
    variants: [
      { size: "S", color: "Yellow", colorCode: "#FFD700", stock: 10, sku: "SMD-S-YLW" },
      { size: "M", color: "Yellow", colorCode: "#FFD700", stock: 15, sku: "SMD-M-YLW" },
      { size: "L", color: "Yellow", colorCode: "#FFD700", stock: 12, sku: "SMD-L-YLW" },
      { size: "S", color: "Green", colorCode: "#228B22", stock: 8, sku: "SMD-S-GRN" },
      { size: "M", color: "Green", colorCode: "#228B22", stock: 14, sku: "SMD-M-GRN" },
      { size: "L", color: "Green", colorCode: "#228B22", stock: 11, sku: "SMD-L-GRN" }
    ],
    totalStock: 70,
    featured: true,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Knit Sweater",
    description: "Cozy knit sweater for chilly days",
    price: 42.99,
    category: "casual",
    images: [{
      url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
      alt: "Knit Sweater"
    }],
    variants: [
      { size: "XS", color: "Beige", colorCode: "#F5F5DC", stock: 20, sku: "KS-XS-BEG" },
      { size: "S", color: "Beige", colorCode: "#F5F5DC", stock: 25, sku: "KS-S-BEG" },
      { size: "M", color: "Beige", colorCode: "#F5F5DC", stock: 30, sku: "KS-M-BEG" },
      { size: "L", color: "Beige", colorCode: "#F5F5DC", stock: 22, sku: "KS-L-BEG" },
      { size: "XL", color: "Beige", colorCode: "#F5F5DC", stock: 18, sku: "KS-XL-BEG" },
      { size: "XS", color: "Gray", colorCode: "#808080", stock: 15, sku: "KS-XS-GRY" },
      { size: "S", color: "Gray", colorCode: "#808080", stock: 20, sku: "KS-S-GRY" },
      { size: "M", color: "Gray", colorCode: "#808080", stock: 25, sku: "KS-M-GRY" },
      { size: "L", color: "Gray", colorCode: "#808080", stock: 18, sku: "KS-L-GRY" }
    ],
    totalStock: 193,
    featured: false,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Product Without Image",
    description: "This product has no image to test the red highlighting feature",
    price: 29.99,
    category: "accessories",
    images: [],
    variants: [
      { size: "One Size", color: "Red", colorCode: "#FF0000", stock: 50, sku: "PWI-OS-RED" }
    ],
    totalStock: 50,
    featured: false,
    isActive: true,
    createdAt: new Date()
  },
  {
    name: "Low Stock Product",
    description: "This product has very low stock to test stock warnings",
    price: 39.99,
    category: "footwear",
    images: [{
      url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
      alt: "Low Stock Product"
    }],
    variants: [
      { size: "One Size", color: "Black", colorCode: "#000000", stock: 2, sku: "LSP-OS-BLK" }
    ],
    totalStock: 2,
    featured: false,
    isActive: true,
    createdAt: new Date()
  }
]);

print('✅ Zartaaz database initialized successfully with sample products!');