import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { APIGatewayService, APIGatewayConfig } from '@/lib/services/api-gateway';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const apiGatewayConfig: APIGatewayConfig = {
      provider: 'aws',
      region: process.env.AWS_REGION || 'us-east-1',
      apiId: process.env.API_GATEWAY_ID,
      stageName: process.env.API_STAGE_NAME || 'prod',
      domainName: process.env.API_DOMAIN_NAME,
      certificateArn: process.env.API_CERTIFICATE_ARN,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const apiGatewayService = new APIGatewayService(apiGatewayConfig);

    switch (action) {
      case 'metrics':
        const metrics = await apiGatewayService.getAPIMetrics();
        return NextResponse.json({ metrics });

      case 'documentation':
        const documentation = await apiGatewayService.createAPIDocumentation();
        return NextResponse.json({ documentation });

      case 'api-keys':
        const apiKeys = await apiGatewayService.getAPIKeys();
        return NextResponse.json({ apiKeys });

      case 'versions':
        const versions = await apiGatewayService.getAPIVersions();
        return NextResponse.json({ versions });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Gateway API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    const apiGatewayConfig: APIGatewayConfig = {
      provider: data.provider || 'aws',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      apiId: data.apiId || process.env.API_GATEWAY_ID,
      stageName: data.stageName || process.env.API_STAGE_NAME || 'prod',
      domainName: data.domainName || process.env.API_DOMAIN_NAME,
      certificateArn: data.certificateArn || process.env.API_CERTIFICATE_ARN,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const apiGatewayService = new APIGatewayService(apiGatewayConfig);

    switch (action) {
      case 'setup':
        const setupResult = await apiGatewayService.setupAPIGateway();
        return NextResponse.json({ success: setupResult });

      case 'configure-rate-limiting':
        const rateLimitResult = await apiGatewayService.configureAPIRateLimiting();
        return NextResponse.json({ success: rateLimitResult });

      case 'configure-authentication':
        const authResult = await apiGatewayService.configureAPIAuthentication();
        return NextResponse.json({ success: authResult });

      case 'setup-monitoring':
        const monitoringResult = await apiGatewayService.setupAPIMonitoring();
        return NextResponse.json({ success: monitoringResult });

      case 'setup-versioning':
        const versioningResult = await apiGatewayService.setupAPIVersioning();
        return NextResponse.json({ success: versioningResult });

      case 'setup-security':
        const securityResult = await apiGatewayService.setupAPISecurity();
        return NextResponse.json({ success: securityResult });

      case 'setup-performance':
        const performanceResult = await apiGatewayService.setupAPIPerformanceOptimization();
        return NextResponse.json({ success: performanceResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Gateway API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 