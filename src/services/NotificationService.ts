// Think Tank Technologies Installation Scheduler - Notification Service
// Comprehensive notification service with Supabase integration and real-time delivery

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getWebSocketManager, RealtimeEvents } from './WebSocketManager';
import { getNotificationManager } from './NotificationManager';
import type { 
  User, 
  Installation, 
  Assignment, 
  TeamMember,
  Priority,
  NotificationSettings
} from '../types';

// Notification system types
export interface NotificationData {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  channels: NotificationChannel[];
  sent_at: string;
  read_at?: string;
  dismissed_at?: string;
  archived_at?: string;
  scheduled_for?: string;
  expires_at?: string;
  thread_id?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  email_enabled: boolean;
  email_frequency: NotificationFrequency;
  sms_enabled: boolean;
  sms_phone?: string;
  push_enabled: boolean;
  in_app_enabled: boolean;
  type_preferences: Record<string, any>;
  priority_settings: Record<string, any>;
  digest_enabled: boolean;
  digest_frequency: NotificationFrequency;
  digest_time: string;
  digest_include_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title_template: string;
  message_template: string;
  default_priority: NotificationPriority;
  default_channels: NotificationChannel[];
  variables: any[];
  validation_rules: Record<string, any>;
  icon?: string;
  color?: string;
  sound?: string;
  actions_template: any[];
  is_active: boolean;
  expires_after_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  attempt_count: number;
  max_attempts: number;
  sent_at?: string;
  delivered_at?: string;
  failed_at?: string;
  error_message?: string;
  external_id?: string;
  external_status?: string;
  retry_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationThread {
  id: string;
  title: string;
  description?: string;
  entity_type?: string;
  entity_id?: string;
  is_active: boolean;
  auto_close_after_hours: number;
  participants: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  templateData?: Record<string, any>;
  overrides?: {
    title?: string;
    message?: string;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    relatedEntityType?: string;
    relatedEntityId?: string;
    data?: Record<string, any>;
    actions?: NotificationAction[];
    threadId?: string;
    scheduledFor?: Date;
    expiresAt?: Date;
  };
}

export interface BulkNotificationOptions {
  userIds: string[];
  type: NotificationType;
  templateData?: Record<string, any>;
  overrides?: CreateNotificationOptions['overrides'];
  filters?: {
    roles?: string[];
    regions?: string[];
    excludeUserIds?: string[];
  };
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'danger';
  requireConfirmation?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: Record<NotificationPriority, number>;
  byType: Record<NotificationType, number>;
  byStatus: Record<NotificationStatus, number>;
  last24Hours: number;
  thisWeek: number;
  avgReadTime: number; // in minutes
}

// Enums matching database types
export type NotificationType = 
  | 'installation_created'
  | 'installation_updated' 
  | 'installation_assigned'
  | 'installation_completed'
  | 'installation_cancelled'
  | 'assignment_created'
  | 'assignment_updated'
  | 'assignment_cancelled'
  | 'schedule_changed'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'team_status_changed'
  | 'performance_alert'
  | 'system_maintenance'
  | 'deadline_reminder'
  | 'urgent_update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'dismissed' | 'archived';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'monthly' | 'never';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

export class NotificationService {
  private supabase: SupabaseClient;
  private wsManager = getWebSocketManager();
  private notificationManager = getNotificationManager();
  private cache = new Map<string, any>();
  private subscriptions = new Set<string>();

  constructor(supabaseUrl?: string, supabaseAnonKey?: string) {
    this.supabase = createClient(
      supabaseUrl || import.meta.env.VITE_SUPABASE_URL!,
      supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.initializeRealtimeSubscriptions();
  }

  /**
   * Initialize real-time subscriptions for live notifications
   */
  private initializeRealtimeSubscriptions(): void {
    // Subscribe to notification changes
    this.supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        this.handleNotificationChange.bind(this)
      )
      .subscribe();

    // Subscribe to WebSocket events
    this.wsManager.subscribe('notifications', this.handleWebSocketNotification.bind(this));
  }

  /**
   * Handle notification changes from Supabase
   */
  private async handleNotificationChange(payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        await this.handleNewNotification(newRecord);
        break;
      case 'UPDATE':
        await this.handleNotificationUpdate(newRecord, oldRecord);
        break;
      case 'DELETE':
        await this.handleNotificationDelete(oldRecord);
        break;
    }
  }

