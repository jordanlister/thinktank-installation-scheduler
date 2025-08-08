// Think Tank Technologies Installation Scheduler - Notification Bell Component
// Real notification bell with dropdown panel and glassmorphism styling

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, Trash2, Settings, Filter, MoreVertical } from 'lucide-react';
import { useNotificationService } from '../../hooks/useNotificationService';
import { useUser } from '../../stores/useAppStore';
import { formatDistanceToNow } from '../../utils';
import type { AppNotification, NotificationPriority } from '../../types';

interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  maxNotifications?: number;
}

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: AppNotification) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  showBadge = true,
  maxNotifications = 10,
}) => {
  const user = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
  } = useNotificationService(user?.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: AppNotification) => {
    // Mark as read if unread
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }

    // Handle notification actions
    if (notification.actions && notification.actions.length > 0) {
      const primaryAction = notification.actions.find(a => a.style === 'primary') || notification.actions[0];
      if (primaryAction.action === 'navigate' && primaryAction.parameters?.route) {
        window.location.href = primaryAction.parameters.route;
      }
    }

    setIsOpen(false);
  }, [markAsRead]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return notification.status === 'unread';
    }
    return true;
  }).slice(0, maxNotifications);

  // Get priority color
  const getPriorityColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-blue-400';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-blue-400';
    }
  };

  // Get priority dot
  const getPriorityDot = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-blue-400' : 'text-white/90'} transition-colors`} />
        
        {/* Notification Badge */}
        {showBadge && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-black/20 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-black/90 backdrop-filter backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Filter Toggle */}
              <button
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  filter === 'unread' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                }`}
                title={filter === 'all' ? 'Show unread only' : 'Show all'}
              >
                <Filter className="h-4 w-4" />
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="p-1.5 text-white/60 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}

              {/* Settings */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notification settings
                  window.location.href = '/settings/notifications';
                }}
                className="p-1.5 text-white/60 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Notification settings"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/60 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-white/60 mt-2">Loading notifications...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-center">
              <p className="text-red-400 text-sm">Failed to load notifications</p>
              <button
                onClick={() => fetchNotifications()}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Notifications List */}
          {!loading && !error && (
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                      onDismiss={dismissNotification}
                      onDelete={deleteNotification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Individual Notification Item Component
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDismiss,
  onDelete,
  onClick,
}) => {
  const [showActions, setShowActions] = useState(false);
  const isUnread = notification.status === 'unread';

  const getPriorityColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const getPriorityDot = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div 
      className={`relative p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
        isUnread ? 'bg-white/5' : 'bg-transparent'
      } hover:bg-white/5 transition-all duration-200 cursor-pointer group`}
      onClick={() => onClick?.(notification)}
    >
      {/* Unread Indicator */}
      {isUnread && (
        <div className={`absolute top-3 left-3 w-2 h-2 ${getPriorityDot(notification.priority)} rounded-full`}></div>
      )}

      <div className="flex items-start justify-between">
        <div className={`flex-1 ${isUnread ? 'ml-4' : ''}`}>
          {/* Title */}
          <h4 className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-white/80'} mb-1`}>
            {notification.title}
          </h4>

          {/* Message */}
          <p className={`text-sm ${isUnread ? 'text-white/80' : 'text-white/60'} mb-2 line-clamp-2`}>
            {notification.message}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">
              {formatDistanceToNow(new Date(notification.createdAt))} ago
            </span>

            {/* Priority Badge */}
            <span className={`px-2 py-0.5 text-xs rounded-full border ${
              notification.priority === 'urgent' 
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : notification.priority === 'high'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                : notification.priority === 'medium'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
            }`}>
              {notification.priority}
            </span>
          </div>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {notification.actions.slice(0, 2).map((action) => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle action
                    if (action.action === 'navigate' && action.parameters?.route) {
                      window.location.href = action.parameters.route;
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    action.style === 'primary'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                      : action.style === 'danger'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* More Actions Menu */}
        <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 text-white/40 hover:text-white/60 hover:bg-white/10 rounded transition-all"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showActions && (
            <div className="absolute right-2 top-8 bg-black/95 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 min-w-[120px]">
              {isUnread && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead(notification.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 first:rounded-t-lg flex items-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark as read</span>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Dismiss</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                  setShowActions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 last:rounded-b-lg flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;