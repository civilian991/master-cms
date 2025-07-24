import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PasswordService } from '@/lib/auth/password';
import { EmailService } from '@/lib/auth/email';
import { getUserFromRequest, requireAuth, requireRole } from '@/lib/auth/middleware';
import { z } from 'zod';

const passwordService = new PasswordService();
const emailService = new EmailService();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  roleId: z.number().int().positive(),
  siteId: z.number().int().positive(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  roleId: z.number().int().positive().optional(),
  siteId: z.number().int().positive().optional(),
});

const bulkUserSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    name: z.string().min(2).max(100),
    roleId: z.number().int().positive(),
    siteId: z.number().int().positive(),
  })),
});

// GET /api/auth/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users
    if (!user.permissions.includes('user:read')) {
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
      where.siteRoles = {
        some: {
          roleId: parseInt(roleId),
        },
      };
    }

    if (siteId) {
      where.siteRoles = {
        some: {
          siteId: parseInt(siteId),
        },
      };
    }

    if (status === 'locked') {
      where.lockedUntil = { gt: new Date() };
    } else if (status === 'active') {
      where.OR = [
        { lockedUntil: null },
        { lockedUntil: { lt: new Date() } },
      ];
    }

    // Get users with their site roles
    const users = await prisma.user.findMany({
      where,
      include: {
        siteRoles: {
          include: {
            site: true,
            role: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users,
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create users
    if (!user.permissions.includes('user:create')) {
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

    // Create user with transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
        },
      });

      // Assign site role
      await tx.userSiteRole.create({
        data: {
          userId: user.id,
          siteId: validatedData.siteId,
          roleId: validatedData.roleId,
        },
      });

      return user;
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(newUser.email, newUser.name || '');

    // Log security event
    await prisma.securityEvent.create({
      data: {
        type: 'USER_CREATED',
        userId: user.id,
        siteId: validatedData.siteId,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          createdUserId: newUser.id,
          roleId: validatedData.roleId,
        },
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update users
    if (!user.permissions.includes('user:update')) {
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

            // Update or create site role
            await tx.userSiteRole.upsert({
              where: {
                userId_siteId: {
                  userId: existingUser.id,
                  siteId: userData.siteId,
                },
              },
              update: {
                roleId: userData.roleId,
              },
              create: {
                userId: existingUser.id,
                siteId: userData.siteId,
                roleId: userData.roleId,
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
              },
            });

            await tx.userSiteRole.create({
              data: {
                userId: user.id,
                siteId: userData.siteId,
                roleId: userData.roleId,
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
        { error: 'Validation error', details: error.errors },
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