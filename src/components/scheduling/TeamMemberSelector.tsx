// Think Tank Technologies - Team Member Selector Component

import React, { useState, useMemo } from 'react';
import {
  Search,
  User,
  Users,
  CheckSquare,
  Square,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { 
  TeamMember, 
  TeamMemberAvailability,
  BulkAssignmentData
} from '../../types';

interface TeamMemberSelectorProps {
  teams: TeamMember[];
  teamAvailability: TeamMemberAvailability[];
  selectedTeamIds: string[];
  assignmentType: 'lead' | 'assistant' | 'both';
  onTeamSelectionChange: (ids: string[]) => void;
  onAssignmentTypeChange: (type: 'lead' | 'assistant' | 'both') => void;
  overrideConflicts: boolean;
  preserveExisting: boolean;
  onOverrideConflictsChange: (override: boolean) => void;
  onPreserveExistingChange: (preserve: boolean) => void;
}

/**
 * Team Member Selector Component
 * 
 * Provides team selection interface with availability indicators and capacity management
 */
const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  teams,
  teamAvailability,
  selectedTeamIds,
  assignmentType,
  onTeamSelectionChange,
  onAssignmentTypeChange,
  overrideConflicts,
  preserveExisting,
  onOverrideConflictsChange,
  onPreserveExistingChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterByRole, setFilterByRole] = useState<string>('');
  const [filterByRegion, setFilterByRegion] = useState<string>('');
  const [filterByAvailability, setFilterByAvailability] = useState<'all' | 'available' | 'overloaded'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'utilization' | 'performance' | 'capacity'>('name');

  // Get availability data for a team member
  const getTeamAvailability = (teamId: string): TeamMemberAvailability | null => {
    return teamAvailability.find(a => a.teamMemberId === teamId) || null;
  };

  // Filter and sort team members
  const filteredTeams = useMemo(() => {
    let filtered = teams.filter(team => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          team.firstName.toLowerCase().includes(term) ||
          team.lastName.toLowerCase().includes(term) ||
          team.email.toLowerCase().includes(term) ||
          team.region.toLowerCase().includes(term) ||
          team.specializations?.some(spec => spec.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Role filter
      if (filterByRole && team.role !== filterByRole) return false;

      // Region filter
      if (filterByRegion && team.region !== filterByRegion) return false;

      // Availability filter
      if (filterByAvailability !== 'all') {
        const availability = getTeamAvailability(team.id);
        if (filterByAvailability === 'available' && (!availability || availability.availableSlots <= 0)) {
          return false;
        }
        if (filterByAvailability === 'overloaded' && (!availability || !availability.isOverloaded)) {
          return false;
        }
      }

      return team.isActive;
    });

    // Sort teams
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'utilization':
          const availA = getTeamAvailability(a.id);
          const availB = getTeamAvailability(b.id);
          return (availB?.utilizationPercentage || 0) - (availA?.utilizationPercentage || 0);
        case 'performance':
          const perfA = a.performanceMetrics?.completionRate || 0;
          const perfB = b.performanceMetrics?.completionRate || 0;
          return perfB - perfA;
        case 'capacity':
          return (b.capacity || 0) - (a.capacity || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [teams, searchTerm, filterByRole, filterByRegion, filterByAvailability, sortBy]);

  // Get unique regions and roles for filters
  const regions = useMemo(() => [...new Set(teams.map(t => t.region))], [teams]);
  const roles = useMemo(() => [...new Set(teams.map(t => t.role))], [teams]);

  // Handle team selection
  const handleToggleTeamSelection = (teamId: string) => {
    const newSelection = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter(id => id !== teamId)
      : [...selectedTeamIds, teamId];
    onTeamSelectionChange(newSelection);
  };

  // Handle select all available
  const handleSelectAllAvailable = () => {
    const availableTeamIds = filteredTeams
      .filter(team => {
        const availability = getTeamAvailability(team.id);
        return availability && availability.availableSlots > 0;
      })
      .map(team => team.id);

    const allAvailableSelected = availableTeamIds.every(id => selectedTeamIds.includes(id));
    
    if (allAvailableSelected) {
      onTeamSelectionChange(selectedTeamIds.filter(id => !availableTeamIds.includes(id)));
    } else {
      onTeamSelectionChange([...new Set([...selectedTeamIds, ...availableTeamIds])]);
    }
  };

  // Get utilization status color
  const getUtilizationColor = (percentage: number) => {
    if (percentage <= 60) return 'text-green-600 bg-green-50';
    if (percentage <= 85) return 'text-yellow-600 bg-yellow-50';
    if (percentage <= 100) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Get performance rating
  const getPerformanceRating = (member: TeamMember) => {
    if (!member.performanceMetrics) return null;
    
    const score = (
      member.performanceMetrics.completionRate * 0.3 +
      member.performanceMetrics.customerSatisfaction * 0.3 +
      member.performanceMetrics.qualityScore * 0.4
    );

    if (score >= 0.9) return { rating: 'Excellent', color: 'text-green-600' };
    if (score >= 0.8) return { rating: 'Good', color: 'text-blue-600' };
    if (score >= 0.7) return { rating: 'Average', color: 'text-yellow-600' };
    return { rating: 'Needs Improvement', color: 'text-red-600' };
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Assignment Type Selection */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        {/* Assignment Type Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Assignment Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
              <select
                value={assignmentType}
                onChange={(e) => onAssignmentTypeChange(e.target.value as typeof assignmentType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="lead">Lead Technician Only</option>
                <option value="assistant">Assistant Only</option>
                <option value="both">Lead + Assistant Team</option>
              </select>
            </div>

            {/* Override Conflicts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conflict Resolution</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={overrideConflicts}
                  onChange={(e) => onOverrideConflictsChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Override scheduling conflicts</span>
              </label>
            </div>

            {/* Preserve Existing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Existing Assignments</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preserveExisting}
                  onChange={(e) => onPreserveExistingChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Preserve existing assignments</span>
              </label>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members by name, region, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAllAvailable}
                className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Select All Available</span>
              </button>

              {selectedTeamIds.length > 0 && (
                <div className="text-sm text-gray-600">
                  {selectedTeamIds.length} team members selected
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort Control */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="utilization">Sort by Utilization</option>
                <option value="performance">Sort by Performance</option>
                <option value="capacity">Sort by Capacity</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={filterByRole}
                    onChange={(e) => setFilterByRole(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role} value={role} className="capitalize">
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={filterByRegion}
                    onChange={(e) => setFilterByRegion(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Regions</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select
                    value={filterByAvailability}
                    onChange={(e) => setFilterByAvailability(e.target.value as typeof filterByAvailability)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Team Members</option>
                    <option value="available">Available Only</option>
                    <option value="overloaded">Overloaded Only</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setFilterByRole('');
                    setFilterByRegion('');
                    setFilterByAvailability('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Members List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-center text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTeams.map(member => {
              const isSelected = selectedTeamIds.includes(member.id);
              const availability = getTeamAvailability(member.id);
              const performance = getPerformanceRating(member);
              
              return (
                <div
                  key={member.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => handleToggleTeamSelection(member.id)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <div className="flex items-center pt-1">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Member Avatar */}
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </h4>
                          <p className="text-sm text-gray-500 capitalize">
                            {member.role.replace('_', ' ')}
                          </p>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span>{member.region}</span>
                          </div>
                        </div>

                        {/* Availability and Performance Indicators */}
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          {/* Availability Status */}
                          {availability && (
                            <div className="flex items-center space-x-2">
                              <div className={`px-2 py-1 text-xs font-medium rounded-full ${getUtilizationColor(availability.utilizationPercentage)}`}>
                                {Math.round(availability.utilizationPercentage)}% utilized
                              </div>
                              {availability.isOverloaded && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          )}

                          {/* Performance Rating */}
                          {performance && (
                            <div className="flex items-center space-x-1">
                              <Star className={`w-4 h-4 ${performance.color}`} />
                              <span className={`text-xs font-medium ${performance.color}`}>
                                {performance.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Capacity and Workload Details */}
                      {availability && (
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Capacity</div>
                            <div className="font-medium text-gray-900">
                              {member.capacity || 'N/A'} jobs/day
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Current Load</div>
                            <div className="font-medium text-gray-900">
                              {availability.currentWorkload} jobs
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Available Slots</div>
                            <div className={`font-medium ${
                              availability.availableSlots > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {availability.availableSlots} slots
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Skills and Specializations */}
                      {member.specializations && member.specializations.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">Specializations</div>
                          <div className="flex flex-wrap gap-1">
                            {member.specializations.slice(0, 3).map(spec => (
                              <span
                                key={spec}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {spec}
                              </span>
                            ))}
                            {member.specializations.length > 3 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                +{member.specializations.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conflict Warnings */}
                      {availability && availability.conflicts.length > 0 && (
                        <div className="mt-3 flex items-center space-x-2 text-sm text-amber-600">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {availability.conflicts.length} scheduling conflict{availability.conflicts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Team Members</div>
            <div className="font-medium text-gray-900">
              {selectedTeamIds.length} of {filteredTeams.length} selected
            </div>
          </div>
          <div>
            <div className="text-gray-600">Assignment Type</div>
            <div className="font-medium text-gray-900 capitalize">
              {assignmentType === 'both' ? 'Lead + Assistant' : assignmentType}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Configuration</div>
            <div className="font-medium text-gray-900">
              {overrideConflicts ? 'Override conflicts' : 'Respect conflicts'} • 
              {preserveExisting ? ' Preserve existing' : ' Replace existing'}
            </div>
          </div>
        </div>

        {/* Available Capacity Summary */}
        {selectedTeamIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Selected Team Capacity</div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                Total available slots: {' '}
                <span className="font-medium text-green-600">
                  {selectedTeamIds.reduce((sum, id) => {
                    const avail = getTeamAvailability(id);
                    return sum + (avail?.availableSlots || 0);
                  }, 0)}
                </span>
              </div>
              <div className="text-sm">
                Overloaded members: {' '}
                <span className="font-medium text-red-600">
                  {selectedTeamIds.filter(id => {
                    const avail = getTeamAvailability(id);
                    return avail?.isOverloaded;
                  }).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMemberSelector;