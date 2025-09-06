const express = require('express');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log(`🔍 Fetching orders for user: ${req.user.id} (${req.user.email})`);
    
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders for user: ${req.user.email}`);

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Public (supports both authenticated and guest users)
router.post('/', async (req, res, next) => {
  // Try to authenticate, but don't require it
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zartaaz_super_secret_jwt_key_2024_secure');
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
  } catch (error) {
    // If authentication fails, continue as guest
    console.log('Authentication failed, continuing as guest:', error.message);
    req.user = null;
  }
  try {
    console.log('📦 Creating order with data:', req.body);
    console.log('👤 User:', req.user ? `${req.user.email} (${req.user.id})` : 'Guest');

    const orderData = {
      ...req.body,
      user: req.user?.id || undefined
    };

    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    if (!orderData.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Calculate totals (recalculate on server for security)
    const subtotal = orderData.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    orderData.subtotal = subtotal;
    orderData.total = subtotal + (orderData.tax || 0) + (orderData.shipping || 0) - (orderData.discount || 0);

    const order = await Order.create(orderData);

    console.log(`✅ Order created: ${order.orderNumber} for ${req.user ? req.user.email : orderData.guestEmail}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order',
      error: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order'
    });
  }
});

// @route   GET /api/orders/:id/invoice
// @desc    Download order invoice
// @access  Private
router.get('/:id/invoice', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user?._id?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    // Check if order is paid
    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Invoice not available for unpaid orders'
      });
    }

    // Generate simple text invoice (in a real app, you'd use a PDF library)
    const invoiceText = `
ZARTAAZ INVOICE
================

Invoice #: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Customer: ${order.user?.name || 'Guest'}
Email: ${order.user?.email || order.guestEmail || 'N/A'}

SHIPPING ADDRESS:
${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}
${order.shippingAddress?.street || ''}
${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}
${order.shippingAddress?.country || ''}

ITEMS:
${order.items.map(item => 
  `${item.name} - Qty: ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`
).join('\n')}

SUMMARY:
Subtotal: $${order.subtotal.toFixed(2)}
Shipping: $${order.shipping.toFixed(2)}
Tax: $${order.tax.toFixed(2)}
${order.discount ? `Discount: -$${order.discount.toFixed(2)}` : ''}
TOTAL: $${order.total.toFixed(2)}

Payment Status: ${order.isPaid ? 'PAID' : 'UNPAID'}
Payment Method: ${order.paymentMethod || 'N/A'}

Thank you for shopping with Zartaaz!
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.txt"`);
    res.send(invoiceText);

  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading invoice'
    });
  }
});

