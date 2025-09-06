const { logger } = require('./logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Prepare detailed error information for logging
  const errorDetails = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    errorName: err.name,
    errorCode: err.code,
    errorType: err.type,
    originalError: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  };

  // Add request body for context (sanitized)
  if (req.body && Object.keys(req.body).length > 0) {
    errorDetails.requestBody = sanitizeBody(req.body);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found - Invalid ${err.path}: ${err.value}`;
    error = { message, statusCode: 404 };
    errorDetails.errorCategory = 'INVALID_RESOURCE_ID';
    
    logger.warn('🔍 Invalid Resource ID Error', errorDetails);
  }
  // Mongoose duplicate key
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate ${field}: ${value} already exists`;
    error = { message, statusCode: 400 };
    errorDetails.errorCategory = 'DUPLICATE_ENTRY';
    errorDetails.duplicateField = field;
    errorDetails.duplicateValue = value;
    
    logger.warn('🔄 Duplicate Entry Error', errorDetails);
  }
  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
    errorDetails.errorCategory = 'VALIDATION_ERROR';
    errorDetails.validationErrors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    
    logger.warn('📝 Validation Error', errorDetails);
  }
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = { message, statusCode: 401 };
    errorDetails.errorCategory = 'INVALID_TOKEN';
    
    logger.warn('🔐 Invalid Token Error', errorDetails);
  }
  else if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    error = { message, statusCode: 401 };
    errorDetails.errorCategory = 'EXPIRED_TOKEN';
    errorDetails.expiredAt = err.expiredAt;
    
    logger.warn('⏰ Expired Token Error', errorDetails);
  }
  // File upload errors
  else if (err.code === 'LIMIT_FILE_SIZE') {
    const message = `File too large. Maximum size allowed: ${err.limit} bytes`;
    error = { message, statusCode: 400 };
    errorDetails.errorCategory = 'FILE_TOO_LARGE';
    errorDetails.fileLimit = err.limit;
    
    logger.warn('📁 File Upload Error', errorDetails);
  }
  else if (err.code === 'LIMIT_FILE_COUNT') {
    const message = `Too many files. Maximum allowed: ${err.limit}`;
    error = { message, statusCode: 400 };
    errorDetails.errorCategory = 'TOO_MANY_FILES';
    
    logger.warn('📁 File Count Error', errorDetails);
  }
  // Payment errors
  else if (err.type === 'StripeCardError') {
    const message = err.message || 'Payment processing failed';
    error = { message, statusCode: 400 };
    errorDetails.errorCategory = 'PAYMENT_ERROR';
    errorDetails.stripeCode = err.code;
    errorDetails.declineCode = err.decline_code;
    
    logger.error('💳 Payment Error', errorDetails);
  }
  // Database connection errors
  else if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    const message = 'Database connection error. Please try again later.';
    error = { message, statusCode: 503 };
    errorDetails.errorCategory = 'DATABASE_CONNECTION_ERROR';
    
    logger.error('🗄️  Database Connection Error', errorDetails);
  }
  // Rate limiting errors
  else if (err.status === 429) {
    const message = 'Too many requests. Please try again later.';
    error = { message, statusCode: 429 };
    errorDetails.errorCategory = 'RATE_LIMIT_EXCEEDED';
    
    logger.warn('🚦 Rate Limit Error', errorDetails);
  }
  // Generic server errors
  else if (error.statusCode >= 500 || !error.statusCode) {
    errorDetails.errorCategory = 'SERVER_ERROR';
    logger.error('🚨 Server Error', errorDetails);
  }
  // Client errors (4xx)
  else if (error.statusCode >= 400 && error.statusCode < 500) {
    errorDetails.errorCategory = 'CLIENT_ERROR';
    logger.warn('⚠️  Client Error', errorDetails);
  }

  // Prepare response
  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.errorDetails = errorDetails;
  }

  res.status(error.statusCode || 500).json(response);
};

// Sanitize request body to remove sensitive data
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cardNumber', 'cvv'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

module.exports = errorHandler;