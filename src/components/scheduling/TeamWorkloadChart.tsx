// Think Tank Technologies Installation Scheduler - Team Workload Chart

import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, MapPin, Clock } from 'lucide-react';
import type {
  OptimizedAssignment,
  TeamMember,
  OptimizationMetrics
} from '../../types';

interface TeamWorkloadChartProps {
  assignments: OptimizedAssignment[];
  teams: TeamMember[];
  metrics: OptimizationMetrics;
}

interface TeamWorkloadData {
  teamId: string;
  teamName: string;
  region: string;
  assignmentCount: number;
  totalTravelDistance: number;
  totalTravelTime: number;
  averageEfficiency: number;
  utilizationRate: number;
  capacity: number;
}

/**
 * Team Workload Chart Component
 * 
 * Visualizes team workload distribution, utilization rates,
 * and performance metrics across all team members
 */
const TeamWorkloadChart: React.FC<TeamWorkloadChartProps> = ({
  assignments,
  teams,
  metrics
}) => {
  // Calculate workload data for each team member
  const workloadData = useMemo((): TeamWorkloadData[] => {
    return teams.map(team => {
      const teamAssignments = assignments.filter(
        assignment => assignment.leadId === team.id || assignment.assistantId === team.id
      );

      const totalTravelDistance = teamAssignments.reduce(
        (sum, assignment) => sum + assignment.estimatedTravelDistance, 0
      );

      const totalTravelTime = teamAssignments.reduce(
        (sum, assignment) => sum + assignment.estimatedTravelTime, 0
      );

      const averageEfficiency = teamAssignments.length > 0
        ? teamAssignments.reduce((sum, assignment) => sum + assignment.efficiencyScore, 0) / teamAssignments.length
        : 0;

      const utilizationRate = team.capacity > 0 ? teamAssignments.length / team.capacity : 0;

      return {
        teamId: team.id,
        teamName: `${team.firstName} ${team.lastName}`,
        region: team.region,
        assignmentCount: teamAssignments.length,
        totalTravelDistance: Math.round(totalTravelDistance),
        totalTravelTime: Math.round(totalTravelTime),
        averageEfficiency,
        utilizationRate,
        capacity: team.capacity
      };
    });
  }, [assignments, teams]);

  // Calculate max values for chart scaling
  const maxAssignments = Math.max(...workloadData.map(d => d.assignmentCount), 1);
  const maxTravelDistance = Math.max(...workloadData.map(d => d.totalTravelDistance), 1);
  const averageAssignments = workloadData.reduce((sum, d) => sum + d.assignmentCount, 0) / workloadData.length;

  // Get utilization color
  const getUtilizationColor = (rate: number) => {
    if (rate > 1) return 'text-red-600 bg-red-100';
    if (rate > 0.8) return 'text-yellow-600 bg-yellow-100';
    if (rate > 0.6) return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  // Get efficiency color
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency > 0.8) return 'bg-green-500';
    if (efficiency > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Format percentage
  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Team Workload Analysis</h2>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{workloadData.length} team members</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Avg: {Math.round(averageAssignments)} jobs/person</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Total Assignments</div>
          <div className="text-2xl font-bold text-blue-900">{assignments.length}</div>
          <div className="text-blue-600 text-xs">
            {formatPercentage(metrics.utilizationRate)} capacity used
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Travel Distance</div>
          <div className="text-2xl font-bold text-green-900">
            {Math.round(metrics.totalTravelDistance)} mi
          </div>
          <div className="text-green-600 text-xs">
            {formatPercentage(metrics.geographicEfficiency)} efficiency
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium">Workload Balance</div>
          <div className="text-2xl font-bold text-purple-900">
            {metrics.workloadVariance.toFixed(1)}
          </div>
          <div className="text-purple-600 text-xs">
            {metrics.workloadVariance < 1 ? 'Well balanced' : 'Needs balancing'}
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-yellow-600 text-sm font-medium">Avg Jobs/Person</div>
          <div className="text-2xl font-bold text-yellow-900">
            {metrics.averageJobsPerTeamMember.toFixed(1)}
          </div>
          <div className="text-yellow-600 text-xs">
            Current distribution
          </div>
        </div>
      </div>

      {/* Team Workload Chart */}
      <div className="p-6">
        <div className="space-y-4">
          {workloadData.map((data) => (
            <div key={data.teamId} className="border border-gray-200 rounded-lg p-4">
              {/* Team Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">{data.teamName}</div>
                    <div className="text-sm text-gray-500">{data.region}</div>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getUtilizationColor(data.utilizationRate)}`}>
                  {formatPercentage(data.utilizationRate)} Utilized
                </div>
              </div>

              {/* Workload Bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                {/* Assignment Count */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Assignments</span>
                    <span className="font-medium">{data.assignmentCount} / {data.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        data.utilizationRate > 1 ? 'bg-red-500' :
                        data.utilizationRate > 0.8 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((data.assignmentCount / maxAssignments) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Travel Distance */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Travel Distance</span>
                    <span className="font-medium">{data.totalTravelDistance} mi</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(data.totalTravelDistance / maxTravelDistance) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Efficiency */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Efficiency</span>
                    <span className="font-medium">{formatPercentage(data.averageEfficiency)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getEfficiencyColor(data.averageEfficiency)}`}
                      style={{ width: `${data.averageEfficiency * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{data.totalTravelDistance} mi total</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.round(data.totalTravelTime / 60)} hrs travel</span>
                  </div>
                </div>
                
                <div className="text-right">
                  {data.assignmentCount > 0 && (
                    <span>
                      Avg: {Math.round(data.totalTravelDistance / data.assignmentCount)} mi/job
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm font-medium text-gray-700">Utilization Status:</div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Under 60%</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">60-80%</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">80-100%</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Over 100%</span>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing workload distribution across {workloadData.length} team members
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamWorkloadChart;