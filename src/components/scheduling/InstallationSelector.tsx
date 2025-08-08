// Think Tank Technologies - Installation Selector Component

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  MapPin,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Zap
} from 'lucide-react';
import type { 
  Installation, 
  InstallationSelectionCriteria,
  Priority,
  InstallationStatus 
} from '../../types';

interface InstallationSelectorProps {
  installations: Installation[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  criteria: InstallationSelectionCriteria;
  onCriteriaChange: (criteria: InstallationSelectionCriteria) => void;
}

/**
 * Installation Selector Component
 * 
 * Provides multi-select interface for choosing installations for bulk assignment
 */
const InstallationSelector: React.FC<InstallationSelectorProps> = ({
  installations,
  selectedIds,
  onSelectionChange,
  criteria,
  onCriteriaChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'customer' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort installations
  const filteredInstallations = useMemo(() => {
    let filtered = installations.filter(installation => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          installation.customerName.toLowerCase().includes(term) ||
          installation.address.street.toLowerCase().includes(term) ||
          installation.address.city.toLowerCase().includes(term) ||
          installation.notes?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (criteria.status && criteria.status.length > 0) {
        if (!criteria.status.includes(installation.status)) return false;
      }

      // Priority filter
      if (criteria.priority && criteria.priority.length > 0) {
        if (!criteria.priority.includes(installation.priority)) return false;
      }

      // Date range filter
      if (criteria.dateRange) {
        const installDate = new Date(installation.scheduledDate);
        const startDate = new Date(criteria.dateRange.start);
        const endDate = new Date(criteria.dateRange.end);
        if (installDate < startDate || installDate > endDate) return false;
      }

      // Unassigned only filter
      if (criteria.unassignedOnly) {
        if (installation.leadId || installation.assistantId) return false;
      }

      return true;
    });

    // Sort installations
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [installations, searchTerm, criteria, sortBy, sortOrder]);

  // Handle individual selection
  const handleToggleSelection = (installationId: string) => {
    const newSelection = selectedIds.includes(installationId)
      ? selectedIds.filter(id => id !== installationId)
      : [...selectedIds, installationId];
    onSelectionChange(newSelection);
  };

  // Handle select all
  const handleSelectAll = () => {
    const allFilteredIds = filteredInstallations.map(i => i.id);
    const isAllSelected = allFilteredIds.every(id => selectedIds.includes(id));
    
    if (isAllSelected) {
      // Deselect all filtered
      onSelectionChange(selectedIds.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered
      const newSelection = [...new Set([...selectedIds, ...allFilteredIds])];
      onSelectionChange(newSelection);
    }
  };

  // Smart selection functions
  const handleSmartSelect = (type: 'unassigned' | 'high-priority' | 'today' | 'conflicts') => {
    let smartSelection: string[] = [];

    switch (type) {
      case 'unassigned':
        smartSelection = installations
          .filter(i => !i.leadId && !i.assistantId)
          .map(i => i.id);
        break;
      case 'high-priority':
        smartSelection = installations
          .filter(i => i.priority === 'high' || i.priority === 'urgent')
          .map(i => i.id);
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        smartSelection = installations
          .filter(i => i.scheduledDate === today)
          .map(i => i.id);
        break;
      case 'conflicts':
        // This would require conflict detection logic
        smartSelection = installations
          .filter(i => i.status === 'rescheduled' || i.status === 'cancelled')
          .map(i => i.id);
        break;
    }

    onSelectionChange([...new Set([...selectedIds, ...smartSelection])]);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: InstallationStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'scheduled':
        return 'text-indigo-600 bg-indigo-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'rescheduled':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isAllFilteredSelected = useMemo(() => {
    const allFilteredIds = filteredInstallations.map(i => i.id);
    return allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));
  }, [filteredInstallations, selectedIds]);

  const selectedFilteredCount = useMemo(() => {
    const filteredIds = filteredInstallations.map(i => i.id);
    return filteredIds.filter(id => selectedIds.includes(id)).length;
  }, [filteredInstallations, selectedIds]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search installations by customer, address, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Selection Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {isAllFilteredSelected ? 'Deselect All' : 'Select All'} ({filteredInstallations.length})
              </span>
            </button>

            {selectedFilteredCount > 0 && (
              <div className="text-sm text-gray-600">
                {selectedFilteredCount} of {filteredInstallations.length} selected
              </div>
            )}
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex items-center space-x-3">
            {/* Smart Select Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Zap className="w-4 h-4" />
                <span>Smart Select</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleSmartSelect('unassigned')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Unassigned Only
                  </button>
                  <button
                    onClick={() => handleSmartSelect('high-priority')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    High Priority
                  </button>
                  <button
                    onClick={() => handleSmartSelect('today')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Today's Installations
                  </button>
                  <button
                    onClick={() => handleSmartSelect('conflicts')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Rescheduled/Cancelled
                  </button>
                </div>
              </div>
            </div>

            {/* Sort Controls */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-asc">Date (Earliest)</option>
              <option value="date-desc">Date (Latest)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
              <option value="customer-asc">Customer (A to Z)</option>
              <option value="customer-desc">Customer (Z to A)</option>
              <option value="status-asc">Status (A to Z)</option>
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
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="space-y-2">
                  {(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'] as InstallationStatus[]).map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={criteria.status?.includes(status) || false}
                        onChange={(e) => {
                          const currentStatus = criteria.status || [];
                          const newStatus = e.target.checked
                            ? [...currentStatus, status]
                            : currentStatus.filter(s => s !== status);
                          onCriteriaChange({ ...criteria, status: newStatus });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="space-y-2">
                  {(['urgent', 'high', 'medium', 'low'] as Priority[]).map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={criteria.priority?.includes(priority) || false}
                        onChange={(e) => {
                          const currentPriority = criteria.priority || [];
                          const newPriority = e.target.checked
                            ? [...currentPriority, priority]
                            : currentPriority.filter(p => p !== priority);
                          onCriteriaChange({ ...criteria, priority: newPriority });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={criteria.dateRange?.start || ''}
                    onChange={(e) => {
                      const newRange = { ...criteria.dateRange, start: e.target.value };
                      onCriteriaChange({ ...criteria, dateRange: newRange });
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={criteria.dateRange?.end || ''}
                    onChange={(e) => {
                      const newRange = { ...criteria.dateRange, end: e.target.value };
                      onCriteriaChange({ ...criteria, dateRange: newRange });
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={criteria.unassignedOnly || false}
                  onChange={(e) => onCriteriaChange({ ...criteria, unassignedOnly: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Unassigned only</span>
              </label>

              <button
                onClick={() => onCriteriaChange({})}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Installation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredInstallations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Target className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No installations found</h3>
            <p className="text-center text-sm">
              {searchTerm || Object.keys(criteria).length > 0
                ? 'Try adjusting your search or filters'
                : 'No installations available for selection'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInstallations.map(installation => {
              const isSelected = selectedIds.includes(installation.id);
              const isAssigned = installation.leadId || installation.assistantId;
              
              return (
                <div
                  key={installation.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleToggleSelection(installation.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <div className="flex items-center pt-1">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Installation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {installation.customerName}
                          </h4>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              {installation.address.street}, {installation.address.city}, {installation.address.state}
                            </span>
                          </div>
                        </div>

                        {/* Status and Priority Badges */}
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(installation.priority)}`}>
                            {installation.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(installation.status)}`}>
                            {installation.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(installation.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{installation.scheduledTime}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{installation.duration} min</span>
                          </div>
                        </div>

                        {/* Assignment Status */}
                        <div className="flex items-center space-x-2">
                          {isAssigned ? (
                            <div className="flex items-center text-sm text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span>Assigned</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-gray-500">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              <span>Unassigned</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {installation.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes: </span>
                          <span className="line-clamp-2">{installation.notes}</span>
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
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Showing {filteredInstallations.length} of {installations.length} installations
          </div>
          <div className="text-gray-900 font-medium">
            {selectedIds.length} selected for bulk assignment
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationSelector;