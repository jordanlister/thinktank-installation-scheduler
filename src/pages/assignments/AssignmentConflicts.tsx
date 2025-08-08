// Think Tank Technologies Installation Scheduler - Assignment Conflicts

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Eye,
  Zap,
  AlertCircle,
  Info,
  Filter,
  ArrowRight
} from 'lucide-react';
import { 
  useAppStore,
  useAssignmentConflicts,
  useAssignments,
  useTeams,
  useInstallations
} from '../../stores/useAppStore';
import type { 
  AssignmentConflict, 
  ConflictResolution,
  Assignment,
  TeamMember 
} from '../../types';

/**
 * Assignment Conflicts - Conflict detection and resolution interface
 * 
 * Features:
 * - Real-time conflict detection
 * - Conflict severity classification
 * - Automated resolution suggestions
 * - Manual conflict resolution
 * - Conflict history and audit trail
 */
const AssignmentConflicts: React.FC = () => {
  const { 
    detectConflicts,
    resolveConflict,
    removeConflict,
    updateAssignmentById,
    setError
  } = useAppStore();

  // State from store
  const conflicts = useAssignmentConflicts();
  const assignments = useAssignments();
  const teams = useTeams();
  const installations = useInstallations();

  // Local state
  const [selectedConflict, setSelectedConflict] = useState<AssignmentConflict | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'type' | 'detected' | 'affected'>('severity');
  const [showResolved, setShowResolved] = useState(false);
  const [autoResolveInProgress, setAutoResolveInProgress] = useState(false);

  // Filter and sort conflicts
  const filteredConflicts = useMemo(() => {
    let filtered = conflicts.filter(conflict => {
      if (!showResolved && conflict.resolvedAt) return false;
      if (filterSeverity !== 'all' && conflict.severity !== filterSeverity) return false;
      if (filterType !== 'all' && conflict.type !== filterType) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'type':
          return a.type.localeCompare(b.type);
        case 'detected':
          return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
        case 'affected':
          return b.affectedAssignments.length - a.affectedAssignments.length;
        default:
          return 0;
      }
    });

    return filtered;
  }, [conflicts, showResolved, filterSeverity, filterType, sortBy]);

  // Conflict statistics
  const conflictStats = useMemo(() => {
    const activeConflicts = conflicts.filter(c => !c.resolvedAt);
    const resolvedConflicts = conflicts.filter(c => c.resolvedAt);
    
    const bySeverity = activeConflicts.reduce((acc, conflict) => {
      acc[conflict.severity] = (acc[conflict.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = activeConflicts.reduce((acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const autoResolvable = activeConflicts.filter(c => c.autoResolvable).length;

    return {
      total: conflicts.length,
      active: activeConflicts.length,
      resolved: resolvedConflicts.length,
      critical: bySeverity.critical || 0,
      high: bySeverity.high || 0,
      medium: bySeverity.medium || 0,
      low: bySeverity.low || 0,
      autoResolvable,
      byType
    };
  }, [conflicts]);

  // Get conflict details
  const getConflictDetails = (conflict: AssignmentConflict) => {
    const affectedAssignments = assignments.filter(a => 
      conflict.affectedAssignments.includes(a.id)
    );
    
    const affectedTeams = teams.filter(t => 
      affectedAssignments.some(a => a.leadId === t.id || a.assistantId === t.id)
    );
    
    const affectedJobs = installations.filter(j => 
      affectedAssignments.some(a => a.installationId === j.id)
    );

    return {
      assignments: affectedAssignments,
      teams: affectedTeams,
      jobs: affectedJobs
    };
  };

  // Handle automatic conflict resolution
  const handleAutoResolve = async () => {
    setAutoResolveInProgress(true);
    try {
      const autoResolvableConflicts = conflicts.filter(c => c.autoResolvable && !c.resolvedAt);
      
      for (const conflict of autoResolvableConflicts) {
        if (conflict.suggestedResolutions.length > 0) {
          const resolution = conflict.suggestedResolutions[0];
          await resolveConflict(conflict.id, resolution);
        }
      }
      
      detectConflicts(); // Re-run detection after resolution
    } catch (error) {
      setError(`Auto-resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAutoResolveInProgress(false);
    }
  };

  // Handle manual conflict resolution
  const handleManualResolve = async (conflictId: string, resolution: ConflictResolution) => {
    try {
      await resolveConflict(conflictId, resolution);
      setSelectedConflict(null);
    } catch (error) {
      setError(`Conflict resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle conflict dismissal
  const handleDismiss = async (conflictId: string) => {
    try {
      await removeConflict(conflictId);
    } catch (error) {
      setError(`Failed to dismiss conflict: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Conflicts"
          value={conflictStats.total}
          icon={AlertTriangle}
          color="gray"
        />
        <StatCard
          title="Active"
          value={conflictStats.active}
          icon={AlertCircle}
          color={conflictStats.active > 0 ? "red" : "green"}
        />
        <StatCard
          title="Critical"
          value={conflictStats.critical}
          icon={AlertTriangle}
          color="red"
          alert={conflictStats.critical > 0}
        />
        <StatCard
          title="High Priority"
          value={conflictStats.high}
          icon={AlertTriangle}
          color="orange"
          alert={conflictStats.high > 0}
        />
        <StatCard
          title="Auto Resolvable"
          value={conflictStats.autoResolvable}
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Resolved"
          value={conflictStats.resolved}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => detectConflicts()}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Detect Conflicts</span>
          </button>
          
          {conflictStats.autoResolvable > 0 && (
            <button
              onClick={handleAutoResolve}
              disabled={autoResolveInProgress}
              className="btn-primary flex items-center space-x-2"
            >
              {autoResolveInProgress ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>Auto Resolve ({conflictStats.autoResolvable})</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="form-select text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select text-sm"
          >
            <option value="all">All Types</option>
            <option value="time_overlap">Time Overlap</option>
            <option value="skill_mismatch">Skill Mismatch</option>
            <option value="capacity_exceeded">Capacity Exceeded</option>
            <option value="travel_distance">Travel Distance</option>
            <option value="availability">Availability</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-select text-sm"
          >
            <option value="severity">Sort by Severity</option>
            <option value="type">Sort by Type</option>
            <option value="detected">Sort by Date</option>
            <option value="affected">Sort by Impact</option>
          </select>
          
          <label className="flex items-center space-x-3 text-sm cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full border-2 transition-colors duration-200 ${
                showResolved 
                  ? 'bg-accent-500/30 border-accent-500/50' 
                  : 'bg-white/10 border-white/30'
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${
                  showResolved ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </div>
            </div>
            <span className="text-white/90">Show Resolved</span>
          </label>
        </div>
      </div>

      {/* Conflicts List */}
      {filteredConflicts.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-glass-primary mb-2">
              No Conflicts Found
            </h3>
            <p className="text-glass-secondary">
              {conflicts.length === 0 
                ? "All assignments are conflict-free!" 
                : "No conflicts match your current filters."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConflicts.map(conflict => {
            const details = getConflictDetails(conflict);
            
            return (
              <div
                key={conflict.id}
                className={`card border-l-4 ${
                  conflict.severity === 'critical' ? 'border-red-500' :
                  conflict.severity === 'high' ? 'border-orange-500' :
                  conflict.severity === 'medium' ? 'border-yellow-500' :
                  'border-blue-500'
                } ${conflict.resolvedAt ? 'bg-white/5' : ''}`}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <SeverityBadge severity={conflict.severity} />
                        <TypeBadge type={conflict.type} />
                        {conflict.autoResolvable && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto-resolvable
                          </span>
                        )}
                        {conflict.resolvedAt && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-medium text-glass-primary mb-2">
                        {conflict.description}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-glass-secondary">
                        <div>
                          <span className="font-medium">Affected Teams:</span>
                          <div className="mt-1">
                            {details.teams.map(team => (
                              <div key={team.id} className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{team.firstName} {team.lastName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Affected Jobs:</span>
                          <div className="mt-1">
                            {details.jobs.map(job => (
                              <div key={job.id} className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{job.customerName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Impact Score:</span>
                          <div className="mt-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-white/20 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    conflict.impactScore > 7 ? 'bg-red-500' :
                                    conflict.impactScore > 5 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${(conflict.impactScore / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{conflict.impactScore}/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-xs text-glass-secondary">
                        Detected: {new Date(conflict.detectedAt).toLocaleDateString()} at {new Date(conflict.detectedAt).toLocaleTimeString()}
                        {conflict.resolvedAt && (
                          <span className="ml-4">
                            Resolved: {new Date(conflict.resolvedAt).toLocaleDateString()} at {new Date(conflict.resolvedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedConflict(conflict)}
                        className="btn-secondary text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      
                      {!conflict.resolvedAt && (
                        <button
                          onClick={() => handleDismiss(conflict.id)}
                          className="btn-ghost text-sm text-glass-secondary hover:text-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {conflict.suggestedResolutions.length > 0 && !conflict.resolvedAt && (
                    <div className="mt-4 pt-4 border-t border-white/15">
                      <h5 className="text-sm font-medium text-glass-primary mb-2">
                        Suggested Resolutions:
                      </h5>
                      <div className="space-y-2">
                        {conflict.suggestedResolutions.slice(0, 2).map((resolution, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm">
                              <div className="font-medium text-blue-900">
                                {resolution.method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="text-blue-700">
                                {resolution.description}
                              </div>
                            </div>
                            <button
                              onClick={() => handleManualResolve(conflict.id, resolution)}
                              className="btn-primary text-sm"
                            >
                              Apply
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conflict Detail Modal */}
      {selectedConflict && (
        <ConflictDetailModal
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onResolve={(resolution) => handleManualResolve(selectedConflict.id, resolution)}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  alert?: boolean;
}> = ({ title, value, icon: Icon, color, alert }) => {
  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    gray: 'text-white/60'
  };

  const actualColor = alert ? 'red' : color;

  return (
    <div className="card group rounded-xl transition-all duration-300 min-w-0">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/70 mb-1 leading-tight">
              {title}
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              {value}
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColors[actualColor as keyof typeof iconColors]}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Severity Badge Component
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const getBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-white/15 text-glass-primary';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(severity)}`}>
      {severity.toUpperCase()}
    </span>
  );
};

// Type Badge Component  
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/15 text-glass-primary">
      {getTypeLabel(type)}
    </span>
  );
};

// Conflict Detail Modal Component
const ConflictDetailModal: React.FC<{
  conflict: AssignmentConflict;
  onClose: () => void;
  onResolve: (resolution: ConflictResolution) => void;
}> = ({ conflict, onClose, onResolve }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-glass-primary">
              Conflict Details
            </h2>
            <div className="flex items-center space-x-2 mt-2">
              <SeverityBadge severity={conflict.severity} />
              <TypeBadge type={conflict.type} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-glass-muted hover:text-glass-secondary"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-glass-primary mb-2">
              Description
            </h3>
            <p className="text-glass-primary">{conflict.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-glass-primary mb-2">
              Suggested Resolutions
            </h3>
            <div className="space-y-3">
              {conflict.suggestedResolutions.map((resolution, index) => (
                <div key={index} className="border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-glass-primary">
                        {resolution.method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <p className="text-sm text-glass-secondary mt-1">
                        {resolution.description}
                      </p>
                      <div className="text-xs text-glass-secondary mt-2">
                        Impact Score: {resolution.impactScore}/10 • 
                        Estimated Effort: {resolution.estimatedEffort} minutes
                      </div>
                    </div>
                    <button
                      onClick={() => onResolve(resolution)}
                      className="btn-primary"
                    >
                      Apply Resolution
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentConflicts;