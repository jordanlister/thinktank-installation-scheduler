// Think Tank Technologies Installation Scheduler - Usage Limit Enforcement Middleware
import { Request, Response, NextFunction } from 'express';
import { usageTrackingService } from '../services/usageTrackingService';
import { stripeService } from '../services/stripeService';
import {
  SubscriptionPlan,
  SubscriptionLimits,
  SubscriptionFeatures,
  UsageLimitError,
  UsageLimitErrorType
} from '../types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

interface UsageLimitOptions {
  resource: keyof SubscriptionLimits;
  action: string;
  count?: number;
  feature?: keyof SubscriptionFeatures;
  skipEnforcement?: boolean;
  customErrorMessage?: string;
}

/**
 * Middleware factory for enforcing usage limits based on subscription plans
 */
export function enforceUsageLimit(options: UsageLimitOptions) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Skip enforcement if explicitly disabled or in development
      if (options.skipEnforcement || process.env.NODE_ENV === 'development') {
        return next();
      }

      // Check if user is authenticated
      if (!req.user?.organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      const { organizationId } = req.user;
      const { resource, action, count = 1, feature } = options;

      // Check feature availability if specified
      if (feature) {
        const featureCheck = await usageTrackingService.isFeatureAvailable(organizationId, feature);
        
        if (!featureCheck.available) {
          const error: UsageLimitError = {
            type: UsageLimitErrorType.FEATURE_DISABLED,
            resource: feature,
            currentUsage: 0,
            limit: 0,
            message: featureCheck.reason || `Feature '${feature}' is not available on your current plan`,
            suggestedAction: `Upgrade to ${featureCheck.planRequired || 'a higher'} plan to access this feature`,
            planRequired: featureCheck.planRequired,
            upgradeUrl: '/settings/billing'
          };

          return res.status(403).json({
            success: false,
            error: error.message,
            code: 'FEATURE_DISABLED',
            details: error
          });
        }
      }

      // Check resource limits
      const limitCheck = await usageTrackingService.canPerformAction(organizationId, resource, count);
      
      if (!limitCheck.allowed) {
        const error: UsageLimitError = {
          type: UsageLimitErrorType.LIMIT_EXCEEDED,
          resource,
          currentUsage: limitCheck.currentUsage || 0,
          limit: limitCheck.limit || 0,
          message: limitCheck.reason || options.customErrorMessage || `You have reached your ${resource} limit`,
          suggestedAction: 'Upgrade your plan to increase limits',
          upgradeUrl: '/settings/billing'
        };

        // Log the limit violation
        console.warn(`Usage limit violation for organization ${organizationId}:`, {
          resource,
          action,
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit,
          attemptedCount: count
        });

        return res.status(403).json({
          success: false,
          error: error.message,
          code: 'USAGE_LIMIT_EXCEEDED',
          details: error
        });
      }

      // Attach usage info to request for logging/monitoring
      req.usageInfo = {
        resource,
        currentUsage: limitCheck.currentUsage || 0,
        limit: limitCheck.limit || 0,
        actionCount: count
      };

      next();
    } catch (error) {
      console.error('Error in usage limit middleware:', error);
      
      // In case of errors, allow the request to proceed (fail open)
      // but log the error for monitoring
      console.warn('Usage limit check failed, allowing request to proceed:', error);
      next();
    }
  };
}

/**
 * Middleware to enforce project limits
 */
export const enforceProjectLimit = (count: number = 1) => 
  enforceUsageLimit({
    resource: 'projects',
    action: 'create_project',
    count,
    customErrorMessage: `You have reached your project limit. Upgrade to Professional or Enterprise to create more projects.`
  });

/**
 * Middleware to enforce team member limits
 */
export const enforceTeamMemberLimit = (count: number = 1) =>
  enforceUsageLimit({
    resource: 'teamMembers',
    action: 'invite_team_member',
    count,
    customErrorMessage: `You have reached your team member limit. Upgrade your plan to invite more team members.`
  });

/**
 * Middleware to enforce installation limits (monthly)
 */
export const enforceInstallationLimit = (count: number = 1) =>
  enforceUsageLimit({
    resource: 'installations',
    action: 'create_installation',
    count,
    customErrorMessage: `You have reached your monthly installation limit. Upgrade your plan for more installations.`
  });

/**
 * Middleware to enforce API request limits
 */
export const enforceApiRequestLimit = (count: number = 1) =>
  enforceUsageLimit({
    resource: 'apiRequests',
    action: 'api_request',
    count,
    customErrorMessage: `You have reached your API request limit. Upgrade your plan for more API requests.`
  });

/**
 * Middleware to enforce feature access
 */
export const enforceFeatureAccess = (feature: keyof SubscriptionFeatures) =>
  enforceUsageLimit({
    resource: 'projects', // Dummy resource, feature check is primary
    action: `access_${feature}`,
    feature,
    customErrorMessage: `This feature is not available on your current plan.`
  });

/**
 * Advanced analytics feature enforcement
 */
export const enforceAnalyticsAccess = enforceFeatureAccess('analytics');

/**
 * Advanced reporting feature enforcement
 */
export const enforceAdvancedReportingAccess = enforceFeatureAccess('advancedReporting');

/**
 * API access enforcement
 */
export const enforceApiAccess = enforceFeatureAccess('apiAccess');

