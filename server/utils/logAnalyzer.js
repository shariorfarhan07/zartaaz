const fs = require('fs');
const path = require('path');

/**
 * Log Analyzer utility for parsing and analyzing API logs
 */
class LogAnalyzer {
  
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
  }

  /**
   * Get recent API errors
   * @param {number} hours - Hours to look back (default: 24)
   * @returns {Array} Array of error log entries
   */
  getRecentErrors(hours = 24) {
    try {
      const errorLogPath = path.join(this.logsDir, 'error.log');
      if (!fs.existsSync(errorLogPath)) return [];

      const content = fs.readFileSync(errorLogPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      return lines
        .map(line => this.parseLogLine(line))
        .filter(entry => entry && new Date(entry.timestamp) > cutoffTime)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
    } catch (error) {
      console.error('Error reading error logs:', error);
      return [];
    }
  }

  /**
   * Get API usage statistics
   * @param {number} hours - Hours to look back (default: 24)
   * @returns {Object} Usage statistics
   */
  getAPIUsageStats(hours = 24) {
    try {
      const apiLogPath = path.join(this.logsDir, 'api.log');
      if (!fs.existsSync(apiLogPath)) return {};

      const content = fs.readFileSync(apiLogPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const entries = lines
        .map(line => this.parseLogLine(line))
        .filter(entry => entry && new Date(entry.timestamp) > cutoffTime);

      const stats = {
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        endpoints: {},
        methods: {},
        statusCodes: {},
        averageResponseTime: 0,
        slowestRequests: [],
        mostActiveUsers: {},
        errorsByType: {}
      };

      let totalDuration = 0;
      let durationCount = 0;

      entries.forEach(entry => {
        if (entry.method && entry.url) {
          stats.totalRequests++;
          
          // Count by endpoint
          const endpoint = `${entry.method} ${entry.url}`;
          stats.endpoints[endpoint] = (stats.endpoints[endpoint] || 0) + 1;
          
          // Count by method
          stats.methods[entry.method] = (stats.methods[entry.method] || 0) + 1;
          
          // Count by status code
          if (entry.status) {
            stats.statusCodes[entry.status] = (stats.statusCodes[entry.status] || 0) + 1;
            
            if (entry.status >= 200 && entry.status < 400) {
              stats.successfulRequests++;
            } else {
              stats.errorRequests++;
            }
          }
          
          // Track response times
          if (entry.duration) {
            const duration = parseInt(entry.duration.replace('ms', ''));
            totalDuration += duration;
            durationCount++;
            
            // Track slowest requests
            stats.slowestRequests.push({
              endpoint,
              duration: entry.duration,
              timestamp: entry.timestamp,
              requestId: entry.requestId
            });
          }
          
          // Track user activity
          if (entry.userId && entry.userId !== 'anonymous') {
            stats.mostActiveUsers[entry.userId] = (stats.mostActiveUsers[entry.userId] || 0) + 1;
          }
          
          // Track error types
          if (entry.errorCategory) {
            stats.errorsByType[entry.errorCategory] = (stats.errorsByType[entry.errorCategory] || 0) + 1;
          }
        }
      });

      // Calculate average response time
      if (durationCount > 0) {
        stats.averageResponseTime = Math.round(totalDuration / durationCount);
      }

      // Sort slowest requests
      stats.slowestRequests = stats.slowestRequests
        .sort((a, b) => parseInt(b.duration) - parseInt(a.duration))
        .slice(0, 10);

      return stats;
      
    } catch (error) {
      console.error('Error analyzing API logs:', error);
      return {};
    }
  }

  /**
   * Get security events
   * @param {number} hours - Hours to look back (default: 24)
   * @returns {Array} Array of security events
   */
  getSecurityEvents(hours = 24) {
    try {
      const combinedLogPath = path.join(this.logsDir, 'combined.log');
      if (!fs.existsSync(combinedLogPath)) return [];

      const content = fs.readFileSync(combinedLogPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      return lines
        .map(line => this.parseLogLine(line))
        .filter(entry => {
          return entry && 
                 new Date(entry.timestamp) > cutoffTime &&
                 (entry.securityEvent || entry.message.includes('Security'));
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
    } catch (error) {
      console.error('Error reading security logs:', error);
      return [];
    }
  }

  /**
   * Parse a log line into structured data
   * @param {string} line - Log line to parse
   * @returns {Object|null} Parsed log entry
   */
  parseLogLine(line) {
    try {
      // Try to extract JSON from the log line
      const jsonMatch = line.match(/\{.*\}$/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        
        // Extract timestamp and level from the beginning of the line
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        const levelMatch = line.match(/\[(ERROR|WARN|INFO|DEBUG)\]/);
        
        return {
          timestamp: timestampMatch ? timestampMatch[1] : jsonData.timestamp,
          level: levelMatch ? levelMatch[1] : 'INFO',
          ...jsonData
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a summary report
   * @param {number} hours - Hours to look back (default: 24)
   * @returns {Object} Summary report
   */
  generateSummaryReport(hours = 24) {
    const errors = this.getRecentErrors(hours);
    const stats = this.getAPIUsageStats(hours);
    const securityEvents = this.getSecurityEvents(hours);

    return {
      timeRange: `Last ${hours} hours`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRequests: stats.totalRequests || 0,
        successRate: stats.totalRequests ? 
          Math.round((stats.successfulRequests / stats.totalRequests) * 100) : 0,
        errorCount: errors.length,
        securityEventCount: securityEvents.length,
        averageResponseTime: stats.averageResponseTime || 0
      },
      topEndpoints: Object.entries(stats.endpoints || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count })),
      recentErrors: errors.slice(0, 10),
      securityEvents: securityEvents.slice(0, 5),
      slowestRequests: stats.slowestRequests || []
    };
  }
}

module.exports = LogAnalyzer;