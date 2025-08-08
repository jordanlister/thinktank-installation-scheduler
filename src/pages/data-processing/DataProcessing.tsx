// Think Tank Technologies Installation Scheduler - Data Processing Page

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Eye, 
  AlertTriangle, 
  Download, 
  History,
  Settings,
  CheckCircle2,
  FileText,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { DataProcessingService } from '../../services/dataProcessingService';
import { DataUpload } from '../../components/data/DataUpload';
import { DataPreview } from '../../components/data/DataPreview';
import { ErrorReport } from '../../components/data/ErrorReport';
import { DataExport } from '../../components/data/DataExport';
import { LoadingSpinner } from '../../components/common/Loading';
import { ProcessingResult } from '../../types';

type ProcessingStep = 'upload' | 'preview' | 'import' | 'complete';

export const DataProcessing: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [activeTab, setActiveTab] = useState<'preview' | 'errors' | 'export'>('preview');
  const [showHistory, setShowHistory] = useState(false);
  const [processingHistory, setProcessingHistory] = useState<ProcessingResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const {
    dataProcessingResult,
    setDataProcessingResult,
    addToProcessingHistory,
    importProcessedData
  } = useAppStore();

  // Load processing history
  const loadProcessingHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await DataProcessingService.getProcessingHistory(20);
      setProcessingHistory(history);
    } catch (error) {
      console.error('Error loading processing history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history on component mount
  useEffect(() => {
    if (showHistory) {
      loadProcessingHistory();
    }
  }, [showHistory]);

  // Handle successful file upload/processing
  const handleUploadSuccess = async (result: ProcessingResult) => {
    try {
      // Save to database
      await DataProcessingService.saveProcessingResult(result);
      
      setDataProcessingResult(result);
      addToProcessingHistory(result);
      setCurrentStep('preview');
      setActiveTab('preview');
      
      // Refresh history if it's open
      if (showHistory) {
        loadProcessingHistory();
      }
    } catch (error) {
      console.error('Error saving processing result:', error);
      // Still allow preview even if save failed
      setDataProcessingResult(result);
      addToProcessingHistory(result);
      setCurrentStep('preview');
      setActiveTab('preview');
    }
  };

  // Handle upload error
  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    setImportError(null); // Clear any previous import errors
    // Error is already handled by the DataUpload component
  };

  // Handle data import
  const handleImportData = async (data: any[]) => {
    try {
      setIsImporting(true);
      setImportError(null);
      
      // Import data using the local store method (which handles the transformation)
      importProcessedData(data);
      
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle step navigation
  const handleStepClick = (step: ProcessingStep) => {
    if (step === 'upload') {
      setDataProcessingResult(null);
      setCurrentStep('upload');
    } else if (step === 'preview' && dataProcessingResult) {
      setCurrentStep('preview');
    }
  };

  // Reset to upload state
  const handleStartOver = () => {
    setDataProcessingResult(null);
    setCurrentStep('upload');
    setActiveTab('preview');
  };

  // Load result from history
  const handleLoadFromHistory = (result: ProcessingResult) => {
    setDataProcessingResult(result);
    setCurrentStep('preview');
    setActiveTab('preview');
    setShowHistory(false);
  };

  const getStepStatus = (step: ProcessingStep) => {
    switch (step) {
      case 'upload':
        return currentStep === 'upload' ? 'current' : currentStep !== 'upload' ? 'completed' : 'pending';
      case 'preview':
        return currentStep === 'preview' ? 'current' : 
               currentStep === 'import' || currentStep === 'complete' ? 'completed' : 
               'pending';
      case 'import':
        return currentStep === 'import' ? 'current' : 
               currentStep === 'complete' ? 'completed' : 
               'pending';
      case 'complete':
        return currentStep === 'complete' ? 'current' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-accent-500/20 text-accent-300 border-accent-500/50 shadow-lg shadow-accent-500/20';
      case 'completed':
        return 'bg-success-500/20 text-success-300 border-success-500/50 shadow-lg shadow-success-500/20';
      case 'pending':
      default:
        return 'bg-white/10 text-white/60 border-white/20 hover:bg-white/15';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Data Processing</h1>
          <p className="text-xl text-white/80">Upload and process installation job data for scheduling</p>
        </div>

        {/* Controls */}
        <div className="flex justify-end space-x-3 mb-8">
          {processingHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary rounded-xl"
            >
              <History className="h-4 w-4 mr-2" />
              History ({processingHistory.length})
            </button>
          )}
          
        </div>

        {/* Progress Steps */}
        <div className="card mb-8">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Upload Step */}
                <div className="flex items-center">
                  <button
                    onClick={() => handleStepClick('upload')}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium border-2 transition-all hover:scale-105 ${
                      getStepClasses(getStepStatus('upload'))
                    }`}
                  >
                    {getStepStatus('upload') === 'completed' ? '✓' : '1'}
                  </button>
                  <span className="ml-2 text-sm font-medium text-white">Upload</span>
                </div>

                <ArrowRight className="h-4 w-4 text-accent-400" />

                {/* Preview Step */}
                <div className="flex items-center">
                  <button
                    onClick={() => handleStepClick('preview')}
                    disabled={!dataProcessingResult}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium border-2 transition-all hover:scale-105 ${
                      getStepClasses(getStepStatus('preview'))
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  >
                    {getStepStatus('preview') === 'completed' ? '✓' : '2'}
                  </button>
                  <span className="ml-2 text-sm font-medium text-white">Review</span>
                </div>

                <ArrowRight className="h-4 w-4 text-accent-400" />

                {/* Import Step */}
                <div className="flex items-center">
                  <button
                    onClick={() => handleStepClick('import')}
                    disabled={!dataProcessingResult || getStepStatus('preview') !== 'completed'}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium border-2 transition-all hover:scale-105 ${
                      getStepClasses(getStepStatus('import'))
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  >
                    {getStepStatus('import') === 'completed' ? '✓' : '3'}
                  </button>
                  <span className="ml-2 text-sm font-medium text-white">Import</span>
                </div>

                <ArrowRight className="h-4 w-4 text-accent-400" />

                {/* Complete Step */}
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium border-2 transition-all ${
                    getStepClasses(getStepStatus('complete'))
                  } ${getStepStatus('complete') === 'pending' ? 'opacity-50' : ''}`}>
                    {getStepStatus('complete') === 'completed' ? '✓' : '4'}
                  </div>
                  <span className="ml-2 text-sm font-medium text-white">Complete</span>
                </div>
              </div>
              
              {/* Refresh History Button */}
              <button
                onClick={loadProcessingHistory}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingHistory}
              >
                {isLoadingHistory ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh History'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="fixed inset-y-0 right-0 w-96 nav-glass shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-glass-primary">Processing History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-accent-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {processingHistory.map((result, index) => (
                  <div
                    key={index}
                    className="glass rounded-lg p-4 hover:bg-white/15 cursor-pointer transition-colors"
                    onClick={() => handleLoadFromHistory(result)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-glass-primary truncate">
                        {result.metadata.fileName}
                      </h4>
                      <span className="text-xs text-glass-muted">
                        {new Date(result.metadata.processedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-success-300">{result.metadata.validRows}</div>
                        <div className="text-glass-muted">Valid</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-error-300">{result.errors.length}</div>
                        <div className="text-glass-muted">Errors</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-warning-300">{result.warnings.length}</div>
                        <div className="text-glass-muted">Warnings</div>
                      </div>
                    </div>
                    </div>
                  ))}
                  
                  {processingHistory.length === 0 && (
                    <div className="text-center py-8 text-glass-muted">
                      No processing history found
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowHistory(false)}
                className="mt-4 w-full btn-secondary rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <DataUpload
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
            />
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && dataProcessingResult && (
            <>
              {/* Tab Navigation */}
              <div className="card">
                <div className="border-b border-white/10">
                  <nav className="flex space-x-8 px-6 py-3">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'preview'
                          ? 'border-accent-500 text-accent-300'
                          : 'border-transparent text-glass-muted hover:text-glass-secondary hover:border-white/20'
                      }`}
                    >
                      <div>
                        <span>Data Preview</span>
                        <span className="bg-white/20 text-glass-secondary px-2 py-1 rounded-full text-xs">
                          {dataProcessingResult.validData.length}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('errors')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'errors'
                          ? 'border-accent-500 text-accent-300'
                          : 'border-transparent text-glass-muted hover:text-glass-secondary hover:border-white/20'
                      }`}
                    >
                      <div>
                        <span>Issues</span>
                        {(dataProcessingResult.errors.length + dataProcessingResult.warnings.length) > 0 && (
                          <span className="bg-error-500/20 text-error-300 px-2 py-1 rounded-full text-xs">
                            {dataProcessingResult.errors.length + dataProcessingResult.warnings.length}
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('export')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'export'
                          ? 'border-accent-500 text-accent-300'
                          : 'border-transparent text-glass-muted hover:text-glass-secondary hover:border-white/20'
                      }`}
                    >
                      <div>
                        <span>Export</span>
                      </div>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Import Error Display */}
              {importError && (
                <div className="mb-6 alert-glass alert-error">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                    <span className="text-glass-primary font-medium">Import Error</span>
                  </div>
                  <p className="text-sm text-red-300 mt-1">{importError}</p>
                  <button
                    onClick={() => setImportError(null)}
                    className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Tab Content */}
              {activeTab === 'preview' && (
                <DataPreview
                  result={dataProcessingResult}
                  onAccept={handleImportData}
                  onReject={handleStartOver}
                  isImporting={isImporting}
                />
              )}

              {activeTab === 'errors' && (
                <ErrorReport result={dataProcessingResult} />
              )}

              {activeTab === 'export' && (
                <DataExport result={dataProcessingResult} />
              )}
            </>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="text-success-500 mb-6">
                  <CheckCircle2 className="mx-auto h-16 w-16" />
                </div>
                
                <h3 className="text-2xl font-semibold text-glass-primary mb-4">
                  Data Import Complete!
                </h3>
                
                <p className="text-glass-secondary mb-8 max-w-md mx-auto">
                  Your installation data has been successfully processed and imported into the scheduling system.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleStartOver}
                    className="btn-secondary rounded-xl"
                  >
                    Process More Data
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="btn-primary rounded-xl"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* History Overlay */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default DataProcessing;