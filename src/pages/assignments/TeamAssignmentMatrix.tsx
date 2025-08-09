// Think Tank Technologies Installation Scheduler - Team Assignment Matrix

import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  MoreHorizontal,
  DragIcon,
  Settings
} from 'lucide-react';
import { 
  useAppStore,
  useAssignmentMatrix,
  useAssignments,
  useTeams,
  useInstallations,
  useAssignmentConflicts
} from '../../stores/useAppStore';
import type { 
  Assignment, 
  AssignmentMatrixCell, 
  TeamMember, 
  Installation,
  AssignmentConflict 
} from '../../types';

interface TeamAssignmentMatrixProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Team Assignment Matrix - Visual grid showing team assignments
 * 
 * Features:
 * - Drag-and-drop assignment interface
 * - Visual conflict indicators
 * - Workload visualization
 * - Capacity management
 * - Real-time updates
 */
const TeamAssignmentMatrix: React.FC<TeamAssignmentMatrixProps> = ({ 
  viewMode, 
  onViewModeChange,
  dateRange 
}) => {
  const { 
    generateAssignmentMatrix,
    updateMatrixCell,
    createAssignment,
    updateAssignmentById,
    deleteAssignment,
    setError
  } = useAppStore();

  // State from store
  const assignmentMatrix = useAssignmentMatrix();
  const assignments = useAssignments();
  const teams = useTeams();
  const installations = useInstallations();
  const conflicts = useAssignmentConflicts();

  // Local state
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    teamMemberId: string;
  } | null>(null);
  const [draggedAssignment, setDraggedAssignment] = useState<Assignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Generate date range array
  const dateArray = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  }, [dateRange]);

  // Filter teams based on filter criteria
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      if (!team.isActive) return false;
      if (filterTeam && !`${team.firstName} ${team.lastName}`.toLowerCase().includes(filterTeam.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [teams, filterTeam]);

  // Get assignments for a specific cell
  const getCellAssignments = (date: string, teamMemberId: string): Assignment[] => {
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.assignedAt).toISOString().split('T')[0];
      return assignmentDate === date && 
             (assignment.leadId === teamMemberId || assignment.assistantId === teamMemberId);
    });
  };

  // Get conflicts for a specific cell
  const getCellConflicts = (date: string, teamMemberId: string): AssignmentConflict[] => {
    const cellAssignments = getCellAssignments(date, teamMemberId);
    return conflicts.filter(conflict => 
      conflict.affectedAssignments.some(assignmentId =>
        cellAssignments.some(assignment => assignment.id === assignmentId)
      )
    );
  };

  // Calculate cell status
  const getCellStatus = (date: string, teamMemberId: string) => {
    const team = teams.find(t => t.id === teamMemberId);
    if (!team) return 'unavailable';

    const cellAssignments = getCellAssignments(date, teamMemberId);
    const cellConflicts = getCellConflicts(date, teamMemberId);
    
    if (cellConflicts.length > 0) return 'conflict';
    if (cellAssignments.length > team.capacity) return 'overbooked';
    if (cellAssignments.length > 0) return 'assigned';
    return 'available';
  };

  // Get cell utilization percentage
  const getCellUtilization = (date: string, teamMemberId: string): number => {
    const team = teams.find(t => t.id === teamMemberId);
    if (!team) return 0;

    const cellAssignments = getCellAssignments(date, teamMemberId);
    return (cellAssignments.length / team.capacity) * 100;
  };

  // Handle drag start
  const handleDragStart = (assignment: Assignment, e: React.DragEvent) => {
    setDraggedAssignment(assignment);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drop
  const handleDrop = async (date: string, teamMemberId: string, e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedAssignment) return;

    try {
      // Update assignment with new team member and date
      await updateAssignmentById(draggedAssignment.id, {
        leadId: teamMemberId,
        scheduledDate: date,
        reason: 'Reassigned via drag and drop'
      });

      // Update matrix
      generateAssignmentMatrix(dateRange);
      setDraggedAssignment(null);
    } catch (error) {
      setError(`Failed to update assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Initialize matrix when component mounts or date range changes
  useEffect(() => {
    generateAssignmentMatrix(dateRange);
  }, [dateRange, generateAssignmentMatrix]);

  // Render grid view
  const renderGridView = () => {
    if (filteredTeams.length === 0) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white/40" />
              </div>
              <p className="text-white/80 text-lg mb-2">
                No team members found
              </p>
              <p className="text-white/50">
                {filterTeam || filterStatus 
                  ? 'Try adjusting your filters to see more results' 
                  : 'No active team members available for assignment'
                }
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-glass-secondary uppercase tracking-wider">
                    Team Member
                  </th>
                  {dateArray.map(date => (
                    <th key={date} className="px-4 py-3 text-center text-xs font-medium text-glass-secondary uppercase tracking-wider">
                      <div>
                        {new Date(date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-glass-muted">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white/3 divide-y divide-white/10">
                {filteredTeams.map(team => (
                  <tr key={team.id} className="hover:bg-white/10">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-glass-primary">
                            {team.firstName} {team.lastName}
                          </div>
                          <div className="text-sm text-glass-secondary">
                            {team.region} • Cap: {team.capacity}
                          </div>
                        </div>
                      </div>
                    </td>
                    {dateArray.map(date => {
                      const cellAssignments = getCellAssignments(date, team.id);
                      const cellStatus = getCellStatus(date, team.id);
                      const utilization = getCellUtilization(date, team.id);
                      const cellConflicts = getCellConflicts(date, team.id);
                      
                      return (
                        <td
                          key={`${team.id}-${date}`}
                          className={`px-2 py-2 text-center cursor-pointer transition-colors ${
                            getCellStatusClass(cellStatus)
                          }`}
                          onClick={() => setSelectedCell({ date, teamMemberId: team.id })}
                          onDrop={(e) => handleDrop(date, team.id, e)}
                          onDragOver={handleDragOver}
                        >
                          <div className="min-h-[60px] p-2 rounded border-2 border-dashed border-transparent hover:border-white/30">
                            {cellAssignments.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium">
                                  {cellAssignments.length} / {team.capacity}
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      utilization > 100 ? 'bg-red-500' : 
                                      utilization > 80 ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  ></div>
                                </div>
                                {cellConflicts.length > 0 && (
                                  <div className="flex items-center justify-center">
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                  </div>
                                )}
                              </div>
                            )}
                            {cellAssignments.length === 0 && (
                              <div className="text-glass-muted text-xs">
                                Available
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    if (filteredTeams.length === 0) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white/40" />
              </div>
              <p className="text-white/80 text-lg mb-2">
                No team members found
              </p>
              <p className="text-white/50">
                {filterTeam || filterStatus 
                  ? 'Try adjusting your filters to see more results' 
                  : 'No active team members available for assignment'
                }
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredTeams.map(team => (
          <div key={team.id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-glass-primary">
                      {team.firstName} {team.lastName}
                    </h3>
                    <p className="text-sm text-glass-secondary">
                      {team.region} • Capacity: {team.capacity} jobs/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-glass-secondary">
                    {assignments.filter(a => a.leadId === team.id || a.assistantId === team.id).length} assignments
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-7 gap-4">
                {dateArray.map(date => {
                  const cellAssignments = getCellAssignments(date, team.id);
                  const cellStatus = getCellStatus(date, team.id);
                  const utilization = getCellUtilization(date, team.id);
                  
                  return (
                    <div
                      key={date}
                      className={`p-3 rounded-lg border ${getCellStatusClass(cellStatus)}`}
                      onDrop={(e) => handleDrop(date, team.id, e)}
                      onDragOver={handleDragOver}
                    >
                      <div className="text-xs font-medium text-center mb-2">
                        {new Date(date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {cellAssignments.length} / {team.capacity}
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              utilization > 100 ? 'bg-red-500' : 
                              utilization > 80 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Active Teams</div>
                <div className="text-2xl font-bold text-glass-primary">
                  {filteredTeams.length}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Total Assignments</div>
                <div className="text-2xl font-bold text-glass-primary">
                  {assignments.length}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Conflicts</div>
                <div className="text-2xl font-bold text-glass-primary">
                  {conflicts.filter(c => !c.resolvedAt).length}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <div className="text-sm font-medium text-glass-secondary">Avg Utilization</div>
                <div className="text-2xl font-bold text-glass-primary">
                  {Math.round(
                    filteredTeams.reduce((total, team) => {
                      const teamAssignments = assignments.filter(a => 
                        a.leadId === team.id || a.assistantId === team.id
                      ).length;
                      return total + (teamAssignments / team.capacity * 100);
                    }, 0) / Math.max(filteredTeams.length, 1)
                  )}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <input
              type="text"
              placeholder="Filter team members..."
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="form-input text-sm"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select text-sm"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="overbooked">Overbooked</option>
              <option value="conflict">Conflicts</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="glass-subtle rounded-xl p-1 flex space-x-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-accent-500/20 text-accent-300 shadow-lg border border-accent-500/30'
                  : 'text-glass-secondary hover:text-glass-primary hover:bg-white/10 border border-transparent'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-accent-500/20 text-accent-300 shadow-lg border border-accent-500/30'
                  : 'text-glass-secondary hover:text-glass-primary hover:bg-white/10 border border-transparent'
              }`}
            >
              List
            </button>
          </div>
          
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 backdrop-filter backdrop-blur-md">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                <span className="text-white/90 font-medium">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full shadow-sm"></div>
                <span className="text-white/90 font-medium">Assigned</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                <span className="text-white/90 font-medium">Overbooked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm"></div>
                <span className="text-white/90 font-medium">Conflicts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Content */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}
    </div>
  );
};

// Helper function to get cell status CSS classes
const getCellStatusClass = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-success-500/10 hover:bg-success-500/20 border-success-500/20';
    case 'assigned':
      return 'bg-accent-500/10 hover:bg-accent-500/20 border-accent-500/20';
    case 'overbooked':
      return 'bg-error-500/10 hover:bg-error-500/20 border-error-500/20';
    case 'conflict':
      return 'bg-warning-500/10 hover:bg-warning-500/20 border-warning-500/20';
    case 'unavailable':
      return 'bg-white/5 hover:bg-white/15 border-white/10';
    default:
      return 'bg-white/3 hover:bg-white/10 border-white/5';
  }
};

export default TeamAssignmentMatrix;