// Think Tank Technologies Installation Scheduler - Enhanced Map View

import React, { useState, useCallback, useMemo } from 'react';
import { MapPin, Navigation, Route, Settings, BarChart3 } from 'lucide-react';
import type { SchedulingResult, TeamMember, ScheduleViewConfig, Installation } from '../../types';
import InteractiveMap from '../mapping/InteractiveMap';
import RouteOptimizationPanel from '../mapping/RouteOptimizationPanel';
import GeographicAnalytics from '../mapping/GeographicAnalytics';

interface ScheduleMapViewProps {
  schedulingResult: SchedulingResult;
  teams: TeamMember[];
  viewConfig: ScheduleViewConfig;
}

type MapViewMode = 'map' | 'optimization' | 'analytics';

/**
 * Enhanced Map View Component for Geographic Schedule Visualization
 * 
 * Features:
 * - Interactive map with clustered job markers
 * - Real-time route optimization
 * - Geographic performance analytics
 * - Team workload distribution
 * - Territory coverage analysis
 */
const ScheduleMapView: React.FC<ScheduleMapViewProps> = ({
  schedulingResult,
  teams,
  viewConfig
}) => {
  const [activeMode, setActiveMode] = useState<MapViewMode>('map');
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>();
  const [selectedJob, setSelectedJob] = useState<Installation | null>(null);

  // Extract jobs from scheduling result
  const jobs = useMemo(() => {
    // This would typically come from a jobs prop or be fetched
    // For now, we'll create mock jobs from assignments
    return schedulingResult.assignments.map(assignment => ({
      id: assignment.installationId,
      customerName: `Customer ${assignment.installationId.slice(-4)}`,
      customerPhone: '(555) 123-4567',
      customerEmail: 'customer@example.com',
      address: {
        street: '123 Main St',
        city: 'Sample City',
        state: 'CA',
        zipCode: '90210',
        coordinates: { lat: 34.0522 + Math.random() * 2 - 1, lng: -118.2437 + Math.random() * 2 - 1 }
      },
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      duration: 120,
      status: 'scheduled' as const,
      priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }, [schedulingResult.assignments]);

  // Handle job selection
  const handleJobSelect = useCallback((job: Installation) => {
    setSelectedJob(job);
    console.log('Selected job:', job);
  }, []);

  // Handle team selection
  const handleTeamSelect = useCallback((team: TeamMember) => {
    setSelectedTeam(team.id);
    console.log('Selected team:', team);
  }, []);

  // Handle route optimization
  const handleRouteOptimize = useCallback((teamId: string, teamJobs: Installation[]) => {
    console.log('Optimizing route for team:', teamId, 'with jobs:', teamJobs);
  }, []);

  // Handle optimization completion
  const handleOptimizationComplete = useCallback((results: any) => {
    console.log('Optimization completed:', results);
  }, []);

  // Handle route selection
  const handleRouteSelect = useCallback((teamId: string, route: any) => {
    console.log('Route selected for team:', teamId, route);
  }, []);

  // Handle analytics export
  const handleAnalyticsExport = useCallback((data: any) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `geographic-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Mode Selection Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveMode('map')}
          className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeMode === 'map'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Interactive Map
        </button>
        
        <button
          onClick={() => setActiveMode('optimization')}
          className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeMode === 'optimization'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Route className="w-4 h-4 mr-2" />
          Route Optimization
        </button>
        
        <button
          onClick={() => setActiveMode('analytics')}
          className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeMode === 'analytics'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Geographic Analytics
        </button>
        
        {/* Summary Stats */}
        <div className="ml-auto flex items-center space-x-6 px-4 py-3 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1 text-blue-500" />
            <span className="font-medium text-blue-900">{schedulingResult.assignments.length}</span>
            <span className="ml-1">Jobs</span>
          </div>
          <div className="flex items-center">
            <Navigation className="w-4 h-4 mr-1 text-green-500" />
            <span className="font-medium text-green-900">{teams.length}</span>
            <span className="ml-1">Teams</span>
          </div>
          <div className="flex items-center">
            <Route className="w-4 h-4 mr-1 text-purple-500" />
            <span className="font-medium text-purple-900">
              {Math.round(schedulingResult.optimizationMetrics.totalTravelDistance)}
            </span>
            <span className="ml-1">Miles</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeMode === 'map' && (
          <InteractiveMap
            jobs={jobs}
            teams={teams}
            assignments={schedulingResult.assignments}
            selectedTeam={selectedTeam}
            onJobSelect={handleJobSelect}
            onTeamSelect={handleTeamSelect}
            onRouteOptimize={handleRouteOptimize}
            className="h-full"
          />
        )}

        {activeMode === 'optimization' && (
          <div className="h-full overflow-auto p-6">
            <RouteOptimizationPanel
              jobs={jobs}
              teams={teams}
              assignments={schedulingResult.assignments}
              selectedTeam={selectedTeam}
              onOptimizationComplete={handleOptimizationComplete}
              onRouteSelect={handleRouteSelect}
            />
          </div>
        )}

        {activeMode === 'analytics' && (
          <div className="h-full overflow-auto p-6">
            <GeographicAnalytics
              jobs={jobs}
              teams={teams}
              assignments={schedulingResult.assignments}
              dateRange={{
                start: viewConfig.dateRange.start,
                end: viewConfig.dateRange.end
              }}
              onExport={handleAnalyticsExport}
            />
          </div>
        )}
      </div>

      {/* Selected Job Details Panel (if job is selected) */}
      {selectedJob && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Job Details</h3>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div><strong>Customer:</strong> {selectedJob.customerName}</div>
            <div><strong>Address:</strong> {selectedJob.address.street}, {selectedJob.address.city}</div>
            <div><strong>Priority:</strong> 
              <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                selectedJob.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                selectedJob.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                selectedJob.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedJob.priority}
              </span>
            </div>
            <div><strong>Date:</strong> {new Date(selectedJob.scheduledDate).toLocaleDateString()}</div>
            <div><strong>Time:</strong> {selectedJob.scheduledTime}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleMapView;