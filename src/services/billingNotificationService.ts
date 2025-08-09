// Think Tank Technologies Installation Scheduler - Billing Notification Service
import { supabase } from './supabase';
import { NotificationService } from './NotificationService';
import { stripeService } from './stripeService';
import { usageTrackingService } from './usageTrackingService';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  UsageWarning,
  UsageWarningType,
  Subscription,
  Invoice,
  NotificationType,
  NotificationPriority
} from '../types';
import { SUBSCRIPTION_PLANS, formatPrice } from '../config/subscriptionPlans';

interface BillingNotificationContext {
  organizationId: string;
  userId?: string;
  subscription?: Subscription;
  usageMetrics?: any;
  invoice?: Invoice;
  metadata?: Record<string, any>;
}

interface NotificationTemplate {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  emailTemplate?: string;
  shouldEmail?: boolean;
  shouldPush?: boolean;
  expiresAt?: Date;
}

class BillingNotificationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Send usage limit warning notification
   */
  async sendUsageLimitWarning(
    organizationId: string,
    warning: UsageWarning
  ): Promise<void> {
    try {
      const template = this.getUsageLimitWarningTemplate(warning);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        metadata: {
          warningType: warning.type,
          resource: warning.resource,
          currentUsage: warning.currentUsage,
          limit: warning.limit,
          percentage: warning.percentage
        }
      });

      // Log the notification
      console.log(`Sent usage limit warning for ${warning.resource} in organization ${organizationId}`);
    } catch (error) {
      console.error('Error sending usage limit warning:', error);
      throw error;
    }
  }

  /**
   * Send trial expiration warning
   */
  async sendTrialExpirationWarning(
    organizationId: string,
    daysRemaining: number
  ): Promise<void> {
    try {
      const subscription = await stripeService.getSubscription(organizationId);
      
      if (!subscription?.trialEnd) {
        return;
      }

      const template = this.getTrialExpirationTemplate(daysRemaining);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        subscription,
        metadata: {
          daysRemaining,
          trialEnd: subscription.trialEnd
        }
      });

      console.log(`Sent trial expiration warning for organization ${organizationId}, ${daysRemaining} days remaining`);
    } catch (error) {
      console.error('Error sending trial expiration warning:', error);
      throw error;
    }
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotification(
    organizationId: string,
    invoice: Invoice,
    reason?: string
  ): Promise<void> {
    try {
      const subscription = await stripeService.getSubscription(organizationId);
      const template = this.getPaymentFailureTemplate(invoice, reason);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        subscription,
        invoice,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amountDue,
          dueDate: invoice.dueDate,
          failureReason: reason
        }
      });

      console.log(`Sent payment failure notification for organization ${organizationId}, invoice ${invoice.id}`);
    } catch (error) {
      console.error('Error sending payment failure notification:', error);
      throw error;
    }
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccessNotification(
    organizationId: string,
    invoice: Invoice
  ): Promise<void> {
    try {
      const subscription = await stripeService.getSubscription(organizationId);
      const template = this.getPaymentSuccessTemplate(invoice);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        subscription,
        invoice,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amountPaid
        }
      });

      console.log(`Sent payment success notification for organization ${organizationId}, invoice ${invoice.id}`);
    } catch (error) {
      console.error('Error sending payment success notification:', error);
      throw error;
    }
  }

  /**
   * Send subscription change notification
   */
  async sendSubscriptionChangeNotification(
    organizationId: string,
    oldPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    changeType: 'upgrade' | 'downgrade' | 'cancellation' | 'reactivation'
  ): Promise<void> {
    try {
      const subscription = await stripeService.getSubscription(organizationId);
      const template = this.getSubscriptionChangeTemplate(oldPlan, newPlan, changeType);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        subscription,
        metadata: {
          oldPlan,
          newPlan,
          changeType
        }
      });

      console.log(`Sent subscription change notification for organization ${organizationId}: ${oldPlan} → ${newPlan}`);
    } catch (error) {
      console.error('Error sending subscription change notification:', error);
      throw error;
    }
  }

  /**
   * Send upcoming invoice notification
   */
  async sendUpcomingInvoiceNotification(
    organizationId: string,
    upcomingInvoice: Invoice
  ): Promise<void> {
    try {
      const subscription = await stripeService.getSubscription(organizationId);
      const template = this.getUpcomingInvoiceTemplate(upcomingInvoice);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        subscription,
        invoice: upcomingInvoice,
        metadata: {
          amount: upcomingInvoice.amountDue,
          dueDate: upcomingInvoice.dueDate
        }
      });

      console.log(`Sent upcoming invoice notification for organization ${organizationId}`);
    } catch (error) {
      console.error('Error sending upcoming invoice notification:', error);
      throw error;
    }
  }

  /**
   * Send feature limit reached notification
   */
  async sendFeatureLimitReachedNotification(
    organizationId: string,
    feature: string,
    requiredPlan: SubscriptionPlan
  ): Promise<void> {
    try {
      const subscription = await stripeService.getSubscription(organizationId);
      const template = this.getFeatureLimitTemplate(feature, requiredPlan);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        subscription,
        metadata: {
          feature,
          requiredPlan
        }
      });

      console.log(`Sent feature limit notification for ${feature} in organization ${organizationId}`);
    } catch (error) {
      console.error('Error sending feature limit notification:', error);
      throw error;
    }
  }

  /**
   * Send billing summary notification (monthly)
   */
  async sendBillingSummaryNotification(organizationId: string): Promise<void> {
    try {
      const [subscription, usageMetrics, recentInvoices] = await Promise.all([
        stripeService.getSubscription(organizationId),
        usageTrackingService.getUsageMetrics(organizationId),
        stripeService.getInvoices(organizationId, 3)
      ]);

      const template = this.getBillingSummaryTemplate(usageMetrics, recentInvoices);
      
      await this.sendNotification(organizationId, template, {
        organizationId,
        subscription,
        usageMetrics,
        metadata: {
          invoiceCount: recentInvoices.length,
          totalSpent: recentInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
        }
      });

      console.log(`Sent billing summary notification for organization ${organizationId}`);
    } catch (error) {
      console.error('Error sending billing summary notification:', error);
      throw error;
    }
  }

  /**
   * Check and send automated billing notifications
   */
  async processAutomatedNotifications(): Promise<void> {
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
        try {
          await this.processSubscriptionNotifications(subscription);
        } catch (error) {
          console.error(`Error processing notifications for subscription ${subscription.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing automated billing notifications:', error);
      throw error;
    }
  }

  /**
   * Process notifications for a specific subscription
   */
  private async processSubscriptionNotifications(subscription: any): Promise<void> {
    const organizationId = subscription.organization_id;

    // Check for trial expiration
    if (subscription.status === 'trialing' && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send notifications at 7, 3, and 1 day before trial ends
      if ([7, 3, 1].includes(daysRemaining)) {
        await this.sendTrialExpirationWarning(organizationId, daysRemaining);
      }
    }

    // Check for usage warnings
    const warnings = await usageTrackingService.getUsageWarnings(organizationId);
    for (const warning of warnings) {
      if (warning.actionRequired) {
        await this.sendUsageLimitWarning(organizationId, warning);
      }
    }

    // Check for overdue invoices
    const invoices = await stripeService.getInvoices(organizationId, 10);
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'open' && 
      inv.dueDate && 
      new Date(inv.dueDate) < new Date()
    );

    for (const invoice of overdueInvoices) {
      await this.sendPaymentFailureNotification(organizationId, invoice, 'Payment overdue');
    }
  }

  /**
   * Send notification using the notification service
   */
  private async sendNotification(
    organizationId: string,
    template: NotificationTemplate,
    context: BillingNotificationContext
  ): Promise<void> {
    try {
      // Get organization admin users
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .in('role', ['admin', 'owner']);

      if (error) {
        throw new Error(`Failed to get organization users: ${error.message}`);
      }

      // Send notification to each admin user
      for (const user of users || []) {
        await this.notificationService.createNotification({
          userId: user.id,
          organizationId,
          type: template.type,
          priority: template.priority,
          title: template.title,
          message: template.message,
          actionUrl: template.actionUrl,
          actionText: template.actionText,
          metadata: context.metadata,
          expiresAt: template.expiresAt
        });

        // Send email if required
        if (template.shouldEmail) {
          await this.sendEmailNotification(user, template, context);
        }

        // Send push notification if required
        if (template.shouldPush) {
          await this.sendPushNotification(user, template, context);
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    user: any,
    template: NotificationTemplate,
    context: BillingNotificationContext
  ): Promise<void> {
    // This would integrate with your email service
    // For now, we'll just log the email that would be sent
    console.log(`Email notification sent to ${user.email}:`, {
      subject: template.title,
      content: template.message,
      template: template.emailTemplate
    });
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    user: any,
    template: NotificationTemplate,
    context: BillingNotificationContext
  ): Promise<void> {
    // This would integrate with your push notification service
    // For now, we'll just log the push notification that would be sent
    console.log(`Push notification sent to user ${user.id}:`, {
      title: template.title,
      body: template.message
    });
  }

  // Template generators

  private getUsageLimitWarningTemplate(warning: UsageWarning): NotificationTemplate {
    let title: string;
    let message: string;
    let priority: NotificationPriority;
    
    if (warning.severity === 'critical') {
      priority = NotificationPriority.HIGH;
      title = `${warning.resource} Limit Reached`;
      message = `You've reached your ${warning.resource} limit (${warning.currentUsage}/${warning.limit}). ${warning.suggestedAction}`;
    } else {
      priority = NotificationPriority.MEDIUM;
      title = `Approaching ${warning.resource} Limit`;
      message = `You're using ${Math.round(warning.percentage)}% of your ${warning.resource} limit (${warning.currentUsage}/${warning.limit}). Consider upgrading your plan.`;
    }

    return {
      type: NotificationType.BILLING,
      priority,
      title,
      message,
      actionUrl: '/settings/billing',
      actionText: 'Upgrade Plan',
      shouldEmail: warning.severity === 'critical',
      shouldPush: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  private getTrialExpirationTemplate(daysRemaining: number): NotificationTemplate {
    const urgency = daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`;
    
    return {
      type: NotificationType.BILLING,
      priority: daysRemaining <= 1 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      title: `Trial Ending ${daysRemaining === 1 ? 'Tomorrow' : `in ${daysRemaining} Days`}`,
      message: `Your free trial ends ${urgency}. Upgrade now to continue using all features.`,
      actionUrl: '/settings/billing',
      actionText: 'Upgrade Now',
      shouldEmail: true,
      shouldPush: true,
      emailTemplate: 'trial_expiration'
    };
  }

  private getPaymentFailureTemplate(invoice: Invoice, reason?: string): NotificationTemplate {
    return {
      type: NotificationType.BILLING,
      priority: NotificationPriority.HIGH,
      title: 'Payment Failed',
      message: `Payment of ${formatPrice(invoice.amountDue)} failed${reason ? ` (${reason})` : ''}. Please update your payment method to avoid service interruption.`,
      actionUrl: '/settings/billing',
      actionText: 'Update Payment Method',
      shouldEmail: true,
      shouldPush: true,
      emailTemplate: 'payment_failure'
    };
  }

  private getPaymentSuccessTemplate(invoice: Invoice): NotificationTemplate {
    return {
      type: NotificationType.BILLING,
      priority: NotificationPriority.LOW,
      title: 'Payment Successful',
      message: `Payment of ${formatPrice(invoice.amountPaid)} was processed successfully. Thank you!`,
      actionUrl: '/settings/billing',
      actionText: 'View Invoice',
      shouldEmail: true,
      shouldPush: false,
      emailTemplate: 'payment_success'
    };
  }

  private getSubscriptionChangeTemplate(
    oldPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    changeType: 'upgrade' | 'downgrade' | 'cancellation' | 'reactivation'
  ): NotificationTemplate {
    const oldPlanName = SUBSCRIPTION_PLANS[oldPlan].name;
    const newPlanName = SUBSCRIPTION_PLANS[newPlan].name;
    
    let title: string;
    let message: string;
    let priority: NotificationPriority;
    
    switch (changeType) {
      case 'upgrade':
        title = 'Subscription Upgraded';
        message = `Your subscription has been upgraded from ${oldPlanName} to ${newPlanName}. Enjoy your new features!`;
        priority = NotificationPriority.MEDIUM;
        break;
      case 'downgrade':
        title = 'Subscription Downgraded';
        message = `Your subscription has been changed from ${oldPlanName} to ${newPlanName}. Some features may no longer be available.`;
        priority = NotificationPriority.MEDIUM;
        break;
      case 'cancellation':
        title = 'Subscription Cancelled';
        message = `Your ${oldPlanName} subscription has been cancelled. You can reactivate at any time.`;
        priority = NotificationPriority.HIGH;
        break;
      case 'reactivation':
        title = 'Subscription Reactivated';
        message = `Your ${newPlanName} subscription has been reactivated. Welcome back!`;
        priority = NotificationPriority.MEDIUM;
        break;
    }

    return {
      type: NotificationType.BILLING,
      priority,
      title,
      message,
      actionUrl: '/settings/billing',
      actionText: 'View Subscription',
      shouldEmail: true,
      shouldPush: true,
      emailTemplate: 'subscription_change'
    };
  }

  private getUpcomingInvoiceTemplate(invoice: Invoice): NotificationTemplate {
    const dueDate = new Date(invoice.dueDate || Date.now()).toLocaleDateString();
    
    return {
      type: NotificationType.BILLING,
      priority: NotificationPriority.LOW,
      title: 'Upcoming Payment',
      message: `Your next payment of ${formatPrice(invoice.amountDue)} is due on ${dueDate}.`,
      actionUrl: '/settings/billing',
      actionText: 'View Details',
      shouldEmail: true,
      shouldPush: false,
      emailTemplate: 'upcoming_invoice'
    };
  }

  private getFeatureLimitTemplate(feature: string, requiredPlan: SubscriptionPlan): NotificationTemplate {
    const planName = SUBSCRIPTION_PLANS[requiredPlan].name;
    
    return {
      type: NotificationType.BILLING,
      priority: NotificationPriority.MEDIUM,
      title: 'Feature Not Available',
      message: `The ${feature} feature requires a ${planName} plan. Upgrade to unlock this feature.`,
      actionUrl: '/settings/billing',
      actionText: 'Upgrade Plan',
      shouldEmail: false,
      shouldPush: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  private getBillingSummaryTemplate(usageMetrics: any, invoices: Invoice[]): NotificationTemplate {
    const totalSpent = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    
    return {
      type: NotificationType.BILLING,
      priority: NotificationPriority.LOW,
      title: 'Monthly Billing Summary',
      message: `This month: ${usageMetrics?.projects.current || 0} projects, ${usageMetrics?.installations.current || 0} installations. Total spent: ${formatPrice(totalSpent)}.`,
      actionUrl: '/settings/billing/analytics',
      actionText: 'View Analytics',
      shouldEmail: true,
      shouldPush: false,
      emailTemplate: 'billing_summary'
    };
  }
}

// Export singleton instance
export const billingNotificationService = new BillingNotificationService();