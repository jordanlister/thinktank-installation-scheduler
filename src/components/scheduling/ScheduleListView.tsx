// Think Tank Technologies Installation Scheduler - List View

import React, { useState, useMemo } from 'react';
import { MapPin, Clock, User, Filter, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import type {
  SchedulingResult,
  TeamMember,
  ScheduleViewConfig,
  OptimizedAssignment
} from '../../types';

interface ScheduleListViewProps {
  schedulingResult: SchedulingResult;
  teams: TeamMember[];
  viewConfig: ScheduleViewConfig;
  onAssignmentChange: (sourceJobId: string, targetTeamId: string, targetDate: string) => void;
}

/**
 * List View Component for Schedule Management
 * 
 * Provides a detailed list interface for viewing and managing
 * installation assignments with filtering and sorting capabilities
 */
const ScheduleListView: React.FC<ScheduleListViewProps> = ({
  schedulingResult,
  teams,
  viewConfig,
  onAssignmentChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'team' | 'distance' | 'efficiency'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  // Get team member by ID
  const getTeamMember = (teamId: string): TeamMember | undefined => {
    return teams.find(team => team.id === teamId);
  };

  // Get conflicts for an assignment
  const getAssignmentConflicts = (assignmentId: string) => {
    return schedulingResult.conflicts.filter(conflict =>
      conflict.affectedJobs.some(jobId => {
        const assignment = schedulingResult.assignments.find(a => a.installationId === jobId);
        return assignment?.id === assignmentId;
      })
    );
  };

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = [...schedulingResult.assignments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(assignment => {
        const teamId = assignment.leadId || assignment.assistantId;
        const team = getTeamMember(teamId);
        const teamName = team ? `${team.firstName} ${team.lastName}` : '';
        
        return (
          teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.installationId.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply team filter
    if (filterTeam !== 'all') {
      filtered = filtered.filter(assignment => 
        assignment.leadId === filterTeam || assignment.assistantId === filterTeam
      );
    }

    // Apply conflicts filter
    if (showConflictsOnly) {
      filtered = filtered.filter(assignment => 
        getAssignmentConflicts(assignment.id).length > 0
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'team':
          const aTeamId = a.leadId || a.assistantId;
          const bTeamId = b.leadId || b.assistantId;
          const aTeam = getTeamMember(aTeamId);
          const bTeam = getTeamMember(bTeamId);
          aValue = aTeam ? `${aTeam.firstName} ${aTeam.lastName}` : '';
          bValue = bTeam ? `${bTeam.firstName} ${bTeam.lastName}` : '';
          break;
        case 'distance':
          aValue = a.estimatedTravelDistance;
          bValue = b.estimatedTravelDistance;
          break;
        case 'efficiency':
          aValue = a.efficiencyScore;
          bValue = b.efficiencyScore;
          break;
        case 'date':
        default:
          aValue = new Date(a.assignedAt).getTime();
          bValue = new Date(b.assignedAt).getTime();
          break;
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [
    schedulingResult.assignments,
    searchTerm,
    filterTeam,
    showConflictsOnly,
    sortField,
    sortDirection,
    teams,
    schedulingResult.conflicts
  ]);

  // Handle sort change
  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get priority color
  const getPriorityColor = (conflicts: any[]) => {
    if (conflicts.length === 0) return 'text-green-600';
    
    const hasCritical = conflicts.some(c => c.severity === 'critical');
    const hasHigh = conflicts.some(c => c.severity === 'high');
    
    if (hasCritical) return 'text-red-600';
    if (hasHigh) return 'text-orange-600';
    return 'text-yellow-600';
  };

  // Format efficiency score
  const formatEfficiency = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header with Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assignment List</h2>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {filteredAndSortedAssignments.length} of {schedulingResult.assignments.length} assignments
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by team member or job ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Team Filter */}
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.firstName} {team.lastName}
              </option>
            ))}
          </select>

          {/* Conflicts Filter */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showConflictsOnly}
              onChange={(e) => setShowConflictsOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Conflicts only</span>
          </label>
        </div>
      </div>

      {/* Assignment List */}
      <div className="divide-y divide-gray-200">
        {/* Table Header */}
        <div className="px-6 py-3 bg-gray-50 grid grid-cols-7 gap-4 text-sm font-medium text-gray-500">
          <button
            onClick={() => handleSort('team')}
            className="flex items-center space-x-1 hover:text-gray-700 transition-colors text-left"
          >
            <span>Team Member</span>
            {sortField === 'team' && (
              <span className="text-primary-600">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          <div>Job ID</div>
          
          <button
            onClick={() => handleSort('distance')}
            className="flex items-center space-x-1 hover:text-gray-700 transition-colors text-left"
          >
            <span>Travel</span>
            {sortField === 'distance' && (
              <span className="text-primary-600">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handleSort('efficiency')}
            className="flex items-center space-x-1 hover:text-gray-700 transition-colors text-left"
          >
            <span>Efficiency</span>
            {sortField === 'efficiency' && (
              <span className="text-primary-600">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          <div>Workload</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Assignment Rows */}
        {filteredAndSortedAssignments.length > 0 ? (
          filteredAndSortedAssignments.map((assignment) => {
            const teamId = assignment.leadId || assignment.assistantId;
            const team = getTeamMember(teamId);
            const conflicts = getAssignmentConflicts(assignment.id);
            const statusColor = getPriorityColor(conflicts);

            return (
              <div
                key={assignment.id}
                className="px-6 py-4 grid grid-cols-7 gap-4 items-center hover:bg-gray-50 transition-colors"
              >
                {/* Team Member */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {team ? `${team.firstName} ${team.lastName}` : 'Unassigned'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {team?.region || 'No region'}
                    </div>
                  </div>
                </div>

                {/* Job ID */}
                <div className="text-sm font-mono text-gray-600">
                  {assignment.installationId}
                </div>

                {/* Travel Info */}
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <div className="text-gray-900">
                      {Math.round(assignment.estimatedTravelDistance)} mi
                    </div>
                    <div className="text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {assignment.estimatedTravelTime}min
                    </div>
                  </div>
                </div>

                {/* Efficiency */}
                <div className="text-sm">
                  <div className={`font-medium ${
                    assignment.efficiencyScore > 0.8 ? 'text-green-600' :
                    assignment.efficiencyScore > 0.6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formatEfficiency(assignment.efficiencyScore)}
                  </div>
                  <div className="text-gray-500">
                    Score: {assignment.workloadScore.toFixed(1)}
                  </div>
                </div>

                {/* Workload */}
                <div className="text-sm">
                  <div className="text-gray-900">
                    Buffer: {assignment.bufferTime}min
                  </div>
                  <div className="text-gray-500">
                    {assignment.previousJobId ? 'Chained' : 'First'}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  {conflicts.length > 0 ? (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className={`w-4 h-4 ${statusColor}`} />
                      <span className={`text-sm font-medium ${statusColor}`}>
                        {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Optimized</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    onClick={() => {
                      // Handle reassignment
                      console.log('Reassign assignment:', assignment.id);
                    }}
                  >
                    Reassign
                  </button>
                  
                  {conflicts.length > 0 && (
                    <button
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                      onClick={() => {
                        // Handle conflict resolution
                        console.log('Resolve conflicts for:', assignment.id);
                      }}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 mb-2">
              <Filter className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-gray-500">
              {searchTerm || filterTeam !== 'all' || showConflictsOnly 
                ? 'No assignments match your filters'
                : 'No assignments available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filteredAndSortedAssignments.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div>
                <span className="font-medium text-gray-900">
                  {filteredAndSortedAssignments.length}
                </span>
                <span className="text-gray-500"> assignments shown</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-900">
                  {Math.round(
                    filteredAndSortedAssignments.reduce((sum, a) => sum + a.estimatedTravelDistance, 0)
                  )} mi
                </span>
                <span className="text-gray-500"> total travel</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-900">
                  {Math.round(
                    filteredAndSortedAssignments.reduce((sum, a) => sum + a.estimatedTravelTime, 0) / 60
                  )} hrs
                </span>
                <span className="text-gray-500"> travel time</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-gray-600">Optimized</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-gray-600">Has Conflicts</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleListView;