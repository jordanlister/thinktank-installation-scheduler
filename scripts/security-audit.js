#!/usr/bin/env node

// Think Tank Technologies - Security Audit Script

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Security audit configuration
 */
const AUDIT_CONFIG = {
  // Files to scan for security issues
  scanPaths: [
    './src',
    './public',
    './index.html',
    './package.json',
    './package-lock.json'
  ],
  
  // Security patterns to detect
  securityPatterns: {
    // Dangerous JavaScript patterns
    dangerousJs: [
      /eval\s*\(/g,
      /Function\s*\(/g,
      /setTimeout\s*\(\s*["'`][^"'`]*["'`]/g,
      /setInterval\s*\(\s*["'`][^"'`]*["'`]/g,
      /document\.write/g,
      /innerHTML\s*=/g,
      /outerHTML\s*=/g,
      /\.insertAdjacentHTML/g
    ],
    
    // Sensitive data exposure
    sensitiveData: [
      /(?:password|passwd|pwd|secret|key|token|api[_-]?key)\s*[:=]\s*["'`][^"'`]+["'`]/gi,
      /(?:mysql|postgres|mongo)(?:db)?:\/\/[^\s]+/gi,
      /-----BEGIN [A-Z ]+-----/g,
      /sk_live_[a-zA-Z0-9]+/g,
      /pk_live_[a-zA-Z0-9]+/g
    ],
    
    // Hardcoded credentials
    credentials: [
      /admin.*password/gi,
      /password.*=.*["'`][^"'`]+["'`]/gi,
      /api_key.*=.*["'`][^"'`]+["'`]/gi,
      /access_token.*=.*["'`][^"'`]+["'`]/gi
    ],
    
    // Insecure URLs
    insecureUrls: [
      /http:\/\/[^\s"'`<>)]+/g
    ],
    
    // Potential XSS vectors
    xssVectors: [
      /dangerouslySetInnerHTML/g,
      /v-html/g,
      /__html\s*:/g
    ]
  },
  
  // Dependencies to check for vulnerabilities
  vulnerableDependencies: [
    // Known vulnerable packages (would be updated from security feeds)
    'event-stream',
    'flatmap-stream',
    'getcookies',
    'http-proxy',
    'lodash-es'
  ],
  
  // Security headers to validate
  requiredHeaders: [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Referrer-Policy'
  ],
  
  // File permissions to check
  securePermissions: {
    '.env': '600',
    '.env.local': '600',
    '.env.production': '600',
    'package.json': '644',
    'package-lock.json': '644'
  }
};

/**
 * Security audit results
 */
class SecurityAuditResults {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.info = [];
    this.stats = {
      filesScanned: 0,
      issuesFound: 0,
      warningsFound: 0,
      score: 100
    };
  }

  addIssue(type, file, line, message, severity = 'high') {
    this.issues.push({ type, file, line, message, severity });
    this.stats.issuesFound++;
    
    // Deduct points based on severity
    switch (severity) {
      case 'critical':
        this.stats.score -= 25;
        break;
      case 'high':
        this.stats.score -= 15;
        break;
      case 'medium':
        this.stats.score -= 10;
        break;
      case 'low':
        this.stats.score -= 5;
        break;
    }
  }

  addWarning(type, file, message) {
    this.warnings.push({ type, file, message });
    this.stats.warningsFound++;
    this.stats.score -= 2;
  }

  addInfo(type, message) {
    this.info.push({ type, message });
  }

  getScore() {
    return Math.max(0, this.stats.score);
  }

  getSeverityCount(severity) {
    return this.issues.filter(issue => issue.severity === severity).length;
  }
}

/**
 * Main security auditor class
 */
class SecurityAuditor {
  constructor() {
    this.results = new SecurityAuditResults();
  }

  /**
   * Runs the complete security audit
   */
  async runAudit() {
    console.log('🔍 Starting Think Tank Technologies Security Audit...\n');

    try {
      // Scan files for security issues
      await this.scanFiles();
      
      // Check package vulnerabilities
      await this.checkDependencies();
      
      // Validate security configuration
      await this.validateConfiguration();
      
      // Check file permissions
      await this.checkFilePermissions();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Security audit failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Scans files for security patterns
   */
  async scanFiles() {
    console.log('📂 Scanning files for security issues...');
    
    for (const scanPath of AUDIT_CONFIG.scanPaths) {
      if (fs.existsSync(scanPath)) {
        await this.scanDirectory(scanPath);
      }
    }
  }

  /**
   * Recursively scans directory
   */
  async scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other excluded directories
        if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
          await this.scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        await this.scanFile(fullPath);
      }
    }
  }

  /**
   * Scans individual file
   */
  async scanFile(filePath) {
    const ext = path.extname(filePath);
    const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.json', '.env'];
    
    if (!allowedExtensions.includes(ext) && !filePath.includes('.env')) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.results.stats.filesScanned++;
      
      await this.scanFileContent(filePath, content);
      
    } catch (error) {
      this.results.addWarning('file-access', filePath, `Could not read file: ${error.message}`);
    }
  }

  /**
   * Scans file content for security issues
   */
  async scanFileContent(filePath, content) {
    const lines = content.split('\n');
    
    // Check each pattern category
    Object.entries(AUDIT_CONFIG.securityPatterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        let match;
        let lineIndex = 0;
        
        for (const line of lines) {
          lineIndex++;
          
          if ((match = pattern.exec(line)) !== null) {
            const severity = this.getSeverityForPattern(category);
            const message = this.getMessageForPattern(category, match[0]);
            
            this.results.addIssue(category, filePath, lineIndex, message, severity);
            
            // Reset regex lastIndex for global patterns
            pattern.lastIndex = 0;
          }
        }
      });
    });
  }

  /**
   * Gets severity level for pattern category
   */
  getSeverityForPattern(category) {
    const severityMap = {
      dangerousJs: 'high',
      sensitiveData: 'critical',
      credentials: 'critical',
      insecureUrls: 'medium',
      xssVectors: 'high'
    };
    
    return severityMap[category] || 'medium';
  }

  /**
   * Gets descriptive message for pattern
   */
  getMessageForPattern(category, match) {
    const messageMap = {
      dangerousJs: `Potentially dangerous JavaScript pattern detected: ${match}`,
      sensitiveData: `Possible sensitive data exposure: ${match.substring(0, 50)}...`,
      credentials: `Hardcoded credentials detected: ${match.substring(0, 30)}...`,
      insecureUrls: `Insecure HTTP URL found: ${match}`,
      xssVectors: `Potential XSS vector: ${match}`
    };
    
    return messageMap[category] || `Security issue detected: ${match}`;
  }

  /**
   * Checks package.json for vulnerable dependencies
   */
  async checkDependencies() {
    console.log('📦 Checking dependencies for known vulnerabilities...');
    
    const packagePath = './package.json';
    if (!fs.existsSync(packagePath)) {
      this.results.addWarning('dependencies', packagePath, 'package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };

      // Check for known vulnerable packages
      AUDIT_CONFIG.vulnerableDependencies.forEach(vulnPkg => {
        if (allDeps[vulnPkg]) {
          this.results.addIssue(
            'vulnerable-dependency',
            packagePath,
            0,
            `Vulnerable package detected: ${vulnPkg}@${allDeps[vulnPkg]}`,
            'high'
          );
        }
      });

      // Check for outdated packages that might have security issues
      const suspiciousPatterns = [
        /^0\./,  // Pre-1.0 versions
        /alpha|beta|rc/,  // Pre-release versions
        /\*/,  // Wildcard versions
      ];

      Object.entries(allDeps).forEach(([pkg, version]) => {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(version)) {
            this.results.addWarning(
              'dependency-version',
              packagePath,
              `Potentially risky version for ${pkg}: ${version}`
            );
          }
        });
      });

    } catch (error) {
      this.results.addWarning('dependencies', packagePath, `Could not parse package.json: ${error.message}`);
    }
  }

  /**
   * Validates security configuration
   */
  async validateConfiguration() {
    console.log('⚙️  Validating security configuration...');
    
    // Check if security utilities are properly imported
    const securityImportFiles = [
      './src/lib/security/index.ts',
      './src/lib/security/csp.ts',
      './src/lib/security/headers.ts'
    ];

    securityImportFiles.forEach(filePath => {
      if (!fs.existsSync(filePath)) {
        this.results.addIssue(
          'missing-security-config',
          filePath,
          0,
          'Required security configuration file is missing',
          'medium'
        );
      }
    });

    // Check Vite configuration for security plugin
    const viteConfigPath = './vite.config.ts';
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      
      if (!viteConfig.includes('securityPlugin')) {
        this.results.addWarning(
          'vite-security',
          viteConfigPath,
          'Security plugin not found in Vite configuration'
        );
      }
    }
  }

  /**
   * Checks file permissions for sensitive files
   */
  async checkFilePermissions() {
    console.log('🔒 Checking file permissions...');
    
    Object.entries(AUDIT_CONFIG.securePermissions).forEach(([fileName, expectedPerm]) => {
      if (fs.existsSync(fileName)) {
        try {
          const stats = fs.statSync(fileName);
          const actualPerm = (stats.mode & parseInt('777', 8)).toString(8);
          
          if (actualPerm !== expectedPerm) {
            this.results.addWarning(
              'file-permissions',
              fileName,
              `File permissions ${actualPerm} should be ${expectedPerm}`
            );
          }
        } catch (error) {
          this.results.addWarning(
            'file-permissions',
            fileName,
            `Could not check permissions: ${error.message}`
          );
        }
      }
    });
  }

  /**
   * Generates comprehensive audit report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🛡️  THINK TANK TECHNOLOGIES - SECURITY AUDIT REPORT');
    console.log('='.repeat(80));
    
    const score = this.results.getScore();
    const scoreColor = score >= 90 ? '\x1b[32m' : score >= 70 ? '\x1b[33m' : '\x1b[31m';
    
    console.log(`\n📊 OVERALL SECURITY SCORE: ${scoreColor}${score}/100\x1b[0m\n`);
    
    // Summary statistics
    console.log('📈 AUDIT STATISTICS:');
    console.log(`   Files Scanned: ${this.results.stats.filesScanned}`);
    console.log(`   Critical Issues: ${this.results.getSeverityCount('critical')}`);
    console.log(`   High Issues: ${this.results.getSeverityCount('high')}`);
    console.log(`   Medium Issues: ${this.results.getSeverityCount('medium')}`);
    console.log(`   Low Issues: ${this.results.getSeverityCount('low')}`);
    console.log(`   Warnings: ${this.results.stats.warningsFound}`);
    
    // Issues by severity
    if (this.results.issues.length > 0) {
      console.log('\n🚨 SECURITY ISSUES:');
      
      ['critical', 'high', 'medium', 'low'].forEach(severity => {
        const issues = this.results.issues.filter(issue => issue.severity === severity);
        if (issues.length > 0) {
          const severityIcon = severity === 'critical' ? '🔴' : 
                              severity === 'high' ? '🟠' : 
                              severity === 'medium' ? '🟡' : '🔵';
          
          console.log(`\n${severityIcon} ${severity.toUpperCase()} SEVERITY:`);
          issues.forEach(issue => {
            console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
          });
        }
      });
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`   ${warning.file} - ${warning.message}`);
      });
    }

    // Recommendations
    console.log('\n💡 SECURITY RECOMMENDATIONS:');
    const recommendations = this.generateRecommendations();
    recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    console.log('\n' + '='.repeat(80));
    
    // Save report to file
    this.saveReportToFile();
    
    // Exit with appropriate code
    const criticalCount = this.results.getSeverityCount('critical');
    const highCount = this.results.getSeverityCount('high');
    
    if (criticalCount > 0 || highCount > 5) {
      console.log('❌ Security audit FAILED - Critical issues found!');
      process.exit(1);
    } else if (score < 70) {
      console.log('⚠️  Security audit WARNING - Score below acceptable threshold');
      process.exit(1);
    } else {
      console.log('✅ Security audit PASSED');
      process.exit(0);
    }
  }

  /**
   * Generates security recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.getSeverityCount('critical') > 0) {
      recommendations.push('Immediately address all critical security issues');
    }
    
    if (this.results.issues.some(i => i.type === 'sensitiveData')) {
      recommendations.push('Remove hardcoded secrets and use environment variables');
    }
    
    if (this.results.issues.some(i => i.type === 'dangerousJs')) {
      recommendations.push('Replace dangerous JavaScript patterns with safer alternatives');
    }
    
    if (this.results.issues.some(i => i.type === 'insecureUrls')) {
      recommendations.push('Update all HTTP URLs to use HTTPS');
    }
    
    recommendations.push('Implement Content Security Policy headers');
    recommendations.push('Enable security headers (HSTS, X-Frame-Options, etc.)');
    recommendations.push('Regular dependency updates and vulnerability scanning');
    recommendations.push('Implement input sanitization for all user inputs');
    
    return recommendations;
  }

  /**
   * Saves detailed report to file
   */
  saveReportToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `./security-audit-${timestamp.split('T')[0]}.json`;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      score: this.results.getScore(),
      statistics: this.results.stats,
      issues: this.results.issues,
      warnings: this.results.warnings,
      info: this.results.info,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
}

module.exports = { SecurityAuditor, AUDIT_CONFIG };