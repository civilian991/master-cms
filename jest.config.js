const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/generated/**/*', // Exclude generated Prisma client
  ],
  testTimeout: 30000, // Increase timeout for long-running tests
  globalSetup: '<rootDir>/jest.globalSetup.js',
  clearMocks: true,
  resetMocks: true,
  // Different environments for different test types
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/src/__tests__/components/**/*.test.{js,jsx,ts,tsx}'],
    },
    {
      displayName: 'server', 
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/{auth,services,database,api}/**/*.test.{js,ts}'],
    },
  ],
  restoreMocks: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 