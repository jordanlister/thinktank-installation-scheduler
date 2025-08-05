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
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
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

  const {
    dataProcessingResult,
    dataProcessingHistory,
    setDataProcessingResult,
    addToProcessingHistory,
    importProcessedData,
    clearProcessingHistory
  } = useAppStore();

  // Handle successful file upload/processing
  const handleUploadSuccess = (result: ProcessingResult) => {
    setDataProcessingResult(result);
    addToProcessingHistory(result);
    setCurrentStep('preview');
    setActiveTab('preview');
  };

  // Handle upload error
  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // Error is already handled by the DataUpload component
  };

  // Handle data import
  const handleImportData = (data: any[]) => {
    importProcessedData(data);
    setCurrentStep('complete');
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
        return 'bg-accent-600 text-white border-accent-600';
      case 'completed':
        return 'bg-success-600 text-white border-success-600';
      case 'pending':
      default:
        return 'bg-primary-200 text-primary-600 border-primary-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">Data Processing</h1>
              <p className="mt-2 text-primary-600">
                Upload and process installation job data for scheduling
              </p>
            </div>
            
            <div className="flex space-x-3">
              {dataProcessingHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn-secondary inline-flex items-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span>History ({dataProcessingHistory.length})</span>
                </button>
              )}
              
              <button
                onClick={() => clearProcessingHistory()}
                className="text-primary-500 hover:text-primary-700 text-sm"
                disabled={dataProcessingHistory.length === 0}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Upload Step */}
              <div className="flex items-center">
                <button
                  onClick={() => handleStepClick('upload')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                    getStepClasses(getStepStatus('upload'))
                  }`}
                >
                  {getStepStatus('upload') === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </button>
                <span className="ml-2 text-sm font-medium text-primary-900">Upload</span>
              </div>

              <ArrowRight className="h-4 w-4 text-primary-400" />

              {/* Preview Step */}
              <div className="flex items-center">
                <button
                  onClick={() => handleStepClick('preview')}
                  disabled={!dataProcessingResult}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                    getStepClasses(getStepStatus('preview'))
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getStepStatus('preview') === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <span className="ml-2 text-sm font-medium text-primary-900">Review</span>
              </div>

              <ArrowRight className="h-4 w-4 text-primary-400" />

              {/* Import Step */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                  getStepClasses(getStepStatus('import'))
                }`}>
                  {getStepStatus('import') === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </div>
                <span className="ml-2 text-sm font-medium text-primary-900">Import</span>
              </div>

              <ArrowRight className="h-4 w-4 text-primary-400" />

              {/* Complete Step */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                  getStepClasses(getStepStatus('complete'))
                }`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm font-medium text-primary-900">Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Processing History</h3>
              
              <div className="space-y-3">
                {dataProcessingHistory.map((result, index) => (
                  <div
                    key={index}
                    className="border border-primary-200 rounded-lg p-4 hover:bg-primary-50 cursor-pointer"
                    onClick={() => handleLoadFromHistory(result)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-primary-900 truncate">
                        {result.metadata.fileName}
                      </h4>
                      <span className="text-xs text-primary-500">
                        {new Date(result.metadata.processedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-success-700">{result.metadata.validRows}</div>
                        <div className="text-primary-600">Valid</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-error-700">{result.errors.length}</div>
                        <div className="text-primary-600">Errors</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-yellow-700">{result.warnings.length}</div>
                        <div className="text-primary-600">Warnings</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setShowHistory(false)}
                className="mt-4 w-full btn-secondary"
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
                <div className="border-b border-primary-200">
                  <nav className="flex space-x-8 px-6 py-3">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'preview'
                          ? 'border-accent-500 text-accent-600'
                          : 'border-transparent text-primary-500 hover:text-primary-700 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Data Preview</span>
                        <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs">
                          {dataProcessingResult.validData.length}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('errors')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'errors'
                          ? 'border-accent-500 text-accent-600'
                          : 'border-transparent text-primary-500 hover:text-primary-700 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Issues</span>
                        {(dataProcessingResult.errors.length + dataProcessingResult.warnings.length) > 0 && (
                          <span className="bg-error-100 text-error-600 px-2 py-1 rounded-full text-xs">
                            {dataProcessingResult.errors.length + dataProcessingResult.warnings.length}
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('export')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'export'
                          ? 'border-accent-500 text-accent-600'
                          : 'border-transparent text-primary-500 hover:text-primary-700 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                      </div>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'preview' && (
                <DataPreview
                  result={dataProcessingResult}
                  onAccept={handleImportData}
                  onReject={handleStartOver}
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
                
                <h3 className="text-2xl font-semibold text-primary-900 mb-4">
                  Data Import Complete!
                </h3>
                
                <p className="text-primary-600 mb-8 max-w-md mx-auto">
                  Your installation data has been successfully processed and imported into the scheduling system.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleStartOver}
                    className="btn-secondary"
                  >
                    Process More Data
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="btn-primary"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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