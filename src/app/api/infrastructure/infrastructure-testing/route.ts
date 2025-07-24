import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { InfrastructureTestingService, InfrastructureTestingConfig } from '@/lib/services/infrastructure-testing';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const testingConfig: InfrastructureTestingConfig = {
      environment: (process.env.NODE_ENV as 'dev' | 'staging' | 'production') || 'dev',
      region: process.env.AWS_REGION || 'us-east-1',
      provider: 'aws',
      endpoints: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ],
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        apiKey: process.env.TESTING_API_KEY,
      },
    };

    const testingService = new InfrastructureTestingService(testingConfig);

    switch (action) {
      case 'test-suite':
        const testSuite = await testingService.runInfrastructureTestSuite();
        return NextResponse.json({ testSuite });

      case 'summary':
        const summary = await testingService.getTestResultsSummary();
        return NextResponse.json({ summary });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Infrastructure Testing API error:', error);
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

    const testingConfig: InfrastructureTestingConfig = {
      environment: data.environment || (process.env.NODE_ENV as 'dev' | 'staging' | 'production') || 'dev',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      provider: data.provider || 'aws',
      endpoints: data.endpoints || [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ],
      credentials: {
        accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
        apiKey: data.apiKey || process.env.TESTING_API_KEY,
      },
    };

    const testingService = new InfrastructureTestingService(testingConfig);

    switch (action) {
      case 'create-testing-procedures':
        const proceduresResult = await testingService.createInfrastructureTestingProcedures();
        return NextResponse.json({ success: proceduresResult });

      case 'implement-load-testing':
        const loadTestingResult = await testingService.implementLoadTesting();
        return NextResponse.json({ success: loadTestingResult });

      case 'setup-disaster-recovery-testing':
        const drTestingResult = await testingService.setupDisasterRecoveryTesting();
        return NextResponse.json({ success: drTestingResult });

      case 'create-security-testing':
        const securityTestingResult = await testingService.createSecurityTesting();
        return NextResponse.json({ success: securityTestingResult });

      case 'implement-monitoring-validation':
        const monitoringValidationResult = await testingService.implementMonitoringValidation();
        return NextResponse.json({ success: monitoringValidationResult });

      case 'setup-backup-recovery-testing':
        const backupTestingResult = await testingService.setupBackupRecoveryTesting();
        return NextResponse.json({ success: backupTestingResult });

      case 'build-automated-testing':
        const automatedTestingResult = await testingService.buildAutomatedInfrastructureTesting();
        return NextResponse.json({ success: automatedTestingResult });

      case 'run-test-suite':
        const testSuite = await testingService.runInfrastructureTestSuite();
        return NextResponse.json({ testSuite });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Infrastructure Testing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 