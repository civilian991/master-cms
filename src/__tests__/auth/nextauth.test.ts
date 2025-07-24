import { authOptions } from '@/lib/auth/nextauth';
import { prisma } from '@/lib/prisma';
import { PasswordService } from '@/lib/auth/password';
import { MFAService } from '@/lib/auth/mfa';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userSiteRole: {
      findMany: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/password');
jest.mock('@/lib/auth/mfa');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockPasswordService = PasswordService.getInstance as jest.MockedFunction<typeof PasswordService.getInstance>;
const mockMFAService = MFAService.getInstance as jest.MockedFunction<typeof MFAService.getInstance>;

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credentials Provider', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        mfaEnabled: false,
        loginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSiteRoles = [
        {
          id: 1,
          userId: 1,
          siteId: 1,
          roleId: 2,
          assignedAt: new Date(),
          site: {
            id: 1,
            name: 'Test Site',
            domain: 'test.com',
          },
          role: {
            id: 2,
            name: 'EDITOR',
            description: 'Editor role',
          },
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.userSiteRole.findMany.mockResolvedValue(mockSiteRoles as any);
      mockPasswordService.mockReturnValue({
        verifyPassword: jest.fn().mockResolvedValue(true),
        handleSuccessfulLogin: jest.fn().mockResolvedValue(),
      } as any);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        siteId: '1',
      };

      const result = await authOptions.providers[0].authorize!(credentials, null);

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        siteId: 1,
        roleId: 2,
        roleName: 'EDITOR',
        permissions: expect.any(Array),
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });

      expect(mockPrisma.userSiteRole.findMany).toHaveBeenCalledWith({
        where: { userId: 1, siteId: 1 },
        include: {
          site: true,
          role: true,
        },
      });

      const passwordService = mockPasswordService();
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        'password123',
        'hashedPassword'
      );

      expect(passwordService.handleSuccessfulLogin).toHaveBeenCalledWith(1);
    });

    it('should reject authentication with invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
        siteId: '1',
      };

      const result = await authOptions.providers[0].authorize!(credentials, null);

      expect(result).toBeNull();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });

    it('should reject authentication with wrong password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        loginAttempts: 0,
        lockedUntil: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPasswordService.mockReturnValue({
        verifyPassword: jest.fn().mockResolvedValue(false),
        handleFailedLogin: jest.fn().mockResolvedValue(),
      } as any);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
        siteId: '1',
      };

      const result = await authOptions.providers[0].authorize!(credentials, null);

      expect(result).toBeNull();
      const passwordService = mockPasswordService();
      expect(passwordService.handleFailedLogin).toHaveBeenCalledWith(1);
    });

    it('should reject authentication for locked account', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 3600000), // Locked for 1 hour
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        siteId: '1',
      };

      const result = await authOptions.providers[0].authorize!(credentials, null);

      expect(result).toBeNull();
    });

    it('should require MFA when enabled', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        mfaEnabled: true,
        loginAttempts: 0,
        lockedUntil: null,
      };

      const mockSiteRoles = [
        {
          id: 1,
          userId: 1,
          siteId: 1,
          roleId: 2,
          site: { id: 1, name: 'Test Site' },
          role: { id: 2, name: 'EDITOR' },
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.userSiteRole.findMany.mockResolvedValue(mockSiteRoles as any);
      mockPasswordService.mockReturnValue({
        verifyPassword: jest.fn().mockResolvedValue(true),
      } as any);
      mockMFAService.mockReturnValue({
        verifyMFAToken: jest.fn().mockResolvedValue(false),
      } as any);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        mfaToken: '123456',
        siteId: '1',
      };

      const result = await authOptions.providers[0].authorize!(credentials, null);

      expect(result).toBeNull();
      const mfaService = mockMFAService();
      expect(mfaService.verifyMFAToken).toHaveBeenCalledWith(1, '123456');
    });
  });

  describe('JWT Callback', () => {
    it('should include user information in JWT token', async () => {
      const token = {};
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        siteId: 1,
        roleId: 2,
        roleName: 'EDITOR',
        permissions: ['content:read', 'content:write'],
      };

      const result = await authOptions.callbacks!.jwt!({ token, user } as any, {} as any);

      expect(result).toEqual({
        ...token,
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        siteId: 1,
        roleId: 2,
        roleName: 'EDITOR',
        permissions: ['content:read', 'content:write'],
      });
    });

    it('should preserve existing token data when no user provided', async () => {
      const token = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        siteId: 1,
        roleId: 2,
        roleName: 'EDITOR',
        permissions: ['content:read', 'content:write'],
      };

      const result = await authOptions.callbacks!.jwt!({ token } as any, {} as any);

      expect(result).toEqual(token);
    });
  });

  describe('Session Callback', () => {
    it('should include user information in session', async () => {
      const session = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          siteId: 1,
          roleId: 2,
          roleName: 'EDITOR',
          permissions: ['content:read', 'content:write'],
        },
      };

      const token = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        siteId: 1,
        roleId: 2,
        roleName: 'EDITOR',
        permissions: ['content:read', 'content:write'],
      };

      const result = await authOptions.callbacks!.session!({ session, token } as any);

      expect(result).toEqual({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          siteId: 1,
          roleId: 2,
          roleName: 'EDITOR',
          permissions: ['content:read', 'content:write'],
        },
      });
    });
  });

  describe('Sign In Callback', () => {
    it('should log security event on successful sign in', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        siteId: 1,
        roleId: 2,
        roleName: 'EDITOR',
      };

      const account = { provider: 'credentials' };
      const profile = {};

      await authOptions.callbacks!.signIn!({ user, account, profile } as any);

      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: {
          type: 'LOGIN_SUCCESS',
          userId: 1,
          siteId: 1,
          ip: 'unknown',
          userAgent: 'unknown',
          metadata: {
            provider: 'credentials',
            roleId: 2,
            roleName: 'EDITOR',
          },
        },
      });
    });
  });

  describe('Redirect Callback', () => {
    it('should redirect to dashboard for authenticated users', async () => {
      const url = '/api/auth/signin';
      const baseUrl = 'http://localhost:3000';

      const result = await authOptions.callbacks!.redirect!({ url, baseUrl } as any);

      expect(result).toBe('/dashboard');
    });

    it('should redirect to signin page for unauthenticated users', async () => {
      const url = '/api/auth/signin';
      const baseUrl = 'http://localhost:3000';

      const result = await authOptions.callbacks!.redirect!({ url, baseUrl } as any);

      expect(result).toBe('/auth/signin');
    });
  });

  describe('Events', () => {
    it('should log security event on sign in', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        siteId: 1,
        roleId: 2,
        roleName: 'EDITOR',
      };

      await authOptions.events!.signIn!({ user } as any);

      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: {
          type: 'LOGIN_SUCCESS',
          userId: 1,
          siteId: 1,
          ip: 'unknown',
          userAgent: 'unknown',
          metadata: {
            provider: 'credentials',
            roleId: 2,
            roleName: 'EDITOR',
          },
        },
      });
    });

    it('should log security event on sign out', async () => {
      const token = {
        id: '1',
        email: 'test@example.com',
        siteId: 1,
      };

      await authOptions.events!.signOut!({ token } as any);

      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: {
          type: 'LOGOUT',
          userId: 1,
          siteId: 1,
          ip: 'unknown',
          userAgent: 'unknown',
          metadata: {},
        },
      });
    });
  });
}); 