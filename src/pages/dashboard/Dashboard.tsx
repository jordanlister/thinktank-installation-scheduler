// Think Tank Technologies Installation Scheduler - Dashboard Page

import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useDashboardStats } from '../../stores/useAppStore';

export const Dashboard: React.FC = () => {
  const dashboardStats = useDashboardStats();

  // Mock data for demonstration - this would come from your API
  const stats = dashboardStats || {
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
      value: stats.totalInstallations,
      icon: MapPin,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      title: 'Pending',
      value: stats.pendingInstallations,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      title: 'Scheduled Today',
      value: stats.todayInstallations,
      icon: Calendar,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
    },
    {
      title: 'Completed',
      value: stats.completedInstallations,
      icon: TrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-primary-900">
          Dashboard
        </h1>
        <p className="mt-2 text-primary-600">
          Welcome to the Think Tank Technologies Installation Scheduler
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
      <div className="mt-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-primary-900">
              Today's Schedule
            </h2>
          </div>
          <div className="card-body">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-primary-300 mx-auto mb-4" />
              <p className="text-primary-600">
                No installations scheduled for today
              </p>
              <p className="text-sm text-primary-500 mt-1">
                Schedule your first installation to get started
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;