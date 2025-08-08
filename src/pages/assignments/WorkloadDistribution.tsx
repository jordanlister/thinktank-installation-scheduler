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
  Filter,
  Eye
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
          <div className="glass-subtle rounded-xl p-1 flex space-x-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'detailed', label: 'Detailed' },
              { id: 'comparison', label: 'Comparison' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  viewMode === mode.id
                    ? 'bg-accent-500/20 text-accent-300 shadow-lg border border-accent-500/30'
                    : 'text-glass-secondary hover:text-glass-primary hover:bg-white/10 border border-transparent'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="form-select form-input-sm text-sm"
          >
            <option value="all">All Teams</option>
            <option value="overutilized">Overutilized</option>
            <option value="underutilized">Underutilized</option>
            <option value="optimal">Optimal</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-select form-input-sm text-sm"
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
        <div className="alert-glass alert-warning">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Workload Optimization Recommendations</h3>
              <ul className="space-y-1 text-sm text-white/80">
                {generateRecommendations().map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
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
          {filteredAndSortedTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No Team Members Found</h3>
              <p className="text-white/70 text-center max-w-md">
                No team members match the current filter criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredAndSortedTeams.map(team => (
                <div key={team.teamId} className="p-6 hover:bg-white/5">
                  <div className="flex items-start space-x-4">
                    {/* Team Member Avatar */}
                    <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-accent-400" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {team.name}
                          </p>
                          <p className="text-sm text-white/70">
                            {team.region} • Capacity: {team.capacity} jobs/day
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-white/70">
                            {team.assignments}/{team.capacity} assignments
                          </p>
                          <p className="text-xs text-white/50">
                            {Math.round(team.utilization)}% utilized
                          </p>
                        </div>
                      </div>
                      
                      {/* Metrics */}
                      <div className="flex items-center space-x-6 text-sm text-white/70">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Efficiency:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            team.efficiency > 0.85 ? 'bg-green-500/20 text-green-400' :
                            team.efficiency > 0.7 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {Math.round(team.efficiency * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            team.status === 'optimal' ? 'bg-green-500/20 text-green-400' :
                            team.status === 'overutilized' ? 'bg-red-500/20 text-red-400' :
                            team.status === 'underutilized' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                          </span>
                        </div>
                        
                        {team.conflicts > 0 && (
                          <div className="flex items-center space-x-1 text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs">{team.conflicts} conflicts</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Utilization Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              team.utilization > 100 ? 'bg-red-500' : 
                              team.utilization > 85 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(team.utilization, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setSelectedTeam(team.teamId)}
                        className="text-white/50 hover:text-white/80"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workload Balance Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Workload Balance Visualization</h3>
            <span className="text-sm text-white/80">
              {filteredAndSortedTeams.length > 0 ? `${Math.min(filteredAndSortedTeams.length, 10)} of ${filteredAndSortedTeams.length} teams` : '0 of 0 teams'}
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            {filteredAndSortedTeams.slice(0, 10).map(team => (
              <div key={team.teamId} className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{team.name}</span>
                  <span className="text-white/70">
                    {team.assignments}/{team.capacity} ({Math.round(team.utilization)}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      team.utilization > 100 ? 'bg-gradient-to-r from-error-500 to-error-600' : 
                      team.utilization > 85 ? 'bg-gradient-to-r from-warning-500 to-warning-600' : 
                      'bg-gradient-to-r from-success-500 to-success-600'
                    }`}
                    style={{ width: `${Math.min(team.utilization, 100)}%` }}
                  ></div>
                  {team.utilization > 100 && (
                    <div 
                      className="h-3 bg-error-600 rounded-r-full -mt-3 opacity-75"
                      style={{ 
                        width: `${Math.min(team.utilization - 100, 50)}%`,
                        marginLeft: '100%'
                      }}
                    ></div>
                  )}
                </div>
              </div>
            ))}
            {filteredAndSortedTeams.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <BarChart3 className="h-8 w-8 text-white/60" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No Data Available</h3>
                <p className="text-white/70 text-center max-w-md">
                  No workload data to visualize with current filters.
                </p>
              </div>
            )}
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
  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    indigo: 'text-indigo-400',
    gray: 'text-white/60'
  };

  const actualColor = alert ? 'red' : color;

  return (
    <div className="card group rounded-xl transition-all duration-300 min-w-0">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/70 mb-1 leading-tight">
              {title}
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-white/60 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="ml-3 flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColors[actualColor as keyof typeof iconColors]}`} />
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