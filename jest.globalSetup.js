module.exports = async () => {
  // Store original DATABASE_URL to prevent test interference
  const originalDatabaseUrl = process.env.DATABASE_URL;
  
  // Warn if tests might affect production data
  if (originalDatabaseUrl && !originalDatabaseUrl.includes('test')) {
    console.warn('⚠️  WARNING: Tests detected with production database URL!');
    console.warn('⚠️  Tests will use mocked Prisma client to prevent data corruption.');
  }
  
  // Set up environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_APP_ENV = 'test';
  process.env.SITE_ID = 'test';
  process.env.SITE_NAME = 'Test Site';
  process.env.SITE_URL = 'http://localhost:3000';
  process.env.SITE_LOCALE = 'en';
  process.env.SITE_THEME = 'default';
  process.env.SITE_BRANDING = 'default';
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  
  // Test-specific settings that prevent external interference
  process.env.DISABLE_EMAIL_SENDING = 'true';
  process.env.DISABLE_EXTERNAL_APIS = 'true';
  process.env.DISABLE_ANALYTICS = 'true';
  process.env.DISABLE_WEBHOOKS = 'true';
  process.env.MOCK_EXTERNAL_SERVICES = 'true';
  
  // CRITICAL: Use isolated test database only for integration tests
  // For unit tests, Prisma is mocked in jest.setup.js
  if (process.env.JEST_WORKER_ID && !originalDatabaseUrl?.includes('test')) {
    // Only for CI or when explicitly testing with database
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_cms';
  }
  
  // Use separate Redis instance for tests
  process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use database 1 for tests
  
  // Disable console warnings for cleaner test output
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Module not found') ||
       args[0].includes('Failed to load') ||
       args[0].includes('deprecated'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
}; 