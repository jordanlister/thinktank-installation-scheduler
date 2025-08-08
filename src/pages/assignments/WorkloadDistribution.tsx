// Think Tank Technologies Installation Scheduler - Workload Distribution

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  useAppStore,
  useWorkloadDistribution,
  useTeams,
  useAssignments
} from '../../stores/useAppStore';
import type { WorkloadData, TeamMember } from '../../types';

interface WorkloadDistributionProps {
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Workload Distribution - Team capacity visualization and management
 * 
 * Features:
 * - Team workload charts and metrics
 * - Capacity utilization analysis
 * - Workload balance recommendations
 * - Performance trend visualization
 * - Team comparison analytics
 */
const WorkloadDistribution: React.FC<WorkloadDistributionProps> = ({ dateRange }) => {
  const { 
    calculateWorkloadDistribution,
    updateWorkloadData,
    setError
  } = useAppStore();

  // State from store
  const workloadData = useWorkloadDistribution();
  const teams = useTeams();
  const assignments = useAssignments();

  // Local state
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [sortBy, setSortBy] = useState<'name' | 'utilization' | 'assignments' | 'efficiency'>('utilization');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overutilized' | 'underutilized' | 'optimal'>('all');

  // Calculate workload metrics
  const workloadMetrics = useMemo(() => {
    const activeTeams = teams.filter(t => t.isActive);
    const teamWorkloads = activeTeams.map(team => {
      const teamAssignments = assignments.filter(a => 
        a.leadId === team.id || a.assistantId === team.id
      );
      const workloadItem = workloadData.find(w => w.teamMemberId === team.id);
      
      return {
        teamId: team.id,
        name: `${team.firstName} ${team.lastName}`,
        region: team.region,
        capacity: team.capacity,
        assignments: teamAssignments.length,
        utilization: workloadItem?.utilizationPercentage || 0,
        efficiency: workloadItem?.efficiency || 0,
        conflicts: workloadItem?.conflicts || 0,
        status: getWorkloadStatus(workloadItem?.utilizationPercentage || 0),
        travelTime: workloadItem?.travelTime || 0,
        overtimeHours: workloadItem?.overtimeHours || 0
      };
    });

    const totalCapacity = teamWorkloads.reduce((sum, t) => sum + t.capacity, 0);
    const totalAssignments = teamWorkloads.reduce((sum, t) => sum + t.assignments, 0);
    const avgUtilization = teamWorkloads.reduce((sum, t) => sum + t.utilization, 0) / teamWorkloads.length;
    const avgEfficiency = teamWorkloads.reduce((sum, t) => sum + t.efficiency, 0) / teamWorkloads.length;

    const overutilizedTeams = teamWorkloads.filter(t => t.utilization > 100);
    const underutilizedTeams = teamWorkloads.filter(t => t.utilization < 60);
    const optimalTeams = teamWorkloads.filter(t => t.utilization >= 60 && t.utilization <= 100);

    return {
      teamWorkloads,
      totalCapacity,
      totalAssignments,
      avgUtilization,
      avgEfficiency,
      overutilizedCount: overutilizedTeams.length,
      underutilizedCount: underutilizedTeams.length,
      optimalCount: optimalTeams.length,
      workloadVariance: calculateVariance(teamWorkloads.map(t => t.utilization))
    };
  }, [teams, assignments, workloadData]);

  // Filter and sort teams
  const filteredAndSortedTeams = useMemo(() => {
    let filtered = [...workloadMetrics.teamWorkloads];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(team => {
        switch (filterStatus) {
          case 'overutilized':
            return team.utilization > 100;
          case 'underutilized':
            return team.utilization < 60;
          case 'optimal':
            return team.utilization >= 60 && team.utilization <= 100;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'utilization':
          return b.utilization - a.utilization;
        case 'assignments':
          return b.assignments - a.assignments;
        case 'efficiency':
          return b.efficiency - a.efficiency;
        default:
          return 0;
      }
    });

    return filtered;
  }, [workloadMetrics.teamWorkloads, filterStatus, sortBy]);

  // Initialize workload data
  useEffect(() => {
    calculateWorkloadDistribution(dateRange);
  }, [dateRange, calculateWorkloadDistribution]);

  // Generate recommendations
  const generateRecommendations = () => {
    const recommendations: string[] = [];
    
    if (workloadMetrics.overutilizedCount > 0) {
      recommendations.push(`${workloadMetrics.overutilizedCount} team members are overutilized. Consider redistributing assignments.`);
    }
    
    if (workloadMetrics.underutilizedCount > 0) {
      recommendations.push(`${workloadMetrics.underutilizedCount} team members are underutilized. Consider increasing their assignments.`);
    }
    
    if (workloadMetrics.workloadVariance > 20) {
      recommendations.push('High workload variance detected. Balance assignments for better team efficiency.');
    }
    
    if (workloadMetrics.avgEfficiency < 0.8) {
      recommendations.push('Average team efficiency is below optimal. Review assignment strategies.');
    }
    
    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Capacity"
          value={workloadMetrics.totalCapacity}
          subtitle="jobs/day"
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Total Assignments"
          value={workloadMetrics.totalAssignments}
          subtitle={`${Math.round((workloadMetrics.totalAssignments / workloadMetrics.totalCapacity) * 100)}% utilized`}
          icon={Activity}
          color="green"
        />
        <MetricCard
          title="Avg Utilization"
          value={`${Math.round(workloadMetrics.avgUtilization)}%`}
          subtitle={workloadMetrics.avgUtilization > 85 ? 'High' : workloadMetrics.avgUtilization < 65 ? 'Low' : 'Optimal'}
          icon={BarChart3}
          color={workloadMetrics.avgUtilization > 85 ? 'red' : workloadMetrics.avgUtilization < 65 ? 'yellow' : 'green'}
        />
        <MetricCard
          title="Overutilized"
          value={workloadMetrics.overutilizedCount}
          subtitle="team members"
          icon={TrendingUp}
          color="red"
          alert={workloadMetrics.overutilizedCount > 0}
        />
        <MetricCard
          title="Avg Efficiency"
          value={`${Math.round(workloadMetrics.avgEfficiency * 100)}%`}
          subtitle={workloadMetrics.avgEfficiency > 0.85 ? 'Excellent' : 'Needs improvement'}
          icon={CheckCircle}
          color={workloadMetrics.avgEfficiency > 0.85 ? 'green' : 'yellow'}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex bg-white/10 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'detailed', label: 'Detailed' },
              { id: 'comparison', label: 'Comparison' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-glass-secondary hover:text-glass-primary'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="form-select text-sm"
          >
            <option value="all">All Teams</option>
            <option value="overutilized">Overutilized</option>
            <option value="underutilized">Underutilized</option>
            <option value="optimal">Optimal</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-select text-sm"
          >
            <option value="utilization">Sort by Utilization</option>
            <option value="name">Sort by Name</option>
            <option value="assignments">Sort by Assignments</option>
            <option value="efficiency">Sort by Efficiency</option>
          </select>
        </div>
      </div>

      {/* Recommendations */}
      {generateRecommendations().length > 0 && (
        <div className="card border-yellow-200 bg-yellow-50">
          <div className="card-body">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Workload Optimization Recommendations</h3>
                <ul className="space-y-1 text-sm text-yellow-700">
                  {generateRecommendations().map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Workload List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Team Workload Distribution</h3>
            <span className="text-sm text-white/80">
              {filteredAndSortedTeams.length} of {workloadMetrics.teamWorkloads.length} teams
            </span>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="w-full">
            <table className="w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-white/90 uppercase tracking-wider">
                    Assignments
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-white/90 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-white/90 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-white/90 uppercase tracking-wider">
                    Efficiency
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-white/90 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-white/90 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/3 divide-y divide-white/10">
                {filteredAndSortedTeams.map(team => (
                  <tr key={team.teamId} className="hover:bg-white/15 transition-all duration-200">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-accent-500/20 flex items-center justify-center">
                            <Users className="h-4 w-4 text-accent-400" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">
                            {team.name}
                          </div>
                          <div className="text-xs text-white/70">
                            {team.region}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm font-medium text-white">
                        {team.assignments}
                      </div>
                      {team.conflicts > 0 && (
                        <div className="text-xs text-red-400 flex items-center justify-center mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {team.conflicts}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm text-white">
                        {team.capacity}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm font-medium text-white mb-1">
                        {Math.round(team.utilization)}%
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1.5 mx-auto max-w-16">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            team.utilization > 100 ? 'bg-red-500' : 
                            team.utilization > 85 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(team.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm text-white mb-1">
                        {Math.round(team.efficiency * 100)}%
                      </div>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        team.efficiency > 0.85 ? 'bg-green-500/20 text-green-300' :
                        team.efficiency > 0.7 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {team.efficiency > 0.85 ? 'Excellent' :
                         team.efficiency > 0.7 ? 'Good' : 'Poor'}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        team.status === 'optimal' ? 'bg-green-500/20 text-green-300' :
                        team.status === 'overutilized' ? 'bg-red-500/20 text-red-300' :
                        team.status === 'underutilized' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-white/15 text-white/70'
                      }`}>
                        {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => setSelectedTeam(team.teamId)}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded text-xs text-white/90 hover:bg-white/15 transition-all duration-200"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Workload Balance Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-white">Workload Balance Visualization</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {filteredAndSortedTeams.slice(0, 10).map(team => (
              <div key={team.teamId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-glass-primary">{team.name}</span>
                  <span className="text-glass-secondary">
                    {team.assignments}/{team.capacity} ({Math.round(team.utilization)}%)
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      team.utilization > 100 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                      team.utilization > 85 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                      'bg-gradient-to-r from-green-400 to-green-500'
                    }`}
                    style={{ width: `${Math.min(team.utilization, 100)}%` }}
                  ></div>
                  {team.utilization > 100 && (
                    <div 
                      className="h-3 bg-red-600 rounded-r-full -mt-3 opacity-75"
                      style={{ 
                        width: `${Math.min(team.utilization - 100, 50)}%`,
                        marginLeft: '100%'
                      }}
                    ></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
  alert?: boolean;
}> = ({ title, value, subtitle, icon: Icon, color, alert }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className={`card ${alert ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${alert ? 'text-red-600' : 'text-glass-secondary'}`}>
              {title}
            </p>
            <p className={`text-2xl font-bold ${alert ? 'text-red-900' : 'text-glass-primary'}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-xs ${alert ? 'text-red-600' : 'text-glass-secondary'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            alert ? 'bg-red-100 text-red-600' : colorClasses[color as keyof typeof colorClasses]
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getWorkloadStatus = (utilization: number): 'optimal' | 'overutilized' | 'underutilized' => {
  if (utilization > 100) return 'overutilized';
  if (utilization < 60) return 'underutilized';
  return 'optimal';
};

const calculateVariance = (values: number[]): number => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
};

export default WorkloadDistribution;