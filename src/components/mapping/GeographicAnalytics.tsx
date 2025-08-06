// Think Tank Technologies Installation Scheduler - Geographic Analytics Component

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  MapPin, 
  Users, 
  Target, 
  AlertCircle,
  CheckCircle,
  Clock,
  Route,
  DollarSign,
  Activity,
  Download
} from 'lucide-react';
import type { 
  Installation, 
  TeamMember, 
  OptimizedAssignment
} from '../../types';
import { 
  calculateTerritoryCoverage,
  calculateWorkloadDistribution,
  groupJobsByState
} from '../../utils/geographicUtils';

interface GeographicAnalyticsProps {
  jobs: Installation[];
  teams: TeamMember[];
  assignments: OptimizedAssignment[];
  dateRange?: {
    start: string;
    end: string;
  };
  onExport?: (data: any) => void;
  className?: string;
}

interface RegionMetrics {
  region: string;
  totalJobs: number;
  completedJobs: number;
  teamCount: number;
  avgDistance: number;
  coverage: number;
  efficiency: number;
  utilization: number;
}

interface PerformanceMetrics {
  totalCoverage: number;
  avgTravelDistance: number;
  teamEfficiency: number;
  regionBalance: number;
  costPerJob: number;
  timeEfficiency: number;
}

/**
 * Geographic Analytics Component
 * 
 * Features:
 * - Territory coverage analysis and visualization
 * - Regional performance comparisons
 * - Team distribution and workload analysis
 * - Geographic efficiency metrics
 * - Service area optimization insights
 * - Interactive charts and heatmaps
 */
