import { z } from 'zod';

// Payment gateway interfaces
export interface PaymentGatewayConfig {
  gateway: 'STRIPE' | 'PAYPAL' | 'SQUARE' | 'CRYPTO_GATEWAY';
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  isActive: boolean;
  supportedCurrencies: string[];
  supportedPaymentMethods: string[];
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  description: string;
  metadata?: Record<string, any>;
  customerId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  type: string;
  data: any;
  signature?: string;
  timestamp: number;
}

// Stripe integration
class StripeGateway {
  private apiKey: string;
  private webhookSecret?: string;

  constructor(config: PaymentGatewayConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
  }

  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Mock Stripe implementation - replace with actual Stripe SDK
      const stripe = require('stripe')(this.apiKey);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: request.metadata,
        customer: request.customerId,
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        paymentUrl: paymentIntent.next_action?.redirect_to_url?.url,
        metadata: {
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createCheckoutSession(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Mock Stripe implementation - replace with actual Stripe SDK
      const stripe = require('stripe')(this.apiKey);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: request.currency.toLowerCase(),
            product_data: {
              name: request.description,
            },
            unit_amount: Math.round(request.amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancel_url: request.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        metadata: request.metadata,
      });

      return {
        success: true,
        transactionId: session.id,
        paymentUrl: session.url,
        metadata: {
          sessionId: session.id,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookEvent | null> {
    try {
      // Mock Stripe webhook verification - replace with actual implementation
      const stripe = require('stripe')(this.apiKey);
      
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      return {
        type: event.type,
        data: event.data.object,
        signature,
        timestamp: event.created,
      };
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return null;
    }
  }
}

// PayPal integration
class PayPalGateway {
  private clientId: string;
  private clientSecret: string;
  private isSandbox: boolean;

  constructor(config: PaymentGatewayConfig) {
    this.clientId = config.apiKey;
    this.clientSecret = config.apiSecret || '';
    this.isSandbox = process.env.NODE_ENV !== 'production';
  }

  async createOrder(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Mock PayPal implementation - replace with actual PayPal SDK
      const paypal = require('@paypal/checkout-server-sdk');
      
      const environment = this.isSandbox 
        ? new paypal.core.SandboxEnvironment(this.clientId, this.clientSecret)
        : new paypal.core.LiveEnvironment(this.clientId, this.clientSecret);
      
      const client = new paypal.core.PayPalHttpClient(environment);

      const order = new paypal.orders.OrdersCreateRequest();
      order.prefer("return=representation");
      order.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: request.currency,
            value: request.amount.toString(),
          },
          description: request.description,
        }],
        application_context: {
          return_url: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: request.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        },
      });

      const response = await client.execute(order);

      return {
        success: true,
        transactionId: response.result.id,
        paymentUrl: response.result.links.find((link: any) => link.rel === 'approve')?.href,
        metadata: {
          orderId: response.result.id,
          status: response.result.status,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async captureOrder(orderId: string): Promise<PaymentResponse> {
    try {
      // Mock PayPal capture implementation
      const paypal = require('@paypal/checkout-server-sdk');
      
      const environment = this.isSandbox 
        ? new paypal.core.SandboxEnvironment(this.clientId, this.clientSecret)
        : new paypal.core.LiveEnvironment(this.clientId, this.clientSecret);
      
      const client = new paypal.core.PayPalHttpClient(environment);

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      const response = await client.execute(request);

      return {
        success: true,
        transactionId: response.result.id,
        metadata: {
          captureId: response.result.purchase_units[0].payments.captures[0].id,
          status: response.result.status,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Crypto payment gateway
class CryptoGateway {
  private apiKey: string;
  private supportedCoins: string[];

  constructor(config: PaymentGatewayConfig) {
    this.apiKey = config.apiKey;
    this.supportedCoins = ['BTC', 'ETH', 'USDT', 'USDC'];
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Mock crypto payment implementation - replace with actual crypto payment provider
      const cryptoProvider = require('crypto-payment-provider')(this.apiKey);
      
      const payment = await cryptoProvider.createPayment({
        amount: request.amount,
        currency: request.currency,
        crypto_currency: this.getCryptoCurrency(request.currency),
        description: request.description,
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
        metadata: request.metadata,
      });

      return {
        success: true,
        transactionId: payment.id,
        paymentUrl: payment.payment_url,
        metadata: {
          cryptoAddress: payment.crypto_address,
          cryptoAmount: payment.crypto_amount,
          exchangeRate: payment.exchange_rate,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getCryptoCurrency(fiatCurrency: string): string {
    const currencyMap: Record<string, string> = {
      'USD': 'USDT',
      'EUR': 'USDC',
      'AED': 'USDT',
      'GBP': 'USDC',
      'CAD': 'USDT',
    };
    
    return currencyMap[fiatCurrency] || 'USDT';
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      // Mock crypto payment status check
      const cryptoProvider = require('crypto-payment-provider')(this.apiKey);
      
      const status = await cryptoProvider.getPaymentStatus(transactionId);

      return {
        success: status.status === 'completed',
        transactionId,
        metadata: {
          status: status.status,
          confirmations: status.confirmations,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Main payment gateway service
export class PaymentGatewayService {
  private static instance: PaymentGatewayService;
  private gateways: Map<string, any> = new Map();
  private configs: Map<string, PaymentGatewayConfig> = new Map();

  private constructor() {
    this.initializeGateways();
  }

  public static getInstance(): PaymentGatewayService {
    if (!PaymentGatewayService.instance) {
      PaymentGatewayService.instance = new PaymentGatewayService();
    }
    return PaymentGatewayService.instance;
  }

  private initializeGateways(): void {
    // Initialize Stripe
    if (process.env.PAYMENT_STRIPE_SECRET_KEY) {
      const stripeConfig: PaymentGatewayConfig = {
        gateway: 'STRIPE',
        apiKey: process.env.PAYMENT_STRIPE_SECRET_KEY,
        webhookSecret: process.env.PAYMENT_STRIPE_WEBHOOK_SECRET,
        isActive: true,
        supportedCurrencies: ['USD', 'EUR', 'AED', 'GBP', 'CAD'],
        supportedPaymentMethods: ['CREDIT_CARD', 'DEBIT_CARD'],
      };
      
      this.configs.set('STRIPE', stripeConfig);
      this.gateways.set('STRIPE', new StripeGateway(stripeConfig));
    }

    // Initialize PayPal
    if (process.env.PAYMENT_PAYPAL_CLIENT_ID && process.env.PAYMENT_PAYPAL_CLIENT_SECRET) {
      const paypalConfig: PaymentGatewayConfig = {
        gateway: 'PAYPAL',
        apiKey: process.env.PAYMENT_PAYPAL_CLIENT_ID,
        apiSecret: process.env.PAYMENT_PAYPAL_CLIENT_SECRET,
        isActive: true,
        supportedCurrencies: ['USD', 'EUR', 'AED', 'GBP', 'CAD'],
        supportedPaymentMethods: ['PAYPAL'],
      };
      
      this.configs.set('PAYPAL', paypalConfig);
      this.gateways.set('PAYPAL', new PayPalGateway(paypalConfig));
    }

    // Initialize Crypto Gateway
    if (process.env.PAYMENT_CRYPTO_API_KEY) {
      const cryptoConfig: PaymentGatewayConfig = {
        gateway: 'CRYPTO_GATEWAY',
        apiKey: process.env.PAYMENT_CRYPTO_API_KEY,
        isActive: true,
        supportedCurrencies: ['USD', 'EUR', 'AED', 'GBP', 'CAD'],
        supportedPaymentMethods: ['CRYPTO'],
      };
      
      this.configs.set('CRYPTO_GATEWAY', cryptoConfig);
      this.gateways.set('CRYPTO_GATEWAY', new CryptoGateway(cryptoConfig));
    }
  }

  async processPayment(request: PaymentRequest, preferredGateway?: string): Promise<PaymentResponse> {
    const availableGateways = this.getAvailableGateways(request.currency, request.paymentMethod);
    
    if (availableGateways.length === 0) {
      return {
        success: false,
        error: 'No available payment gateways for the specified currency and payment method',
      };
    }

    // Use preferred gateway if available, otherwise use first available
    const gatewayName = preferredGateway && availableGateways.includes(preferredGateway)
      ? preferredGateway
      : availableGateways[0];

    const gateway = this.gateways.get(gatewayName);
    
    if (!gateway) {
      return {
        success: false,
        error: `Payment gateway ${gatewayName} not available`,
      };
    }

    try {
      let response: PaymentResponse;

      switch (gatewayName) {
        case 'STRIPE':
          response = await gateway.createPaymentIntent(request);
          break;
        case 'PAYPAL':
          response = await gateway.createOrder(request);
          break;
        case 'CRYPTO_GATEWAY':
          response = await gateway.createPayment(request);
          break;
        default:
          return {
            success: false,
            error: `Unsupported payment gateway: ${gatewayName}`,
          };
      }

      // Add gateway information to response
      response.metadata = {
        ...response.metadata,
        gateway: gatewayName,
        currency: request.currency,
        paymentMethod: request.paymentMethod,
      };

      return response;
    } catch (error: any) {
      // Try fallback gateway if available
      const fallbackGateways = availableGateways.filter(g => g !== gatewayName);
      
      if (fallbackGateways.length > 0) {
        console.warn(`Primary gateway ${gatewayName} failed, trying fallback: ${fallbackGateways[0]}`);
        return this.processPayment(request, fallbackGateways[0]);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyWebhook(gateway: string, payload: string, signature: string): Promise<WebhookEvent | null> {
    const gatewayInstance = this.gateways.get(gateway);
    
    if (!gatewayInstance || !gatewayInstance.verifyWebhook) {
      return null;
    }

    return gatewayInstance.verifyWebhook(payload, signature);
  }

  async capturePayment(gateway: string, transactionId: string): Promise<PaymentResponse> {
    const gatewayInstance = this.gateways.get(gateway);
    
    if (!gatewayInstance || !gatewayInstance.captureOrder) {
      return {
        success: false,
        error: `Capture not supported for gateway: ${gateway}`,
      };
    }

    return gatewayInstance.captureOrder(transactionId);
  }

  async checkPaymentStatus(gateway: string, transactionId: string): Promise<PaymentResponse> {
    const gatewayInstance = this.gateways.get(gateway);
    
    if (!gatewayInstance || !gatewayInstance.checkPaymentStatus) {
      return {
        success: false,
        error: `Status check not supported for gateway: ${gateway}`,
      };
    }

    return gatewayInstance.checkPaymentStatus(transactionId);
  }

  getAvailableGateways(currency: string, paymentMethod: string): string[] {
    const available: string[] = [];
    
    for (const [name, config] of this.configs) {
      if (config.isActive && 
          config.supportedCurrencies.includes(currency) &&
          config.supportedPaymentMethods.includes(paymentMethod)) {
        available.push(name);
      }
    }
    
    return available;
  }

  getGatewayConfig(gateway: string): PaymentGatewayConfig | undefined {
    return this.configs.get(gateway);
  }

  isGatewayAvailable(gateway: string): boolean {
    return this.gateways.has(gateway) && this.configs.get(gateway)?.isActive;
  }

  // Currency conversion (mock implementation - replace with real service)
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Mock exchange rates - replace with real currency conversion service
    const exchangeRates: Record<string, number> = {
      'USD': 1,
      'EUR': 0.85,
      'AED': 3.67,
      'GBP': 0.73,
      'CAD': 1.25,
    };

    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;

    return (amount / fromRate) * toRate;
  }

  // Tax calculation (mock implementation - replace with real service)
  async calculateTax(amount: number, currency: string, country: string): Promise<{
    taxAmount: number;
    taxRate: number;
    totalAmount: number;
  }> {
    // Mock tax rates - replace with real tax calculation service
    const taxRates: Record<string, number> = {
      'US': 0.08, // 8% sales tax
      'CA': 0.13, // 13% HST
      'GB': 0.20, // 20% VAT
      'DE': 0.19, // 19% VAT
      'AE': 0.05, // 5% VAT
    };

    const taxRate = taxRates[country] || 0;
    const taxAmount = amount * taxRate;
    const totalAmount = amount + taxAmount;

    return {
      taxAmount,
      taxRate,
      totalAmount,
    };
  }
}

export const paymentGatewayService = PaymentGatewayService.getInstance(); 