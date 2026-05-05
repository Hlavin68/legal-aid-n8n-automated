/**
 * Test Setup File
 * File: server/tests/setup.js
 * Runs before all test suites
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('DeprecationWarning') ||
        args[0].includes('MaxListenersExceededWarning'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global timeout
jest.setTimeout(30000);

// Clear all timers after each test
afterEach(() => {
  jest.clearAllTimers();
});

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
