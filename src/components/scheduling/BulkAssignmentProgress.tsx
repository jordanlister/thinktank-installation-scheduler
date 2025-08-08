// Think Tank Technologies - Bulk Assignment Progress Component

import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Calendar,
  Loader2,
  RotateCcw,
  Download,
  Share,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { 
  BulkExecutionProgress,
  BulkAssignmentResult
} from '../../types';

interface BulkAssignmentProgressProps {
  progress?: BulkExecutionProgress;
  result?: BulkAssignmentResult;
  onUndo: () => void;
  canUndo: boolean;
}

/**
 * Bulk Assignment Progress Component
 * 
 * Shows real-time progress during bulk assignment execution and displays
 * final results with options for undo, export, and analysis
 */
const BulkAssignmentProgress: React.FC<BulkAssignmentProgressProps> = ({
  progress,
  result,
  onUndo,
  canUndo
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animate progress bar
  useEffect(() => {
    if (progress) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress.percentage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress?.percentage]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate execution time
  const getExecutionTime = () => {
    if (!progress?.startTime) return null;
    
    const start = new Date(progress.startTime);
    const end = progress.endTime ? new Date(progress.endTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds % 60}s`;
    }
    return `${diffSeconds}s`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  // Handle export results
  const handleExport = () => {
    if (!result) return;
    
    const exportData = {
      summary: result.summary,
      successful_assignments: result.successful.length,
      failed_assignments: result.failed.length,
      conflicts: result.conflicts.length,
      execution_time: getExecutionTime(),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-assignment-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // If no progress data, show waiting state
  if (!progress && !result) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Execute</h3>
          <p className="text-gray-500">
            Click "Execute Assignment" to begin the bulk assignment process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {progress ? getStatusIcon(progress.status) : <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {progress?.status === 'running' ? 'Executing Assignments' : 
                 progress?.status === 'completed' ? 'Assignment Complete' :
                 progress?.status === 'failed' ? 'Assignment Failed' :
                 'Bulk Assignment Results'}
              </h3>
              <p className="text-sm text-gray-600">
                {progress?.status === 'running' ? 'Processing assignments in progress...' : 
                 progress?.status === 'completed' ? 'All assignments have been processed' :
                 'Bulk assignment execution finished'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {progress && (
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(progress.status)}`}>
              {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {progress.completed} of {progress.total} processed
              </span>
              <span className="font-medium text-gray-900">
                {Math.round(animatedProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out ${
                  progress.status === 'completed' ? 'bg-green-500' :
                  progress.status === 'failed' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
            
            {/* Current Processing Item */}
            {progress.current && progress.status === 'running' && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing: {progress.current}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {result && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Execution Summary</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{result.summary.total}</div>
              <div className="text-sm text-blue-800">Total Processed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{result.summary.assigned}</div>
              <div className="text-sm text-green-800">Successfully Assigned</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{result.summary.conflicted}</div>
              <div className="text-sm text-yellow-800">Conflicts Resolved</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
          </div>

          {/* Execution Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Execution Time</div>
                <div className="font-medium text-gray-900">{getExecutionTime() || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="font-medium text-gray-900">
                  {result.summary.total > 0 ? Math.round((result.summary.assigned / result.summary.total) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">Processing Rate</div>
                <div className="font-medium text-gray-900">
                  {progress && getExecutionTime() ? 
                    Math.round(result.summary.total / (parseInt(getExecutionTime()?.replace(/[^\d]/g, '') || '1') || 1)) : 0} jobs/min
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Results */}
      <div className="flex-1 overflow-y-auto">
        {result && (
          <div className="p-6 space-y-6">
            {/* Toggle Details */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Detailed Results</h4>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showDetails && (
              <div className="space-y-4">
                {/* Successful Assignments */}
                {result.successful.length > 0 && (
                  <div className="bg-white border border-green-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-green-200 bg-green-50">
                      <h5 className="font-medium text-green-900 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Successfully Assigned ({result.successful.length})
                      </h5>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {result.successful.slice(0, 5).map((assignment, index) => (
                        <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Assignment {assignment.id.slice(-8)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Installation: {assignment.installationId.slice(-8)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                Lead: {assignment.leadId.slice(-8)}
                              </div>
                              {assignment.assistantId && (
                                <div className="text-sm text-gray-500">
                                  Assistant: {assignment.assistantId.slice(-8)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.successful.length > 5 && (
                        <div className="px-4 py-3 text-center text-sm text-gray-500 border-t border-gray-100">
                          And {result.successful.length - 5} more successful assignments...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Failed Assignments */}
                {result.failed.length > 0 && (
                  <div className="bg-white border border-red-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-red-200 bg-red-50">
                      <h5 className="font-medium text-red-900 flex items-center">
                        <XCircle className="w-5 h-5 mr-2" />
                        Failed Assignments ({result.failed.length})
                      </h5>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {result.failed.map((failure, index) => (
                        <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Installation: {failure.installationId.slice(-8)}
                                </div>
                                <div className="text-sm text-red-600 mt-1">
                                  {failure.error}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              failure.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {failure.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflicts */}
                {result.conflicts.length > 0 && (
                  <div className="bg-white border border-yellow-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-yellow-200 bg-yellow-50">
                      <h5 className="font-medium text-yellow-900 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Resolved Conflicts ({result.conflicts.length})
                      </h5>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {result.conflicts.map((conflict, index) => (
                        <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {conflict.description}
                          </div>
                          <div className="text-sm text-gray-600">
                            Affected assignments: {conflict.affectedAssignments.length} • 
                            Severity: {conflict.severity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900 mb-2">Key Insights</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {result.summary.assigned / result.summary.total >= 0.9 && (
                      <li>• Excellent success rate - most assignments completed successfully</li>
                    )}
                    {result.summary.failed > 0 && (
                      <li>• {result.summary.failed} assignments failed and may need manual attention</li>
                    )}
                    {result.conflicts.length > 0 && (
                      <li>• {result.conflicts.length} conflicts were automatically resolved</li>
                    )}
                    {result.summary.assigned === 0 && (
                      <li>• No assignments were made - check selection criteria and team availability</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Progress for Running State */}
        {progress && progress.status === 'running' && (
          <div className="p-6">
            <div className="text-center">
              <div className="animate-pulse">
                <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Processing Assignments
              </h4>
              <p className="text-gray-600 mb-4">
                Please wait while we process your bulk assignment request...
              </p>
              <div className="text-sm text-gray-500">
                {progress.current && (
                  <div>Currently processing: {progress.current}</div>
                )}
                <div>Elapsed time: {getExecutionTime()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {result ? (
              `Completed ${new Date(progress?.endTime || '').toLocaleString()}`
            ) : progress?.startTime ? (
              `Started ${new Date(progress.startTime).toLocaleString()}`
            ) : (
              'Ready to execute bulk assignment'
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Export Results */}
            {result && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Results</span>
              </button>
            )}

            {/* Undo Button */}
            {canUndo && result && (
              <button
                onClick={onUndo}
                className="btn-warning flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Undo Changes</span>
              </button>
            )}

            {/* Status Indicator */}
            {progress && progress.status === 'running' && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {progress && progress.status === 'completed' && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Completed Successfully</span>
              </div>
            )}

            {progress && progress.status === 'failed' && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <XCircle className="w-4 h-4" />
                <span>Execution Failed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignmentProgress;