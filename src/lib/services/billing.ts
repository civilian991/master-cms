import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { subscriptionService } from './subscription';
import { paymentGatewayService } from './payment-gateway';

// Validation schemas
const InvoiceSchema = z.object({
  subscriptionId: z.string(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'AED', 'GBP', 'CAD']),
  description: z.string(),
  dueDate: z.date(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    total: z.number().positive(),
  })),
});

const TaxCalculationSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'AED', 'GBP', 'CAD']),
  country: z.string(),
  state: z.string().optional(),
  taxExempt: z.boolean().default(false),
});

export interface Invoice {
  id?: string;
  subscriptionId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: Date;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: InvoiceItem[];
  taxAmount: number;
  totalAmount: number;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TaxCalculation {
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  breakdown: {
    federal?: number;
    state?: number;
    local?: number;
  };
}

export interface DunningEvent {
  id?: string;
  subscriptionId: string;
  type: 'PAYMENT_FAILED' | 'PAYMENT_RETRY' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_REACTIVATED';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RESOLVED';
  attempt: number;
  scheduledAt: Date;
  sentAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface BillingSchedule {
  id?: string;
  subscriptionId: string;
  nextBillingDate: Date;
  amount: number;
  currency: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export class BillingService {
  private static instance: BillingService;

  private constructor() {}

  public static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  // Invoice Management
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const validatedData = InvoiceSchema.parse(invoiceData);
    
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();
    
    // Calculate tax
    const taxCalculation = await this.calculateTax({
      amount: validatedData.amount,
      currency: validatedData.currency as any,
      country: 'US', // Default, should be from user's country
    });

    const invoice = await prisma.invoice.create({
      data: {
        ...validatedData,
        invoiceNumber,
        status: 'DRAFT',
        taxAmount: taxCalculation.taxAmount,
        totalAmount: taxCalculation.totalAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return invoice as Invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return invoice as Invoice;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            user: true,
            site: true,
          },
        },
      },
    });

    return invoice as Invoice | null;
  }

