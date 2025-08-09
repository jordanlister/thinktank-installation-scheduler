// Think Tank Technologies - Webhook Service
// Manages webhook subscriptions and delivery for external integrations

import { MultiTenantService, TenantContext } from './multiTenantService';
import { supabase } from './supabase';

export interface WebhookSubscription {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  createdBy: string;
  createdAt: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
}

export interface WebhookEvent {
  id: string;
  subscriptionId: string;
  eventType: string;
  data: any;
  timestamp: string;
  attempts: number;
  status: 'pending' | 'delivered' | 'failed' | 'cancelled';
  lastAttempt?: string;
  nextAttempt?: string;
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  responseTime: number;
}

export class WebhookService extends MultiTenantService {

  /**
   * Create a new webhook subscription
   */
  async createWebhook(webhookData: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
    headers?: Record<string, string>;
    maxRetries?: number;
  }): Promise<WebhookSubscription> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to create webhooks');
    }

    try {
      const subscriptionData = this.addOrganizationContext({
        name: webhookData.name,
        url: webhookData.url,
        events: webhookData.events,
        secret: webhookData.secret || this.generateWebhookSecret(),
        headers: webhookData.headers || {},
        is_active: true,
        retry_policy: {
          maxRetries: webhookData.maxRetries || 3,
          backoffMultiplier: 2,
          initialDelayMs: 1000
        },
        success_count: 0,
        failure_count: 0
      });

      const { data, error } = await this.getBaseQuery('webhook_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'webhook_created',
        `Created webhook subscription: ${webhookData.name}`,
        'webhook',
        data.id,
        { url: webhookData.url, events: webhookData.events }
      );

      return this.transformWebhookData(data);
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  /**
   * Get all webhook subscriptions for the organization
   */
  async getWebhooks(): Promise<WebhookSubscription[]> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to view webhooks');
    }

    try {
      const { data, error } = await this.getBaseQuery('webhook_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.transformWebhookData);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }
  }

  /**
   * Update webhook subscription
   */
  async updateWebhook(webhookId: string, updates: {
    name?: string;
    url?: string;
    events?: string[];
    isActive?: boolean;
    headers?: Record<string, string>;
    maxRetries?: number;
  }): Promise<WebhookSubscription> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to update webhooks');
    }

    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.url) updateData.url = updates.url;
      if (updates.events) updateData.events = updates.events;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.headers) updateData.headers = updates.headers;
      if (updates.maxRetries) {
        updateData.retry_policy = {
          maxRetries: updates.maxRetries,
          backoffMultiplier: 2,
          initialDelayMs: 1000
        };
      }

      const { data, error } = await this.getBaseQuery('webhook_subscriptions')
        .update(updateData)
        .eq('id', webhookId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'webhook_updated',
        `Updated webhook subscription: ${data.name}`,
        'webhook',
        webhookId,
        { updates: Object.keys(updateData) }
      );

      return this.transformWebhookData(data);
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook subscription
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to delete webhooks');
    }

    try {
      // Get webhook name for logging
      const { data: webhookData } = await this.getBaseQuery('webhook_subscriptions')
        .select('name')
        .eq('id', webhookId)
        .single();

      // Delete the webhook
      const { error } = await this.getBaseQuery('webhook_subscriptions')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'webhook_deleted',
        `Deleted webhook subscription: ${webhookData?.name || webhookId}`,
        'webhook',
        webhookId
      );
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  /**
   * Trigger webhook for specific event
   */
  static async triggerWebhooks(
    organizationId: string,
    eventType: string,
    eventData: any,
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    try {
      // Get active webhooks for this organization and event type
      const { data: subscriptions, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .contains('events', [eventType]);

      if (error) throw error;

      if (!subscriptions || subscriptions.length === 0) {
        return; // No webhooks to trigger
      }

      // Create webhook events for each subscription
      const webhookEvents = subscriptions.map(subscription => ({
        subscription_id: subscription.id,
        organization_id: organizationId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        data: eventData,
        status: 'pending',
        attempts: 0,
        scheduled_for: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('webhook_events')
        .insert(webhookEvents);

      if (insertError) throw insertError;

      // Process webhook events (in a real implementation, this would be handled by a background job)
      await Promise.all(subscriptions.map(subscription => 
        this.processWebhookEvent(subscription.id, eventType, eventData)
      ));

    } catch (error) {
      console.error('Error triggering webhooks:', error);
      // Don't throw - webhook failures should not block main operations
    }
  }

  /**
   * Process a single webhook event
   */
  private static async processWebhookEvent(
    subscriptionId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      // Get subscription details
      const { data: subscription, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error || !subscription) {
        console.error('Webhook subscription not found:', subscriptionId);
        return;
      }

      // Prepare webhook payload
      const payload = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        object: 'event',
        type: eventType,
        created: Math.floor(Date.now() / 1000),
        data: {
          object: eventData
        },
        organization_id: subscription.organization_id
      };

      // Create signature
      const signature = this.createWebhookSignature(
        JSON.stringify(payload),
        subscription.secret || ''
      );

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'ThinkTank-Webhooks/1.0',
        'X-ThinkTank-Event': eventType,
        'X-ThinkTank-Signature': signature,
        'X-ThinkTank-Delivery': `delivery_${Date.now()}`,
        ...(subscription.headers || {})
      };

      // Deliver webhook
      const result = await this.deliverWebhook(
        subscription.url,
        payload,
        headers,
        subscription.retry_policy || {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelayMs: 1000
        }
      );

      // Update subscription stats
      if (result.success) {
        await supabase
          .from('webhook_subscriptions')
          .update({
            success_count: supabase.raw('success_count + 1'),
            last_triggered: new Date().toISOString()
          })
          .eq('id', subscriptionId);
      } else {
        await supabase
          .from('webhook_subscriptions')
          .update({
            failure_count: supabase.raw('failure_count + 1')
          })
          .eq('id', subscriptionId);
      }

    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  private static async deliverWebhook(
    url: string,
    payload: any,
    headers: Record<string, string>,
    retryPolicy: { maxRetries: number; backoffMultiplier: number; initialDelayMs: number }
  ): Promise<WebhookDeliveryResult> {
    let lastError = '';
    const startTime = Date.now();

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          return {
            success: true,
            statusCode: response.status,
            responseTime
          };
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            break;
          }
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error';
      }

      // Wait before retry (exponential backoff)
      if (attempt < retryPolicy.maxRetries) {
        const delay = retryPolicy.initialDelayMs * Math.pow(retryPolicy.backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Create webhook signature for security
   */
  private static createWebhookSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhook events history
   */
  async getWebhookEvents(webhookId: string, limit = 50): Promise<WebhookEvent[]> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to view webhook events');
    }

    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('subscription_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(this.transformWebhookEventData);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      throw error;
    }
  }

  /**
   * Retry failed webhook event
   */
  async retryWebhookEvent(eventId: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to retry webhook events');
    }

    try {
      const { data: event, error } = await supabase
        .from('webhook_events')
        .select('*, webhook_subscriptions(*)')
        .eq('id', eventId)
        .single();

      if (error || !event) throw new Error('Webhook event not found');

      // Reset event status and process
      await supabase
        .from('webhook_events')
        .update({
          status: 'pending',
          scheduled_for: new Date().toISOString()
        })
        .eq('id', eventId);

      // Process the event
      await WebhookService.processWebhookEvent(
        event.subscription_id,
        event.event_type,
        event.data
      );

    } catch (error) {
      console.error('Error retrying webhook event:', error);
      throw error;
    }
  }

  /**
   * Get available webhook event types
   */
  getAvailableEventTypes(): Array<{ type: string; description: string; category: string }> {
    return [
      // Installation events
      { type: 'installation.created', description: 'New installation created', category: 'Installations' },
      { type: 'installation.updated', description: 'Installation details updated', category: 'Installations' },
      { type: 'installation.scheduled', description: 'Installation scheduled', category: 'Installations' },
      { type: 'installation.completed', description: 'Installation completed', category: 'Installations' },
      { type: 'installation.cancelled', description: 'Installation cancelled', category: 'Installations' },
      
      // Assignment events
      { type: 'assignment.created', description: 'New assignment created', category: 'Assignments' },
      { type: 'assignment.updated', description: 'Assignment updated', category: 'Assignments' },
      { type: 'assignment.accepted', description: 'Assignment accepted by team member', category: 'Assignments' },
      { type: 'assignment.declined', description: 'Assignment declined by team member', category: 'Assignments' },
      { type: 'assignment.completed', description: 'Assignment completed', category: 'Assignments' },
      
      // Team events
      { type: 'team_member.created', description: 'New team member added', category: 'Team' },
      { type: 'team_member.updated', description: 'Team member updated', category: 'Team' },
      { type: 'team_member.deactivated', description: 'Team member deactivated', category: 'Team' },
      
      // Schedule events
      { type: 'schedule.conflict_detected', description: 'Schedule conflict detected', category: 'Scheduling' },
      { type: 'schedule.optimized', description: 'Schedule optimized', category: 'Scheduling' },
      
      // Organization events
      { type: 'organization.updated', description: 'Organization settings updated', category: 'Organization' },
      { type: 'project.created', description: 'New project created', category: 'Organization' },
      { type: 'project.updated', description: 'Project updated', category: 'Organization' }
    ];
  }

  /**
   * Generate webhook secret
   */
  private generateWebhookSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Transform database data to WebhookSubscription type
   */
  private transformWebhookData(data: any): WebhookSubscription {
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      url: data.url,
      events: data.events || [],
      isActive: data.is_active,
      secret: data.secret,
      headers: data.headers || {},
      retryPolicy: data.retry_policy || {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000
      },
      createdBy: data.created_by,
      createdAt: data.created_at,
      lastTriggered: data.last_triggered,
      successCount: data.success_count || 0,
      failureCount: data.failure_count || 0
    };
  }

  /**
   * Transform database data to WebhookEvent type
   */
  private transformWebhookEventData(data: any): WebhookEvent {
    return {
      id: data.id,
      subscriptionId: data.subscription_id,
      eventType: data.event_type,
      data: data.data,
      timestamp: data.created_at,
      attempts: data.attempts || 0,
      status: data.status,
      lastAttempt: data.last_attempt,
      nextAttempt: data.next_attempt,
      response: data.response,
      error: data.error
    };
  }
}

export default WebhookService;