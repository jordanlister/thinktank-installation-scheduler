/**
 * Global Test Setup
 * 
 * Prepares the test environment for performance and accessibility testing
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up test environment...');
  
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log(`⏳ Waiting for application at ${baseURL}...`);
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Verify critical pages are accessible
    const criticalPages = ['/', '/features', '/pricing'];
    
    for (const path of criticalPages) {
      try {
        await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' });
        console.log(`✅ Verified page: ${path}`);
      } catch (error) {
        console.error(`❌ Failed to load critical page ${path}:`, error);
        throw new Error(`Critical page ${path} is not accessible`);
      }
    }
    
    // Clear any existing test data or caches
    await page.evaluate(() => {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any performance marks
      if (performance.clearMarks) {
        performance.clearMarks();
      }
      
      if (performance.clearMeasures) {
        performance.clearMeasures();
      }
    });
    
    // Set up performance monitoring
    await page.addInitScript(() => {
      // Initialize performance monitoring
      window.testStartTime = Date.now();
      
      // Track console errors during tests
      window.testErrors = [];
      const originalError = console.error;
      console.error = (...args: any[]) => {
        window.testErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      // Track network failures
      window.networkFailures = [];
      
      // Performance observer for test insights
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.name.includes('test-')) {
                console.log(`🔍 Test metric: ${entry.name} = ${entry.duration}ms`);
              }
            });
          });
          observer.observe({ entryTypes: ['measure'] });
        } catch (error) {
          console.warn('Performance observer setup failed:', error);
        }
      }
    });
    
    console.log('✅ Test environment setup completed');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

// Type declarations for global test variables
declare global {
  interface Window {
    testStartTime: number;
    testErrors: string[];
    networkFailures: any[];
  }
}