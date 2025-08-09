// Lead Route - Dashboard Page

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useDashboardStats, useInstallationsForDate } from '../../hooks/useInstallations';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const today = new Date().toISOString().split('T')[0];
  const { installations: todayInstallations, isLoading: todayLoading } = useInstallationsForDate(today);

  // Use real data from Supabase, with fallback to zeros if still loading
  const dashboardData = stats || {
    totalInstallations: 0,
    pendingInstallations: 0,
    scheduledInstallations: 0,
    completedInstallations: 0,
    todayInstallations: 0,
    weekInstallations: 0,
    monthInstallations: 0,
  };

  const statCards = [
    {
      title: 'Total Installations',
      value: dashboardData.totalInstallations,
      icon: MapPin,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      title: 'Pending',
      value: dashboardData.pendingInstallations,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      title: 'Scheduled Today',
      value: dashboardData.todayInstallations,
      icon: Calendar,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
    },
    {
      title: 'Completed',
      value: dashboardData.completedInstallations,
      icon: TrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass rounded-xl p-8 flex items-center space-x-4">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-400" />
          <span className="text-lg text-white/80">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="space-y-8">
        <div className="glass-strong border border-error-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 bg-error-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-error-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">Error Loading Dashboard</h3>
              <p className="mt-2 text-white/70">{statsError}</p>
              <button
                onClick={refetchStats}
                className="mt-4 btn-primary"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-xl text-white/80">Welcome to Lead Route</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const maxValue = Math.max(...statCards.map(s => s.value));
          const widthPercentage = Math.min((stat.value / maxValue) * 100, 100);
          const gradients = [
            'from-accent-500/20 to-accent-600/10',
            'from-warning-500/20 to-warning-600/10',
            'from-blue-500/20 to-blue-600/10',
            'from-success-500/20 to-success-600/10'
          ];
          const iconColors = [
            'text-accent-400',
            'text-warning-400',
            'text-blue-400',
            'text-success-400'
          ];
          
          return (
            <div key={stat.title} className="card rounded-xl hover:bg-white/15 transition-all duration-200">
              <div className="card-body p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/70 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`h-14 w-14 bg-gradient-to-br ${gradients[index]} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className={`h-7 w-7 ${iconColors[index]}`} />
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="mt-4">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${gradients[index]} rounded-full transition-all duration-300`}
                      style={{ width: `${widthPercentage}%` }}
                    >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick actions */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-accent-500/30 to-accent-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-accent-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Quick Actions
              </h2>
            </div>
          </div>
          <div className="card-body p-6 pt-8 space-y-3">
            <button 
              onClick={() => navigate('/app/schedules')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 text-left"
            >
              Schedule New Route
            </button>
            <button 
              onClick={() => navigate('/app/assignments')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 text-left"
            >
              Manage Assignments
            </button>
            <button 
              onClick={() => navigate('/app/installations')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 text-left"
            >
              View Installations
            </button>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Recent Activity
              </h2>
            </div>
          </div>
          <div className="card-body">
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-white/40" />
              </div>
              <p className="text-white/80 text-lg mb-2">
                No recent activity to display
              </p>
              <p className="text-white/50">
                Activity will appear here once you start using the system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's schedule preview */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Today's Schedule
              </h2>
            </div>
            {todayLoading && (
              <div className="glass-subtle p-2 rounded-lg">
                <RefreshCw className="h-5 w-5 animate-spin text-accent-400" />
              </div>
            )}
          </div>
        </div>
        <div className="card-body">
          {todayInstallations.length > 0 ? (
            <div className="space-y-4">
              {todayInstallations.slice(0, 5).map((installation, index) => (
                <div 
                  key={installation.id}
                  className="glass-subtle p-4 rounded-xl hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-4 h-4 rounded-full shadow-lg ${
                        installation.status === 'completed' ? 'bg-success-500 shadow-success-500/50' :
                        installation.status === 'in_progress' ? 'bg-blue-500 shadow-blue-500/50' :
                        installation.status === 'scheduled' ? 'bg-warning-500 shadow-warning-500/50' :
                        'bg-white/40'
                      }`} />
                      <div className="flex-1">
                        <p className="font-semibold text-white">
                          {installation.customerName}
                        </p>
                        <p className="text-sm text-white/70">
                          {installation.address.city}, {installation.address.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {installation.scheduledTime}
                      </p>
                      <p className="text-xs text-white/60 capitalize">
                        {installation.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {todayInstallations.length > 5 && (
                <div className="text-center mt-6">
                  <div className="glass-subtle inline-block px-4 py-2 rounded-full">
                    <p className="text-sm text-white/80">
                      +{todayInstallations.length - 5} more installations today
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-white/40" />
              </div>
              <p className="text-white/80 text-lg mb-2">
                No installations scheduled for today
              </p>
              <p className="text-white/50">
                Check back tomorrow for new installations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;