import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { hasPermission, hasRole, PERMISSIONS, ROLES } from './nextauth'

// Middleware configuration
const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/auth/signout',
  '/auth/error',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/csrf',
  '/api/auth/[...nextauth]',
  '/api/webhooks',
  '/_next',
  '/favicon.ico',
]

const API_PATHS = [
  '/api/content',
  '/api/media',
  '/api/categories',
  '/api/tags',
  '/api/auth/users',
  '/api/sites',
  '/api/admin',
]

// Role-based route protection
const ROLE_ROUTES = {
  [ROLES.SUPER_ADMIN]: ['/admin', '/api/admin'],
  [ROLES.ADMIN]: ['/admin', '/api/admin', '/api/auth/users'],
  [ROLES.EDITOR]: ['/admin/content', '/admin/media', '/api/content', '/api/media'],
  [ROLES.PUBLISHER]: ['/admin/content', '/api/content'],
  [ROLES.USER]: ['/admin/profile', '/api/content/articles'],
}

// Permission-based API protection
const API_PERMISSIONS = {
  '/api/content/articles': {
    GET: [PERMISSIONS.CREATE_ARTICLE, PERMISSIONS.EDIT_ARTICLE, PERMISSIONS.DELETE_ARTICLE],
    POST: [PERMISSIONS.CREATE_ARTICLE],
    PUT: [PERMISSIONS.EDIT_ARTICLE],
    DELETE: [PERMISSIONS.DELETE_ARTICLE],
  },
  '/api/content/workflow': {
    POST: [PERMISSIONS.APPROVE_ARTICLE, PERMISSIONS.PUBLISH_ARTICLE],
  },
  '/api/media': {
    GET: [PERMISSIONS.UPLOAD_MEDIA, PERMISSIONS.MANAGE_MEDIA],
    POST: [PERMISSIONS.UPLOAD_MEDIA],
    DELETE: [PERMISSIONS.DELETE_MEDIA],
  },
  '/api/categories': {
    GET: [PERMISSIONS.MANAGE_CATEGORIES],
    POST: [PERMISSIONS.MANAGE_CATEGORIES],
    PUT: [PERMISSIONS.MANAGE_CATEGORIES],
    DELETE: [PERMISSIONS.MANAGE_CATEGORIES],
  },
  '/api/tags': {
    GET: [PERMISSIONS.MANAGE_TAGS],
    POST: [PERMISSIONS.MANAGE_TAGS],
    PUT: [PERMISSIONS.MANAGE_TAGS],
    DELETE: [PERMISSIONS.MANAGE_TAGS],
  },
  '/api/auth/users': {
    GET: [PERMISSIONS.VIEW_USERS],
    POST: [PERMISSIONS.MANAGE_USERS],
    PUT: [PERMISSIONS.MANAGE_USERS],
    DELETE: [PERMISSIONS.MANAGE_USERS],
  },
  '/api/sites': {
    GET: [PERMISSIONS.VIEW_USERS], // Sites viewing requires user permissions
  },
}

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Get token from request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Check if user is authenticated
  if (!token) {
    return redirectToSignIn(request)
  }

  // Check if user has access to the site
  const siteId = getSiteIdFromRequest(request)
  // Allow access if site ID matches or if using default/localhost
  if (token.siteId !== siteId && siteId !== 'default') {
    return NextResponse.json(
      { error: 'Access denied for this site' },
      { status: 403 }
    )
  }

  // Check role-based access for admin routes
  if (isAdminRoute(pathname)) {
    const hasAdminAccess = hasRole(token.role as string, ROLES.ADMIN)
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
  }

  // Check permission-based access for API routes
  if (isApiRoute(pathname)) {
    const method = request.method
    const requiredPermissions = getRequiredPermissions(pathname, method)
    
    if (requiredPermissions.length > 0) {
      const userPermissions = token.permissions as string[] || []
      const hasRequiredPermission = requiredPermissions.some(permission =>
        hasPermission(userPermissions, permission)
      )
      
      if (!hasRequiredPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions for this operation' },
          { status: 403 }
        )
      }
    }
  }

  // Add user information to request headers for use in API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', token.userId as string)
  requestHeaders.set('x-user-role', token.role as string)
  requestHeaders.set('x-user-site-id', token.siteId as string)
  requestHeaders.set('x-user-permissions', JSON.stringify(token.permissions))

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Helper functions
function isPublicPath(pathname: string): boolean {
  // Handle NextAuth routes explicitly
  if (pathname.startsWith('/api/auth/')) {
    // Allow all NextAuth internal routes except our custom ones
    return !pathname.startsWith('/api/auth/users')
  }
  
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
}

