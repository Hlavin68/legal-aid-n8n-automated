/**
 * Jest Configuration for CaseBase Tests
 * File: server/jest.config.js
 */

export default {
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  
  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/caseBaseController.js',
    'models/CaseBase.js',
    'routes/caseBase.js',
    'middleware/**/*.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Transform settings
  transform: {},
  
  // Module paths
  moduleFileExtensions: ['js', 'json'],
  
  // Timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module name mapper for aliases if needed
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Max workers for parallel testing
  maxWorkers: '50%',
  
  // Bail on first error in watch mode
  bail: false,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: false
};
