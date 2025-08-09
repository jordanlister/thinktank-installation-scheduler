// Think Tank Technologies Installation Scheduler - Comprehensive Billing Error Handler
import Stripe from 'stripe';
import { supabase } from './supabase';
import {
  BillingError,
  BillingErrorType,
  BillingOperation,
  RetryConfig,
  ErrorContext
} from '../types';

interface ErrorMapping {
  stripeCode?: string;
  stripeType?: string;
  message: string;
  userMessage: string;
  type: BillingErrorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  suggestedAction?: string;
}

interface RetryAttempt {
  attempt: number;
  error: string;
  timestamp: Date;
  backoffMs: number;
}

interface ErrorLog {
  id: string;
  organizationId?: string;
  operation: BillingOperation;
  errorType: BillingErrorType;
  errorCode?: string;
  errorMessage: string;
  userMessage: string;
  stackTrace?: string;
  context: ErrorContext;
  retryAttempts: RetryAttempt[];
  resolved: boolean;
  resolvedAt?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

class BillingErrorHandler {
  private readonly errorMappings: ErrorMapping[] = [
    // Stripe Card Errors
    {
      stripeType: 'StripeCardError',
      stripeCode: 'card_declined',
      message: 'Card was declined',
      userMessage: 'Your payment method was declined. Please try a different card or contact your bank.',
      type: BillingErrorType.PAYMENT_DECLINED,
      severity: 'high',
      retryable: false,
      suggestedAction: 'Update your payment method or try a different card'
    },
    {
      stripeType: 'StripeCardError',
      stripeCode: 'insufficient_funds',
      message: 'Insufficient funds',
      userMessage: 'Your card has insufficient funds for this transaction.',
      type: BillingErrorType.INSUFFICIENT_FUNDS,
      severity: 'high',
      retryable: false,
      suggestedAction: 'Add funds to your account or use a different payment method'
    },
    {
      stripeType: 'StripeCardError',
      stripeCode: 'expired_card',
      message: 'Card has expired',
      userMessage: 'Your card has expired. Please update your payment method.',
      type: BillingErrorType.CARD_EXPIRED,
      severity: 'high',
      retryable: false,
      suggestedAction: 'Update your payment method with a current card'
    },
    {
      stripeType: 'StripeCardError',
      stripeCode: 'incorrect_cvc',
      message: 'Incorrect CVC',
      userMessage: 'The security code (CVC) you entered is incorrect.',
      type: BillingErrorType.INVALID_CVC,
      severity: 'medium',
      retryable: false,
      suggestedAction: 'Check your card and re-enter the security code'
    },
    {
      stripeType: 'StripeCardError',
      stripeCode: 'processing_error',
      message: 'Card processing error',
      userMessage: 'There was an error processing your payment. Please try again.',
      type: BillingErrorType.PROCESSING_ERROR,
      severity: 'medium',
      retryable: true,
      suggestedAction: 'Try the payment again or contact support if the problem persists'
    },
    // Stripe API Errors
    {
      stripeType: 'StripeRateLimitError',
      message: 'Rate limit exceeded',
      userMessage: 'We\'re experiencing high demand. Please wait a moment and try again.',
      type: BillingErrorType.RATE_LIMITED,
      severity: 'medium',
      retryable: true,
      suggestedAction: 'Wait a few moments before trying again'
    },
    {
      stripeType: 'StripeConnectionError',
      message: 'Connection error',
      userMessage: 'Unable to connect to payment processor. Please check your connection and try again.',
      type: BillingErrorType.CONNECTION_ERROR,
      severity: 'medium',
      retryable: true,
      suggestedAction: 'Check your internet connection and try again'
    },
    {
      stripeType: 'StripeAPIError',
      message: 'Payment service error',
      userMessage: 'Our payment service is temporarily unavailable. Please try again later.',
      type: BillingErrorType.SERVICE_UNAVAILABLE,
      severity: 'high',
      retryable: true,
      suggestedAction: 'Try again in a few minutes or contact support'
    },
    // Subscription Errors
    {
      message: 'Subscription not found',
      userMessage: 'We couldn\'t find your subscription. Please contact support.',
      type: BillingErrorType.SUBSCRIPTION_NOT_FOUND,
      severity: 'high',
      retryable: false,
      suggestedAction: 'Contact our support team for assistance'
    },
    {
      message: 'Invalid subscription plan',
      userMessage: 'The selected plan is not available. Please choose a different plan.',
      type: BillingErrorType.INVALID_PLAN,
      severity: 'medium',
      retryable: false,
      suggestedAction: 'Select a valid subscription plan'
    },
    {
      message: 'Usage limit exceeded',
      userMessage: 'You\'ve reached your plan\'s usage limit. Please upgrade to continue.',
      type: BillingErrorType.USAGE_LIMIT_EXCEEDED,
      severity: 'medium',
      retryable: false,
      suggestedAction: 'Upgrade your plan to increase limits'
    },
    // Generic Errors
    {
      message: 'Invalid request data',
      userMessage: 'Some of the information provided is invalid. Please check and try again.',
      type: BillingErrorType.VALIDATION_ERROR,
      severity: 'medium',
      retryable: false,
      suggestedAction: 'Check your information and correct any errors'
    },
    {
      message: 'Database error',
      userMessage: 'A temporary error occurred. Please try again.',
      type: BillingErrorType.DATABASE_ERROR,
      severity: 'high',
      retryable: true,
      suggestedAction: 'Try again or contact support if the problem persists'
    }
  ];

  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: true
  };

