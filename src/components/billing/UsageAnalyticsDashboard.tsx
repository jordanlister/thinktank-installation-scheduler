// Think Tank Technologies Installation Scheduler - Usage Analytics Dashboard
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import {
  Card,
  Button,
  Typography,
  Loading
} from '../ui';
import { usageTrackingService } from '../../services/usageTrackingService';
import { stripeService } from '../../services/stripeService';
import {
  UsageMetrics,
  Subscription,
  Invoice,
  SubscriptionPlan,
  UsageWarning
} from '../../types';
import {
  SUBSCRIPTION_PLANS,
  formatPrice,
  getPlanConfig
} from '../../config/subscriptionPlans';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderOpen,
  Wrench,
  DollarSign,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react';

interface UsageAnalyticsDashboardProps {
  organizationId: string;
  className?: string;
}

interface AnalyticsData {
  usageMetrics: UsageMetrics | null;
  subscription: Subscription | null;
  invoices: Invoice[];
  usageHistory: Array<{
    date: string;
    metric: string;
    value: number;
  }>;
  warnings: UsageWarning[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  color,
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    purple: 'text-purple-500'
  };

  return (
    <Card 
      className={`p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : null}
            <Typography variant="body2" className={`${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trendValue}
            </Typography>
          </div>
        )}
      </div>
      <div>
        <Typography variant="h3" className="text-2xl font-bold mb-1">
          {value}
        </Typography>
        <Typography variant="body1" className="font-medium text-gray-900 mb-1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" className="text-gray-600">
            {subtitle}
          </Typography>
        )}
      </div>
    </Card>
  );
};

