// Think Tank Technologies Installation Scheduler - Enhanced Conflict Resolution Panel

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, AlertTriangle, CheckCircle, Clock, Users, MapPin, Zap, TrendingUp, 
  Shield, RefreshCw, Filter, Search, ChevronDown, ChevronUp, Eye,
  Calendar, AlertCircle, Info, Settings, History, Download
} from 'lucide-react';
import type { 
  SchedulingConflict, OptimizedAssignment, TeamMember, AssignmentConflict,
  ConflictResolution, ResolutionImpact, DateRange, ConflictTimelineEvent,
  ConflictAnalytics, ConflictResolutionHistory
} from '../../types';
import { detectConflicts, resolveConflicts } from '../../utils/conflictResolver';
import ConflictTimeline from './ConflictTimeline';
import ResolutionSuggestions from './ResolutionSuggestions';
import ImpactAssessment from './ImpactAssessment';
import ConflictPreview from './ConflictPreview';
import ResolutionHistory from './ResolutionHistory';

interface ConflictResolutionPanelProps {
  conflicts: SchedulingConflict[];
  assignments: OptimizedAssignment[];
  teams: TeamMember[];
  onClose: () => void;
  onResolve: (resolvedAssignments: OptimizedAssignment[]) => void;
  onPreview?: (changes: any[]) => void;
  dateRange?: DateRange;
  realTimeUpdates?: boolean;
}

interface ConflictFilter {
  severity: string[];
  type: string[];
  autoResolvable: boolean | null;
  teamMembers: string[];
  dateRange: DateRange | null;
}

type ViewMode = 'dashboard' | 'timeline' | 'suggestions' | 'preview' | 'history' | 'analytics';

/**
 * Enhanced Conflict Resolution Panel Component
 * 
 * Comprehensive conflict detection and resolution system with:
 * - Real-time conflict detection
 * - Visual conflict timeline
 * - AI-powered resolution suggestions
 * - Impact assessment
 * - Conflict prevention recommendations
 */
