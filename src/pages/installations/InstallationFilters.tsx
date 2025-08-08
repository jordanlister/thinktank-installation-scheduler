// Think Tank Technologies - Installation Filters Component

import React, { useState, useEffect } from 'react';
import { 
  Filter,
  X,
  Calendar,
  Users,
  Target,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { Installation, InstallationStatus, Priority, FilterOptions } from '../../types';

interface InstallationFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  installations: Installation[];
}

const InstallationFilters: React.FC<InstallationFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  installations
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Get unique values for filter options
  const filterOptions = React.useMemo(() => {
    const regions = [...new Set(installations.map(i => i.address.state).filter(Boolean))].sort();
    const cities = [...new Set(installations.map(i => i.address.city).filter(Boolean))].sort();
    const assignees = [...new Set([
      ...installations.map(i => i.leadId).filter(Boolean),
      ...installations.map(i => i.assistantId).filter(Boolean)
    ])].sort();

    return { regions, cities, assignees };
  }, [installations]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Handle status filter toggle
  const toggleStatusFilter = (status: InstallationStatus) => {
    const currentStatuses = localFilters.status || [];
    const updatedStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    handleFilterChange('status', updatedStatuses.length > 0 ? updatedStatuses : undefined);
  };

  // Handle priority filter toggle
  const togglePriorityFilter = (priority: Priority) => {
    const currentPriorities = localFilters.priority || [];
    const updatedPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    handleFilterChange('priority', updatedPriorities.length > 0 ? updatedPriorities : undefined);
  };

  // Handle assignee filter toggle
  const toggleAssigneeFilter = (assigneeId: string) => {
    const currentAssignees = localFilters.assignee || [];
    const updatedAssignees = currentAssignees.includes(assigneeId)
      ? currentAssignees.filter(a => a !== assigneeId)
      : [...currentAssignees, assigneeId];
    
    handleFilterChange('assignee', updatedAssignees.length > 0 ? updatedAssignees : undefined);
  };

  // Handle date range changes
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const currentRange = localFilters.dateRange || { start: '', end: '' };
    const updatedRange = { ...currentRange, [field]: value };
    
    // Only set if both dates are provided or clear if both are empty
    if (updatedRange.start && updatedRange.end) {
      handleFilterChange('dateRange', updatedRange);
    } else if (!updatedRange.start && !updatedRange.end) {
      handleFilterChange('dateRange', undefined);
    } else {
      setLocalFilters(prev => ({
        ...prev,
        dateRange: updatedRange
      }));
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setLocalFilters({});
    onClearFilters();
  };

  // Check if any filters are applied
  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  // Status options with counts
  const statusOptions: { value: InstallationStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'scheduled', label: 'Scheduled', color: 'blue' },
    { value: 'in_progress', label: 'In Progress', color: 'purple' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'rescheduled', label: 'Rescheduled', color: 'orange' }
  ];

  // Priority options with counts
  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  // Get count for each filter option
  const getStatusCount = (status: InstallationStatus) => 
    installations.filter(i => i.status === status).length;

  const getPriorityCount = (priority: Priority) => 
    installations.filter(i => i.priority === priority).length;

  const getAssigneeCount = (assigneeId: string) => 
    installations.filter(i => i.leadId === assigneeId || i.assistantId === assigneeId).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-800"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Date Range
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={localFilters.dateRange?.start || ''}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start date"
            />
            <input
              type="date"
              value={localFilters.dateRange?.end || ''}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End date"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Status
          </label>
          <div className="space-y-2">
            {statusOptions.map(({ value, label, color }) => {
              const count = getStatusCount(value);
              const isSelected = localFilters.status?.includes(value) || false;
              
              return (
                <label
                  key={value}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStatusFilter(value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Target className="h-4 w-4 mr-1" />
            Priority
          </label>
          <div className="space-y-2">
            {priorityOptions.map(({ value, label, color }) => {
              const count = getPriorityCount(value);
              const isSelected = localFilters.priority?.includes(value) || false;
              
              return (
                <label
                  key={value}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePriorityFilter(value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Team Assignment Filter */}
        {filterOptions.assignees.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Assigned Team
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {/* Unassigned option */}
              <label className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localFilters.assignee?.includes('unassigned') || false}
                    onChange={() => toggleAssigneeFilter('unassigned')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 italic">Unassigned</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {installations.filter(i => !i.leadId && !i.assistantId).length}
                </span>
              </label>

              {filterOptions.assignees.map(assigneeId => {
                const count = getAssigneeCount(assigneeId);
                const isSelected = localFilters.assignee?.includes(assigneeId) || false;
                
                return (
                  <label
                    key={assigneeId}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAssigneeFilter(assigneeId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-mono">
                        {assigneeId.slice(-8)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Quick Filters
          </label>
          <div className="space-y-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                handleFilterChange('dateRange', { start: today, end: today });
              }}
              className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
            >
              Today's Installations
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                handleFilterChange('dateRange', { start: tomorrowStr, end: tomorrowStr });
              }}
              className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
            >
              Tomorrow's Installations
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                handleFilterChange('dateRange', { 
                  start: today.toISOString().split('T')[0], 
                  end: weekEnd.toISOString().split('T')[0] 
                });
              }}
              className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
            >
              Next 7 Days
            </button>
            
            <button
              onClick={() => {
                handleFilterChange('status', ['pending', 'scheduled']);
              }}
              className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
            >
              Upcoming Installations
            </button>
            
            <button
              onClick={() => {
                handleFilterChange('priority', ['high', 'urgent']);
              }}
              className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
            >
              High Priority Only
            </button>
            
            <button
              onClick={() => {
                handleFilterChange('assignee', ['unassigned']);
              }}
              className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 flex items-center"
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Needs Assignment
            </button>
          </div>
        </div>

        {/* Overdue Filter */}
        <div>
          <label className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 border border-gray-200">
            <input
              type="checkbox"
              // This would need to be implemented in the parent component
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <AlertTriangle className="h-4 w-4 mx-2 text-red-500" />
            <span className="text-sm text-red-700 font-medium">Show Overdue Only</span>
          </label>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Active Filters
          </h4>
          <div className="space-y-1">
            {localFilters.status && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{localFilters.status.length} selected</span>
              </div>
            )}
            {localFilters.priority && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium">{localFilters.priority.length} selected</span>
              </div>
            )}
            {localFilters.assignee && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Assignee:</span>
                <span className="font-medium">{localFilters.assignee.length} selected</span>
              </div>
            )}
            {localFilters.dateRange && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Date Range:</span>
                <span className="font-medium">
                  {localFilters.dateRange.start} - {localFilters.dateRange.end}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationFilters;