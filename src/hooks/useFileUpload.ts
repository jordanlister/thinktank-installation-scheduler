// Think Tank Technologies Installation Scheduler - File Upload Hook

import { useState, useCallback, useRef } from 'react';
import { 
  FileUploadState, 
  ProcessingResult, 
  DataProcessingConfig
} from '../types';
import { processJobDataFile, DEFAULT_CONFIG } from '../utils/dataProcessing';

interface UseFileUploadOptions {
  config?: Partial<DataProcessingConfig>;
  onSuccess?: (result: ProcessingResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

interface UseFileUploadReturn {
  uploadState: FileUploadState;
  isDragActive: boolean;
  dragRef: React.RefObject<HTMLDivElement>;
  uploadFile: (file: File) => Promise<void>;
  resetUpload: () => void;
  getRootProps: () => {
    ref: React.RefObject<HTMLDivElement>;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onClick: () => void;
  };
  getInputProps: () => {
    type: 'file';
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    style: { display: 'none' };
  };
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    config = {},
    onSuccess,
    onError,
    onProgress
  } = options;

  const mergedConfig: DataProcessingConfig = { 
    ...DEFAULT_CONFIG, 
    ...config 
  };

  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    progress: 0,
    result: null,
    error: null
  });

  const [isDragActive, setIsDragActive] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const resetUpload = useCallback(() => {
    setUploadState({
      file: null,
      isUploading: false,
      progress: 0,
      result: null,
      error: null
    });
    setIsDragActive(false);
    dragCounter.current = 0;
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > mergedConfig.maxFileSize) {
      return `File size exceeds maximum limit of ${mergedConfig.maxFileSize / (1024 * 1024)}MB`;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !mergedConfig.allowedFileTypes.includes(fileExtension)) {
      return `Unsupported file type. Allowed types: ${mergedConfig.allowedFileTypes.join(', ')}`;
    }

    return null;
  }, [mergedConfig]);

  const uploadFile = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState(prev => ({
        ...prev,
        error: validationError
      }));
      onError?.(validationError);
      return;
    }

    // Reset state and start upload
    setUploadState({
      file,
      isUploading: true,
      progress: 0,
      result: null,
      error: null
    });

    try {
      // Simulate progress for file reading
      onProgress?.(10);
      setUploadState(prev => ({ ...prev, progress: 10 }));

      // Process the file
      onProgress?.(50);
      setUploadState(prev => ({ ...prev, progress: 50 }));

      const result = await processJobDataFile(file, mergedConfig);

      // Complete progress
      onProgress?.(100);
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        result
      }));

      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }));
      onError?.(errorMessage);
    }
  }, [validateFile, mergedConfig, onSuccess, onError, onProgress]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadFile(file);
    }
  }, [uploadFile]);

  const getRootProps = useCallback(() => ({
    ref: dragRef,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onClick: handleClick
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleClick]);

  const getInputProps = useCallback(() => ({
    ref: fileInputRef,
    type: 'file' as const,
    accept: mergedConfig.allowedFileTypes.map(type => `.${type}`).join(','),
    onChange: handleInputChange,
    style: { display: 'none' }
  }), [mergedConfig.allowedFileTypes, handleInputChange]);

  return {
    uploadState,
    isDragActive,
    dragRef,
    uploadFile,
    resetUpload,
    getRootProps,
    getInputProps
  };
}

export default useFileUpload;