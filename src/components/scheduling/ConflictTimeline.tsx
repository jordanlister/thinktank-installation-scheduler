// Think Tank Technologies Installation Scheduler - Conflict Timeline Component

import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, Info, AlertCircle,
  Zap, Users, MapPin, Filter, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RefreshCw, Download
} from 'lucide-react';
import type { SchedulingConflict, ConflictTimelineEvent } from '../../types';

interface ConflictTimelineProps {
  conflicts: SchedulingConflict[];
  events: ConflictTimelineEvent[];
  onResolveConflict?: (conflictId: string) => void;
  onViewDetails?: (conflictId: string) => void;
}

interface TimelineFilter {
  severity: string[];
  type: string[];
  dateRange: { start: string; end: string } | null;
  showResolved: boolean;
}

type TimelineView = 'hour' | 'day' | 'week' | 'month';

/**
 * Interactive Conflict Timeline Component
 * 
 * Visual timeline showing conflicts and their relationships over time with:
 * - Interactive timeline with zoom and filter capabilities
 * - Color-coded severity levels
 * - Conflict clustering and grouping
 * - Real-time updates and animations
 */
const ConflictTimeline: React.FC<ConflictTimelineProps> = ({
  conflicts,
  events,
  onResolveConflict,
  onViewDetails
}) => {
  const [timelineView, setTimelineView] = useState<TimelineView>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<TimelineFilter>({
    severity: [],
    type: [],
    dateRange: null,
    showResolved: true
  });
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Generate timeline data
  const timelineData = useMemo(() => {
    const now = new Date();
    const data: { [key: string]: { conflicts: SchedulingConflict[]; events: ConflictTimelineEvent[] } } = {};
    
    // Group conflicts by time period
    conflicts.forEach(conflict => {
      // For demo, we'll use current time - in real app would use conflict timestamp
      const conflictDate = new Date();
      const key = getTimeKey(conflictDate, timelineView);
      
      if (!data[key]) {
        data[key] = { conflicts: [], events: [] };
      }
      
      if (passesFilters(conflict, filters)) {
        data[key].conflicts.push(conflict);
      }
    });
    
    // Group events by time period
    events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const key = getTimeKey(eventDate, timelineView);
      
      if (!data[key]) {
        data[key] = { conflicts: [], events: [] };
      }
      
      data[key].events.push(event);
    });
    
    return data;
  }, [conflicts, events, filters, timelineView]);

  // Generate time periods for current view
  const timePeriods = useMemo(() => {
    const periods: string[] = [];
    const startDate = getViewStartDate(currentDate, timelineView);
    const periodsCount = getPeriodsCount(timelineView);
    
    for (let i = 0; i < periodsCount; i++) {
      const periodDate = new Date(startDate);
      
      switch (timelineView) {
        case 'hour':
          periodDate.setHours(startDate.getHours() + i);
          break;
        case 'day':
          periodDate.setDate(startDate.getDate() + i);
          break;
        case 'week':
          periodDate.setDate(startDate.getDate() + (i * 7));
          break;
        case 'month':
          periodDate.setMonth(startDate.getMonth() + i);
          break;
      }
      
      periods.push(getTimeKey(periodDate, timelineView));
    }
    
    return periods;
  }, [currentDate, timelineView]);

  const handleTimelineNavigation = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (timelineView) {
      case 'hour':
        newDate.setHours(newDate.getHours() + (direction === 'next' ? 24 : -24));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 28 : -28));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 12 : -12));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertCircle;
      case 'high': return AlertTriangle;
      case 'medium': return Info;
      case 'low': return CheckCircle;
      default: return Info;
    }
  };

  const renderTimelineHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-gray-900">Conflict Timeline</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`px-3 py-1 rounded-lg text-sm flex items-center ${
              isAutoScrolling 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isAutoScrolling ? 'animate-spin' : ''}`} />
            Live Updates
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* View Controls */}
        <div className="flex border border-gray-300 rounded-lg">
          {(['hour', 'day', 'week', 'month'] as TimelineView[]).map((view) => (
            <button
              key={view}
              onClick={() => setTimelineView(view)}
              className={`px-3 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg ${
                timelineView === view
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Navigation Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleTimelineNavigation('prev')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={() => handleTimelineNavigation('next')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderTimelineFilters = () => (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h4 className="text-sm font-medium text-gray-900">Filters</h4>
          
          {/* Severity Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Severity:</span>
            <div className="flex space-x-1">
              {['critical', 'high', 'medium', 'low'].map((severity) => (
                <button
                  key={severity}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      severity: prev.severity.includes(severity)
                        ? prev.severity.filter(s => s !== severity)
                        : [...prev.severity, severity]
                    }));
                  }}
                  className={`px-2 py-1 text-xs rounded-full border ${
                    filters.severity.includes(severity)
                      ? `${getSeverityColor(severity)} text-white border-transparent`
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>
          
          {/* Show Resolved Toggle */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.showResolved}
              onChange={(e) => setFilters(prev => ({ ...prev, showResolved: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <span className="text-sm text-gray-600">Show Resolved</span>
          </label>
        </div>
        
        <div className="text-sm text-gray-500">
          Showing {conflicts.filter(c => passesFilters(c, filters)).length} of {conflicts.length} conflicts
        </div>
      </div>
    </div>
  );

  const renderTimelinePeriod = (periodKey: string, index: number) => {
    const periodData = timelineData[periodKey];
    const hasData = periodData && (periodData.conflicts.length > 0 || periodData.events.length > 0);
    const isCurrentPeriod = isCurrentTimePeriod(periodKey, timelineView);
    
    return (
      <div
        key={periodKey}
        className={`relative flex-1 min-w-0 border-l border-gray-200 ${
          isCurrentPeriod ? 'bg-blue-50' : ''
        }`}
        style={{ minHeight: '400px' }}
      >
        {/* Period Header */}
        <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-900">
            {formatPeriodLabel(periodKey, timelineView)}
          </div>
          {periodData && (
            <div className="text-xs text-gray-500 mt-1">
              {periodData.conflicts.length} conflicts
            </div>
          )}
        </div>
        
        {/* Timeline Content */}
        <div className="p-2 space-y-2">
          {periodData?.conflicts.map((conflict, conflictIndex) => {
            const SeverityIcon = getSeverityIcon(conflict.severity);
            const isSelected = selectedConflict === conflict.id;
            
            return (
              <div
                key={conflict.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedConflict(isSelected ? null : conflict.id)}
                style={{
                  marginTop: `${conflictIndex * 20}px`,
                  marginLeft: `${(conflictIndex % 3) * 10}px`
                }}
              >
                <div className="flex items-start space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(conflict.severity)} flex-shrink-0 mt-1`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {conflict.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {conflict.affectedJobs.length} jobs
                    </div>
                    {conflict.autoResolvable && (
                      <div className="flex items-center mt-1">
                        <Zap className="w-3 h-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">Auto-fix</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Timeline Events */}
          {periodData?.events.map((event) => (
            <div
              key={event.id}
              className="flex items-center space-x-2 p-2 bg-gray-100 rounded text-xs"
            >
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-gray-600">{event.description}</span>
            </div>
          ))}
        </div>
        
        {/* Current Time Indicator */}
        {isCurrentPeriod && (
          <div className="absolute top-20 left-0 w-full">
            <div className="w-full h-px bg-red-500">
              <div className="absolute right-0 -top-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConflictDetails = () => {
    if (!selectedConflict) return null;
    
    const conflict = conflicts.find(c => c.id === selectedConflict);
    if (!conflict) return null;
    
    const SeverityIcon = getSeverityIcon(conflict.severity);
    
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4 mt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <SeverityIcon className="w-5 h-5" />
            <div>
              <h4 className="font-medium text-gray-900">{conflict.description}</h4>
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(conflict.severity).replace('bg-', 'bg-opacity-20 text-')}`}>
                  {conflict.severity}
                </span>
                <span>{conflict.type.replace('_', ' ')}</span>
                <span>{conflict.affectedJobs.length} jobs affected</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {conflict.autoResolvable && (
              <button
                onClick={() => onResolveConflict?.(conflict.id)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
              >
                <Zap className="w-4 h-4 mr-1" />
                Auto-Resolve
              </button>
            )}
            <button
              onClick={() => onViewDetails?.(conflict.id)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              View Details
            </button>
          </div>
        </div>
        
        {conflict.suggestedResolution && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-1">Suggested Resolution</h5>
            <p className="text-blue-800 text-sm">{conflict.suggestedResolution}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderTimelineHeader()}
      {renderTimelineFilters()}
      
      {/* Timeline Container */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto" style={{ minHeight: '400px' }}>
          {timePeriods.map((period, index) => renderTimelinePeriod(period, index))}
        </div>
      </div>
      
      {renderConflictDetails()}
      
      {/* Legend */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { severity: 'critical', label: 'Critical', description: 'Immediate attention required' },
            { severity: 'high', label: 'High Priority', description: 'Resolve within hours' },
            { severity: 'medium', label: 'Medium', description: 'Resolve within day' },
            { severity: 'low', label: 'Low Priority', description: 'Can be scheduled' }
          ].map(({ severity, label, description }) => (
            <div key={severity} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`} />
              <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getTimeKey(date: Date, view: TimelineView): string {
  switch (view) {
    case 'hour':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    case 'day':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
    case 'month':
      return `${date.getFullYear()}-${date.getMonth()}`;
    default:
      return '';
  }
}

function getViewStartDate(currentDate: Date, view: TimelineView): Date {
  const start = new Date(currentDate);
  
  switch (view) {
    case 'hour':
      start.setHours(start.getHours() - 12);
      break;
    case 'day':
      start.setDate(start.getDate() - 3);
      break;
    case 'week':
      start.setDate(start.getDate() - 14);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 6);
      break;
  }
  
  return start;
}

function getPeriodsCount(view: TimelineView): number {
  switch (view) {
    case 'hour': return 24;
    case 'day': return 7;
    case 'week': return 4;
    case 'month': return 12;
    default: return 7;
  }
}

function passesFilters(conflict: SchedulingConflict, filters: TimelineFilter): boolean {
  if (filters.severity.length > 0 && !filters.severity.includes(conflict.severity)) {
    return false;
  }
  
  if (filters.type.length > 0 && !filters.type.includes(conflict.type)) {
    return false;
  }
  
  // Additional filter logic would go here
  
  return true;
}

function isCurrentTimePeriod(periodKey: string, view: TimelineView): boolean {
  const now = new Date();
  const currentKey = getTimeKey(now, view);
  return periodKey === currentKey;
}

function formatPeriodLabel(periodKey: string, view: TimelineView): string {
  const parts = periodKey.split('-').map(Number);
  const date = new Date(parts[0], parts[1], parts[2] || 1, parts[3] || 0);
  
  switch (view) {
    case 'hour':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'day':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case 'week':
      return `Week of ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    case 'month':
      return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
    default:
      return '';
  }
}

export default ConflictTimeline;