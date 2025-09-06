const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const APILogger = require('../middleware/apiLogger');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort = 'newest',
      order = 'desc',
      priceRange,
      size,
      color,
      inStock,
      featured,
      isActive
    } = req.query;

    APILogger.logStart(req, 'Fetch Products', { 
      page, 
      limit, 
      category, 
      search, 
      sort,
      filters: { priceRange, size, color, inStock, featured }
    });

    // Build query
    let query = {};
    
    // Only filter by isActive for public access, admin can see all
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      // Default behavior for public access
      query.isActive = true;
    }

    if (category) {
      if (category === 'sale') {
        // Special case: filter for products on sale (have discount price or sale price)
        query.$or = [
          { discountPrice: { $exists: true, $ne: null, $gt: 0 } },
          { salePrice: { $exists: true, $ne: null, $gt: 0 } },
          { onSale: true }
        ];
      } else {
        query.category = category;
      }
    }
    if (featured) query.featured = true;
    if (inStock) query.totalStock = { $gt: 0 };

    if (search) {
      // Try text search first, fallback to regex search
      try {
        query.$text = { $search: search };
      } catch (error) {
        // Fallback to regex search if text index is not available
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { subcategory: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } }
        ];
      }
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-');
      if (max === '+') {
        query.price = { $gte: parseInt(min) };
      } else {
        query.price = { $gte: parseInt(min), $lte: parseInt(max) };
      }
    }

    if (size || color) {
      const variantQuery = {};
      if (size) variantQuery['variants.size'] = size;
      if (color) variantQuery['variants.color'] = color;
      query = { ...query, ...variantQuery };
    }

    // Sort options - handle both admin and public sorting
    let sortOption = {};
    const sortOrder = order === 'asc' ? 1 : -1;
    
    switch (sort) {
      case 'price':
        sortOption = { price: sortOrder };
        break;
      case 'name':
        sortOption = { name: sortOrder };
        break;
      case 'category':
        sortOption = { category: sortOrder };
        break;
      case 'createdAt':
        sortOption = { createdAt: sortOrder };
        break;
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'popular':
        sortOption = { numReviews: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    APILogger.logDBOperation(req, 'READ', 'Product', { 
      query: { ...query, $text: query.$text ? '[TEXT_SEARCH]' : undefined },
      sort: sortOption,
      pagination: { page, limit, skip }
    });

    const products = await Product.find(query)
      .populate('category', 'name slug image')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-reviews');

    const total = await Product.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    APILogger.logSuccess(req, 'Fetch Products', { 
      productsFound: products.length,
      totalProducts: total,
      pages,
      searchQuery: search || 'none'
    });

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Fetch Single Product', { productId: req.params.id });

    const product = await Product.findById(req.params.id).populate('category', 'name slug image');

    if (!product || !product.isActive) {
      APILogger.logWarning(req, 'Fetch Single Product', 'Product not found or inactive', { 
        productId: req.params.id 
      });
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    APILogger.logSuccess(req, 'Fetch Single Product', { 
      productId: product._id,
      productName: product.name 
    });

    res.json({
      success: true,
      product
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Create Product', { productName: req.body.name });

    // Validate required fields
    const { name, description, price, category, variants } = req.body;
    
    if (!name || !description || !price || !category || !variants || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, category, and variants'
      });
    }

    // Check for duplicate SKUs in variants
    const skus = variants.map(v => v.sku).filter(Boolean);
    if (skus.length !== new Set(skus).size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SKUs found in variants'
      });
    }

    APILogger.logDBOperation(req, 'CREATE', 'Product', { name, category });
    const product = await Product.create(req.body);

    APILogger.logSuccess(req, 'Create Product', { 
      productId: product._id,
      productName: product.name 
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res, next) => {
  try {
    const productId = req.params.id;
    APILogger.logStart(req, 'Update Product', { productId });

    const product = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      APILogger.logWarning(req, 'Update Product', 'Product not found', { productId });
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    APILogger.logDBOperation(req, 'UPDATE', 'Product', { 
      productId: product._id,
      productName: product.name 
    });

    APILogger.logSuccess(req, 'Update Product', { 
      productId: product._id,
      productName: product.name 
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/products/:id
// @desc    Soft delete product
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res, next) => {
  try {
    const productId = req.params.id;
    APILogger.logStart(req, 'Delete Product', { productId });

    const product = await Product.findById(productId);

    if (!product) {
      APILogger.logWarning(req, 'Delete Product', 'Product not found', { productId });
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    APILogger.logDBOperation(req, 'SOFT_DELETE', 'Product', { 
      productId: product._id,
      productName: product.name 
    });

    APILogger.logSuccess(req, 'Delete Product', { 
      productId: product._id,
      productName: product.name 
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/products/:id/restore
// @desc    Restore soft deleted product
// @access  Private/Admin
router.put('/:id/restore', auth, adminAuth, async (req, res, next) => {
  try {
    const productId = req.params.id;
    APILogger.logStart(req, 'Restore Product', { productId });

    const product = await Product.findById(productId);

    if (!product) {
      APILogger.logWarning(req, 'Restore Product', 'Product not found', { productId });
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = true;
    await product.save();

    APILogger.logDBOperation(req, 'RESTORE', 'Product', { 
      productId: product._id,
      productName: product.name 
    });

    APILogger.logSuccess(req, 'Restore Product', { 
      productId: product._id,
      productName: product.name 
    });

    res.json({
      success: true,
      message: 'Product restored successfully',
      product
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/products/:id/permanent
// @desc    Permanently delete product
// @access  Private/Admin
router.delete('/:id/permanent', auth, adminAuth, async (req, res, next) => {
  try {
    const productId = req.params.id;
    APILogger.logStart(req, 'Permanent Delete Product', { productId });

    const product = await Product.findById(productId);

    if (!product) {
      APILogger.logWarning(req, 'Permanent Delete Product', 'Product not found', { productId });
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productName = product.name;
    await Product.findByIdAndDelete(productId);

    APILogger.logDBOperation(req, 'HARD_DELETE', 'Product', { 
      productId,
      productName 
    });

    APILogger.logSuccess(req, 'Permanent Delete Product', { 
      productId,
      productName 
    });

    res.json({
      success: true,
      message: 'Product permanently deleted'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products/bulk-action
// @desc    Bulk actions on products
// @access  Private/Admin
router.post('/bulk-action', auth, adminAuth, async (req, res, next) => {
  try {
    const { action, productIds } = req.body;
    
    APILogger.logStart(req, 'Bulk Product Action', { action, count: productIds?.length });

    if (!action || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action or product IDs'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Products activated successfully';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        message = 'Products deactivated successfully';
        break;
      case 'delete':
        updateData = { isActive: false };
        message = 'Products deleted successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateData
    );

    APILogger.logDBOperation(req, 'BULK_UPDATE', 'Product', { 
      action,
      productIds,
      modifiedCount: result.modifiedCount 
    });

    APILogger.logSuccess(req, 'Bulk Product Action', { 
      action,
      modifiedCount: result.modifiedCount 
    });

    res.json({
      success: true,
      message,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;