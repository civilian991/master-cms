import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { 
  LoadBalancerService, 
  LoadBalancerConfig, 
  AutoScalingConfig, 
  HealthCheckConfig, 
  TrafficDistribution 
} from '@/lib/services/load-balancer';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const loadBalancerConfig: LoadBalancerConfig = {
      provider: 'aws',
      region: process.env.AWS_REGION || 'us-east-1',
      vpcId: process.env.AWS_VPC_ID,
      subnetIds: process.env.AWS_SUBNET_IDS?.split(',') || [],
      securityGroupIds: process.env.AWS_SECURITY_GROUP_IDS?.split(',') || [],
      targetGroupArn: process.env.AWS_TARGET_GROUP_ARN,
      loadBalancerArn: process.env.AWS_LOAD_BALANCER_ARN,
    };

    const autoScalingConfig: AutoScalingConfig = {
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300,
      scaleDownCooldown: 300,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 80,
    };

    const healthCheckConfig: HealthCheckConfig = {
      protocol: 'HTTP',
      port: 80,
      path: '/health',
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
      successCodes: '200',
    };

    const trafficDistribution: TrafficDistribution = {
      algorithm: 'round_robin',
      stickySessions: true,
      sessionTimeout: 3600,
    };

    const loadBalancerService = new LoadBalancerService(
      loadBalancerConfig,
      autoScalingConfig,
      healthCheckConfig,
      trafficDistribution
    );

    switch (action) {
      case 'metrics':
        const timeRange = searchParams.get('timeRange') || '1h';
        const metrics = await loadBalancerService.getMetrics(timeRange);
        return NextResponse.json({ metrics });

      case 'scaling-events':
        const scalingEvents = await loadBalancerService.getScalingEvents();
        return NextResponse.json({ scalingEvents });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Load balancer API error:', error);
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

    const loadBalancerConfig: LoadBalancerConfig = {
      provider: data.provider || 'aws',
      region: data.region || process.env.AWS_REGION || 'us-east-1',
      vpcId: data.vpcId || process.env.AWS_VPC_ID,
      subnetIds: data.subnetIds || process.env.AWS_SUBNET_IDS?.split(',') || [],
      securityGroupIds: data.securityGroupIds || process.env.AWS_SECURITY_GROUP_IDS?.split(',') || [],
      targetGroupArn: data.targetGroupArn || process.env.AWS_TARGET_GROUP_ARN,
      loadBalancerArn: data.loadBalancerArn || process.env.AWS_LOAD_BALANCER_ARN,
    };

    const autoScalingConfig: AutoScalingConfig = {
      minCapacity: data.minCapacity || 2,
      maxCapacity: data.maxCapacity || 10,
      desiredCapacity: data.desiredCapacity || 3,
      scaleUpThreshold: data.scaleUpThreshold || 80,
      scaleDownThreshold: data.scaleDownThreshold || 30,
      scaleUpCooldown: data.scaleUpCooldown || 300,
      scaleDownCooldown: data.scaleDownCooldown || 300,
      targetCpuUtilization: data.targetCpuUtilization || 70,
      targetMemoryUtilization: data.targetMemoryUtilization || 80,
    };

    const healthCheckConfig: HealthCheckConfig = {
      protocol: data.healthCheckProtocol || 'HTTP',
      port: data.healthCheckPort || 80,
      path: data.healthCheckPath || '/health',
      interval: data.healthCheckInterval || 30,
      timeout: data.healthCheckTimeout || 5,
      healthyThreshold: data.healthyThreshold || 2,
      unhealthyThreshold: data.unhealthyThreshold || 3,
      successCodes: data.successCodes || '200',
    };

    const trafficDistribution: TrafficDistribution = {
      algorithm: data.algorithm || 'round_robin',
      weights: data.weights,
      stickySessions: data.stickySessions !== false,
      sessionTimeout: data.sessionTimeout || 3600,
    };

    const loadBalancerService = new LoadBalancerService(
      loadBalancerConfig,
      autoScalingConfig,
      healthCheckConfig,
      trafficDistribution
    );

    switch (action) {
      case 'create':
        const created = await loadBalancerService.createLoadBalancer();
        return NextResponse.json({ success: created });

      case 'configure-auto-scaling':
        const autoScalingConfigured = await loadBalancerService.configureAutoScaling();
        return NextResponse.json({ success: autoScalingConfigured });

      case 'configure-health-checks':
        const healthChecksConfigured = await loadBalancerService.configureHealthChecks();
        return NextResponse.json({ success: healthChecksConfigured });

      case 'multi-region':
        const { regions } = data;
        if (!regions || !Array.isArray(regions)) {
          return NextResponse.json(
            { error: 'Regions array is required' },
            { status: 400 }
          );
        }
        const multiRegionDeployed = await loadBalancerService.setupMultiRegionDeployment(regions);
        return NextResponse.json({ success: multiRegionDeployed });

      case 'traffic-distribution':
        const trafficConfigured = await loadBalancerService.configureTrafficDistribution();
        return NextResponse.json({ success: trafficConfigured });

      case 'session-persistence':
        const sessionConfigured = await loadBalancerService.configureSessionPersistence();
        return NextResponse.json({ success: sessionConfigured });

      case 'monitoring':
        const monitoringConfigured = await loadBalancerService.setupMonitoring();
        return NextResponse.json({ success: monitoringConfigured });

      case 'security':
        const securityConfigured = await loadBalancerService.configureSecurity();
        return NextResponse.json({ success: securityConfigured });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Load balancer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 