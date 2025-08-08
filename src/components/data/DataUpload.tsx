// Think Tank Technologies Installation Scheduler - Data Upload Component

import React from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { LoadingSpinner } from '../common/Loading';
import { ProcessingResult, DataProcessingConfig } from '../../types';

interface DataUploadProps {
  onSuccess?: (result: ProcessingResult) => void;
  onError?: (error: string) => void;
  config?: Partial<DataProcessingConfig>;
  className?: string;
}

export const DataUpload: React.FC<DataUploadProps> = ({
  onSuccess,
  onError,
  config,
  className = ''
}) => {
  const {
    uploadState,
    isDragActive,
    resetUpload,
    getRootProps,
    getInputProps
  } = useFileUpload({
    config,
    onSuccess,
    onError
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 30) return 'bg-yellow-500';
    if (progress < 70) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        <h3 className="text-lg font-semibold text-white mb-4">
          Upload Route Data
        </h3>
        
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-accent-500 bg-white/20' 
              : uploadState.error 
                ? 'border-red-500 bg-red-500/10'
                : uploadState.result
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/30 bg-white/5 hover:border-accent-400 hover:bg-white/10'
            }
          `}
        >
          <input {...getInputProps()} />
          
          {uploadState.isUploading ? (
            <div className="space-y-4">
              <LoadingSpinner size="lg" />
              <div>
                <p className="text-white font-medium mb-2">
                  Processing {uploadState.file?.name}...
                </p>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(uploadState.progress)}`}
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
                <p className="text-sm text-white/80 mt-1">
                  {uploadState.progress}% complete
                </p>
              </div>
            </div>
          ) : uploadState.error ? (
            <div className="space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">
                  Upload Failed
                </h4>
                <p className="text-red-300 mb-4">{uploadState.error}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetUpload();
                  }}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
                >
                  Clear and Try Again
                </button>
              </div>
            </div>
          ) : uploadState.result ? (
            <div className="space-y-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">
                  Upload Successful
                </h4>
                <div className="bg-white/10 rounded-lg p-4 border border-green-500/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/70">File:</span>
                      <span className="ml-2 font-medium text-white">
                        {uploadState.result.metadata.fileName}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/70">Size:</span>
                      <span className="ml-2 font-medium text-white">
                        {formatFileSize(uploadState.result.metadata.fileSize)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/70">Valid Records:</span>
                      <span className="ml-2 font-medium text-green-300">
                        {uploadState.result.metadata.validRows}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/70">Total Records:</span>
                      <span className="ml-2 font-medium text-white">
                        {uploadState.result.metadata.totalRows}
                      </span>
                    </div>
                  </div>
                  
                  {uploadState.result.errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <span className="text-red-300 text-sm">
                        {uploadState.result.errors.length} error(s) found
                      </span>
                    </div>
                  )}
                  
                  {uploadState.result.warnings.length > 0 && (
                    <div className="mt-2">
                      <span className="text-yellow-300 text-sm">
                        {uploadState.result.warnings.length} warning(s) found
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:bg-white/15 transition-all duration-200"
                  >
                    Upload Another File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                isDragActive ? 'bg-accent-500/20' : 'bg-white/10'
              }`}>
                {isDragActive ? (
                  <Upload className="h-8 w-8 text-accent-400" />
                ) : (
                  <FileSpreadsheet className="h-8 w-8 text-white/70" />
                )}
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-2">
                  {isDragActive ? 'Drop your file here' : 'Upload Route Data'}
                </h4>
                <p className="text-white/80 mb-4">
                  {isDragActive 
                    ? 'Release to upload your file'
                    : 'Drag and drop your Excel or CSV file here, or click to browse'
                  }
                </p>
                
                <div className="text-sm text-white/60 space-y-1">
                  <p>Supported formats: .xlsx, .xls, .csv</p>
                  <p>Maximum file size: 10MB</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* File Requirements */}
        <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20 backdrop-filter backdrop-blur-md">
          <h5 className="font-medium text-white mb-2">
            File Requirements
          </h5>
          <div className="text-sm text-white/80 space-y-1">
            <p>• First row should contain column headers</p>
            <p>• Required fields: Customer Name, Install Date, Address (Street, City, State, ZIP)</p>
            <p>• Optional fields: Phone, Email, Job ID, Store Number, Installation Type, Priority</p>
            <p>• Dates should be in MM/DD/YYYY or similar standard format</p>
            <p>• The system will automatically detect and map column names</p>
          </div>
        </div>
        
        {/* Column Mapping Preview */}
        {uploadState.result && Object.keys(uploadState.result.schemaMap).length > 0 && (
          <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20 backdrop-filter backdrop-blur-md">
            <h5 className="font-medium text-white mb-3">
              Detected Column Mapping
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(uploadState.result.schemaMap).map(([field, mapping]) => (
                <div key={field} className="flex justify-between items-center">
                  <span className="text-white/70 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">
                      {mapping.detectedColumn}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      mapping.confidence >= 0.9 
                        ? 'bg-green-500/20 text-green-300'
                        : mapping.confidence >= 0.7
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                    }`}>
                      {Math.round(mapping.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUpload;