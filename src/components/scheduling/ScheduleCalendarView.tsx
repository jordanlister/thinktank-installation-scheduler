// Think Tank Technologies Installation Scheduler - Calendar View

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, User, AlertTriangle } from 'lucide-react';
import type {
  SchedulingResult,
  TeamMember,
  ScheduleViewConfig,
  OptimizedAssignment,
  DailySchedule
} from '../../types';

interface ScheduleCalendarViewProps {
  schedulingResult: SchedulingResult;
  teams: TeamMember[];
  viewConfig: ScheduleViewConfig;
  onAssignmentChange: (sourceJobId: string, targetTeamId: string, targetDate: string) => void;
}

/**
 * Calendar View Component for Schedule Visualization
 * 
 * Provides a calendar-based interface for viewing and managing
 * installation assignments with drag-and-drop capabilities
 */
const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  schedulingResult,
  teams,
  viewConfig,
  onAssignmentChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedAssignment, setDraggedAssignment] = useState<OptimizedAssignment | null>(null);

  // Generate calendar dates for the current month
  const calendarDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // Adjust to show full weeks
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [currentDate]);

  // Group assignments by date
  const assignmentsByDate = useMemo(() => {
    const grouped: { [date: string]: OptimizedAssignment[] } = {};
    
    schedulingResult.assignments.forEach(assignment => {
      // For now, we'll use a placeholder date since we don't have actual job dates
      // In production, this would come from the installation data
      const date = new Date().toISOString().split('T')[0];
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(assignment);
    });
    
    return grouped;
  }, [schedulingResult.assignments]);

  // Get team member by ID
  const getTeamMember = (teamId: string): TeamMember | undefined => {
    return teams.find(team => team.id === teamId);
  };

  // Handle navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, assignment: OptimizedAssignment) => {
    setDraggedAssignment(assignment);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, date: Date, teamId?: string) => {
    e.preventDefault();
    
    if (!draggedAssignment) return;
    
    const targetDate = date.toISOString().split('T')[0];
    const targetTeamId = teamId || draggedAssignment.leadId || draggedAssignment.assistantId || '';
    
    onAssignmentChange(draggedAssignment.installationId, targetTeamId, targetDate);
    setDraggedAssignment(null);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get assignment color based on team
  const getAssignmentColor = (teamId: string) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-red-100 border-red-300 text-red-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800',
    ];
    
    const teamIndex = teams.findIndex(team => team.id === teamId);
    return colors[teamIndex % colors.length] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
            >
              Today
            </button>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-medium text-gray-500 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-4">
          {calendarDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayAssignments = assignmentsByDate[dateStr] || [];
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-32 border border-gray-200 rounded-lg p-2 transition-colors ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
              >
                {/* Date Header */}
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-primary-600' : ''}`}>
                  {date.getDate()}
                </div>

                {/* Assignments */}
                <div className="space-y-1">
                  {dayAssignments.slice(0, 3).map((assignment) => {
                    const teamId = assignment.leadId || assignment.assistantId || '';
                    const team = getTeamMember(teamId);
                    const colorClass = getAssignmentColor(teamId);

                    return (
                      <div
                        key={assignment.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, assignment)}
                        className={`${colorClass} border rounded px-2 py-1 text-xs cursor-move hover:shadow-sm transition-shadow`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">
                            {team ? `${team.firstName} ${team.lastName[0]}.` : 'Unassigned'}
                          </span>
                          {assignment.estimatedTravelDistance > 0 && (
                            <MapPin className="w-3 h-3 ml-1 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center text-xs opacity-75 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{assignment.estimatedTravelTime}min</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Show "more" indicator if there are additional assignments */}
                  {dayAssignments.length > 3 && (
                    <div className="text-xs text-gray-500 px-2 py-1">
                      +{dayAssignments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Legend */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Team Members:</span>
            
            <div className="flex items-center space-x-3">
              {teams.slice(0, 6).map((team) => {
                const colorClass = getAssignmentColor(team.id);
                return (
                  <div key={team.id} className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded border ${colorClass}`} />
                    <span className="text-sm text-gray-600">
                      {team.firstName} {team.lastName[0]}.
                    </span>
                  </div>
                );
              })}
              
              {teams.length > 6 && (
                <span className="text-sm text-gray-500">
                  +{teams.length - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{schedulingResult.assignments.length} assignments</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{Math.round(schedulingResult.optimizationMetrics.totalTravelDistance)} mi</span>
            </div>
            
            {schedulingResult.conflicts.length > 0 && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{schedulingResult.conflicts.length} conflicts</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendarView;