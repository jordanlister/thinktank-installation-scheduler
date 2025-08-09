// Think Tank Technologies Installation Scheduler - Billing Notifications Component
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography
} from '../ui';
import { billingNotificationService } from '../../services/billingNotificationService';
import { usageTrackingService } from '../../services/usageTrackingService';
import {
  UsageWarning,
  NotificationType,
  NotificationPriority
} from '../../types';
import {
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  CreditCard,
  Calendar,
  TrendingUp,
  Users,
  FolderOpen,
  Wrench,
  Bell,
  BellOff
} from 'lucide-react';

interface BillingNotification {
  id: string;
  type: 'usage_warning' | 'trial_expiring' | 'payment_failed' | 'payment_success' | 'subscription_changed' | 'feature_limited';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  acknowledged?: boolean;
  autoHide?: boolean;
  metadata?: Record<string, any>;
}

interface BillingNotificationsProps {
  organizationId: string;
  className?: string;
  showInlineWarnings?: boolean;
  maxNotifications?: number;
}

const getNotificationIcon = (type: string, severity: string) => {
  switch (severity) {
    case 'critical':
      return AlertTriangle;
    case 'warning':
      return AlertTriangle;
    default:
      switch (type) {
        case 'payment_success':
          return CheckCircle;
        case 'payment_failed':
          return CreditCard;
        case 'trial_expiring':
          return Calendar;
        case 'usage_warning':
          return TrendingUp;
        default:
          return Info;
      }
  }
};

const getNotificationColors = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        title: 'text-red-900',
        message: 'text-red-800'
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        message: 'text-yellow-800'
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        message: 'text-blue-800'
      };
  }
};

const NotificationCard: React.FC<{
  notification: BillingNotification;
  onDismiss: (id: string) => void;
  onAction?: (notification: BillingNotification) => void;
}> = ({ notification, onDismiss, onAction }) => {
  const Icon = getNotificationIcon(notification.type, notification.severity);
  const colors = getNotificationColors(notification.severity);
  
  return (
    <Card className={`${colors.bg} ${colors.border} border-l-4`}>
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 mt-0.5 ${colors.icon}`} />
        
        <div className="flex-1 min-w-0">
          <Typography variant="body1" className={`font-semibold ${colors.title}`}>
            {notification.title}
          </Typography>
          <Typography variant="body2" className={`mt-1 ${colors.message}`}>
            {notification.message}
          </Typography>
          
          {notification.actionUrl && notification.actionText && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => onAction?.(notification)}
              >
                {notification.actionText}
              </Button>
            </div>
          )}
        </div>
        
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};

export const BillingNotifications: React.FC<BillingNotificationsProps> = ({
  organizationId,
  className = '',
  showInlineWarnings = true,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<BillingNotification[]>([]);
  const [usageWarnings, setUsageWarnings] = useState<UsageWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Load notifications and warnings
  useEffect(() => {
    loadNotifications();
  }, [organizationId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Get usage warnings
      const warnings = await usageTrackingService.getUsageWarnings(organizationId);
      setUsageWarnings(warnings);
      
      // Convert usage warnings to notifications
      const warningNotifications: BillingNotification[] = warnings.map(warning => ({
        id: `usage-${warning.resource}-${Date.now()}`,
        type: 'usage_warning',
        severity: warning.severity as 'info' | 'warning' | 'critical',
        title: `${warning.resource} ${warning.severity === 'critical' ? 'Limit Reached' : 'Approaching Limit'}`,
        message: warning.message,
        actionUrl: warning.actionRequired ? '/settings/billing' : undefined,
        actionText: warning.actionRequired ? 'Upgrade Plan' : undefined,
        createdAt: new Date().toISOString(),
        metadata: {
          resource: warning.resource,
          currentUsage: warning.currentUsage,
          limit: warning.limit,
          percentage: warning.percentage
        }
      }));

      // Filter out dismissed notifications
      const activeNotifications = warningNotifications.filter(
        notification => !dismissed.has(notification.id)
      );

      setNotifications(activeNotifications.slice(0, maxNotifications));
    } catch (error) {
      console.error('Error loading billing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle notification dismissal
  const handleDismiss = (notificationId: string) => {
    setDismissed(prev => new Set(prev).add(notificationId));
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Handle notification action
  const handleAction = (notification: BillingNotification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Auto-dismiss low-priority notifications after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.severity !== 'info'));
    }, 10000);

    return () => clearTimeout(timer);
  }, [notifications]);

  if (loading) {
    return null; // Don't show loading state for notifications
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Inline Usage Warnings */}
      {showInlineWarnings && (
        <div className="space-y-3">
          {notifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onDismiss={handleDismiss}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Usage Limit Status Component
interface UsageLimitStatusProps {
  organizationId: string;
  resource: 'projects' | 'teamMembers' | 'installations';
  current: number;
  limit: number;
  className?: string;
}

export const UsageLimitStatus: React.FC<UsageLimitStatusProps> = ({
  organizationId,
  resource,
  current,
  limit,
  className = ''
}) => {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;
  
  let status: 'safe' | 'warning' | 'critical';
  if (isUnlimited) {
    status = 'safe';
  } else if (percentage >= 95) {
    status = 'critical';
  } else if (percentage >= 80) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getIcon = () => {
    switch (resource) {
      case 'projects':
        return FolderOpen;
      case 'teamMembers':
        return Users;
      case 'installations':
        return Wrench;
      default:
        return Info;
    }
  };

  const Icon = getIcon();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <Icon className="w-5 h-5 text-gray-600" />
        {status !== 'safe' && (
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor()}`} />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <Typography variant="body2" className="font-medium capitalize">
            {resource.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            {current} / {isUnlimited ? '∞' : limit}
          </Typography>
        </div>
        
        {!isUnlimited && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{
                width: `${Math.min(percentage, 100)}%`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Billing Alert Banner
interface BillingAlertBannerProps {
  organizationId: string;
  className?: string;
}

export const BillingAlertBanner: React.FC<BillingAlertBannerProps> = ({
  organizationId,
  className = ''
}) => {
  const [alerts, setAlerts] = useState<BillingNotification[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadCriticalAlerts();
  }, [organizationId]);

  const loadCriticalAlerts = async () => {
    try {
      const warnings = await usageTrackingService.getUsageWarnings(organizationId);
      const criticalWarnings = warnings.filter(w => w.severity === 'critical');
      
      if (criticalWarnings.length > 0) {
        const alertNotifications: BillingNotification[] = criticalWarnings.map(warning => ({
          id: `critical-${warning.resource}`,
          type: 'usage_warning',
          severity: 'critical',
          title: 'Action Required',
          message: `You've reached your ${warning.resource} limit. Upgrade to continue using this feature.`,
          actionUrl: '/settings/billing',
          actionText: 'Upgrade Now',
          createdAt: new Date().toISOString(),
          metadata: { resource: warning.resource }
        }));
        
        setAlerts(alertNotifications);
      }
    } catch (error) {
      console.error('Error loading critical alerts:', error);
    }
  };

  if (dismissed || alerts.length === 0) {
    return null;
  }

  const primaryAlert = alerts[0];

  return (
    <div className={`bg-red-600 text-white ${className}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <Typography variant="body1" className="font-semibold">
              {primaryAlert.title}
            </Typography>
            <Typography variant="body2">
              {primaryAlert.message}
            </Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = primaryAlert.actionUrl || '/settings/billing'}
            className="bg-transparent border-white text-white hover:bg-white hover:text-red-600"
          >
            {primaryAlert.actionText}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white hover:text-red-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingNotifications;