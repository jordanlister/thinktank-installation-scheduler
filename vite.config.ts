import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { securityPlugin, securityConfigs } from './src/lib/security/vitePlugin'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    root: process.cwd(),
    plugins: [
      react({
        // Enable React Fast Refresh in development
        fastRefresh: command === 'serve',
        babel: {
          plugins: command === 'build' ? [
            ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]
          ] : []
        }
      }),
      nodePolyfills({
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
        // Whether to polyfill Node.js built-ins like `events`, `stream`, etc.
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // Override the default polyfills for specific modules.
        overrides: {
          // Since Vite and its ecosystem explicitly excludes `fs`, we have to disable it.
          fs: false,
        },
      }),
      // Security plugin with environment-specific configuration
      securityPlugin(securityConfigs[mode as keyof typeof securityConfigs] || securityConfigs.development)
    ],
    
    // Path resolution
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

    // Development server configuration
    server: {
      port: 3000,
      host: true,
      open: true,
      hmr: {
        overlay: true
      }
    },

    // Preview server configuration
    preview: {
      port: 4173,
      host: true
    },

    // Build configuration
    build: {
      target: 'es2022',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: 'esbuild',
      
      // Optimize chunk splitting
      rollupOptions: {
        external: [
          // Only keep truly server-side modules as external
          'fs',
          'worker_threads',
          'child_process',
          'cluster',
          'dgram',
          'dns',
          'domain',
          'tty',
          'vm',
          'node:module',
          'fs/promises'
        ],
        output: {
          // Separate vendor chunks for better caching
          manualChunks: {
            // Core React dependencies
            vendor: ['react', 'react-dom', 'react-router-dom'],
            
            // UI and styling
            ui: ['lucide-react'],
            
            // Data processing libraries
            data: ['exceljs', 'csv-parser', 'file-saver'],
            
            // PDF and document generation
            documents: ['pdf-lib', '@react-pdf/renderer', 'jspdf', 'html2canvas'],
            
            // Email and templates (client-side only)
            communications: ['handlebars'],
            
            // Charts and visualization
            charts: ['chart.js', 'react-chartjs-2'],
            
            // Maps and geographic
            maps: ['leaflet', 'react-leaflet', 'geolib', '@turf/turf', 'leaflet.markercluster', 'leaflet-routing-machine', 'geokdbush'],
            
            // State management and utilities
            state: ['zustand', 'date-fns'],
            
            // Database
            database: ['@supabase/supabase-js']
          },
          
          // Asset naming with hashes for cache busting
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.css$/.test(name ?? '')) {
              return 'assets/css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      },

      // ESBuild options for minification
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },

      // Asset optimization
      assetsInlineLimit: 4096, // 4kb
      cssCodeSplit: true,
      
      // Report options
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'zustand',
        'lucide-react',
        'date-fns',
        'leaflet',
        'react-leaflet'
      ],
      exclude: [
        '@vite/client', 
        '@vite/env',
        'nodemailer',
        'csv-parser',
        'fs',
        'stream',
        'util',
        'buffer'
      ]
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // CSS configuration
    css: {
      devSourcemap: command === 'serve',
      modules: {
        localsConvention: 'camelCase'
      },
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ]
      }
    },

    // Environment variable handling
    envPrefix: 'VITE_',
    
    // Base path for deployment
    base: env.VITE_BASE_PATH || '/',

    // Enable/disable CSS code splitting
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` }
        } else {
          return { css: `/${filename}` }
        }
      }
    }
  }
})