// @route   GET /api/orders/:id/invoice-pdf
// @desc    Download order invoice as PDF
// @access  Private
router.get('/:id/invoice-pdf', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user?._id?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    // Check if order is paid
    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Invoice not available for unpaid orders'
      });
    }

    // Generate PDF invoice
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header with company info
    doc.fontSize(24).fillColor('#1f2937').text('ZARTAAZ', 50, 50);
    doc.fontSize(12).fillColor('#6b7280').text('Women\'s Fashion & Lifestyle', 50, 80);
    doc.text('Email: support@zartaaz.com', 50, 95);
    doc.text('Phone: +1 (555) 123-4567', 50, 110);
    
    // Invoice title and details
    doc.fontSize(18).fillColor('#1f2937').text('INVOICE', 400, 50);
    doc.fontSize(11).fillColor('#374151')
       .text(`Invoice #: ${order.orderNumber}`, 400, 80)
       .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 95)
       .text(`Due Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 110);

    // Line separator
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 140).lineTo(550, 140).stroke();

    // Customer info section
    doc.fontSize(14).fillColor('#1f2937').text('Bill To:', 50, 160);
    doc.fontSize(11).fillColor('#374151')
       .text(order.user?.name || 'Guest Customer', 50, 180)
       .text(order.user?.email || order.guestEmail || 'N/A', 50, 195);

    // Shipping address section
    doc.fontSize(14).fillColor('#1f2937').text('Ship To:', 300, 160);
    doc.fontSize(11).fillColor('#374151')
       .text(`${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`, 300, 180)
       .text(order.shippingAddress?.street || '', 300, 195)
       .text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}`, 300, 210)
       .text(order.shippingAddress?.country || '', 300, 225);

    // Items table
    let yPosition = 260;
    
    // Table header
    doc.fillColor('#f3f4f6').rect(50, yPosition, 500, 25).fill();
    doc.fontSize(11).fillColor('#1f2937')
       .text('Item', 60, yPosition + 8)
       .text('Qty', 300, yPosition + 8)
       .text('Price', 350, yPosition + 8)
       .text('Total', 450, yPosition + 8);

    yPosition += 25;

    // Items
    order.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      doc.fillColor(bgColor).rect(50, yPosition, 500, 20).fill();
      
      doc.fontSize(10).fillColor('#374151')
         .text(item.name || 'Product', 60, yPosition + 6)
         .text(item.quantity.toString(), 300, yPosition + 6)
         .text(`$${item.price.toFixed(2)}`, 350, yPosition + 6)
         .text(`$${(item.price * item.quantity).toFixed(2)}`, 450, yPosition + 6);
      yPosition += 20;
    });

    // Summary section
    yPosition += 20;
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(300, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 15;

    doc.fontSize(11).fillColor('#374151')
       .text('Subtotal:', 350, yPosition)
       .text(`$${order.subtotal.toFixed(2)}`, 450, yPosition);
    yPosition += 15;
    
    doc.text('Shipping:', 350, yPosition)
       .text(`$${order.shipping.toFixed(2)}`, 450, yPosition);
    yPosition += 15;
    
    doc.text('Tax:', 350, yPosition)
       .text(`$${order.tax.toFixed(2)}`, 450, yPosition);
    yPosition += 15;

    if (order.discount && order.discount > 0) {
      doc.text('Discount:', 350, yPosition)
         .text(`-$${order.discount.toFixed(2)}`, 450, yPosition);
      yPosition += 15;
    }
    
    // Total with emphasis
    doc.strokeColor('#1f2937').lineWidth(1).moveTo(350, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;
    doc.fontSize(14).fillColor('#1f2937')
       .text('TOTAL:', 350, yPosition)
       .text(`$${order.total.toFixed(2)}`, 450, yPosition);

    // Payment info
    yPosition += 40;
    doc.fontSize(11).fillColor('#374151')
       .text(`Payment Status: ${order.isPaid ? 'PAID' : 'UNPAID'}`, 50, yPosition)
       .text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 50, yPosition + 15);

    // Footer
    yPosition += 60;
    doc.fontSize(10).fillColor('#6b7280')
       .text('Thank you for shopping with Zartaaz!', 50, yPosition)
       .text('For questions about this invoice, please contact support@zartaaz.com', 50, yPosition + 15)
       .text('Visit us at www.zartaaz.com', 50, yPosition + 30);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Download PDF invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading PDF invoice'
    });
  }
});

