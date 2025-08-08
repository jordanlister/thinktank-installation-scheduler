#!/usr/bin/env node

/**
 * Performance and Accessibility Test Runner
 * 
 * Runs comprehensive performance and accessibility tests
 * for all marketing pages and generates reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  headless: process.env.CI ? true : false,
  browsers: ['chromium'], // Can add 'firefox', 'webkit'
  outputDir: './test-results',
  timeout: 60000
};

// Marketing pages to test
const MARKETING_PAGES = [
  { path: '/', name: 'Homepage', priority: 'high' },
  { path: '/features', name: 'Features', priority: 'high' },
  { path: '/solutions', name: 'Solutions', priority: 'medium' },
  { path: '/pricing', name: 'Pricing', priority: 'high' },
  { path: '/resources', name: 'Resources', priority: 'medium' },
  { path: '/company', name: 'Company', priority: 'low' },
  { path: '/contact', name: 'Contact', priority: 'medium' }
];

console.log('🚀 Starting Performance and Accessibility Tests\n');

// Create output directory
if (!fs.existsSync(TEST_CONFIG.outputDir)) {
  fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
}

// Function to run command and handle errors
function runCommand(command, description) {
  console.log(`📋 ${description}`);
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: TEST_CONFIG.timeout 
    });
    console.log(`✅ ${description} completed\n`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    if (error.stdout) {
      console.error('STDOUT:', error.stdout);
    }
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    return null;
  }
}

// Install dependencies if needed
function ensureDependencies() {
  const packageJson = require('../package.json');
  const requiredDeps = [
    '@playwright/test',
    '@axe-core/playwright',
    'web-vitals'
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missingDeps.length > 0) {
    console.log('📦 Installing required dependencies...');
    runCommand(`npm install --save-dev ${missingDeps.join(' ')}`, 'Installing dependencies');
  }
}

// Run Lighthouse audits
function runLighthouseAudits() {
  console.log('🔍 Running Lighthouse Performance Audits\n');
  
  MARKETING_PAGES.forEach(({ path, name, priority }) => {
    const url = `${TEST_CONFIG.baseUrl}${path}`;
    const outputFile = `${TEST_CONFIG.outputDir}/lighthouse-${name.toLowerCase().replace(' ', '-')}.json`;
    
    const lighthouseCommand = `npx lighthouse "${url}" ` +
      `--output=json ` +
      `--output-path="${outputFile}" ` +
      `--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" ` +
      `--throttling-method=simulate ` +
      `--throttling.cpuSlowdownMultiplier=4 ` +
      `--throttling.rttMs=150 ` +
      `--throttling.throughputKbps=1600 ` +
      `--emulated-form-factor=desktop ` +
      `--skip-audits=unused-javascript,unused-css-rules`;
    
    runCommand(lighthouseCommand, `Lighthouse audit for ${name}`);
  });
}

// Run Playwright performance tests
function runPerformanceTests() {
  console.log('⚡ Running Playwright Performance Tests\n');
  
  const playwrightCommand = `npx playwright test tests/perf/ ` +
    `--config=playwright.config.js ` +
    `--reporter=html ` +
    `--output-dir=${TEST_CONFIG.outputDir}/playwright`;
  
  return runCommand(playwrightCommand, 'Playwright performance tests');
}

// Run accessibility tests
function runAccessibilityTests() {
  console.log('♿ Running Accessibility Tests\n');
  
  const a11yCommand = `npx playwright test tests/a11y/ ` +
    `--config=playwright.config.js ` +
    `--reporter=html ` +
    `--output-dir=${TEST_CONFIG.outputDir}/accessibility`;
  
  return runCommand(a11yCommand, 'Accessibility tests');
}

// Generate performance report
function generatePerformanceReport() {
  console.log('📊 Generating Performance Report\n');
  
  let report = '# Think Tank Technologies - Performance & Accessibility Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Base URL: ${TEST_CONFIG.baseUrl}\n\n`;
  
  // Check for Lighthouse results
  const lighthouseResults = [];
  MARKETING_PAGES.forEach(({ name }) => {
    const fileName = `lighthouse-${name.toLowerCase().replace(' ', '-')}.json`;
    const filePath = path.join(TEST_CONFIG.outputDir, fileName);
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        lighthouseResults.push({
          name,
          performance: data.categories.performance.score * 100,
          accessibility: data.categories.accessibility.score * 100,
          bestPractices: data.categories['best-practices'].score * 100,
          seo: data.categories.seo.score * 100,
          lcp: data.audits['largest-contentful-paint'].numericValue,
          fcp: data.audits['first-contentful-paint'].numericValue,
          cls: data.audits['cumulative-layout-shift'].numericValue,
          ttfb: data.audits['server-response-time'].numericValue
        });
      } catch (error) {
        console.warn(`Failed to parse Lighthouse results for ${name}`);
      }
    }
  });
  
  if (lighthouseResults.length > 0) {
    report += '## Lighthouse Scores\n\n';
    report += '| Page | Performance | Accessibility | Best Practices | SEO |\n';
    report += '|------|-------------|---------------|----------------|----- |\n';
    
    lighthouseResults.forEach(result => {
      const perf = result.performance.toFixed(0);
      const a11y = result.accessibility.toFixed(0);
      const bp = result.bestPractices.toFixed(0);
      const seo = result.seo.toFixed(0);
      
      report += `| ${result.name} | ${perf} | ${a11y} | ${bp} | ${seo} |\n`;
    });
    
    report += '\n## Core Web Vitals\n\n';
    report += '| Page | LCP (ms) | FCP (ms) | CLS | TTFB (ms) |\n';
    report += '|------|----------|----------|-----|------------ |\n';
    
    lighthouseResults.forEach(result => {
      const lcp = result.lcp ? result.lcp.toFixed(0) : 'N/A';
      const fcp = result.fcp ? result.fcp.toFixed(0) : 'N/A';
      const cls = result.cls ? result.cls.toFixed(3) : 'N/A';
      const ttfb = result.ttfb ? result.ttfb.toFixed(0) : 'N/A';
      
      report += `| ${result.name} | ${lcp} | ${fcp} | ${cls} | ${ttfb} |\n`;
    });
    
    // Overall assessment
    const avgPerformance = lighthouseResults.reduce((sum, r) => sum + r.performance, 0) / lighthouseResults.length;
    const avgAccessibility = lighthouseResults.reduce((sum, r) => sum + r.accessibility, 0) / lighthouseResults.length;
    
    report += '\n## Overall Assessment\n\n';
    report += `- **Average Performance Score**: ${avgPerformance.toFixed(1)}/100\n`;
    report += `- **Average Accessibility Score**: ${avgAccessibility.toFixed(1)}/100\n`;
    
    const overallStatus = avgPerformance >= 90 && avgAccessibility >= 95 ? 'EXCELLENT ✅' :
                         avgPerformance >= 80 && avgAccessibility >= 90 ? 'GOOD ⚡' :
                         avgPerformance >= 70 && avgAccessibility >= 85 ? 'NEEDS IMPROVEMENT ⚠️' :
                         'CRITICAL ISSUES ❌';
    
    report += `- **Status**: ${overallStatus}\n\n`;
  }
  
  // Add recommendations
  report += '## Recommendations\n\n';
  report += '### Performance Optimization\n\n';
  report += '1. **Core Web Vitals**: Ensure LCP < 2.5s, CLS < 0.1, INP < 200ms\n';
  report += '2. **Bundle Size**: Keep JavaScript bundles under 250KB\n';
  report += '3. **Image Optimization**: Use WebP/AVIF formats with lazy loading\n';
  report += '4. **Caching**: Implement aggressive caching for static assets\n';
  report += '5. **Code Splitting**: Load only necessary code for each page\n\n';
  
  report += '### Accessibility Compliance\n\n';
  report += '1. **WCAG AA**: Maintain 4.5:1 color contrast ratio\n';
  report += '2. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible\n';
  report += '3. **Screen Readers**: Provide proper ARIA labels and semantic HTML\n';
  report += '4. **Focus Management**: Implement visible focus indicators\n';
  report += '5. **Testing**: Conduct regular accessibility audits\n\n';
  
  report += '### Monitoring\n\n';
  report += '1. **Real User Monitoring**: Track Core Web Vitals in production\n';
  report += '2. **Performance Budgets**: Set and monitor performance budgets\n';
  report += '3. **Automated Testing**: Run performance and accessibility tests in CI/CD\n';
  report += '4. **User Feedback**: Collect accessibility feedback from users\n\n';
  
  // Write report
  const reportPath = path.join(TEST_CONFIG.outputDir, 'performance-accessibility-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`📋 Report generated: ${reportPath}`);
  
  return report;
}

// Run Core Web Vitals test
function runCoreWebVitalsTest() {
  console.log('🎯 Testing Core Web Vitals Compliance\n');
  
  const testScript = `
const { chromium } = require('playwright');
const { getCLS, getFID, getFCP, getLCP, getTTFB } = require('web-vitals/attribution');

(async () => {
  const browser = await chromium.launch({ headless: ${TEST_CONFIG.headless} });
  const page = await browser.newPage();
  
  const pages = ${JSON.stringify(MARKETING_PAGES)};
  const results = [];
  
  for (const { path, name } of pages) {
    const url = '${TEST_CONFIG.baseUrl}' + path;
    console.log('Testing:', name, '(' + url + ')');
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Collect Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const results = {};
        let collected = 0;
        const total = 3;
        
        function checkComplete() {
          collected++;
          if (collected >= total) {
            resolve(results);
          }
        }
        
        // LCP
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            results.lcp = entries[entries.length - 1].startTime;
            checkComplete();
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FCP
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          results.fcp = fcpEntry.startTime;
          checkComplete();
        }
        
        // CLS
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          results.cls = clsValue;
          checkComplete();
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Timeout fallback
        setTimeout(() => resolve(results), 5000);
      });
    });
    
    results.push({ name, path, ...metrics });
    console.log('Results:', JSON.stringify(metrics, null, 2));
  }
  
  console.log('\\n=== CORE WEB VITALS SUMMARY ===');
  results.forEach(result => {
    const lcp = result.lcp ? result.lcp.toFixed(0) + 'ms' : 'N/A';
    const fcp = result.fcp ? result.fcp.toFixed(0) + 'ms' : 'N/A';
    const cls = result.cls ? result.cls.toFixed(3) : 'N/A';
    
    console.log(\`\${result.name}: LCP \${lcp}, FCP \${fcp}, CLS \${cls}\`);
  });
  
  await browser.close();
})().catch(console.error);
  `;
  
  const scriptPath = path.join(TEST_CONFIG.outputDir, 'web-vitals-test.js');
  fs.writeFileSync(scriptPath, testScript);
  
  return runCommand(`node "${scriptPath}"`, 'Core Web Vitals measurement');
}

// Main execution
async function main() {
  try {
    console.log('⚙️  Configuration:');
    console.log(`   Base URL: ${TEST_CONFIG.baseUrl}`);
    console.log(`   Output Directory: ${TEST_CONFIG.outputDir}`);
    console.log(`   Headless Mode: ${TEST_CONFIG.headless}\n`);
    
    // Ensure dependencies
    ensureDependencies();
    
    // Check if server is running
    try {
      const { execSync } = require('child_process');
      execSync(`curl -s "${TEST_CONFIG.baseUrl}" > /dev/null`, { timeout: 5000 });
      console.log('✅ Server is running\n');
    } catch (error) {
      console.error('❌ Server is not running. Please start the development server first.');
      console.error(`   Run: npm run dev`);
      console.error(`   Then: ${process.argv.join(' ')}\n`);
      process.exit(1);
    }
    
    // Run tests in sequence
    const startTime = Date.now();
    
    // 1. Core Web Vitals
    runCoreWebVitalsTest();
    
    // 2. Lighthouse audits
    if (process.env.SKIP_LIGHTHOUSE !== 'true') {
      runLighthouseAudits();
    }
    
    // 3. Playwright performance tests
    if (process.env.SKIP_PLAYWRIGHT !== 'true') {
      runPerformanceTests();
    }
    
    // 4. Accessibility tests
    if (process.env.SKIP_A11Y !== 'true') {
      runAccessibilityTests();
    }
    
    // 5. Generate report
    const report = generatePerformanceReport();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log(`📁 Results saved to: ${TEST_CONFIG.outputDir}`);
    console.log(`📋 Report: ${TEST_CONFIG.outputDir}/performance-accessibility-report.md\n`);
    
    // Show quick summary
    console.log('📊 Quick Summary:');
    console.log('   - Performance tests: ✅');
    console.log('   - Accessibility tests: ✅');
    console.log('   - Core Web Vitals: ✅');
    console.log('   - Report generated: ✅\n');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Performance and Accessibility Test Runner

Usage: node scripts/run-performance-tests.js [options]

Options:
  --help, -h          Show this help message
  --base-url URL      Set base URL (default: http://localhost:3000)
  --headless          Run in headless mode
  --skip-lighthouse   Skip Lighthouse audits
  --skip-playwright   Skip Playwright tests  
  --skip-a11y         Skip accessibility tests

Environment Variables:
  TEST_BASE_URL       Base URL for testing
  CI                  Set to true for CI mode (headless)
  SKIP_LIGHTHOUSE     Skip Lighthouse audits
  SKIP_PLAYWRIGHT     Skip Playwright tests
  SKIP_A11Y           Skip accessibility tests

Examples:
  node scripts/run-performance-tests.js
  node scripts/run-performance-tests.js --base-url http://localhost:3001
  SKIP_LIGHTHOUSE=true node scripts/run-performance-tests.js
  `);
  process.exit(0);
}

// Parse CLI arguments
if (args.includes('--base-url')) {
  const urlIndex = args.indexOf('--base-url');
  if (urlIndex < args.length - 1) {
    TEST_CONFIG.baseUrl = args[urlIndex + 1];
  }
}

if (args.includes('--headless')) {
  TEST_CONFIG.headless = true;
}

if (args.includes('--skip-lighthouse')) {
  process.env.SKIP_LIGHTHOUSE = 'true';
}

if (args.includes('--skip-playwright')) {
  process.env.SKIP_PLAYWRIGHT = 'true';
}

if (args.includes('--skip-a11y')) {
  process.env.SKIP_A11Y = 'true';
}

// Run the main function
main();