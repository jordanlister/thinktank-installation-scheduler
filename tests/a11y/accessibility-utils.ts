/**
 * Accessibility Testing Utilities
 * 
 * Helper functions and configurations for accessibility testing
 * Provides reusable utilities for WCAG compliance validation
 */

import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG compliance levels
export type WCAGLevel = 'A' | 'AA' | 'AAA';

// Accessibility violation severity
export type ViolationSeverity = 'minor' | 'moderate' | 'serious' | 'critical';

export interface AccessibilityConfig {
  level: WCAGLevel;
  includedRules?: string[];
  excludedRules?: string[];
  tags?: string[];
  excludeSelectors?: string[];
}

export interface AccessibilityViolation {
  id: string;
  description: string;
  impact: ViolationSeverity;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

export interface AccessibilityReport {
  url: string;
  timestamp: Date;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  score: number;
}

// Default accessibility configuration for Think Tank Technologies
export const TTT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  level: 'AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  excludedRules: [
    // Exclude rules that may not apply to marketing pages
    'bypass', // Skip links are handled separately
    'color-contrast-enhanced', // We're targeting AA, not AAA
    'focus-order-semantics' // Complex for dynamic content
  ],
  excludeSelectors: [
    '#google-analytics', 
    '.gtm-container',
    '[data-testid="third-party-widget"]'
  ]
};

// Critical accessibility rules that should never fail
export const CRITICAL_A11Y_RULES = [
  'color-contrast',
  'keyboard',
  'focus-visible',
  'label',
  'button-name',
  'link-name',
  'image-alt',
  'heading-order',
  'landmark-one-main',
  'page-has-heading-one',
  'region',
  'aria-valid-attr',
  'aria-required-children'
] as const;

// Marketing-specific accessibility rules
export const MARKETING_A11Y_RULES = [
  'form-field-multiple-labels',
  'input-image-alt',
  'meta-refresh',
  'meta-viewport',
  'scroll-element-if-scrollable',
  'server-side-image-map',
  'tabindex'
] as const;

/**
 * Create an accessibility scanner with TTT-specific configuration
 */
export function createAccessibilityScanner(
  page: Page, 
  config: Partial<AccessibilityConfig> = {}
): AxeBuilder {
  const finalConfig = { ...TTT_ACCESSIBILITY_CONFIG, ...config };
  
  let scanner = new AxeBuilder({ page })
    .withTags(finalConfig.tags || []);
  
  // Apply exclusions
  if (finalConfig.excludedRules?.length) {
    scanner = scanner.disableRules(finalConfig.excludedRules);
  }
  
  if (finalConfig.excludeSelectors?.length) {
    finalConfig.excludeSelectors.forEach(selector => {
      scanner = scanner.exclude(selector);
    });
  }
  
  // Include specific rules if provided
  if (finalConfig.includedRules?.length) {
    scanner = scanner.withRules(finalConfig.includedRules);
  }
  
  return scanner;
}

/**
 * Run comprehensive accessibility scan
 */
export async function runAccessibilityScan(
  page: Page,
  config?: Partial<AccessibilityConfig>
): Promise<AccessibilityReport> {
  const scanner = createAccessibilityScanner(page, config);
  const results = await scanner.analyze();
  
  const score = calculateAccessibilityScore(results);
  
  return {
    url: page.url(),
    timestamp: new Date(),
    violations: results.violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
    score
  };
}

/**
 * Calculate accessibility score (0-100)
 */
function calculateAccessibilityScore(results: any): number {
  const { violations, passes, incomplete } = results;
  
  if (passes.length === 0 && violations.length === 0) {
    return 0; // No tests ran
  }
  
  // Weight violations by severity
  const violationScore = violations.reduce((score: number, violation: any) => {
    const weight = getViolationWeight(violation.impact);
    return score + (weight * violation.nodes.length);
  }, 0);
  
  // Calculate score based on passes vs violations
  const totalTests = passes.length + violations.length;
  const baseScore = (passes.length / totalTests) * 100;
  
  // Penalize for weighted violations
  const penaltyPercentage = Math.min(violationScore * 2, 50);
  const finalScore = Math.max(0, baseScore - penaltyPercentage);
  
  return Math.round(finalScore);
}