// @route   GET /api/orders/:id/shipping-label
// @desc    Generate shipping label for admin
// @access  Private/Admin
router.get('/:id/shipping-label', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate shipping label PDF optimized for POS printers
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
      size: [612, 396], // 8.5x5.5 inches at 72 DPI (standard label size)
      margin: 20,
      autoFirstPage: false
    });

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shipping-label-${order.orderNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add page
    doc.addPage();

    // Header with company info
    doc.fontSize(16).fillColor('#000000').text('ZARTAAZ FASHION', 20, 20, { align: 'center' });
    doc.fontSize(10).fillColor('#666666').text('Premium Women\'s Clothing', 20, 40, { align: 'center' });
    
    // Horizontal line
    doc.strokeColor('#000000').lineWidth(1).moveTo(20, 55).lineTo(592, 55).stroke();

    // Two column layout
    const leftColumn = 20;
    const rightColumn = 320;
    const columnWidth = 270;

    // FROM section (left column)
    doc.fontSize(12).fillColor('#000000').text('FROM:', leftColumn, 70);
    doc.fontSize(14).text('ZARTAAZ FASHION', leftColumn, 85);
    doc.fontSize(10)
       .text('123 Fashion Street', leftColumn, 105)
       .text('New York, NY 10001', leftColumn, 120)
       .text('United States', leftColumn, 135)
       .text('Phone: +1 (555) 123-4567', leftColumn, 150)
       .text('Email: orders@zartaaz.com', leftColumn, 165);

    // TO section (right column)
    doc.fontSize(12).fillColor('#000000').text('SHIP TO:', rightColumn, 70);
    doc.fontSize(14).text(`${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`, rightColumn, 85);
    doc.fontSize(10)
       .text(order.shippingAddress?.street || '', rightColumn, 105)
       .text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}`, rightColumn, 120)
       .text(order.shippingAddress?.country || '', rightColumn, 135);

    // Order information section
    doc.strokeColor('#000000').lineWidth(1).moveTo(20, 190).lineTo(592, 190).stroke();
    
    doc.fontSize(12).fillColor('#000000').text('ORDER INFORMATION', 20, 200);
    
    // Order details in two columns
    doc.fontSize(10)
       .text(`Order Number: ${order.orderNumber}`, leftColumn, 220)
       .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, leftColumn, 235)
       .text(`Payment Status: ${order.isPaid ? 'PAID' : 'UNPAID'}`, leftColumn, 250)
       .text(`Order Status: ${order.status.toUpperCase()}`, leftColumn, 265);

    doc.fontSize(10)
       .text(`Total Amount: $${order.total.toFixed(2)}`, rightColumn, 220)
       .text(`Shipping: $${order.shipping.toFixed(2)}`, rightColumn, 235)
       .text(`Items: ${order.items?.length || 0}`, rightColumn, 250)
       .text(`Weight: ~${(order.items?.length || 1) * 0.5} lbs`, rightColumn, 265);

    // Items list
    if (order.items && order.items.length > 0) {
      doc.strokeColor('#000000').lineWidth(1).moveTo(20, 290).lineTo(592, 290).stroke();
      doc.fontSize(12).fillColor('#000000').text('ITEMS:', 20, 300);
      
      let yPos = 320;
      order.items.slice(0, 3).forEach((item, index) => {
        doc.fontSize(9)
           .text(`${index + 1}. ${item.name}`, leftColumn, yPos)
           .text(`Size: ${item.size || 'N/A'}`, leftColumn + 150, yPos)
           .text(`Qty: ${item.quantity}`, rightColumn, yPos);
        yPos += 15;
      });
      
      if (order.items.length > 3) {
        doc.fontSize(9).text(`... and ${order.items.length - 3} more items`, leftColumn, yPos);
      }
    }

    // Barcode section (bottom)
    doc.strokeColor('#000000').lineWidth(1).moveTo(20, 360).lineTo(592, 360).stroke();
    doc.fontSize(14).fillColor('#000000').text(`*${order.orderNumber}*`, 20, 370, { align: 'center' });
    
    // Footer
    doc.fontSize(8).fillColor('#666666')
       .text('Generated by Zartaaz Admin Panel', 20, 380, { align: 'left' })
       .text(`Generated: ${new Date().toLocaleString()}`, 20, 380, { align: 'right' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Generate shipping label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating shipping label'
    });
  }
});

// @route   PUT /api/orders/:id/address
// @desc    Update order shipping address (only if order is not shipped)
// @access  Private
router.put('/:id/address', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Only allow address updates for pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Address can only be updated for pending orders'
      });
    }

    // Validate shipping address
    const { shippingAddress } = req.body;
    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || 
        !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.zipCode || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required'
      });
    }

    // Update the shipping address
    order.shippingAddress = shippingAddress;
    await order.save();

    console.log(`✅ Shipping address updated for order: ${order.orderNumber}`);

    res.json({
      success: true,
      message: 'Shipping address updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order address'
    });
  }
});

module.exports = router;