const ConflictResolutionPanel: React.FC<ConflictResolutionPanelProps> = ({
  conflicts,
  assignments,
  teams,
  onClose,
  onResolve,
  onPreview,
  dateRange = { start: new Date().toISOString(), end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  realTimeUpdates = true
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([]);
  const [resolvedConflicts, setResolvedConflicts] = useState<ConflictResolutionHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ConflictFilter>({
    severity: [],
    type: [],
    autoResolvable: null,
    teamMembers: [],
    dateRange: null
  });
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [resolutionSuggestions, setResolutionSuggestions] = useState<Map<string, ConflictResolution[]>>(new Map());
  const [impactAssessments, setImpactAssessments] = useState<Map<string, ResolutionImpact>>(new Map());
  const [timelineEvents, setTimelineEvents] = useState<ConflictTimelineEvent[]>([]);

  // Real-time conflict detection
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // Would integrate with real-time conflict detection service
      console.log('Checking for new conflicts...');
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Filter conflicts based on current filters
  const filteredConflicts = useMemo(() => {
    return conflicts.filter(conflict => {
      if (searchTerm && !conflict.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.severity.length > 0 && !filters.severity.includes(conflict.severity)) {
        return false;
      }

      if (filters.type.length > 0 && !filters.type.includes(conflict.type)) {
        return false;
      }

      if (filters.autoResolvable !== null && conflict.autoResolvable !== filters.autoResolvable) {
        return false;
      }

      if (filters.teamMembers.length > 0 && 
          !conflict.affectedTeamMembers.some(id => filters.teamMembers.includes(id))) {
        return false;
      }

      return true;
    });
  }, [conflicts, searchTerm, filters]);

  // Calculate analytics
  const analytics: ConflictAnalytics = useMemo(() => {
    const totalConflicts = conflicts.length;
    const resolvedCount = resolvedConflicts.filter(r => r.outcome === 'successful').length;
    const conflictsByType = conflicts.reduce((acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalConflicts,
      resolvedConflicts: resolvedCount,
      averageResolutionTime: resolvedConflicts.length > 0 
        ? resolvedConflicts.reduce((sum, r) => sum + r.metrics.timeToResolve, 0) / resolvedConflicts.length 
        : 0,
      conflictsByType,
      resolutionSuccessRate: totalConflicts > 0 ? (resolvedCount / totalConflicts) * 100 : 100,
      preventionRecommendations: generatePreventionRecommendations(conflicts)
    };
  }, [conflicts, resolvedConflicts]);

  const handleToggleConflict = (conflictId: string) => {
    setSelectedConflicts(prev => 
      prev.includes(conflictId) 
        ? prev.filter(id => id !== conflictId)
        : [...prev, conflictId]
    );
  };

  const handleExpandConflict = (conflictId: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conflictId)) {
        newSet.delete(conflictId);
      } else {
        newSet.add(conflictId);
      }
      return newSet;
    });
  };

  const handleAutoResolve = async () => {
    setIsProcessing(true);
    try {
      // Implement auto-resolution logic
      const resolvableConflicts = filteredConflicts.filter(c => c.autoResolvable);
      console.log(`Auto-resolving ${resolvableConflicts.length} conflicts...`);
      
      // Would call actual resolution service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      onResolve(assignments);
    } catch (error) {
      console.error('Auto-resolution failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkResolve = async () => {
    if (selectedConflicts.length === 0) return;
    
    setIsProcessing(true);
    try {
      console.log(`Bulk resolving ${selectedConflicts.length} selected conflicts...`);
      // Would implement bulk resolution logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSelectedConflicts([]);
    } catch (error) {
      console.error('Bulk resolution failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
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

  const renderConflictCard = (conflict: SchedulingConflict) => {
    const isExpanded = expandedConflicts.has(conflict.id);
    const SeverityIcon = getSeverityIcon(conflict.severity);

    return (
      <div key={conflict.id} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <input
                type="checkbox"
                checked={selectedConflicts.includes(conflict.id)}
                onChange={() => handleToggleConflict(conflict.id)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <SeverityIcon className="w-4 h-4" />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(conflict.severity)}`}>
                    {conflict.severity.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {conflict.type.replace('_', ' ').toUpperCase()}
                  </span>
                  {conflict.autoResolvable && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Auto-resolvable
                    </span>
                  )}
                </div>
                <p className="text-gray-900 font-medium mb-1">{conflict.description}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Affected jobs: {conflict.affectedJobs.length}</div>
                  <div>Team members: {conflict.affectedTeamMembers.length}</div>
                  {conflict.suggestedResolution && (
                    <div className="text-blue-600">Suggestion: {conflict.suggestedResolution}</div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleExpandConflict(conflict.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Affected Assignments</h4>
                <div className="space-y-1">
                  {conflict.affectedJobs.map(jobId => (
                    <div key={jobId} className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                      Job #{jobId.slice(0, 8)}...
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Team Members</h4>
                <div className="space-y-1">
                  {conflict.affectedTeamMembers.map(memberId => {
                    const member = teams.find(t => t.id === memberId);
                    return (
                      <div key={memberId} className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                        {member ? `${member.firstName} ${member.lastName}` : `ID: ${memberId.slice(0, 8)}...`}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {conflict.suggestedResolution && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Suggested Resolution</h4>
                <p className="text-blue-800 text-sm">{conflict.suggestedResolution}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-900">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {conflicts.filter(c => c.severity === 'critical').length}
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-orange-900">High Priority</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {conflicts.filter(c => c.severity === 'high').length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Zap className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-900">Auto-resolvable</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {conflicts.filter(c => c.autoResolvable).length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {Math.round(analytics.resolutionSuccessRate)}%
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conflicts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button 
            onClick={() => setViewMode('analytics')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedConflicts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 font-medium">
              {selectedConflicts.length} conflict{selectedConflicts.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedConflicts([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear selection
              </button>
              <button
                onClick={handleBulkResolve}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Resolve Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts List */}
      <div className="space-y-4">
        {filteredConflicts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || Object.values(filters).some(f => f && (Array.isArray(f) ? f.length > 0 : true)) 
              ? 'No conflicts match your current filters.' 
              : 'No conflicts detected. Great job!'}
          </div>
        ) : (
          filteredConflicts.map(renderConflictCard)
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Conflict Resolution Center</h2>
              <p className="text-sm text-gray-600 mt-1">
                {analytics.totalConflicts} total conflicts • {analytics.resolvedConflicts} resolved • {Math.round(analytics.resolutionSuccessRate)}% success rate
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {realTimeUpdates && (
              <div className="flex items-center text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Updates
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex px-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Shield },
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'suggestions', label: 'AI Suggestions', icon: Zap },
              { id: 'preview', label: 'Preview Changes', icon: Eye },
              { id: 'history', label: 'History', icon: History },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as ViewMode)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 mr-8 ${
                  viewMode === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'timeline' && <ConflictTimeline conflicts={conflicts} events={timelineEvents} />}
          {viewMode === 'suggestions' && <ResolutionSuggestions conflicts={filteredConflicts} onApply={handleAutoResolve} />}
          {viewMode === 'preview' && <ConflictPreview conflicts={filteredConflicts} assignments={assignments} />}
          {viewMode === 'history' && <ResolutionHistory history={resolvedConflicts} />}
          {viewMode === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Conflict Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-4">Conflicts by Type</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.conflictsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600">{type.replace('_', ' ')}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-4">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg. Resolution Time</span>
                      <span className="font-medium">{Math.round(analytics.averageResolutionTime)}min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="font-medium">{Math.round(analytics.resolutionSuccessRate)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Resolved</span>
                      <span className="font-medium">{analytics.resolvedConflicts}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-4">Prevention Tips</h4>
                  <div className="space-y-2">
                    {analytics.preventionRecommendations.slice(0, 3).map((tip, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            {conflicts.length > 0 && (
              <span>{conflicts.filter(c => c.autoResolvable).length} auto-resolvable conflicts</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.open('/conflict-report', '_blank')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button 
              onClick={handleAutoResolve}
              disabled={isProcessing || conflicts.filter(c => c.autoResolvable).length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Resolving...' : 'Auto-Resolve All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate prevention recommendations
function generatePreventionRecommendations(conflicts: SchedulingConflict[]): string[] {
  const recommendations: string[] = [];
  const typeCount = conflicts.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  if (typeCount['time_overlap'] > 2) {
    recommendations.push('Consider implementing buffer times between assignments');
  }
  
  if (typeCount['capacity_exceeded'] > 1) {
    recommendations.push('Review team capacity limits and workload distribution');
  }
  
  if (typeCount['travel_distance'] > 1) {
    recommendations.push('Optimize geographic clustering of assignments');
  }
  
  if (typeCount['unavailable_team'] > 0) {
    recommendations.push('Improve availability tracking and validation');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current conflict prevention practices');
  }

  return recommendations;
}

export default ConflictResolutionPanel;