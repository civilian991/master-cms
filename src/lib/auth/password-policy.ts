import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma';

// Password policy configuration
export const PASSWORD_POLICIES = {
  default: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    maxRepeatingChars: 3,
    minUniqueChars: 8,
    preventCommonPasswords: true,
    preventUserInfo: true,
    preventDictionaryWords: true,
    maxAge: 90, // days
    historyCount: 12, // prevent reuse of last 12 passwords
    lockoutAttempts: 5,
    lockoutDuration: 30, // minutes
  },
  strict: {
    minLength: 16,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    maxRepeatingChars: 2,
    minUniqueChars: 12,
    preventCommonPasswords: true,
    preventUserInfo: true,
    preventDictionaryWords: true,
    maxAge: 60, // days
    historyCount: 24, // prevent reuse of last 24 passwords
    lockoutAttempts: 3,
    lockoutDuration: 60, // minutes
  },
  relaxed: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    maxRepeatingChars: 4,
    minUniqueChars: 6,
    preventCommonPasswords: true,
    preventUserInfo: false,
    preventDictionaryWords: false,
    maxAge: 180, // days
    historyCount: 6, // prevent reuse of last 6 passwords
    lockoutAttempts: 10,
    lockoutDuration: 15, // minutes
  },
};

// Common weak passwords (simplified list - in production, use a comprehensive database)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', '12345678', '12345', '1234567',
  'password123', 'admin', 'qwerty', 'abc123', 'letmein', 'monkey',
  'welcome', 'login', 'administrator', 'root', 'toor', 'pass',
  'test', 'guest', 'info', 'user', 'master', 'hello', 'access',
]);

// Dictionary words (simplified - in production, use a comprehensive dictionary)
const DICTIONARY_WORDS = new Set([
  'computer', 'internet', 'security', 'system', 'network', 'server',
  'database', 'application', 'website', 'software', 'hardware',
]);

// Validation schemas
export const passwordValidationSchema = z.object({
  password: z.string(),
  userId: z.string().optional(),
  userInfo: z.object({
    email: z.string().optional(),
    name: z.string().optional(),
    username: z.string().optional(),
  }).optional(),
  policyLevel: z.enum(['default', 'strict', 'relaxed']).default('default'),
});

export const passwordChangeSchema = z.object({
  userId: z.string(),
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
  siteId: z.string(),
});

export const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});

// Password validation result interface
interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  errors: string[];
  warnings: string[];
  suggestions: string[];
  entropy: number;
  estimatedCrackTime: string;
}

// Password Policy Service
export class PasswordPolicyService {

  /**
   * Validate password against policy
   */
  async validatePassword(
    password: string,
    policyLevel: keyof typeof PASSWORD_POLICIES = 'default',
    userInfo?: { email?: string; name?: string; username?: string },
    userId?: string
  ): Promise<PasswordValidationResult> {
    const policy = PASSWORD_POLICIES[policyLevel];
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    try {
      // Basic length check
      if (password.length < policy.minLength) {
        errors.push(`Password must be at least ${policy.minLength} characters long`);
      } else if (password.length >= policy.minLength) {
        score += 20;
      }

      if (password.length > policy.maxLength) {
        errors.push(`Password must not exceed ${policy.maxLength} characters`);
      }

      // Character requirements
      if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
        suggestions.push('Add uppercase letters (A-Z)');
      } else if (/[A-Z]/.test(password)) {
        score += 10;
      }

      if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
        suggestions.push('Add lowercase letters (a-z)');
      } else if (/[a-z]/.test(password)) {
        score += 10;
      }

      if (policy.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
        suggestions.push('Add numbers (0-9)');
      } else if (/[0-9]/.test(password)) {
        score += 10;
      }

