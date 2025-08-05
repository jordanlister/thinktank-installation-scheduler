// Think Tank Technologies Installation Scheduler - Scheduling Dashboard

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Users, AlertTriangle, Settings, PlayCircle, Download } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
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

  // Mock team data - in production this would come from team management system
  const [teams] = useState<TeamMember[]>([
    {
      id: 'team_1',
      email: 'john.lead@thinktank.com',
      firstName: 'John',
      lastName: 'Smith',
      role: 'lead',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      region: 'Northeast',
      specializations: ['commercial', 'restaurant', 'retail'],
      capacity: 6,
      travelRadius: 100,
      coordinates: { lat: 40.7505, lng: -73.9971 },
      homeBase: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: { lat: 40.7505, lng: -73.9971 }
      },
      availability: [
        {
          id: 'avail_1',
          teamMemberId: 'team_1',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          startTime: '08:00',
          endTime: '18:00',
          isRecurring: true,
          recurringDays: [1, 2, 3, 4, 5],
          isAvailable: true
        }
      ],
      performanceMetrics: {
        completionRate: 0.95,
        averageTime: 110,
        customerSatisfaction: 4.8,
        travelEfficiency: 0.87,
        totalJobs: 245,
        totalDistance: 12400
      }
    },
    {
      id: 'team_2',
      email: 'sarah.lead@thinktank.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'lead',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      region: 'Southeast',
      specializations: ['commercial', 'healthcare', 'office'],
      capacity: 5,
      travelRadius: 80,
      coordinates: { lat: 33.7537, lng: -84.3863 },
      homeBase: {
        street: '456 Peachtree St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30301',
        coordinates: { lat: 33.7537, lng: -84.3863 }
      },
      availability: [
        {
          id: 'avail_2',
          teamMemberId: 'team_2',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          startTime: '07:00',
          endTime: '17:00',
          isRecurring: true,
          recurringDays: [1, 2, 3, 4, 5],
          isAvailable: true
        }
      ],
      performanceMetrics: {
        completionRate: 0.92,
        averageTime: 125,
        customerSatisfaction: 4.6,
        travelEfficiency: 0.84,
        totalJobs: 198,
        totalDistance: 9800
      }
    }
  ]);

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
    if (installations.length > 0 && !schedulingResult) {
      runOptimization();
    }
  }, [installations.length, runOptimization, schedulingResult]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-primary-900">Installation Scheduling</h1>
            <p className="mt-2 text-primary-600">
              Optimize and manage installation schedules with intelligent assignment algorithms
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowOptimizationPanel(true)}
              className="btn-secondary"
              disabled={isLoading}
            >
              <Settings className="w-4 h-4" />
              Optimization Settings
            </button>
            
            <button
              onClick={runOptimization}
              disabled={optimizationInProgress || installations.length === 0}
              className="btn-primary"
            >
              {optimizationInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Run Optimization
                </>
              )}
            </button>
          </div>
        </div>
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">
                {schedulingResult.conflicts.length} scheduling conflicts detected
              </span>
            </div>
            <button
              onClick={() => setShowConflictPanel(true)}
              className="text-red-600 hover:text-red-800 font-medium"
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
            <div className="flex bg-white border border-primary-200 rounded-lg p-1">
              {(['calendar', 'list', 'timeline', 'map'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => handleViewChange(view)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewConfig.viewType === view
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-600 hover:text-primary-800'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary-400" />
              <input
                type="date"
                value={viewConfig.dateRange.start}
                onChange={(e) => setViewConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="form-input text-sm"
              />
              <span className="text-primary-400">to</span>
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
              className="btn-secondary text-sm"
              disabled={!schedulingResult}
            >
              Bulk Actions
            </button>
            
            <button
              onClick={handleExportSchedule}
              className="btn-secondary text-sm"
              disabled={!schedulingResult}
            >
              <Download className="w-4 h-4" />
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
            <div className="text-primary-400 mb-4">
              {installations.length === 0 ? (
                <>
                  <Calendar className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg">No installations available for scheduling</p>
                  <p className="text-sm">Import installation data to get started</p>
                </>
              ) : optimizationInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
                  <p className="text-lg">Running schedule optimization...</p>
                  <p className="text-sm">This may take a few moments</p>
                </>
              ) : (
                <>
                  <PlayCircle className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg">Ready to optimize schedule</p>
                  <p className="text-sm">Click "Run Optimization" to generate assignments</p>
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