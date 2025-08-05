// Think Tank Technologies Installation Scheduler - Dashboard Page

import React from 'react';
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
        <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-primary-600">Loading dashboard data...</span>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{statsError}</p>
              <button
                onClick={refetchStats}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
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
      <div>
        <h1 className="text-3xl font-bold text-primary-900">
          Dashboard
        </h1>
        <p className="mt-2 text-lg text-primary-600">
          Welcome to the Think Tank Technologies Installation Scheduler
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-primary-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold text-primary-900">
                      {stat.value}
                    </p>
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
            <h2 className="text-lg font-medium text-primary-900">
              Quick Actions
            </h2>
          </div>
          <div className="card-body space-y-4">
            <button className="btn-primary w-full justify-center">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule New Installation
            </button>
            <button className="btn-secondary w-full justify-center">
              <Users className="h-4 w-4 mr-2" />
              Manage Assignments
            </button>
            <button className="btn-secondary w-full justify-center">
              <MapPin className="h-4 w-4 mr-2" />
              View Map
            </button>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-primary-900">
              Recent Activity
            </h2>
          </div>
          <div className="card-body">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-primary-300 mx-auto mb-4" />
              <p className="text-primary-600">
                No recent activity to display
              </p>
              <p className="text-sm text-primary-500 mt-1">
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
            <h2 className="text-lg font-medium text-primary-900">
              Today's Schedule
            </h2>
            {todayLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-primary-400" />
            )}
          </div>
        </div>
        <div className="card-body">
          {todayInstallations.length > 0 ? (
            <div className="space-y-4">
              {todayInstallations.slice(0, 5).map((installation) => (
                <div 
                  key={installation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        installation.status === 'completed' ? 'bg-green-500' :
                        installation.status === 'in_progress' ? 'bg-blue-500' :
                        installation.status === 'scheduled' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {installation.customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {installation.address.city}, {installation.address.state}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {installation.scheduledTime}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {installation.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
              {todayInstallations.length > 5 && (
                <div className="text-center">
                  <p className="text-sm text-primary-600">
                    +{todayInstallations.length - 5} more installations today
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-primary-300 mx-auto mb-4" />
              <p className="text-primary-600">
                No installations scheduled for today
              </p>
              <p className="text-sm text-primary-500 mt-1">
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