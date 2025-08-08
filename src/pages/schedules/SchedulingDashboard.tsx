// Lead Route - Scheduling Dashboard

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Users, AlertTriangle, Settings, PlayCircle, Download, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useTeamMembers } from '../../hooks/useTeamData';
import { schedulingEngine } from '../../utils/schedulingEngine';
import { enhanceJobsWithCoordinates } from '../../utils/geographicUtils';
import ScheduleOptimizationPanel from '../../components/scheduling/ScheduleOptimizationPanel';
import ScheduleCalendarView from '../../components/scheduling/ScheduleCalendarView';
import ScheduleListView from '../../components/scheduling/ScheduleListView';
import ScheduleMapView from '../../components/scheduling/ScheduleMapView';
import ConflictResolutionPanel from '../../components/scheduling/ConflictResolutionPanel';
import BulkAssignmentModal from '../../components/scheduling/BulkAssignmentModal';
import OptimizationMetricsCard from '../../components/scheduling/OptimizationMetricsCard';
import TeamWorkloadChart from '../../components/scheduling/TeamWorkloadChart';
import type {
  SchedulingRequest,
  SchedulingResult,
  ScheduleViewConfig,
  TeamMember,
  OptimizationMetrics,
  SchedulingConflict
} from '../../types';

/**
 * Main Scheduling Dashboard Component
 * 
 * Provides comprehensive scheduling interface including:
 * - Interactive schedule optimization controls
 * - Multiple view modes (calendar, list, timeline, map)
 * - Conflict detection and resolution
 * - Drag-and-drop assignment interface
 * - Real-time optimization metrics
 * - Bulk assignment capabilities
 */
const SchedulingDashboard: React.FC = () => {
  const { 
    installations, 
    setError, 
    setLoading,
    isLoading 
  } = useAppStore();

  // Get real team data from Supabase
  const { 
    teamMembers: teams, 
    isLoading: teamsLoading, 
    error: teamsError, 
    refetch: refetchTeams 
  } = useTeamMembers();

  // Scheduling state
  const [schedulingResult, setSchedulingResult] = useState<SchedulingResult | null>(null);
  const [optimizationInProgress, setOptimizationInProgress] = useState(false);
  const [viewConfig, setViewConfig] = useState<ScheduleViewConfig>({
    viewType: 'calendar',
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    filters: {},
    groupBy: 'team'
  });

  // UI state
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);

  /**
   * Run schedule optimization with current parameters
   */
  const runOptimization = useCallback(async () => {
    if (installations.length === 0) {
      setError('No installations available for scheduling');
      return;
    }

    if (teams.length === 0) {
      setError('No team members available for assignment');
      return;
    }

    setOptimizationInProgress(true);
    setError(null);

    try {
      // Enhance jobs with coordinates if missing
      const enhancedJobs = enhanceJobsWithCoordinates(installations);

      // Create scheduling request
      const request: SchedulingRequest = {
        jobs: enhancedJobs,
        teams: teams,
        constraints: {
          maxDailyJobs: 8,
          maxTravelDistance: 100,
          bufferTime: 15,
          workingHours: {
            start: '08:00',
            end: '18:00'
          },
          requiredSpecializations: {},
          deadlines: {},
          teamPreferences: {}
        },
        preferences: {
          optimizationGoal: 'travel_distance',
          allowOvertimeAssignment: false,
          prioritizeLeadContinuity: true,
          minimizeTeamSplits: true,
          geographicClustering: true
        }
      };

      console.log('Starting optimization with request:', request);

      // Run optimization
      const result = await schedulingEngine.optimizeSchedule(request);
      
      console.log('Optimization completed:', result);
      
      setSchedulingResult(result);

      // Show conflict panel if conflicts were detected
      if (result.conflicts.length > 0) {
        setShowConflictPanel(true);
      }

    } catch (error) {
      console.error('Optimization failed:', error);
      setError(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setOptimizationInProgress(false);
    }
  }, [installations, teams, setError]);

  /**
   * Handle view type change
   */
  const handleViewChange = (viewType: ScheduleViewConfig['viewType']) => {
    setViewConfig(prev => ({ ...prev, viewType }));
  };

  /**
   * Handle drag and drop assignment
   */
  const handleDragDropAssignment = (sourceJobId: string, targetTeamId: string, targetDate: string) => {
    // Implementation for drag-and-drop assignment
    // This would update the assignments and potentially re-run optimization
    console.log('Drag-drop assignment:', { sourceJobId, targetTeamId, targetDate });
  };

  /**
   * Export schedule data
   */
  const handleExportSchedule = () => {
    if (!schedulingResult) return;

    const exportData = {
      assignments: schedulingResult.assignments,
      metrics: schedulingResult.optimizationMetrics,
      scheduleByDate: schedulingResult.scheduleByDate,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-run optimization when installations change
  useEffect(() => {
    if (installations.length > 0 && teams.length > 0 && !schedulingResult) {
      runOptimization();
    }
  }, [installations.length, teams.length, runOptimization, schedulingResult]);

  // Handle team loading and error states
  if (teamsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass rounded-xl p-8 flex items-center space-x-4">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-400" />
          <span className="text-lg text-white/80">Loading scheduling data...</span>
        </div>
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="space-y-8">
        <div className="glass-strong border border-error-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 bg-error-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-error-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">Error Loading Team Data</h3>
              <p className="mt-2 text-white/70">{teamsError}</p>
              <button
                onClick={refetchTeams}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Route Management</h1>
        <p className="text-xl text-white/80">Optimize and manage routes with intelligent assignment algorithms</p>
      </div>

      {/* Controls */}
      <div className="flex justify-end items-center space-x-3 mb-8">
        <button
          onClick={() => setShowOptimizationPanel(true)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md"
          disabled={isLoading}
        >
          Optimization Settings
        </button>
        
        <button
          onClick={runOptimization}
          disabled={optimizationInProgress || installations.length === 0 || teams.length === 0}
          className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50"
        >
          {optimizationInProgress ? 'Optimizing...' : 'Run Optimization'}
        </button>
      </div>

      {/* Metrics Overview */}
      {schedulingResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <OptimizationMetricsCard
            title="Total Assignments"
            value={schedulingResult.assignments.length}
            total={installations.length}
            icon={Calendar}
            color="blue"
          />
          
          <OptimizationMetricsCard
            title="Travel Distance"
            value={`${Math.round(schedulingResult.optimizationMetrics.totalTravelDistance)} mi`}
            subtitle={`${Math.round(schedulingResult.optimizationMetrics.geographicEfficiency * 100)}% efficient`}
            icon={MapPin}
            color="green"
          />
          
          <OptimizationMetricsCard
            title="Team Utilization"
            value={`${Math.round(schedulingResult.optimizationMetrics.utilizationRate * 100)}%`}
            subtitle={`${teams.length} team members`}
            icon={Users}
            color="purple"
          />
          
          <OptimizationMetricsCard
            title="Conflicts"
            value={schedulingResult.conflicts.length}
            subtitle={schedulingResult.conflicts.length > 0 ? "Needs attention" : "All resolved"}
            icon={AlertTriangle}
            color={schedulingResult.conflicts.length > 0 ? "red" : "green"}
          />
        </div>
      )}

      {/* Conflicts Alert */}
      {schedulingResult && schedulingResult.conflicts.length > 0 && (
        <div className="mb-6 alert-glass alert-error">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-glass-primary font-medium">
                {schedulingResult.conflicts.length} scheduling conflicts detected
              </span>
            </div>
            <button
              onClick={() => setShowConflictPanel(true)}
              className="text-red-300 hover:text-red-200 font-medium transition-colors"
            >
              Review Conflicts
            </button>
          </div>
        </div>
      )}

      {/* View Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex glass rounded-lg p-1">
              {(['calendar', 'list', 'timeline', 'map'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => handleViewChange(view)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewConfig.viewType === view
                      ? 'btn-primary text-white'
                      : 'text-glass-secondary hover:text-glass-primary hover:bg-white/10'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-glass-muted" />
              <input
                type="date"
                value={viewConfig.dateRange.start}
                onChange={(e) => setViewConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="form-input text-sm"
              />
              <span className="text-glass-muted">to</span>
              <input
                type="date"
                value={viewConfig.dateRange.end}
                onChange={(e) => setViewConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="form-input text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBulkAssignmentModal(true)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md text-sm disabled:opacity-50"
              disabled={!schedulingResult}
            >
              Bulk Actions
            </button>
            
            <button
              onClick={handleExportSchedule}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md text-sm disabled:opacity-50"
              disabled={!schedulingResult}
            >
              Export Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Main Schedule View */}
      <div className="mb-8">
        {schedulingResult ? (
          <>
            {viewConfig.viewType === 'calendar' && (
              <ScheduleCalendarView
                schedulingResult={schedulingResult}
                teams={teams}
                viewConfig={viewConfig}
                onAssignmentChange={handleDragDropAssignment}
              />
            )}
            
            {viewConfig.viewType === 'list' && (
              <ScheduleListView
                schedulingResult={schedulingResult}
                teams={teams}
                viewConfig={viewConfig}
                onAssignmentChange={handleDragDropAssignment}
              />
            )}
            
            {viewConfig.viewType === 'map' && (
              <ScheduleMapView
                schedulingResult={schedulingResult}
                teams={teams}
                viewConfig={viewConfig}
              />
            )}
            
            {viewConfig.viewType === 'timeline' && (
              <ScheduleListView
                schedulingResult={schedulingResult}
                teams={teams}
                viewConfig={viewConfig}
                onAssignmentChange={handleDragDropAssignment}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-glass-muted mb-4">
              {installations.length === 0 ? (
                <>
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-glass-muted" />
                  <p className="text-lg text-glass-secondary">No installations available for scheduling</p>
                  <p className="text-sm text-glass-muted">Import installation data to get started</p>
                </>
              ) : teams.length === 0 ? (
                <>
                  <Users className="w-12 h-12 mx-auto mb-4 text-glass-muted" />
                  <p className="text-lg text-glass-secondary">No team members available for assignment</p>
                  <p className="text-sm text-glass-muted">Add team members to get started with scheduling</p>
                </>
              ) : optimizationInProgress ? (
                <>
                  <div className="loading-spinner mx-auto mb-4" style={{width: '3rem', height: '3rem'}}></div>
                  <p className="text-lg text-glass-secondary">Running schedule optimization...</p>
                  <p className="text-sm text-glass-muted">This may take a few moments</p>
                </>
              ) : (
                <>
                  <PlayCircle className="w-12 h-12 mx-auto mb-4 text-glass-muted" />
                  <p className="text-lg text-glass-secondary">Ready to optimize schedule</p>
                  <p className="text-sm text-glass-muted">Click "Run Optimization" to generate assignments</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Team Workload Chart */}
      {schedulingResult && (
        <div className="mb-8">
          <TeamWorkloadChart
            assignments={schedulingResult.assignments}
            teams={teams}
            metrics={schedulingResult.optimizationMetrics}
          />
        </div>
      )}

      {/* Modals and Panels */}
      {showOptimizationPanel && (
        <ScheduleOptimizationPanel
          onClose={() => setShowOptimizationPanel(false)}
          onOptimize={runOptimization}
          teams={teams}
          installations={installations}
        />
      )}

      {showConflictPanel && schedulingResult && (
        <ConflictResolutionPanel
          conflicts={schedulingResult.conflicts}
          assignments={schedulingResult.assignments}
          teams={teams}
          onClose={() => setShowConflictPanel(false)}
          onResolve={(resolvedAssignments) => {
            setSchedulingResult(prev => prev ? {
              ...prev,
              assignments: resolvedAssignments
            } : null);
          }}
        />
      )}

      {showBulkAssignmentModal && schedulingResult && (
        <BulkAssignmentModal
          assignments={schedulingResult.assignments}
          teams={teams}
          onClose={() => setShowBulkAssignmentModal(false)}
          onBulkAction={(updatedAssignments) => {
            setSchedulingResult(prev => prev ? {
              ...prev,
              assignments: updatedAssignments
            } : null);
          }}
        />
      )}
    </div>
  );
};

export default SchedulingDashboard;