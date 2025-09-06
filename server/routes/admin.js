const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const APILogger = require('../middleware/apiLogger');
const { Parser } = require('json2csv');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/stats', auth, adminAuth, async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Fetch Admin Stats');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Basic counts
    const totalUsers = await User.countDocuments({ role: 'user', isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();

    // Revenue calculations
    const totalRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const yearlyRevenue = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('orderNumber total status createdAt user guestEmail');

    // Monthly sales chart data (last 12 months)
    const monthlyStats = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    APILogger.logSuccess(req, 'Fetch Admin Stats', {
      totalUsers,
      totalAdmins,
      totalProducts,
      totalOrders
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        yearlyRevenue: yearlyRevenue[0]?.total || 0,
        recentOrders,
        monthlyStats
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private/Admin
router.get('/users', auth, adminAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    APILogger.logStart(req, 'Fetch Users', { page, limit, search, role, status });

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    // Sort options
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password -resetPasswordToken -resetPasswordExpire');

    const total = await User.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    APILogger.logSuccess(req, 'Fetch Users', { usersFound: users.length, total });

    res.json({
      success: true,
      users,
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

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (block/unblock)
// @access  Private/Admin
router.put('/users/:id/status', auth, adminAuth, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    APILogger.logStart(req, 'Update User Status', { userId, isActive });

    // Prevent self-blocking
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trying to block the last admin
    if (user.role === 'admin' && !isActive) {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last admin user'
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    APILogger.logEvent(req, 'User Status Changed', {
      targetUserId: userId,
      targetUserEmail: user.email,
      newStatus: isActive ? 'active' : 'inactive',
      adminId: req.user._id
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user details (comprehensive update)
// @access  Private/Admin
router.put('/users/:id', auth, adminAuth, async (req, res, next) => {
  try {
    const { name, email, phone, address, role, isActive, notes } = req.body;
    
    APILogger.logStart(req, 'Update User Details', { userId: req.params.id });

    const user = await User.findById(req.params.id);
    if (!user) {
      APILogger.logWarning(req, 'Update User Details', 'User not found', { userId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        APILogger.logWarning(req, 'Update User Details', 'Email already exists', { email });
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    APILogger.logSuccess(req, 'Update User Details', { 
      userId: req.params.id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (promote/demote admin)
// @access  Private/Admin
router.put('/users/:id/role', auth, adminAuth, async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    APILogger.logStart(req, 'Update User Role', { userId, role });

    // Prevent self-demotion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trying to demote the last admin
    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last admin user'
        });
      }
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    APILogger.logEvent(req, 'User Role Changed', {
      targetUserId: userId,
      targetUserEmail: user.email,
      oldRole,
      newRole: role,
      adminId: req.user._id
    });

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders with filtering and pagination
// @access  Private/Admin
router.get('/orders', auth, adminAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    APILogger.logStart(req, 'Fetch Orders', { page, limit, search, status });

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Sort options
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('items.product', 'name');

    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    APILogger.logSuccess(req, 'Fetch Orders', { ordersFound: orders.length, total });

    res.json({
      success: true,
      orders,
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

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', auth, adminAuth, async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const orderId = req.params.id;

    APILogger.logStart(req, 'Update Order Status', { orderId, status });

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    // Add to status history
    order.statusHistory.push({
      status,
      note,
      updatedBy: req.user._id
    });

    // Update delivery status
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    await order.save();

    APILogger.logEvent(req, 'Order Status Updated', {
      orderId,
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status,
      adminId: req.user._id
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/orders/:id/details
// @desc    Update order details (shipping address, payment status, etc.) - Admin only
// @access  Private/Admin
router.put('/orders/:id/details', auth, adminAuth, async (req, res, next) => {
  try {
    const { shippingAddress, isPaid, notes } = req.body;
    const orderId = req.params.id;

    APILogger.logStart(req, 'Update Order Details', { orderId });

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update shipping address if provided
    if (shippingAddress) {
      // Validate shipping address
      if (!shippingAddress.firstName || !shippingAddress.lastName || 
          !shippingAddress.street || !shippingAddress.city || 
          !shippingAddress.state || !shippingAddress.zipCode || 
          !shippingAddress.country) {
        return res.status(400).json({
          success: false,
          message: 'Complete shipping address is required'
        });
      }
      order.shippingAddress = shippingAddress;
    }

    // Update payment status if provided
    if (typeof isPaid === 'boolean') {
      order.isPaid = isPaid;
    }

    // Add admin notes
    if (notes) {
      order.adminNotes = notes;
    }

    // Add to status history
    order.statusHistory.push({
      status: order.status,
      note: 'Admin updated order details',
      updatedBy: req.user._id,
      updatedAt: new Date()
    });

    await order.save();

    APILogger.logEvent(req, 'Order Details Updated', {
      orderId,
      orderNumber: order.orderNumber,
      adminId: req.user._id,
      changes: { shippingAddress: !!shippingAddress, isPaid, notes: !!notes }
    });

    res.json({
      success: true,
      message: 'Order details updated successfully',
      order
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/reports/monthly
// @desc    Get monthly sales report
// @access  Private/Admin
router.get('/reports/monthly', auth, adminAuth, async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    APILogger.logStart(req, 'Generate Monthly Report', { year, month });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Monthly aggregation
    const monthlyData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    const report = {
      period: { year: parseInt(year), month: parseInt(month) },
      summary: monthlyData[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
      topProducts
    };

    APILogger.logSuccess(req, 'Generate Monthly Report', { year, month });

    res.json({
      success: true,
      report
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/reports/yearly
// @desc    Get yearly sales report
// @access  Private/Admin
router.get('/reports/yearly', auth, adminAuth, async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    APILogger.logStart(req, 'Generate Yearly Report', { year });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Yearly aggregation by month
    const yearlyData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Year totals
    const yearTotals = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    const report = {
      year: parseInt(year),
      monthlyBreakdown: yearlyData,
      yearTotals: yearTotals[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }
    };

    APILogger.logSuccess(req, 'Generate Yearly Report', { year });

    res.json({
      success: true,
      report
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/reports/export/monthly
// @desc    Export monthly report as CSV
// @access  Private/Admin
router.get('/reports/export/monthly', auth, adminAuth, async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    APILogger.logStart(req, 'Export Monthly Report', { year, month });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get detailed order data
    const orders = await Order.find({
      isPaid: true,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

    // Format data for CSV
    const csvData = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Date': order.createdAt.toLocaleDateString(),
      'Customer': order.user?.name || 'Guest',
      'Email': order.user?.email || order.guestEmail,
      'Status': order.status,
      'Items': order.items.length,
      'Subtotal': order.subtotal.toFixed(2),
      'Tax': order.tax.toFixed(2),
      'Shipping': order.shipping.toFixed(2),
      'Total': order.total.toFixed(2),
      'Payment Method': order.paymentMethod
    }));

    const fields = [
      'Order Number', 'Date', 'Customer', 'Email', 'Status', 
      'Items', 'Subtotal', 'Tax', 'Shipping', 'Total', 'Payment Method'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    APILogger.logSuccess(req, 'Export Monthly Report', { year, month, ordersExported: orders.length });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${year}-${month}.csv"`);
    res.send(csv);

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/reports/export/yearly
// @desc    Export yearly report as CSV
// @access  Private/Admin
router.get('/reports/export/yearly', auth, adminAuth, async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    APILogger.logStart(req, 'Export Yearly Report', { year });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get monthly summary data
    const monthlyData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Format data for CSV
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const csvData = monthlyData.map(data => ({
      'Month': monthNames[data._id.month - 1],
      'Total Orders': data.totalOrders,
      'Total Revenue': data.totalRevenue.toFixed(2),
      'Average Order Value': data.averageOrderValue.toFixed(2)
    }));

    const fields = ['Month', 'Total Orders', 'Total Revenue', 'Average Order Value'];
    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    APILogger.logSuccess(req, 'Export Yearly Report', { year, monthsExported: monthlyData.length });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="yearly-report-${year}.csv"`);
    res.send(csv);

  } catch (error) {
    next(error);
  }
});

module.exports = router;