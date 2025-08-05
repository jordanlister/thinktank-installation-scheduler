// Think Tank Technologies - Team Member Directory Component

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Grid, 
  List, 
  Map, 
  Download, 
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Award,
  Tool,
  Calendar
} from 'lucide-react';
import { useTeamStore, useTeamMembers, useTeamSearchQuery, useTeamFilterCriteria, useTeamViewMode } from '../../stores/useTeamStore';
import type { TeamMember, UserRole, CertificationStatus } from '../../types';
import { TeamDataManager } from '../../utils/teamManagement';

const TeamMemberDirectory: React.FC = () => {
  const {
    teamMembers,
    searchQuery,
    filterCriteria,
    viewMode,
    isLoading,
    error,
    setSearchQuery,
    setFilterCriteria,
    setViewMode,
    setSelectedTeamMember,
    addTeamMember,
    removeTeamMember,
    clearFilters
  } = useTeamStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtered and searched team members
  const filteredMembers = useMemo(() => {
    let filtered = teamMembers;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply filters
    if (filterCriteria.roles?.length) {
      filtered = filtered.filter(member => filterCriteria.roles!.includes(member.role));
    }

    if (filterCriteria.regions?.length) {
      filtered = filtered.filter(member => 
        filterCriteria.regions!.includes(member.region) ||
        member.subRegions.some(region => filterCriteria.regions!.includes(region))
      );
    }

    if (filterCriteria.skills?.length) {
      filtered = filtered.filter(member =>
        member.skills.some(skill => 
          filterCriteria.skills!.some(filterSkill => 
            skill.name.toLowerCase().includes(filterSkill.toLowerCase())
          )
        )
      );
    }

    if (filterCriteria.availabilityStatus !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(member => {
        const isAvailable = member.availability.some(avail => 
          avail.isAvailable && 
          today >= avail.startDate && 
          today <= avail.endDate
        );
        return isAvailable === filterCriteria.availabilityStatus;
      });
    }

    if (filterCriteria.performanceThreshold) {
      filtered = filtered.filter(member => {
        if (!member.performanceMetrics) return false;
        const score = (
          member.performanceMetrics.completionRate * 0.3 +
          member.performanceMetrics.customerSatisfaction * 0.3 +
          member.performanceMetrics.qualityScore * 0.4
        );
        return score >= filterCriteria.performanceThreshold!;
      });
    }

    return filtered;
  }, [teamMembers, searchQuery, filterCriteria]);

  const handleExportData = () => {
    const csvContent = TeamDataManager.exportTeamMembersToCSV(filteredMembers);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_members.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const parsedMembers = TeamDataManager.parseTeamMembersFromCSV(csvContent);
          // Would integrate with actual import logic
          console.log('Parsed team members:', parsedMembers);
        } catch (error) {
          console.error('Error parsing CSV:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading team members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Directory</h1>
          <p className="text-gray-600">
            {filteredMembers.length} of {teamMembers.length} team members
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportData}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </label>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Map className="h-4 w-4" />
            </button>
          </div>

          {/* Clear Filters */}
          {(searchQuery || Object.values(filterCriteria).some(v => v !== undefined && v !== null)) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value as UserRole);
                    setFilterCriteria({ roles: selected.length ? selected : undefined });
                  }}
                >
                  <option value="lead">Lead</option>
                  <option value="assistant">Assistant</option>
                  <option value="admin">Admin</option>
                  <option value="scheduler">Scheduler</option>
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFilterCriteria({ regions: selected.length ? selected : undefined });
                  }}
                >
                  {[...new Set(teamMembers.map(m => m.region))].map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterCriteria({ 
                      availabilityStatus: value === '' ? undefined : value === 'true'
                    });
                  }}
                >
                  <option value="">All</option>
                  <option value="true">Available Today</option>
                  <option value="false">Not Available Today</option>
                </select>
              </div>

              {/* Performance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Performance</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterCriteria({ 
                      performanceThreshold: value === '' ? undefined : parseFloat(value)
                    });
                  }}
                >
                  <option value="">Any</option>
                  <option value="9">Excellent (9+)</option>
                  <option value="8">Good (8+)</option>
                  <option value="7">Satisfactory (7+)</option>
                  <option value="6">Needs Improvement (6+)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Members Display */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map(member => (
            <TeamMemberCard key={member.id} member={member} onClick={setSelectedTeamMember} />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <TeamMemberTable members={filteredMembers} onMemberClick={setSelectedTeamMember} />
        </div>
      )}

      {viewMode === 'map' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-500 text-center py-8">
            Map view would show team member locations and coverage areas
          </p>
        </div>
      )}

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || Object.values(filterCriteria).some(v => v !== undefined)
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first team member'
            }
          </p>
          {!searchQuery && !Object.values(filterCriteria).some(v => v !== undefined) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Team Member Card Component
const TeamMemberCard: React.FC<{
  member: TeamMember;
  onClick: (member: TeamMember) => void;
}> = ({ member, onClick }) => {
  const isAvailable = member.availability.some(avail => {
    const today = new Date().toISOString().split('T')[0];
    return avail.isAvailable && today >= avail.startDate && today <= avail.endDate;
  });

  const performanceScore = member.performanceMetrics 
    ? (member.performanceMetrics.completionRate * 0.3 + 
       member.performanceMetrics.customerSatisfaction * 0.3 + 
       member.performanceMetrics.qualityScore * 0.4)
    : null;

  return (
    <div
      onClick={() => onClick(member)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-sm text-gray-600 capitalize">{member.role}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {isAvailable ? (
            <CheckCircle className="h-4 w-4 text-green-500" title="Available" />
          ) : (
            <Clock className="h-4 w-4 text-yellow-500" title="Not Available" />
          )}
          {!member.isActive && (
            <AlertTriangle className="h-4 w-4 text-red-500" title="Inactive" />
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="h-3 w-3" />
          <span className="truncate">{member.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-3 w-3" />
          <span>{member.region}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-100 pt-3">
        <div>
          <div className="font-medium text-gray-900">{member.skills.length}</div>
          <div className="text-gray-600">Skills</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">{member.certifications.length}</div>
          <div className="text-gray-600">Certs</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {performanceScore ? performanceScore.toFixed(1) : 'N/A'}
          </div>
          <div className="text-gray-600">Score</div>
        </div>
      </div>
    </div>
  );
};

// Team Member Table Component
const TeamMemberTable: React.FC<{
  members: TeamMember[];
  onMemberClick: (member: TeamMember) => void;
}> = ({ members, onMemberClick }) => {
  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Team Member
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Region
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Skills
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Performance
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {members.map(member => (
          <tr
            key={member.id}
            onClick={() => onMemberClick(member)}
            className="hover:bg-gray-50 cursor-pointer"
          >
            <td className="px-4 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{member.email}</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
              <span className="capitalize text-sm text-gray-900">{member.role}</span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              {member.region}
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                {member.isActive ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              {member.skills.length} skills
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              {member.performanceMetrics 
                ? (member.performanceMetrics.completionRate * 0.3 + 
                   member.performanceMetrics.customerSatisfaction * 0.3 + 
                   member.performanceMetrics.qualityScore * 0.4).toFixed(1)
                : 'N/A'
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TeamMemberDirectory;