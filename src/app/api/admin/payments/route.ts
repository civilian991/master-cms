import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscription';
import { paymentGatewayService } from '@/lib/services/payment-gateway';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, ...paymentData } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Process payment through gateway
    const paymentRequest = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      description: paymentData.description || 'Subscription payment',
      metadata: paymentData.metadata,
      customerId: paymentData.customerId,
      returnUrl: paymentData.returnUrl,
      cancelUrl: paymentData.cancelUrl,
    };

    const gatewayResponse = await paymentGatewayService.processPayment(
      paymentRequest,
      paymentData.gateway
    );

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { error: gatewayResponse.error },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await subscriptionService.createPayment({
      ...paymentData,
      siteId,
      transactionId: gatewayResponse.transactionId,
      status: 'PENDING',
      metadata: {
        ...paymentData.metadata,
        gatewayResponse: gatewayResponse.metadata,
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      gatewayResponse,
    });
  } catch (error) {
    console.error('Failed to process payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const gateway = searchParams.get('gateway');
    const userId = searchParams.get('userId');
    const subscriptionId = searchParams.get('subscriptionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const payments = await subscriptionService.getPayments(siteId, {
      status: status || undefined,
      gateway: gateway || undefined,
      userId: userId || undefined,
      subscriptionId: subscriptionId || undefined,
    });

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = payments.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      payments: paginatedPayments,
      pagination: {
        page,
        limit,
        total: payments.length,
        pages: Math.ceil(payments.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const payment = await subscriptionService.updatePayment(paymentId, body);

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Failed to update payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
} 