  /**
   * Handle and categorize billing errors with retry logic
   */
  async handleError(
    error: any,
    operation: BillingOperation,
    context: ErrorContext,
    retryConfig?: Partial<RetryConfig>
  ): Promise<BillingError> {
    const billingError = this.categorizeError(error, operation, context);
    
    // Log the error
    await this.logError(billingError, context);

    // If retryable and we haven't exceeded max retries, handle retry
    if (billingError.retryable && this.shouldRetry(context, retryConfig)) {
      return this.handleRetry(billingError, operation, context, retryConfig);
    }

    return billingError;
  }

  /**
   * Categorize error and create BillingError object
   */
  private categorizeError(
    error: any,
    operation: BillingOperation,
    context: ErrorContext
  ): BillingError {
    let errorMapping = this.findErrorMapping(error);
    
    if (!errorMapping) {
      errorMapping = this.getDefaultErrorMapping(error);
    }

    return {
      type: errorMapping.type,
      message: errorMapping.message,
      userMessage: errorMapping.userMessage,
      operation,
      severity: errorMapping.severity,
      retryable: errorMapping.retryable,
      suggestedAction: errorMapping.suggestedAction,
      details: {
        originalError: error?.message || 'Unknown error',
        errorCode: this.extractErrorCode(error),
        stripeRequestId: this.extractStripeRequestId(error),
        timestamp: new Date().toISOString()
      },
      context,
      retryCount: context.retryCount || 0,
      maxRetries: context.maxRetries || this.defaultRetryConfig.maxRetries
    };
  }

  /**
   * Find appropriate error mapping for the error
   */
  private findErrorMapping(error: any): ErrorMapping | null {
    if (error instanceof Stripe.errors.StripeError) {
      return this.errorMappings.find(mapping => 
        mapping.stripeType === error.constructor.name &&
        (!mapping.stripeCode || mapping.stripeCode === error.code)
      ) || this.errorMappings.find(mapping => 
        mapping.stripeType === error.constructor.name
      ) || null;
    }

    if (error?.message) {
      return this.errorMappings.find(mapping => 
        !mapping.stripeType && 
        error.message.toLowerCase().includes(mapping.message.toLowerCase())
      ) || null;
    }

    return null;
  }

  /**
   * Get default error mapping for unrecognized errors
   */
  private getDefaultErrorMapping(error: any): ErrorMapping {
    return {
      message: 'Unexpected error occurred',
      userMessage: 'An unexpected error occurred. Please try again or contact support.',
      type: BillingErrorType.UNKNOWN_ERROR,
      severity: 'medium',
      retryable: false,
      suggestedAction: 'Contact support if this problem persists'
    };
  }

