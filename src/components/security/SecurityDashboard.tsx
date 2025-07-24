'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  Users,
  Lock,
  Eye,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  BarChart as RechartsBarChart,
  Bar,
  Area,
  AreaChart,
} from 'recharts';
import { toast } from 'sonner';

// Types
interface SecurityMetrics {
  overallScore: number;
  securityPosture: {
    score: number;
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    keyMetrics: {
      vulnerabilityCount: number;
      complianceScore: number;
      incidentCount: number;
      auditCoverage: number;
    };
  };
  vulnerabilityMetrics: {
    total: number;
    bySeverity: Record<string, number>;
    trends: Array<{
      date: string;
      count: number;
      severity: Record<string, number>;
    }>;
    mttr: number;
    sla_compliance: number;
  };
  complianceMetrics: {
    overallScore: number;
    frameworks: Record<string, {
      score: number;
      status: string;
      violations: number;
    }>;
  };
  incidentMetrics: {
    total: number;
    active: number;
    bySeverity: Record<string, number>;
    mttr: number;
  };
  threatMetrics: {
    activeThreat: number;
    blockedAttacks: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

interface DashboardWidget {
  id: string;
  type: string;
  name: string;
  data: any;
  error?: string;
  lastUpdated: Date;
}

// Color schemes
const COLORS = {
  severity: {
    CRITICAL: '#DC2626',
    HIGH: '#EA580C',
    MEDIUM: '#D97706',
    LOW: '#65A30D',
    INFO: '#2563EB',
  },
  status: {
    COMPLIANT: '#10B981',
    PARTIALLY_COMPLIANT: '#F59E0B',
    NON_COMPLIANT: '#EF4444',
    UNKNOWN: '#6B7280',
  },
  trend: {
    IMPROVING: '#10B981',
    DECLINING: '#EF4444',
    STABLE: '#6B7280',
  },
};

// Main Security Dashboard Component
export function SecurityDashboard() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardType, setDashboardType] = useState('TECHNICAL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setRefreshing(true);

      // Calculate time range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch dashboard configuration
      const dashboardResponse = await fetch('/api/security/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-dashboard',
          dashboardType,
          timeRange: { start: startDate, end: endDate },
        }),
      });

      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await dashboardResponse.json();
      
      if (dashboardData.success) {
        setMetrics(dashboardData.dashboard.metrics);
        setWidgets(dashboardData.dashboard.widgets);
        setLastUpdated(new Date());
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id, timeRange, dashboardType]);

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchDashboardData, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  // Memoized calculations
  const securityScoreColor = useMemo(() => {
    if (!metrics) return '#6B7280';
    const score = metrics.overallScore;
    if (score >= 95) return '#10B981';
    if (score >= 85) return '#65A30D';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  }, [metrics]);

  const vulnerabilityChartData = useMemo(() => {
    if (!metrics?.vulnerabilityMetrics?.bySeverity) return [];
    
    return Object.entries(metrics.vulnerabilityMetrics.bySeverity).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: COLORS.severity[severity as keyof typeof COLORS.severity],
    }));
  }, [metrics]);

  const complianceChartData = useMemo(() => {
    if (!metrics?.complianceMetrics?.frameworks) return [];
    
    return Object.entries(metrics.complianceMetrics.frameworks).map(([framework, data]) => ({
      name: framework.replace(/_/g, ' '),
      score: data.score,
      color: data.score >= 90 ? '#10B981' : data.score >= 70 ? '#F59E0B' : '#EF4444',
    }));
  }, [metrics]);

  const securityTrendData = useMemo(() => {
    if (!metrics?.vulnerabilityMetrics?.trends) return [];
    
    return metrics.vulnerabilityMetrics.trends.map(trend => ({
      date: new Date(trend.date).toLocaleDateString(),
      vulnerabilities: trend.count,
      critical: trend.severity.CRITICAL || 0,
      high: trend.severity.HIGH || 0,
      medium: trend.severity.MEDIUM || 0,
      low: trend.severity.LOW || 0,
    }));
  }, [metrics]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Handle export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/security/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export-dashboard',
          format: 'PDF',
          timeRange,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Dashboard exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time security metrics and compliance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dashboardType} onValueChange={setDashboardType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXECUTIVE">Executive</SelectItem>
              <SelectItem value="TECHNICAL">Technical</SelectItem>
              <SelectItem value="OPERATIONAL">Operational</SelectItem>
              <SelectItem value="COMPLIANCE">Compliance</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live data</span>
          </div>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SecurityScoreCard
          score={metrics?.overallScore || 0}
          trend={metrics?.securityPosture?.trend || 'STABLE'}
          color={securityScoreColor}
        />
        <VulnerabilityCard
          total={metrics?.vulnerabilityMetrics?.total || 0}
          critical={metrics?.vulnerabilityMetrics?.bySeverity?.CRITICAL || 0}
          high={metrics?.vulnerabilityMetrics?.bySeverity?.HIGH || 0}
        />
        <ComplianceCard
          score={metrics?.complianceMetrics?.overallScore || 0}
          frameworks={Object.keys(metrics?.complianceMetrics?.frameworks || {}).length}
        />
        <IncidentCard
          active={metrics?.incidentMetrics?.active || 0}
          total={metrics?.incidentMetrics?.total || 0}
          mttr={metrics?.incidentMetrics?.mttr || 0}
        />
      </div>

      {/* Main Dashboard Widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Vulnerability Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Vulnerability Distribution</span>
            </CardTitle>
            <CardDescription>
              Current vulnerabilities by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={vulnerabilityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vulnerabilityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Compliance Status</span>
            </CardTitle>
            <CardDescription>
              Framework compliance scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={complianceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8884d8">
                    {complianceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Threat Intelligence */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Threat Intelligence</span>
            </CardTitle>
            <CardDescription>
              Current threat landscape
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Threat Level</span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                metrics?.threatMetrics?.threatLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                metrics?.threatMetrics?.threatLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                metrics?.threatMetrics?.threatLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {metrics?.threatMetrics?.threatLevel || 'LOW'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Threats</span>
                <span className="font-mono">{metrics?.threatMetrics?.activeThreat || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Blocked Attacks</span>
                <span className="font-mono">{metrics?.threatMetrics?.blockedAttacks || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LineChart className="h-5 w-5" />
            <span>Security Trends</span>
          </CardTitle>
          <CardDescription>
            Vulnerability trends over time by severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={securityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="critical" 
                  stackId="1" 
                  stroke={COLORS.severity.CRITICAL} 
                  fill={COLORS.severity.CRITICAL}
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="high" 
                  stackId="1" 
                  stroke={COLORS.severity.HIGH} 
                  fill={COLORS.severity.HIGH}
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="medium" 
                  stackId="1" 
                  stroke={COLORS.severity.MEDIUM} 
                  fill={COLORS.severity.MEDIUM}
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="low" 
                  stackId="1" 
                  stroke={COLORS.severity.LOW} 
                  fill={COLORS.severity.LOW}
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity and Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentScansWidget />
        <ActiveIncidentsWidget />
      </div>
    </div>
  );
}

// Security Score Card Component
function SecurityScoreCard({ score, trend, color }: { 
  score: number; 
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE'; 
  color: string; 
}) {
  const TrendIcon = trend === 'IMPROVING' ? TrendingUp : trend === 'DECLINING' ? TrendingDown : Activity;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Security Score</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold" style={{ color }}>
            {score}
          </div>
          <div className="flex items-center space-x-1">
            <TrendIcon className={`h-4 w-4 ${COLORS.trend[trend]}`} style={{ color: COLORS.trend[trend] }} />
            <span className="text-xs text-muted-foreground capitalize">{trend.toLowerCase()}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Overall security posture rating
        </p>
      </CardContent>
    </Card>
  );
}

// Vulnerability Card Component
function VulnerabilityCard({ total, critical, high }: { 
  total: number; 
  critical: number; 
  high: number; 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{total}</div>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>{critical} Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>{high} High</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Compliance Card Component
function ComplianceCard({ score, frameworks }: { 
  score: number; 
  frameworks: number; 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Compliance</CardTitle>
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{score}%</div>
        <p className="text-xs text-muted-foreground">
          {frameworks} frameworks monitored
        </p>
      </CardContent>
    </Card>
  );
}

// Incident Card Component
function IncidentCard({ active, total, mttr }: { 
  active: number; 
  total: number; 
  mttr: number; 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Incidents</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{active}</div>
          <span className="text-sm text-muted-foreground">active</span>
        </div>
        <p className="text-xs text-muted-foreground">
          MTTR: {Math.round(mttr / 60)}h | {total} total
        </p>
      </CardContent>
    </Card>
  );
}

// Recent Scans Widget
function RecentScansWidget() {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    // Fetch recent scans
    const fetchScans = async () => {
      try {
        const response = await fetch('/api/security/testing?action=scans&limit=5');
        if (response.ok) {
          const data = await response.json();
          setScans(data.scans || []);
        }
      } catch (error) {
        console.error('Failed to fetch scans:', error);
      }
    };

    fetchScans();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Recent Security Scans</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent scans available</p>
          ) : (
            scans.map((scan: any, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    scan.status === 'COMPLETED' ? 'bg-green-500' :
                    scan.status === 'RUNNING' ? 'bg-blue-500 animate-pulse' :
                    scan.status === 'FAILED' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium">{scan.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {scan.vulnerabilitiesFound || 0} issues
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Active Incidents Widget
function ActiveIncidentsWidget() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    // Fetch active incidents
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/security/incident?action=incidents&status=ACTIVE&limit=5');
        if (response.ok) {
          const data = await response.json();
          setIncidents(data.incidents || []);
        }
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      }
    };

    fetchIncidents();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Active Incidents</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {incidents.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active incidents</p>
              </div>
            </div>
          ) : (
            incidents.map((incident: any, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    incident.severity === 'CRITICAL' ? 'bg-red-500' :
                    incident.severity === 'HIGH' ? 'bg-orange-500' :
                    incident.severity === 'MEDIUM' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-sm font-medium">{incident.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {incident.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SecurityDashboard; 