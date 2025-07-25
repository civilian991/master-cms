import { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/auth/middleware'

export async function middleware(request: NextRequest) {
  return authMiddleware(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/[...nextauth] (NextAuth.js routes only)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 