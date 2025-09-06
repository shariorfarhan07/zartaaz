#!/usr/bin/env node

const LogAnalyzer = require('../utils/logAnalyzer');

const analyzer = new LogAnalyzer();

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'summary';
const hours = parseInt(args[1]) || 24;

console.log('🔍 Zartaaz API Log Analyzer\n');

switch (command) {
  case 'errors':
    console.log(`📊 Recent Errors (Last ${hours} hours):`);
    console.log('=' .repeat(50));
    
    const errors = analyzer.getRecentErrors(hours);
    if (errors.length === 0) {
      console.log('✅ No errors found!');
    } else {
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. [${error.timestamp}] ${error.level}`);
        console.log(`   Request: ${error.method} ${error.url}`);
        console.log(`   Error: ${error.message || error.originalError}`);
        console.log(`   Category: ${error.errorCategory || 'Unknown'}`);
        console.log(`   Request ID: ${error.requestId}`);
        if (error.userId && error.userId !== 'anonymous') {
          console.log(`   User: ${error.userId}`);
        }
      });
    }
    break;

  case 'stats':
    console.log(`📈 API Usage Statistics (Last ${hours} hours):`);
    console.log('=' .repeat(50));
    
    const stats = analyzer.getAPIUsageStats(hours);
    console.log(`Total Requests: ${stats.totalRequests || 0}`);
    console.log(`Successful: ${stats.successfulRequests || 0}`);
    console.log(`Errors: ${stats.errorRequests || 0}`);
    console.log(`Success Rate: ${stats.totalRequests ? 
      Math.round((stats.successfulRequests / stats.totalRequests) * 100) : 0}%`);
    console.log(`Average Response Time: ${stats.averageResponseTime || 0}ms`);
    
    console.log('\n🔥 Top Endpoints:');
    Object.entries(stats.endpoints || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([endpoint, count]) => {
        console.log(`   ${endpoint}: ${count} requests`);
      });
    
    if (stats.slowestRequests && stats.slowestRequests.length > 0) {
      console.log('\n🐌 Slowest Requests:');
      stats.slowestRequests.slice(0, 5).forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.endpoint} - ${req.duration}`);
      });
    }
    break;

  case 'security':
    console.log(`🛡️  Security Events (Last ${hours} hours):`);
    console.log('=' .repeat(50));
    
    const securityEvents = analyzer.getSecurityEvents(hours);
    if (securityEvents.length === 0) {
      console.log('✅ No security events found!');
    } else {
      securityEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. [${event.timestamp}] ${event.severity || 'MEDIUM'}`);
        console.log(`   Event: ${event.securityEvent || event.message}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Request: ${event.method} ${event.url}`);
        if (event.userId && event.userId !== 'anonymous') {
          console.log(`   User: ${event.userId}`);
        }
      });
    }
    break;

  case 'summary':
  default:
    console.log(`📋 Summary Report (Last ${hours} hours):`);
    console.log('=' .repeat(50));
    
    const report = analyzer.generateSummaryReport(hours);
    console.log(`Total Requests: ${report.summary.totalRequests}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Error Count: ${report.summary.errorCount}`);
    console.log(`Security Events: ${report.summary.securityEventCount}`);
    console.log(`Avg Response Time: ${report.summary.averageResponseTime}ms`);
    
    if (report.topEndpoints.length > 0) {
      console.log('\n🔥 Top Endpoints:');
      report.topEndpoints.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.endpoint} (${item.count} requests)`);
      });
    }
    
    if (report.recentErrors.length > 0) {
      console.log('\n❌ Recent Errors:');
      report.recentErrors.slice(0, 3).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.errorCategory || 'Unknown'}: ${error.message || error.originalError}`);
      });
    }
    
    if (report.securityEvents.length > 0) {
      console.log('\n🚨 Security Alerts:');
      report.securityEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.securityEvent || event.message}`);
      });
    }
    break;
}

console.log('\n' + '=' .repeat(50));
console.log('💡 Usage:');
console.log('  node scripts/viewLogs.js [command] [hours]');
console.log('  Commands: summary, errors, stats, security');
console.log('  Example: node scripts/viewLogs.js errors 12');
console.log('');