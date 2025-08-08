// Think Tank Technologies Installation Scheduler - Notification Manager
// Push notifications and alerts with browser notification API integration

import { RealtimeNotification } from '../contexts/RealtimeProvider';
import { NotificationSettings, Priority, UserRole } from '../types';

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  canRequest: boolean;
}

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  showOnScreen: boolean;
  persistOnScreen: boolean;
  categories: {
    [key: string]: boolean;
  };
  priority: {
    [key in Priority]: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'all' | 'important' | 'critical';
}

export interface InAppNotification extends RealtimeNotification {
  persistent?: boolean;
  autoDismiss?: boolean;
  dismissTimeout?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  sound?: string;
  vibration?: number[];
}

export interface NotificationTemplate {
  id: string;
  type: string;
  title: string;
  body: string;
  category: string;
  priority: Priority;
  icon?: string;
  sound?: string;
  variables: string[];
  userRoles: UserRole[];
  channels: NotificationChannel[];
}

export type NotificationChannel = 'push' | 'in-app' | 'email' | 'sms';

export interface NotificationQueue {
  id: string;
  notification: NotificationConfig;
  scheduledAt: Date;
  retryCount: number;
  maxRetries: number;
  channel: NotificationChannel;
  userId?: string;
  priority: Priority;
}

export interface NotificationMetrics {
  sent: number;
  delivered: number;
  clicked: number;
  dismissed: number;
  failed: number;
  byChannel: { [key in NotificationChannel]: number };
  byCategory: { [key: string]: number };
  averageEngagement: number;
}

export class NotificationManager {
  private settings: NotificationSettings;
  private templates: Map<string, NotificationTemplate> = new Map();
  private queue: NotificationQueue[] = [];
  private activeNotifications: Map<string, Notification> = new Map();
  private inAppNotifications: InAppNotification[] = [];
  private metrics: NotificationMetrics = {
    sent: 0,
    delivered: 0,
    clicked: 0,
    dismissed: 0,
    failed: 0,
    byChannel: {
      'push': 0,
      'in-app': 0,
      'email': 0,
      'sms': 0,
    },
    byCategory: {},
    averageEngagement: 0,
  };
  
  private listeners: Set<(notification: InAppNotification) => void> = new Set();
  private permissionListeners: Set<(permission: NotificationPermissionState) => void> = new Set();
  
  constructor(initialSettings?: Partial<NotificationSettings>) {
    this.settings = {
      enabled: true,
      sound: true,
      vibrate: true,
      showOnScreen: true,
      persistOnScreen: false,
      categories: {
        'assignment': true,
        'schedule': true,
        'conflict': true,
        'team': true,
        'system': true,
      },
      priority: {
        low: false,
        medium: true,
        high: true,
        urgent: true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
      frequency: 'important',
      ...initialSettings,
    };

    this.initializeDefaultTemplates();
    this.startQueueProcessor();
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Handle notification clicks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }
  }

  /**
   * Initialize default notification templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'assignment-created',
        type: 'assignment',
        title: 'New Assignment',
        body: 'You have been assigned to installation {{customerName}} at {{address}}',
        category: 'assignment',
        priority: 'medium',
        icon: '/icons/assignment.png',
        sound: 'assignment.mp3',
        variables: ['customerName', 'address', 'scheduledDate'],
        userRoles: ['lead', 'assistant'],
        channels: ['push', 'in-app'],
      },
      {
        id: 'conflict-detected',
        type: 'conflict',
        title: 'Schedule Conflict Detected',
        body: 'A conflict has been detected with your assignment for {{customerName}}',
        category: 'conflict',
        priority: 'high',
        icon: '/icons/conflict.png',
        sound: 'alert.mp3',
        variables: ['customerName', 'conflictType'],
        userRoles: ['lead', 'assistant', 'scheduler'],
        channels: ['push', 'in-app', 'email'],
      },
      {
        id: 'schedule-update',
        type: 'schedule',
        title: 'Schedule Updated',
        body: 'Your schedule has been updated. {{changeCount}} changes made.',
        category: 'schedule',
        priority: 'medium',
        icon: '/icons/schedule.png',
        variables: ['changeCount', 'date'],
        userRoles: ['lead', 'assistant'],
        channels: ['push', 'in-app'],
      },
      {
        id: 'urgent-assignment',
        type: 'assignment',
        title: 'Urgent Assignment',
        body: 'URGENT: You have been assigned to {{customerName}} - requires immediate attention',
        category: 'assignment',
        priority: 'urgent',
        icon: '/icons/urgent.png',
        sound: 'urgent.mp3',
        variables: ['customerName', 'reason'],
        userRoles: ['lead', 'assistant'],
        channels: ['push', 'in-app', 'sms'],
      },
      {
        id: 'team-update',
        type: 'team',
        title: 'Team Update',
        body: '{{teamMemberName}} status changed to {{status}}',
        category: 'team',
        priority: 'low',
        icon: '/icons/team.png',
        variables: ['teamMemberName', 'status'],
        userRoles: ['scheduler', 'lead'],
        channels: ['in-app'],
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get current notification permission state
   */
  public getPermissionState(): NotificationPermissionState {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    const canRequest = supported && permission === 'default';

    return {
      permission,
      supported,
      canRequest,
    };
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) {
      return this.getPermissionState();
    }

    try {
      const permission = await Notification.requestPermission();
      const state = this.getPermissionState();
      
      // Notify permission listeners
      this.permissionListeners.forEach(listener => listener(state));
      
      return state;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return this.getPermissionState();
    }
  }

  /**
   * Update notification settings
   */
  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };

    // Persist settings to localStorage
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to persist notification settings:', error);
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Add notification template
   */
  public addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get notification template
   */
  public getTemplate(id: string): NotificationTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Send notification using template
   */
  public async sendNotificationFromTemplate(
    templateId: string,
    variables: { [key: string]: any } = {},
    options: {
      userId?: string;
      channels?: NotificationChannel[];
      override?: Partial<NotificationConfig>;
    } = {}
  ): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Notification template not found: ${templateId}`);
    }

    // Replace variables in template
    const title = this.replaceVariables(template.title, variables);
    const body = this.replaceVariables(template.body, variables);

    const config: NotificationConfig = {
      title,
      body,
      icon: template.icon,
      tag: `${template.type}-${Date.now()}`,
      data: {
        templateId,
        variables,
        category: template.category,
        priority: template.priority,
        timestamp: Date.now(),
      },
      ...options.override,
    };

    const channels = options.channels || template.channels;
    
    // Send to each channel
    for (const channel of channels) {
      await this.sendNotification(config, channel, options.userId, template.priority);
    }
  }

  /**
   * Send notification to specific channel
   */
  public async sendNotification(
    config: NotificationConfig,
    channel: NotificationChannel = 'push',
    userId?: string,
    priority: Priority = 'medium'
  ): Promise<void> {
    // Check if notifications are enabled and should be sent
    if (!this.shouldSendNotification(config, priority)) {
      return;
    }

    const queueItem: NotificationQueue = {
      id: `${Date.now()}-${Math.random()}`,
      notification: config,
      scheduledAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      channel,
      userId,
      priority,
    };

    this.queue.push(queueItem);
    this.processQueue();
  }

  /**
   * Send in-app notification
   */
  public sendInAppNotification(notification: Omit<InAppNotification, 'id' | 'timestamp'>): void {
    const inAppNotification: InAppNotification = {
      id: `in-app-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      persistent: false,
      autoDismiss: true,
      dismissTimeout: 5000,
      position: 'top-right',
      ...notification,
    };

    this.inAppNotifications.unshift(inAppNotification);
    
    // Limit to last 50 notifications
    if (this.inAppNotifications.length > 50) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 50);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(inAppNotification));

    // Auto-dismiss if configured
    if (inAppNotification.autoDismiss && inAppNotification.dismissTimeout) {
      setTimeout(() => {
        this.dismissInAppNotification(inAppNotification.id);
      }, inAppNotification.dismissTimeout);
    }

    // Play sound if enabled
    if (this.settings.sound && inAppNotification.sound) {
      this.playNotificationSound(inAppNotification.sound);
    }

    // Vibrate if enabled
    if (this.settings.vibrate && inAppNotification.vibration && 'vibrate' in navigator) {
      navigator.vibrate(inAppNotification.vibration);
    }

    this.updateMetrics('in-app', 'sent');
  }

  /**
   * Dismiss in-app notification
   */
  public dismissInAppNotification(id: string): void {
    const index = this.inAppNotifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.inAppNotifications.splice(index, 1);
      this.updateMetrics('in-app', 'dismissed');
    }
  }

  /**
   * Get in-app notifications
   */
  public getInAppNotifications(): InAppNotification[] {
    return [...this.inAppNotifications];
  }

  /**
   * Clear all in-app notifications
   */
  public clearAllInAppNotifications(): void {
    this.inAppNotifications.length = 0;
  }

  /**
   * Add notification listener
   */
  public addListener(listener: (notification: InAppNotification) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Add permission change listener
   */
  public addPermissionListener(listener: (permission: NotificationPermissionState) => void): () => void {
    this.permissionListeners.add(listener);
    return () => this.permissionListeners.delete(listener);
  }

  /**
   * Get notification metrics
   */
  public getMetrics(): NotificationMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if notification should be sent based on settings
   */
  private shouldSendNotification(config: NotificationConfig, priority: Priority): boolean {
    if (!this.settings.enabled) {
      return false;
    }

    // Check priority settings
    if (!this.settings.priority[priority]) {
      return false;
    }

    // Check quiet hours
    if (this.settings.quietHours.enabled && this.isInQuietHours()) {
      return priority === 'urgent'; // Only urgent notifications during quiet hours
    }

    // Check frequency settings
    if (this.settings.frequency === 'critical' && priority !== 'urgent') {
      return false;
    }

    if (this.settings.frequency === 'important' && priority === 'low') {
      return false;
    }

    // Check category settings
    const category = config.data?.category;
    if (category && this.settings.categories[category] === false) {
      return false;
    }

    return true;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = this.settings.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= start && currentTime <= end;
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        await this.sendNotificationToChannel(item);
        this.updateMetrics(item.channel, 'sent');
      } catch (error) {
        console.error(`Failed to send notification to ${item.channel}:`, error);
        
        if (item.retryCount < item.maxRetries) {
          item.retryCount++;
          item.scheduledAt = new Date(Date.now() + 1000 * Math.pow(2, item.retryCount)); // Exponential backoff
          this.queue.push(item);
        } else {
          this.updateMetrics(item.channel, 'failed');
        }
      }
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotificationToChannel(item: NotificationQueue): Promise<void> {
    const { notification, channel } = item;

    switch (channel) {
      case 'push':
        await this.sendPushNotification(notification);
        break;
        
      case 'in-app':
        this.sendInAppNotification({
          type: notification.data?.priority || 'info',
          title: notification.title,
          message: notification.body,
          read: false,
          ...notification.data,
        });
        break;
        
      case 'email':
        // Email notifications would be handled by email service
        console.log('Email notification would be sent:', notification);
        break;
        
      case 'sms':
        // SMS notifications would be handled by SMS service
        console.log('SMS notification would be sent:', notification);
        break;
        
      default:
        throw new Error(`Unknown notification channel: ${channel}`);
    }
  }

  /**
   * Send push notification using browser API
   */
  private async sendPushNotification(config: NotificationConfig): Promise<void> {
    const permissionState = this.getPermissionState();
    
    if (!permissionState.supported || permissionState.permission !== 'granted') {
      throw new Error('Push notifications not supported or permission denied');
    }

    const notification = new Notification(config.title, {
      body: config.body,
      icon: config.icon || '/icons/notification-icon.png',
      badge: config.badge || '/icons/notification-badge.png',
      image: config.image,
      tag: config.tag,
      requireInteraction: config.requireInteraction || false,
      silent: config.silent || false,
      data: config.data,
      actions: config.actions,
      timestamp: config.timestamp || Date.now(),
    });

    // Handle notification events
    notification.onclick = (event) => {
      event.preventDefault();
      this.handleNotificationClick(notification);
      notification.close();
    };

    notification.onclose = () => {
      this.activeNotifications.delete(notification.tag || '');
      this.updateMetrics('push', 'dismissed');
    };

    notification.onerror = (error) => {
      console.error('Push notification error:', error);
      this.updateMetrics('push', 'failed');
    };

    notification.onshow = () => {
      this.updateMetrics('push', 'delivered');
    };

    // Store active notification
    if (notification.tag) {
      this.activeNotifications.set(notification.tag, notification);
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(notification: Notification): void {
    this.updateMetrics('push', 'clicked');
    
    // Focus window
    window.focus();
    
    // Handle custom actions based on notification data
    const data = notification.data;
    if (data && data.action) {
      this.handleNotificationAction(data.action, data);
    }
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(action: string, data: any): void {
    switch (action) {
      case 'view-assignment':
        if (data.assignmentId) {
          window.location.href = `/assignments/${data.assignmentId}`;
        }
        break;
        
      case 'view-schedule':
        window.location.href = '/schedules';
        break;
        
      case 'resolve-conflict':
        if (data.conflictId) {
          window.location.href = `/assignments/conflicts?conflict=${data.conflictId}`;
        }
        break;
        
      default:
        console.log('Unknown notification action:', action);
    }
  }

  /**
   * Replace variables in template string
   */
  private replaceVariables(template: string, variables: { [key: string]: any }): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(soundFile: string): void {
    try {
      const audio = new Audio(`/sounds/${soundFile}`);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.error('Failed to play notification sound:', error);
      });
    } catch (error) {
      console.error('Failed to create audio for notification sound:', error);
    }
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Mark notifications as delivered when user returns to tab
      this.activeNotifications.forEach(notification => {
        notification.close();
      });
      this.activeNotifications.clear();
    }
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    if (event.data && event.data.type === 'notification-click') {
      this.handleNotificationAction(event.data.action, event.data.data);
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(channel: NotificationChannel, type: keyof NotificationMetrics): void {
    if (typeof this.metrics[type] === 'number') {
      (this.metrics[type] as number)++;
    }
    
    this.metrics.byChannel[channel]++;
    
    // Update engagement rate
    if (this.metrics.sent > 0) {
      this.metrics.averageEngagement = (this.metrics.clicked + this.metrics.delivered) / this.metrics.sent;
    }
  }
}

// Singleton instance
let notificationManager: NotificationManager | null = null;

/**
 * Get notification manager instance
 */
export function getNotificationManager(settings?: Partial<NotificationSettings>): NotificationManager {
  if (!notificationManager) {
    // Load settings from localStorage if available
    let savedSettings: Partial<NotificationSettings> = {};
    try {
      const stored = localStorage.getItem('notification-settings');
      if (stored) {
        savedSettings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification settings from localStorage:', error);
    }

    notificationManager = new NotificationManager({
      ...savedSettings,
      ...settings,
    });
  }
  return notificationManager;
}

export default NotificationManager;