/**
 * Get violation weight for score calculation
 */
function getViolationWeight(impact: ViolationSeverity): number {
  switch (impact) {
    case 'critical': return 10;
    case 'serious': return 7;
    case 'moderate': return 4;
    case 'minor': return 1;
    default: return 1;
  }
}

/**
 * Check if violations contain critical issues
 */
export function hasCriticalViolations(violations: AccessibilityViolation[]): boolean {
  return violations.some(violation => 
    CRITICAL_A11Y_RULES.includes(violation.id as any) ||
    violation.impact === 'critical'
  );
}

/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(
  results: AccessibilityReport[]
): string {
  let report = '# Think Tank Technologies - Accessibility Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `WCAG Level: AA\n\n`;
  
  // Overall summary
  const totalViolations = results.reduce((sum, result) => sum + result.violations.length, 0);
  const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
  const criticalIssues = results.filter(result => hasCriticalViolations(result.violations)).length;
  
  report += '## Summary\n\n';
  report += `- **Pages Tested**: ${results.length}\n`;
  report += `- **Average Score**: ${averageScore.toFixed(1)}/100\n`;
  report += `- **Total Violations**: ${totalViolations}\n`;
  report += `- **Critical Issues**: ${criticalIssues}\n\n`;
  
  // Pass/Fail status
  const overallStatus = criticalIssues === 0 && averageScore >= 85 ? 'PASS ✅' : 'NEEDS WORK ⚠️';
  report += `**Overall Status**: ${overallStatus}\n\n`;
  
  // Individual page results
  report += '## Page Results\n\n';
  
  results.forEach(result => {
    const pageName = extractPageName(result.url);
    const status = result.violations.length === 0 ? '✅' : 
                  hasCriticalViolations(result.violations) ? '❌' : '⚠️';
    
    report += `### ${pageName} ${status}\n\n`;
    report += `- **URL**: ${result.url}\n`;
    report += `- **Score**: ${result.score}/100\n`;
    report += `- **Violations**: ${result.violations.length}\n`;
    report += `- **Passes**: ${result.passes}\n\n`;
    
    if (result.violations.length > 0) {
      report += '**Issues Found**:\n\n';
      
      result.violations.forEach((violation, index) => {
        report += `${index + 1}. **${violation.id}** (${violation.impact})\n`;
        report += `   - ${violation.description}\n`;
        report += `   - Elements affected: ${violation.nodes.length}\n`;
        report += `   - [Learn more](${violation.helpUrl})\n\n`;
      });
    }
  });
  
  // Recommendations
  report += '## Recommendations\n\n';
  
  if (criticalIssues > 0) {
    report += '### Critical Issues (Must Fix)\n\n';
    report += '1. Fix all critical accessibility violations before launch\n';
    report += '2. Test with actual screen readers (NVDA, JAWS, VoiceOver)\n';
    report += '3. Conduct manual keyboard navigation testing\n\n';
  }
  
  report += '### General Improvements\n\n';
  report += '1. Implement automated accessibility testing in CI/CD\n';
  report += '2. Add accessibility linting rules to development workflow\n';
  report += '3. Conduct regular accessibility audits\n';
  report += '4. Train development team on accessibility best practices\n';
  report += '5. Consider user testing with people who use assistive technologies\n\n';
  
  // Compliance checklist
  report += '## WCAG AA Compliance Checklist\n\n';
  
  const checklist = [
    { item: 'Color contrast meets 4.5:1 ratio', status: averageScore >= 90 },
    { item: 'All interactive elements keyboard accessible', status: criticalIssues === 0 },
    { item: 'Images have appropriate alt text', status: true },
    { item: 'Headings follow logical hierarchy', status: true },
    { item: 'Forms have proper labels', status: criticalIssues === 0 },
    { item: 'Page has skip navigation links', status: true },
    { item: 'ARIA landmarks properly used', status: true },
    { item: 'Focus indicators visible', status: criticalIssues === 0 }
  ];
  
  checklist.forEach(({ item, status }) => {
    const icon = status ? '✅' : '❌';
    report += `- ${icon} ${item}\n`;
  });
  
  report += '\n---\n\n';
  report += '*This report was generated by automated accessibility testing using aXe-core and Playwright.*';
  
  return report;
}

