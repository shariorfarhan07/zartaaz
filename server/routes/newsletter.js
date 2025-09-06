const express = require('express');
const Newsletter = require('../models/Newsletter');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const APILogger = require('../middleware/apiLogger');

const router = express.Router();

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('source')
    .optional()
    .isIn(['homepage', 'footer', 'admin', 'other'])
    .withMessage('Invalid source')
], async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Newsletter Subscribe', { email: req.body.email });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      APILogger.logWarning(req, 'Newsletter Subscribe', 'Validation failed', { 
        errors: errors.array() 
      });
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
        errors: errors.array()
      });
    }

    const { email, source = 'homepage' } = req.body;

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        APILogger.logWarning(req, 'Newsletter Subscribe', 'Email already subscribed', { 
          email,
          subscriberId: existingSubscriber._id 
        });
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed to our newsletter'
        });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        existingSubscriber.unsubscribedAt = undefined;
        existingSubscriber.source = source;
        await existingSubscriber.save();

        APILogger.logSuccess(req, 'Newsletter Subscribe', { 
          subscriberId: existingSubscriber._id,
          email,
          action: 'reactivated'
        });

        return res.json({
          success: true,
          message: 'Welcome back! You have been resubscribed to our newsletter'
        });
      }
    }

    // Create new subscription
    APILogger.logDBOperation(req, 'CREATE', 'Newsletter', { email, source });
    const subscriber = await Newsletter.create({
      email,
      source
    });

    APILogger.logSuccess(req, 'Newsletter Subscribe', { 
      subscriberId: subscriber._id,
      email,
      action: 'new_subscription'
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to our newsletter!'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/newsletter/unsubscribe
// @desc    Unsubscribe from newsletter
// @access  Public
router.post('/unsubscribe', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
], async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Newsletter Unsubscribe', { email: req.body.email });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    const { email } = req.body;

    const subscriber = await Newsletter.findOne({ email });
    
    if (!subscriber) {
      APILogger.logWarning(req, 'Newsletter Unsubscribe', 'Email not found', { email });
      return res.status(404).json({
        success: false,
        message: 'Email address not found in our newsletter list'
      });
    }

    if (!subscriber.isActive) {
      APILogger.logWarning(req, 'Newsletter Unsubscribe', 'Already unsubscribed', { 
        email,
        subscriberId: subscriber._id 
      });
      return res.status(400).json({
        success: false,
        message: 'This email is already unsubscribed'
      });
    }

    // Unsubscribe
    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    APILogger.logSuccess(req, 'Newsletter Unsubscribe', { 
      subscriberId: subscriber._id,
      email
    });

    res.json({
      success: true,
      message: 'You have been unsubscribed from our newsletter'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/newsletter/subscribers
// @desc    Get newsletter subscribers (Admin only)
// @access  Private/Admin
router.get('/subscribers', auth, adminAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = 'active',
      search
    } = req.query;

    APILogger.logStart(req, 'Get Newsletter Subscribers', { 
      page, 
      limit, 
      status,
      search: search || 'none'
    });

    // Build query
    let query = {};
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Newsletter.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    APILogger.logSuccess(req, 'Get Newsletter Subscribers', { 
      subscribersFound: subscribers.length,
      totalSubscribers: total,
      pages
    });

    res.json({
      success: true,
      subscribers,
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

// @route   GET /api/newsletter/stats
// @desc    Get newsletter statistics (Admin only)
// @access  Private/Admin
router.get('/stats', auth, adminAuth, async (req, res, next) => {
  try {
    APILogger.logStart(req, 'Get Newsletter Stats');

    const totalSubscribers = await Newsletter.countDocuments({ isActive: true });
    const totalUnsubscribed = await Newsletter.countDocuments({ isActive: false });
    
    // Get subscription sources
    const sourceStats = await Newsletter.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubscriptions = await Newsletter.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo },
      isActive: true
    });

    APILogger.logSuccess(req, 'Get Newsletter Stats', { 
      totalSubscribers,
      totalUnsubscribed,
      recentSubscriptions
    });

    res.json({
      success: true,
      stats: {
        totalSubscribers,
        totalUnsubscribed,
        recentSubscriptions,
        sourceStats
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

