import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'src/**/test-*.{js,ts}',
      'src/**/tests/*.{js,ts}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'proto',
      '**/*.d.ts',
      'src/test-setup.ts', // Exclude test setup file
      'src/test-reporter.ts', // Exclude test reporter file
      'src/test-utils/**' // Exclude test utilities directory
    ],
    
    // Environment
    environment: 'node',
    
    // Globals (describe, it, expect available without imports)
    globals: true,
    
    // Setup files
    setupFiles: ['./vitest.setup.ts'],
    
    // TypeScript support
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'proto/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test-utils/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Enhanced reporter for rich output
    reporter: ['verbose'],
    
    // Output file for JSON results
    outputFile: {
      json: './test-results.json'
    },
    
    // Watch mode
    watch: false,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Log level
    logLevel: 'info',
    
    // Show console output
    silent: false,
    
    // Show unhandled rejections
    onUnhandledRejection: 'strict'
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@types': resolve(__dirname, './src/types'),
      '@wallet': resolve(__dirname, './src/wallet-creation'),
      '@coin-txn': resolve(__dirname, './src/coin-txn'),
      '@grpc': resolve(__dirname, './src/grpc'),
      '@shared': resolve(__dirname, './src/shared'),
      '@api': resolve(__dirname, './src/api'),
      '@test-utils': resolve(__dirname, './src/test-utils')
    }
  },
  
  // ESM configuration
  esbuild: {
    target: 'node18'
  }
});
