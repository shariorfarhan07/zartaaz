# 📊 Zartaaz API Logging System

This enhanced logging system provides comprehensive tracking of API requests, errors, and security events to help you understand what's happening in your application.

## 🎯 What You Get

### Detailed Request Logging
- **Request ID tracking** - Every request gets a unique ID for easy tracing
- **User context** - Tracks which user made each request
- **Performance metrics** - Response times and request duration
- **Request/Response data** - Sanitized request bodies and error responses

### Error Tracking
- **Categorized errors** - Different error types (validation, auth, database, etc.)
- **Stack traces** - Full error details in development
- **Context preservation** - What user, what request, what data caused the error
- **Security events** - Failed login attempts, suspicious activity

### Log Files
- `logs/error.log` - Only errors and warnings
- `logs/api.log` - All API requests and responses  
- `logs/combined.log` - Everything combined
- Automatic log rotation (5MB max, 5 files kept)

## 🚀 How to Use

### 1. In Your Route Handlers

```javascript
const APILogger = require('../middleware/apiLogger');

router.post('/products', async (req, res, next) => {
  try {
    // Log operation start
    APILogger.logStart(req, 'Create Product', { 
      productName: req.body.name 
    });

    // Log database operations
    APILogger.logDBOperation(req, 'CREATE', 'Product', { 
      name: req.body.name,
      category: req.body.category 
    });

    const product = await Product.create(req.body);

    // Log success
    APILogger.logSuccess(req, 'Create Product', { 
      productId: product._id 
    });

    res.json({ success: true, product });
  } catch (error) {
    // Error automatically logged by error handler
    next(error);
  }
});
```

### 2. Available Logging Methods

```javascript
// Basic operations
APILogger.logStart(req, 'Operation Name', data);
APILogger.logSuccess(req, 'Operation Name', data);
APILogger.logWarning(req, 'Operation Name', 'Warning message', data);

// Specific event types
APILogger.logAuth(req, 'LOGIN', { userId, email });
APILogger.logDBOperation(req, 'CREATE', 'Product', { productId });
APILogger.logExternalCall(req, 'Stripe', '/charges', { amount });
APILogger.logSecurity(req, 'Suspicious activity', 'HIGH', data);
APILogger.logEvent(req, 'Product purchased', { productId, amount });
```

### 3. View Your Logs

```bash
# Quick summary
npm run logs

# View recent errors
npm run logs:errors

# API usage statistics  
npm run logs:stats

# Security events
npm run logs:security

# Custom time range (last 12 hours)
node scripts/viewLogs.js summary 12
```

## 📈 Log Analysis Examples

### View Recent Errors
```bash
npm run logs:errors
```
Shows:
- What API endpoint failed
- What user was involved
- Error category and message
- Request ID for tracing

### API Usage Stats
```bash
npm run logs:stats
```
Shows:
- Total requests and success rate
- Most popular endpoints
- Slowest requests
- Most active users

### Security Events
```bash
npm run logs:security
```
Shows:
- Failed login attempts
- Suspicious IP activity
- Token-related issues
- Account access problems

## 🔍 Understanding Your Logs

### Request Flow Tracking
Each request gets a unique `requestId` that appears in all related log entries:

```
2024-01-15 10:30:15 [INFO]: 🔄 API Request Started
{
  "requestId": "abc123def",
  "method": "POST",
  "url": "/api/products",
  "userId": "user_456"
}

2024-01-15 10:30:16 [INFO]: 🗄️ DB CREATE: Product  
{
  "requestId": "abc123def",
  "productName": "Summer Dress"
}

2024-01-15 10:30:16 [INFO]: ✅ API Request Completed
{
  "requestId": "abc123def",
  "status": 201,
  "duration": "150ms"
}
```

### Error Categories
- `VALIDATION_ERROR` - Invalid input data
- `INVALID_TOKEN` / `EXPIRED_TOKEN` - Authentication issues
- `DUPLICATE_ENTRY` - Trying to create something that exists
- `PAYMENT_ERROR` - Stripe/payment failures
- `DATABASE_CONNECTION_ERROR` - DB connectivity issues
- `SERVER_ERROR` - Unexpected server problems

## 🛡️ Security Features

- **Sensitive data redaction** - Passwords, tokens automatically hidden
- **Failed login tracking** - Multiple attempts from same IP
- **Suspicious activity detection** - Unusual patterns
- **IP-based monitoring** - Track requests by source

## 🎛️ Configuration

Set log level in your `.env`:
```
LOG_LEVEL=info  # debug, info, warn, error
```

## 💡 Pro Tips

1. **Use Request IDs** - When debugging, search logs by `requestId` to see the full request flow
2. **Monitor Error Categories** - Patterns in error types help identify systemic issues  
3. **Track Performance** - Watch for endpoints with consistently slow response times
4. **Security Monitoring** - Regular checks of security events prevent issues
5. **User Activity** - Track which users are most active or causing errors

## 🔧 Troubleshooting

**Logs not appearing?**
- Check if `logs/` directory exists
- Verify file permissions
- Ensure Winston is properly configured

**Too many logs?**
- Increase log rotation size in `logger.js`
- Adjust `LOG_LEVEL` to `warn` or `error` only
- Use `excludePattern` in log analysis

**Performance impact?**
- Logging is asynchronous and minimal
- File rotation prevents disk space issues
- Consider log level adjustment in production