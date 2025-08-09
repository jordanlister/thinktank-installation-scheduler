// Think Tank Technologies Installation Scheduler - Billing Error Display Component
import React, { useState } from 'react';
import {
  Card,
  Button,
  Typography
} from '../ui';
import { billingErrorHandler } from '../../services/billingErrorHandler';
import {
  BillingError,
  BillingErrorType,
  BillingOperation
} from '../../types';
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  CreditCard,
  HelpCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface BillingErrorDisplayProps {
  error: BillingError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
  showSupportLink?: boolean;
}

interface ErrorActionProps {
  error: BillingError;
  onRetry?: () => void;
}

const getErrorIcon = (errorType: BillingErrorType, severity: string) => {
  if (severity === 'critical') return XCircle;
  
  switch (errorType) {
    case BillingErrorType.PAYMENT_DECLINED:
    case BillingErrorType.INSUFFICIENT_FUNDS:
    case BillingErrorType.CARD_EXPIRED:
    case BillingErrorType.INVALID_CVC:
      return CreditCard;
    case BillingErrorType.RATE_LIMITED:
    case BillingErrorType.CONNECTION_ERROR:
      return RefreshCw;
    case BillingErrorType.VALIDATION_ERROR:
      return AlertCircle;
    default:
      return severity === 'high' ? AlertTriangle : Info;
  }
};

const getErrorColors = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        title: 'text-red-900',
        message: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700 text-white'
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        title: 'text-orange-900',
        message: 'text-orange-800',
        button: 'bg-orange-600 hover:bg-orange-700 text-white'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        message: 'text-yellow-800',
        button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        message: 'text-blue-800',
        button: 'bg-blue-600 hover:bg-blue-700 text-white'
      };
  }
};

const getOperationDisplayName = (operation: BillingOperation): string => {
  const operationNames: Record<BillingOperation, string> = {
    [BillingOperation.CREATE_SUBSCRIPTION]: 'creating subscription',
    [BillingOperation.UPDATE_SUBSCRIPTION]: 'updating subscription',
    [BillingOperation.CANCEL_SUBSCRIPTION]: 'canceling subscription',
    [BillingOperation.CREATE_CUSTOMER]: 'setting up account',
    [BillingOperation.UPDATE_CUSTOMER]: 'updating account',
    [BillingOperation.CREATE_PAYMENT_METHOD]: 'adding payment method',
    [BillingOperation.UPDATE_PAYMENT_METHOD]: 'updating payment method',
    [BillingOperation.DELETE_PAYMENT_METHOD]: 'removing payment method',
    [BillingOperation.PROCESS_PAYMENT]: 'processing payment',
    [BillingOperation.CREATE_INVOICE]: 'generating invoice',
    [BillingOperation.WEBHOOK_PROCESSING]: 'processing update',
    [BillingOperation.USAGE_TRACKING]: 'tracking usage',
    [BillingOperation.OTHER]: 'processing request'
  };

  return operationNames[operation] || 'processing request';
};

const ErrorAction: React.FC<ErrorActionProps> = ({ error, onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || !error.retryable) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getPrimaryAction = () => {
    switch (error.type) {
      case BillingErrorType.PAYMENT_DECLINED:
      case BillingErrorType.INSUFFICIENT_FUNDS:
      case BillingErrorType.CARD_EXPIRED:
      case BillingErrorType.INVALID_CVC:
        return {
          text: 'Update Payment Method',
          url: '/settings/billing/payment-methods',
          icon: CreditCard
        };
      
      case BillingErrorType.SUBSCRIPTION_NOT_FOUND:
        return {
          text: 'View Subscription',
          url: '/settings/billing',
          icon: ExternalLink
        };
      
      case BillingErrorType.USAGE_LIMIT_EXCEEDED:
        return {
          text: 'Upgrade Plan',
          url: '/settings/billing/plans',
          icon: Zap
        };
      
      default:
        if (error.retryable && error.retryCount < error.maxRetries) {
          return {
            text: 'Try Again',
            action: handleRetry,
            icon: RefreshCw,
            loading: isRetrying
          };
        }
        return null;
    }
  };

  const primaryAction = getPrimaryAction();

  if (!primaryAction) return null;

  if (primaryAction.action) {
    return (
      <Button
        onClick={primaryAction.action}
        disabled={primaryAction.loading}
        className="flex items-center gap-2"
        variant="primary"
        size="sm"
      >
        {primaryAction.loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <primaryAction.icon className="w-4 h-4" />
        )}
        {primaryAction.text}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => window.location.href = primaryAction.url!}
      className="flex items-center gap-2"
      variant="primary"
      size="sm"
    >
      <primaryAction.icon className="w-4 h-4" />
      {primaryAction.text}
    </Button>
  );
};

