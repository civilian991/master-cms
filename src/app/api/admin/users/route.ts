import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "EDITOR", "AUTHOR", "USER"]),
  isActive: z.boolean().default(true),
  mfaEnabled: z.boolean().default(false),
  locale: z.enum(["en", "ar"]).default("en"),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const roleId = searchParams.get('roleId')
    const status = searchParams.get('status')
    const siteId = searchParams.get('siteId')

    const where: any = {}

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add role filter
    if (roleId) {
      where.role = roleId
    }

    // Add status filter
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Add site filter
    if (siteId) {
      where.siteId = siteId
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userSiteRoles: {
            include: {
              site: { select: { name: true } },
              role: { select: { name: true, permissions: true } }
            }
          },
          securityEvents: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              type: true,
              createdAt: true,
              ip: true,
              userAgent: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    // Transform data for frontend
    const transformedUsers = users.map(user => ({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.userSiteRoles[0]?.role.name || 'USER',
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      lockedUntil: user.lockedUntil?.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      loginCount: user.loginCount,
      avatar: user.avatar,
      locale: user.locale,
      siteRoles: user.userSiteRoles.map(sr => ({
        siteId: sr.siteId.toString(),
        siteName: sr.site.name,
        role: sr.role.name,
        permissions: sr.role.permissions || []
      })),
      securityEvents: user.securityEvents.map(event => ({
        type: event.type,
        timestamp: event.createdAt.toISOString(),
        ip: event.ip,
        userAgent: event.userAgent
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        isActive: validatedData.isActive,
        mfaEnabled: validatedData.mfaEnabled,
        locale: validatedData.locale,
        emailVerified: false,
        loginCount: 0
      },
      include: {
        userSiteRoles: {
          include: {
            site: { select: { name: true } },
            role: { select: { name: true, permissions: true } }
          }
        }
      }
    })

    // Assign role to default site (assuming site ID 1)
    const defaultRole = await prisma.role.findFirst({
      where: { name: validatedData.role }
    })

    if (defaultRole) {
      await prisma.userSiteRole.create({
        data: {
          userId: user.id,
          siteId: 1, // Default site
          roleId: defaultRole.id
        }
      })
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: validatedData.role,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 