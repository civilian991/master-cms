# Testing Guide for Master CMS

## 🚨 CRITICAL: Preventing Database Interference

**NEVER run tests with production database URLs!** Tests are designed to use mocked Prisma clients to prevent data corruption.

## Test Environment Setup

### 1. Environment Isolation

Tests automatically use mocked Prisma clients and isolated environment variables:

```bash
# Safe test commands (use mocked database)
npm run test                # Unit tests with mocked Prisma
npm run test:watch         # Watch mode with mocked Prisma
npm run test:coverage      # Coverage with mocked Prisma

# Integration tests (use separate test database)
npm run test:integration   # Only for testing with real test DB
```

### 2. Database Safety

The test configuration includes multiple safety measures:

- **Mocked Prisma Client**: All database operations are mocked by default
- **Environment Detection**: Warns if production database URL is detected
- **Isolated Test Database**: Integration tests use separate `test_cms` database
- **Redis Isolation**: Tests use Redis database 1 instead of default database 0

### 3. Test Environment Variables

Tests automatically set these safe environment variables:

```bash
NODE_ENV=test
NEXT_PUBLIC_APP_ENV=test
DISABLE_EMAIL_SENDING=true
DISABLE_EXTERNAL_APIS=true
DISABLE_ANALYTICS=true
MOCK_EXTERNAL_SERVICES=true
```

## Test Types

### Unit Tests (`src/__tests__/`)

**Location**: `src/__tests__/components/`, `src/__tests__/utils/`
**Database**: Fully mocked Prisma client
**Purpose**: Test individual components and utilities

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Service Tests (`src/__tests__/services/`)

**Location**: `src/__tests__/services/`
**Database**: Mocked Prisma with predictable responses
**Purpose**: Test business logic and service methods

```typescript
import { contentService } from '@/lib/services/content';
import { mockArticle } from '@/tests/utils/test-utils';

// Prisma is automatically mocked
describe('Content Service', () => {
  it('creates article correctly', async () => {
    const result = await contentService.createArticle(mockArticle);
    expect(result).toBeDefined();
  });
});
```

### API Route Tests (`src/__tests__/api/`)

**Location**: `src/__tests__/api/`
**Database**: Mocked Prisma client
**Purpose**: Test API endpoints without database

```typescript
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/users/route';

describe('/api/users', () => {
  it('returns users list', async () => {
    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.users).toBeDefined();
  });
});
```

### Integration Tests (`src/__tests__/integration/`)

**Location**: `src/__tests__/integration/`
**Database**: Separate test database (`test_cms`)
**Purpose**: Test full workflows with real database

```bash
# Only run integration tests when needed
npm run test:integration
```

## Mock Data and Utilities

### Using Test Utils

```typescript
import { 
  mockUser, 
  mockSite, 
  mockArticle,
  createMockPaginatedResponse 
} from '@/tests/utils/test-utils';

describe('User Management', () => {
  beforeEach(() => {
    // Mock Prisma responses
    const mockPrisma = require('@/lib/prisma').prisma;
    mockPrisma.user.findMany.mockResolvedValue([mockUser]);
  });
});
```

### Creating Custom Mocks

```typescript
const customMockUser = {
  ...mockUser,
  role: 'ADMIN',
  email: 'admin@test.com',
};
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Client Tests**: Use `jsdom` environment for React components
- **Server Tests**: Use `node` environment for API routes and services
- **Mocked Prisma**: All database operations are mocked
- **Coverage**: Excludes generated Prisma client

### Mock Setup (`jest.setup.js`)

Automatically mocks:
- Prisma Client (all database operations)
- Next.js Router and Navigation
- External APIs and services

## Best Practices

### 1. Always Use Mocks for Unit Tests

```typescript
// ✅ Good: Uses mocked Prisma
describe('User Service', () => {
  it('creates user', async () => {
    const mockPrisma = require('@/lib/prisma').prisma;
    mockPrisma.user.create.mockResolvedValue(mockUser);
    
    const result = await userService.createUser(userData);
    expect(result).toEqual(mockUser);
  });
});
```

```typescript
// ❌ Bad: Tries to use real database
describe('User Service', () => {
  it('creates user', async () => {
    // This would fail because Prisma is mocked
    const result = await prisma.user.create({ data: userData });
  });
});
```

### 2. Reset Mocks Between Tests

```typescript
import { resetAllMocks } from '@/tests/utils/test-utils';

describe('Service Tests', () => {
  afterEach(() => {
    resetAllMocks();
  });
});
```

### 3. Use Descriptive Test Data

```typescript
const testUser = {
  ...mockUser,
  email: 'specific-test@example.com',
  name: 'Specific Test User',
};
```

### 4. Test Error Conditions

```typescript
it('handles database errors gracefully', async () => {
  const mockPrisma = require('@/lib/prisma').prisma;
  mockPrisma.user.create.mockRejectedValue(new Error('Database error'));
  
  await expect(userService.createUser(userData)).rejects.toThrow('Database error');
});
```

## Troubleshooting

### "Database not found" Error

**Cause**: Test is trying to use real database instead of mocks
**Solution**: Ensure Prisma is properly mocked in test setup

### "Environment not test" Warning

**Cause**: Running tests without proper environment setup
**Solution**: Use `npm run test` instead of `jest` directly

### "Production database detected" Warning

**Cause**: Test environment has production database URL
**Solution**: Tests will use mocks automatically, but check environment setup

### Tests Affecting Real Data

**Cause**: Prisma mocking not working properly
**Solution**: 
1. Check `jest.setup.js` has proper mocks
2. Verify `NODE_ENV=test` is set
3. Use test utilities for consistent mocking

## Running Tests Safely

```bash
# Safe commands (always use these)
npm run test                # Unit tests only
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# Dangerous commands (avoid in development)
jest                       # May bypass environment setup
npm test                   # May use wrong configuration
```

## Seeding Development Database

After running tests, if you need to restore development data:

```bash
# Reset and re-seed development database
npm run db:push -- --force-reset
npm run db:seed
```

## Summary

✅ **Tests are safe** - Use mocked Prisma client by default
✅ **Data is protected** - Multiple safety measures prevent corruption  
✅ **Environment isolated** - Test environment completely separate
✅ **Easy to run** - Use standard npm scripts

❌ **Never run jest directly** - Always use npm scripts
❌ **Never test with production DB** - Mocks prevent this automatically
❌ **Never skip test setup** - Environment validation is critical 