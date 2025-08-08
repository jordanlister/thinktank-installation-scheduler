/**
 * Global Test Teardown
 * 
 * Cleans up after performance and accessibility testing
 * Generates final test reports and summaries
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Generate test summary report
    await generateTestSummary();
    
    // Clean up temporary files
    await cleanupTempFiles();
    
    // Archive test results if needed
    if (process.env.ARCHIVE_RESULTS === 'true') {
      await archiveResults();
    }
    
    console.log('✅ Test teardown completed');
    
  } catch (error) {
    console.error('❌ Teardown failed:', error);
  }
}

/**
 * Generate test summary report
 */
async function generateTestSummary() {
  const outputDir = 'test-results';
  const summaryPath = path.join(outputDir, 'test-summary.md');
  
  let summary = '# Test Execution Summary\n\n';
  summary += `**Date**: ${new Date().toISOString()}\n`;
  summary += `**Environment**: ${process.env.NODE_ENV || 'development'}\n`;
  summary += `**Base URL**: ${process.env.TEST_BASE_URL || 'http://localhost:3000'}\n\n`;
  
  // Check for test result files
  const resultFiles = {
    playwright: path.join(outputDir, 'html', 'index.html'),
    lighthouse: path.join(outputDir, 'lighthouse-homepage.json'),
    accessibility: path.join(outputDir, 'accessibility', 'index.html'),
    performance: path.join(outputDir, 'performance-accessibility-report.md')
  };
  
  summary += '## Test Results\n\n';
  
  Object.entries(resultFiles).forEach(([testType, filePath]) => {
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅ Generated' : '❌ Missing';
    summary += `- **${testType.charAt(0).toUpperCase() + testType.slice(1)}**: ${status}\n`;
    
    if (exists) {
      summary += `  - Location: \`${filePath}\`\n`;
      
      // Add file size for reference
      try {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        summary += `  - Size: ${sizeKB} KB\n`;
      } catch (error) {
        // Ignore stat errors
      }
    }
  });
  
  // Parse Playwright results if available
  const playwrightResultsPath = path.join(outputDir, 'results.json');
  if (fs.existsSync(playwrightResultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf8'));
      
      summary += '\n## Playwright Test Results\n\n';
      summary += `- **Total Tests**: ${results.stats?.expected || 0}\n`;
      summary += `- **Passed**: ${results.stats?.passed || 0}\n`;
      summary += `- **Failed**: ${results.stats?.failed || 0}\n`;
      summary += `- **Skipped**: ${results.stats?.skipped || 0}\n`;
      summary += `- **Duration**: ${((results.stats?.duration || 0) / 1000).toFixed(2)}s\n`;
      
      // List failed tests
      if (results.stats?.failed > 0) {
        summary += '\n### Failed Tests\n\n';
        results.suites?.forEach((suite: any) => {
          suite.specs?.forEach((spec: any) => {
            spec.tests?.forEach((test: any) => {
              if (test.results?.some((result: any) => result.status === 'failed')) {
                summary += `- ❌ ${test.title}\n`;
              }
            });
          });
        });
      }
      
    } catch (error) {
      console.warn('Failed to parse Playwright results:', error);
    }
  }
  
  // Add performance metrics summary if available
  const performanceReportPath = path.join(outputDir, 'performance-accessibility-report.md');
  if (fs.existsSync(performanceReportPath)) {
    summary += '\n## Performance & Accessibility\n\n';
    summary += `Detailed report available: [performance-accessibility-report.md](${performanceReportPath})\n\n`;
  }
  
  // Add recommendations
  summary += '## Recommendations\n\n';
  summary += '### Next Steps\n\n';
  summary += '1. **Review Failed Tests**: Address any failing test cases\n';
  summary += '2. **Performance Optimization**: Focus on Core Web Vitals improvements\n';
  summary += '3. **Accessibility Issues**: Fix any WCAG compliance violations\n';
  summary += '4. **Monitoring Setup**: Implement continuous performance monitoring\n';
  summary += '5. **Documentation**: Update performance and accessibility guidelines\n\n';
  
  // Add useful links
  summary += '## Useful Links\n\n';
  summary += '- [Web Vitals](https://web.dev/vitals/)\n';
  summary += '- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)\n';
  summary += '- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)\n';
  summary += '- [Playwright Testing](https://playwright.dev/)\n';
  
  // Write summary
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(summaryPath, summary);
  console.log(`📋 Test summary generated: ${summaryPath}`);
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles() {
  const tempPaths = [
    'test-results/web-vitals-test.js',
    '.playwright',
    'temp-test-data'
  ];
  
  tempPaths.forEach(tempPath => {
    if (fs.existsSync(tempPath)) {
      try {
        if (fs.lstatSync(tempPath).isDirectory()) {
          fs.rmSync(tempPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(tempPath);
        }
        console.log(`🗑️  Cleaned up: ${tempPath}`);
      } catch (error) {
        console.warn(`Failed to cleanup ${tempPath}:`, error);
      }
    }
  });
}

/**
 * Archive test results for long-term storage
 */
async function archiveResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = `test-results-${timestamp}`;
  const archivePath = path.join('archives', archiveName);
  
  try {
    // Create archive directory
    if (!fs.existsSync('archives')) {
      fs.mkdirSync('archives', { recursive: true });
    }
    
    // Copy test-results to archive
    if (fs.existsSync('test-results')) {
      fs.cpSync('test-results', archivePath, { recursive: true });
      console.log(`📦 Results archived: ${archivePath}`);
    }
    
    // Keep only last 10 archives
    const archives = fs.readdirSync('archives')
      .filter(name => name.startsWith('test-results-'))
      .sort()
      .reverse();
    
    if (archives.length > 10) {
      const toDelete = archives.slice(10);
      toDelete.forEach(archiveName => {
        const archiveToDelete = path.join('archives', archiveName);
        fs.rmSync(archiveToDelete, { recursive: true, force: true });
        console.log(`🗑️  Deleted old archive: ${archiveToDelete}`);
      });
    }
    
  } catch (error) {
    console.warn('Failed to archive results:', error);
  }
}

/**
 * Display final test statistics
 */
function displayFinalStats() {
  console.log('\n📊 Test Execution Complete');
  console.log('==========================');
  
  // Check if all expected result files exist
  const expectedFiles = [
    'test-results/html/index.html',
    'test-results/test-summary.md'
  ];
  
  const generatedFiles = expectedFiles.filter(file => fs.existsSync(file));
  
  console.log(`📁 Generated Files: ${generatedFiles.length}/${expectedFiles.length}`);
  generatedFiles.forEach(file => {
    console.log(`   ✅ ${file}`);
  });
  
  const missingFiles = expectedFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    console.log(`❌ Missing Files: ${missingFiles.length}`);
    missingFiles.forEach(file => {
      console.log(`   ❌ ${file}`);
    });
  }
  
  console.log('\n🔍 Review Results:');
  console.log('   - Open test-results/html/index.html for detailed test results');
  console.log('   - Check test-results/test-summary.md for execution summary');
  console.log('   - Review test-results/performance-accessibility-report.md for insights');
  
  console.log('\n🚀 Ready for production deployment!');
}

export default globalTeardown;