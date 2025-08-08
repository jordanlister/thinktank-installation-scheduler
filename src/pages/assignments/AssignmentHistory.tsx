// Think Tank Technologies Installation Scheduler - Assignment History

import React, { useState, useMemo } from 'react';
import { 
  History,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  ArrowLeftRight,
  Plus,
  Minus,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  Download,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { 
  useAppStore,
  useAssignments,
  useTeams,
  useInstallations
} from '../../stores/useAppStore';
import type { 
  Assignment,
  AssignmentHistoryEntry,
  AssignmentAction,
  TeamMember,
  Installation
} from '../../types';

interface AssignmentHistoryProps {
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Assignment History - Assignment audit trail and changes log
 * 
 * Features:
 * - Complete assignment change history
 * - Audit trail with user attribution
 * - Filterable activity timeline
 * - Change impact analysis
 * - Export capabilities
 */
const AssignmentHistory: React.FC<AssignmentHistoryProps> = ({ dateRange }) => {
  const { setError } = useAppStore();

  // State from store
  const assignments = useAssignments();
  const teams = useTeams();
  const installations = useInstallations();

  // Local state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Aggregate all history entries
  const allHistoryEntries = useMemo(() => {
    const entries: (AssignmentHistoryEntry & { assignment: Assignment })[] = [];
    
    assignments.forEach(assignment => {
      assignment.history.forEach(entry => {
        const entryDate = new Date(entry.performedAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        if (entryDate >= startDate && entryDate <= endDate) {
          entries.push({
            ...entry,
            assignment
          });
        }
      });
    });

    return entries;
  }, [assignments, dateRange]);

  // Filter and sort history entries
  const filteredHistory = useMemo(() => {
    let filtered = allHistoryEntries.filter(entry => {
      // Filter by action
      if (filterAction !== 'all' && entry.action !== filterAction) return false;
      
      // Filter by user
      if (filterUser !== 'all' && entry.performedBy !== filterUser) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const assignmentMatch = entry.assignment.id.toLowerCase().includes(searchLower);
        const reasonMatch = entry.reason?.toLowerCase().includes(searchLower) || false;
        const notesMatch = entry.notes?.toLowerCase().includes(searchLower) || false;
        
        if (!assignmentMatch && !reasonMatch && !notesMatch) return false;
      }
      
      return true;
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.performedAt).getTime();
      const dateB = new Date(b.performedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [allHistoryEntries, filterAction, filterUser, searchTerm, sortOrder]);

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = new Set(allHistoryEntries.map(entry => entry.performedBy));
    return Array.from(users);
  }, [allHistoryEntries]);

  // History statistics
  const historyStats = useMemo(() => {
    const actionCounts = filteredHistory.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {} as Record<AssignmentAction, number>);

    const userActivity = filteredHistory.reduce((acc, entry) => {
      acc[entry.performedBy] = (acc[entry.performedBy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntries: filteredHistory.length,
      actionCounts,
      userActivity,
      mostActiveUser: Object.entries(userActivity).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    };
  }, [filteredHistory]);

  // Get team member name
  const getTeamMemberName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team ? `${team.firstName} ${team.lastName}` : 'Unknown Team Member';
  };

  // Get installation details
  const getInstallationDetails = (installationId: string): Installation | undefined => {
    return installations.find(i => i.id === installationId);
  };

  // Get action icon and color
  const getActionDisplay = (action: AssignmentAction) => {
    switch (action) {
      case 'created':
        return { icon: Plus, color: 'text-green-600 bg-green-100', label: 'Created' };
      case 'assigned':
        return { icon: Users, color: 'text-blue-600 bg-blue-100', label: 'Assigned' };
      case 'reassigned':
        return { icon: ArrowLeftRight, color: 'text-yellow-600 bg-yellow-100', label: 'Reassigned' };
      case 'unassigned':
        return { icon: Minus, color: 'text-red-600 bg-red-100', label: 'Unassigned' };
      case 'started':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Started' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Completed' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Cancelled' };
      case 'rescheduled':
        return { icon: Calendar, color: 'text-orange-600 bg-orange-100', label: 'Rescheduled' };
      case 'conflict_resolved':
        return { icon: AlertTriangle, color: 'text-purple-600 bg-purple-100', label: 'Conflict Resolved' };
      default:
        return { icon: Edit, color: 'text-glass-secondary bg-white/15', label: 'Modified' };
    }
  };

  // Format change details
  const formatChangeDetails = (entry: AssignmentHistoryEntry & { assignment: Assignment }) => {
    const { previousValue, newValue, action } = entry;
    
    if (action === 'reassigned' && previousValue && newValue) {
      const prevTeam = previousValue.leadId ? getTeamMemberName(previousValue.leadId) : 'Unassigned';
      const newTeam = newValue.leadId ? getTeamMemberName(newValue.leadId) : 'Unassigned';
      return `${prevTeam} → ${newTeam}`;
    }
    
    if (action === 'created' && newValue) {
      const teamName = newValue.leadId ? getTeamMemberName(newValue.leadId) : 'Unassigned';
      return `Assigned to ${teamName}`;
    }
    
    return entry.reason || 'No details available';
  };

  // Export history
  const handleExport = () => {
    const csvContent = [
      ['Date', 'Time', 'Action', 'Assignment ID', 'Installation', 'Team Member', 'User', 'Reason'].join(','),
      ...filteredHistory.map(entry => {
        const date = new Date(entry.performedAt);
        const installation = getInstallationDetails(entry.assignment.installationId);
        const teamMember = entry.assignment.leadId ? getTeamMemberName(entry.assignment.leadId) : 'Unassigned';
        
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          entry.action,
          entry.assignmentId,
          installation?.customerName || 'Unknown',
          teamMember,
          entry.performedBy,
          entry.reason || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-history-${dateRange.start}-to-${dateRange.end}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <History className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Total Entries</div>
                <div className="text-2xl font-bold text-glass-primary">
                  {historyStats.totalEntries}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Assignments</div>
                <div className="text-2xl font-bold text-glass-primary">
                  {(historyStats.actionCounts.assigned || 0) + (historyStats.actionCounts.reassigned || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Completions</div>
                <div className="text-2xl font-bold text-glass-primary">
                  {historyStats.actionCounts.completed || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Most Active</div>
                <div className="text-lg font-bold text-glass-primary truncate">
                  {historyStats.mostActiveUser}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 text-sm"
            />
          </div>
          
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="form-select text-sm"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="assigned">Assigned</option>
            <option value="reassigned">Reassigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="form-select text-sm"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md text-sm"
          >
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
        
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md text-sm"
        >
          Export History
        </button>
      </div>

      {/* History Timeline */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Assignment History</h3>
            <span className="text-sm text-white/80">
              {filteredHistory.length} of {allHistoryEntries.length} entries
            </span>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-glass-primary mb-2">No History Found</h4>
              <p className="text-glass-secondary">
                No assignment history matches your current filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredHistory.map((entry, index) => {
                const actionDisplay = getActionDisplay(entry.action);
                const Icon = actionDisplay.icon;
                const installation = getInstallationDetails(entry.assignment.installationId);
                const teamMember = entry.assignment.leadId ? getTeamMemberName(entry.assignment.leadId) : 'Unassigned';
                
                return (
                  <div key={`${entry.id}-${index}`} className="p-6 hover:bg-white/10">
                    <div className="flex items-start space-x-4">
                      {/* Action Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${actionDisplay.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-glass-primary">
                              {actionDisplay.label} • Assignment {entry.assignmentId.split('_').pop()}
                            </p>
                            <p className="text-sm text-glass-secondary">
                              {formatChangeDetails(entry)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-glass-secondary">
                              {new Date(entry.performedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-glass-muted">
                              {new Date(entry.performedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Installation Details */}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-glass-secondary">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{installation?.customerName || 'Unknown Customer'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{teamMember}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>by {entry.performedBy}</span>
                          </div>
                        </div>
                        
                        {/* Additional Details */}
                        {(entry.reason || entry.notes) && (
                          <div className="mt-3 p-3 bg-white/5 rounded-md border border-white/10">
                            {entry.reason && (
                              <p className="text-sm text-glass-primary">
                                <span className="font-medium">Reason:</span> {entry.reason}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-glass-primary mt-1">
                                <span className="font-medium">Notes:</span> {entry.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => setSelectedAssignment(entry.assignment)}
                          className="text-glass-muted hover:text-glass-secondary"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <AssignmentDetailModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
};

// Assignment Detail Modal Component
const AssignmentDetailModal: React.FC<{
  assignment: Assignment;
  onClose: () => void;
}> = ({ assignment, onClose }) => {
  const teams = useTeams();
  const installations = useInstallations();

  const installation = installations.find(i => i.id === assignment.installationId);
  const leadTeam = teams.find(t => t.id === assignment.leadId);
  const assistantTeam = assignment.assistantId ? teams.find(t => t.id === assignment.assistantId) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-glass-primary">
              Assignment Details
            </h2>
            <p className="text-sm text-glass-secondary mt-1">
              ID: {assignment.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-glass-muted hover:text-glass-secondary"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Assignment Info */}
          <div>
            <h3 className="text-lg font-medium text-glass-primary mb-3">Assignment Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-glass-secondary">Status</dt>
                <dd className="text-sm text-glass-primary capitalize">{assignment.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-glass-secondary">Priority</dt>
                <dd className="text-sm text-glass-primary capitalize">{assignment.priority}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-glass-secondary">Lead Technician</dt>
                <dd className="text-sm text-glass-primary">
                  {leadTeam ? `${leadTeam.firstName} ${leadTeam.lastName}` : 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-glass-secondary">Assistant</dt>
                <dd className="text-sm text-glass-primary">
                  {assistantTeam ? `${assistantTeam.firstName} ${assistantTeam.lastName}` : 'None'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Installation Info */}
          {installation && (
            <div>
              <h3 className="text-lg font-medium text-glass-primary mb-3">Installation Details</h3>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-glass-secondary">Customer</dt>
                  <dd className="text-sm text-glass-primary">{installation.customerName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-glass-secondary">Location</dt>
                  <dd className="text-sm text-glass-primary">
                    {installation.address.street}, {installation.address.city}, {installation.address.state}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-glass-secondary">Scheduled Date</dt>
                  <dd className="text-sm text-glass-primary">
                    {new Date(installation.scheduledDate).toLocaleDateString()} at {installation.scheduledTime}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* History */}
          <div>
            <h3 className="text-lg font-medium text-glass-primary mb-3">Change History</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {assignment.history.map((entry, index) => {
                const actionDisplay = getActionDisplay(entry.action);
                const Icon = actionDisplay.icon;
                
                return (
                  <div key={`${entry.id}-${index}`} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${actionDisplay.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-glass-primary">
                        {actionDisplay.label}
                      </p>
                      <p className="text-sm text-glass-secondary">
                        {entry.reason || 'No reason provided'}
                      </p>
                      <p className="text-xs text-glass-secondary">
                        {new Date(entry.performedAt).toLocaleString()} by {entry.performedBy}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get action display info (reused from main component)
const getActionDisplay = (action: AssignmentAction) => {
  switch (action) {
    case 'created':
      return { icon: Plus, color: 'text-green-600 bg-green-100', label: 'Created' };
    case 'assigned':
      return { icon: Users, color: 'text-blue-600 bg-blue-100', label: 'Assigned' };
    case 'reassigned':
      return { icon: ArrowLeftRight, color: 'text-yellow-600 bg-yellow-100', label: 'Reassigned' };
    case 'unassigned':
      return { icon: Minus, color: 'text-red-600 bg-red-100', label: 'Unassigned' };
    case 'started':
      return { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Started' };
    case 'completed':
      return { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Completed' };
    case 'cancelled':
      return { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Cancelled' };
    case 'rescheduled':
      return { icon: Calendar, color: 'text-orange-600 bg-orange-100', label: 'Rescheduled' };
    case 'conflict_resolved':
      return { icon: AlertTriangle, color: 'text-purple-600 bg-purple-100', label: 'Conflict Resolved' };
    default:
      return { icon: Edit, color: 'text-glass-secondary bg-white/15', label: 'Modified' };
  }
};

export default AssignmentHistory;