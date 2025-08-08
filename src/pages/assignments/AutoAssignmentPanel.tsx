// Think Tank Technologies Installation Scheduler - Auto Assignment Panel

import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Zap,
  Target,
  Users,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Save,
  Play,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Sliders,
  BarChart3
} from 'lucide-react';
import { 
  useAppStore,
  useAutoAssignmentRules,
  useInstallations,
  useTeams,
  useAssignments
} from '../../stores/useAppStore';
import type { 
  AutoAssignmentCriteria,
  AutoAssignmentRule,
  BulkAssignmentRequest,
  OptimizationGoal
} from '../../types';

interface AutoAssignmentPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Auto Assignment Panel - Automated assignment tools and rules
 * 
 * Features:
 * - Configurable assignment criteria
 * - Multiple optimization goals
 * - Custom assignment rules
 * - Bulk assignment operations
 * - Performance analytics
 */
const AutoAssignmentPanel: React.FC<AutoAssignmentPanelProps> = ({ 
  isOpen = true, 
  onClose 
}) => {
  const { 
    runAutoAssignment,
    runBulkAssignment,
    addAutoAssignmentRule,
    updateAutoAssignmentRule,
    removeAutoAssignmentRule,
    setError
  } = useAppStore();

  // State from store
  const rules = useAutoAssignmentRules();
  const installations = useInstallations();
  const teams = useTeams();
  const assignments = useAssignments();

  // Local state
  const [criteria, setCriteria] = useState<AutoAssignmentCriteria>({
    optimizationGoal: 'hybrid',
    considerSkills: true,
    considerLocation: true,
    considerAvailability: true,
    considerWorkload: true,
    considerPerformance: true,
    considerPreferences: false,
    maxTravelDistance: 50,
    workloadBalanceWeight: 0.3,
    skillMatchWeight: 0.25,
    performanceWeight: 0.2,
    urgencyWeight: 0.15,
    geographicWeight: 0.1
  });

  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'criteria' | 'rules' | 'bulk' | 'analytics'>('criteria');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate assignment opportunities
  const assignmentOpportunities = React.useMemo(() => {
    const unassigned = installations.filter(job => 
      !assignments.some(a => a.installationId === job.id)
    );
    const reassignable = assignments.filter(a => a.metadata.conflictResolved === false);
    const total = unassigned.length + reassignable.length;

    return {
      unassigned: unassigned.length,
      reassignable: reassignable.length,
      total
    };
  }, [installations, assignments]);

  // Run auto assignment
  const handleRunAssignment = async () => {
    setIsRunning(true);
    try {
      const result = await runAutoAssignment(criteria);
      setLastResult(result);
    } catch (error) {
      setError(`Auto assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle bulk assignment
  const handleBulkAssignment = async () => {
    const unassignedJobs = installations.filter(job => 
      !assignments.some(a => a.installationId === job.id)
    ).map(job => job.id);

    if (unassignedJobs.length === 0) {
      setError('No unassigned jobs found for bulk assignment');
      return;
    }

    setIsRunning(true);
    try {
      const request: BulkAssignmentRequest = {
        installationIds: unassignedJobs,
        criteria,
        overrideConflicts: false,
        preserveExisting: true,
        dryRun: false
      };

      const result = await runBulkAssignment(request);
      setLastResult(result);
    } catch (error) {
      setError(`Bulk assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const renderCriteriaTab = () => (
    <div className="space-y-6">
      {/* Optimization Goal */}
      <div>
        <label className="block text-sm font-medium text-glass-primary mb-3">
          Primary Optimization Goal
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { value: 'minimize_travel', label: 'Minimize Travel', icon: MapPin, desc: 'Reduce total travel distance' },
            { value: 'balance_workload', label: 'Balance Workload', icon: BarChart3, desc: 'Distribute work evenly' },
            { value: 'maximize_efficiency', label: 'Maximize Efficiency', icon: TrendingUp, desc: 'Optimize performance' },
            { value: 'prioritize_skills', label: 'Skill Matching', icon: Star, desc: 'Match required skills' },
            { value: 'customer_satisfaction', label: 'Customer Focus', icon: Users, desc: 'Prioritize service quality' },
            { value: 'hybrid', label: 'Hybrid Approach', icon: Target, desc: 'Balance all factors' }
          ].map(goal => (
            <div
              key={goal.value}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                criteria.optimizationGoal === goal.value
                  ? 'border-accent-500/50 bg-accent-500/10 shadow-lg'
                  : 'border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setCriteria(prev => ({ ...prev, optimizationGoal: goal.value as OptimizationGoal }))}
            >
              <div className="flex items-center space-x-2 mb-2">
                <goal.icon className={`w-5 h-5 ${
                  criteria.optimizationGoal === goal.value ? 'text-blue-600' : 'text-glass-muted'
                }`} />
                <span className={`font-medium ${
                  criteria.optimizationGoal === goal.value ? 'text-blue-900' : 'text-glass-primary'
                }`}>
                  {goal.label}
                </span>
              </div>
              <p className={`text-sm ${
                criteria.optimizationGoal === goal.value ? 'text-blue-700' : 'text-glass-secondary'
              }`}>
                {goal.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Consideration Factors */}
      <div>
        <label className="block text-sm font-medium text-glass-primary mb-3">
          Consider These Factors
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'considerSkills', label: 'Skills & Certifications', icon: Star },
            { key: 'considerLocation', label: 'Geographic Location', icon: MapPin },
            { key: 'considerAvailability', label: 'Team Availability', icon: Clock },
            { key: 'considerWorkload', label: 'Current Workload', icon: BarChart3 },
            { key: 'considerPerformance', label: 'Past Performance', icon: TrendingUp },
            { key: 'considerPreferences', label: 'Team Preferences', icon: Users }
          ].map(factor => (
            <label key={factor.key} className="flex items-center space-x-3 p-3 border border-white/15 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              {/* Modern Toggle Switch */}
              <div className="relative">
                <input
                  type="checkbox"
                  checked={criteria[factor.key as keyof AutoAssignmentCriteria] as boolean}
                  onChange={(e) => setCriteria(prev => ({
                    ...prev,
                    [factor.key]: e.target.checked
                  }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                  criteria[factor.key as keyof AutoAssignmentCriteria] 
                    ? 'bg-accent-500' 
                    : 'bg-white/20'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out translate-y-0.5 ${
                    criteria[factor.key as keyof AutoAssignmentCriteria] 
                      ? 'translate-x-5' 
                      : 'translate-x-0.5'
                  }`}></div>
                </div>
              </div>
              <factor.icon className="w-5 h-5 text-glass-muted" />
              <span className="text-sm font-medium text-glass-primary">{factor.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-glass-primary">
            Advanced Settings
          </label>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md text-sm"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-filter backdrop-blur-md">
            <div>
              <label className="block text-sm font-medium text-glass-primary mb-2">
                Max Travel Distance: {criteria.maxTravelDistance} miles
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={criteria.maxTravelDistance}
                onChange={(e) => setCriteria(prev => ({
                  ...prev,
                  maxTravelDistance: parseInt(e.target.value)
                }))}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'workloadBalanceWeight', label: 'Workload Balance', value: criteria.workloadBalanceWeight },
                { key: 'skillMatchWeight', label: 'Skill Matching', value: criteria.skillMatchWeight },
                { key: 'performanceWeight', label: 'Performance', value: criteria.performanceWeight },
                { key: 'urgencyWeight', label: 'Urgency', value: criteria.urgencyWeight },
                { key: 'geographicWeight', label: 'Geographic', value: criteria.geographicWeight }
              ].map(weight => (
                <div key={weight.key}>
                  <label className="block text-sm font-medium text-glass-primary mb-1">
                    {weight.label}: {Math.round(weight.value * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weight.value}
                    onChange={(e) => setCriteria(prev => ({
                      ...prev,
                      [weight.key]: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assignment Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-white/15">
        <div className="text-sm text-glass-secondary">
          {assignmentOpportunities.total} jobs available for assignment
          ({assignmentOpportunities.unassigned} unassigned, {assignmentOpportunities.reassignable} reassignable)
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunAssignment}
            disabled={isRunning || assignmentOpportunities.total === 0}
            className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Assignment'}
          </button>
          
          <button
            onClick={handleBulkAssignment}
            disabled={isRunning || assignmentOpportunities.unassigned === 0}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50"
          >
            Bulk Assign ({assignmentOpportunities.unassigned})
          </button>
        </div>
      </div>
    </div>
  );

  const renderRulesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-glass-primary">Assignment Rules</h3>
        <button className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md">
          Create New Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-glass-muted mx-auto mb-4" />
          <h4 className="text-lg font-medium text-glass-primary mb-2">No Custom Rules</h4>
          <p className="text-glass-secondary mb-4">
            Create custom assignment rules to automate complex assignment logic.
          </p>
          <button className="px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md">
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-glass-primary">{rule.name}</h4>
                    <p className="text-sm text-glass-secondary mt-1">{rule.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-glass-secondary">
                      <span>Priority: {rule.priority}</span>
                      <span>Success Rate: {Math.round(rule.successRate * 100)}%</span>
                      <span>Used: {rule.usageCount} times</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(e) => updateAutoAssignmentRule(rule.id, { isActive: e.target.checked })}
                        className="form-checkbox text-sm"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <button className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md text-sm">Edit</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBulkTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-glass-primary mb-4">Bulk Assignment Operations</h3>
        <p className="text-sm text-glass-secondary mb-6">
          Perform assignment operations on multiple jobs at once.
        </p>
      </div>

      {/* Operation Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-glass-primary">Assign All Unassigned</h4>
                <p className="text-sm text-glass-secondary">
                  Automatically assign all unassigned jobs
                </p>
              </div>
            </div>
            <div className="text-sm text-glass-secondary mb-4">
              {assignmentOpportunities.unassigned} jobs ready for assignment
            </div>
            <button
              onClick={handleBulkAssignment}
              disabled={isRunning || assignmentOpportunities.unassigned === 0}
              className="w-full px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-lg text-accent-300 hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50"
            >
              {isRunning ? 'Processing...' : 'Assign All'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-glass-primary">Rebalance Workload</h4>
                <p className="text-sm text-glass-secondary">
                  Redistribute assignments for better balance
                </p>
              </div>
            </div>
            <div className="text-sm text-glass-secondary mb-4">
              {assignments.length} current assignments
            </div>
            <button className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md">
              Rebalance
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-glass-primary mb-4">Assignment Analytics</h3>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-glass-primary">
              {Math.round((assignments.filter(a => a.metadata.autoAssigned).length / Math.max(assignments.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-glass-secondary">Auto Assignment Rate</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-glass-primary">
              {Math.round((assignments.filter(a => !a.metadata.conflictResolved).length / Math.max(assignments.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-glass-secondary">Success Rate</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-glass-primary">2.3s</div>
            <div className="text-sm text-glass-secondary">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className="card">
          <div className="card-header">
            <h4 className="font-medium text-glass-primary">Last Assignment Result</h4>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-glass-primary">Total Processed:</span>
                <div className="text-lg font-semibold text-glass-primary">
                  {Array.isArray(lastResult) ? lastResult.length : (lastResult.totalRequests || 0)}
                </div>
              </div>
              <div>
                <span className="font-medium text-glass-primary">Successful:</span>
                <div className="text-lg font-semibold text-green-600">
                  {Array.isArray(lastResult) ? lastResult.length : (lastResult.successful || 0)}
                </div>
              </div>
              <div>
                <span className="font-medium text-glass-primary">Failed:</span>
                <div className="text-lg font-semibold text-red-600">
                  {Array.isArray(lastResult) ? 0 : (lastResult.failed || 0)}
                </div>
              </div>
              <div>
                <span className="font-medium text-glass-primary">Conflicts:</span>
                <div className="text-lg font-semibold text-yellow-600">
                  {Array.isArray(lastResult) ? 0 : (lastResult.conflicts || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-glass-primary">Auto Assignment</h2>
          <p className="text-glass-secondary mt-1">
            Configure and run automated assignment algorithms
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-glass-muted hover:text-glass-secondary"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Status Banner */}
      {assignmentOpportunities.total > 0 && (
        <div className="bg-accent-500/10 border border-accent-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Assignment Opportunities Available
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                {assignmentOpportunities.unassigned} unassigned jobs and {assignmentOpportunities.reassignable} jobs 
                with conflicts are ready for (re)assignment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="glass-subtle rounded-xl p-2">
        <nav className="flex space-x-2">
          {[
            { id: 'criteria', label: 'Assignment Criteria', icon: Target },
            { id: 'rules', label: 'Custom Rules', icon: Settings },
            { id: 'bulk', label: 'Bulk Operations', icon: Zap },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm relative transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30 shadow-lg'
                  : 'text-glass-secondary hover:text-glass-primary hover:bg-white/10 border border-transparent'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'criteria' && renderCriteriaTab()}
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'bulk' && renderBulkTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );

  if (!isOpen) {
    return null;
  }

  // If onClose is provided, render as modal
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  // Otherwise render inline
  return <div className="card card-body">{content}</div>;
};

export default AutoAssignmentPanel;