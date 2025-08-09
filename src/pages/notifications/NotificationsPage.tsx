// Think Tank Technologies - Comprehensive Notifications Page
// Full notifications management with advanced filtering and actions

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Search,
  Filter,
  Check,
  CheckCircle2,
  X,
  Trash2,
  Archive,
  Star,
  Clock,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  Shield,
  Settings,
  MoreVertical,
  RefreshCw,
  ChevronDown,
  Eye,
  EyeOff,
  Download,
  Share2
} from 'lucide-react';
import { useNotificationService } from '../../hooks/useNotificationService';
import { useUser } from '../../stores/useAppStore';
import { formatDistanceToNow } from '../../utils';
import type { 
  AppNotification, 
  NotificationPriority, 
  AppNotificationType,
  NotificationStatus 
} from '../../types';

interface NotificationFilter {
  status: NotificationStatus[];
  priority: NotificationPriority[];
  type: AppNotificationType[];
  dateRange: 'today' | 'week' | 'month' | 'all';
  search: string;
}

const NotificationsPage: React.FC = () => {
  const user = useUser();
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

  // State
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'compact' | 'card'>('list');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'type'>('newest');
  
  const [filters, setFilters] = useState<NotificationFilter>({
    status: [],
    priority: [],
    type: [],
    dateRange: 'all',
    search: ''
  });

  // Notification type configurations
  const notificationTypeConfig = {
    installation_assigned: { 
      label: 'Assignments', 
      icon: <Calendar className="h-4 w-4" />, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    schedule_changed: { 
      label: 'Schedule Changes', 
      icon: <Clock className="h-4 w-4" />, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    conflict_detected: { 
      label: 'Conflicts', 
      icon: <AlertTriangle className="h-4 w-4" />, 
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    team_status_changed: { 
      label: 'Team Updates', 
      icon: <Users className="h-4 w-4" />, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    system_maintenance: { 
      label: 'System', 
      icon: <Shield className="h-4 w-4" />, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    performance_alert: { 
      label: 'Performance', 
      icon: <TrendingUp className="h-4 w-4" />, 
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
  };

  // Priority configurations
  const priorityConfig = {
    low: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', dotColor: 'bg-gray-500' },
    medium: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', dotColor: 'bg-blue-500' },
    high: { color: 'text-orange-400', bgColor: 'bg-orange-500/10', dotColor: 'bg-orange-500' },
    urgent: { color: 'text-red-400', bgColor: 'bg-red-500/10', dotColor: 'bg-red-500' },
  };

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Apply filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(n => filters.status.includes(n.status));
    }

    if (filters.priority.length > 0) {
      filtered = filtered.filter(n => filters.priority.includes(n.priority));
    }

    if (filters.type.length > 0) {
      filtered = filtered.filter(n => filters.type.includes(n.type));
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search) || 
        n.message.toLowerCase().includes(search)
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(n => new Date(n.createdAt) >= cutoff);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [notifications, filters, sortBy]);

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleBulkAction = async (action: 'read' | 'dismiss' | 'delete') => {
    const selectedIds = Array.from(selectedNotifications);
    
    try {
      switch (action) {
        case 'read':
          await Promise.all(selectedIds.map(id => markAsRead(id)));
          break;
        case 'dismiss':
          await Promise.all(selectedIds.map(id => dismissNotification(id)));
          break;
        case 'delete':
          await Promise.all(selectedIds.map(id => deleteNotification(id)));
          break;
      }
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error(`Failed to ${action} notifications:`, error);
    }
  };

  // Filter update helper
  const updateFilter = <K extends keyof NotificationFilter>(
    key: K, 
    value: NotificationFilter[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilter = <K extends keyof NotificationFilter>(
    key: K, 
    value: any
  ) => {
    setFilters(prev => {
      const currentArray = prev[key] as any[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <div className="flex items-center space-x-4 text-white/60">
            <span>{filteredNotifications.length} notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh */}
          <button
            onClick={() => fetchNotifications()}
            disabled={loading}
            className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-200"
          >
            <RefreshCw className={`h-5 w-5 text-white/90 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => window.location.href = '/app/settings'}
            className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-200"
          >
            <Settings className="h-4 w-4 text-white/90" />
            <span className="hidden sm:inline text-white/90">Settings</span>
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white/5 backdrop-filter backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <span className="text-white/60 text-sm">View:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="list" className="bg-gray-800">List</option>
              <option value="compact" className="bg-gray-800">Compact</option>
              <option value="card" className="bg-gray-800">Cards</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-white/60 text-sm">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="newest" className="bg-gray-800">Newest First</option>
              <option value="oldest" className="bg-gray-800">Oldest First</option>
              <option value="priority" className="bg-gray-800">Priority</option>
              <option value="type" className="bg-gray-800">Type</option>
            </select>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              showFilters 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                : 'bg-white/10 text-white/90 border border-white/20 hover:bg-white/15'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Status</label>
              <div className="space-y-2">
                {['unread', 'read', 'dismissed'].map(status => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status as NotificationStatus)}
                      onChange={() => toggleFilter('status', status)}
                      className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="text-white/90 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Priority</label>
              <div className="space-y-2">
                {Object.keys(priorityConfig).map(priority => (
                  <label key={priority} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority as NotificationPriority)}
                      onChange={() => toggleFilter('priority', priority)}
                      className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                    />
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${priorityConfig[priority as NotificationPriority].dotColor}`}></div>
                      <span className="text-white/90 capitalize">{priority}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Type</label>
              <div className="space-y-2">
                {Object.entries(notificationTypeConfig).map(([type, config]) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.type.includes(type as AppNotificationType)}
                      onChange={() => toggleFilter('type', type)}
                      className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                    />
                    <div className="flex items-center space-x-2">
                      <div className={`${config.color}`}>
                        {config.icon}
                      </div>
                      <span className="text-white/90">{config.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm text-white/80 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value as any)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all" className="bg-gray-800">All Time</option>
                <option value="today" className="bg-gray-800">Today</option>
                <option value="week" className="bg-gray-800">Past Week</option>
                <option value="month" className="bg-gray-800">Past Month</option>
              </select>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-white/80 text-sm">
                {selectedNotifications.size} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md hover:bg-blue-500/30 transition-all text-sm"
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleBulkAction('dismiss')}
                  className="px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-md hover:bg-orange-500/30 transition-all text-sm"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-md hover:bg-red-500/30 transition-all text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedNotifications(new Set())}
              className="text-white/60 hover:text-white/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Select All */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
              onChange={handleSelectAll}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <span className="text-white/80">Select All ({filteredNotifications.length})</span>
          </label>
        </div>
      )}

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-white/60">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-2">Failed to load notifications</p>
          <button
            onClick={() => fetchNotifications()}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Try again
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-white/30" />
          <p className="text-white/60 text-lg mb-2">No notifications found</p>
          <p className="text-white/40">
            {notifications.length === 0 
              ? "You're all caught up!" 
              : "Try adjusting your filters to see more notifications."
            }
          </p>
        </div>
      ) : (
        <div className={`space-y-4 ${viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              viewMode={viewMode}
              isSelected={selectedNotifications.has(notification.id)}
              onSelect={(id, selected) => {
                const newSelected = new Set(selectedNotifications);
                if (selected) {
                  newSelected.add(id);
                } else {
                  newSelected.delete(id);
                }
                setSelectedNotifications(newSelected);
              }}
              onRead={markAsRead}
              onDismiss={dismissNotification}
              onDelete={deleteNotification}
              typeConfig={notificationTypeConfig}
              priorityConfig={priorityConfig}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Individual Notification Item Component
interface NotificationItemProps {
  notification: AppNotification;
  viewMode: 'list' | 'compact' | 'card';
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
  typeConfig: any;
  priorityConfig: any;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  viewMode,
  isSelected,
  onSelect,
  onRead,
  onDismiss,
  onDelete,
  typeConfig,
  priorityConfig,
}) => {
  const [showActions, setShowActions] = useState(false);
  const isUnread = notification.status === 'unread';
  
  const typeInfo = typeConfig[notification.type] || {
    label: notification.type,
    icon: <Bell className="h-4 w-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  };
  
  const priorityInfo = priorityConfig[notification.priority];

  const handleNotificationClick = () => {
    if (isUnread) {
      onRead(notification.id);
    }
    
    // Handle notification actions
    if (notification.actions && notification.actions.length > 0) {
      const primaryAction = notification.actions.find(a => a.style === 'primary') || notification.actions[0];
      if (primaryAction.action === 'navigate' && primaryAction.parameters?.route) {
        window.location.href = primaryAction.parameters.route;
      }
    }
  };

  if (viewMode === 'compact') {
    return (
      <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer group ${
        isUnread 
          ? 'bg-white/8 border-blue-500/30' 
          : 'bg-white/3 border-white/10'
      } hover:bg-white/10`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(notification.id, e.target.checked);
          }}
          className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
        />
        
        {isUnread && <div className={`w-2 h-2 rounded-full ${priorityInfo.dotColor}`} />}
        
        <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
          <div className={typeInfo.color}>
            {typeInfo.icon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0" onClick={handleNotificationClick}>
          <div className="flex items-center space-x-2">
            <h4 className={`font-medium truncate ${isUnread ? 'text-white' : 'text-white/80'}`}>
              {notification.title}
            </h4>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityInfo.bgColor} ${priorityInfo.color}`}>
              {notification.priority}
            </span>
          </div>
          <p className="text-xs text-white/60 truncate">{notification.message}</p>
        </div>
        
        <div className="text-xs text-white/40">
          {formatDistanceToNow(new Date(notification.createdAt))}
        </div>
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className={`p-4 rounded-xl border transition-all cursor-pointer group ${
        isUnread 
          ? 'bg-white/8 border-blue-500/30' 
          : 'bg-white/5 border-white/10'
      } hover:bg-white/10`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(notification.id, e.target.checked);
              }}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
              <div className={typeInfo.color}>
                {typeInfo.icon}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isUnread && <div className={`w-2 h-2 rounded-full ${priorityInfo.dotColor}`} />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white/60 hover:bg-white/10 rounded transition-all"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div onClick={handleNotificationClick}>
          <h4 className={`font-medium mb-2 ${isUnread ? 'text-white' : 'text-white/80'}`}>
            {notification.title}
          </h4>
          
          <p className={`text-sm mb-3 line-clamp-3 ${isUnread ? 'text-white/80' : 'text-white/60'}`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{typeInfo.label}</span>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                {notification.priority}
              </span>
              <span>{formatDistanceToNow(new Date(notification.createdAt))}</span>
            </div>
          </div>
        </div>
        
        {/* Actions Menu */}
        {showActions && (
          <div className="absolute right-2 top-12 bg-black/95 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 min-w-[120px]">
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
    );
  }

  // Default list view
  return (
    <div className={`p-4 rounded-xl border transition-all cursor-pointer group ${
      isUnread 
        ? 'bg-white/8 border-blue-500/30 border-l-4 border-l-blue-500' 
        : 'bg-white/3 border-white/10'
    } hover:bg-white/10`}>
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(notification.id, e.target.checked);
          }}
          className="mt-1 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
        />
        
        {isUnread && <div className={`mt-2 w-2 h-2 rounded-full ${priorityInfo.dotColor}`} />}
        
        <div className={`mt-1 p-2 rounded-lg ${typeInfo.bgColor}`}>
          <div className={typeInfo.color}>
            {typeInfo.icon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0" onClick={handleNotificationClick}>
          <div className="flex items-start justify-between mb-2">
            <h4 className={`font-medium ${isUnread ? 'text-white' : 'text-white/80'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2 ml-2">
              <span className={`text-xs px-2 py-1 rounded-full ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                {notification.priority}
              </span>
              <span className="text-xs text-white/40">
                {formatDistanceToNow(new Date(notification.createdAt))} ago
              </span>
            </div>
          </div>
          
          <p className={`text-sm mb-2 line-clamp-2 ${isUnread ? 'text-white/80' : 'text-white/60'}`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">{typeInfo.label}</span>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex space-x-2">
                {notification.actions.slice(0, 2).map((action) => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (action.action === 'navigate' && action.parameters?.route) {
                        window.location.href = action.parameters.route;
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
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
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white/60 hover:bg-white/10 rounded transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        
        {/* Actions Menu */}
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
  );
};

export default NotificationsPage;