const ErrorDetails: React.FC<{ error: BillingError }> = ({ error }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyErrorDetails = async () => {
    const details = {
      errorType: error.type,
      operation: error.operation,
      message: error.message,
      timestamp: error.details?.timestamp,
      requestId: error.details?.stripeRequestId,
      retryCount: error.retryCount
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        {showTechnicalDetails ? 'Hide' : 'Show'} technical details
      </button>

      {showTechnicalDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-600">Error Type:</span>{' '}
              <span className="text-gray-900">{error.type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Operation:</span>{' '}
              <span className="text-gray-900">{getOperationDisplayName(error.operation)}</span>
            </div>
            {error.details?.errorCode && (
              <div>
                <span className="font-medium text-gray-600">Error Code:</span>{' '}
                <span className="text-gray-900">{error.details.errorCode}</span>
              </div>
            )}
            {error.details?.stripeRequestId && (
              <div>
                <span className="font-medium text-gray-600">Request ID:</span>{' '}
                <span className="text-gray-900 font-mono text-xs">{error.details.stripeRequestId}</span>
              </div>
            )}
            {error.retryCount > 0 && (
              <div>
                <span className="font-medium text-gray-600">Retry Attempt:</span>{' '}
                <span className="text-gray-900">{error.retryCount} of {error.maxRetries}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-600">Timestamp:</span>{' '}
              <span className="text-gray-900">{error.details?.timestamp || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            <Button
              onClick={copyErrorDetails}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Details
                </>
              )}
            </Button>
            <Typography variant="body2" className="text-gray-500 text-xs">
              Share these details with support if needed
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
};

const RetryProgress: React.FC<{ error: BillingError }> = ({ error }) => {
  if (!error.retryable || error.retryCount === 0) return null;

  const nextRetryTime = error.details?.nextRetryAt ? new Date(error.details.nextRetryAt) : null;
  const timeRemaining = nextRetryTime ? Math.max(0, nextRetryTime.getTime() - Date.now()) : 0;

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <Typography variant="body2" className="font-medium text-blue-900">
            Automatic Retry in Progress
          </Typography>
          <Typography variant="body2" className="text-blue-800 mt-1">
            Attempt {error.retryCount} of {error.maxRetries}
            {timeRemaining > 0 && (
              <span> • Next retry in {Math.ceil(timeRemaining / 1000)} seconds</span>
            )}
          </Typography>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-blue-100 rounded-full h-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${(error.retryCount / error.maxRetries) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const BillingErrorDisplay: React.FC<BillingErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  showDetails = false,
  showSupportLink = true
}) => {
  if (!error) return null;

  const Icon = getErrorIcon(error.type, error.severity);
  const colors = getErrorColors(error.severity);
  const userMessage = billingErrorHandler.getUserFriendlyMessage(error);

  return (
    <Card className={`${colors.bg} ${colors.border} border-l-4 ${className}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 ${colors.icon}`} />
          
          <div className="flex-1 min-w-0">
            <Typography variant="body1" className={`font-semibold ${colors.title}`}>
              {error.severity === 'critical' ? 'Critical Error' : 
               error.severity === 'high' ? 'Error' : 
               error.severity === 'medium' ? 'Warning' : 'Information'}
            </Typography>
            
            <Typography variant="body2" className={`mt-1 ${colors.message}`}>
              {userMessage}
            </Typography>

            {/* Retry Progress */}
            <RetryProgress error={error} />

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              <ErrorAction error={error} onRetry={onRetry} />
              
              {showSupportLink && error.severity !== 'low' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('/support', '_blank')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <HelpCircle className="w-4 h-4" />
                  Contact Support
                </Button>
              )}
            </div>

            {/* Error Details */}
            {showDetails && <ErrorDetails error={error} />}
          </div>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss error"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

// Inline Error Display for Forms
interface InlineErrorDisplayProps {
  error: BillingError | null;
  className?: string;
}

export const InlineErrorDisplay: React.FC<InlineErrorDisplayProps> = ({
  error,
  className = ''
}) => {
  if (!error) return null;

  const colors = getErrorColors(error.severity);

  return (
    <div className={`flex items-center gap-2 mt-2 ${className}`}>
      <AlertCircle className={`w-4 h-4 ${colors.icon}`} />
      <Typography variant="body2" className={colors.message}>
        {billingErrorHandler.getUserFriendlyMessage(error)}
      </Typography>
    </div>
  );
};

// Error Summary for Multiple Errors
interface ErrorSummaryProps {
  errors: BillingError[];
  onRetryAll?: () => void;
  onDismissAll?: () => void;
  className?: string;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  onRetryAll,
  onDismissAll,
  className = ''
}) => {
  if (errors.length === 0) return null;

  const criticalErrors = errors.filter(e => e.severity === 'critical').length;
  const highErrors = errors.filter(e => e.severity === 'high').length;
  const retryableErrors = errors.filter(e => e.retryable).length;

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <Typography variant="body1" className="font-semibold text-red-900">
                Multiple Errors Occurred ({errors.length})
              </Typography>
              <Typography variant="body2" className="text-red-800 mt-1">
                {criticalErrors > 0 && `${criticalErrors} critical, `}
                {highErrors > 0 && `${highErrors} high severity, `}
                {retryableErrors > 0 && `${retryableErrors} can be retried`}
              </Typography>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {retryableErrors > 0 && onRetryAll && (
              <Button
                onClick={onRetryAll}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4" />
                Retry All
              </Button>
            )}
            
            {onDismissAll && (
              <Button
                onClick={onDismissAll}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-800"
              >
                Dismiss All
              </Button>
            )}
          </div>
        </div>

        {/* Individual Errors */}
        <div className="mt-4 space-y-2">
          {errors.slice(0, 3).map((error, index) => (
            <div key={index} className="p-3 bg-white rounded border border-red-200">
              <Typography variant="body2" className="font-medium text-red-900">
                {getOperationDisplayName(error.operation)}
              </Typography>
              <Typography variant="body2" className="text-red-800">
                {error.userMessage}
              </Typography>
            </div>
          ))}
          
          {errors.length > 3 && (
            <Typography variant="body2" className="text-red-700 text-center">
              ... and {errors.length - 3} more errors
            </Typography>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BillingErrorDisplay;