export const UsageAnalyticsDashboard: React.FC<UsageAnalyticsDashboardProps> = ({
  organizationId,
  className = ''
}) => {
  const [data, setData] = useState<AnalyticsData>({
    usageMetrics: null,
    subscription: null,
    invoices: [],
    usageHistory: [],
    warnings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics data
  const loadData = async (showRefreshingState = false) => {
    if (showRefreshingState) setRefreshing(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on selected range
      switch (selectedTimeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const [
        usageMetrics,
        subscription,
        invoices,
        usageHistory,
        warnings
      ] = await Promise.all([
        usageTrackingService.getUsageMetrics(organizationId, true),
        stripeService.getSubscription(organizationId),
        stripeService.getInvoices(organizationId, 12),
        usageTrackingService.getUsageHistory(organizationId, startDate, endDate),
        usageTrackingService.getUsageWarnings(organizationId)
      ]);

      setData({
        usageMetrics,
        subscription,
        invoices,
        usageHistory,
        warnings
      });
      setError(null);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId, selectedTimeRange]);

  // Process usage history data for charts
  const processedUsageData = useMemo(() => {
    if (!data.usageHistory.length) return [];

    const groupedData = data.usageHistory.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date };
      }
      
      // Map metric names to chart-friendly names
      const metricMapping: Record<string, string> = {
        'resource_projects': 'Projects',
        'resource_teamMembers': 'Team Members',
        'resource_installations': 'Installations',
        'feature_analytics': 'Analytics Usage',
        'feature_advancedReporting': 'Advanced Reports'
      };
      
      const metricName = metricMapping[item.metric] || item.metric;
      acc[date][metricName] = item.value;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data.usageHistory]);

  // Calculate usage percentages for pie chart
  const usageBreakdown = useMemo(() => {
    if (!data.usageMetrics) return [];

    const { projects, teamMembers, installations } = data.usageMetrics;
    
    return [
      {
        name: 'Projects',
        value: projects.current,
        limit: projects.limit === -1 ? 'Unlimited' : projects.limit,
        color: '#3b82f6'
      },
      {
        name: 'Team Members',
        value: teamMembers.current,
        limit: teamMembers.limit === -1 ? 'Unlimited' : teamMembers.limit,
        color: '#10b981'
      },
      {
        name: 'Installations',
        value: installations.current,
        limit: installations.limit === -1 ? 'Unlimited' : installations.limit,
        color: '#f59e0b'
      }
    ].filter(item => item.value > 0);
  }, [data.usageMetrics]);

  // Calculate billing metrics
  const billingMetrics = useMemo(() => {
    if (!data.invoices.length) {
      return {
        totalSpent: 0,
        averageMonthly: 0,
        lastPayment: 0,
        paymentTrend: 'stable' as const
      };
    }

    const paidInvoices = data.invoices.filter(inv => inv.status === 'paid');
    const totalSpent = paidInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const averageMonthly = totalSpent / Math.max(paidInvoices.length, 1);
    const lastPayment = paidInvoices[0]?.amountPaid || 0;
    
    // Simple trend calculation based on last two payments
    let paymentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (paidInvoices.length >= 2) {
      const current = paidInvoices[0].amountPaid;
      const previous = paidInvoices[1].amountPaid;
      paymentTrend = current > previous ? 'up' : current < previous ? 'down' : 'stable';
    }

    return {
      totalSpent,
      averageMonthly,
      lastPayment,
      paymentTrend
    };
  }, [data.invoices]);

  // Export analytics data
  const exportData = async (format: 'csv' | 'json') => {
    try {
      const exportData = {
        organizationId,
        exportDate: new Date().toISOString(),
        subscription: data.subscription,
        usageMetrics: data.usageMetrics,
        usageHistory: data.usageHistory,
        warnings: data.warnings,
        billingMetrics
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${organizationId}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Convert to CSV format
        const csvContent = [
          ['Date', 'Metric', 'Value'],
          ...data.usageHistory.map(item => [item.date, item.metric, item.value.toString()])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3 p-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <Typography variant="h3" className="text-red-800 font-semibold">
                Failed to Load Analytics
              </Typography>
              <Typography variant="body2" className="text-red-700 mt-1">
                {error}
              </Typography>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData()}
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { usageMetrics, subscription } = data;
  const currentPlan = subscription ? getPlanConfig(subscription.planId) : SUBSCRIPTION_PLANS.free;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Typography variant="h2" className="text-2xl font-bold">
            Usage Analytics
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            Monitor your subscription usage and billing trends
          </Typography>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-white border rounded-lg">
            {[
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: '1y', label: '1Y' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeRange(option.value as any)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  selectedTimeRange === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Export Button */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => exportData('csv')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
              >
                Export as CSV
              </button>
              <button
                onClick={() => exportData('json')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Warnings */}
      {data.warnings.length > 0 && (
        <div className="space-y-3">
          {data.warnings.map((warning, index) => (
            <Card
              key={index}
              className={`border-l-4 ${
                warning.severity === 'critical'
                  ? 'border-l-red-500 bg-red-50'
                  : 'border-l-yellow-500 bg-yellow-50'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    warning.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}
                />
                <div className="flex-1">
                  <Typography variant="body1" className="font-medium">
                    {warning.message}
                  </Typography>
                  {warning.suggestedAction && (
                    <Typography variant="body2" className="text-gray-600 mt-1">
                      {warning.suggestedAction}
                    </Typography>
                  )}
                </div>
                {warning.actionRequired && (
                  <Button size="sm" variant="primary">
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Projects"
          value={usageMetrics ? `${usageMetrics.projects.current}/${usageMetrics.projects.limit === -1 ? '∞' : usageMetrics.projects.limit}` : 'N/A'}
          subtitle={`${Math.round(usageMetrics?.projects.percentage || 0)}% used`}
          icon={FolderOpen}
          color={usageMetrics && usageMetrics.projects.percentage > 80 ? 'red' : 'blue'}
        />
        
        <MetricCard
          title="Team Members"
          value={usageMetrics ? `${usageMetrics.teamMembers.current}/${usageMetrics.teamMembers.limit === -1 ? '∞' : usageMetrics.teamMembers.limit}` : 'N/A'}
          subtitle={`${Math.round(usageMetrics?.teamMembers.percentage || 0)}% used`}
          icon={Users}
          color={usageMetrics && usageMetrics.teamMembers.percentage > 80 ? 'red' : 'green'}
        />
        
        <MetricCard
          title="Monthly Installations"
          value={usageMetrics ? `${usageMetrics.installations.current}/${usageMetrics.installations.limit === -1 ? '∞' : usageMetrics.installations.limit}` : 'N/A'}
          subtitle={`${Math.round(usageMetrics?.installations.percentage || 0)}% used`}
          icon={Wrench}
          color={usageMetrics && usageMetrics.installations.percentage > 80 ? 'red' : 'yellow'}
        />
        
        <MetricCard
          title="Monthly Spending"
          value={formatPrice(billingMetrics.lastPayment)}
          subtitle={`Avg: ${formatPrice(billingMetrics.averageMonthly)}`}
          trend={billingMetrics.paymentTrend}
          trendValue={billingMetrics.paymentTrend !== 'stable' ? '12%' : undefined}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends Chart */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" className="font-semibold">
                  Usage Trends
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Resource usage over time
                </Typography>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {processedUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={processedUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Projects"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="Team Members"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="Installations"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <Typography variant="body1">No usage data available</Typography>
                  <Typography variant="body2">Data will appear as you use the platform</Typography>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Usage Distribution Chart */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" className="font-semibold">
                  Usage Distribution
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Current resource allocation
                </Typography>
              </div>
              <PieChartIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {usageBreakdown.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={usageBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {usageBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {usageBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <Typography variant="body2" className="font-medium">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          {item.value} / {item.limit}
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <Typography variant="body1">No usage data available</Typography>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Billing History Chart */}
      {data.invoices.length > 0 && (
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" className="font-semibold">
                  Billing History
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Monthly spending and payment trends
                </Typography>
              </div>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={data.invoices
                  .filter(inv => inv.status === 'paid')
                  .reverse()
                  .map(inv => ({
                    date: new Date(inv.periodStart).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    }),
                    amount: inv.amountPaid / 100,
                    status: inv.status
                  }))
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Subscription Details */}
      <Card>
        <div className="p-6 border-b">
          <Typography variant="h3" className="font-semibold">
            Subscription Details
          </Typography>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                Current Plan
              </Typography>
              <Typography variant="body1" className="font-semibold">
                {currentPlan.name}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                {formatPrice(subscription?.amountCents || 0)} / {subscription?.billingCycle || 'month'}
              </Typography>
            </div>
            
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                Status
              </Typography>
              <Typography variant="body1" className="font-semibold capitalize">
                {subscription?.status.replace('_', ' ') || 'Free'}
              </Typography>
              {subscription?.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                <Typography variant="body2" className="text-blue-600">
                  Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
                </Typography>
              )}
            </div>
            
            <div>
              <Typography variant="body2" className="text-gray-600 mb-1">
                Next Billing
              </Typography>
              <Typography variant="body1" className="font-semibold">
                {subscription?.nextBillingDate 
                  ? new Date(subscription.nextBillingDate).toLocaleDateString()
                  : 'N/A'
                }
              </Typography>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UsageAnalyticsDashboard;