// Think Tank Technologies Installation Scheduler - Route Optimization Panel

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Route, 
  Navigation, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings
} from 'lucide-react';
import type { 
  Installation, 
  TeamMember, 
  TravelOptimization,
  RoutePoint,
  OptimizedAssignment
} from '../../types';
import { 
  optimizeMultiStopRoute,
  calculateWorkloadDistribution,
  findOptimalTeamAssignments 
} from '../../utils/geographicUtils';

interface RouteOptimizationPanelProps {
  jobs: Installation[];
  teams: TeamMember[];
  assignments: OptimizedAssignment[];
  selectedTeam?: string;
  onOptimizationComplete?: (results: OptimizationResults) => void;
  onRouteSelect?: (teamId: string, route: RoutePoint[]) => void;
  className?: string;
}

interface OptimizationResults {
  teamRoutes: { [teamId: string]: TravelOptimization };
  totalSavings: {
    distanceSaved: number;
    timeSaved: number;
    costSaved: number;
  };
  workloadDistribution: any;
  recommendations: string[];
}

interface OptimizationSettings {
  maxDistance: number;
  serviceTime: number;
  maxJobs: number;
  prioritizeUrgent: boolean;
  balanceWorkload: boolean;
  minimizeTravel: boolean;
}

/**
 * Route Optimization Panel Component
 * 
 * Features:
 * - Multi-team route optimization
 * - Real-time optimization progress
 * - Workload balancing controls
 * - Performance metrics display
 * - Route comparison and analysis
 * - Export optimization results
 */
