// Think Tank Technologies Installation Scheduler - Billing Security Dashboard
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Select,
  SelectItem,
  Badge
} from '../ui';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Users,
  Globe,
  Zap,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { billingSecurityService } from '../../services/billingSecurityService';
import { supabase } from '../../services/supabase';

interface SecurityMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  securityEvents: number;
  rateLimitViolations: number;
  webhookVerifications: number;
  webhookVerificationFailures: number;
  uniqueIps: number;
  uniqueUserAgents: number;
  uniqueOrganizations: number;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  userId?: string;
  actionTaken?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  success: boolean;
  errorMessage?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  userId?: string;
  createdAt: string;
}

interface RateLimitViolation {
  id: string;
  operation: string;
  limitKey: string;
  requestCount: number;
  limitExceeded: number;
  windowDurationMs: number;
  ipAddress?: string;
  endpoint?: string;
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const BillingSecurityDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'audits' | 'violations'>('overview');
  
  // Data states
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rateLimitViolations, setRateLimitViolations] = useState<RateLimitViolation[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSecurityMetrics(),
        loadSecurityEvents(),
        loadAuditLogs(),
        loadRateLimitViolations(),
        loadMetricsHistory()
      ]);
    } catch (error) {
      console.error('Error loading security dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityMetrics = async () => {
    try {
      const startDate = getStartDate(timeRange);
      const { data, error } = await supabase
        .from('billing_security_metrics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setMetrics(data[0]);
      }
    } catch (error) {
      console.error('Error loading security metrics:', error);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const startDate = getStartDate(timeRange);
      const { data, error } = await supabase
        .from('billing_security_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Error loading security events:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const startDate = getStartDate(timeRange);
      const { data, error } = await supabase
        .from('billing_audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadRateLimitViolations = async () => {
    try {
      const startDate = getStartDate(timeRange);
      const { data, error } = await supabase
        .from('billing_rate_limit_violations')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRateLimitViolations(data || []);
    } catch (error) {
      console.error('Error loading rate limit violations:', error);
    }
  };

  const loadMetricsHistory = async () => {
    try {
      const startDate = getStartDate(timeRange);
      const { data, error } = await supabase
        .from('billing_security_metrics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;
      setMetricsHistory(data || []);
    } catch (error) {
      console.error('Error loading metrics history:', error);
    }
  };

  const getStartDate = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportData = async (type: 'events' | 'audits' | 'violations') => {
    try {
      let data: any[] = [];
      let filename = '';
      
      switch (type) {
        case 'events':
          data = securityEvents;
          filename = `security-events-${timeRange}.json`;
          break;
        case 'audits':
          data = auditLogs;
          filename = `audit-logs-${timeRange}.json`;
          break;
        case 'violations':
          data = rateLimitViolations;
          filename = `rate-limit-violations-${timeRange}.json`;
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <Typography>Loading security dashboard...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h1" className="text-2xl font-bold">
            Billing Security Dashboard
          </Typography>
          <Typography variant="body2" className="text-gray-600 mt-1">
            Monitor security events, audit logs, and system performance
          </Typography>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </Select>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="text-gray-600">Total Operations</Typography>
                <Typography variant="h2" className="text-2xl font-bold mt-1">
                  {metrics.totalOperations.toLocaleString()}
                </Typography>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 space-x-2">
              <Typography variant="body2" className="text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {((metrics.successfulOperations / metrics.totalOperations) * 100).toFixed(1)}% Success
              </Typography>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="text-gray-600">Security Events</Typography>
                <Typography variant="h2" className="text-2xl font-bold mt-1">
                  {metrics.securityEvents.toLocaleString()}
                </Typography>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 space-x-2">
              <Typography variant="body2" className="text-orange-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {metrics.rateLimitViolations} Rate Limits
              </Typography>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="text-gray-600">Webhook Verifications</Typography>
                <Typography variant="h2" className="text-2xl font-bold mt-1">
                  {metrics.webhookVerifications.toLocaleString()}
                </Typography>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 space-x-2">
              <Typography variant="body2" className="text-red-600 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                {metrics.webhookVerificationFailures} Failures
              </Typography>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="text-gray-600">Unique IPs</Typography>
                <Typography variant="h2" className="text-2xl font-bold mt-1">
                  {metrics.uniqueIps.toLocaleString()}
                </Typography>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 space-x-2">
              <Typography variant="body2" className="text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {metrics.uniqueOrganizations} Organizations
              </Typography>
            </div>
          </Card>
        </div>
      )}

      {/* Metrics Charts */}
      {metricsHistory.length > 0 && (
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            Security Trends
          </Typography>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_operations" stroke="#8884d8" name="Total Operations" />
                <Line type="monotone" dataKey="security_events" stroke="#ff8042" name="Security Events" />
                <Line type="monotone" dataKey="rate_limit_violations" stroke="#ffbb28" name="Rate Limit Violations" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: Eye },
            { key: 'events', label: 'Security Events', icon: Shield },
            { key: 'audits', label: 'Audit Logs', icon: Activity },
            { key: 'violations', label: 'Rate Limits', icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Types Distribution */}
            <Card className="p-6">
              <Typography variant="h3" className="text-lg font-semibold mb-4">
                Event Types Distribution
              </Typography>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        securityEvents.reduce((acc, event) => {
                          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(
                        securityEvents.reduce((acc, event) => {
                          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h3" className="text-lg font-semibold">
                  Recent Activity
                </Typography>
                <Button
                  onClick={() => exportData('events')}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {securityEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="body2" className="font-medium">
                        {event.eventType.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 text-sm">
                        {event.description}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500 text-xs">
                        {formatDate(event.createdAt)}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'events' && (
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <Typography variant="h3" className="text-lg font-semibold">
                  Security Events
                </Typography>
                <Button
                  onClick={() => exportData('events')}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Events</span>
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {securityEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <Typography variant="body2" className="font-medium">
                            {event.eventType.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600 text-sm">
                            {event.description}
                          </Typography>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="font-mono text-sm">
                          {event.ipAddress || 'N/A'}
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="text-sm">
                          {event.actionTaken || 'None'}
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="text-sm">
                          {formatDate(event.createdAt)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'audits' && (
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <Typography variant="h3" className="text-lg font-semibold">
                  Audit Logs
                </Typography>
                <Button
                  onClick={() => exportData('audits')}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Logs</span>
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="font-medium">
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2">
                          {log.resource}
                          {log.resourceId && (
                            <span className="text-gray-500 text-xs block font-mono">
                              {log.resourceId}
                            </span>
                          )}
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        {log.success ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Success
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Failed
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="font-mono text-sm">
                          {log.ipAddress || 'N/A'}
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="text-sm">
                          {formatDate(log.createdAt)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'violations' && (
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <Typography variant="h3" className="text-lg font-semibold">
                  Rate Limit Violations
                </Typography>
                <Button
                  onClick={() => exportData('violations')}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Violations</span>
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requests / Limit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rateLimitViolations.map((violation) => (
                    <tr key={violation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          {violation.operation.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="font-medium">
                          {violation.requestCount} / {violation.limitExceeded}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 text-sm">
                          {Math.round(violation.windowDurationMs / 1000)}s window
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="font-mono text-sm">
                          {violation.ipAddress || 'N/A'}
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="text-sm">
                          {violation.endpoint || 'N/A'}
                        </Typography>
                      </td>
                      <td className="px-6 py-4">
                        <Typography variant="body2" className="text-sm">
                          {formatDate(violation.createdAt)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BillingSecurityDashboard;