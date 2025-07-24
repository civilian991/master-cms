import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { MultiSiteInfrastructureService, MultiSiteInfrastructureConfig } from '@/lib/services/multi-site-infrastructure';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const multiSiteConfig: MultiSiteInfrastructureConfig = {
      provider: 'aws',
      region: process.env.AWS_REGION || 'us-east-1',
      sites: [],
      apiKey: process.env.TERRAFORM_API_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const multiSiteService = new MultiSiteInfrastructureService(multiSiteConfig);

    switch (action) {
      case 'metrics':
        const metrics = await multiSiteService.getMultiSiteMetrics();
        return NextResponse.json({ metrics });

      case 'health':
        const health = await multiSiteService.getMultiSiteHealth();
        return NextResponse.json({ health });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Multi-Site Infrastructure API error:', error);
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

    const multiSiteConfig: MultiSiteInfrastructureConfig = {
      provider: data.provider || 'aws',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      sites: data.sites || [],
      apiKey: data.apiKey || process.env.TERRAFORM_API_KEY,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const multiSiteService = new MultiSiteInfrastructureService(multiSiteConfig);

    switch (action) {
      case 'create-site-specific-configurations':
        const siteConfigResult = await multiSiteService.createSiteSpecificConfigurations();
        return NextResponse.json({ success: siteConfigResult });

      case 'implement-cross-site-resource-sharing':
        const resourceSharingResult = await multiSiteService.implementCrossSiteResourceSharing();
        return NextResponse.json({ success: resourceSharingResult });

      case 'setup-site-specific-monitoring':
        const monitoringResult = await multiSiteService.setupSiteSpecificMonitoring();
        return NextResponse.json({ success: monitoringResult });

      case 'create-site-specific-backup':
        const backupResult = await multiSiteService.createSiteSpecificBackup();
        return NextResponse.json({ success: backupResult });

      case 'implement-site-specific-security':
        const securityResult = await multiSiteService.implementSiteSpecificSecurity();
        return NextResponse.json({ success: securityResult });

      case 'setup-site-specific-performance':
        const performanceResult = await multiSiteService.setupSiteSpecificPerformance();
        return NextResponse.json({ success: performanceResult });

      case 'create-site-specific-scaling':
        const scalingResult = await multiSiteService.createSiteSpecificScaling();
        return NextResponse.json({ success: scalingResult });

      case 'implement-site-specific-cost-management':
        const costResult = await multiSiteService.implementSiteSpecificCostManagement();
        return NextResponse.json({ success: costResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Multi-Site Infrastructure API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 