// Think Tank Technologies - Analytics Dashboard
// Comprehensive organization and project analytics with KPIs and reporting

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useOrganization } from '../../contexts/OrganizationProvider';
import { useProject } from '../../contexts/ProjectProvider';
import { supabase } from '../../services/supabase';
import type {
  OrganizationAnalytics,
  ProjectMetrics,
  MemberActivity,
  UsageMetrics,
  AnalyticsTrend
} from '../../types';

// Props
interface AnalyticsDashboardProps {
  className?: string;
  level?: 'organization' | 'project';
}

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}> = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  trend = 'stable',
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  const trendIcon = {
    up: (
      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l6-6 6 6" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-6 6-6-6" />
      </svg>
    ),
    stable: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
      </svg>
    )
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && (
              <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                {trendIcon[trend]}
                <span className={`text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-gray-500">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Simple Chart Component (placeholder for chart library)
const SimpleChart: React.FC<{
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: any[];
  title?: string;
  height?: number;
}> = ({ type, data, title, height = 300 }) => {
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div className="font-medium">{title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`}</div>
          <div className="text-sm mt-1">{data.length} data points</div>
          <div className="text-xs mt-2 text-gray-400">Chart visualization placeholder</div>
        </div>
      </div>
    </div>
  );
};

// Team Performance Component
const TeamPerformance: React.FC<{
  memberActivity: MemberActivity[];
}> = ({ memberActivity }) => {
  const topPerformers = memberActivity
    .sort((a, b) => b.installationsCompleted - a.installationsCompleted)
    .slice(0, 5);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
      
      <div className="space-y-4">
        {topPerformers.map((member, index) => (
          <div key={member.userId} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                <div className="text-xs text-gray-500 capitalize">{member.role}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {member.installationsCompleted} completed
              </div>
              <div className="text-xs text-gray-500">
                {member.averageRating.toFixed(1)}⭐ rating
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Project Performance Component
const ProjectPerformance: React.FC<{
  projectMetrics: ProjectMetrics[];
}> = ({ projectMetrics }) => {
  const [sortBy, setSortBy] = useState<'installations' | 'completion' | 'satisfaction'>('installations');

  const sortedProjects = [...projectMetrics].sort((a, b) => {
    switch (sortBy) {
      case 'installations':
        return b.totalInstallations - a.totalInstallations;
      case 'completion':
        return b.averageCompletionTime - a.averageCompletionTime;
      case 'satisfaction':
        return b.customerSatisfaction - a.customerSatisfaction;
      default:
        return 0;
    }
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Project Performance</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1"
        >
          <option value="installations">By Installations</option>
          <option value="completion">By Completion Rate</option>
          <option value="satisfaction">By Satisfaction</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedProjects.map((project) => (
          <div key={project.projectId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{project.projectName}</h4>
              <span className="text-sm text-gray-500">
                {((project.completedInstallations / project.totalInstallations) * 100).toFixed(1)}% complete
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Installations</div>
                <div className="font-medium">{project.totalInstallations}</div>
              </div>
              <div>
                <div className="text-gray-500">Avg. Time</div>
                <div className="font-medium">{project.averageCompletionTime}h</div>
              </div>
              <div>
                <div className="text-gray-500">Satisfaction</div>
                <div className="font-medium">{project.customerSatisfaction.toFixed(1)}/5.0</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(project.completedInstallations / project.totalInstallations) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Usage Metrics Component
const UsageMetricsCard: React.FC<{
  usageMetrics: UsageMetrics;
}> = ({ usageMetrics }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{usageMetrics.storageUsed}GB</div>
          <div className="text-sm text-gray-500">Storage Used</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{usageMetrics.apiCallsUsed.toLocaleString()}</div>
          <div className="text-sm text-gray-500">API Calls</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{usageMetrics.activeIntegrations}</div>
          <div className="text-sm text-gray-500">Integrations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{usageMetrics.dataExports}</div>
          <div className="text-sm text-gray-500">Data Exports</div>
        </div>
      </div>
    </Card>
  );
};

// Recent Activities Component
const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const { organization } = useOrganization();

  useEffect(() => {
    const loadRecentActivities = async () => {
      if (!organization) return;

      try {
        const { data, error } = await supabase
          .from('organization_activities')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setActivities(data);
        }
      } catch (error) {
        console.error('Error loading recent activities:', error);
      }
    };

    loadRecentActivities();
  }, [organization]);

  const getActivityIcon = (activityType: string) => {
    const icons: Record<string, string> = {
      installation_created: '📅',
      installation_assigned: '👤',
      installation_completed: '✅',
      user_invited: '✉️',
      user_joined: '👋',
      project_created: '🚀',
      settings_changed: '⚙️'
    };
    return icons[activityType] || '📝';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="text-4xl mb-2">🔍</div>
            <div>No recent activities</div>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="text-lg">{getActivityIcon(activity.activity_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {activity.description}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

// Trends Chart Component
const TrendsChart: React.FC<{
  trends: AnalyticsTrend[];
  title: string;
}> = ({ trends, title }) => {
  const [selectedMetric, setSelectedMetric] = useState('installations');

  const metrics = [...new Set(trends.map(t => t.metric))];
  const filteredTrends = trends.filter(t => t.metric === selectedMetric);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1"
        >
          {metrics.map(metric => (
            <option key={metric} value={metric}>
              {metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <SimpleChart
        type="line"
        data={filteredTrends}
        title={`${selectedMetric.replace('_', ' ')} Trend`}
        height={250}
      />
    </Card>
  );
};

// Export Controls Component
const ExportControls: React.FC<{
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
}> = ({ onExport }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Export Analytics</h3>
          <p className="text-xs text-gray-500">Download your analytics data</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onExport('pdf')}
          >
            PDF
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onExport('excel')}
          >
            Excel
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onExport('csv')}
          >
            CSV
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Main Analytics Dashboard Component
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  className = '', 
  level = 'organization' 
}) => {
  const { organization } = useOrganization();
  const { project } = useProject();
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!organization || (level === 'project' && !project)) return;

    try {
      setIsLoading(true);

      // Generate mock analytics data
      const mockAnalytics: OrganizationAnalytics = {
        period: dateRange,
        overview: {
          totalProjects: 5,
          activeProjects: 4,
          totalMembers: 12,
          activeMembers: 10,
          totalInstallations: 245,
          completedInstallations: 198,
          averageProjectCompletion: 81,
          customerSatisfactionScore: 4.2
        },
        projectMetrics: [
          {
            projectId: '1',
            projectName: 'Main Installation Project',
            totalInstallations: 150,
            completedInstallations: 128,
            averageCompletionTime: 4.2,
            teamUtilization: 85,
            customerSatisfaction: 4.5,
            revenue: 75000
          },
          {
            projectId: '2', 
            projectName: 'Commercial Installations',
            totalInstallations: 95,
            completedInstallations: 70,
            averageCompletionTime: 6.1,
            teamUtilization: 78,
            customerSatisfaction: 4.0,
            revenue: 95000
          }
        ],
        memberActivity: [
          {
            userId: '1',
            name: 'John Smith',
            role: 'admin',
            projectsAssigned: 2,
            installationsCompleted: 45,
            averageRating: 4.8,
            lastActive: '2024-01-15T10:30:00Z',
            utilizationRate: 92
          },
          {
            userId: '2',
            name: 'Sarah Johnson',
            role: 'manager',
            projectsAssigned: 1,
            installationsCompleted: 38,
            averageRating: 4.6,
            lastActive: '2024-01-15T14:20:00Z',
            utilizationRate: 88
          }
        ],
        usageMetrics: {
          storageUsed: 2.4,
          apiCallsUsed: 15420,
          activeIntegrations: 3,
          dataExports: 12,
          reportGenerations: 25
        },
        trends: [
          {
            date: '2024-01-01',
            metric: 'installations',
            value: 45,
            change: 5,
            changePercent: 12.5
          },
          {
            date: '2024-01-08',
            metric: 'installations',
            value: 52,
            change: 7,
            changePercent: 15.6
          },
          {
            date: '2024-01-15',
            metric: 'installations',
            value: 48,
            change: -4,
            changePercent: -7.7
          }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organization, project, level, dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting analytics as ${format}`);
  };

  if (!organization || (level === 'project' && !project)) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">
          {level === 'project' ? 'No project selected' : 'No organization loaded'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {level === 'organization' ? 'Organization Analytics' : 'Project Analytics'}
          </h1>
          <p className="text-gray-600 mt-1">
            {level === 'organization' ? organization.name : project?.name}
          </p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={loadAnalytics}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Projects"
          value={analytics.overview.totalProjects}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          color="blue"
        />
        
        <KPICard
          title="Team Members"
          value={analytics.overview.totalMembers}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="green"
        />
        
        <KPICard
          title="Total Installations"
          value={analytics.overview.totalInstallations}
          change={15.2}
          changeLabel="vs last month"
          trend="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="purple"
        />
        
        <KPICard
          title="Completion Rate"
          value={`${analytics.overview.averageProjectCompletion}%`}
          change={3.1}
          changeLabel="vs last month"
          trend="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendsChart
          trends={analytics.trends}
          title="Performance Trends"
        />
        
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Completion Status</h3>
          <SimpleChart
            type="doughnut"
            data={[
              { label: 'Completed', value: analytics.overview.completedInstallations },
              { label: 'Pending', value: analytics.overview.totalInstallations - analytics.overview.completedInstallations }
            ]}
            height={250}
          />
        </Card>
      </div>

      {/* Performance Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPerformance memberActivity={analytics.memberActivity} />
        <ProjectPerformance projectMetrics={analytics.projectMetrics} />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageMetricsCard usageMetrics={analytics.usageMetrics} />
        <RecentActivities />
      </div>

      {/* Export Controls */}
      <ExportControls onExport={handleExport} />
    </div>
  );
};

export default AnalyticsDashboard;