/**
 * Custom integrations feature enforcement
 */
export const enforceCustomIntegrationsAccess = enforceFeatureAccess('customIntegrations');

/**
 * SSO integration feature enforcement
 */
export const enforceSsoIntegrationAccess = enforceFeatureAccess('ssoIntegration');

/**
 * Webhook support feature enforcement
 */
export const enforceWebhookSupportAccess = enforceFeatureAccess('webhookSupport');

/**
 * Bulk operations feature enforcement
 */
export const enforceBulkOperationsAccess = enforceFeatureAccess('bulkOperations');

/**
 * Custom fields feature enforcement
 */
export const enforceCustomFieldsAccess = enforceFeatureAccess('customFields');

/**
 * Audit logs feature enforcement
 */
export const enforceAuditLogsAccess = enforceFeatureAccess('auditLogs');

/**
 * Middleware to track resource usage after successful operations
 */
export function trackResourceUsage(resource: keyof SubscriptionLimits, count: number = 1) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to track usage on success
    res.json = function(body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Track successful resource usage asynchronously
        if (req.user?.organizationId) {
          trackUsageAsync(req.user.organizationId, resource, count);
        }
      }
      return originalJson.call(this, body);
    };

    res.send = function(body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Track successful resource usage asynchronously
        if (req.user?.organizationId) {
          trackUsageAsync(req.user.organizationId, resource, count);
        }
      }
      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Asynchronously track usage without blocking the response
 */
async function trackUsageAsync(organizationId: string, resource: keyof SubscriptionLimits, count: number) {
  try {
    // Record usage in usage history for analytics
    const { error } = await import('../services/supabase').then(({ supabase }) => 
      supabase
        .from('usage_history')
        .insert([{
          organization_id: organizationId,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          metric_name: `resource_${resource}`,
          metric_value: count,
          metadata: {
            resource,
            timestamp: new Date().toISOString()
          }
        }])
    );

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error tracking resource usage:', error);
    }
  } catch (error) {
    console.error('Error in async usage tracking:', error);
  }
}

/**
 * Middleware to check and warn about approaching usage limits
 */
export function checkUsageWarnings() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.organizationId) {
        // Get current usage warnings
        const warnings = await usageTrackingService.getUsageWarnings(req.user.organizationId);
        
        // Attach warnings to request for use in response
        if (warnings.length > 0) {
          req.usageWarnings = warnings;
          
          // Add warning headers for client-side handling
          res.setHeader('X-Usage-Warnings', JSON.stringify(warnings.length));
          res.setHeader('X-Critical-Warnings', JSON.stringify(warnings.filter(w => w.severity === 'critical').length));
        }
      }
    } catch (error) {
      console.error('Error checking usage warnings:', error);
    }
    
    next();
  };
}

/**
 * Express middleware to add usage information to all responses
 */
export function addUsageHeaders() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.organizationId) {
        const metrics = await usageTrackingService.getUsageMetrics(req.user.organizationId);
        
        // Add usage information to response headers
        res.setHeader('X-Projects-Usage', `${metrics.projects.current}/${metrics.projects.limit === -1 ? '∞' : metrics.projects.limit}`);
        res.setHeader('X-Team-Members-Usage', `${metrics.teamMembers.current}/${metrics.teamMembers.limit === -1 ? '∞' : metrics.teamMembers.limit}`);
        res.setHeader('X-Installations-Usage', `${metrics.installations.current}/${metrics.installations.limit === -1 ? '∞' : metrics.installations.limit}`);
        
        // Add subscription plan information
        const subscription = await stripeService.getSubscription(req.user.organizationId);
        if (subscription) {
          res.setHeader('X-Subscription-Plan', subscription.planId);
          res.setHeader('X-Subscription-Status', subscription.status);
        }
      }
    } catch (error) {
      console.error('Error adding usage headers:', error);
    }
    
    next();
  };
}

/**
 * Utility function to check if organization can perform an action
 */
export async function canPerformAction(
  organizationId: string,
  resource: keyof SubscriptionLimits,
  count: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  upgradeRequired?: boolean;
}> {
  try {
    const result = await usageTrackingService.canPerformAction(organizationId, resource, count);
    
    return {
      allowed: result.allowed,
      reason: result.reason,
      currentUsage: result.currentUsage,
      limit: result.limit,
      upgradeRequired: !result.allowed
    };
  } catch (error) {
    console.error('Error checking action permission:', error);
    return { allowed: true }; // Fail open
  }
}

/**
 * Utility function to check feature availability
 */
export async function isFeatureAvailable(
  organizationId: string,
  feature: keyof SubscriptionFeatures
): Promise<{
  available: boolean;
  reason?: string;
  planRequired?: SubscriptionPlan;
}> {
  try {
    return await usageTrackingService.isFeatureAvailable(organizationId, feature);
  } catch (error) {
    console.error('Error checking feature availability:', error);
    return { available: true }; // Fail open
  }
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      usageInfo?: {
        resource: keyof SubscriptionLimits;
        currentUsage: number;
        limit: number;
        actionCount: number;
      };
      usageWarnings?: Array<{
        type: string;
        resource: string;
        currentUsage: number;
        limit: number;
        percentage: number;
        severity: 'info' | 'warning' | 'critical';
        message: string;
        actionRequired: boolean;
        suggestedAction: string;
      }>;
    }
  }
}