const RouteOptimizationPanel: React.FC<RouteOptimizationPanelProps> = ({
  jobs,
  teams,
  assignments,
  selectedTeam,
  onOptimizationComplete,
  onRouteSelect,
  className = ''
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResults | null>(null);
  const [settings, setSettings] = useState<OptimizationSettings>({
    maxDistance: 100,
    serviceTime: 120,
    maxJobs: 8,
    prioritizeUrgent: true,
    balanceWorkload: true,
    minimizeTravel: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRouteTeam, setSelectedRouteTeam] = useState<string | null>(null);

  // Calculate current metrics
  const currentMetrics = React.useMemo(() => {
    const totalJobs = jobs.length;
    const assignedJobs = assignments.length;
    const totalDistance = assignments.reduce((sum, a) => sum + (a.estimatedTravelDistance || 0), 0);
    const totalTime = assignments.reduce((sum, a) => sum + (a.estimatedTravelTime || 0), 0);
    const averageJobsPerTeam = teams.length > 0 ? assignedJobs / teams.length : 0;

    return {
      totalJobs,
      assignedJobs,
      unassignedJobs: totalJobs - assignedJobs,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime: Math.round(totalTime),
      averageJobsPerTeam: Math.round(averageJobsPerTeam * 100) / 100,
      efficiency: totalDistance > 0 ? Math.round((assignedJobs / totalDistance) * 100) / 100 : 0
    };
  }, [jobs, assignments, teams]);

  // Run optimization for all teams
  const runOptimization = useCallback(async () => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    setOptimizationProgress(0);

    try {
      const teamRoutes: { [teamId: string]: TravelOptimization } = {};
      const totalTeams = teams.length;
      let completedTeams = 0;

      // Optimize routes for each team
      for (const team of teams) {
        const teamJobs = assignments
          .filter(a => a.leadId === team.id || a.assistantId === team.id)
          .map(a => jobs.find(j => j.id === a.installationId))
          .filter((job): job is Installation => job !== undefined)
          .slice(0, settings.maxJobs);

        if (teamJobs.length > 0) {
          const constraints = {
            maxDistance: settings.maxDistance,
            serviceTime: settings.serviceTime,
            maxJobs: settings.maxJobs
          };

          const optimization = await optimizeMultiStopRoute(teamJobs, team, constraints);
          teamRoutes[team.id] = optimization;
        }

        completedTeams++;
        setOptimizationProgress((completedTeams / totalTeams) * 100);
      }

      // Calculate workload distribution
      const workloadDistribution = calculateWorkloadDistribution(assignments, teams);

      // Calculate total savings
      const totalSavings = {
        distanceSaved: Object.values(teamRoutes).reduce((sum, route) => 
          sum + route.savings.distanceSaved, 0
        ),
        timeSaved: Object.values(teamRoutes).reduce((sum, route) => 
          sum + route.savings.timeSaved, 0
        ),
        costSaved: 0 // Will be calculated based on distance and time savings
      };

      // Add cost calculation (assuming $0.50/mile and $25/hour)
      totalSavings.costSaved = (totalSavings.distanceSaved * 0.50) + 
                               (totalSavings.timeSaved / 60 * 25);

      // Generate recommendations
      const recommendations = generateRecommendations(
        teamRoutes, 
        workloadDistribution, 
        currentMetrics
      );

      const results: OptimizationResults = {
        teamRoutes,
        totalSavings,
        workloadDistribution,
        recommendations
      };

      setOptimizationResults(results);
      onOptimizationComplete?.(results);

    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  }, [isOptimizing, teams, assignments, jobs, settings, currentMetrics, onOptimizationComplete]);

  // Generate optimization recommendations
  const generateRecommendations = (
    teamRoutes: { [teamId: string]: TravelOptimization },
    workloadDistribution: any,
    metrics: any
  ): string[] => {
    const recommendations: string[] = [];

    // Check for high travel distances
    const highTravelTeams = Object.entries(teamRoutes).filter(([_, route]) => 
      route.totalDistance > settings.maxDistance * 0.8
    );
    
    if (highTravelTeams.length > 0) {
      recommendations.push(
        `${highTravelTeams.length} team(s) have high travel distances. Consider redistributing jobs.`
      );
    }

    // Check workload balance
    if (workloadDistribution.workloadVariance > 400) {
      recommendations.push('Workload is unbalanced. Some teams are overloaded while others are underutilized.');
    }

    // Check efficiency
    if (metrics.efficiency < 0.5) {
      recommendations.push('Route efficiency is low. Consider clustering jobs geographically.');
    }

    // Check unassigned jobs
    if (metrics.unassignedJobs > 0) {
      recommendations.push(`${metrics.unassignedJobs} job(s) remain unassigned. Consider expanding team capacity.`);
    }

    return recommendations;
  };

  // Export optimization results
  const exportResults = () => {
    if (!optimizationResults) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      settings,
      currentMetrics,
      optimizationResults,
      teams: teams.map(team => ({
        id: team.id,
        name: `${team.firstName} ${team.lastName}`,
        region: team.region,
        route: optimizationResults.teamRoutes[team.id]
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `route-optimization-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Route className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Route Optimization</h2>
              <p className="text-sm text-gray-600">Optimize team routes and workload distribution</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <Settings className="w-5 h-5" />
            </button>
            {optimizationResults && (
              <button
                onClick={exportResults}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Optimization Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Distance per Route (miles)
              </label>
              <input
                type="number"
                value={settings.maxDistance}
                onChange={(e) => setSettings(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Time per Job (minutes)
              </label>
              <input
                type="number"
                value={settings.serviceTime}
                onChange={(e) => setSettings(prev => ({ ...prev, serviceTime: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Jobs per Team
              </label>
              <input
                type="number"
                value={settings.maxJobs}
                onChange={(e) => setSettings(prev => ({ ...prev, maxJobs: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.prioritizeUrgent}
                onChange={(e) => setSettings(prev => ({ ...prev, prioritizeUrgent: e.target.checked }))}
                className="mr-2"
              />
              Prioritize Urgent Jobs
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.balanceWorkload}
                onChange={(e) => setSettings(prev => ({ ...prev, balanceWorkload: e.target.checked }))}
                className="mr-2"
              />
              Balance Team Workload
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.minimizeTravel}
                onChange={(e) => setSettings(prev => ({ ...prev, minimizeTravel: e.target.checked }))}
                className="mr-2"
              />
              Minimize Travel Distance
            </label>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Current Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{currentMetrics.totalJobs}</div>
                <div className="text-sm text-blue-600">Total Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-2xl font-bold text-green-900">{currentMetrics.assignedJobs}</div>
                <div className="text-sm text-green-600">Assigned</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Route className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <div className="text-2xl font-bold text-purple-900">{currentMetrics.totalDistance}</div>
                <div className="text-sm text-purple-600">Miles Total</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <div className="text-2xl font-bold text-orange-900">{currentMetrics.efficiency}</div>
                <div className="text-sm text-orange-600">Efficiency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={runOptimization}
            disabled={isOptimizing}
            className={`px-6 py-3 rounded-lg font-medium flex items-center ${
              isOptimizing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isOptimizing ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Run Optimization
              </>
            )}
          </button>

          {isOptimizing && (
            <div className="flex-1 ml-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${optimizationProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {Math.round(optimizationProgress)}% complete
              </div>
            </div>
          )}
        </div>

        {/* Optimization Results */}
        {optimizationResults && (
          <div className="space-y-6">
            {/* Savings Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Optimization Savings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {Math.round(optimizationResults.totalSavings.distanceSaved * 100) / 100}
                  </div>
                  <div className="text-sm text-green-600">Miles Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {Math.round(optimizationResults.totalSavings.timeSaved)}
                  </div>
                  <div className="text-sm text-green-600">Minutes Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">
                    ${Math.round(optimizationResults.totalSavings.costSaved)}
                  </div>
                  <div className="text-sm text-green-600">Cost Saved</div>
                </div>
              </div>
            </div>

            {/* Team Routes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Optimized Team Routes</h3>
              <div className="space-y-3">
                {Object.entries(optimizationResults.teamRoutes).map(([teamId, route]) => {
                  const team = teams.find(t => t.id === teamId);
                  if (!team) return null;

                  return (
                    <div
                      key={teamId}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedRouteTeam === teamId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedRouteTeam(teamId === selectedRouteTeam ? null : teamId);
                        onRouteSelect?.(teamId, route.route);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {team.firstName} {team.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {route.route.length} jobs • {Math.round(route.totalDistance * 100) / 100} mi • {Math.round(route.totalTime)} min
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {route.savings.percentageImprovement.toFixed(1)}% improvement
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(route.savings.distanceSaved * 100) / 100} mi saved
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            {optimizationResults.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {optimizationResults.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-yellow-800">
                          • {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizationPanel;