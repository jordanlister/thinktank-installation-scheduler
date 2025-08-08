// Think Tank Technologies Installation Scheduler - Notification Service Hook
// React hook for managing notifications with real-time updates

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getNotificationService } from '../services/NotificationService';
import { useRealtime } from '../contexts/RealtimeProvider';
import type { 
  AppNotification, 
  NotificationStats, 
  NotificationPreferences,
  AppNotificationType,
  NotificationStatus,
  NotificationPriority
} from '../types';

export interface UseNotificationServiceOptions {
  autoFetch?: boolean;
  pollInterval?: number;
  includeRead?: boolean;
  maxNotifications?: number;
}

export interface UseNotificationServiceReturn {
  // Data
  notifications: AppNotification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (filters?: { type?: AppNotificationType[]; priority?: NotificationPriority[] }) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Utilities
  getNotificationsByType: (type: AppNotificationType) => AppNotification[];
  getNotificationsByStatus: (status: NotificationStatus) => AppNotification[];
  getNotificationsByPriority: (priority: NotificationPriority) => AppNotification[];
  hasUnreadNotifications: boolean;
  hasUrgentNotifications: boolean;
}

export function useNotificationService(
  userId?: string,
  options: UseNotificationServiceOptions = {}
): UseNotificationServiceReturn {
  const {
    autoFetch = true,
    pollInterval = 30000, // 30 seconds
    includeRead = true,
    maxNotifications = 50,
  } = options;

  const notificationService = useMemo(() => getNotificationService(), []);
  const { isConnected } = useRealtime();

  // State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.getUserNotifications(userId, {
        limit: maxNotifications,
        includeExpired: false,
        status: includeRead ? undefined : ['unread'],
      });

      setNotifications(result.notifications as AppNotification[]);
      
      // Also update unread count
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, maxNotifications, includeRead, notificationService]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const notificationStats = await notificationService.getNotificationStats(userId);
      setStats(notificationStats);
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);
    }
  }, [userId, notificationService]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const userPreferences = await notificationService.getUserPreferences(userId);
      setPreferences(userPreferences as NotificationPreferences);
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
    }
  }, [userId, notificationService]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const success = await notificationService.markAsRead(id, userId);
      if (success) {
        // Optimistically update local state
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, status: 'read' as NotificationStatus, readAt: new Date().toISOString() } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [userId, notificationService]);

  // Mark all as read
  const markAllAsRead = useCallback(async (filters?: { 
    type?: AppNotificationType[]; 
    priority?: NotificationPriority[] 
  }) => {
    if (!userId) return;

    try {
      const updatedCount = await notificationService.markAllAsRead(userId, filters);
      
      if (updatedCount > 0) {
        // Update local state
        setNotifications(prev => prev.map(n => {
          const matchesFilter = !filters || 
            (!filters.type || filters.type.includes(n.type)) &&
            (!filters.priority || filters.priority.includes(n.priority));
          
          return matchesFilter && n.status === 'unread'
            ? { ...n, status: 'read' as NotificationStatus, readAt: new Date().toISOString() }
            : n;
        }));
        
        setUnreadCount(prev => Math.max(0, prev - updatedCount));
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [userId, notificationService]);

  // Dismiss notification
  const dismissNotification = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const success = await notificationService.dismissNotification(id, userId);
      if (success) {
        // Remove from local state or mark as dismissed
        setNotifications(prev => prev.map(n => 
          n.id === id 
            ? { ...n, status: 'dismissed' as NotificationStatus, dismissedAt: new Date().toISOString() }
            : n
        ));
        
        // Update unread count if it was unread
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === id);
          return notification?.status === 'unread' ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  }, [userId, notifications, notificationService]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const success = await notificationService.deleteNotification(id, userId);
      if (success) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        // Update unread count if it was unread
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === id);
          return notification?.status === 'unread' ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [userId, notifications, notificationService]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!userId) return;

    try {
      const updatedPreferences = await notificationService.updateUserPreferences(userId, newPreferences);
      setPreferences(updatedPreferences as NotificationPreferences);
    } catch (err) {
      console.error('Failed to update notification preferences:', err);
    }
  }, [userId, notificationService]);

  // Utility functions
  const getNotificationsByType = useCallback((type: AppNotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getNotificationsByStatus = useCallback((status: NotificationStatus) => {
    return notifications.filter(n => n.status === status);
  }, [notifications]);

  const getNotificationsByPriority = useCallback((priority: NotificationPriority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // Computed values
  const hasUnreadNotifications = useMemo(() => unreadCount > 0, [unreadCount]);
  
  const hasUrgentNotifications = useMemo(() => {
    return notifications.some(n => n.priority === 'urgent' && n.status === 'unread');
  }, [notifications]);

  // Real-time updates
  useEffect(() => {
    if (!isConnected || !userId) return;

    // Listen for new notifications
    const handleNewNotification = (notification: AppNotification) => {
      if (notification.userId === userId) {
        setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
        if (notification.status === 'unread') {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    // Listen for notification updates
    const handleNotificationUpdate = (data: { id: string; status: NotificationStatus; userId: string }) => {
      if (data.userId === userId) {
        setNotifications(prev => prev.map(n => 
          n.id === data.id ? { ...n, status: data.status } : n
        ));
        
        // Update unread count
        if (data.status === 'read' || data.status === 'dismissed' || data.status === 'archived') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    };

    // Listen for bulk updates
    const handleBulkRead = (data: { userId: string; count: number }) => {
      if (data.userId === userId) {
        setNotifications(prev => prev.map(n => 
          n.status === 'unread' ? { ...n, status: 'read' as NotificationStatus } : n
        ));
        setUnreadCount(0);
      }
    };

    // Note: These would be connected to your WebSocket service
    // For now, they're placeholder event names
    const unsubscribeNew = () => {}; // wsManager.subscribe('notification:new', handleNewNotification);
    const unsubscribeUpdate = () => {}; // wsManager.subscribe('notification:status_changed', handleNotificationUpdate);
    const unsubscribeBulk = () => {}; // wsManager.subscribe('notification:bulk_read', handleBulkRead);

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
      unsubscribeBulk();
    };
  }, [isConnected, userId, maxNotifications]);

  // Auto-fetch on mount and periodically
  useEffect(() => {
    if (autoFetch && userId) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [autoFetch, userId, fetchNotifications, fetchPreferences]);

  // Polling for updates
  useEffect(() => {
    if (!userId || !pollInterval) return;

    const interval = setInterval(() => {
      if (!document.hidden) { // Only poll when tab is visible
        fetchNotifications();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [userId, pollInterval, fetchNotifications]);

  // Refresh when coming back to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, fetchNotifications]);

  return {
    // Data
    notifications,
    unreadCount,
    stats,
    preferences,
    
    // State
    loading,
    error,
    
    // Actions
    fetchNotifications,
    fetchStats,
    fetchPreferences,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
    updatePreferences,
    
    // Utilities
    getNotificationsByType,
    getNotificationsByStatus,
    getNotificationsByPriority,
    hasUnreadNotifications,
    hasUrgentNotifications,
  };
}

export default useNotificationService;