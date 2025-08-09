#!/usr/bin/env node

/**
 * WCAG AA Accessibility Compliance Audit
 * Comprehensive accessibility testing for multi-tenant UI components
 */

import fs from 'fs';
import { globSync } from 'glob';

// Color output functions
const colors = {
  info: '\x1b[34m[INFO]\x1b[0m',
  success: '\x1b[32m[SUCCESS]\x1b[0m',
  warning: '\x1b[33m[WARNING]\x1b[0m',
  error: '\x1b[31m[ERROR]\x1b[0m',
  audit: '\x1b[35m[AUDIT]\x1b[0m'
};

function log(level, message) {
  console.log(`${colors[level]} ${message}`);
}

class AccessibilityAuditor {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.componentsPassed = [];
    this.componentsNeedWork = [];
  }

  // Audit React components for accessibility
  auditReactComponents() {
    log('audit', '🔍 Auditing React Components for Accessibility...');
    
    const componentFiles = globSync('src/components/**/*.tsx', { cwd: process.cwd() });
    const pageFiles = globSync('src/pages/**/*.tsx', { cwd: process.cwd() });
    
    const allFiles = [...componentFiles, ...pageFiles];
    
    for (const file of allFiles) {
      this.auditComponent(file);
    }
  }

  auditComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = filePath.split('/').pop();
      
      log('info', `Auditing: ${fileName}`);
      
      const issues = [];
      const warnings = [];
      
      // Check for semantic HTML usage
      this.checkSemanticHTML(content, filePath, issues, warnings);
      
      // Check for ARIA attributes
      this.checkARIAAttributes(content, filePath, issues, warnings);
      
      // Check for keyboard navigation
      this.checkKeyboardNavigation(content, filePath, issues, warnings);
      
      // Check for color contrast considerations
      this.checkColorContrast(content, filePath, issues, warnings);
      
      // Check for form accessibility
      this.checkFormAccessibility(content, filePath, issues, warnings);
      
      // Check for image accessibility
      this.checkImageAccessibility(content, filePath, issues, warnings);
      
      // Check for focus management
      this.checkFocusManagement(content, filePath, issues, warnings);
      
      if (issues.length === 0 && warnings.length === 0) {
        this.componentsPassed.push(fileName);
        log('success', `  ✅ ${fileName}: No accessibility issues found`);
      } else {
        this.componentsNeedWork.push({
          file: fileName,
          path: filePath,
          issues,
          warnings
        });
        
        if (issues.length > 0) {
          log('error', `  ❌ ${fileName}: ${issues.length} issues found`);
        }
        if (warnings.length > 0) {
          log('warning', `  ⚠️ ${fileName}: ${warnings.length} warnings`);
        }
      }
      
    } catch (error) {
      log('error', `Failed to audit ${filePath}: ${error.message}`);
    }
  }

  checkSemanticHTML(content, filePath, issues, warnings) {
    // Check for proper heading hierarchy
    const headings = content.match(/<h[1-6][^>]*>/g) || [];
    if (headings.length === 0 && content.includes('heading')) {
      warnings.push('Consider using semantic heading tags (h1-h6) instead of styled div elements');
    }
    
    // Check for semantic elements
    if (content.includes('<div') && !content.match(/<(main|section|article|nav|header|footer|aside)/)) {
      if (content.includes('className="nav') || content.includes('navigation')) {
        warnings.push('Consider using <nav> element for navigation components');
      }
      if (content.includes('main') || content.includes('content')) {
        warnings.push('Consider using <main> element for main content area');
      }
    }
    
    // Check for list semantics
    if ((content.includes('item') || content.includes('list')) && !content.includes('<ul') && !content.includes('<ol')) {
      warnings.push('Consider using <ul>/<ol> and <li> elements for list content');
    }
  }

  checkARIAAttributes(content, filePath, issues, warnings) {
    // Check for missing aria-label or aria-labelledby on interactive elements
    const interactiveElements = content.match(/<(button|input|select|textarea)[^>]*>/g) || [];
    
    interactiveElements.forEach(element => {
      if (!element.includes('aria-label') && !element.includes('aria-labelledby') && 
          !element.includes('placeholder') && !element.match(/>\s*\w+/)) {
        issues.push(`Interactive element missing accessible label: ${element.substring(0, 50)}...`);
      }
    });
    
    // Check for proper ARIA roles
    if (content.includes('role=') && !content.includes('role="button"') && 
        !content.includes('role="dialog"') && !content.includes('role="alert"')) {
      warnings.push('Verify that custom ARIA roles are appropriate and well-supported');
    }
    
    // Check for aria-hidden usage
    if (content.includes('aria-hidden="true"')) {
      warnings.push('Ensure aria-hidden elements are truly decorative and not essential content');
    }
  }

  checkKeyboardNavigation(content, filePath, issues, warnings) {
    // Check for onClick without onKeyDown for non-button elements
    const onClickDivs = content.match(/<div[^>]*onClick[^>]*>/g) || [];
    onClickDivs.forEach(div => {
      if (!div.includes('onKeyDown') && !div.includes('tabIndex')) {
        issues.push('Clickable div missing keyboard event handler and tabIndex');
      }
    });
    
    // Check for custom components that might need keyboard support
    if (content.includes('onClick') && !content.includes('<button')) {
      warnings.push('Ensure all interactive elements support keyboard navigation');
    }
    
    // Check for focus trapping in modals
    if (content.includes('Modal') || content.includes('Dialog')) {
      if (!content.includes('autoFocus') && !content.includes('focus')) {
        warnings.push('Modal/Dialog components should implement proper focus management');
      }
    }
  }

  checkColorContrast(content, filePath, issues, warnings) {
    // Check for potential color-only indicators
    if (content.includes('text-red') || content.includes('text-green') || 
        content.includes('bg-red') || content.includes('bg-green')) {
      warnings.push('Ensure color is not the only way to convey important information');
    }
    
    // Check for proper error indication
    if (content.includes('error') && !content.includes('aria-invalid')) {
      warnings.push('Error states should include aria-invalid attribute');
    }
    
    // Check for status indicators
    if (content.includes('status') || content.includes('alert')) {
      if (!content.includes('role="alert"') && !content.includes('aria-live')) {
        warnings.push('Status messages should use role="alert" or aria-live');
      }
    }
  }

  checkFormAccessibility(content, filePath, issues, warnings) {
    // Check for form labels
    const inputs = content.match(/<input[^>]*>/g) || [];
    inputs.forEach(input => {
      if (!input.includes('aria-label') && !input.includes('placeholder') &&
          !content.includes('<label')) {
        issues.push('Form input missing associated label');
      }
    });
    
    // Check for fieldsets in complex forms
    if (content.includes('input') && content.includes('type="radio"')) {
      if (!content.includes('<fieldset')) {
        warnings.push('Radio button groups should be wrapped in fieldset with legend');
      }
    }
    
    // Check for required field indication
    if (content.includes('required') && !content.includes('aria-required')) {
      warnings.push('Required fields should include aria-required attribute');
    }
  }

  checkImageAccessibility(content, filePath, issues, warnings) {
    // Check for alt text on images
    const images = content.match(/<img[^>]*>/g) || [];
    images.forEach(img => {
      if (!img.includes('alt=')) {
        issues.push('Image missing alt attribute');
      } else if (img.includes('alt=""') && !img.includes('role="presentation"')) {
        warnings.push('Empty alt text should be accompanied by role="presentation" for decorative images');
      }
    });
    
    // Check for icon accessibility
    if (content.includes('Icon') || content.includes('icon')) {
      if (!content.includes('aria-label') && !content.includes('aria-hidden="true"')) {
        warnings.push('Icons should have aria-label or be marked as decorative with aria-hidden');
      }
    }
  }

  checkFocusManagement(content, filePath, issues, warnings) {
    // Check for skip links
    if (filePath.includes('Layout') || filePath.includes('Navigation')) {
      if (!content.includes('skip') && !content.includes('Skip')) {
        warnings.push('Consider adding skip links for keyboard navigation');
      }
    }
    
    // Check for focus indicators
    if (content.includes('focus:') || content.includes(':focus')) {
      // Good - focus styles are being considered
    } else if (content.includes('button') || content.includes('link')) {
      warnings.push('Ensure interactive elements have visible focus indicators');
    }
    
    // Check for auto-focus usage
    if (content.includes('autoFocus') && !filePath.includes('Modal')) {
      warnings.push('Auto-focus should be used carefully, mainly in modals or error situations');
    }
  }

  // Generate accessibility recommendations
  generateRecommendations() {
    this.recommendations = [
      {
        priority: 'HIGH',
        category: 'Keyboard Navigation',
        recommendation: 'Ensure all interactive elements are keyboard accessible',
        implementation: 'Add onKeyDown handlers and proper tabIndex values'
      },
      {
        priority: 'HIGH',
        category: 'Screen Readers',
        recommendation: 'Provide descriptive labels for all form controls',
        implementation: 'Use aria-label, aria-labelledby, or associated label elements'
      },
      {
        priority: 'MEDIUM',
        category: 'Semantic HTML',
        recommendation: 'Use semantic HTML elements for better structure',
        implementation: 'Replace generic divs with nav, main, section, article elements'
      },
      {
        priority: 'MEDIUM',
        category: 'Focus Management',
        recommendation: 'Implement proper focus management in modals and navigation',
        implementation: 'Trap focus in modals, return focus after close, manage route changes'
      },
      {
        priority: 'LOW',
        category: 'Color Contrast',
        recommendation: 'Ensure sufficient color contrast ratios (4.5:1 for normal text)',
        implementation: 'Use tools like WebAIM contrast checker, avoid color-only indicators'
      }
    ];
  }

  // Generate comprehensive accessibility report
  generateReport() {
    this.generateRecommendations();
    
    const totalComponents = this.componentsPassed.length + this.componentsNeedWork.length;
    const passRate = totalComponents > 0 ? Math.round((this.componentsPassed.length / totalComponents) * 100) : 0;
    
    const report = {
      timestamp: new Date().toISOString(),
      audit_type: 'WCAG_AA_Compliance',
      summary: {
        total_components: totalComponents,
        components_passed: this.componentsPassed.length,
        components_need_work: this.componentsNeedWork.length,
        pass_rate: passRate,
        total_issues: this.componentsNeedWork.reduce((sum, comp) => sum + comp.issues.length, 0),
        total_warnings: this.componentsNeedWork.reduce((sum, comp) => sum + comp.warnings.length, 0)
      },
      components_passed: this.componentsPassed,
      components_need_work: this.componentsNeedWork,
      recommendations: this.recommendations,
      next_steps: [
        'Review and fix high-priority accessibility issues',
        'Test with screen readers (NVDA, JAWS, VoiceOver)',
        'Verify keyboard navigation flows',
        'Validate color contrast ratios',
        'Conduct user testing with assistive technology users'
      ]
    };
    
    return report;
  }

  // Save accessibility report
  async saveReport() {
    const report = this.generateReport();
    const reportPath = `./backups/accessibility_audit_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('success', `♿ Accessibility report saved: ${reportPath}`);
    
    return reportPath;
  }
}

// Main accessibility audit execution
async function runAccessibilityAudit() {
  log('info', '==========================================');
  log('info', '♿ WCAG AA ACCESSIBILITY COMPLIANCE AUDIT');
  log('info', '==========================================');
  
  const auditor = new AccessibilityAuditor();
  
  try {
    // Audit React components
    auditor.auditReactComponents();
    
    // Generate and save report
    const reportPath = await auditor.saveReport();
    const report = auditor.generateReport();
    
    log('info', '\n==========================================');
    log('info', '📋 ACCESSIBILITY AUDIT SUMMARY');
    log('info', '==========================================');
    log('info', `Total Components Audited: ${report.summary.total_components}`);
    log('info', `Components Passed: ${report.summary.components_passed}`);
    log('info', `Components Need Work: ${report.summary.components_need_work}`);
    log('info', `Pass Rate: ${report.summary.pass_rate}%`);
    log('info', `Total Issues Found: ${report.summary.total_issues}`);
    log('info', `Total Warnings: ${report.summary.total_warnings}`);
    
    // Assessment
    if (report.summary.pass_rate >= 90) {
      log('success', '🎉 EXCELLENT ACCESSIBILITY: 90%+ components compliant');
    } else if (report.summary.pass_rate >= 75) {
      log('success', '✅ GOOD ACCESSIBILITY: 75%+ components compliant');
    } else if (report.summary.pass_rate >= 50) {
      log('warning', '⚠️ MODERATE ACCESSIBILITY: Improvements needed');
    } else {
      log('error', '❌ POOR ACCESSIBILITY: Significant work required');
    }
    
    log('info', '\n📝 TOP RECOMMENDATIONS:');
    report.recommendations.slice(0, 3).forEach(rec => {
      log('info', `  ${rec.priority}: ${rec.recommendation}`);
    });
    
    log('info', '==========================================');
    
    return report;
    
  } catch (error) {
    log('error', `Accessibility audit failed: ${error.message}`);
    throw error;
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAccessibilityAudit()
    .then((report) => {
      if (report.summary.pass_rate >= 75 && report.summary.total_issues === 0) {
        log('success', '✅ Accessibility audit completed successfully');
        process.exit(0);
      } else if (report.summary.pass_rate >= 50) {
        log('warning', '⚠️ Accessibility audit completed - Some issues found');
        process.exit(0);
      } else {
        log('error', '❌ Accessibility audit completed - Many issues found');
        process.exit(1);
      }
    })
    .catch((error) => {
      log('error', `Accessibility audit execution failed: ${error.message}`);
      process.exit(1);
    });
}

export { AccessibilityAuditor, runAccessibilityAudit };