function isApiRoute(pathname: string): boolean {
  return API_PATHS.some(path => pathname.startsWith(path))
}

function getSiteIdFromRequest(request: NextRequest): string {
  // Extract site ID from various sources
  const hostname = request.headers.get('host') || ''
  const siteId = request.headers.get('x-site-id') || 
                 request.nextUrl.searchParams.get('siteId') ||
                 extractSiteIdFromHostname(hostname)
  
  return siteId || 'default'
}

function extractSiteIdFromHostname(hostname: string): string {
  // Extract site ID from hostname (e.g., himaya.example.com -> himaya)
  const parts = hostname.split('.')
  return parts.length > 2 ? parts[0] : 'default'
}

function getRequiredPermissions(pathname: string, method: string): string[] {
  // Find the matching API path and method
  for (const [apiPath, permissions] of Object.entries(API_PERMISSIONS)) {
    if (pathname.startsWith(apiPath)) {
      return permissions[method as keyof typeof permissions] || []
    }
  }
  return []
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const signInUrl = new URL('/auth/signin', request.url)
  signInUrl.searchParams.set('callbackUrl', request.url)
  return NextResponse.redirect(signInUrl)
}

// Rate limiting middleware
export async function rateLimitMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only apply rate limiting to authentication endpoints
  if (!pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const key = `rate_limit:${ip}:${pathname}`
  
  // This would integrate with Redis for actual rate limiting
  // For now, we'll implement a basic in-memory rate limiter
  const currentTime = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100 // 100 requests per window
  
  // In a real implementation, you would:
  // 1. Check Redis for existing rate limit data
  // 2. Update or create rate limit record
  // 3. Return appropriate response based on limits
  
  return NextResponse.next()
}

// CORS middleware
export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  
  const response = NextResponse.next()
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-role, x-user-site-id, x-user-permissions')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}

// Security headers middleware
export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

// Combined middleware function
export async function combinedMiddleware(request: NextRequest) {
  // Apply security headers first
  let response = securityHeadersMiddleware(request)
  
  // Apply CORS
  response = corsMiddleware(request)
  
  // Apply rate limiting
  response = await rateLimitMiddleware(request)
  
  // Apply authentication
  response = await authMiddleware(request)
  
  return response
}

// Utility functions for use in API routes
export async function getUserFromRequest(request: NextRequest) {
  // First try to get user from middleware headers
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  const userSiteId = request.headers.get('x-user-site-id')
  const userPermissions = request.headers.get('x-user-permissions')

  if (userId && userRole && userSiteId) {
    return {
      id: userId,
      role: userRole,
      siteId: userSiteId,
      permissions: JSON.parse(userPermissions || '[]'),
    }
  }

  // Fallback: Try to get user from NextAuth JWT token directly
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (token) {
      return {
        id: token.userId as string,
        role: token.role as string,
        siteId: token.siteId as string,
        permissions: (token.permissions as string[]) || [],
      }
    }
  } catch (error) {
    console.error('Error getting user from token:', error)
  }

  return null
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return handler(request)
  }
}

export function requireRole(requiredRole: string) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      if (!token || !hasRole(token.role as string, requiredRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      
      return handler(request)
    }
  }
}

export function requirePermission(requiredPermission: string) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      const userPermissions = token.permissions as string[] || []
      if (!hasPermission(userPermissions, requiredPermission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      
      return handler(request)
    }
  }
} 