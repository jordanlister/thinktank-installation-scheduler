// Lead Route Installation Scheduler - Loading Components

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  message = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8 text-2xl',
    xl: 'h-12 w-12 text-4xl',
  };

  if (message) {
    return (
      <div className={`flex flex-col items-center space-y-3 ${className}`} role="status" aria-live="polite">
        <div className="relative">
          <Loader2 
            className={`animate-spin text-accent-400 ${sizeClasses[size]} drop-shadow-lg`}
          />
          <div className={`absolute inset-0 animate-spin ${sizeClasses[size]} rounded-full blur-sm bg-accent-400/30`}></div>
        </div>
        <span className="text-white/80 text-sm font-medium">{message}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <Loader2 
        className={`animate-spin text-accent-400 ${sizeClasses[size]} ${className} drop-shadow-lg`}
        role="status" 
        aria-live="polite"
      />
      <div className={`absolute inset-0 animate-spin ${sizeClasses[size]} rounded-full blur-sm bg-accent-400/30`}></div>
    </div>
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
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="modal-glass p-8 flex flex-col items-center space-y-6 animate-scale-in">
        <LoadingSpinner size="xl" />
        <p className="text-white font-medium text-lg">{message}</p>
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
      <div className="card-body flex flex-col items-center justify-center py-16">
        <LoadingSpinner size="xl" message={message} />
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
          className={`bg-white/10 rounded-lg h-4 ${
            index < rows - 1 ? 'mb-3' : ''
          } shimmer`}
          style={{ animationDelay: `${index * 0.1}s` }}
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
    <div className={`min-h-screen bg-dark-gradient flex items-center justify-center ${className}`}>
      <div className="text-center glass rounded-2xl p-12 animate-glass-float">
        <div className="mb-8">
          <div className="h-16 w-16 mx-auto bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow-accent mb-6">
            <span className="text-white font-bold text-xl drop-shadow-sm">LR</span>
          </div>
          <LoadingSpinner size="xl" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Lead Route
        </h2>
        <p className="text-white/70 text-lg">{message}</p>
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
          <div className="card-body text-center py-16">
            <div className="h-16 w-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-8 w-8 text-error-400"
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
            <h3 className="text-xl font-semibold text-white mb-3">
              Error Loading Data
            </h3>
            <p className="text-white/70">{error}</p>
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