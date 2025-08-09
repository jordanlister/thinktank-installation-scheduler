// Think Tank Technologies Installation Scheduler - Subscription Lifecycle Automation Service
import { supabase } from './supabase';
import { stripeService } from './stripeService';
import { billingNotificationService } from './billingNotificationService';
import { usageTrackingService } from './usageTrackingService';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  Invoice,
  PaymentMethod
} from '../types';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

interface LifecycleTask {
  id: string;
  type: 'trial_expiring' | 'trial_expired' | 'payment_failed' | 'payment_overdue' | 'subscription_downgrade' | 'usage_limit_exceeded';
  organizationId: string;
  subscriptionId?: string;
  invoiceId?: string;
  scheduledFor: Date;
  attemptCount: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentRetryConfig {
  maxRetries: number;
  retryDelays: number[]; // in days
  gracePeriod: number; // days before downgrade
  downgradeAfterFailures: boolean;
}

class SubscriptionLifecycleService {
  private readonly DEFAULT_RETRY_CONFIG: PaymentRetryConfig = {
    maxRetries: 3,
    retryDelays: [3, 7, 14], // retry after 3, 7, and 14 days
    gracePeriod: 30,
    downgradeAfterFailures: true
  };

  /**
   * Process all pending lifecycle tasks
   */
  async processLifecycleTasks(): Promise<void> {
    try {
      console.log('Processing subscription lifecycle tasks...');

      // Get all pending tasks that are ready to be processed
      const { data: tasks, error } = await supabase
        .from('subscription_lifecycle_tasks')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch lifecycle tasks: ${error.message}`);
      }

      for (const task of tasks || []) {
        try {
          await this.processTask(task);
        } catch (error) {
          console.error(`Error processing lifecycle task ${task.id}:`, error);
          await this.markTaskFailed(task.id, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Schedule new tasks based on current subscriptions
      await this.scheduleNewTasks();
    } catch (error) {
      console.error('Error in lifecycle task processing:', error);
      throw error;
    }
  }

  /**
   * Process a single lifecycle task
   */
  private async processTask(task: any): Promise<void> {
    // Mark task as processing
    await this.updateTaskStatus(task.id, 'processing');

    try {
      switch (task.type) {
        case 'trial_expiring':
          await this.handleTrialExpiring(task);
          break;
        case 'trial_expired':
          await this.handleTrialExpired(task);
          break;
        case 'payment_failed':
          await this.handlePaymentFailed(task);
          break;
        case 'payment_overdue':
          await this.handlePaymentOverdue(task);
          break;
        case 'subscription_downgrade':
          await this.handleSubscriptionDowngrade(task);
          break;
        case 'usage_limit_exceeded':
          await this.handleUsageLimitExceeded(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      await this.markTaskCompleted(task.id);
    } catch (error) {
      await this.markTaskFailed(task.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Handle trial expiration warning
   */
  private async handleTrialExpiring(task: any): Promise<void> {
    const { organizationId, subscriptionId, metadata } = task;
    const daysRemaining = metadata?.daysRemaining || 0;

    // Send trial expiration notification
    await billingNotificationService.sendTrialExpirationWarning(organizationId, daysRemaining);

    console.log(`Sent trial expiring notification for organization ${organizationId}, ${daysRemaining} days remaining`);
  }

  /**
   * Handle trial expiration
   */
  private async handleTrialExpired(task: any): Promise<void> {
    const { organizationId, subscriptionId } = task;

    try {
      const subscription = await stripeService.getSubscription(organizationId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check if there's a valid payment method
      const paymentMethods = await stripeService.getPaymentMethods(organizationId);
      const hasPaymentMethod = paymentMethods.length > 0;

      if (hasPaymentMethod) {
        // Try to activate the subscription
        console.log(`Trial expired for organization ${organizationId}, attempting to activate subscription`);
      } else {
        // Downgrade to free plan
        await this.downgradeToFreePlan(organizationId, 'trial_expired');
        console.log(`Trial expired for organization ${organizationId}, downgraded to free plan`);
      }
    } catch (error) {
      console.error(`Error handling trial expiration for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailed(task: any): Promise<void> {
    const { organizationId, invoiceId, metadata } = task;
    const attemptNumber = task.attempt_count || 1;

    try {
      // Get the failed invoice
      const invoices = await stripeService.getInvoices(organizationId, 10);
      const failedInvoice = invoices.find(inv => inv.id === invoiceId);

      if (!failedInvoice) {
        throw new Error('Failed invoice not found');
      }

      // Send payment failure notification
      await billingNotificationService.sendPaymentFailureNotification(
        organizationId,
        failedInvoice,
        metadata?.failureReason
      );

      // Schedule retry if within limits
      const retryConfig = this.DEFAULT_RETRY_CONFIG;
      if (attemptNumber <= retryConfig.maxRetries) {
        const retryDelay = retryConfig.retryDelays[attemptNumber - 1] || 7;
        await this.schedulePaymentRetry(organizationId, invoiceId, attemptNumber + 1, retryDelay);
      } else {
        // Max retries reached, schedule downgrade
        if (retryConfig.downgradeAfterFailures) {
          await this.scheduleSubscriptionDowngrade(
            organizationId,
            'payment_failures',
            retryConfig.gracePeriod
          );
        }
      }

      console.log(`Processed payment failure for organization ${organizationId}, attempt ${attemptNumber}`);
    } catch (error) {
      console.error(`Error handling payment failure for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Handle overdue payment
   */
  private async handlePaymentOverdue(task: any): Promise<void> {
    const { organizationId, invoiceId, metadata } = task;

    try {
      // Get overdue invoices
      const invoices = await stripeService.getInvoices(organizationId, 10);
      const overdueInvoice = invoices.find(inv => 
        inv.id === invoiceId && 
        inv.status === 'open' && 
        new Date(inv.dueDate || '') < new Date()
      );

      if (!overdueInvoice) {
        console.log(`No overdue invoice found for organization ${organizationId}`);
        return;
      }

      // Send overdue payment notification
      await billingNotificationService.sendPaymentFailureNotification(
        organizationId,
        overdueInvoice,
        'Payment is overdue'
      );

      // Check how long it's been overdue
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(overdueInvoice.dueDate || '').getTime()) / (1000 * 60 * 60 * 24)
      );

      // If overdue for more than grace period, schedule downgrade
      if (daysOverdue >= this.DEFAULT_RETRY_CONFIG.gracePeriod) {
        await this.scheduleSubscriptionDowngrade(organizationId, 'payment_overdue', 0);
      }

      console.log(`Processed overdue payment for organization ${organizationId}, ${daysOverdue} days overdue`);
    } catch (error) {
      console.error(`Error handling overdue payment for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Handle subscription downgrade
   */
  private async handleSubscriptionDowngrade(task: any): Promise<void> {
    const { organizationId, metadata } = task;
    const reason = metadata?.reason || 'unknown';

    try {
      await this.downgradeToFreePlan(organizationId, reason);
      console.log(`Downgraded subscription for organization ${organizationId}, reason: ${reason}`);
    } catch (error) {
      console.error(`Error downgrading subscription for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Handle usage limit exceeded
   */
  private async handleUsageLimitExceeded(task: any): Promise<void> {
    const { organizationId, metadata } = task;
    const resource = metadata?.resource;
    const currentUsage = metadata?.currentUsage;
    const limit = metadata?.limit;

    try {
      // Send usage limit notification
      const warning = {
        type: 'limit_exceeded' as const,
        resource,
        currentUsage,
        limit,
        percentage: Math.round((currentUsage / limit) * 100),
        severity: 'critical' as const,
        message: `You have exceeded your ${resource} limit`,
        actionRequired: true,
        suggestedAction: 'Upgrade your plan to increase limits'
      };

      await billingNotificationService.sendUsageLimitWarning(organizationId, warning);

      console.log(`Processed usage limit exceeded for organization ${organizationId}, resource: ${resource}`);
    } catch (error) {
      console.error(`Error handling usage limit exceeded for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Downgrade organization to free plan
   */
  private async downgradeToFreePlan(organizationId: string, reason: string): Promise<void> {
    try {
      const currentSubscription = await stripeService.getSubscription(organizationId);
      
      if (currentSubscription && currentSubscription.planId !== SubscriptionPlan.FREE) {
        // Cancel current subscription
        await stripeService.cancelSubscription(organizationId, false);

        // Update to free plan in database
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_id: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
            billing_cycle: 'monthly',
            amount_cents: 0,
            updated_at: new Date().toISOString(),
            metadata: {
              ...currentSubscription.metadata,
              downgradedAt: new Date().toISOString(),
              downgradeReason: reason,
              previousPlan: currentSubscription.planId
            }
          })
          .eq('organization_id', organizationId);

        if (error) {
          throw new Error(`Failed to update subscription to free plan: ${error.message}`);
        }

        // Send notification
        await billingNotificationService.sendSubscriptionChangeNotification(
          organizationId,
          currentSubscription.planId,
          SubscriptionPlan.FREE,
          'downgrade'
        );

        console.log(`Successfully downgraded organization ${organizationId} to free plan, reason: ${reason}`);
      }
    } catch (error) {
      console.error(`Error downgrading to free plan for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule new lifecycle tasks based on current subscriptions
   */
  private async scheduleNewTasks(): Promise<void> {
    try {
      // Get all active subscriptions
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .in('status', ['active', 'trialing', 'past_due']);

      if (error) {
        throw new Error(`Failed to get subscriptions: ${error.message}`);
      }

      for (const subscription of subscriptions || []) {
        await this.scheduleTasksForSubscription(subscription);
      }

      // Schedule usage limit monitoring tasks
      await this.scheduleUsageMonitoringTasks();
    } catch (error) {
      console.error('Error scheduling new lifecycle tasks:', error);
      throw error;
    }
  }

  /**
   * Schedule tasks for a specific subscription
   */
  private async scheduleTasksForSubscription(subscription: any): Promise<void> {
    const organizationId = subscription.organization_id;

    try {
      // Schedule trial expiration tasks
      if (subscription.status === 'trialing' && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end);
        const now = new Date();

        // Schedule warning notifications
        const warningDays = [7, 3, 1];
        for (const days of warningDays) {
          const notificationDate = new Date(trialEnd.getTime() - days * 24 * 60 * 60 * 1000);
          
          if (notificationDate > now) {
            await this.scheduleTask({
              type: 'trial_expiring',
              organizationId,
              subscriptionId: subscription.id,
              scheduledFor: notificationDate,
              metadata: { daysRemaining: days }
            });
          }
        }

        // Schedule trial expiration task
        if (trialEnd > now) {
          await this.scheduleTask({
            type: 'trial_expired',
            organizationId,
            subscriptionId: subscription.id,
            scheduledFor: trialEnd,
            metadata: { trialEndDate: subscription.trial_end }
          });
        }
      }

      // Schedule payment monitoring for active subscriptions
      if (subscription.status === 'active' || subscription.status === 'past_due') {
        // Check for overdue invoices
        const invoices = await stripeService.getInvoices(organizationId, 5);
        const overdueInvoices = invoices.filter(inv => 
          inv.status === 'open' && 
          inv.dueDate && 
          new Date(inv.dueDate) < new Date()
        );

        for (const invoice of overdueInvoices) {
          await this.scheduleTask({
            type: 'payment_overdue',
            organizationId,
            subscriptionId: subscription.id,
            scheduledFor: new Date(), // Process immediately
            metadata: { 
              invoiceId: invoice.id,
              dueDate: invoice.dueDate,
              amount: invoice.amountDue
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error scheduling tasks for subscription ${subscription.id}:`, error);
    }
  }

  /**
   * Schedule usage monitoring tasks
   */
  private async scheduleUsageMonitoringTasks(): Promise<void> {
    try {
      // Get all organizations with active subscriptions
      const { data: organizations, error } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .in('status', ['active', 'trialing'])
        .neq('plan_id', SubscriptionPlan.FREE);

      if (error) {
        throw new Error(`Failed to get organizations: ${error.message}`);
      }

      for (const org of organizations || []) {
        const organizationId = org.organization_id;

        try {
          // Get current usage
          const usageMetrics = await usageTrackingService.getUsageMetrics(organizationId);
          
          // Check each resource for limit violations
          const resources = ['projects', 'teamMembers', 'installations'] as const;
          
          for (const resource of resources) {
            const usage = usageMetrics[resource];
            if (usage.limit !== -1 && usage.current >= usage.limit) {
              // Schedule immediate task for exceeded limit
              await this.scheduleTask({
                type: 'usage_limit_exceeded',
                organizationId,
                scheduledFor: new Date(),
                metadata: {
                  resource,
                  currentUsage: usage.current,
                  limit: usage.limit
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error checking usage for organization ${organizationId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error scheduling usage monitoring tasks:', error);
    }
  }

  /**
   * Schedule a payment retry
   */
  private async schedulePaymentRetry(
    organizationId: string,
    invoiceId: string,
    attemptNumber: number,
    delayDays: number
  ): Promise<void> {
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + delayDays);

    await this.scheduleTask({
      type: 'payment_failed',
      organizationId,
      scheduledFor,
      attemptCount: attemptNumber,
      metadata: {
        invoiceId,
        retryAttempt: attemptNumber,
        originalFailureDate: new Date().toISOString()
      }
    });
  }

  /**
   * Schedule a subscription downgrade
   */
  private async scheduleSubscriptionDowngrade(
    organizationId: string,
    reason: string,
    delayDays: number
  ): Promise<void> {
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + delayDays);

    await this.scheduleTask({
      type: 'subscription_downgrade',
      organizationId,
      scheduledFor,
      metadata: {
        reason,
        scheduledDowngradeDate: scheduledFor.toISOString()
      }
    });
  }

  /**
   * Schedule a lifecycle task
   */
  private async scheduleTask(taskData: {
    type: string;
    organizationId: string;
    subscriptionId?: string;
    scheduledFor: Date;
    attemptCount?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Check if similar task already exists
      const { data: existingTasks } = await supabase
        .from('subscription_lifecycle_tasks')
        .select('id')
        .eq('type', taskData.type)
        .eq('organization_id', taskData.organizationId)
        .eq('status', 'pending')
        .gte('scheduled_for', new Date().toISOString());

      // Skip if similar task already exists
      if (existingTasks && existingTasks.length > 0) {
        return;
      }

      // Create new task
      const task = {
        type: taskData.type,
        organization_id: taskData.organizationId,
        subscription_id: taskData.subscriptionId,
        scheduled_for: taskData.scheduledFor.toISOString(),
        attempt_count: taskData.attemptCount || 1,
        max_attempts: 3,
        status: 'pending',
        metadata: taskData.metadata || {}
      };

      const { error } = await supabase
        .from('subscription_lifecycle_tasks')
        .insert([task]);

      if (error) {
        throw new Error(`Failed to schedule task: ${error.message}`);
      }

      console.log(`Scheduled ${taskData.type} task for organization ${taskData.organizationId}`);
    } catch (error) {
      console.error('Error scheduling lifecycle task:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(taskId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('subscription_lifecycle_tasks')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  }

  /**
   * Mark task as completed
   */
  private async markTaskCompleted(taskId: string): Promise<void> {
    await this.updateTaskStatus(taskId, 'completed');
  }

  /**
   * Mark task as failed
   */
  private async markTaskFailed(taskId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('subscription_lifecycle_tasks')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Failed to mark task as failed:', error);
    }
  }

  /**
   * Get lifecycle task statistics
   */
  async getTaskStatistics(): Promise<{
    pending: number;
    completed: number;
    failed: number;
    processing: number;
    tasksByType: Record<string, number>;
  }> {
    try {
      const { data: tasks, error } = await supabase
        .from('subscription_lifecycle_tasks')
        .select('status, type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        throw new Error(`Failed to get task statistics: ${error.message}`);
      }

      const stats = {
        pending: 0,
        completed: 0,
        failed: 0,
        processing: 0,
        tasksByType: {} as Record<string, number>
      };

      for (const task of tasks || []) {
        stats[task.status as keyof typeof stats] = (stats[task.status as keyof typeof stats] as number) + 1;
        stats.tasksByType[task.type] = (stats.tasksByType[task.type] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Error getting task statistics:', error);
      throw error;
    }
  }

  /**
   * Manually trigger lifecycle processing (for testing/admin use)
   */
  async triggerManualProcessing(): Promise<void> {
    console.log('Manually triggering lifecycle processing...');
    await this.processLifecycleTasks();
  }

  /**
   * Clean up old completed tasks
   */
  async cleanupOldTasks(daysOld: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('subscription_lifecycle_tasks')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('updated_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to cleanup old tasks: ${error.message}`);
      }

      console.log(`Cleaned up lifecycle tasks older than ${daysOld} days`);
    } catch (error) {
      console.error('Error cleaning up old tasks:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const subscriptionLifecycleService = new SubscriptionLifecycleService();