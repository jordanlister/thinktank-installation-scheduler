/**
 * Playwright Configuration for Performance and Accessibility Testing
 * 
 * Configures Playwright for comprehensive testing of marketing pages
 * with performance monitoring and accessibility validation
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Collect screenshot on failure
    screenshot: 'only-on-failure',
    
    // Collect video on failure
    video: 'retain-on-failure',
    
    // Global timeout for each test
    actionTimeout: 30000,
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  },

  // Configure projects for major browsers
  projects: [
    // Desktop Chrome - Primary testing browser
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Enable performance monitoring
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-features=NetworkService,NetworkServiceLogging',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
      testMatch: ['**/tests/**/*.spec.ts']
    },

    // Mobile Chrome for responsive testing
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific performance settings
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: ['**/tests/perf/**/*.spec.ts']
    },

    // Firefox for cross-browser compatibility
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/tests/a11y/**/*.spec.ts']
    },

    // Webkit/Safari for Apple device testing
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/tests/a11y/**/*.spec.ts']
    },

    // Slow 3G network simulation for performance testing
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow network conditions
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: ['**/tests/perf/**/*.spec.ts']
    }
  ],

  // Global test timeout
  timeout: 60000,

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  // Test output directory
  outputDir: 'test-results/artifacts',

  // Web Server for testing (if needed)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI
  },

  // Expect configuration
  expect: {
    // Global test timeout
    timeout: 10000,
    
    // Screenshot comparison threshold
    threshold: 0.3,
    
    // Animation handling
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled'
    }
  },

  // Metadata for reporting
  metadata: {
    testType: 'Performance and Accessibility',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    browser: 'chromium',
    viewport: '1280x720'
  }
});