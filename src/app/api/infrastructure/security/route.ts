import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { SecurityService, SecurityConfig } from '@/lib/services/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const securityConfig: SecurityConfig = {
      provider: 'aws',
      region: process.env.AWS_REGION || 'us-east-1',
      domain: process.env.DOMAIN || 'example.com',
      sslCertificateArn: process.env.SSL_CERTIFICATE_ARN,
      wafWebAclArn: process.env.WAF_WEB_ACL_ARN,
      apiKey: process.env.SECURITY_API_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const securityService = new SecurityService(securityConfig);

    switch (action) {
      case 'metrics':
        const metrics = await securityService.getSecurityMetrics();
        return NextResponse.json({ metrics });

      case 'ssl-certificates':
        const certificates = await securityService.getSSLCertificates();
        return NextResponse.json({ certificates });

      case 'incidents':
        const incidents = await securityService.getSecurityIncidents();
        return NextResponse.json({ incidents });

      case 'incident-procedures':
        const procedures = await securityService.createIncidentResponseProcedures();
        return NextResponse.json({ procedures });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API error:', error);
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

    const securityConfig: SecurityConfig = {
      provider: data.provider || 'aws',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      domain: data.domain || process.env.DOMAIN || 'example.com',
      sslCertificateArn: data.sslCertificateArn || process.env.SSL_CERTIFICATE_ARN,
      wafWebAclArn: data.wafWebAclArn || process.env.WAF_WEB_ACL_ARN,
      apiKey: data.apiKey || process.env.SECURITY_API_KEY,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const securityService = new SecurityService(securityConfig);

    switch (action) {
      case 'configure-ssl':
        const sslConfigured = await securityService.configureSSL();
        return NextResponse.json({ success: sslConfigured });

      case 'configure-waf':
        const wafConfig = await securityService.configureWAF();
        return NextResponse.json({ success: true, wafConfig });

      case 'configure-ddos':
        const ddosConfig = await securityService.configureDDoSProtection();
        return NextResponse.json({ success: true, ddosConfig });

      case 'configure-headers':
        const headers = await securityService.configureSecurityHeaders();
        return NextResponse.json({ success: true, headers });

      case 'configure-rate-limiting':
        const rateLimitConfig = await securityService.configureRateLimiting();
        return NextResponse.json({ success: true, rateLimitConfig });

      case 'setup-monitoring':
        const monitoringSetup = await securityService.setupSecurityMonitoring();
        return NextResponse.json({ success: monitoringSetup });

      case 'setup-compliance':
        const complianceSetup = await securityService.setupComplianceMonitoring();
        return NextResponse.json({ success: complianceSetup });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 