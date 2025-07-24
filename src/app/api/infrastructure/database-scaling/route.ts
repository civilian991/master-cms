import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { DatabaseScalingService, DatabaseScalingConfig } from '@/lib/services/database-scaling';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const databaseConfig: DatabaseScalingConfig = {
      provider: 'aws',
      region: process.env.AWS_REGION || 'us-east-1',
      engine: 'postgresql',
      instanceType: process.env.DB_INSTANCE_TYPE || 'db.r5.large',
      storageSize: parseInt(process.env.DB_STORAGE_SIZE || '100'),
      apiKey: process.env.DATABASE_API_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const databaseService = new DatabaseScalingService(databaseConfig);

    switch (action) {
      case 'metrics':
        const metrics = await databaseService.getDatabaseMetrics();
        return NextResponse.json({ metrics });

      case 'health':
        const health = await databaseService.getDatabaseHealth();
        return NextResponse.json({ health });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database Scaling API error:', error);
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

    const databaseConfig: DatabaseScalingConfig = {
      provider: data.provider || 'aws',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      engine: data.engine || 'postgresql',
      instanceType: data.instanceType || process.env.DB_INSTANCE_TYPE || 'db.r5.large',
      storageSize: data.storageSize || parseInt(process.env.DB_STORAGE_SIZE || '100'),
      apiKey: data.apiKey || process.env.DATABASE_API_KEY,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const databaseService = new DatabaseScalingService(databaseConfig);

    switch (action) {
      case 'configure-connection-pooling':
        const poolingResult = await databaseService.configureConnectionPooling();
        return NextResponse.json({ success: poolingResult });

      case 'implement-read-replicas':
        const replicasResult = await databaseService.implementReadReplicas();
        return NextResponse.json({ success: replicasResult });

      case 'optimize-queries':
        const optimizationResult = await databaseService.optimizeDatabaseQueries();
        return NextResponse.json({ success: optimizationResult });

      case 'setup-monitoring':
        const monitoringResult = await databaseService.setupDatabaseMonitoring();
        return NextResponse.json({ success: monitoringResult });

      case 'implement-backup':
        const backupResult = await databaseService.implementDatabaseBackup();
        return NextResponse.json({ success: backupResult });

      case 'create-performance-optimization':
        const performanceResult = await databaseService.createDatabasePerformanceOptimization();
        return NextResponse.json({ success: performanceResult });

      case 'setup-scaling-strategies':
        const scalingResult = await databaseService.setupDatabaseScalingStrategies();
        return NextResponse.json({ success: scalingResult });

      case 'implement-security':
        const securityResult = await databaseService.implementDatabaseSecurity();
        return NextResponse.json({ success: securityResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database Scaling API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 