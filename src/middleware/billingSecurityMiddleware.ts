// Think Tank Technologies Installation Scheduler - Billing Security Middleware
import { Request, Response, NextFunction } from 'express';
import { billingSecurityService } from '../services/billingSecurityService';
import { supabase } from '../services/supabase';

interface SecurityOptions {
  operation: 'billing' | 'webhooks' | 'subscription' | 'payment';
  requireAuth?: boolean;
  rateLimitConfig?: {
    windowMs: number;
    maxRequests: number;
  };
  auditAction?: string;
  auditResource?: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
    email: string;
  };
}

/**
 * Create billing security middleware with rate limiting and audit logging
 */
export const createBillingSecurityMiddleware = (options: SecurityOptions) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    try {
      // Validate request security
      const securityValidation = billingSecurityService.validateRequestSecurity(req);
      if (!securityValidation.isValid) {
        await logSecurityEvent(req, 'suspicious_activity', 'medium', 
          'Request failed security validation', { issues: securityValidation.issues });
        
        return res.status(400).json({
          error: 'Invalid request format',
          message: 'Request does not meet security requirements'
        });
      }

      // Check authentication if required
      if (options.requireAuth && !req.user) {
        await logSecurityEvent(req, 'unauthorized_access', 'high', 
          'Attempt to access protected billing endpoint without authentication');
        
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to access this resource'
        });
      }

      // Generate rate limiting key
      const rateLimitKey = billingSecurityService.generateRateLimitKey(req, true);
      
      // Check rate limits
      const rateLimitResult = billingSecurityService.checkRateLimit(
        rateLimitKey,
        options.operation,
        options.rateLimitConfig
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': (options.rateLimitConfig?.maxRequests || 
          getRateLimitDefault(options.operation)).toString(),
        'X-RateLimit-Remaining': Math.max(0, rateLimitResult.remaining || 0).toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime ? 
          Math.ceil(rateLimitResult.resetTime / 1000).toString() : '0'
      });

      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        await logRateLimitViolation(req, options.operation, rateLimitKey, rateLimitResult);
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.resetTime ? 
            Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60
        });
      }

      // Set up response interceptor for audit logging
      const originalSend = res.send;
      let responseBody: any = null;
      let responseStatus = 200;

      res.send = function(body: any) {
        responseBody = body;
        responseStatus = res.statusCode;
        return originalSend.call(this, body);
      } as any;

      // Set up error handling for this request
      const originalNext = next;
      next = (error?: any) => {
        if (error) {
          responseStatus = res.statusCode || 500;
          logAuditEntry(req, options, false, error.message, Date.now() - startTime);
        }
        return originalNext(error);
      };

      // Continue to the actual route handler
      res.on('finish', () => {
        // Log audit entry after response is sent
        const success = responseStatus >= 200 && responseStatus < 400;
        logAuditEntry(req, options, success, success ? null : responseBody, Date.now() - startTime);
      });

      next();
    } catch (error) {
      console.error('Error in billing security middleware:', error);
      
      await logSecurityEvent(req, 'middleware_error', 'high', 
        'Error in billing security middleware', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return res.status(500).json({
        error: 'Security check failed',
        message: 'Unable to process security validation'
      });
    }
  };
};

/**
 * Webhook-specific security middleware with signature verification
 */
export const webhookSecurityMiddleware = (endpointSecret: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    try {
      const signature = req.headers['stripe-signature'] as string;
      const rawBody = req.body;

      // Verify webhook signature
      const verificationResult = billingSecurityService.verifyWebhookSignature(
        rawBody, signature, endpointSecret
      );

      // Log verification attempt
      await logWebhookVerification(req, verificationResult, Date.now() - startTime);

      if (!verificationResult.isValid) {
        await logSecurityEvent(req, 'webhook_verification_failed', 'high',
          'Webhook signature verification failed', { 
            reason: verificationResult.error,
            hasSignature: !!signature,
            bodySize: Buffer.byteLength(rawBody)
          });

        return res.status(401).json({
          error: 'Webhook verification failed',
          message: 'Unable to verify webhook signature'
        });
      }

      // Apply rate limiting for webhooks
      const rateLimitKey = billingSecurityService.generateRateLimitKey(req, false);
      const rateLimitResult = billingSecurityService.checkRateLimit(rateLimitKey, 'webhooks');

      if (!rateLimitResult.allowed) {
        await logRateLimitViolation(req, 'webhooks', rateLimitKey, rateLimitResult);
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many webhook requests'
        });
      }

      next();
    } catch (error) {
      console.error('Error in webhook security middleware:', error);
      
      await logSecurityEvent(req, 'webhook_middleware_error', 'high',
        'Error in webhook security middleware', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return res.status(500).json({
        error: 'Webhook security check failed'
      });
    }
  };
};

