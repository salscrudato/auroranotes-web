/**
 * Vitest test setup file
 * Configures the testing environment with jsdom and testing-library matchers
 */

import '@testing-library/jest-dom';

// Mock import.meta.env for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE: 'https://test-api.example.com',
    VITE_API_KEY: 'test-api-key',
  },
  writable: true,
});

