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
    // Alternatively, if still failing, uncomment:
    // hmr: {
    //   port: 5173,
    // },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
