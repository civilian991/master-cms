import { jest } from '@jest/globals';

// Mock data generators for consistent testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  siteId: 'test-site-id',
  isActive: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

export const mockSite = {
  id: 'test-site-id',
  name: 'Test Site',
  domain: 'test.localhost',
  description: 'Test site description',
  locale: 'en',
  theme: 'default',
  branding: 'default',
  isActive: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

export const mockArticle = {
  id: 'test-article-id',
  titleEn: 'Test Article',
  titleAr: null,
  contentEn: 'Test content',
  contentAr: null,
  slug: 'test-article',
  status: 'PUBLISHED',
  workflowState: 'PUBLISHED',
  published: true,
  publishedAt: new Date('2023-01-01'),
  version: 1,
  viewCount: 0,
  engagementScore: 0,
  authorId: 'test-user-id',
  siteId: 'test-site-id',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

// Helper to create mock Prisma responses
export const createMockPrismaResponse = (data: any, count?: number) => ({
  ...data,
  ...(count !== undefined && { count }),
});

// Helper to create paginated mock responses
export const createMockPaginatedResponse = (items: any[], total: number, page: number = 1, limit: number = 20) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

// Environment validation for tests
export const validateTestEnvironment = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Test utilities should only be used in test environment');
  }
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test') && !process.env.MOCK_EXTERNAL_SERVICES) {
    console.warn('⚠️  WARNING: Tests are running with production database URL!');
    console.warn('⚠️  Make sure Prisma is properly mocked to prevent data corruption.');
  }
};

// Reset all mocks between tests
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
};

// Validate that tests don't affect real data
validateTestEnvironment(); 