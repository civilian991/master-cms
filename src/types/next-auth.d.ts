import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      siteId: string
      mfaEnabled: boolean
      permissions: string[]
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
    siteId: string
    mfaEnabled: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: string
    siteId?: string
    mfaEnabled?: boolean
    permissions?: string[]
  }
} 