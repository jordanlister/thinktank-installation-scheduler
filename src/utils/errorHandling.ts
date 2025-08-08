// Think Tank Technologies - Enhanced Error Handling
// Utilities for robust error handling and recovery

import { PostgrestError } from '@supabase/supabase-js';

export interface DatabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  isNetworkError: boolean;
  isRetryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  retryOnNetworkError?: boolean;
  retryOnServerError?: boolean;
}

export class DatabaseErrorHandler {
  private static readonly NETWORK_ERROR_CODES = [
    'network_error',
    'connection_error',
    'timeout_error',
    'PGRST301', // Connection error
    'PGRST500'  // Internal server error
  ];

  private static readonly RETRYABLE_ERROR_CODES = [
    'PGRST500', // Internal server error
    '23505',    // Unique violation (can retry with different data)
    '40001',    // Serialization failure
    '40P01',    // Deadlock detected
    'network_error',
    'connection_error',
    'timeout_error'
  ];

  static parseError(error: unknown): DatabaseError {
    let parsedError: DatabaseError = {
      message: 'An unknown error occurred',
      isNetworkError: false,
      isRetryable: false,
      severity: 'medium'
    };

    if (error instanceof Error) {
      parsedError.message = error.message;

      // Check if it's a Supabase/PostgreSQL error
      if ('code' in error) {
        const pgError = error as PostgrestError;
        parsedError.code = pgError.code;
        parsedError.details = pgError.details;
        parsedError.hint = pgError.hint;
      }
    } else if (typeof error === 'string') {
      parsedError.message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      parsedError.message = String(error.message);
      if ('code' in error) {
        parsedError.code = String(error.code);
      }
    }

    // Determine if it's a network error
    parsedError.isNetworkError = this.isNetworkError(parsedError);

    // Determine if it's retryable
    parsedError.isRetryable = this.isRetryableError(parsedError);

    // Determine severity
    parsedError.severity = this.determineSeverity(parsedError);

    return parsedError;
  }

  private static isNetworkError(error: DatabaseError): boolean {
    if (!error.code) return false;
    
    return this.NETWORK_ERROR_CODES.includes(error.code) ||
           error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('connection') ||
           error.message.toLowerCase().includes('timeout') ||
           error.message.toLowerCase().includes('fetch');
  }

  private static isRetryableError(error: DatabaseError): boolean {
    if (!error.code) {
      // Check message for retryable conditions
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('timeout') || 
             message.includes('connection');
    }
    
    return this.RETRYABLE_ERROR_CODES.includes(error.code);
  }

  private static determineSeverity(error: DatabaseError): 'low' | 'medium' | 'high' | 'critical' {
    if (error.isNetworkError) {
      return 'medium'; // Network errors are medium severity - user can work offline
    }

    if (error.code) {
      switch (error.code) {
        case 'PGRST401': // Unauthorized
        case 'PGRST403': // Forbidden
          return 'high';
        
        case 'PGRST404': // Not found
          return 'low';
        
        case 'PGRST500': // Internal server error
          return 'critical';
        
        case '23505': // Unique violation
        case '23503': // Foreign key violation
          return 'medium';
        
        default:
          return 'medium';
      }
    }

    return 'medium';
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffMultiplier = 2,
      retryOnNetworkError = true,
      retryOnServerError = true
    } = options;

    let lastError: DatabaseError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.parseError(error);
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Check if error is retryable based on options
        const shouldRetry = 
          (retryOnNetworkError && lastError.isNetworkError) ||
          (retryOnServerError && lastError.isRetryable && !lastError.isNetworkError);
        
        if (!shouldRetry) {
          throw lastError;
        }
        
        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retrying operation (attempt ${attempt + 2}/${maxRetries + 1}) after ${delay}ms delay`);
      }
    }
    
    throw lastError!;
  }

  static getErrorMessage(error: DatabaseError): string {
    switch (error.severity) {
      case 'critical':
        return 'A critical system error occurred. Please try again later or contact support.';
      
      case 'high':
        return error.message;
      
      case 'medium':
        if (error.isNetworkError) {
          return 'Connection issue detected. Working in offline mode with cached data.';
        }
        return error.message;
      
      case 'low':
        return error.hint || error.message;
      
      default:
        return error.message;
    }
  }

  static getErrorActions(error: DatabaseError): Array<{ label: string; action: string }> {
    const actions = [];

    if (error.isRetryable) {
      actions.push({ label: 'Retry', action: 'retry' });
    }

    if (error.isNetworkError) {
      actions.push({ label: 'Work Offline', action: 'offline' });
    }

    if (error.severity === 'critical') {
      actions.push({ label: 'Contact Support', action: 'support' });
    }

    if (error.severity === 'high' || error.severity === 'critical') {
      actions.push({ label: 'Reload Page', action: 'reload' });
    }

    return actions;
  }
}

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const parsedError = DatabaseErrorHandler.parseError(error);
    
    console.error(`Error in ${context || 'unknown context'}:`, {
      originalError: error,
      parsedError
    });

    // You could integrate with a notification system here
    return parsedError;
  };

  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context?: string,
    retryOptions?: RetryOptions
  ): Promise<{ data?: T; error?: DatabaseError }> => {
    try {
      const data = await DatabaseErrorHandler.withRetry(operation, retryOptions);
      return { data };
    } catch (error) {
      const parsedError = handleError(error, context);
      return { error: parsedError };
    }
  };

  return { handleError, withErrorHandling };
}

// Utility for offline-first operations
export class OfflineFirstHandler {
  private static pendingOperations = new Map<string, any>();

  static async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    operationId?: string
  ): Promise<T> {
    try {
      const result = await operation();
      
      // Clear any pending operation on success
      if (operationId && this.pendingOperations.has(operationId)) {
        this.pendingOperations.delete(operationId);
      }
      
      return result;
    } catch (error) {
      const parsedError = DatabaseErrorHandler.parseError(error);
      
      if (parsedError.isNetworkError) {
        console.log('Network error detected, using fallback data');
        
        // Store operation for later retry if specified
        if (operationId) {
          this.pendingOperations.set(operationId, { operation, timestamp: Date.now() });
        }
        
        return fallback();
      }
      
      throw error;
    }
  }

  static getPendingOperations(): Map<string, any> {
    return new Map(this.pendingOperations);
  }

  static async retryPendingOperations(): Promise<void> {
    const operations = Array.from(this.pendingOperations.entries());
    
    for (const [id, { operation }] of operations) {
      try {
        await operation();
        this.pendingOperations.delete(id);
        console.log(`Successfully retried operation: ${id}`);
      } catch (error) {
        console.error(`Failed to retry operation ${id}:`, error);
      }
    }
  }
}

export default DatabaseErrorHandler;