  /**
   * Handle retry logic with exponential backoff
   */
  private async handleRetry(
    billingError: BillingError,
    operation: BillingOperation,
    context: ErrorContext,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<BillingError> {
    const config = { ...this.defaultRetryConfig, ...customRetryConfig };
    const retryCount = context.retryCount || 0;

    if (retryCount >= config.maxRetries) {
      return {
        ...billingError,
        retryable: false,
        userMessage: `${billingError.userMessage} Maximum retry attempts exceeded.`,
        suggestedAction: 'Contact support for assistance'
      };
    }

    // Calculate backoff delay
    const delay = this.calculateBackoffDelay(retryCount, config);
    
    // Update context for next retry
    const nextContext = {
      ...context,
      retryCount: retryCount + 1,
      lastRetryAt: new Date(),
      nextRetryAt: new Date(Date.now() + delay)
    };

    // Log retry attempt
    await this.logRetryAttempt(billingError, nextContext, delay);

    // Return updated error with retry information
    return {
      ...billingError,
      context: nextContext,
      retryCount: nextContext.retryCount,
      details: {
        ...billingError.details,
        retryDelay: delay,
        nextRetryAt: nextContext.nextRetryAt?.toISOString()
      }
    };
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(retryCount: number, config: RetryConfig): number {
    let delay = Math.min(
      config.baseDelayMs * Math.pow(config.backoffMultiplier, retryCount),
      config.maxDelayMs
    );

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Check if operation should be retried
   */
  private shouldRetry(context: ErrorContext, retryConfig?: Partial<RetryConfig>): boolean {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    const retryCount = context.retryCount || 0;
    
    return retryCount < config.maxRetries;
  }

  /**
   * Extract error code from various error types
   */
  private extractErrorCode(error: any): string | undefined {
    if (error instanceof Stripe.errors.StripeError) {
      return error.code || error.type;
    }
    
    return error?.code || error?.errorCode || undefined;
  }

  /**
   * Extract Stripe request ID for debugging
   */
  private extractStripeRequestId(error: any): string | undefined {
    if (error instanceof Stripe.errors.StripeError) {
      return error.requestId;
    }
    
    return undefined;
  }

  /**
   * Log error to database for monitoring and analytics
   */
  private async logError(billingError: BillingError, context: ErrorContext): Promise<void> {
    try {
      const errorLog = {
        organization_id: context.organizationId,
        user_id: context.userId,
        operation: billingError.operation,
        error_type: billingError.type,
        error_code: billingError.details?.errorCode,
        error_message: billingError.message,
        user_message: billingError.userMessage,
        severity: billingError.severity,
        retryable: billingError.retryable,
        retry_count: billingError.retryCount,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          userAgent: context.userAgent,
          ipAddress: context.ipAddress
        },
        stack_trace: billingError.details?.originalError,
        stripe_request_id: billingError.details?.stripeRequestId,
        resolved: false
      };

      const { error } = await supabase
        .from('billing_error_logs')
        .insert([errorLog]);

      if (error) {
        console.error('Failed to log billing error:', error);
      }
    } catch (loggingError) {
      console.error('Error logging billing error:', loggingError);
    }
  }

  /**
   * Log retry attempt
   */
  private async logRetryAttempt(
    billingError: BillingError,
    context: ErrorContext,
    delay: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('billing_retry_attempts')
        .insert([{
          organization_id: context.organizationId,
          operation: billingError.operation,
          error_type: billingError.type,
          attempt_number: context.retryCount,
          delay_ms: delay,
          scheduled_for: context.nextRetryAt?.toISOString(),
          error_context: context
        }]);

      if (error) {
        console.error('Failed to log retry attempt:', error);
      }
    } catch (loggingError) {
      console.error('Error logging retry attempt:', loggingError);
    }
  }

  /**
   * Execute operation with automatic error handling and retry
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationType: BillingOperation,
    context: ErrorContext,
    retryConfig?: Partial<RetryConfig>
  ): Promise<{ result?: T; error?: BillingError }> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: BillingError | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // If we had previous errors but now succeeded, log recovery
        if (lastError && attempt > 0) {
          await this.logErrorRecovery(lastError, attempt);
        }
        
        return { result };
      } catch (error) {
        const currentContext = { ...context, retryCount: attempt };
        lastError = await this.handleError(error, operationType, currentContext, retryConfig);
        
        // If not retryable or max retries reached, return error
        if (!lastError.retryable || attempt >= config.maxRetries) {
          return { error: lastError };
        }
        
        // Wait for backoff delay before next attempt
        if (attempt < config.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, config);
          await this.sleep(delay);
        }
      }
    }

    return { error: lastError || this.createGenericError(operationType, context) };
  }

  /**
   * Log successful error recovery
   */
  private async logErrorRecovery(billingError: BillingError, successfulAttempt: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('billing_error_recoveries')
        .insert([{
          organization_id: billingError.context?.organizationId,
          operation: billingError.operation,
          error_type: billingError.type,
          original_error: billingError.message,
          attempts_to_success: successfulAttempt,
          recovered_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Failed to log error recovery:', error);
      }
    } catch (loggingError) {
      console.error('Error logging error recovery:', loggingError);
    }
  }

  /**
   * Create generic error for unhandled cases
   */
  private createGenericError(operation: BillingOperation, context: ErrorContext): BillingError {
    return {
      type: BillingErrorType.UNKNOWN_ERROR,
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please contact support.',
      operation,
      severity: 'medium',
      retryable: false,
      suggestedAction: 'Contact support for assistance',
      context,
      retryCount: context.retryCount || 0,
      maxRetries: 0,
      details: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get user-friendly error message with context
   */
  getUserFriendlyMessage(billingError: BillingError): string {
    let message = billingError.userMessage;

    // Add context-specific information
    switch (billingError.operation) {
      case BillingOperation.CREATE_SUBSCRIPTION:
        message += ' Please check your payment information and try again.';
        break;
      case BillingOperation.UPDATE_SUBSCRIPTION:
        message += ' Your current subscription remains active.';
        break;
      case BillingOperation.CANCEL_SUBSCRIPTION:
        message += ' Your subscription is still active.';
        break;
      case BillingOperation.UPDATE_PAYMENT_METHOD:
        message += ' Your existing payment method remains unchanged.';
        break;
    }

    // Add suggested action if available
    if (billingError.suggestedAction) {
      message += ` ${billingError.suggestedAction}.`;
    }

    return message;
  }

  /**
   * Get error statistics for monitoring
   */
  async getErrorStatistics(
    organizationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    retrySuccessRate: number;
    mostCommonErrors: Array<{ type: string; count: number; message: string }>;
  }> {
    try {
      let query = supabase.from('billing_error_logs').select('*');
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: errors } = await query;
      
      if (!errors) {
        return {
          totalErrors: 0,
          errorsByType: {},
          errorsBySeverity: {},
          retrySuccessRate: 0,
          mostCommonErrors: []
        };
      }

      const stats = {
        totalErrors: errors.length,
        errorsByType: {} as Record<string, number>,
        errorsBySeverity: {} as Record<string, number>,
        retrySuccessRate: 0,
        mostCommonErrors: [] as Array<{ type: string; count: number; message: string }>
      };

      // Calculate statistics
      const typeCount: Record<string, { count: number; message: string }> = {};
      
      for (const error of errors) {
        // Count by type
        stats.errorsByType[error.error_type] = (stats.errorsByType[error.error_type] || 0) + 1;
        
        // Count by severity
        stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        
        // Track for most common errors
        if (!typeCount[error.error_type]) {
          typeCount[error.error_type] = { count: 0, message: error.user_message };
        }
        typeCount[error.error_type].count++;
      }

      // Get most common errors
      stats.mostCommonErrors = Object.entries(typeCount)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([type, data]) => ({ type, count: data.count, message: data.message }));

      // Calculate retry success rate
      const retriedErrors = errors.filter(e => e.retry_count > 0);
      const resolvedRetries = retriedErrors.filter(e => e.resolved);
      stats.retrySuccessRate = retriedErrors.length > 0 
        ? Math.round((resolvedRetries.length / retriedErrors.length) * 100) 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting error statistics:', error);
      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const billingErrorHandler = new BillingErrorHandler();