// Think Tank Technologies Installation Scheduler - Real-time Indicators
// Live status indicators and updates for enhanced user experience

import React, { useState, useEffect, useMemo } from 'react';
import { 
  useRealtime, 
  useConnectionStatus, 
  useRealtimeNotifications,
  RealtimeNotification 
} from '../../contexts/RealtimeProvider';
import { getNotificationManager } from '../../services/NotificationManager';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Bell, 
  BellOff, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users,
  MapPin,
  Calendar,
  Zap,
  RefreshCw,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

// Connection Status Indicator
export function ConnectionStatusIndicator({ className = '' }: { className?: string }) {
  const { isConnected, isConnecting, connectionState } = useConnectionStatus();
  
  const getStatusColor = () => {
    if (isConnected) return 'text-green-500';
    if (isConnecting) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (isConnected) return <Wifi className="w-4 h-4" />;
    if (isConnecting) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusTooltip = () => {
    if (isConnected) {
      return `Connected since ${connectionState.lastConnected?.toLocaleString()}`;
    }
    if (isConnecting) {
      return `Connection attempt ${connectionState.reconnectAttempts}`;
    }
    return connectionState.error || 'No connection';
  };

  return (
    <div 
      className={`flex items-center space-x-2 ${getStatusColor()} ${className}`}
      title={getStatusTooltip()}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
    </div>
  );
}

// Live Activity Feed
export function LiveActivityFeed({ maxItems = 10, className = '' }: { maxItems?: number; className?: string }) {
  const notifications = useRealtimeNotifications();
  const [isVisible, setIsVisible] = useState(true);

  const recentActivity = useMemo(() => {
    return notifications
      .filter(n => n.type !== 'error') // Filter out error notifications
      .slice(0, maxItems)
      .map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.timestamp,
        read: notification.read,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
      }));
  }, [notifications, maxItems]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isVisible || recentActivity.length === 0) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`flex items-center space-x-2 text-gray-500 hover:text-gray-700 ${className}`}
        title="Show activity feed"
      >
        <EyeOff className="w-4 h-4" />
        <span className="text-sm">Show Activity</span>
      </button>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-900">Live Activity</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
          title="Hide activity feed"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {recentActivity.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
              !activity.read ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
            {!activity.read && (
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Live Stats Counter
export function LiveStatsCounter({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  className = '' 
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}) {
  const [previousValue, setPreviousValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== previousValue) {
      setIsAnimating(true);
      setPreviousValue(value);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '';
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg border shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold text-gray-900 mt-2 transition-all duration-500 ${
        isAnimating ? 'scale-110 text-blue-600' : ''
      }`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// Real-time Notification Bell
export function NotificationBell({ className = '' }: { className?: string }) {
  const notifications = useRealtimeNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const { clearNotification, markNotificationAsRead } = useRealtime();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification: RealtimeNotification) => {
    markNotificationAsRead(notification.id);
    
    // Handle notification-specific actions
    if (notification.relatedEntityId && notification.relatedEntityType) {
      const baseUrl = window.location.origin;
      let targetUrl = '';

      switch (notification.relatedEntityType) {
        case 'installation':
          targetUrl = `${baseUrl}/installations?id=${notification.relatedEntityId}`;
          break;
        case 'assignment':
          targetUrl = `${baseUrl}/assignments?id=${notification.relatedEntityId}`;
          break;
        case 'team_member':
          targetUrl = `${baseUrl}/team?member=${notification.relatedEntityId}`;
          break;
      }

      if (targetUrl) {
        window.location.href = targetUrl;
      }
    }

    setShowDropdown(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-notification-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className={`relative ${className}`} data-notification-dropdown>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        title={`${unreadCount} unread notifications`}
      >
        {unreadCount > 0 ? (
          <Bell className="w-6 h-6" />
        ) : (
          <BellOff className="w-6 h-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
          </div>
          
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 line-clamp-2 ${
                      !notification.read ? 'font-semibold' : ''
                    }`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-200">
              <button
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  window.location.href = '/notifications';
                  setShowDropdown(false);
                }}
              >
                View all notifications ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Live Update Badge
export function LiveUpdateBadge({ 
  lastUpdate, 
  className = '' 
}: { 
  lastUpdate?: string; 
  className?: string;
}) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimer = () => {
      const now = new Date();
      const updateTime = new Date(lastUpdate);
      const diff = now.getTime() - updateTime.getTime();

      if (diff < 5000) {
        setTimeSinceUpdate('Live');
      } else if (diff < 60000) {
        setTimeSinceUpdate(`${Math.floor(diff / 1000)}s ago`);
      } else if (diff < 3600000) {
        setTimeSinceUpdate(`${Math.floor(diff / 60000)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(diff / 3600000)}h ago`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (!lastUpdate || !timeSinceUpdate) return null;

  const isLive = timeSinceUpdate === 'Live';

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
      isLive 
        ? 'bg-green-100 text-green-700 border border-green-200' 
        : 'bg-gray-100 text-gray-600 border border-gray-200'
    } ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
      }`} />
      <span>{timeSinceUpdate}</span>
    </div>
  );
}

// Real-time Metrics Dashboard
export function RealtimeMetricsDashboard({ className = '' }: { className?: string }) {
  const { state } = useRealtime();
  
  const metrics = useMemo(() => {
    return {
      installations: state.installations.size,
      assignments: state.assignments.size,
      teamMembers: state.teamMembers.size,
      conflicts: state.conflicts.size,
      activeNotifications: state.notifications.filter(n => !n.read).length,
    };
  }, [state]);

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${className}`}>
      <LiveStatsCounter
        label="Installations"
        value={metrics.installations}
        icon={MapPin}
      />
      <LiveStatsCounter
        label="Assignments"
        value={metrics.assignments}
        icon={Calendar}
      />
      <LiveStatsCounter
        label="Team Members"
        value={metrics.teamMembers}
        icon={Users}
      />
      <LiveStatsCounter
        label="Conflicts"
        value={metrics.conflicts}
        icon={AlertCircle}
        trend={metrics.conflicts > 0 ? 'up' : 'stable'}
      />
      <LiveStatsCounter
        label="Active Alerts"
        value={metrics.activeNotifications}
        icon={Bell}
        trend={metrics.activeNotifications > 0 ? 'up' : 'stable'}
      />
    </div>
  );
}

// Connection Quality Indicator
export function ConnectionQualityIndicator({ className = '' }: { className?: string }) {
  const { connectionState } = useConnectionStatus();
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');

  useEffect(() => {
    if (!connectionState.isConnected) {
      setQuality('offline');
    } else if (connectionState.reconnectAttempts === 0) {
      setQuality('excellent');
    } else if (connectionState.reconnectAttempts < 3) {
      setQuality('good');
    } else {
      setQuality('poor');
    }
  }, [connectionState]);

  const getQualityColor = () => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      default: return 'text-red-500';
    }
  };

  const getQualityBars = () => {
    const bars = [];
    const activeCount = quality === 'excellent' ? 4 : quality === 'good' ? 3 : quality === 'poor' ? 2 : 0;
    
    for (let i = 0; i < 4; i++) {
      bars.push(
        <div
          key={i}
          className={`w-1 rounded-full ${
            i < activeCount ? getQualityColor().replace('text-', 'bg-') : 'bg-gray-300'
          }`}
          style={{ height: `${(i + 1) * 4 + 4}px` }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-end space-x-0.5">
        {getQualityBars()}
      </div>
      <span className={`text-xs font-medium ${getQualityColor()}`}>
        {quality.charAt(0).toUpperCase() + quality.slice(1)}
      </span>
    </div>
  );
}

export default {
  ConnectionStatusIndicator,
  LiveActivityFeed,
  LiveStatsCounter,
  NotificationBell,
  LiveUpdateBadge,
  RealtimeMetricsDashboard,
  ConnectionQualityIndicator,
};