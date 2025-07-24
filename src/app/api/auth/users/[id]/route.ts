import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PasswordService } from '@/lib/auth/password';
import { EmailService } from '@/lib/auth/email';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

const passwordService = PasswordService.getInstance();
const emailService = EmailService.getInstance();

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  roleId: z.number().int().positive().optional(),
  siteId: z.number().int().positive().optional(),
  mfaEnabled: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// GET /api/auth/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users
    if (!user.permissions.includes('user:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        siteRoles: {
          include: {
            site: true,
            role: true,
          },
        },
        securityEvents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive information
    const { password, mfaSecret, backupCodes, ...safeUser } = targetUser;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update users
    if (!user.permissions.includes('user:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update user with transaction
    const updatedUser = await prisma.$transaction(async (tx: any) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name: validatedData.name,
          email: validatedData.email,
          mfaEnabled: validatedData.mfaEnabled,
        },
      });

      // Update site role if provided
      if (validatedData.roleId && validatedData.siteId) {
        await tx.userSiteRole.upsert({
          where: {
            userId_siteId: {
              userId,
              siteId: validatedData.siteId,
            },
          },
          update: {
            roleId: validatedData.roleId,
          },
          create: {
            userId,
            siteId: validatedData.siteId,
            roleId: validatedData.roleId,
          },
        });
      }

      return user;
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        type: 'USER_UPDATED',
        userId: user.id,
        siteId: validatedData.siteId || null,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          updatedUserId: userId,
          changes: validatedData,
        },
      },
    });

    // Send notification email if email was changed
    if (validatedData.email && validatedData.email !== existingUser.email) {
      await emailService.sendEmailChangedNotification(
        validatedData.email,
        updatedUser.name || ''
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      userId: updatedUser.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/users/[id] - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete users
    if (!user.permissions.includes('user:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (userId === (user.id as number)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}_${Date.now()}@deleted.com`,
        name: 'Deleted User',
        password: 'deleted',
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: [],
      },
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        type: 'USER_DELETED',
        userId: user.id,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        metadata: {
          deletedUserId: userId,
        },
      },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 