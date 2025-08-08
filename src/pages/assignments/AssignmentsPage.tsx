// Lead Route - Assignments Dashboard

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  PlayCircle,
  RefreshCw,
  Download,
  Filter,
  Grid,
  List,
  Clock,
  Target,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  useAppStore,
  useAssignments,
  useAssignmentConflicts,
  useWorkloadDistribution,
  useAssignmentDashboardMetrics,
  useAssignmentInProgress,
  useTeams,
  useInstallations
} from '../../stores/useAppStore';
import TeamAssignmentMatrix from './TeamAssignmentMatrix';
import WorkloadDistribution from './WorkloadDistribution';
import AssignmentConflicts from './AssignmentConflicts';
import AutoAssignmentPanel from './AutoAssignmentPanel';
import AssignmentHistory from './AssignmentHistory';
import type { AutoAssignmentCriteria } from '../../types';

/**
 * Assignments Page - Main dashboard for team assignment management
 * 
 * Features:
 * - Assignment overview metrics
 * - Team assignment matrix with drag-and-drop
 * - Workload distribution charts
 * - Conflict detection and resolution
 * - Automated assignment tools
 * - Assignment history and audit trail
 */
const AssignmentsPage: React.FC = () => {
  const { 
    runAutoAssignment,
    detectConflicts,
    calculateWorkloadDistribution,
    generateAssignmentMatrix,
    calculateAssignmentAnalytics,
    refreshAssignmentData,
    setError
  } = useAppStore();

  // State from store
  const assignments = useAssignments();
  const conflicts = useAssignmentConflicts();
  const workloadData = useWorkloadDistribution();
  const dashboardMetrics = useAssignmentDashboardMetrics();
  const isProcessing = useAssignmentInProgress();
  const teams = useTeams();
  const installations = useInstallations();

  // Local UI state
  const [activeTab, setActiveTab] = useState<'matrix' | 'workload' | 'conflicts' | 'automation' | 'history'>('matrix');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAutoAssignmentPanel, setShowAutoAssignmentPanel] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Calculate key metrics
  const keyMetrics = React.useMemo(() => {
    const totalAssignments = assignments.length;
    const activeConflicts = conflicts.filter(c => !c.resolvedAt).length;
    const unassignedJobs = installations.filter(job => 
      !assignments.some(a => a.installationId === job.id)
    ).length;
    
    const utilizationRates = workloadData.map(w => w.utilizationPercentage);
    const avgUtilization = utilizationRates.length > 0 
      ? utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length 
      : 0;

    const autoAssignmentRate = totalAssignments > 0 
      ? (assignments.filter(a => a.metadata.autoAssigned).length / totalAssignments) * 100 
      : 0;

    return {
      totalAssignments,
      activeConflicts,
      unassignedJobs,
      avgUtilization: Math.round(avgUtilization),
      autoAssignmentRate: Math.round(autoAssignmentRate),
      teamMembers: teams.filter(t => t.isActive).length,
      conflictRate: totalAssignments > 0 ? (activeConflicts / totalAssignments) * 100 : 0
    };
  }, [assignments, conflicts, installations, workloadData, teams]);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await refreshAssignmentData();
        detectConflicts();
        calculateWorkloadDistribution(dateRange);
        generateAssignmentMatrix(dateRange);
        calculateAssignmentAnalytics({ 
          start: dateRange.start, 
          end: dateRange.end 
        });
      } catch (error) {
        setError(`Failed to initialize assignment data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeData();
  }, []);

  // Refresh data when date range changes
  useEffect(() => {
    calculateWorkloadDistribution(dateRange);
    generateAssignmentMatrix(dateRange);
  }, [dateRange, calculateWorkloadDistribution, generateAssignmentMatrix]);

  /**
   * Run automated assignment with default criteria
   */
  const handleRunAutoAssignment = async () => {
    try {
      const criteria: AutoAssignmentCriteria = {
        optimizationGoal: 'hybrid',
        considerSkills: true,
        considerLocation: true,
        considerAvailability: true,
        considerWorkload: true,
        considerPerformance: true,
        considerPreferences: false,
        maxTravelDistance: 50,
        workloadBalanceWeight: 0.3,
        skillMatchWeight: 0.25,
        performanceWeight: 0.2,
        urgencyWeight: 0.15,
        geographicWeight: 0.1
      };

      await runAutoAssignment(criteria);
      await refreshAssignmentData();
    } catch (error) {
      setError(`Auto assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Refresh all assignment data
   */
  const handleRefreshData = async () => {
    try {
      await refreshAssignmentData();
      detectConflicts();
    } catch (error) {
      setError(`Failed to refresh data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Export assignments data
   */
  const handleExportAssignments = () => {
    const exportData = {
      assignments,
      conflicts: conflicts.filter(c => !c.resolvedAt),
      workloadData,
      metrics: keyMetrics,
      dateRange,
      exportedAt: new Date().toISOString(),
      exportedBy: 'User' // In a real app, this would be the current user
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignments_export_${dateRange.start}_to_${dateRange.end}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Route Assignments</h1>
        <p className="text-xl text-white/80">Manage route assignments, workload distribution, and optimize scheduling</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-white/80">From:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="form-input text-sm rounded-xl"
          />
          <label className="text-sm font-medium text-white/80">To:</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="form-input text-sm rounded-xl"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefreshData}
            disabled={isProcessing}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50"
          >
            {isProcessing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button 
            onClick={handleExportAssignments}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Export Assignments
          </button>
          
          <button
            onClick={handleRunAutoAssignment}
            disabled={isProcessing || keyMetrics.unassignedJobs === 0}
            className="px-6 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50 whitespace-nowrap"
          >
            Auto Assign ({keyMetrics.unassignedJobs})
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-8">
        <MetricCard
          title="Total Assignments"
          value={keyMetrics.totalAssignments}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Conflicts"
          value={keyMetrics.activeConflicts}
          icon={AlertTriangle}
          color={keyMetrics.activeConflicts > 0 ? "red" : "green"}
          alert={keyMetrics.activeConflicts > 0}
        />
        <MetricCard
          title="Unassigned Jobs"
          value={keyMetrics.unassignedJobs}
          icon={Clock}
          color={keyMetrics.unassignedJobs > 0 ? "yellow" : "green"}
          alert={keyMetrics.unassignedJobs > 5}
        />
        <MetricCard
          title="Avg Utilization"
          value={`${keyMetrics.avgUtilization}%`}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Auto Assignment"
          value={`${keyMetrics.autoAssignmentRate}%`}
          icon={Target}
          color="indigo"
        />
        <MetricCard
          title="Team Members"
          value={keyMetrics.teamMembers}
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Conflict Rate"
          value={`${Math.round(keyMetrics.conflictRate)}%`}
          icon={Activity}
          color={keyMetrics.conflictRate > 10 ? "red" : "green"}
        />
      </div>


      {/* Alerts */}
      {keyMetrics.activeConflicts > 0 && (
        <div className="alert-glass alert-error">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-glass-primary">Assignment Conflicts Detected</h3>
              <p className="mt-1 text-sm text-glass-secondary">
                {keyMetrics.activeConflicts} active conflicts need resolution. Review the conflicts tab to resolve issues.
              </p>
            </div>
          </div>
        </div>
      )}

      {keyMetrics.unassignedJobs > 0 && (
        <div className="alert-glass alert-warning">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-glass-primary">Unassigned Jobs</h3>
              <p className="mt-1 text-sm text-glass-secondary">
                {keyMetrics.unassignedJobs} jobs are waiting for assignment. Run auto-assignment or assign manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="glass-subtle rounded-xl p-2">
        <nav className="flex space-x-2">
          {[
            { id: 'matrix', label: 'Assignment Matrix', icon: Grid },
            { id: 'workload', label: 'Workload Distribution', icon: BarChart3 },
            { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, badge: keyMetrics.activeConflicts },
            { id: 'automation', label: 'Auto Assignment', icon: Settings },
            { id: 'history', label: 'Assignment History', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm relative transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30 shadow-lg'
                  : 'text-glass-secondary hover:text-glass-primary hover:bg-white/10 border border-transparent'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white/20">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'matrix' && (
          <TeamAssignmentMatrix 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            dateRange={dateRange}
          />
        )}
        
        {activeTab === 'workload' && (
          <WorkloadDistribution 
            dateRange={dateRange}
          />
        )}
        
        {activeTab === 'conflicts' && (
          <AssignmentConflicts />
        )}
        
        {activeTab === 'automation' && (
          <AutoAssignmentPanel />
        )}
        
        {activeTab === 'history' && (
          <AssignmentHistory 
            dateRange={dateRange}
          />
        )}
      </div>

      {/* Auto Assignment Panel Modal */}
      {showAutoAssignmentPanel && (
        <AutoAssignmentPanel 
          isOpen={showAutoAssignmentPanel}
          onClose={() => setShowAutoAssignmentPanel(false)}
        />
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  alert?: boolean;
}> = ({ title, value, icon: Icon, color, alert }) => {
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
            <p className="text-3xl font-bold text-white leading-none">
              {value}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColors[actualColor as keyof typeof iconColors]}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;