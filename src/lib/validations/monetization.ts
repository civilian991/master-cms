// Monetization Validation Schemas
// Note: Using basic validation until Zod is installed

export interface SubscriptionValidation {
  planType: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'TRIAL'
  currency: 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD'
  amount: number
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  startDate: Date
  endDate?: Date
  trialEndDate?: Date
}

export interface PaymentValidation {
  amount: number
  currency: 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO'
  transactionId?: string
  gateway: 'STRIPE' | 'PAYPAL' | 'SQUARE' | 'CRYPTO_GATEWAY'
  metadata?: Record<string, any>
}

export interface AdvertisementValidation {
  name: string
  type: 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'BANNER' | 'POPUP'
  contentEn: string
  contentAr?: string
  imageUrl?: string
  linkUrl?: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT'
  startDate: Date
  endDate?: Date
  impressions: number
  clicks: number
  ctr: number
  revenue: number
}

// Validation functions
export const validateSubscription = (data: any): SubscriptionValidation => {
  const required = ['planType', 'currency', 'amount', 'billingCycle', 'startDate']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }
  
  return data as SubscriptionValidation
}

export const validatePayment = (data: any): PaymentValidation => {
  const required = ['amount', 'currency', 'paymentMethod', 'gateway']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  if (data.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }
  
  return data as PaymentValidation
}

export const validateAdvertisement = (data: any): AdvertisementValidation => {
  const required = ['name', 'type', 'contentEn', 'startDate']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  return data as AdvertisementValidation
} 