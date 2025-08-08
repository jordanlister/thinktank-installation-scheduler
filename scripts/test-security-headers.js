#!/usr/bin/env node

// Think Tank Technologies - Security Headers Testing Script

const https = require('https');
const http = require('http');

/**
 * Security headers testing configuration
 */
const SECURITY_TESTS = {
  // Required security headers with expected values/patterns
  requiredHeaders: {
    'content-security-policy': {
      required: true,
      severity: 'critical',
      description: 'Content Security Policy prevents XSS attacks',
      validationPattern: /^default-src/i,
      recommendations: [
        'Implement strict CSP with nonces for inline scripts',
        'Use report-uri to monitor violations',
        'Avoid unsafe-inline and unsafe-eval directives'
      ]
    },
    'x-content-type-options': {
      required: true,
      severity: 'high',
      description: 'Prevents MIME type sniffing attacks',
      expectedValue: 'nosniff',
      recommendations: ['Set X-Content-Type-Options to nosniff']
    },
    'x-frame-options': {
      required: true,
      severity: 'high',
      description: 'Prevents clickjacking attacks',
      allowedValues: ['DENY', 'SAMEORIGIN'],
      recommendations: ['Use DENY or SAMEORIGIN to prevent clickjacking']
    },
    'x-xss-protection': {
      required: true,
      severity: 'medium',
      description: 'Enables browser XSS filtering',
      validationPattern: /^1/,
      recommendations: ['Enable XSS protection with "1; mode=block"']
    },
    'strict-transport-security': {
      required: true,
      severity: 'critical',
      description: 'Enforces HTTPS connections',
      validationPattern: /max-age=\d+/,
      httpsOnly: true,
      recommendations: [
        'Set HSTS with max-age of at least 31536000 (1 year)',
        'Include includeSubDomains directive',
        'Consider preload directive for maximum security'
      ]
    },
    'referrer-policy': {
      required: true,
      severity: 'medium',
      description: 'Controls referrer information leakage',
      allowedValues: [
        'strict-origin-when-cross-origin',
        'strict-origin',
        'same-origin',
        'no-referrer'
      ],
      recommendations: ['Use strict-origin-when-cross-origin for balanced security and functionality']
    },
    'permissions-policy': {
      required: false,
      severity: 'low',
      description: 'Controls browser feature access',
      validationPattern: /.+/,
      recommendations: ['Implement Permissions Policy to limit browser features']
    },
    'cross-origin-embedder-policy': {
      required: false,
      severity: 'low',
      description: 'Controls cross-origin resource embedding',
      expectedValue: 'require-corp',
      recommendations: ['Set COEP to require-corp for enhanced security']
    },
    'cross-origin-opener-policy': {
      required: false,
      severity: 'low',
      description: 'Isolates browsing context',
      expectedValue: 'same-origin',
      recommendations: ['Set COOP to same-origin to prevent cross-origin attacks']
    },
    'cross-origin-resource-policy': {
      required: false,
      severity: 'low',
      description: 'Controls cross-origin resource access',
      allowedValues: ['same-site', 'same-origin', 'cross-origin'],
      recommendations: ['Set CORP to same-site for marketing sites']
    }
  },

  // Headers that should NOT be present (security risks)
  dangerousHeaders: {
    'server': {
      severity: 'low',
      description: 'Server header reveals server software information',
      recommendation: 'Remove or obfuscate server header to prevent information disclosure'
    },
    'x-powered-by': {
      severity: 'low',
      description: 'X-Powered-By header reveals technology stack',
      recommendation: 'Remove X-Powered-By header to prevent technology fingerprinting'
    },
    'x-aspnet-version': {
      severity: 'medium',
      description: 'ASP.NET version disclosure',
      recommendation: 'Remove version disclosure headers'
    },
    'x-generator': {
      severity: 'low',
      description: 'Generator header reveals CMS/framework information',
      recommendation: 'Remove generator identification headers'
    }
  },

  // Cache control security checks
  cacheHeaders: {
    'cache-control': {
      severity: 'medium',
      description: 'Controls caching behavior',
      securePatterns: [/no-cache/, /no-store/, /private/],
      recommendations: [
        'Use no-cache, no-store for sensitive pages',
        'Use private for user-specific content',
        'Set appropriate max-age for static resources'
      ]
    }
  }
};

/**
 * Security headers test results
 */
class SecurityHeadersTestResults {
  constructor() {
    this.url = '';
    this.timestamp = new Date().toISOString();
    this.isHttps = false;
    this.headers = {};
    this.results = {
      score: 100,
      grade: 'A+',
      passed: [],
      failed: [],
      warnings: [],
      recommendations: []
    };
  }

  addPass(header, description, value) {
    this.results.passed.push({ header, description, value });
  }

