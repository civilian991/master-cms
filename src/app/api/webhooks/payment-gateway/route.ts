import { NextRequest, NextResponse } from 'next/server';
import { paymentGatewayService } from '@/lib/services/payment-gateway';
import { subscriptionService } from '@/lib/services/subscription';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gateway = searchParams.get('gateway');

    if (!gateway) {
      return NextResponse.json(
        { error: 'Gateway parameter is required' },
        { status: 400 }
      );
    }

    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || 
                     request.headers.get('paypal-transmission-sig') ||
                     request.headers.get('x-crypto-signature') ||
                     '';

    // Verify webhook
    const event = await paymentGatewayService.verifyWebhook(gateway, payload, signature);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Process webhook event
    await processWebhookEvent(gateway, event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(gateway: string, event: any): Promise<void> {
  try {
    switch (gateway) {
      case 'STRIPE':
        await processStripeEvent(event);
        break;
      case 'PAYPAL':
        await processPayPalEvent(event);
        break;
      case 'CRYPTO_GATEWAY':
        await processCryptoEvent(event);
        break;
      default:
        console.warn(`Unsupported gateway: ${gateway}`);
    }
  } catch (error) {
    console.error(`Error processing ${gateway} webhook:`, error);
    throw error;
  }
}

async function processStripeEvent(event: any): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data);
      break;
    case 'invoice.payment_succeeded':
      await handleSubscriptionPayment(event.data);
      break;
    case 'invoice.payment_failed':
      await handleSubscriptionPaymentFailure(event.data);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data);
      break;
    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }
}

async function processPayPalEvent(event: any): Promise<void> {
  switch (event.type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handlePaymentSuccess(event.data);
      break;
    case 'PAYMENT.CAPTURE.DENIED':
      await handlePaymentFailure(event.data);
      break;
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      await handleSubscriptionActivation(event.data);
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      await handleSubscriptionCancellation(event.data);
      break;
    default:
      console.log(`Unhandled PayPal event: ${event.type}`);
  }
}

async function processCryptoEvent(event: any): Promise<void> {
  switch (event.type) {
    case 'payment.completed':
      await handlePaymentSuccess(event.data);
      break;
    case 'payment.failed':
      await handlePaymentFailure(event.data);
      break;
    default:
      console.log(`Unhandled Crypto event: ${event.type}`);
  }
}

async function handlePaymentSuccess(data: any): Promise<void> {
  try {
    // Find payment by transaction ID
    const payments = await subscriptionService.getPayments('', {
      transactionId: data.id,
    });

    if (payments.length > 0) {
      const payment = payments[0];
      
      // Update payment status
      await subscriptionService.updatePayment(payment.id!, {
        status: 'COMPLETED',
        metadata: {
          ...payment.metadata,
          processedAt: new Date().toISOString(),
          gatewayData: data,
        },
      });

      // If this is a subscription payment, update subscription
      if (payment.subscriptionId) {
        await subscriptionService.updateSubscription(payment.subscriptionId, {
          status: 'ACTIVE',
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(data: any): Promise<void> {
  try {
    const payments = await subscriptionService.getPayments('', {
      transactionId: data.id,
    });

    if (payments.length > 0) {
      const payment = payments[0];
      
      await subscriptionService.updatePayment(payment.id!, {
        status: 'FAILED',
        metadata: {
          ...payment.metadata,
          failedAt: new Date().toISOString(),
          failureReason: data.last_payment_error?.message || 'Payment failed',
          gatewayData: data,
        },
      });

      // If this is a subscription payment, mark as past due
      if (payment.subscriptionId) {
        await subscriptionService.updateSubscription(payment.subscriptionId, {
          status: 'PAST_DUE',
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleSubscriptionPayment(data: any): Promise<void> {
  try {
    // Handle recurring subscription payment
    const subscriptionId = data.subscription;
    if (subscriptionId) {
      await subscriptionService.updateSubscription(subscriptionId, {
        status: 'ACTIVE',
        startDate: new Date(),
      });
    }
  } catch (error) {
    console.error('Error handling subscription payment:', error);
  }
}

async function handleSubscriptionPaymentFailure(data: any): Promise<void> {
  try {
    const subscriptionId = data.subscription;
    if (subscriptionId) {
      await subscriptionService.updateSubscription(subscriptionId, {
        status: 'PAST_DUE',
      });
    }
  } catch (error) {
    console.error('Error handling subscription payment failure:', error);
  }
}

async function handleSubscriptionCancellation(data: any): Promise<void> {
  try {
    const subscriptionId = data.id;
    if (subscriptionId) {
      await subscriptionService.cancelSubscription(subscriptionId, 'Cancelled via payment gateway');
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleSubscriptionActivation(data: any): Promise<void> {
  try {
    const subscriptionId = data.id;
    if (subscriptionId) {
      await subscriptionService.updateSubscription(subscriptionId, {
        status: 'ACTIVE',
      });
    }
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
} 