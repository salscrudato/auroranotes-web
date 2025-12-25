import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // Firebase Auth popup
      'Cross-Origin-Embedder-Policy': 'unsafe-none', // Allow cross-origin resources
    },
    // Fix WebSocket HMR connection issues
    hmr: true, // Use default HMR settings (auto-detect)
  },

  build: {
    // Optimize bundle size
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    // Enable source maps for production debugging (optional, can disable for smaller builds)
    sourcemap: false,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('/react-dom/') || id.includes('/react/')) {
              return 'vendor-react';
            }
            // React Query
            if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) {
              return 'vendor-query';
            }
            // Virtual scrolling
            if (id.includes('@tanstack/react-virtual')) {
              return 'vendor-virtual';
            }
            // Firebase
            if (id.includes('firebase/')) {
              return 'vendor-firebase';
            }
            // Markdown rendering
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('mdast') || id.includes('hast') || id.includes('unified') || id.includes('micromark') || id.includes('unist')) {
              return 'vendor-markdown';
            }
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Other node_modules
            return 'vendor-misc';
          }
          // Keep lazy-loaded components in their own chunks (handled by React.lazy)
          return undefined;
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit - vendors are expected to be larger
    chunkSizeWarningLimit: 600,
  },

  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@tanstack/react-virtual',
      'react-markdown',
      'clsx',
      'tailwind-merge',
    ],
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
