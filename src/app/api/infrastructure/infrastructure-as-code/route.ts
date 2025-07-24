import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { InfrastructureAsCodeService, InfrastructureAsCodeConfig } from '@/lib/services/infrastructure-as-code';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const iacConfig: InfrastructureAsCodeConfig = {
      provider: 'terraform',
      region: process.env.AWS_REGION || 'us-east-1',
      environment: process.env.NODE_ENV || 'development',
      apiKey: process.env.TERRAFORM_API_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const iacService = new InfrastructureAsCodeService(iacConfig);

    switch (action) {
      case 'metrics':
        const metrics = await iacService.getInfrastructureMetrics();
        return NextResponse.json({ metrics });

      case 'health':
        const health = await iacService.getInfrastructureHealth();
        return NextResponse.json({ health });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Infrastructure as Code API error:', error);
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

    const iacConfig: InfrastructureAsCodeConfig = {
      provider: data.provider || 'terraform',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      environment: data.environment || process.env.NODE_ENV || 'development',
      apiKey: data.apiKey || process.env.TERRAFORM_API_KEY,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const iacService = new InfrastructureAsCodeService(iacConfig);

    switch (action) {
      case 'create-terraform-templates':
        const terraformResult = await iacService.createTerraformTemplates();
        return NextResponse.json({ success: terraformResult });

      case 'implement-version-control':
        const versionControlResult = await iacService.implementInfrastructureVersionControl();
        return NextResponse.json({ success: versionControlResult });

      case 'setup-automated-deployment':
        const deploymentResult = await iacService.setupAutomatedInfrastructureDeployment();
        return NextResponse.json({ success: deploymentResult });

      case 'create-infrastructure-testing':
        const testingResult = await iacService.createInfrastructureTesting();
        return NextResponse.json({ success: testingResult });

      case 'implement-infrastructure-monitoring':
        const monitoringResult = await iacService.implementInfrastructureMonitoring();
        return NextResponse.json({ success: monitoringResult });

      case 'setup-cost-optimization':
        const costResult = await iacService.setupInfrastructureCostOptimization();
        return NextResponse.json({ success: costResult });

      case 'create-infrastructure-documentation':
        const documentationResult = await iacService.createInfrastructureDocumentation();
        return NextResponse.json({ success: documentationResult });

      case 'implement-infrastructure-security':
        const securityResult = await iacService.implementInfrastructureSecurity();
        return NextResponse.json({ success: securityResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Infrastructure as Code API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 