const GeographicAnalytics: React.FC<GeographicAnalyticsProps> = ({
  jobs,
  teams,
  assignments,
  dateRange,
  onExport,
  className = ''
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'coverage' | 'efficiency' | 'workload' | 'cost'>('coverage');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);

  // Calculate region metrics
  const regionMetrics = useMemo(() => {
    const jobsByState = groupJobsByState(jobs);
    const metrics: RegionMetrics[] = [];

    Object.entries(jobsByState).forEach(([state, stateJobs]) => {
      const regionTeams = teams.filter(team => 
        team.region === state || team.subRegions?.includes(state)
      );
      
      const regionAssignments = assignments.filter(assignment => {
        const job = jobs.find(j => j.id === assignment.installationId);
        return job?.address.state === state;
      });

      const completedJobs = stateJobs.filter(job => job.status === 'completed').length;
      const totalDistance = regionAssignments.reduce((sum, a) => 
        sum + (a.estimatedTravelDistance || 0), 0
      );
      const avgDistance = regionAssignments.length > 0 ? 
        totalDistance / regionAssignments.length : 0;

      // Calculate coverage using territory analysis
      const coverage = calculateTerritoryCoverage(stateJobs);
      const efficiency = totalDistance > 0 ? (stateJobs.length / totalDistance) * 100 : 0;
      const utilization = regionTeams.length > 0 ? 
        (regionAssignments.length / (regionTeams.length * 8)) * 100 : 0; // Assuming 8 jobs per team max

      metrics.push({
        region: state,
        totalJobs: stateJobs.length,
        completedJobs,
        teamCount: regionTeams.length,
        avgDistance: Math.round(avgDistance * 100) / 100,
        coverage: Math.round(coverage.area * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        utilization: Math.round(utilization * 100) / 100
      });
    });

    return metrics.sort((a, b) => b.totalJobs - a.totalJobs);
  }, [jobs, teams, assignments]);

  // Calculate overall performance metrics
  const performanceMetrics = useMemo((): PerformanceMetrics => {
    const totalCoverage = calculateTerritoryCoverage(jobs);
    const totalDistance = assignments.reduce((sum, a) => sum + (a.estimatedTravelDistance || 0), 0);
    const totalTime = assignments.reduce((sum, a) => sum + (a.estimatedTravelTime || 0), 0);
    const workloadDist = calculateWorkloadDistribution(assignments, teams);

    return {
      totalCoverage: Math.round(totalCoverage.area * 100) / 100,
      avgTravelDistance: assignments.length > 0 ? 
        Math.round((totalDistance / assignments.length) * 100) / 100 : 0,
      teamEfficiency: Math.round(workloadDist.averageUtilization * 100) / 100,
      regionBalance: Math.round((100 - workloadDist.workloadVariance / 10) * 100) / 100,
      costPerJob: assignments.length > 0 ? 
        Math.round(((totalDistance * 0.5 + totalTime / 60 * 25) / assignments.length) * 100) / 100 : 0,
      timeEfficiency: totalTime > 0 ? Math.round((totalDistance / totalTime) * 60 * 100) / 100 : 0
    };
  }, [jobs, assignments, teams]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const filtered = filterRegion === 'all' ? regionMetrics : 
      regionMetrics.filter(r => r.region === filterRegion);

    return {
      regionComparison: filtered.map(region => ({
        name: region.region,
        jobs: region.totalJobs,
        teams: region.teamCount,
        efficiency: region.efficiency,
        utilization: region.utilization,
        coverage: region.coverage
      })),
      
      efficiencyDistribution: filtered.map(region => ({
        region: region.region,
        efficiency: region.efficiency,
        utilization: region.utilization
      })),

      workloadBalance: teams.map(team => {
        const teamAssignments = assignments.filter(a => 
          a.leadId === team.id || a.assistantId === team.id
        );
        const totalDistance = teamAssignments.reduce((sum, a) => 
          sum + (a.estimatedTravelDistance || 0), 0
        );
        
        return {
          name: `${team.firstName} ${team.lastName}`,
          jobs: teamAssignments.length,
          distance: Math.round(totalDistance * 100) / 100,
          region: team.region
        };
      }),

      geographicSpread: regionMetrics.map(region => ({
        region: region.region,
        coverage: region.coverage,
        density: region.totalJobs / Math.max(region.coverage, 1)
      }))
    };
  }, [regionMetrics, teams, assignments, filterRegion]);

  // Color schemes for charts
  const colors = {
    primary: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
    efficiency: ['#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444'],
    regions: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#14b8a6']
  };

  // Export analytics data
  const exportAnalytics = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      dateRange,
      performanceMetrics,
      regionMetrics,
      chartData,
      summary: {
        totalJobs: jobs.length,
        totalTeams: teams.length,
        totalRegions: regionMetrics.length,
        avgEfficiency: regionMetrics.reduce((sum, r) => sum + r.efficiency, 0) / regionMetrics.length
      }
    };

    onExport?.(exportData);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Geographic Analytics</h2>
              <p className="text-sm text-gray-600">Territory coverage and performance insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Regions</option>
              {regionMetrics.map(region => (
                <option key={region.region} value={region.region}>{region.region}</option>
              ))}
            </select>
            <button
              onClick={exportAnalytics}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-lg font-bold text-blue-900">{performanceMetrics.totalCoverage}</div>
                <div className="text-xs text-blue-600">Coverage (sq mi)</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Route className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-lg font-bold text-green-900">{performanceMetrics.avgTravelDistance}</div>
                <div className="text-xs text-green-600">Avg Distance</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <div className="text-lg font-bold text-purple-900">{performanceMetrics.teamEfficiency}%</div>
                <div className="text-xs text-purple-600">Team Efficiency</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <div className="text-lg font-bold text-orange-900">{performanceMetrics.regionBalance}%</div>
                <div className="text-xs text-orange-600">Region Balance</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <div className="text-lg font-bold text-red-900">${performanceMetrics.costPerJob}</div>
                <div className="text-xs text-red-600">Cost per Job</div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-indigo-600 mr-2" />
              <div>
                <div className="text-lg font-bold text-indigo-900">{performanceMetrics.timeEfficiency}</div>
                <div className="text-xs text-indigo-600">Time Efficiency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Selection Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          {[
            { key: 'coverage', label: 'Coverage Analysis', icon: MapPin },
            { key: 'efficiency', label: 'Efficiency Metrics', icon: TrendingUp },
            { key: 'workload', label: 'Workload Distribution', icon: Users },
            { key: 'cost', label: 'Cost Analysis', icon: DollarSign }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key as any)}
              className={`flex items-center px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                selectedMetric === key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Chart Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regional Comparison Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Regional Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.regionComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedMetric === 'coverage' && (
                  <>
                    <Bar dataKey="jobs" fill={colors.primary[0]} name="Total Jobs" />
                    <Bar dataKey="coverage" fill={colors.primary[1]} name="Coverage (sq mi)" />
                  </>
                )}
                {selectedMetric === 'efficiency' && (
                  <>
                    <Bar dataKey="efficiency" fill={colors.efficiency[0]} name="Efficiency Score" />
                    <Bar dataKey="utilization" fill={colors.efficiency[1]} name="Utilization %" />
                  </>
                )}
                {selectedMetric === 'workload' && (
                  <>
                    <Bar dataKey="jobs" fill={colors.primary[2]} name="Jobs Assigned" />
                    <Bar dataKey="teams" fill={colors.primary[3]} name="Team Count" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {selectedMetric === 'coverage' ? 'Geographic Spread' :
               selectedMetric === 'efficiency' ? 'Efficiency Distribution' :
               selectedMetric === 'workload' ? 'Team Workload' : 'Cost Distribution'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              {selectedMetric === 'workload' ? (
                <ScatterChart data={chartData.workloadBalance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jobs" name="Jobs" />
                  <YAxis dataKey="distance" name="Distance" />
                  <Tooltip />
                  <Scatter data={chartData.workloadBalance} fill={colors.primary[2]} />
                </ScatterChart>
              ) : selectedMetric === 'efficiency' ? (
                <LineChart data={chartData.efficiencyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="efficiency" stroke={colors.efficiency[0]} />
                  <Line type="monotone" dataKey="utilization" stroke={colors.efficiency[1]} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData.regionComparison.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey={selectedMetric === 'coverage' ? 'coverage' : 'jobs'}
                    nameKey="name"
                  >
                    {chartData.regionComparison.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors.regions[index % colors.regions.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Details Table */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Regional Details</h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {showDetails && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teams
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coverage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {regionMetrics.map((region) => (
                    <tr key={region.region} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {region.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {region.totalJobs} ({region.completedJobs} completed)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {region.teamCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {region.coverage} sq mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {region.efficiency}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {region.utilization}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {region.efficiency > 80 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Optimal
                          </span>
                        ) : region.efficiency > 60 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Good
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Needs Improvement
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalytics;