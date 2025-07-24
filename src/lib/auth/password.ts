import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'

// Password configuration
const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  saltRounds: 12,
  maxHistory: 5, // Remember last 5 passwords
  resetTokenExpiry: 60 * 60 * 1000, // 1 hour
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
}

// Password validation schema
export const passwordSchema = z.object({
  password: z.string()
    .min(PASSWORD_CONFIG.minLength, `Password must be at least ${PASSWORD_CONFIG.minLength} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})

export class PasswordService {
  private static instance: PasswordService

  private constructor() {}

  public static getInstance(): PasswordService {
    if (!PasswordService.instance) {
      PasswordService.instance = new PasswordService()
    }
    return PasswordService.instance
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds)
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  // Validate password strength
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < PASSWORD_CONFIG.minLength) {
      errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters`)
    }

    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (PASSWORD_CONFIG.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (PASSWORD_CONFIG.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Get user with password history
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          password: true,
          passwordHistory: true,
        },
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Validate new password
      const validation = this.validatePassword(newPassword)
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') }
      }

      // Check password history
      const passwordHistory = user.passwordHistory || []
      for (const oldPassword of passwordHistory) {
        const isOldPassword = await this.verifyPassword(newPassword, oldPassword)
        if (isOldPassword) {
          return { success: false, error: 'New password cannot be the same as a recent password' }
        }
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword)

      // Update password and history
      const newPasswordHistory = [user.password, ...passwordHistory].slice(0, PASSWORD_CONFIG.maxHistory)

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          passwordHistory: newPasswordHistory,
          loginAttempts: 0,
          lockedUntil: null,
        },
      })

      await this.logSecurityEvent({
        type: 'PASSWORD_CHANGED',
        userId,
      })

      return { success: true }
    } catch (error) {
      console.error('Error changing password:', error)
      return { success: false, error: 'Failed to change password' }
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<{
    success: boolean
    token?: string
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      })

      if (!user) {
        // Don't reveal if user exists or not
        return { success: true }
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + PASSWORD_CONFIG.resetTokenExpiry)

      // Store reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: resetTokenExpiry,
        },
      })

      await this.logSecurityEvent({
        type: 'PASSWORD_RESET_REQUESTED',
        userId: user.id,
      })

      return { success: true, token: resetToken }
    } catch (error) {
      console.error('Error generating password reset token:', error)
      return { success: false, error: 'Failed to generate reset token' }
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Find valid reset token
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
          used: false,
        },
        include: { user: true },
      })

      if (!resetRecord) {
        return { success: false, error: 'Invalid or expired reset token' }
      }

      // Validate new password
      const validation = this.validatePassword(newPassword)
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') }
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword)

      // Update user password
      await prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          password: hashedNewPassword,
          passwordHistory: [resetRecord.user.password],
          loginAttempts: 0,
          lockedUntil: null,
        },
      })

      // Mark reset token as used
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      })

      await this.logSecurityEvent({
        type: 'PASSWORD_RESET_COMPLETED',
        userId: resetRecord.userId,
      })

      return { success: true }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  }

  // Handle failed login attempt
  async handleFailedLogin(userId: string): Promise<{
    locked: boolean
    remainingAttempts: number
    lockoutUntil?: Date
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loginAttempts: true, lockedUntil: true },
    })

    if (!user) {
      return { locked: false, remainingAttempts: 0 }
    }

    const newLoginAttempts = user.loginAttempts + 1
    const shouldLockAccount = newLoginAttempts >= PASSWORD_CONFIG.maxLoginAttempts
    const lockoutUntil = shouldLockAccount 
      ? new Date(Date.now() + PASSWORD_CONFIG.lockoutDuration)
      : null

    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: newLoginAttempts,
        lockedUntil: lockoutUntil,
      },
    })

    if (shouldLockAccount) {
      await this.logSecurityEvent({
        type: 'ACCOUNT_LOCKED',
        userId,
        metadata: { loginAttempts: newLoginAttempts },
      })
    }

    return {
      locked: shouldLockAccount,
      remainingAttempts: Math.max(0, PASSWORD_CONFIG.maxLoginAttempts - newLoginAttempts),
      lockoutUntil,
    }
  }

  // Handle successful login
  async handleSuccessfulLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })
  }

  // Unlock account
  async unlockAccount(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
        },
      })

      await this.logSecurityEvent({
        type: 'ACCOUNT_UNLOCKED',
        userId,
      })

      return true
    } catch (error) {
      console.error('Error unlocking account:', error)
      return false
    }
  }

  // Check if account is locked
  async isAccountLocked(userId: string): Promise<{
    locked: boolean
    lockoutUntil?: Date
    remainingAttempts: number
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loginAttempts: true, lockedUntil: true },
    })

    if (!user) {
      return { locked: false, remainingAttempts: 0 }
    }

    const isLocked = user.lockedUntil && user.lockedUntil > new Date()
    const remainingAttempts = Math.max(0, PASSWORD_CONFIG.maxLoginAttempts - user.loginAttempts)

    return {
      locked: isLocked,
      lockoutUntil: user.lockedUntil,
      remainingAttempts,
    }
  }

  // Clean up expired reset tokens
  async cleanupExpiredResetTokens(): Promise<void> {
    try {
      await prisma.passwordReset.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })
    } catch (error) {
      console.error('Error cleaning up expired reset tokens:', error)
    }
  }

  // Private helper methods
  private async logSecurityEvent(data: {
    type: string
    userId: string
    metadata?: any
  }) {
    try {
      await prisma.securityEvent.create({
        data: {
          type: data.type as any,
          userId: data.userId,
          ip: '127.0.0.1', // Will be replaced with actual IP
          userAgent: 'Unknown', // Will be replaced with actual user agent
          metadata: data.metadata || {},
        },
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
}

export const passwordService = PasswordService.getInstance() 