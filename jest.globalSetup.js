module.exports = async () => {
  // Set up environment variables for testing
  process.env.NEXT_PUBLIC_APP_ENV = 'test';
  process.env.SITE_ID = 'test';
  process.env.SITE_NAME = 'Test Site';
  process.env.SITE_URL = 'http://localhost:3000';
  process.env.SITE_LOCALE = 'en';
  process.env.SITE_THEME = 'default';
  process.env.SITE_BRANDING = 'default';
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  
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