import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { 
  BackupRecoveryService, 
  BackupConfig, 
  DatabaseBackupConfig, 
  FileBackupConfig 
} from '@/lib/services/backup-recovery';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const backupConfig: BackupConfig = {
      provider: 'aws',
      region: process.env.AWS_REGION || 'us-east-1',
      bucketName: process.env.BACKUP_BUCKET_NAME,
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      retentionDays: 30,
      backupSchedule: '0 2 * * *', // Daily at 2 AM
      crossRegionReplication: true,
      replicationRegions: ['us-west-2', 'eu-west-1'],
    };

    const databaseConfig: DatabaseBackupConfig = {
      databaseType: 'postgresql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'cms',
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      backupFormat: 'sql',
      compression: true,
      incremental: true,
    };

    const fileConfig: FileBackupConfig = {
      sourcePaths: ['/app/uploads', '/app/public', '/app/logs'],
      excludePatterns: ['*.tmp', '*.log', 'node_modules'],
      compression: true,
      encryption: true,
      versioning: true,
      maxVersions: 10,
    };

    const backupService = new BackupRecoveryService(
      backupConfig,
      databaseConfig,
      fileConfig
    );

    switch (action) {
      case 'metrics':
        const metrics = await backupService.getBackupMetrics();
        return NextResponse.json({ metrics });

      case 'disaster-recovery-plan':
        const recoveryPlan = await backupService.createDisasterRecoveryPlan();
        return NextResponse.json({ recoveryPlan });

      case 'backup':
        const backupId = searchParams.get('id');
        if (!backupId) {
          return NextResponse.json(
            { error: 'Backup ID is required' },
            { status: 400 }
          );
        }
        const backup = await backupService.getBackup(backupId);
        return NextResponse.json({ backup });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Backup recovery API error:', error);
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

    const backupConfig: BackupConfig = {
      provider: data.provider || 'aws',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      bucketName: data.bucketName || process.env.BACKUP_BUCKET_NAME,
      encryptionKey: data.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      retentionDays: data.retentionDays || 30,
      backupSchedule: data.backupSchedule || '0 2 * * *',
      crossRegionReplication: data.crossRegionReplication !== false,
      replicationRegions: data.replicationRegions || ['us-west-2', 'eu-west-1'],
    };

    const databaseConfig: DatabaseBackupConfig = {
      databaseType: data.databaseType || 'postgresql',
      host: data.databaseHost || process.env.DATABASE_HOST || 'localhost',
      port: parseInt(data.databasePort || process.env.DATABASE_PORT || '5432'),
      database: data.databaseName || process.env.DATABASE_NAME || 'cms',
      username: data.databaseUsername || process.env.DATABASE_USERNAME || 'postgres',
      password: data.databasePassword || process.env.DATABASE_PASSWORD || '',
      backupFormat: data.backupFormat || 'sql',
      compression: data.compression !== false,
      incremental: data.incremental !== false,
    };

    const fileConfig: FileBackupConfig = {
      sourcePaths: data.sourcePaths || ['/app/uploads', '/app/public', '/app/logs'],
      excludePatterns: data.excludePatterns || ['*.tmp', '*.log', 'node_modules'],
      compression: data.fileCompression !== false,
      encryption: data.fileEncryption !== false,
      versioning: data.versioning !== false,
      maxVersions: data.maxVersions || 10,
    };

    const backupService = new BackupRecoveryService(
      backupConfig,
      databaseConfig,
      fileConfig
    );

    switch (action) {
      case 'setup-database-backup':
        const databaseBackupSetup = await backupService.setupDatabaseBackup();
        return NextResponse.json({ success: databaseBackupSetup });

      case 'setup-file-backup':
        const fileBackupSetup = await backupService.setupFileBackup();
        return NextResponse.json({ success: fileBackupSetup });

      case 'configure-security':
        const securityConfigured = await backupService.configureBackupSecurity();
        return NextResponse.json({ success: securityConfigured });

      case 'setup-monitoring':
        const monitoringSetup = await backupService.setupBackupMonitoring();
        return NextResponse.json({ success: monitoringSetup });

      case 'configure-retention':
        const retentionConfigured = await backupService.configureBackupRetention();
        return NextResponse.json({ success: retentionConfigured });

      case 'setup-replication':
        const replicationSetup = await backupService.setupCrossRegionReplication();
        return NextResponse.json({ success: replicationSetup });

      case 'test-backup':
        const { backupId } = data;
        if (!backupId) {
          return NextResponse.json(
            { error: 'Backup ID is required' },
            { status: 400 }
          );
        }
        const backupTested = await backupService.testBackup(backupId);
        return NextResponse.json({ success: backupTested });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Backup recovery API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 