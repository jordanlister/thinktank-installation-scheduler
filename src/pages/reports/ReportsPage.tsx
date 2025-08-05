// Think Tank Technologies Reports Page
// Main page for accessing email and PDF report generation features

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mail, 
  BarChart3, 
  Calendar, 
  Users, 
  Settings,
  Download,
  Send,
  Eye,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import ReportManagement from '../../components/reports/ReportManagement';
import { useAppStore } from '../../stores/useAppStore';
import { 
  EmailTemplate, 
  PDFTemplate, 
  ReportAnalytics,
  EmailAnalyticsMetrics,
  PDFAnalyticsMetrics,
  User
} from '../../types';
import { emailGenerator } from '../../services/emailGenerator';
import { pdfGenerator } from '../../services/pdfGenerator';
import { reportAnalytics } from '../../services/reportAnalytics';

type TabType = 'overview' | 'templates' | 'analytics' | 'scheduled';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAppStore();

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const period = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        end: new Date().toISOString()
      };
      const analyticsData = await reportAnalytics.generateAnalytics(period);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Email Templates"
          value="12"
          change="+2 this month"
          icon={<Mail className="text-blue-600" size={24} />}
          trend="up"
        />
        <StatCard
          title="PDF Templates"
          value="8"
          change="+1 this month"
          icon={<FileText className="text-green-600" size={24} />}
          trend="up"
        />
        <StatCard
          title="Reports Generated"
          value="156"
          change="+23% this week"
          icon={<BarChart3 className="text-purple-600" size={24} />}
          trend="up"
        />
        <StatCard
          title="Emails Sent"
          value="1,247"
          change="89.5% delivered"
          icon={<Send className="text-orange-600" size={24} />}
          trend="stable"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Generate Schedule Report"
            description="Create installation schedule PDF for team distribution"
            icon={<Calendar size={20} />}
            action={() => handleQuickAction('schedule')}
            color="bg-blue-50 text-blue-700 border-blue-200"
          />
          <QuickActionCard
            title="Send Team Notifications"
            description="Notify team members of new assignments"
            icon={<Users size={20} />}
            action={() => handleQuickAction('notifications')}
            color="bg-green-50 text-green-700 border-green-200"
          />
          <QuickActionCard
            title="Performance Report"
            description="Generate weekly performance analytics"
            icon={<TrendingUp size={20} />}
            action={() => handleQuickAction('performance')}
            color="bg-purple-50 text-purple-700 border-purple-200"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem
            type="pdf"
            title="Installation Schedule Report generated"
            time="2 hours ago"
            user="Sarah Johnson"
            status="completed"
          />
          <ActivityItem
            type="email"
            title="Assignment notifications sent to 12 team members"
            time="4 hours ago"
            user="System"
            status="delivered"
          />
          <ActivityItem
            type="pdf"
            title="Team Performance Report generated"
            time="1 day ago"
            user="Mike Chen"
            status="completed"
          />
          <ActivityItem
            type="email"
            title="Customer confirmations sent for 8 installations"
            time="1 day ago"
            user="System"
            status="delivered"
          />
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      ) : analytics ? (
        <>
          {/* Email Analytics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Delivery Rate"
                value={`${analytics.emailMetrics.deliveryRate.toFixed(1)}%`}
                subtitle={`${analytics.emailMetrics.totalDelivered} delivered`}
                color="text-green-600"
              />
              <MetricCard
                title="Open Rate"
                value={`${analytics.emailMetrics.openRate.toFixed(1)}%`}
                subtitle={`${analytics.emailMetrics.totalOpened} opened`}
                color="text-blue-600"
              />
              <MetricCard
                title="Click Rate"
                value={`${analytics.emailMetrics.clickRate.toFixed(1)}%`}
                subtitle={`${analytics.emailMetrics.totalClicked} clicked`}
                color="text-purple-600"
              />
              <MetricCard
                title="Bounce Rate"
                value={`${analytics.emailMetrics.bounceRate.toFixed(1)}%`}
                subtitle={`${analytics.emailMetrics.totalBounced} bounced`}
                color="text-red-600"
              />
            </div>
          </div>

          {/* PDF Analytics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">PDF Generation Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Reports Generated"
                value={analytics.pdfMetrics.totalGenerated.toString()}
                subtitle="This period"
                color="text-green-600"
              />
              <MetricCard
                title="Downloads"
                value={analytics.pdfMetrics.totalDownloaded.toString()}
                subtitle="Total downloads"
                color="text-blue-600"
              />
              <MetricCard
                title="Avg Generation Time"
                value={`${analytics.pdfMetrics.averageGenerationTime}s`}
                subtitle="Per report"
                color="text-purple-600"
              />
              <MetricCard
                title="Failure Rate"
                value={`${analytics.pdfMetrics.failureRate.toFixed(1)}%`}
                subtitle="Generation failures"
                color="text-red-600"
              />
            </div>
          </div>

          {/* Recommendations */}
          {analytics.recommendations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
              <div className="space-y-4">
                {analytics.recommendations.map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Analytics data will appear here once reports are generated.</p>
        </div>
      )}
    </div>
  );

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'schedule':
        // Generate schedule report
        console.log('Generating schedule report...');
        break;
      case 'notifications':
        // Send notifications
        console.log('Sending team notifications...');
        break;
      case 'performance':
        // Generate performance report
        console.log('Generating performance report...');
        break;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'scheduled', label: 'Scheduled', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Communications</h1>
          <p className="mt-2 text-gray-600">
            Manage email templates, generate PDF reports, and analyze communication performance
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'templates' && user && (
            <ReportManagement
              currentUser={user as User}
              onTemplateUpdate={(template) => console.log('Template updated:', template)}
              onScheduleCreate={(schedule) => console.log('Schedule created:', schedule)}
            />
          )}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'scheduled' && (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduled Reports</h3>
              <p className="text-gray-600">Scheduled report management interface would be implemented here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Supporting Components

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className={`text-sm ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {change}
        </p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
    </div>
  </div>
);

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, icon, action, color }) => (
  <button
    onClick={action}
    className={`p-4 border rounded-lg text-left hover:shadow-md transition-shadow ${color}`}
  >
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h3 className="font-medium">{title}</h3>
    </div>
    <p className="text-sm opacity-80">{description}</p>
  </button>
);

interface ActivityItemProps {
  type: 'email' | 'pdf';
  title: string;
  time: string;
  user: string;
  status: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, time, user, status }) => (
  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
    <div className={`p-2 rounded-full ${type === 'email' ? 'bg-blue-100' : 'bg-green-100'}`}>
      {type === 'email' ? (
        <Mail className="text-blue-600" size={16} />
      ) : (
        <FileText className="text-green-600" size={16} />
      )}
    </div>
    <div className="flex-1">
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{time} • {user}</p>
    </div>
    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === 'completed' || status === 'delivered'
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      {status}
    </div>
  </div>
);

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, color }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);

interface RecommendationCardProps {
  recommendation: any;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => (
  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        <div className={`p-2 rounded-full ${
          recommendation.priority === 'high' ? 'bg-red-100' :
          recommendation.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
        }`}>
          <AlertCircle className={`${
            recommendation.priority === 'high' ? 'text-red-600' :
            recommendation.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
          }`} size={16} />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{recommendation.description}</h4>
        <p className="text-sm text-gray-600 mt-1">{recommendation.expectedImpact}</p>
        <div className="mt-2">
          <p className="text-xs font-medium text-gray-700">Action Items:</p>
          <ul className="text-xs text-gray-600 mt-1 space-y-1">
            {recommendation.actionItems.map((item: string, index: number) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default ReportsPage;