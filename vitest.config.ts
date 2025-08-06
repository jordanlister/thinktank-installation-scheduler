/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  
  // Path resolution (same as main vite config)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@stores': resolve(__dirname, './src/stores'),
      '@types': resolve(__dirname, './src/types'),
      '@constants': resolve(__dirname, './src/constants'),
      '@hooks': resolve(__dirname, './src/hooks')
    }
  },

  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup
    globals: true,
    
    // Setup files
    setupFiles: ['./src/test/setup.tsx'],
    
    // Include and exclude patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'test-data'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.d.ts',
        'src/**/*.config.{js,ts}',
        'src/**/*.test.{js,ts,jsx,tsx}',
        'src/**/*.spec.{js,ts,jsx,tsx}',
        'dist/',
        'coverage/',
        '*.config.{js,ts}',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeout
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Watch options
    watch: false,
    
    // Reporter options
    reporter: ['verbose', 'junit', 'html'],
    outputFile: {
      junit: './test-results/junit.xml',
      html: './test-results/html/index.html'
    },
    
    // Mock options
    clearMocks: true,
    restoreMocks: true,
    
    // Environment variables
    env: {
      NODE_ENV: 'test',
      VITE_APP_ENVIRONMENT: 'test'
    },
    
    // Pool options for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },
    
    // Retry failed tests
    retry: 2,
    
    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,
    
    // Silent console in tests unless debugging
    silent: false,
    
    // Transform options
    deps: {
      external: []
    }
  },

  // Define global constants for tests
  define: {
    __TEST__: true,
    __DEV__: false,
    global: 'globalThis'
  }
})