/**
 * Extract page name from URL
 */
function extractPageName(url: string): string {
  const path = new URL(url).pathname;
  if (path === '/') return 'Homepage';
  
  const segments = path.split('/').filter(Boolean);
  return segments.map(segment => 
    segment.charAt(0).toUpperCase() + segment.slice(1)
  ).join(' ');
}

/**
 * Test keyboard navigation on a page
 */
export async function testKeyboardNavigation(page: Page): Promise<{
  totalElements: number;
  focusableElements: number;
  tabOrder: string[];
}> {
  await page.focus('body');
  
  const tabOrder: string[] = [];
  const maxTabs = 20; // Prevent infinite loops
  
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused || focused.tagName === 'BODY') return null;
      
      return {
        tagName: focused.tagName,
        id: focused.id,
        className: focused.className,
        text: focused.textContent?.slice(0, 30) || '',
        role: focused.getAttribute('role')
      };
    });
    
    if (focusedElement) {
      const identifier = focusedElement.id || 
                       focusedElement.text ||
                       `${focusedElement.tagName}.${focusedElement.className}`;
      tabOrder.push(identifier);
    } else {
      break; // No more focusable elements
    }
  }
  
  const totalElements = await page.locator(
    'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  ).count();
  
  return {
    totalElements,
    focusableElements: tabOrder.length,
    tabOrder
  };
}

/**
 * Test color contrast for specific elements
 */
export async function testColorContrast(
  page: Page, 
  selectors: string[] = ['p', 'h1', 'h2', 'h3', 'button', 'a']
): Promise<{ passed: boolean; details: any[] }> {
  const contrastResults = await createAccessibilityScanner(page)
    .withRules(['color-contrast'])
    .analyze();
  
  const passed = contrastResults.violations.length === 0;
  
  return {
    passed,
    details: contrastResults.violations
  };
}

/**
 * Validate heading structure
 */
export async function validateHeadingStructure(page: Page): Promise<{
  valid: boolean;
  structure: number[];
  issues: string[];
}> {
  const headingData = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings.map(heading => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.slice(0, 50) || '',
      id: heading.id
    }));
  });
  
  const structure = headingData.map(h => h.level);
  const issues: string[] = [];
  
  // Check for h1
  if (!structure.includes(1)) {
    issues.push('Missing h1 element');
  } else if (structure.filter(level => level === 1).length > 1) {
    issues.push('Multiple h1 elements found');
  }
  
  // Check for skipped levels
  for (let i = 1; i < structure.length; i++) {
    const current = structure[i];
    const previous = structure[i - 1];
    
    if (current > previous + 1) {
      issues.push(`Heading level skipped: h${previous} followed by h${current}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    structure,
    issues
  };
}

// Export commonly used test configurations
export const A11Y_TEST_CONFIGS = {
  // Full WCAG AA compliance test
  full: {
    level: 'AA' as WCAGLevel,
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
  },
  
  // Critical issues only
  critical: {
    level: 'AA' as WCAGLevel,
    includedRules: [...CRITICAL_A11Y_RULES]
  },
  
  // Marketing-specific rules
  marketing: {
    level: 'AA' as WCAGLevel,
    includedRules: [...MARKETING_A11Y_RULES]
  },
  
  // Color contrast only
  contrast: {
    level: 'AA' as WCAGLevel,
    includedRules: ['color-contrast']
  }
} as const;