      if (policy.requireSpecialChars) {
        const specialCharRegex = new RegExp(`[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
        if (!specialCharRegex.test(password)) {
          errors.push('Password must contain at least one special character');
          suggestions.push(`Add special characters (${policy.specialChars})`);
        } else {
          score += 15;
        }
      }

      // Check for repeating characters
      const repeatingChars = this.checkRepeatingCharacters(password);
      if (repeatingChars > policy.maxRepeatingChars) {
        errors.push(`Password must not have more than ${policy.maxRepeatingChars} repeating characters`);
        suggestions.push('Avoid repeating the same character multiple times');
      }

      // Check unique characters
      const uniqueChars = new Set(password).size;
      if (uniqueChars < policy.minUniqueChars) {
        warnings.push(`Password should have at least ${policy.minUniqueChars} unique characters`);
        suggestions.push('Use more diverse characters');
      } else {
        score += 10;
      }

      // Check against common passwords
      if (policy.preventCommonPasswords && this.isCommonPassword(password)) {
        errors.push('Password is too common and easily guessable');
        suggestions.push('Use a more unique password');
      } else {
        score += 10;
      }

      // Check against user information
      if (policy.preventUserInfo && userInfo && this.containsUserInfo(password, userInfo)) {
        errors.push('Password must not contain personal information');
        suggestions.push('Avoid using your name, email, or username in the password');
      } else {
        score += 5;
      }

      // Check against dictionary words
      if (policy.preventDictionaryWords && this.containsDictionaryWords(password)) {
        warnings.push('Password contains common dictionary words');
        suggestions.push('Consider using less common words or abbreviations');
      } else {
        score += 10;
      }

      // Check against password history if user is provided
      if (userId) {
        const isReused = await this.checkPasswordHistory(userId, password, policy.historyCount);
        if (isReused) {
          errors.push('Password has been used recently and cannot be reused');
        } else {
          score += 5;
        }
      }

      // Check against known breaches
      const isBreached = await this.checkPasswordBreach(password);
      if (isBreached) {
        errors.push('Password has been found in data breaches and should not be used');
        suggestions.push('Choose a completely different password');
      } else {
        score += 5;
      }

      // Calculate entropy
      const entropy = this.calculateEntropy(password);
      
      // Entropy-based scoring
      if (entropy >= 60) score += 15;
      else if (entropy >= 40) score += 10;
      else if (entropy >= 25) score += 5;

      // Determine strength
      const strength = this.determineStrength(score, errors.length);
      const estimatedCrackTime = this.estimateCrackTime(entropy);

      return {
        isValid: errors.length === 0,
        score,
        strength,
        errors,
        warnings,
        suggestions,
        entropy,
        estimatedCrackTime,
      };

    } catch (error) {
      console.error('Password validation error:', error);
      return {
        isValid: false,
        score: 0,
        strength: 'very-weak',
        errors: ['Password validation failed'],
        warnings: [],
        suggestions: [],
        entropy: 0,
        estimatedCrackTime: 'unknown',
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    siteId: string
  ): Promise<{
    success: boolean;
    errors: string[];
    requiresMFA?: boolean;
  }> {
    try {
      const errors: string[] = [];

      // Verify new password matches confirmation
      if (newPassword !== confirmPassword) {
        errors.push('New password and confirmation do not match');
        return { success: false, errors };
      }

      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          password: true,
          email: true,
          name: true,
          securityProfile: {
            select: {
              passwordChangedAt: true,
              passwordExpiresAt: true,
              mfaEnabled: true,
            },
          },
        },
      });

      if (!user) {
        errors.push('User not found');
        return { success: false, errors };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        errors.push('Current password is incorrect');
        
        // Log failed password change attempt
        await this.logSecurityEvent({
          eventType: 'PASSWORD_CHANGE_FAILED',
          userId,
          siteId,
          metadata: { reason: 'incorrect_current_password' },
        });

        return { success: false, errors };
      }

      // Validate new password
      const validation = await this.validatePassword(
        newPassword,
        'default',
        { email: user.email, name: user.name },
        userId
      );

      if (!validation.isValid) {
        errors.push(...validation.errors);
        return { success: false, errors };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and security profile
      const passwordChangedAt = new Date();
      const passwordExpiresAt = new Date(passwordChangedAt.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          securityProfile: {
            upsert: {
              create: {
                userId,
                siteId,
                passwordChangedAt,
                passwordExpiresAt,
                mfaEnabled: false,
                riskScore: 0,
                consentGiven: true,
                consentDate: new Date(),
              },
              update: {
                passwordChangedAt,
                passwordExpiresAt,
              },
            },
          },
        },
      });

      // Add to password history
      await this.addToPasswordHistory(userId, hashedPassword);

      // Log successful password change
      await this.logSecurityEvent({
        eventType: 'PASSWORD_CHANGE',
        userId,
        siteId,
        metadata: {
          strength: validation.strength,
          score: validation.score,
        },
      });

      return {
        success: true,
        errors: [],
        requiresMFA: user.securityProfile?.mfaEnabled,
      };

    } catch (error) {
      await this.logSecurityEvent({
        eventType: 'PASSWORD_CHANGE_ERROR',
        userId,
        siteId,
        metadata: { error: error.message },
      });

      return {
        success: false,
        errors: ['Password change failed due to system error'],
      };
    }
  }

  /**
   * Generate secure password suggestion
   */
  generateSecurePassword(
    length: number = 16,
    policyLevel: keyof typeof PASSWORD_POLICIES = 'default'
  ): string {
    const policy = PASSWORD_POLICIES[policyLevel];
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = policy.specialChars;

    let charset = '';
    let password = '';

    // Ensure required character types are included
    if (policy.requireLowercase) {
      charset += lowercase;
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
    }

    if (policy.requireUppercase) {
      charset += uppercase;
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
    }

    if (policy.requireNumbers) {
      charset += numbers;
      password += numbers[Math.floor(Math.random() * numbers.length)];
    }

    if (policy.requireSpecialChars) {
      charset += special;
      password += special[Math.floor(Math.random() * special.length)];
    }

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Check if password needs to be changed (expired)
   */
  async checkPasswordExpiry(userId: string): Promise<{
    expired: boolean;
    expiresAt?: Date;
    daysUntilExpiry?: number;
  }> {
    try {
      const profile = await prisma.userSecurityProfile.findUnique({
        where: { userId },
        select: { passwordExpiresAt: true },
      });

      if (!profile?.passwordExpiresAt) {
        return { expired: false };
      }

      const now = new Date();
      const expired = profile.passwordExpiresAt < now;
      const daysUntilExpiry = Math.ceil(
        (profile.passwordExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      return {
        expired,
        expiresAt: profile.passwordExpiresAt,
        daysUntilExpiry: expired ? 0 : daysUntilExpiry,
      };

    } catch (error) {
      console.error('Error checking password expiry:', error);
      return { expired: false };
    }
  }

  /**
   * Check for repeating characters
   */
  private checkRepeatingCharacters(password: string): number {
    let maxRepeating = 0;
    let currentRepeating = 1;

    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        currentRepeating++;
      } else {
        maxRepeating = Math.max(maxRepeating, currentRepeating);
        currentRepeating = 1;
      }
    }

    return Math.max(maxRepeating, currentRepeating);
  }

  /**
   * Check if password is common
   */
  private isCommonPassword(password: string): boolean {
    return COMMON_PASSWORDS.has(password.toLowerCase());
  }

  /**
   * Check if password contains user information
   */
  private containsUserInfo(password: string, userInfo: { email?: string; name?: string; username?: string }): boolean {
    const lowercasePassword = password.toLowerCase();

    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@')[0];
      if (lowercasePassword.includes(emailParts) && emailParts.length > 2) {
        return true;
      }
    }

    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(' ');
      for (const part of nameParts) {
        if (part.length > 2 && lowercasePassword.includes(part)) {
          return true;
        }
      }
    }

    if (userInfo.username && userInfo.username.length > 2) {
      if (lowercasePassword.includes(userInfo.username.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if password contains dictionary words
   */
  private containsDictionaryWords(password: string): boolean {
    const lowercasePassword = password.toLowerCase();
    
    for (const word of DICTIONARY_WORDS) {
      if (lowercasePassword.includes(word)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check password against history
   */
  private async checkPasswordHistory(userId: string, password: string, historyCount: number): Promise<boolean> {
    try {
      // In a real implementation, you'd store hashed password history
      // This is a simplified version
      const recentPasswords = await prisma.auditLog.findMany({
        where: {
          userId,
          action: 'UPDATE',
          resourceType: 'password',
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
          },
        },
        orderBy: { createdAt: 'desc' },
        take: historyCount,
        select: { metadata: true },
      });

      // Check against stored password hashes (simplified)
      for (const log of recentPasswords) {
        const metadata = log.metadata as any;
        if (metadata?.passwordHash) {
          const isMatch = await bcrypt.compare(password, metadata.passwordHash);
          if (isMatch) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking password history:', error);
      return false;
    }
  }

  /**
   * Check password against known breaches (simplified implementation)
   */
  private async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // In production, use HaveIBeenPwned API or similar service
      // This is a simplified implementation using SHA-1 hash
      const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      
      // For demo purposes, we'll check against a few known breached hashes
      const knownBreachedHashes = new Set([
        '5E884898DA28047151D0E56F8DC6292773603D0D6AABBDD62A11EF721D1542D8', // 'password'
        'E99A18C428CB38D5F260853678922E03ABD6C9F6', // '123456'
      ]);

      return knownBreachedHashes.has(hash);
    } catch (error) {
      console.error('Error checking password breach:', error);
      return false;
    }
  }

  /**
   * Calculate password entropy
   */
  private calculateEntropy(password: string): number {
    const charSets = [
      /[a-z]/.test(password) ? 26 : 0, // lowercase
      /[A-Z]/.test(password) ? 26 : 0, // uppercase
      /[0-9]/.test(password) ? 10 : 0, // numbers
      /[^a-zA-Z0-9]/.test(password) ? 32 : 0, // special chars (approximation)
    ];

    const characterSpace = charSets.reduce((sum, chars) => sum + chars, 0);
    
    if (characterSpace === 0) return 0;
    
    return Math.log2(Math.pow(characterSpace, password.length));
  }

  /**
   * Determine password strength
   */
  private determineStrength(score: number, errorCount: number): PasswordValidationResult['strength'] {
    if (errorCount > 0) return 'very-weak';
    if (score >= 90) return 'very-strong';
    if (score >= 75) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    if (score >= 20) return 'weak';
    return 'very-weak';
  }

  /**
   * Estimate crack time based on entropy
   */
  private estimateCrackTime(entropy: number): string {
    const guessesPerSecond = 1e9; // 1 billion guesses per second
    const possibleCombinations = Math.pow(2, entropy);
    const averageGuesses = possibleCombinations / 2;
    const secondsToCrack = averageGuesses / guessesPerSecond;

    if (secondsToCrack < 60) return 'Less than 1 minute';
    if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutes`;
    if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} hours`;
    if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 86400)} days`;
    if (secondsToCrack < 31536000000) return `${Math.round(secondsToCrack / 31536000)} years`;
    return 'Centuries';
  }

  /**
   * Add password to history
   */
  private async addToPasswordHistory(userId: string, hashedPassword: string): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          siteId: '', // Will be updated
          userId,
          action: 'UPDATE',
          resource: 'password',
          resourceType: 'password',
          description: 'Password changed',
          status: 'SUCCESS',
          metadata: {
            passwordHash: hashedPassword,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Error adding to password history:', error);
    }
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(data: {
    eventType: string;
    userId: string;
    siteId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: data.eventType as any,
          severity: data.eventType.includes('FAILED') ? 'MEDIUM' : 'INFO',
          title: `Password ${data.eventType}`,
          description: `Password management event: ${data.eventType}`,
          userId: data.userId,
          siteId: data.siteId,
          metadata: data.metadata || {},
          success: !data.eventType.includes('FAILED'),
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Export singleton instance
export const passwordPolicyService = new PasswordPolicyService(); 