/**
 * Admin-only billing operations middleware
 */
export const adminBillingMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (!['admin', 'owner'].includes(req.user.role)) {
      await logSecurityEvent(req, 'unauthorized_admin_access', 'high',
        'Non-admin user attempted to access admin billing endpoint', {
          userId: req.user.id,
          userRole: req.user.role
        });

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Error in admin billing middleware:', error);
    return res.status(500).json({
      error: 'Authorization check failed'
    });
  }
};

/**
 * Helper function to log security events
 */
async function logSecurityEvent(
  req: Request,
  eventType: string,
  severity: string,
  description: string,
  details: any = {}
): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_severity: severity,
      p_description: description,
      p_details: details,
      p_ip_address: billingSecurityService['getClientIP'](req),
      p_user_agent: req.headers['user-agent'] || null,
      p_organization_id: (req as AuthenticatedRequest).user?.organizationId || null,
      p_user_id: (req as AuthenticatedRequest).user?.id || null
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Helper function to log rate limit violations
 */
async function logRateLimitViolation(
  req: Request,
  operation: string,
  limitKey: string,
  rateLimitResult: any
): Promise<void> {
  try {
    const defaultLimits = {
      billing: { windowMs: 60000, maxRequests: 10 },
      webhooks: { windowMs: 60000, maxRequests: 100 },
      subscription: { windowMs: 300000, maxRequests: 5 },
      payment: { windowMs: 60000, maxRequests: 3 }
    };

    const config = defaultLimits[operation as keyof typeof defaultLimits];

    await supabase.rpc('log_rate_limit_violation', {
      p_operation: operation,
      p_limit_key: limitKey,
      p_request_count: config.maxRequests + 1, // Exceeded by at least 1
      p_limit_exceeded: config.maxRequests,
      p_window_duration_ms: config.windowMs,
      p_ip_address: billingSecurityService['getClientIP'](req),
      p_organization_id: (req as AuthenticatedRequest).user?.organizationId || null,
      p_user_id: (req as AuthenticatedRequest).user?.id || null,
      p_endpoint: req.path,
      p_user_agent: req.headers['user-agent'] || null
    });
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }
}

/**
 * Helper function to log webhook verification attempts
 */
async function logWebhookVerification(
  req: Request,
  verificationResult: any,
  processingTimeMs: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('billing_webhook_verification_logs')
      .insert([{
        webhook_event_id: req.headers['stripe-webhook-id'] || null,
        webhook_type: req.body?.type || null,
        verification_status: verificationResult.isValid ? 'success' : 'failed',
        failure_reason: verificationResult.error || null,
        ip_address: billingSecurityService['getClientIP'](req),
        user_agent: req.headers['user-agent'] || null,
        payload_size: Buffer.byteLength(req.body || ''),
        signature_header: req.headers['stripe-signature'] || null,
        timestamp_header: req.headers['stripe-timestamp'] || null,
        processing_time_ms: processingTimeMs
      }]);

    if (error) {
      console.error('Failed to log webhook verification:', error);
    }
  } catch (error) {
    console.error('Error logging webhook verification:', error);
  }
}

/**
 * Helper function to log audit entries
 */
async function logAuditEntry(
  req: AuthenticatedRequest,
  options: SecurityOptions,
  success: boolean,
  errorMessage: string | null,
  durationMs: number
): Promise<void> {
  if (!options.auditAction || !options.auditResource) {
    return;
  }

  try {
    await billingSecurityService.auditBillingOperation(
      options.auditAction,
      options.auditResource,
      req,
      {
        success,
        errorMessage,
        details: {
          method: req.method,
          path: req.path,
          durationMs,
          statusCode: success ? 200 : 400
        }
      }
    );
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Get default rate limit for operation type
 */
function getRateLimitDefault(operation: string): number {
  const defaults = {
    billing: 10,
    webhooks: 100,
    subscription: 5,
    payment: 3
  };
  return defaults[operation as keyof typeof defaults] || 10;
}

// Pre-configured middleware for common scenarios
export const billingOperationMiddleware = createBillingSecurityMiddleware({
  operation: 'billing',
  requireAuth: true,
  auditAction: 'billing_operation',
  auditResource: 'billing'
});

export const subscriptionMiddleware = createBillingSecurityMiddleware({
  operation: 'subscription',
  requireAuth: true,
  auditAction: 'subscription_operation',
  auditResource: 'subscription'
});

export const paymentMiddleware = createBillingSecurityMiddleware({
  operation: 'payment',
  requireAuth: true,
  auditAction: 'payment_operation',
  auditResource: 'payment'
});

export const webhookMiddleware = createBillingSecurityMiddleware({
  operation: 'webhooks',
  requireAuth: false,
  auditAction: 'webhook_processing',
  auditResource: 'webhook'
});