  /**
   * Handle new notification from database
   */
  private async handleNewNotification(notification: NotificationData): Promise<void> {
    // Send to in-app notification manager
    if (notification.channels.includes('in_app')) {
      this.notificationManager.sendInAppNotification({
        type: this.mapPriorityToType(notification.priority),
        title: notification.title,
        message: notification.message,
        read: false,
        relatedEntityId: notification.related_entity_id,
        relatedEntityType: notification.related_entity_type as any,
        actions: notification.actions || [],
        data: notification.data,
        persistent: notification.priority === 'urgent',
        autoDismiss: notification.priority !== 'urgent',
        dismissTimeout: this.getDismissTimeout(notification.priority),
      });
    }

    // Emit WebSocket event
    this.wsManager.emit('notification:new', notification);

    // Clear relevant cache entries
    this.clearUserCache(notification.user_id);
  }

  /**
   * Handle WebSocket notification
   */
  private handleWebSocketNotification(data: any): void {
    // Process real-time notification from server
    if (data.type === 'notification_created') {
      this.handleNewNotification(data.notification);
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(options: CreateNotificationOptions): Promise<NotificationData> {
    const { data, error } = await this.supabase
      .rpc('create_notification_from_template', {
        template_type: options.type,
        target_user_id: options.userId,
        template_data: options.templateData || {},
        override_options: {
          ...options.overrides,
          scheduled_for: options.overrides?.scheduledFor?.toISOString(),
          expires_at: options.overrides?.expiresAt?.toISOString(),
        }
      });

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // Fetch the created notification
    const notification = await this.getNotification(data);
    if (!notification) {
      throw new Error('Failed to retrieve created notification');
    }

    return notification;
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(options: BulkNotificationOptions): Promise<NotificationData[]> {
    const notifications: NotificationData[] = [];
    const errors: string[] = [];

    for (const userId of options.userIds) {
      try {
        // Apply filters
        if (options.filters) {
          const userDetails = await this.getUserDetails(userId);
          if (!this.passesFilters(userDetails, options.filters)) {
            continue;
          }
        }

        const notification = await this.createNotification({
          userId,
          type: options.type,
          templateData: options.templateData,
          overrides: options.overrides,
        });

        notifications.push(notification);
      } catch (error) {
        errors.push(`Failed to create notification for user ${userId}: ${error}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Bulk notification errors:', errors);
    }

    return notifications;
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<NotificationData | null> {
    const cacheKey = `notification:${id}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * Get user notifications with pagination and filtering
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: NotificationStatus[];
      priority?: NotificationPriority[];
      type?: NotificationType[];
      includeExpired?: boolean;
      threadId?: string;
    } = {}
  ): Promise<{
    notifications: NotificationData[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const {
      limit = 50,
      offset = 0,
      status,
      priority,
      type,
      includeExpired = false,
      threadId,
    } = options;

    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    if (priority && priority.length > 0) {
      query = query.in('priority', priority);
    }

    if (type && type.length > 0) {
      query = query.in('type', type);
    }

    if (threadId) {
      query = query.eq('thread_id', threadId);
    }

    if (!includeExpired) {
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    return {
      notifications: data || [],
      totalCount,
      hasMore,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('mark_notification_read', {
        notification_id: notificationId,
        target_user_id: userId,
      });

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }

    // Clear cache
    this.clearUserCache(userId);
    this.cache.delete(`notification:${notificationId}`);

    // Emit event
    this.wsManager.emit('notification:read', { id: notificationId, userId });

    return data;
  }

  /**
   * Mark multiple notifications as read
   */
  async markAllAsRead(userId: string, filters?: {
    type?: NotificationType[];
    priority?: NotificationPriority[];
    threadId?: string;
  }): Promise<number> {
    let query = this.supabase
      .from('notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'unread');

    if (filters?.type && filters.type.length > 0) {
      query = query.in('type', filters.type);
    }

    if (filters?.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority);
    }

    if (filters?.threadId) {
      query = query.eq('thread_id', filters.threadId);
    }

    const { data, error } = await query.select('id');

    if (error) {
      throw new Error(`Failed to mark notifications as read: ${error.message}`);
    }

    const updatedCount = data?.length || 0;

    // Clear cache
    this.clearUserCache(userId);

    // Emit event
    this.wsManager.emit('notification:bulk_read', { 
      userId, 
      count: updatedCount,
      filters 
    });

    return updatedCount;
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ 
        status: 'dismissed', 
        dismissed_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error || !data) {
      return false;
    }

    // Clear cache
    this.clearUserCache(userId);
    this.cache.delete(`notification:${notificationId}`);

    // Emit event
    this.wsManager.emit('notification:dismissed', { id: notificationId, userId });

    return true;
  }

  /**
   * Delete notification (archive)
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ 
        status: 'archived', 
        archived_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error || !data) {
      return false;
    }

    // Clear cache
    this.clearUserCache(userId);
    this.cache.delete(`notification:${notificationId}`);

    // Emit event
    this.wsManager.emit('notification:deleted', { id: notificationId, userId });

    return true;
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cacheKey = `preferences:${userId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const { data, error } = await this.supabase
      .rpc('get_user_notification_preferences', { target_user_id: userId });

    if (error) {
      throw new Error(`Failed to fetch notification preferences: ${error.message}`);
    }

    this.cache.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
    return data;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const { data, error } = await this.supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }

    // Clear cache
    this.cache.delete(`preferences:${userId}`);

    return data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `unread_count:${userId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const { data, error } = await this.supabase
      .rpc('get_unread_notification_count', { target_user_id: userId });

    if (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }

    this.cache.set(cacheKey, data, 30 * 1000); // Cache for 30 seconds
    return data;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('type, priority, status, created_at, read_at')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (error) {
      throw new Error(`Failed to fetch notification stats: ${error.message}`);
    }

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const stats: NotificationStats = {
      total: data.length,
      unread: 0,
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      byType: {} as any,
      byStatus: { unread: 0, read: 0, dismissed: 0, archived: 0 },
      last24Hours: 0,
      thisWeek: 0,
      avgReadTime: 0,
    };

    let totalReadTime = 0;
    let readCount = 0;

    data.forEach(notification => {
      const createdAt = new Date(notification.created_at).getTime();
      
      // Count by status
      stats.byStatus[notification.status as NotificationStatus]++;
      
      // Count by priority
      stats.byPriority[notification.priority as NotificationPriority]++;
      
      // Count by type
      if (!stats.byType[notification.type as NotificationType]) {
        stats.byType[notification.type as NotificationType] = 0;
      }
      stats.byType[notification.type as NotificationType]++;
      
      // Time-based counts
      if (createdAt >= oneDayAgo) {
        stats.last24Hours++;
      }
      if (createdAt >= oneWeekAgo) {
        stats.thisWeek++;
      }
      
      // Calculate read time
      if (notification.read_at) {
        const readAt = new Date(notification.read_at).getTime();
        totalReadTime += (readAt - createdAt);
        readCount++;
      }
    });

    stats.unread = stats.byStatus.unread;
    stats.avgReadTime = readCount > 0 ? Math.round((totalReadTime / readCount) / (60 * 1000)) : 0;

    return stats;
  }

  /**
   * Create notification thread
   */
  async createNotificationThread(options: {
    title: string;
    description?: string;
    entityType?: string;
    entityId?: string;
    participants?: string[];
    autoCloseAfterHours?: number;
  }): Promise<NotificationThread> {
    const { data, error } = await this.supabase
      .from('notification_threads')
      .insert({
        title: options.title,
        description: options.description,
        entity_type: options.entityType,
        entity_id: options.entityId,
        participants: options.participants || [],
        auto_close_after_hours: options.autoCloseAfterHours || 24,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create notification thread: ${error.message}`);
    }

    return data;
  }

  /**
   * Helper methods
   */
  private mapPriorityToType(priority: NotificationPriority): 'info' | 'success' | 'warning' | 'error' {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  private getDismissTimeout(priority: NotificationPriority): number {
    switch (priority) {
      case 'urgent':
        return 0; // Don't auto-dismiss urgent notifications
      case 'high':
        return 10000; // 10 seconds
      case 'medium':
        return 5000; // 5 seconds
      case 'low':
        return 3000; // 3 seconds
      default:
        return 5000;
    }
  }

  private clearUserCache(userId: string): void {
    this.cache.delete(`preferences:${userId}`);
    this.cache.delete(`unread_count:${userId}`);
    
    // Clear notification cache entries for this user
    for (const [key] of this.cache) {
      if (key.startsWith(`user_notifications:${userId}`)) {
        this.cache.delete(key);
      }
    }
  }

  private async getUserDetails(userId: string): Promise<any> {
    // This would fetch user details including role, region, etc.
    const { data } = await this.supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('id', userId)
      .single();

    return data;
  }

  private passesFilters(userDetails: any, filters: BulkNotificationOptions['filters']): boolean {
    if (!userDetails) return false;
    
    if (filters?.excludeUserIds?.includes(userDetails.id)) {
      return false;
    }

    if (filters?.roles && !filters.roles.includes(userDetails.role)) {
      return false;
    }

    // Add more filter logic as needed
    return true;
  }

  private async handleNotificationUpdate(newRecord: NotificationData, oldRecord: NotificationData): Promise<void> {
    // Handle status changes
    if (newRecord.status !== oldRecord.status) {
      this.wsManager.emit('notification:status_changed', {
        id: newRecord.id,
        oldStatus: oldRecord.status,
        newStatus: newRecord.status,
        userId: newRecord.user_id,
      });
    }

    // Clear cache
    this.clearUserCache(newRecord.user_id);
  }

  private async handleNotificationDelete(oldRecord: NotificationData): Promise<void> {
    this.wsManager.emit('notification:deleted', {
      id: oldRecord.id,
      userId: oldRecord.user_id,
    });

    // Clear cache
    this.clearUserCache(oldRecord.user_id);
    this.cache.delete(`notification:${oldRecord.id}`);
  }

  /**
   * Predefined notification creation methods for common scenarios
   */

  async createInstallationAssignedNotification(
    userId: string,
    installation: Installation,
    assignment: Assignment
  ): Promise<NotificationData> {
    return this.createNotification({
      userId,
      type: 'installation_assigned',
      templateData: {
        customer_name: installation.customerName,
        scheduled_date: installation.scheduledDate,
        address: `${installation.address.street}, ${installation.address.city}`,
        installation_id: installation.id,
      },
      overrides: {
        relatedEntityType: 'installation',
        relatedEntityId: installation.id,
        priority: installation.priority as NotificationPriority,
        actions: [
          {
            id: 'view_details',
            label: 'View Details',
            action: 'navigate',
            parameters: { route: `/installations/${installation.id}` },
            style: 'primary',
          },
          {
            id: 'view_schedule',
            label: 'View Schedule',
            action: 'navigate',
            parameters: { route: '/schedules' },
            style: 'secondary',
          },
        ],
      },
    });
  }

  async createConflictDetectedNotification(
    userId: string,
    conflict: any,
    installation: Installation
  ): Promise<NotificationData> {
    return this.createNotification({
      userId,
      type: 'conflict_detected',
      templateData: {
        customer_name: installation.customerName,
        conflict_description: conflict.description,
        conflict_id: conflict.id,
      },
      overrides: {
        relatedEntityType: 'conflict',
        relatedEntityId: conflict.id,
        priority: 'urgent',
        actions: [
          {
            id: 'resolve_conflict',
            label: 'Resolve Conflict',
            action: 'navigate',
            parameters: { route: `/assignments/conflicts?conflict=${conflict.id}` },
            style: 'primary',
          },
        ],
      },
    });
  }

  async createScheduleChangedNotification(
    userId: string,
    changeDescription: string,
    affectedDate?: string
  ): Promise<NotificationData> {
    return this.createNotification({
      userId,
      type: 'schedule_changed',
      templateData: {
        change_description: changeDescription,
        date: affectedDate,
      },
      overrides: {
        relatedEntityType: 'schedule',
        actions: [
          {
            id: 'view_schedule',
            label: 'View Updated Schedule',
            action: 'navigate',
            parameters: { route: '/schedules' },
            style: 'primary',
          },
        ],
      },
    });
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

/**
 * Get notification service instance
 */
export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}

export default NotificationService;