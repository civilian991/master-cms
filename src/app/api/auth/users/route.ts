import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PasswordService } from '@/lib/auth/password';
import { EmailService } from '@/lib/auth/email';
import { getUserFromRequest, requireAuth, requireRole } from '@/lib/auth/middleware';
import { z } from 'zod';

const passwordService = PasswordService.getInstance();
const emailService = EmailService.getInstance();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  roleId: z.string().optional(),
  siteId: z.string(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  roleId: z.string().optional(),
  siteId: z.string().optional(),
});

const bulkUserSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    name: z.string().min(2).max(100),
    roleId: z.string().optional(),
    siteId: z.string(),
  })),
});

// GET /api/auth/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users
    const hasViewPermission = user.permissions.includes('user:read') || 
                             user.permissions.includes('VIEW_USERS') ||
                             user.role === 'ADMIN' || 
                             user.role === 'SUPER_ADMIN';
    
    if (!hasViewPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const roleId = searchParams.get('roleId');
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status'); // active, locked, etc.

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      where.role = roleId as any;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    // Note: lockedUntil field doesn't exist in current schema, so we skip this filter
    // if (status === 'locked') {
    //   where.lockedUntil = { gt: new Date() };
    // } else if (status === 'active') {
    //   where.OR = [
    //     { lockedUntil: null },
    //     { lockedUntil: { lt: new Date() } },
    //   ];
    // }

    // Get users with their site and permissions
    const users = await prisma.user.findMany({
      where,
      include: {
        site: true,
        permissions: {
          include: {
            site: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Transform users to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user.id, // Keep as string (CUID)
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      emailVerified: false, // Default value since field doesn't exist in schema
      mfaEnabled: false, // Default value since field doesn't exist in schema
      lastLoginAt: null, // Default value since field doesn't exist in schema
      loginCount: 0, // Default value since field doesn't exist in schema
      loginAttempts: 0, // Default value since field doesn't exist in schema
      lockedUntil: null, // Default value since field doesn't exist in schema
      avatar: null, // Default value since field doesn't exist in schema
      locale: 'en' as const, // Default value
      createdAt: user.createdAt.toISOString(),
      siteRoles: [{
        id: user.site?.id || 'default',
        site: {
          id: user.site?.id || 'default',
          name: user.site?.name || 'Default Site',
        },
        role: {
          id: user.role,
          name: user.role,
        },
      }],
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/auth/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create users
    const hasCreatePermission = user.permissions.includes('user:create') || 
                               user.permissions.includes('MANAGE_USERS') ||
                               user.role === 'ADMIN' || 
                               user.role === 'SUPER_ADMIN';
    
    if (!hasCreatePermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(validatedData.password);

    // Create user with site connection
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: (validatedData.roleId as any) || 'USER', // Use provided role or default to USER
        siteId: validatedData.siteId,
      },
      include: {
        site: true,
      },
    });

    // Create site permission for the user (if needed - currently handled by the role field on User)
    // Note: SitePermission is optional for basic role-based access
    try {
      await prisma.sitePermission.create({
        data: {
          userId: newUser.id,
          siteId: validatedData.siteId,
          role: (validatedData.roleId as any) || 'USER',
          permissions: { defaultUserPermissions: true },
        },
      });
    } catch (error) {
      console.log('SitePermission creation skipped:', error);
      // Not critical for basic functionality
    }

    // Send welcome email
    await emailService.sendWelcomeEmail(newUser.email, newUser.name || '');

    // Log security event
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'ADMIN_ACTION',
          severity: 'LOW',
          userId: user.id as string,
          siteId: user.siteId,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || '',
          success: true,
          detected: true,
          resolved: true,
          falsePositive: false,
          responseActions: [],
          detectedAt: new Date(),
          metadata: {
            action: 'USER_CREATED',
            createdUserId: newUser.id,
            roleId: validatedData.roleId,
          },
        },
      });
    } catch (error) {
      console.log('Security event logging failed:', error);
      // Not critical for user creation
    }

    return NextResponse.json(
      { message: 'User created successfully', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/users - Bulk update users
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update users
    const hasUpdatePermission = user.permissions.includes('user:update') || 
                               user.permissions.includes('MANAGE_USERS') ||
                               user.role === 'ADMIN' || 
                               user.role === 'SUPER_ADMIN';
    
    if (!hasUpdatePermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = bulkUserSchema.parse(body);

    const results = await Promise.allSettled(
      validatedData.users.map(async (userData) => {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          // Update existing user
          const hashedPassword = await passwordService.hashPassword('temporary-password');
          
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: existingUser.id },
              data: {
                name: userData.name,
                password: hashedPassword,
              },
            });

            // Update or create site permission
            await tx.sitePermission.upsert({
              where: {
                siteId_userId: {
                  userId: existingUser.id,
                  siteId: userData.siteId.toString(),
                },
              },
              update: {
                role: 'USER',
                permissions: { defaultUserPermissions: true },
              },
              create: {
                userId: existingUser.id,
                siteId: userData.siteId.toString(),
                role: 'USER',
                permissions: { defaultUserPermissions: true },
              },
            });
          });

          return { email: userData.email, status: 'updated' };
        } else {
          // Create new user
          const hashedPassword = await passwordService.hashPassword('temporary-password');
          
          const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email: userData.email,
                name: userData.name,
                password: hashedPassword,
                siteId: userData.siteId.toString(),
              },
            });

            await tx.sitePermission.create({
              data: {
                userId: user.id,
                siteId: userData.siteId.toString(),
                role: 'USER',
                permissions: { defaultUserPermissions: true },
              },
            });

            return user;
          });

          // Send welcome email with password reset
          await emailService.sendWelcomeEmail(newUser.email, newUser.name || '');

          return { email: userData.email, status: 'created' };
        }
      })
    );

    const successful = results.filter(
      (result) => result.status === 'fulfilled'
    ).length;
    const failed = results.filter((result) => result.status === 'rejected').length;

    return NextResponse.json({
      message: `Bulk operation completed: ${successful} successful, ${failed} failed`,
      results: results.map((result, index) => ({
        email: validatedData.users[index].email,
        status: result.status === 'fulfilled' ? result.value : 'failed',
        error: result.status === 'rejected' ? result.reason : undefined,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in bulk user operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 