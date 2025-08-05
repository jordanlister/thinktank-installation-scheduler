// Think Tank Technologies Installation Scheduler - Loading Components

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2 
      className={`animate-spin text-accent-600 ${sizeClasses[size]} ${className}`}
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4 shadow-lg">
        <LoadingSpinner size="lg" />
        <p className="text-primary-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  message = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-body flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-primary-600 mt-4">{message}</p>
      </div>
    </div>
  );
};

interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`btn-primary relative ${className}`}
    >
      {loading && (
        <LoadingSpinner size="sm" className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

interface SkeletonProps {
  className?: string;
  rows?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  rows = 1 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`bg-primary-200 rounded-md h-4 ${
            index < rows - 1 ? 'mb-2' : ''
          }`}
        />
      ))}
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header skeleton */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`header-${colIndex}`} className="flex-1 h-6" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="flex-1 h-8" />
          ))}
        </div>
      ))}
    </div>
  );
};

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading page...', 
  className = '' 
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <h2 className="mt-4 text-lg font-medium text-primary-900">
          Think Tank Technologies
        </h2>
        <p className="mt-2 text-primary-600">{message}</p>
      </div>
    </div>
  );
};

// Higher-order component for adding loading states
interface WithLoadingProps {
  loading: boolean;
  error?: string | null;
  loadingMessage?: string;
  errorFallback?: React.ReactNode;
}

export const withLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return ({ 
    loading, 
    error, 
    loadingMessage = 'Loading...', 
    errorFallback,
    ...props 
  }: P & WithLoadingProps) => {
    if (error) {
      if (errorFallback) {
        return <>{errorFallback}</>;
      }
      
      return (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-error-500 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-primary-900 mb-1">
              Error Loading Data
            </h3>
            <p className="text-primary-600">{error}</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return <LoadingCard message={loadingMessage} />;
    }

    return <Component {...(props as P)} />;
  };
};

export default LoadingSpinner;