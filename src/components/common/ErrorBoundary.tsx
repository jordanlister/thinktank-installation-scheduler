// Think Tank Technologies Installation Scheduler - Error Boundary Component

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    import('@/utils/monitoring').then(({ captureError }) => {
      captureError({
        message: error.message,
        stack: error.stack,
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        severity: 'critical',
      });
    }).catch(() => {
      // Fallback if monitoring module fails to load
      console.error('Failed to send error to monitoring service');
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-16 w-16 text-error-500 mb-4" />
                <h2 className="text-2xl font-semibold text-primary-900 mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-primary-600 mb-6">
                  We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
                </p>
                
                <button
                  onClick={this.handleReset}
                  className="btn-primary inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-primary-700 hover:text-primary-900">
                      Error Details (Development Only)
                    </summary>
                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-sm text-red-800">
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div className="mt-2 text-xs text-red-700 font-mono whitespace-pre-wrap">
                          {this.state.error.stack}
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div className="mt-2 text-xs text-red-700 font-mono whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;