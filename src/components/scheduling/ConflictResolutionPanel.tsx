// Think Tank Technologies Installation Scheduler - Conflict Resolution Panel (Placeholder)

import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import type { SchedulingConflict, OptimizedAssignment, TeamMember } from '../../types';

interface ConflictResolutionPanelProps {
  conflicts: SchedulingConflict[];
  assignments: OptimizedAssignment[];
  teams: TeamMember[];
  onClose: () => void;
  onResolve: (resolvedAssignments: OptimizedAssignment[]) => void;
}

/**
 * Conflict Resolution Panel Component (Placeholder)
 * 
 * Would provide interface for resolving scheduling conflicts
 */
const ConflictResolutionPanel: React.FC<ConflictResolutionPanelProps> = ({
  conflicts,
  assignments,
  teams,
  onClose,
  onResolve
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Resolve Conflicts</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Conflict Resolution Interface
            </h3>
            <p className="text-gray-500 mb-4">
              Advanced conflict detection and resolution system with automated suggestions.
            </p>
            <div className="text-sm text-gray-600">
              {conflicts.length} conflicts detected
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button 
            onClick={() => onResolve(assignments)}
            className="btn-primary"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Auto-Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionPanel;