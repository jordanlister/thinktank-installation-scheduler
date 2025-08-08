// Think Tank Technologies - Bulk Assignment Wizard Component

import React from 'react';
import type { BulkAssignmentStep } from '../../types';

interface BulkAssignmentWizardProps {
  currentStep: BulkAssignmentStep;
  completedSteps: BulkAssignmentStep[];
  onStepChange: (step: BulkAssignmentStep) => void;
  canProgress: boolean;
  getStepIcon: (step: BulkAssignmentStep) => React.ReactNode;
  getStepTitle: (step: BulkAssignmentStep) => string;
}

/**
 * Bulk Assignment Wizard Navigation Component
 * 
 * Provides step-by-step navigation for the bulk assignment process
 */
const BulkAssignmentWizard: React.FC<BulkAssignmentWizardProps> = ({
  currentStep,
  completedSteps,
  onStepChange,
  canProgress,
  getStepIcon,
  getStepTitle
}) => {
  const steps: BulkAssignmentStep[] = ['selection', 'configuration', 'preview', 'execute'];

  const getStepStatus = (step: BulkAssignmentStep) => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const isStepClickable = (step: BulkAssignmentStep, index: number) => {
    const currentIndex = steps.indexOf(currentStep);
    // Allow clicking on completed steps or the next step if can progress
    return completedSteps.includes(step) || 
           (index <= currentIndex) || 
           (index === currentIndex + 1 && canProgress);
  };

  const getStepDescription = (step: BulkAssignmentStep) => {
    switch (step) {
      case 'selection':
        return 'Choose installations for bulk assignment';
      case 'configuration':
        return 'Select team members and assignment settings';
      case 'preview':
        return 'Review changes and detect conflicts';
      case 'execute':
        return 'Execute assignments and monitor progress';
      default:
        return '';
    }
  };

  return (
    <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const clickable = isStepClickable(step, index);
            
            return (
              <li key={step} className="flex-1 relative">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div className="relative flex items-center justify-center">
                    <button
                      onClick={() => clickable ? onStepChange(step) : undefined}
                      disabled={!clickable}
                      className={`
                        w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${status === 'completed' 
                          ? 'bg-green-100 border-green-500 text-green-600' 
                          : status === 'current'
                          ? 'bg-blue-100 border-blue-500 text-blue-600'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                        }
                        ${clickable 
                          ? 'hover:bg-blue-50 hover:border-blue-400 cursor-pointer' 
                          : 'cursor-not-allowed'
                        }
                      `}
                    >
                      {getStepIcon(step)}
                    </button>

                    {/* Step Number (small) */}
                    <span
                      className={`
                        absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-medium flex items-center justify-center
                        ${status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                        }
                      `}
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* Step Content */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div
                      className={`
                        text-sm font-medium
                        ${status === 'completed'
                          ? 'text-green-900'
                          : status === 'current'
                          ? 'text-blue-900'
                          : 'text-gray-500'
                        }
                      `}
                    >
                      {getStepTitle(step)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getStepDescription(step)}
                    </div>
                  </div>

                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 ml-4">
                      <div
                        className={`
                          h-0.5 transition-colors duration-200
                          ${status === 'completed'
                            ? 'bg-green-300'
                            : 'bg-gray-300'
                          }
                        `}
                      />
                    </div>
                  )}
                </div>

                {/* Progress Indicator for Current Step */}
                {status === 'current' && (
                  <div className="absolute top-12 left-5 transform -translate-x-1/2">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <div className="text-xs text-blue-600 font-medium mt-1 whitespace-nowrap">
                        Active
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
            style={{
              width: `${((completedSteps.length + (currentStep ? 1 : 0)) / steps.length) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Step {steps.indexOf(currentStep) + 1} of {steps.length}</span>
          <span>{Math.round(((completedSteps.length + 1) / steps.length) * 100)}% Complete</span>
        </div>
      </div>

      {/* Current Step Status */}
      <div className="mt-3 flex items-center justify-center">
        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getStepIcon(currentStep)}
              <span className="text-sm font-medium text-gray-900">
                {getStepTitle(currentStep)}
              </span>
            </div>
            {!canProgress && currentStep !== 'execute' && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Complete this step to continue
              </div>
            )}
            {canProgress && currentStep !== 'execute' && (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Ready to proceed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentWizard;