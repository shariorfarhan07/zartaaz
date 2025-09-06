const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'zartaaz-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // API specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'api.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        // Add key metadata for console
        if (meta.method && meta.url) {
          log += ` | ${meta.method} ${meta.url}`;
        }
        if (meta.status) {
          log += ` | Status: ${meta.status}`;
        }
        if (meta.duration) {
          log += ` | Duration: ${meta.duration}`;
        }
        if (meta.userId) {
          log += ` | User: ${meta.userId}`;
        }

        return log;
      })
    )
  }));
}

// Enhanced HTTP request logging middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  // Add request ID to request object for tracking
  req.requestId = requestId;

  // Extract user info if available
  let userId = null;
  let userRole = null;

  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zartaaz_secret');
      userId = decoded.id;
      userRole = decoded.role;
    } catch (err) {
      // Token invalid, continue without user info
    }
  }

  // Log incoming request
  const requestData = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId,
    userRole,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    timestamp: new Date().toISOString()
  };

  logger.info(`🔄 API Request Started`, requestData);

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.responseBody = data;
    originalSend.call(this, data);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId,
      userRole,
      responseSize: res.get('content-length') || 0,
      timestamp: new Date().toISOString()
    };

    // Add response body for errors (sanitized)
    if (res.statusCode >= 400 && res.responseBody) {
      try {
        const responseBody = JSON.parse(res.responseBody);
        responseData.errorMessage = responseBody.message;
        responseData.errorDetails = responseBody.errors;
      } catch (e) {
        // Response body is not JSON
      }
    }

    if (res.statusCode >= 500) {
      logger.error(`❌ API Request Failed (Server Error)`, responseData);
    } else if (res.statusCode >= 400) {
      logger.warn(`⚠️  API Request Failed (Client Error)`, responseData);
    } else {
      logger.info(`✅ API Request Completed`, responseData);
    }
  });

  next();
};

// Sanitize request body to remove sensitive data
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

// Export logger instance and middleware
module.exports = httpLogger;
module.exports.logger = logger;