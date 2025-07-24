import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { ContainerOrchestrationService, ContainerOrchestrationConfig } from '@/lib/services/container-orchestration';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const orchestrationConfig: ContainerOrchestrationConfig = {
      provider: 'kubernetes',
      region: process.env.AWS_REGION || 'us-east-1',
      clusterName: process.env.KUBERNETES_CLUSTER_NAME || 'master-cms-cluster',
      apiKey: process.env.KUBERNETES_API_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const orchestrationService = new ContainerOrchestrationService(orchestrationConfig);

    switch (action) {
      case 'metrics':
        const metrics = await orchestrationService.getClusterMetrics();
        return NextResponse.json({ metrics });

      case 'health':
        const health = await orchestrationService.getClusterHealth();
        return NextResponse.json({ health });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Container Orchestration API error:', error);
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

    const orchestrationConfig: ContainerOrchestrationConfig = {
      provider: data.provider || 'kubernetes',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      clusterName: data.clusterName || process.env.KUBERNETES_CLUSTER_NAME || 'master-cms-cluster',
      apiKey: data.apiKey || process.env.KUBERNETES_API_KEY,
      accessKeyId: data.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    };

    const orchestrationService = new ContainerOrchestrationService(orchestrationConfig);

    switch (action) {
      case 'setup-kubernetes-cluster':
        const clusterResult = await orchestrationService.setupKubernetesCluster();
        return NextResponse.json({ success: clusterResult });

      case 'create-docker-containerization':
        const dockerResult = await orchestrationService.createDockerContainerization();
        return NextResponse.json({ success: dockerResult });

      case 'implement-deployment-strategies':
        const deploymentResult = await orchestrationService.implementKubernetesDeploymentStrategies();
        return NextResponse.json({ success: deploymentResult });

      case 'configure-service-mesh':
        const serviceMeshResult = await orchestrationService.configureKubernetesServiceMesh();
        return NextResponse.json({ success: serviceMeshResult });

      case 'setup-kubernetes-monitoring':
        const monitoringResult = await orchestrationService.setupKubernetesMonitoring();
        return NextResponse.json({ success: monitoringResult });

      case 'implement-kubernetes-security':
        const securityResult = await orchestrationService.implementKubernetesSecurity();
        return NextResponse.json({ success: securityResult });

      case 'create-kubernetes-backup':
        const backupResult = await orchestrationService.createKubernetesBackup();
        return NextResponse.json({ success: backupResult });

      case 'setup-kubernetes-auto-scaling':
        const autoScalingResult = await orchestrationService.setupKubernetesAutoScaling();
        return NextResponse.json({ success: autoScalingResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Container Orchestration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 