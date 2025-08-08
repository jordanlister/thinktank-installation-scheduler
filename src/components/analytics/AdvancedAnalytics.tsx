// Think Tank Technologies Installation Scheduler - Advanced Analytics Dashboard
// Comprehensive analytics with predictive insights and interactive visualizations

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { 
  Calendar, 
  Users, 
  MapPin, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Maximize2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format, subDays, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { useRealtime } from '../../contexts/RealtimeProvider';
import { 
  Installation, 
  Assignment, 
  TeamMember, 
  Priority,
  InstallationStatus,
  AssignmentConflict,
  DateRange,
} from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Analytics interfaces
export interface AnalyticsFilters {
  dateRange: DateRange;
  regions: string[];
  teamMembers: string[];
  priorities: Priority[];
  statuses: InstallationStatus[];
}

export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'currency' | 'percentage' | 'time';
  icon: React.ElementType;
  color: string;
}

export interface ChartConfiguration {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'doughnut' | 'scatter' | 'area';
  data: any;
  options: any;
  size: 'small' | 'medium' | 'large' | 'full';
  refreshInterval?: number;
}

// Main Advanced Analytics Component
export function AdvancedAnalytics({ className = '' }: { className?: string }) {
  const { state } = useRealtime();
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
    },
    regions: [],
    teamMembers: [],
    priorities: [],
    statuses: [],
  });
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'forecasting' | 'custom'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Computed analytics data
  const analyticsData = useMemo(() => {
    const installations = Array.from(state.installations.values());
    const assignments = Array.from(state.assignments.values());
    const teamMembers = Array.from(state.teamMembers.values());
    const conflicts = Array.from(state.conflicts.values());

    return computeAnalytics(installations, assignments, teamMembers, conflicts, filters);
  }, [state, filters]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setIsLoading(true);
      // Simulate data refresh
      setTimeout(() => setIsLoading(false), 1000);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleFilterChange = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const exportData = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      console.log(`Exporting analytics data in ${format} format...`);
      // Export functionality would be implemented here
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and predictive analysis</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>Auto Refresh</span>
          </button>
          
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => exportData('pdf')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AnalyticsFilters 
        filters={filters} 
        onChange={handleFilterChange} 
        availableRegions={getAvailableRegions(Array.from(state.installations.values()))}
        availableTeamMembers={Array.from(state.teamMembers.values())}
      />

      {/* View Selector */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'forecasting', label: 'Forecasting', icon: LineChart },
          { id: 'custom', label: 'Custom', icon: PieChart },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedView(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <OverviewDashboard data={analyticsData} isLoading={isLoading} />
      )}
      {selectedView === 'performance' && (
        <PerformanceDashboard data={analyticsData} isLoading={isLoading} />
      )}
      {selectedView === 'forecasting' && (
        <ForecastingDashboard data={analyticsData} isLoading={isLoading} />
      )}
      {selectedView === 'custom' && (
        <CustomDashboard data={analyticsData} isLoading={isLoading} />
      )}
    </div>
  );
}

