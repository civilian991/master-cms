import { prisma } from '../prisma'

// Email configuration
const EMAIL_CONFIG = {
  fromEmail: process.env.FROM_EMAIL || 'noreply@mastercms.com',
  fromName: process.env.FROM_NAME || 'Master CMS',
  siteName: process.env.SITE_NAME || 'Master CMS',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
}

// Email templates
const EMAIL_TEMPLATES = {
  passwordReset: {
    subject: 'Password Reset Request',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>We received a request to reset your password for your ${EMAIL_CONFIG.siteName} account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
  
  passwordChanged: {
    subject: 'Password Changed Successfully',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed Successfully</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>Your password for your ${EMAIL_CONFIG.siteName} account has been successfully changed.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
  
  accountLocked: {
    subject: 'Account Temporarily Locked',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Account Temporarily Locked</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>Your ${EMAIL_CONFIG.siteName} account has been temporarily locked due to multiple failed login attempts.</p>
        <p>Your account will be automatically unlocked in ${data.lockoutDuration || '15 minutes'}.</p>
        <p>If you believe this was an error, please contact support.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
  
  mfaEnabled: {
    subject: 'Two-Factor Authentication Enabled',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Two-Factor Authentication Enabled</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>Two-factor authentication has been successfully enabled for your ${EMAIL_CONFIG.siteName} account.</p>
        <p>Your account is now more secure. Make sure to keep your backup codes in a safe place.</p>
        <p>If you didn't enable this feature, please contact support immediately.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
  
  mfaDisabled: {
    subject: 'Two-Factor Authentication Disabled',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f57c00;">Two-Factor Authentication Disabled</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>Two-factor authentication has been disabled for your ${EMAIL_CONFIG.siteName} account.</p>
        <p>If you didn't disable this feature, please contact support immediately.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
  
  newLogin: {
    subject: 'New Login Detected',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Login Detected</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>A new login was detected for your ${EMAIL_CONFIG.siteName} account.</p>
        <p><strong>Login Details:</strong></p>
        <ul>
          <li>Time: ${data.loginTime}</li>
          <li>IP Address: ${data.ipAddress}</li>
          <li>Location: ${data.location || 'Unknown'}</li>
          <li>Device: ${data.device || 'Unknown'}</li>
        </ul>
        <p>If this wasn't you, please change your password immediately and contact support.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
  
  roleChanged: {
    subject: 'Role Assignment Changed',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7b1fa2;">Role Assignment Changed</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>Your role assignment for ${data.siteName} has been changed.</p>
        <p><strong>New Role:</strong> ${data.newRole}</p>
        <p><strong>Changed By:</strong> ${data.changedBy}</p>
        <p><strong>Date:</strong> ${data.changeDate}</p>
        <p>If you have any questions about this change, please contact your administrator.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
  
  welcome: {
    subject: 'Welcome to Master CMS',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Welcome to ${EMAIL_CONFIG.siteName}!</h2>
        <p>Hello ${data.name || 'there'},</p>
        <p>Welcome to ${EMAIL_CONFIG.siteName}! Your account has been successfully created.</p>
        <p><strong>Account Details:</strong></p>
        <ul>
          <li>Email: ${data.email}</li>
          <li>Role: ${data.role}</li>
          <li>Site: ${data.siteName}</li>
        </ul>
        <p>You can now log in to your account and start using the platform.</p>
        <p>Best regards,<br>The ${EMAIL_CONFIG.siteName} Team</p>
      </div>
    `,
  },
}

export class EmailService {
  private static instance: EmailService

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string, siteId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      })

      if (!user) {
        return false
      }

      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { name: true, domain: true },
      })

      const resetUrl = `${EMAIL_CONFIG.baseUrl}/auth/reset-password?token=${resetToken}&siteId=${siteId}`
      
      const emailData = {
        name: user.name,
        email: user.email,
        resetUrl,
        siteName: site?.name || EMAIL_CONFIG.siteName,
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.passwordReset.subject,
        html: EMAIL_TEMPLATES.passwordReset.template(emailData),
      })

      await this.logEmailSent({
        userId: user.id,
        type: 'PASSWORD_RESET',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return false
    }
  }

  // Send password changed notification
  async sendPasswordChangedEmail(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        return false
      }

      const emailData = {
        name: user.name,
        email: user.email,
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.passwordChanged.subject,
        html: EMAIL_TEMPLATES.passwordChanged.template(emailData),
      })

      await this.logEmailSent({
        userId,
        type: 'PASSWORD_CHANGED',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending password changed email:', error)
      return false
    }
  }

  // Send account locked notification
  async sendAccountLockedEmail(userId: string, lockoutDuration: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        return false
      }

      const emailData = {
        name: user.name,
        lockoutDuration,
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.accountLocked.subject,
        html: EMAIL_TEMPLATES.accountLocked.template(emailData),
      })

      await this.logEmailSent({
        userId,
        type: 'ACCOUNT_LOCKED',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending account locked email:', error)
      return false
    }
  }

  // Send MFA enabled notification
  async sendMFAEnabledEmail(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        return false
      }

      const emailData = {
        name: user.name,
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.mfaEnabled.subject,
        html: EMAIL_TEMPLATES.mfaEnabled.template(emailData),
      })

      await this.logEmailSent({
        userId,
        type: 'MFA_ENABLED',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending MFA enabled email:', error)
      return false
    }
  }

  // Send MFA disabled notification
  async sendMFADisabledEmail(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        return false
      }

      const emailData = {
        name: user.name,
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.mfaDisabled.subject,
        html: EMAIL_TEMPLATES.mfaDisabled.template(emailData),
      })

      await this.logEmailSent({
        userId,
        type: 'MFA_DISABLED',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending MFA disabled email:', error)
      return false
    }
  }

  // Send new login notification
  async sendNewLoginEmail(userId: string, loginData: {
    ipAddress: string
    location?: string
    device?: string
  }): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        return false
      }

      const emailData = {
        name: user.name,
        loginTime: new Date().toLocaleString(),
        ipAddress: loginData.ipAddress,
        location: loginData.location,
        device: loginData.device,
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.newLogin.subject,
        html: EMAIL_TEMPLATES.newLogin.template(emailData),
      })

      await this.logEmailSent({
        userId,
        type: 'NEW_LOGIN',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending new login email:', error)
      return false
    }
  }

  // Send role change notification
  async sendRoleChangedEmail(userId: string, roleData: {
    newRole: string
    changedBy: string
    siteName: string
  }): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        return false
      }

      const emailData = {
        name: user.name,
        newRole: roleData.newRole,
        changedBy: roleData.changedBy,
        siteName: roleData.siteName,
        changeDate: new Date().toLocaleString(),
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.roleChanged.subject,
        html: EMAIL_TEMPLATES.roleChanged.template(emailData),
      })

      await this.logEmailSent({
        userId,
        type: 'ROLE_CHANGED',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending role changed email:', error)
      return false
    }
  }

  // Send welcome email
  async sendWelcomeEmail(userId: string, siteId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      if (!user) {
        return false
      }

      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { name: true },
      })

      const userSiteRole = await prisma.userSiteRole.findUnique({
        where: {
          userId_siteId: {
            userId,
            siteId,
          },
        },
        include: { role: true },
      })

      const emailData = {
        name: user.name,
        email: user.email,
        role: userSiteRole?.role.name || 'User',
        siteName: site?.name || EMAIL_CONFIG.siteName,
      }

      await this.sendEmail({
        to: user.email,
        subject: EMAIL_TEMPLATES.welcome.subject,
        html: EMAIL_TEMPLATES.welcome.template(emailData),
      })

      await this.logEmailSent({
        userId,
        type: 'WELCOME',
        recipient: user.email,
      })

      return true
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return false
    }
  }

  // Generic email sending function
  private async sendEmail(data: {
    to: string
    subject: string
    html: string
    text?: string
  }): Promise<boolean> {
    try {
      // In production, integrate with SendGrid, AWS SES, or other email service
      // For now, we'll simulate email sending
      console.log('Sending email:', {
        from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      })

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100))

      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  // Log email sent
  private async logEmailSent(data: {
    userId: string
    type: string
    recipient: string
  }) {
    try {
      await prisma.emailLog.create({
        data: {
          userId: data.userId,
          type: data.type,
          recipient: data.recipient,
          sentAt: new Date(),
          status: 'SENT',
        },
      })
    } catch (error) {
      console.error('Failed to log email sent:', error)
    }
  }
}

export const emailService = EmailService.getInstance() 