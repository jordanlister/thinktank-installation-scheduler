// Think Tank Technologies Installation Scheduler - Enhanced Bulk Assignment Modal

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Settings,
  Eye,
  Play,
  Clock,
  Target,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { 
  OptimizedAssignment, 
  TeamMember, 
  Installation,
  BulkAssignmentData,
  BulkAssignmentResult,
  BulkAssignmentWizardState,
  BulkAssignmentStep,
  BulkExecutionProgress,
  TeamMemberAvailability,
  InstallationSelectionCriteria
} from '../../types';
import BulkAssignmentWizard from './BulkAssignmentWizard';
import InstallationSelector from './InstallationSelector';
import TeamMemberSelector from './TeamMemberSelector';
import ConflictPreview from './ConflictPreview';
import BulkAssignmentProgress from './BulkAssignmentProgress';

interface BulkAssignmentModalProps {
  assignments?: OptimizedAssignment[];
  teams: TeamMember[];
  onClose: () => void;
  onBulkAction?: (updatedAssignments: OptimizedAssignment[]) => void;
  initialInstallationIds?: string[];
}

/**
 * Enhanced Bulk Assignment Modal Component
 * 
 * Provides a comprehensive multi-step wizard interface for bulk assignment operations
 * including installation selection, team assignment, conflict preview, and execution
 */
const BulkAssignmentModal: React.FC<BulkAssignmentModalProps> = ({
  assignments = [],
  teams,
  onClose,
  onBulkAction,
  initialInstallationIds = []
}) => {
  const {
    installations,
    runBulkAssignment,
    assignmentConflicts,
    detectConflicts,
    workloadDistribution,
    calculateWorkloadDistribution
  } = useAppStore();

  // Wizard state management
  const [wizardState, setWizardState] = useState<BulkAssignmentWizardState>({
    currentStep: 'selection',
    completedSteps: [],
    canProgress: false,
    data: {
      selectedInstallations: initialInstallationIds,
      assignmentType: 'lead',
      targetTeamMembers: [],
      overrideConflicts: false,
      preserveExisting: true
    }
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<BulkAssignmentResult | null>(null);
  const [undoStack, setUndoStack] = useState<OptimizedAssignment[]>([]);

  // Calculate team member availability
  const teamAvailability = useMemo<TeamMemberAvailability[]>(() => {
    return teams.map(team => {
      const teamAssignments = assignments.filter(a => a.leadId === team.id || a.assistantId === team.id);
      const currentWorkload = teamAssignments.length;
      const capacity = team.capacity || 5;
      const utilizationPercentage = (currentWorkload / capacity) * 100;
      
      return {
        teamMemberId: team.id,
        availableSlots: Math.max(0, capacity - currentWorkload),
        currentWorkload,
        capacity,
        utilizationPercentage,
        conflicts: assignmentConflicts
          .filter(c => c.affectedTeamMembers.includes(team.id))
          .map(c => c.id),
        isOverloaded: utilizationPercentage > 100
      };
    });
  }, [teams, assignments, assignmentConflicts]);

  // Validate current step and update progress ability
  useEffect(() => {
    let canProgress = false;
    const { currentStep, data } = wizardState;

    switch (currentStep) {
      case 'selection':
        canProgress = data.selectedInstallations.length > 0;
        break;
      case 'configuration':
        canProgress = data.targetTeamMembers.length > 0;
        break;
      case 'preview':
        canProgress = true; // Always can proceed from preview
        break;
      case 'execute':
        canProgress = false; // Cannot progress from execution step
        break;
    }

    setWizardState(prev => ({ ...prev, canProgress }));
  }, [wizardState.currentStep, wizardState.data]);

  // Handle step navigation
  const handleStepChange = (step: BulkAssignmentStep) => {
    const stepOrder: BulkAssignmentStep[] = ['selection', 'configuration', 'preview', 'execute'];
    const currentIndex = stepOrder.indexOf(wizardState.currentStep);
    const targetIndex = stepOrder.indexOf(step);

    // Only allow forward progression if current step is completed
    if (targetIndex > currentIndex && !wizardState.canProgress) {
      return;
    }

    // Mark previous steps as completed when moving forward
    const completedSteps = [...wizardState.completedSteps];
    if (targetIndex > currentIndex) {
      for (let i = currentIndex; i < targetIndex; i++) {
        if (!completedSteps.includes(stepOrder[i])) {
          completedSteps.push(stepOrder[i]);
        }
      }
    }

    setWizardState(prev => ({
      ...prev,
      currentStep: step,
      completedSteps
    }));
  };

  // Handle data updates from child components
  const handleDataUpdate = (updates: Partial<BulkAssignmentData>) => {
    setWizardState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates }
    }));
  };

  // Generate preview data
  const generatePreview = async (): Promise<BulkAssignmentResult> => {
    const { selectedInstallations, targetTeamMembers, assignmentType } = wizardState.data;
    
    // Simulate bulk assignment preview
    const selectedInstallationData = installations.filter(inst => 
      selectedInstallations.includes(inst.id)
    );

    const mockResult: BulkAssignmentResult = {
      successful: [],
      failed: [],
      conflicts: [],
      summary: {
        total: selectedInstallations.length,
        assigned: Math.floor(selectedInstallations.length * 0.8),
        failed: Math.floor(selectedInstallations.length * 0.1),
        conflicted: Math.floor(selectedInstallations.length * 0.1)
      }
    };

    // Add mock successful assignments
    selectedInstallationData.slice(0, mockResult.summary.assigned).forEach(inst => {
      const randomTeam = targetTeamMembers[Math.floor(Math.random() * targetTeamMembers.length)];
      mockResult.successful.push({
        id: `preview_${inst.id}`,
        installationId: inst.id,
        leadId: assignmentType === 'lead' || assignmentType === 'both' ? randomTeam : '',
        assistantId: assignmentType === 'assistant' || assignmentType === 'both' ? randomTeam : undefined,
        assignedAt: new Date().toISOString(),
        assignedBy: 'bulk_assignment',
        status: 'assigned',
        priority: inst.priority,
        estimatedDuration: inst.duration,
        metadata: {
          autoAssigned: true,
          conflictResolved: false,
          workloadScore: Math.random(),
          efficiencyScore: Math.random(),
          customerPreference: false
        },
        history: [],
        estimatedTravelTime: Math.floor(Math.random() * 60) + 15,
        estimatedTravelDistance: Math.floor(Math.random() * 50) + 5,
        bufferTime: 30,
        workloadScore: Math.random(),
        efficiencyScore: Math.random()
      });
    });

    return mockResult;
  };

  // Handle execution
  const handleExecution = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    
    try {
      // Store current assignments for undo functionality
      setUndoStack([...assignments]);

      // Setup execution progress
      const progress: BulkExecutionProgress = {
        total: wizardState.data.selectedInstallations.length,
        completed: 0,
        failed: 0,
        percentage: 0,
        status: 'running',
        startTime: new Date().toISOString()
      };

      setWizardState(prev => ({ ...prev, executionProgress: progress }));

      // Execute bulk assignment
      const bulkRequest = {
        installationIds: wizardState.data.selectedInstallations,
        criteria: {
          optimizationGoal: 'balance_workload' as const,
          considerSkills: true,
          considerLocation: true,
          considerAvailability: true,
          considerWorkload: true,
          considerPerformance: true,
          considerPreferences: false,
          maxTravelDistance: 100,
          workloadBalanceWeight: 0.8,
          skillMatchWeight: 0.7,
          performanceWeight: 0.6,
          urgencyWeight: 0.9,
          geographicWeight: 0.8
        },
        overrideConflicts: wizardState.data.overrideConflicts,
        preserveExisting: wizardState.data.preserveExisting,
        dryRun: false
      };

      // Simulate progress updates
      for (let i = 0; i <= wizardState.data.selectedInstallations.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const updatedProgress: BulkExecutionProgress = {
          ...progress,
          completed: i,
          percentage: (i / progress.total) * 100,
          current: i < progress.total ? wizardState.data.selectedInstallations[i] : undefined
        };

        setWizardState(prev => ({ ...prev, executionProgress: updatedProgress }));
      }

      const result = await runBulkAssignment(bulkRequest);
      
      // Convert BulkAssignmentResult to our expected format
      const formattedResult: BulkAssignmentResult = {
        successful: result.results.map(r => {
          const installation = installations.find(i => i.id === r.installationId);
          return {
            id: r.assignmentId,
            installationId: r.installationId,
            leadId: r.teamMemberId,
            assignedAt: new Date().toISOString(),
            assignedBy: 'bulk_assignment',
            status: 'assigned' as const,
            priority: installation?.priority || 'medium',
            estimatedDuration: installation?.duration || 120,
            metadata: {
              autoAssigned: true,
              conflictResolved: false,
              workloadScore: r.score / 100,
              efficiencyScore: r.confidence,
              customerPreference: false
            },
            history: [],
            estimatedTravelTime: 30,
            estimatedTravelDistance: 15,
            bufferTime: 30,
            workloadScore: r.score / 100,
            efficiencyScore: r.confidence
          };
        }),
        failed: result.errors.map(e => ({
          installationId: e.installationId,
          error: e.error,
          severity: 'error' as const
        })),
        conflicts: [],
        summary: {
          total: result.totalRequests,
          assigned: result.successful,
          failed: result.failed,
          conflicted: result.conflicts
        }
      };

      setExecutionResult(formattedResult);
      
      // Final progress update
      setWizardState(prev => ({
        ...prev,
        executionProgress: {
          ...progress,
          completed: progress.total,
          percentage: 100,
          status: 'completed',
          endTime: new Date().toISOString()
        }
      }));

      // Call parent callback if provided
      if (onBulkAction) {
        onBulkAction(formattedResult.successful);
      }

    } catch (error) {
      console.error('Bulk assignment execution failed:', error);
      setWizardState(prev => ({
        ...prev,
        executionProgress: {
          ...prev.executionProgress!,
          status: 'failed',
          endTime: new Date().toISOString()
        }
      }));
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle undo operation
  const handleUndo = () => {
    if (undoStack.length > 0 && onBulkAction) {
      onBulkAction(undoStack);
      setUndoStack([]);
      setExecutionResult(null);
    }
  };

  // Get current step component
  const getCurrentStepComponent = () => {
    const { currentStep, data } = wizardState;

    switch (currentStep) {
      case 'selection':
        return (
          <InstallationSelector
            installations={installations}
            selectedIds={data.selectedInstallations}
            onSelectionChange={(ids) => handleDataUpdate({ selectedInstallations: ids })}
            criteria={{}}
            onCriteriaChange={() => {}}
          />
        );

      case 'configuration':
        return (
          <TeamMemberSelector
            teams={teams}
            teamAvailability={teamAvailability}
            selectedTeamIds={data.targetTeamMembers}
            assignmentType={data.assignmentType}
            onTeamSelectionChange={(ids) => handleDataUpdate({ targetTeamMembers: ids })}
            onAssignmentTypeChange={(type) => handleDataUpdate({ assignmentType: type })}
            overrideConflicts={data.overrideConflicts}
            preserveExisting={data.preserveExisting}
            onOverrideConflictsChange={(override) => handleDataUpdate({ overrideConflicts: override })}
            onPreserveExistingChange={(preserve) => handleDataUpdate({ preserveExisting: preserve })}
          />
        );

      case 'preview':
        return (
          <ConflictPreview
            bulkData={data}
            installations={installations}
            teams={teams}
            onPreviewGenerated={(previewData) => {
              setWizardState(prev => ({ ...prev, previewData }));
            }}
            previewData={wizardState.previewData}
            generatePreview={generatePreview}
          />
        );

      case 'execute':
        return (
          <BulkAssignmentProgress
            progress={wizardState.executionProgress}
            result={executionResult}
            onUndo={handleUndo}
            canUndo={undoStack.length > 0}
          />
        );

      default:
        return null;
    }
  };

  // Get step icon
  const getStepIcon = (step: BulkAssignmentStep) => {
    const isCompleted = wizardState.completedSteps.includes(step);
    const isCurrent = wizardState.currentStep === step;

    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (isCurrent) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    }

    switch (step) {
      case 'selection':
        return <Target className="w-5 h-5 text-gray-400" />;
      case 'configuration':
        return <Settings className="w-5 h-5 text-gray-400" />;
      case 'preview':
        return <Eye className="w-5 h-5 text-gray-400" />;
      case 'execute':
        return <Play className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get step title
  const getStepTitle = (step: BulkAssignmentStep) => {
    switch (step) {
      case 'selection':
        return 'Select Installations';
      case 'configuration':
        return 'Configure Assignments';
      case 'preview':
        return 'Preview Changes';
      case 'execute':
        return 'Execute & Monitor';
      default:
        return 'Unknown Step';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Bulk Assignment Manager
                </h2>
                <p className="text-sm text-gray-600">
                  {getStepTitle(wizardState.currentStep)}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isExecuting}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Wizard Navigation */}
        <BulkAssignmentWizard
          currentStep={wizardState.currentStep}
          completedSteps={wizardState.completedSteps}
          onStepChange={handleStepChange}
          canProgress={wizardState.canProgress}
          getStepIcon={getStepIcon}
          getStepTitle={getStepTitle}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {getCurrentStepComponent()}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            {wizardState.currentStep === 'selection' && (
              <div className="text-sm text-gray-600">
                {wizardState.data.selectedInstallations.length} installations selected
              </div>
            )}
            {wizardState.currentStep === 'configuration' && (
              <div className="text-sm text-gray-600">
                {wizardState.data.targetTeamMembers.length} team members selected
              </div>
            )}
            {wizardState.currentStep === 'execute' && wizardState.executionProgress && (
              <div className="text-sm text-gray-600">
                {wizardState.executionProgress.completed}/{wizardState.executionProgress.total} processed
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Back Button */}
            {wizardState.currentStep !== 'selection' && (
              <button
                onClick={() => {
                  const steps: BulkAssignmentStep[] = ['selection', 'configuration', 'preview', 'execute'];
                  const currentIndex = steps.indexOf(wizardState.currentStep);
                  if (currentIndex > 0) {
                    handleStepChange(steps[currentIndex - 1]);
                  }
                }}
                disabled={isExecuting}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {/* Cancel Button */}
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="btn-ghost"
            >
              {isExecuting ? 'Processing...' : 'Cancel'}
            </button>

            {/* Next/Execute Button */}
            {wizardState.currentStep !== 'execute' ? (
              <button
                onClick={() => {
                  if (wizardState.currentStep === 'preview') {
                    handleStepChange('execute');
                    handleExecution();
                  } else {
                    const steps: BulkAssignmentStep[] = ['selection', 'configuration', 'preview', 'execute'];
                    const currentIndex = steps.indexOf(wizardState.currentStep);
                    if (currentIndex < steps.length - 1) {
                      handleStepChange(steps[currentIndex + 1]);
                    }
                  }
                }}
                disabled={!wizardState.canProgress || isExecuting}
                className="btn-primary flex items-center space-x-2"
              >
                {isExecuting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {wizardState.currentStep === 'preview' ? 'Execute Assignment' : 'Next'}
                </span>
                {wizardState.currentStep !== 'preview' && <ArrowRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="btn-success"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentModal;