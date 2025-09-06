const { logger } = require('./logger');

/**
 * API Logger utility for consistent logging across routes
 */
class APILogger {
  
  /**
   * Log successful API operations
   * @param {Object} req - Express request object
   * @param {string} operation - Description of the operation
   * @param {Object} data - Additional data to log
   */
  static logSuccess(req, operation, data = {}) {
    const logData = {
      requestId: req.requestId,
      operation,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'guest',
      ...data,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`✅ ${operation}`, logData);
  }

  /**
   * Log API operations that start
   * @param {Object} req - Express request object
   * @param {string} operation - Description of the operation
   * @param {Object} data - Additional data to log
   */
  static logStart(req, operation, data = {}) {
    const logData = {
      requestId: req.requestId,
      operation,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'guest',
      ...data,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`🔄 ${operation} - Started`, logData);
  }

  /**
   * Log API warnings
   * @param {Object} req - Express request object
   * @param {string} operation - Description of the operation
   * @param {string} warning - Warning message
   * @param {Object} data - Additional data to log
   */
  static logWarning(req, operation, warning, data = {}) {
    const logData = {
      requestId: req.requestId,
      operation,
      warning,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'guest',
      ...data,
      timestamp: new Date().toISOString()
    };
    
    logger.warn(`⚠️  ${operation} - Warning: ${warning}`, logData);
  }

  /**
   * Log business logic events
   * @param {Object} req - Express request object
   * @param {string} event - Event description
   * @param {Object} data - Event data
   */
  static logEvent(req, event, data = {}) {
    const logData = {
      requestId: req.requestId,
      event,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'guest',
      ...data,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`📊 Event: ${event}`, logData);
  }

  /**
   * Log database operations
   * @param {Object} req - Express request object
   * @param {string} operation - Database operation (CREATE, READ, UPDATE, DELETE)
   * @param {string} model - Model name
   * @param {Object} data - Operation data
   */
  static logDBOperation(req, operation, model, data = {}) {
    const logData = {
      requestId: req.requestId,
      dbOperation: operation,
      model,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      ...data,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`🗄️  DB ${operation}: ${model}`, logData);
  }

  /**
   * Log external API calls
   * @param {Object} req - Express request object
   * @param {string} service - External service name
   * @param {string} endpoint - External endpoint
   * @param {Object} data - Call data
   */
  static logExternalCall(req, service, endpoint, data = {}) {
    const logData = {
      requestId: req.requestId,
      externalService: service,
      externalEndpoint: endpoint,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      ...data,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`🌐 External Call: ${service}`, logData);
  }

  /**
   * Log authentication events
   * @param {Object} req - Express request object
   * @param {string} event - Auth event (LOGIN, LOGOUT, REGISTER, etc.)
   * @param {Object} data - Event data
   */
  static logAuth(req, event, data = {}) {
    const logData = {
      requestId: req.requestId,
      authEvent: event,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      ...data,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`🔐 Auth: ${event}`, logData);
  }

  /**
   * Log security events
   * @param {Object} req - Express request object
   * @param {string} event - Security event
   * @param {string} severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {Object} data - Event data
   */
  static logSecurity(req, event, severity = 'MEDIUM', data = {}) {
    const logData = {
      requestId: req.requestId,
      securityEvent: event,
      severity,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      ...data,
      timestamp: new Date().toISOString()
    };
    
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      logger.error(`🚨 Security Alert [${severity}]: ${event}`, logData);
    } else {
      logger.warn(`🛡️  Security Event [${severity}]: ${event}`, logData);
    }
  }
}

module.exports = APILogger;