// Analytics Filters Component
function AnalyticsFilters({ 
  filters, 
  onChange, 
  availableRegions,
  availableTeamMembers,
}: {
  filters: AnalyticsFilters;
  onChange: (filters: Partial<AnalyticsFilters>) => void;
  availableRegions: string[];
  availableTeamMembers: TeamMember[];
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => onChange({ 
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => onChange({ 
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>More Filters</span>
        </button>
      </div>

      {showFilters && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Regions</label>
              <select
                multiple
                value={filters.regions}
                onChange={(e) => onChange({ 
                  regions: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={4}
              >
                <option value="">All Regions</option>
                {availableRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Team Member Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
              <select
                multiple
                value={filters.teamMembers}
                onChange={(e) => onChange({ 
                  teamMembers: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={4}
              >
                <option value="">All Team Members</option>
                {availableTeamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorities</label>
              <div className="space-y-2">
                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(priority => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={(e) => {
                        const newPriorities = e.target.checked
                          ? [...filters.priorities, priority]
                          : filters.priorities.filter(p => p !== priority);
                        onChange({ priorities: newPriorities });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Overview Dashboard
function OverviewDashboard({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPIGrid metrics={data.kpis} />
      
      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Installation Trends"
          chart={data.charts.installationTrends}
          size="medium"
        />
        <ChartWidget
          title="Team Performance"
          chart={data.charts.teamPerformance}
          size="medium"
        />
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartWidget
          title="Status Distribution"
          chart={data.charts.statusDistribution}
          size="small"
        />
        <ChartWidget
          title="Priority Breakdown"
          chart={data.charts.priorityBreakdown}
          size="small"
        />
        <ChartWidget
          title="Regional Activity"
          chart={data.charts.regionalActivity}
          size="small"
        />
      </div>
    </div>
  );
}

// Performance Dashboard
function PerformanceDashboard({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Efficiency Over Time"
          chart={data.charts.efficiencyTrends}
          size="medium"
        />
        <ChartWidget
          title="Utilization Rates"
          chart={data.charts.utilizationRates}
          size="medium"
        />
      </div>

      {/* Detailed Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartWidget
          title="Completion Times"
          chart={data.charts.completionTimes}
          size="small"
        />
        <ChartWidget
          title="Travel Efficiency"
          chart={data.charts.travelEfficiency}
          size="small"
        />
        <ChartWidget
          title="Customer Satisfaction"
          chart={data.charts.customerSatisfaction}
          size="small"
        />
      </div>
    </div>
  );
}

// Forecasting Dashboard
function ForecastingDashboard({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Forecasting Charts */}
      <div className="grid grid-cols-1 gap-6">
        <ChartWidget
          title="Demand Forecasting"
          chart={data.charts.demandForecast}
          size="large"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Capacity Planning"
          chart={data.charts.capacityPlanning}
          size="medium"
        />
        <ChartWidget
          title="Resource Allocation Prediction"
          chart={data.charts.resourceAllocation}
          size="medium"
        />
      </div>
    </div>
  );
}

// Custom Dashboard
function CustomDashboard({ data, isLoading }: { data: any; isLoading: boolean }) {
  const [customCharts, setCustomCharts] = useState<ChartConfiguration[]>([]);

  if (isLoading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Dashboard Builder</h3>
        <p className="text-gray-600">Drag and drop widgets to create your custom analytics dashboard.</p>
        {/* Custom dashboard builder would go here */}
      </div>
    </div>
  );
}

// KPI Grid Component
function KPIGrid({ metrics }: { metrics: KPIMetric[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <KPICard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

// KPI Card Component
function KPICard({ metric }: { metric: KPIMetric }) {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'time':
        return `${value}h`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${metric.color}`}>
            <metric.icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-medium text-white/80">{metric.label}</h3>
          </div>
          {getTrendIcon()}
        </div>
        
        <div className="mb-2">
          <p className="text-2xl font-bold text-white">
            {formatValue(metric.value, metric.format)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <span className={getTrendColor()}>
            {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
          </span>
          <span className="text-white/60">vs previous period</span>
        </div>
      </div>
    </div>
  );
}

// Chart Widget Component
function ChartWidget({ 
  title, 
  chart, 
  size,
  onMaximize 
}: { 
  title: string; 
  chart: any;
  size: 'small' | 'medium' | 'large' | 'full';
  onMaximize?: () => void;
}) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'h-64';
      case 'medium': return 'h-80';
      case 'large': return 'h-96';
      case 'full': return 'h-screen';
      default: return 'h-80';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onMaximize && (
          <button
            onClick={onMaximize}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className={getSizeClasses()}>
        {chart.type === 'line' && <Line data={chart.data} options={chart.options} />}
        {chart.type === 'bar' && <Bar data={chart.data} options={chart.options} />}
        {chart.type === 'doughnut' && <Doughnut data={chart.data} options={chart.options} />}
        {chart.type === 'scatter' && <Scatter data={chart.data} options={chart.options} />}
      </div>
    </div>
  );
}

// Utility functions
function computeAnalytics(
  installations: Installation[], 
  assignments: Assignment[], 
  teamMembers: TeamMember[], 
  conflicts: AssignmentConflict[],
  filters: AnalyticsFilters
): any {
  // This would contain the actual analytics computation logic
  // For now, returning mock data structure
  
  const kpis: KPIMetric[] = [
    {
      id: 'total-installations',
      label: 'Total Installations',
      value: installations.length,
      previousValue: installations.length - 10,
      change: 10,
      changePercentage: 5.2,
      trend: 'up',
      format: 'number',
      icon: MapPin,
      color: 'bg-blue-500',
    },
    {
      id: 'active-assignments',
      label: 'Active Assignments',
      value: assignments.length,
      previousValue: assignments.length - 5,
      change: 5,
      changePercentage: 3.1,
      trend: 'up',
      format: 'number',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      id: 'team-utilization',
      label: 'Team Utilization',
      value: 78,
      previousValue: 75,
      change: 3,
      changePercentage: 4.0,
      trend: 'up',
      format: 'percentage',
      icon: Users,
      color: 'bg-yellow-500',
    },
    {
      id: 'active-conflicts',
      label: 'Active Conflicts',
      value: conflicts.length,
      previousValue: conflicts.length + 3,
      change: -3,
      changePercentage: -15.0,
      trend: 'down',
      format: 'number',
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  // Mock chart data
  const charts = {
    installationTrends: {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Installations',
          data: [65, 59, 80, 81, 56, 55],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    },
    teamPerformance: {
      type: 'bar',
      data: {
        labels: teamMembers.slice(0, 6).map(m => `${m.firstName} ${m.lastName}`),
        datasets: [{
          label: 'Assignments Completed',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    },
    statusDistribution: {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Pending', 'Cancelled'],
        datasets: [{
          data: [65, 25, 8, 2],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    },
    priorityBreakdown: {
      type: 'doughnut',
      data: {
        labels: ['Low', 'Medium', 'High', 'Urgent'],
        datasets: [{
          data: [30, 45, 20, 5],
          backgroundColor: [
            'rgba(107, 114, 128, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    },
    regionalActivity: {
      type: 'bar',
      data: {
        labels: ['North', 'South', 'East', 'West', 'Central'],
        datasets: [{
          label: 'Installations',
          data: [25, 18, 30, 22, 15],
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    },
    // Additional charts for other views would go here...
    efficiencyTrends: { type: 'line', data: {}, options: {} },
    utilizationRates: { type: 'bar', data: {}, options: {} },
    demandForecast: { type: 'line', data: {}, options: {} },
    capacityPlanning: { type: 'bar', data: {}, options: {} },
    resourceAllocation: { type: 'doughnut', data: {}, options: {} },
    completionTimes: { type: 'bar', data: {}, options: {} },
    travelEfficiency: { type: 'line', data: {}, options: {} },
    customerSatisfaction: { type: 'bar', data: {}, options: {} },
  };

  return { kpis, charts };
}

function getAvailableRegions(installations: Installation[]): string[] {
  const regions = new Set<string>();
  installations.forEach(installation => {
    if (installation.address?.state) {
      regions.add(installation.address.state);
    }
  });
  return Array.from(regions).sort();
}

export default AdvancedAnalytics;