  addFail(header, description, severity, recommendations = []) {
    this.results.failed.push({ header, description, severity, recommendations });
    
    // Deduct points based on severity
    const points = {
      'critical': 25,
      'high': 15,
      'medium': 10,
      'low': 5
    };
    
    this.results.score -= points[severity] || 5;
  }

  addWarning(header, description, recommendation) {
    this.results.warnings.push({ header, description, recommendation });
    this.results.score -= 2;
  }

  addRecommendation(recommendation) {
    this.results.recommendations.push(recommendation);
  }

  calculateGrade() {
    const score = Math.max(0, this.results.score);
    
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }

  getScore() {
    return Math.max(0, this.results.score);
  }
}

/**
 * Security headers tester
 */
class SecurityHeadersTester {
  constructor() {
    this.results = new SecurityHeadersTestResults();
  }

  /**
   * Tests security headers for a given URL
   */
  async testUrl(url) {
    console.log(`🔍 Testing security headers for: ${url}\n`);
    
    try {
      this.results.url = url;
      this.results.isHttps = url.startsWith('https://');
      
      // Fetch headers
      const headers = await this.fetchHeaders(url);
      this.results.headers = headers;
      
      // Run security tests
      this.testRequiredHeaders(headers);
      this.testDangerousHeaders(headers);
      this.testCacheHeaders(headers);
      this.generateRecommendations();
      
      // Calculate final grade
      this.results.grade = this.results.calculateGrade();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Failed to test headers:', error.message);
      throw error;
    }
  }

  /**
   * Fetches HTTP headers from URL
   */
  async fetchHeaders(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https://') ? https : http;
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: 10000
      };

