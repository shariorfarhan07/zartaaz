const express = require('express');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const APILogger = require('../middleware/apiLogger');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all active categories
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Get Categories');

    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .populate('productCount');

    APILogger.logSuccess(req, 'Get Categories', { 
      categoriesFound: categories.length 
    });

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/categories/all
// @desc    Get all categories (Admin only)
// @access  Private/Admin
router.get('/all', auth, adminAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive
    } = req.query;

    APILogger.logStart(req, 'Get All Categories', { 
      page, 
      limit, 
      search: search || 'none',
      isActive: isActive || 'all'
    });

    // Build query
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('productCount');

    const total = await Category.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    APILogger.logSuccess(req, 'Get All Categories', { 
      categoriesFound: categories.length,
      totalCategories: total,
      pages
    });

    res.json({
      success: true,
      categories,
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

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    APILogger.logStart(req, 'Get Single Category', { categoryId });

    const category = await Category.findById(categoryId).populate('productCount');

    if (!category) {
      APILogger.logWarning(req, 'Get Single Category', 'Category not found', { categoryId });
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    APILogger.logSuccess(req, 'Get Single Category', { 
      categoryId: category._id,
      categoryName: category.name 
    });

    res.json({
      success: true,
      category
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private/Admin
router.post('/', auth, adminAuth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('image.url')
    .notEmpty()
    .withMessage('Category image URL is required')
], async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Create Category', { name: req.body.name });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      APILogger.logWarning(req, 'Create Category', 'Validation failed', { 
        errors: errors.array() 
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } 
    });
    
    if (existingCategory) {
      APILogger.logWarning(req, 'Create Category', 'Category already exists', { 
        name: req.body.name 
      });
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    APILogger.logDBOperation(req, 'CREATE', 'Category', { name: req.body.name });
    const category = await Category.create(req.body);

    APILogger.logSuccess(req, 'Create Category', { 
      categoryId: category._id,
      categoryName: category.name 
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/:id', auth, adminAuth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    APILogger.logStart(req, 'Update Category', { categoryId });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      APILogger.logWarning(req, 'Update Category', 'Category not found', { categoryId });
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: categoryId }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update category fields
    Object.assign(category, req.body);
    await category.save();

    APILogger.logDBOperation(req, 'UPDATE', 'Category', { 
      categoryId: category._id,
      categoryName: category.name 
    });

    APILogger.logSuccess(req, 'Update Category', { 
      categoryId: category._id,
      categoryName: category.name 
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    APILogger.logStart(req, 'Delete Category', { categoryId });

    const category = await Category.findById(categoryId);

    if (!category) {
      APILogger.logWarning(req, 'Delete Category', 'Category not found', { categoryId });
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ category: categoryId });
    
    if (productCount > 0) {
      APILogger.logWarning(req, 'Delete Category', 'Category has products', { 
        categoryId,
        productCount 
      });
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} product(s) associated with it.`
      });
    }

    await Category.findByIdAndDelete(categoryId);

    APILogger.logDBOperation(req, 'DELETE', 'Category', { 
      categoryId,
      categoryName: category.name 
    });

    APILogger.logSuccess(req, 'Delete Category', { 
      categoryId,
      categoryName: category.name 
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/categories/:id/status
// @desc    Toggle category status
// @access  Private/Admin
router.put('/:id/status', auth, adminAuth, async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const { isActive } = req.body;
    
    APILogger.logStart(req, 'Toggle Category Status', { categoryId, isActive });

    const category = await Category.findById(categoryId);

    if (!category) {
      APILogger.logWarning(req, 'Toggle Category Status', 'Category not found', { categoryId });
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = isActive;
    await category.save();

    APILogger.logSuccess(req, 'Toggle Category Status', { 
      categoryId: category._id,
      categoryName: category.name,
      newStatus: isActive ? 'active' : 'inactive'
    });

    res.json({
      success: true,
      message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      category
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/categories/reorder
// @desc    Reorder categories
// @access  Private/Admin
router.put('/reorder', auth, adminAuth, async (req, res, next) => {
  try {
    const { categories } = req.body;
    
    APILogger.logStart(req, 'Reorder Categories', { count: categories?.length });

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid categories data'
      });
    }

    // Update sort order for each category
    const updatePromises = categories.map((cat, index) => 
      Category.findByIdAndUpdate(cat.id, { sortOrder: index })
    );

    await Promise.all(updatePromises);

    APILogger.logSuccess(req, 'Reorder Categories', { 
      updatedCount: categories.length 
    });

    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