  async getInvoices(subscriptionId?: string, status?: string): Promise<Invoice[]> {
    const where: any = {};
    
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        subscription: {
          include: {
            user: true,
            site: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices as Invoice[];
  }

  async sendInvoice(id: string): Promise<Invoice> {
    const invoice = await this.getInvoice(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Generate PDF invoice
    const pdfBuffer = await this.generateInvoicePDF(invoice);
    
    // Send invoice via email
    await this.sendInvoiceEmail(invoice, pdfBuffer);
    
    // Update invoice status
    const updatedInvoice = await this.updateInvoice(id, {
      status: 'SENT',
    });

    return updatedInvoice;
  }

  async markInvoiceAsPaid(id: string, paymentId: string): Promise<Invoice> {
    const invoice = await this.updateInvoice(id, {
      status: 'PAID',
      paidAt: new Date(),
    });

    // Update subscription status
    await subscriptionService.updateSubscription(invoice.subscriptionId, {
      status: 'ACTIVE',
    });

    return invoice;
  }

  // Tax Calculation
  async calculateTax(taxData: z.infer<typeof TaxCalculationSchema>): Promise<TaxCalculation> {
    const validatedData = TaxCalculationSchema.parse(taxData);
    
    if (validatedData.taxExempt) {
      return {
        taxAmount: 0,
        taxRate: 0,
        totalAmount: validatedData.amount,
        breakdown: {},
      };
    }

    // Use payment gateway service for tax calculation
    const taxCalculation = await paymentGatewayService.calculateTax(
      validatedData.amount,
      validatedData.currency,
      validatedData.country
    );

    return {
      taxAmount: taxCalculation.taxAmount,
      taxRate: taxCalculation.taxRate,
      totalAmount: taxCalculation.totalAmount,
      breakdown: {
        federal: taxCalculation.taxAmount * 0.7, // Mock breakdown
        state: taxCalculation.taxAmount * 0.3,
      },
    };
  }

  // Dunning Management
  async createDunningEvent(eventData: Omit<DunningEvent, 'id'>): Promise<DunningEvent> {
    const event = await prisma.dunningEvent.create({
      data: {
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return event as DunningEvent;
  }

  async processDunningEvents(): Promise<void> {
    const pendingEvents = await prisma.dunningEvent.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: new Date(),
        },
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const event of pendingEvents) {
      try {
        await this.processDunningEvent(event);
      } catch (error) {
        console.error(`Failed to process dunning event ${event.id}:`, error);
        
        // Mark as failed
        await prisma.dunningEvent.update({
          where: { id: event.id! },
          data: {
            status: 'FAILED',
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  private async processDunningEvent(event: DunningEvent & { subscription?: any }): Promise<void> {
    if (!event.subscription) {
      throw new Error('Subscription not found for dunning event');
    }

    switch (event.type) {
      case 'PAYMENT_FAILED':
        await this.handlePaymentFailed(event);
        break;
      case 'PAYMENT_RETRY':
        await this.handlePaymentRetry(event);
        break;
      case 'ACCOUNT_SUSPENDED':
        await this.handleAccountSuspended(event);
        break;
      case 'ACCOUNT_REACTIVATED':
        await this.handleAccountReactivated(event);
        break;
    }

    // Mark as sent
    await prisma.dunningEvent.update({
      where: { id: event.id! },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async handlePaymentFailed(event: DunningEvent & { subscription?: any }): Promise<void> {
    const { subscription } = event;
    
    // Send payment failed email
    await this.sendPaymentFailedEmail(subscription.user, {
      subscriptionId: subscription.id,
      amount: subscription.amount,
      currency: subscription.currency,
      attempt: event.attempt,
    });

    // Schedule retry if under max attempts
    if (event.attempt < 3) {
      const nextRetryDate = new Date();
      nextRetryDate.setDate(nextRetryDate.getDate() + (event.attempt * 2)); // Exponential backoff

      await this.createDunningEvent({
        subscriptionId: event.subscriptionId,
        type: 'PAYMENT_RETRY',
        status: 'PENDING',
        attempt: event.attempt + 1,
        scheduledAt: nextRetryDate,
      });
    } else {
      // Schedule account suspension
      const suspensionDate = new Date();
      suspensionDate.setDate(suspensionDate.getDate() + 7);

      await this.createDunningEvent({
        subscriptionId: event.subscriptionId,
        type: 'ACCOUNT_SUSPENDED',
        status: 'PENDING',
        attempt: 1,
        scheduledAt: suspensionDate,
      });
    }
  }

  private async handlePaymentRetry(event: DunningEvent & { subscription?: any }): Promise<void> {
    const { subscription } = event;
    
    // Attempt to retry payment
    try {
      const paymentRequest = {
        amount: subscription.amount,
        currency: subscription.currency,
        paymentMethod: 'CREDIT_CARD', // Should be from user's saved method
        description: `Retry payment for subscription ${subscription.id}`,
        metadata: {
          retryAttempt: event.attempt,
          subscriptionId: subscription.id,
        },
      };

      const paymentResponse = await paymentGatewayService.processPayment(paymentRequest);

      if (paymentResponse.success) {
        // Payment successful, reactivate subscription
        await subscriptionService.updateSubscription(subscription.id, {
          status: 'ACTIVE',
        });

        await this.createDunningEvent({
          subscriptionId: event.subscriptionId,
          type: 'ACCOUNT_REACTIVATED',
          status: 'PENDING',
          attempt: 1,
          scheduledAt: new Date(),
        });
      } else {
        // Payment failed again, create another failed event
        await this.createDunningEvent({
          subscriptionId: event.subscriptionId,
          type: 'PAYMENT_FAILED',
          status: 'PENDING',
          attempt: event.attempt,
          scheduledAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Payment retry failed:', error);
      
      // Create failed event
      await this.createDunningEvent({
        subscriptionId: event.subscriptionId,
        type: 'PAYMENT_FAILED',
        status: 'PENDING',
        attempt: event.attempt,
        scheduledAt: new Date(),
      });
    }
  }

  private async handleAccountSuspended(event: DunningEvent & { subscription?: any }): Promise<void> {
    const { subscription } = event;
    
    // Suspend subscription
    await subscriptionService.updateSubscription(subscription.id, {
      status: 'PAST_DUE',
    });

    // Send suspension email
    await this.sendAccountSuspendedEmail(subscription.user, {
      subscriptionId: subscription.id,
      amount: subscription.amount,
      currency: subscription.currency,
    });
  }

  private async handleAccountReactivated(event: DunningEvent & { subscription?: any }): Promise<void> {
    const { subscription } = event;
    
    // Reactivate subscription
    await subscriptionService.updateSubscription(subscription.id, {
      status: 'ACTIVE',
    });

    // Send reactivation email
    await this.sendAccountReactivatedEmail(subscription.user, {
      subscriptionId: subscription.id,
    });
  }

  // Billing Schedule Management
  async createBillingSchedule(scheduleData: Omit<BillingSchedule, 'id'>): Promise<BillingSchedule> {
    const schedule = await prisma.billingSchedule.create({
      data: {
        ...scheduleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return schedule as BillingSchedule;
  }

  async processBillingSchedules(): Promise<void> {
    const dueSchedules = await prisma.billingSchedule.findMany({
      where: {
        status: 'SCHEDULED',
        nextBillingDate: {
          lte: new Date(),
        },
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const schedule of dueSchedules) {
      try {
        await this.processBillingSchedule(schedule);
      } catch (error) {
        console.error(`Failed to process billing schedule ${schedule.id}:`, error);
        
        // Update schedule status
        await prisma.billingSchedule.update({
          where: { id: schedule.id! },
          data: {
            status: 'FAILED',
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  private async processBillingSchedule(schedule: BillingSchedule & { subscription?: any }): Promise<void> {
    if (!schedule.subscription) {
      throw new Error('Subscription not found for billing schedule');
    }

    // Mark as processing
    await prisma.billingSchedule.update({
      where: { id: schedule.id! },
      data: {
        status: 'PROCESSING',
        updatedAt: new Date(),
      },
    });

    try {
      // Create invoice
      const invoice = await this.createInvoice({
        subscriptionId: schedule.subscriptionId,
        amount: schedule.amount,
        currency: schedule.currency,
        description: `Billing for subscription ${schedule.subscriptionId}`,
        dueDate: new Date(),
        items: [{
          description: `Subscription - ${schedule.subscription.planType}`,
          quantity: 1,
          unitPrice: schedule.amount,
          total: schedule.amount,
        }],
      });

      // Attempt payment
      const paymentRequest = {
        amount: schedule.amount,
        currency: schedule.currency,
        paymentMethod: 'CREDIT_CARD', // Should be from user's saved method
        description: `Billing for subscription ${schedule.subscriptionId}`,
        metadata: {
          subscriptionId: schedule.subscriptionId,
          invoiceId: invoice.id,
        },
      };

      const paymentResponse = await paymentGatewayService.processPayment(paymentRequest);

      if (paymentResponse.success) {
        // Payment successful
        await this.markInvoiceAsPaid(invoice.id!, paymentResponse.transactionId!);
        
        await prisma.billingSchedule.update({
          where: { id: schedule.id! },
          data: {
            status: 'COMPLETED',
            updatedAt: new Date(),
          },
        });

        // Schedule next billing
        const nextBillingDate = this.calculateNextBillingDate(
          schedule.subscription.startDate,
          schedule.subscription.billingCycle
        );

        await this.createBillingSchedule({
          subscriptionId: schedule.subscriptionId,
          nextBillingDate,
          amount: schedule.amount,
          currency: schedule.currency,
          status: 'SCHEDULED',
          retryCount: 0,
          maxRetries: 3,
        });
      } else {
        // Payment failed
        await prisma.billingSchedule.update({
          where: { id: schedule.id! },
          data: {
            status: 'FAILED',
            retryCount: schedule.retryCount + 1,
            updatedAt: new Date(),
          },
        });

        // Create dunning event
        await this.createDunningEvent({
          subscriptionId: schedule.subscriptionId,
          type: 'PAYMENT_FAILED',
          status: 'PENDING',
          attempt: 1,
          scheduledAt: new Date(),
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // Utility methods
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });

    return `INV-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }

  private async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    // Mock PDF generation - replace with actual PDF library
    const pdfContent = `
      Invoice: ${invoice.invoiceNumber}
      Amount: ${invoice.currency} ${invoice.amount}
      Tax: ${invoice.currency} ${invoice.taxAmount}
      Total: ${invoice.currency} ${invoice.totalAmount}
      Due Date: ${invoice.dueDate.toDateString()}
    `;

    return Buffer.from(pdfContent, 'utf-8');
  }

  private async sendInvoiceEmail(invoice: Invoice, pdfBuffer: Buffer): Promise<void> {
    // Mock email sending - replace with actual email service
    console.log(`Sending invoice ${invoice.invoiceNumber} to customer`);
  }

  private async sendPaymentFailedEmail(user: any, data: any): Promise<void> {
    // Mock email sending
    console.log(`Sending payment failed email to ${user.email}`);
  }

  private async sendAccountSuspendedEmail(user: any, data: any): Promise<void> {
    // Mock email sending
    console.log(`Sending account suspended email to ${user.email}`);
  }

  private async sendAccountReactivatedEmail(user: any, data: any): Promise<void> {
    // Mock email sending
    console.log(`Sending account reactivated email to ${user.email}`);
  }

  private calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
    const nextDate = new Date(startDate);
    
    switch (billingCycle) {
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }
}

export const billingService = BillingService.getInstance(); 