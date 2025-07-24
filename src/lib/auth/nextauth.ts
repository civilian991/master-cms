import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'
import { JWT } from 'next-auth/jwt'
import { siteConfig } from '../../config/site'

// Role hierarchy and permissions
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  PUBLISHER: 'PUBLISHER',
  USER: 'USER',
} as const

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.EDITOR]: 2,
  [ROLES.PUBLISHER]: 1,
  [ROLES.USER]: 0,
}

export const PERMISSIONS = {
  // Content Management
  CREATE_ARTICLE: 'create_article',
  EDIT_ARTICLE: 'edit_article',
  DELETE_ARTICLE: 'delete_article',
  PUBLISH_ARTICLE: 'publish_article',
  APPROVE_ARTICLE: 'approve_article',
  
  // User Management
  MANAGE_USERS: 'manage_users',
  ASSIGN_ROLES: 'assign_roles',
  VIEW_USERS: 'view_users',
  
  // Site Management
  MANAGE_SITE: 'manage_site',
  CONFIGURE_SITE: 'configure_site',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Media Management
  UPLOAD_MEDIA: 'upload_media',
  DELETE_MEDIA: 'delete_media',
  MANAGE_MEDIA: 'manage_media',
  
  // Category & Tag Management
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_TAGS: 'manage_tags',
  
  // Security & Monitoring
  VIEW_SECURITY_LOGS: 'view_security_logs',
  MANAGE_SECURITY: 'manage_security',
} as const

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_ARTICLE,
    PERMISSIONS.EDIT_ARTICLE,
    PERMISSIONS.DELETE_ARTICLE,
    PERMISSIONS.PUBLISH_ARTICLE,
    PERMISSIONS.APPROVE_ARTICLE,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_SITE,
    PERMISSIONS.CONFIGURE_SITE,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.UPLOAD_MEDIA,
    PERMISSIONS.DELETE_MEDIA,
    PERMISSIONS.MANAGE_MEDIA,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_TAGS,
    PERMISSIONS.VIEW_SECURITY_LOGS,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.CREATE_ARTICLE,
    PERMISSIONS.EDIT_ARTICLE,
    PERMISSIONS.PUBLISH_ARTICLE,
    PERMISSIONS.UPLOAD_MEDIA,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_TAGS,
  ],
  [ROLES.PUBLISHER]: [
    PERMISSIONS.CREATE_ARTICLE,
    PERMISSIONS.EDIT_ARTICLE,
    PERMISSIONS.PUBLISH_ARTICLE,
    PERMISSIONS.UPLOAD_MEDIA,
  ],
  [ROLES.USER]: [
    PERMISSIONS.CREATE_ARTICLE,
    PERMISSIONS.UPLOAD_MEDIA,
  ],
}

// Security configuration
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionMaxAge: 24 * 60 * 60, // 24 hours
  refreshTokenMaxAge: 7 * 24 * 60 * 60, // 7 days
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        siteId: { label: 'Site ID', type: 'text' },
      },
      
            async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // If no siteId provided or it's "undefined", use the first available site
          let siteId = credentials.siteId
          if (!siteId || siteId === 'undefined') {
            const defaultSite = await prisma.site.findFirst({
              where: { isActive: true },
              orderBy: { createdAt: 'asc' }
            })
            if (!defaultSite) {
              console.error('No active sites found in database')
              return null
            }
            siteId = defaultSite.id
          }

          // Find user for the specific site
          const user = await prisma.user.findFirst({
            where: { 
              email: credentials.email,
              siteId: siteId
            },
            include: {
              permissions: true,
            },
          })

          if (!user) {
            await logSecurityEvent({
              type: 'LOGIN_FAILURE',
              email: credentials.email,
              siteId: siteId,
              reason: 'User not found',
            })
            return null
          }

          // Check if user is active
          if (!user.isActive) {
            await logSecurityEvent({
              type: 'LOGIN_FAILURE',
              userId: user.id,
              siteId: siteId,
              reason: 'Account inactive',
            })
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            await logSecurityEvent({
              type: 'LOGIN_FAILURE',
              userId: user.id,
              siteId: siteId,
              reason: 'Invalid password',
            })
            return null
          }

          await logSecurityEvent({
            type: 'LOGIN_SUCCESS',
            userId: user.id,
            siteId: siteId,
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            siteId: siteId,
            mfaEnabled: false, // Default to false since schema doesn't have this field
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: SECURITY_CONFIG.sessionMaxAge,
  },

  jwt: {
    maxAge: SECURITY_CONFIG.sessionMaxAge,
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.siteId = user.siteId
        token.mfaEnabled = user.mfaEnabled
        token.userId = user.id
      }

      // Add permissions to token
      if (token.role) {
        token.permissions = ROLE_PERMISSIONS[token.role as keyof typeof ROLE_PERMISSIONS] || []
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.siteId = token.siteId as string
        session.user.mfaEnabled = token.mfaEnabled as boolean
        session.user.permissions = token.permissions as string[]
      }

      return session
    },

    async signIn({ user, account, profile }) {
      // Additional sign-in validation
      if (user && account?.provider === 'credentials') {
        // Check if user has access to the site
        const hasAccess = await checkUserSiteAccess(user.id, user.siteId)
        if (!hasAccess) {
          await logSecurityEvent({
            type: 'LOGIN_FAILURE',
            userId: user.id,
            siteId: user.siteId,
            reason: 'No site access',
          })
          return false
        }
      }

      return true
    },

    async redirect({ url, baseUrl }) {
      // Handle redirects based on user role and site
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        await logSecurityEvent({
          type: 'ADMIN_ACTION',
          userId: user.id,
          siteId: user.siteId,
          reason: 'User registered',
        })
      }
    },

    async signOut({ session, token }) {
      if (token?.userId) {
        await logSecurityEvent({
          type: 'LOGOUT',
          userId: token.userId as string,
          siteId: token.siteId as string,
        })
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
}

// Helper functions
async function checkUserSiteAccess(userId: string, siteId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      siteId: siteId,
      isActive: true,
    },
  })

  return !!user
}

async function logSecurityEvent(data: {
  type: string
  userId?: string
  email?: string
  siteId?: string
  reason?: string
  metadata?: any
}) {
  try {
    // Determine success based on event type
    const isSuccess = data.type === 'LOGIN_SUCCESS' || data.type === 'LOGOUT'
    
    await prisma.securityEvent.create({
      data: {
        eventType: data.type as any,
        userId: data.userId || null,
        siteId: data.siteId || null,
        description: data.reason || '',
        metadata: data.metadata || {},
        success: isSuccess,
        ipAddress: '127.0.0.1', // Will be replaced with actual IP in real implementation
        userAgent: 'Unknown', // Will be replaced with actual user agent in real implementation
      },
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Permission checking utilities
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission)
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || -1
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || -1
  return userLevel >= requiredLevel
}

export function getUserPermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || []
}

// Export types for use in other parts of the application
export type UserRole = keyof typeof ROLES
export type Permission = keyof typeof PERMISSIONS
export type SecurityEventType = 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'ADMIN_ACTION' | 'PASSWORD_CHANGE' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'OTHER' 