      const req = client.request(options, (res) => {
        const headers = {};
        
        // Convert headers to lowercase for consistent checking
        Object.keys(res.headers).forEach(key => {
          headers[key.toLowerCase()] = res.headers[key];
        });
        
        resolve(headers);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Tests required security headers
   */
  testRequiredHeaders(headers) {
    Object.entries(SECURITY_TESTS.requiredHeaders).forEach(([headerName, config]) => {
      const headerValue = headers[headerName.toLowerCase()];
      
      // Skip HTTPS-only headers for HTTP sites
      if (config.httpsOnly && !this.results.isHttps) {
        this.results.addWarning(
          headerName,
          `${config.description} (HTTPS only)`,
          'This header is only applicable for HTTPS sites'
        );
        return;
      }
      
      if (!headerValue) {
        if (config.required) {
          this.results.addFail(
            headerName,
            `Missing required header: ${config.description}`,
            config.severity,
            config.recommendations
          );
        } else {
          this.results.addWarning(
            headerName,
            `Optional header not found: ${config.description}`,
            config.recommendations[0]
          );
        }
        return;
      }
      
      // Validate header value
      let isValid = false;
      
      if (config.expectedValue) {
        isValid = headerValue.toLowerCase() === config.expectedValue.toLowerCase();
      } else if (config.allowedValues) {
        isValid = config.allowedValues.some(allowed => 
          headerValue.toLowerCase().includes(allowed.toLowerCase())
        );
      } else if (config.validationPattern) {
        isValid = config.validationPattern.test(headerValue);
      } else {
        isValid = true; // Just check presence
      }
      
      if (isValid) {
        this.results.addPass(headerName, config.description, headerValue);
      } else {
        this.results.addFail(
          headerName,
          `Invalid value for ${config.description}: ${headerValue}`,
          config.severity,
          config.recommendations
        );
      }
    });
  }

  /**
   * Tests for dangerous headers that should not be present
   */
  testDangerousHeaders(headers) {
    Object.entries(SECURITY_TESTS.dangerousHeaders).forEach(([headerName, config]) => {
      if (headers[headerName.toLowerCase()]) {
        this.results.addWarning(
          headerName,
          config.description,
          config.recommendation
        );
      }
    });
  }

  /**
   * Tests cache control headers
   */
  testCacheHeaders(headers) {
    Object.entries(SECURITY_TESTS.cacheHeaders).forEach(([headerName, config]) => {
      const headerValue = headers[headerName.toLowerCase()];
      
      if (headerValue) {
        const hasSecurePattern = config.securePatterns.some(pattern => 
          pattern.test(headerValue)
        );
        
        if (hasSecurePattern) {
          this.results.addPass(headerName, config.description, headerValue);
        } else {
          this.results.addWarning(
            headerName,
            `Cache header may not be optimally configured: ${headerValue}`,
            config.recommendations[0]
          );
        }
      }
    });
  }

  /**
   * Generates additional recommendations
   */
  generateRecommendations() {
    // Add general recommendations based on results
    if (!this.results.isHttps) {
      this.results.addRecommendation('Enable HTTPS for all traffic to improve security');
    }
    
    if (this.results.failed.length > 0) {
      this.results.addRecommendation('Address all failed security header checks immediately');
    }
    
    if (this.results.warnings.length > 5) {
      this.results.addRecommendation('Consider implementing optional security headers for enhanced protection');
    }
    
    // CSP specific recommendations
    const cspHeader = this.results.headers['content-security-policy'];
    if (cspHeader) {
      if (cspHeader.includes('unsafe-inline')) {
        this.results.addRecommendation('Remove unsafe-inline from CSP and use nonces instead');
      }
      if (cspHeader.includes('unsafe-eval')) {
        this.results.addRecommendation('Remove unsafe-eval from CSP to prevent code injection');
      }
      if (!cspHeader.includes('report-uri')) {
        this.results.addRecommendation('Add report-uri to CSP to monitor violations');
      }
    }
  }

  /**
   * Generates comprehensive test report
   */
  generateReport() {
    console.log('='.repeat(80));
    console.log('🛡️  SECURITY HEADERS TEST REPORT');
    console.log('='.repeat(80));
    
    const score = this.results.getScore();
    const grade = this.results.calculateGrade();
    
    // Overall score with color coding
    const scoreColor = score >= 90 ? '\x1b[32m' : score >= 70 ? '\x1b[33m' : '\x1b[31m';
    const gradeColor = grade.startsWith('A') ? '\x1b[32m' : grade.startsWith('B') ? '\x1b[33m' : '\x1b[31m';
    
    console.log(`\n🎯 URL: ${this.results.url}`);
    console.log(`🔒 HTTPS: ${this.results.isHttps ? '✅ Yes' : '❌ No'}`);
    console.log(`📊 SECURITY SCORE: ${scoreColor}${score}/100\x1b[0m`);
    console.log(`📈 SECURITY GRADE: ${gradeColor}${grade}\x1b[0m`);
    
    // Test summary
    console.log(`\n📋 TEST SUMMARY:`);
    console.log(`   ✅ Passed: ${this.results.passed.length}`);
    console.log(`   ❌ Failed: ${this.results.failed.length}`);
    console.log(`   ⚠️  Warnings: ${this.results.warnings.length}`);
    
    // Passed tests
    if (this.results.passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      this.results.passed.forEach(test => {
        console.log(`   ${test.header}: ${test.description}`);
        if (test.value) {
          console.log(`      Value: ${test.value.substring(0, 100)}${test.value.length > 100 ? '...' : ''}`);
        }
      });
    }
    
    // Failed tests
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.failed.forEach(test => {
        const severityIcon = test.severity === 'critical' ? '🔴' : 
                            test.severity === 'high' ? '🟠' : 
                            test.severity === 'medium' ? '🟡' : '🔵';
        
        console.log(`   ${severityIcon} ${test.header}: ${test.description} (${test.severity})`);
        if (test.recommendations && test.recommendations.length > 0) {
          test.recommendations.forEach(rec => {
            console.log(`      💡 ${rec}`);
          });
        }
      });
    }
    
    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`   ${warning.header}: ${warning.description}`);
        console.log(`      💡 ${warning.recommendation}`);
      });
    }
    
    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    // Security headers present
    console.log('\n📋 ALL HEADERS FOUND:');
    Object.entries(this.results.headers).forEach(([header, value]) => {
      if (header.toLowerCase().includes('sec') || 
          ['content-security-policy', 'strict-transport-security', 'x-frame-options', 
           'x-content-type-options', 'x-xss-protection', 'referrer-policy'].includes(header.toLowerCase())) {
        console.log(`   ${header}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Save detailed report
    this.saveDetailedReport();
  }

  /**
   * Saves detailed JSON report
   */
  saveDetailedReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `./security-headers-report-${timestamp.split('T')[0]}.json`;
    
    const reportData = {
      ...this.results,
      score: this.results.getScore(),
      grade: this.results.calculateGrade()
    };
    
    require('fs').writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

/**
 * Command line interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node test-security-headers.js <URL>');
    console.log('Example: node test-security-headers.js https://example.com');
    process.exit(1);
  }
  
  const url = args[0];
  
  // Validate URL format
  try {
    new URL(url);
  } catch {
    console.error('❌ Invalid URL format');
    process.exit(1);
  }
  
  const tester = new SecurityHeadersTester();
  
  try {
    await tester.testUrl(url);
    
    // Exit with appropriate code based on results
    const score = tester.results.getScore();
    const criticalFails = tester.results.failed.filter(f => f.severity === 'critical').length;
    
    if (criticalFails > 0 || score < 70) {
      console.log('\n❌ Security headers test FAILED');
      process.exit(1);
    } else if (score < 90) {
      console.log('\n⚠️  Security headers test PASSED with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ Security headers test PASSED');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SecurityHeadersTester, SECURITY_TESTS };