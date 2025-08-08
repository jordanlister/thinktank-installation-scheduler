// Think Tank Technologies Installation Scheduler - Toast Notification Component
// Real-time toast notifications with glassmorphism styling and animations

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';
import { formatDistanceToNow } from '../../utils';
import type { AppNotification, NotificationPriority } from '../../types';

interface ToastNotificationProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  onAction?: (actionId: string, parameters?: Record<string, any>) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoClose?: boolean;
  closeDelay?: number;
}

interface ToastContainerProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onAction?: (actionId: string, parameters?: Record<string, any>) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxVisible?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onDismiss,
  onAction,
  position = 'top-right',
  autoClose = true,
  closeDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Show animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-close timer
  useEffect(() => {
    if (!autoClose || notification.priority === 'urgent') return;

    const timer = setTimeout(() => {
      handleClose();
    }, closeDelay);

    return () => clearTimeout(timer);
  }, [autoClose, closeDelay, notification.priority]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match animation duration
  };

  const handleActionClick = (actionId: string, parameters?: Record<string, any>) => {
    if (onAction) {
      onAction(actionId, parameters);
    }
    handleClose();
  };

  const getIcon = () => {
    switch (notification.priority) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0" />;
      case 'medium':
        return <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />;
      case 'low':
        return <Bell className="h-5 w-5 text-gray-400 flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />;
    }
  };

  const getPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          border: 'border-red-500/50',
          bg: 'bg-red-500/10',
          accent: 'border-l-red-500',
        };
      case 'high':
        return {
          border: 'border-orange-500/50',
          bg: 'bg-orange-500/10',
          accent: 'border-l-orange-500',
        };
      case 'medium':
        return {
          border: 'border-blue-500/50',
          bg: 'bg-blue-500/10',
          accent: 'border-l-blue-500',
        };
      case 'low':
        return {
          border: 'border-gray-500/50',
          bg: 'bg-gray-500/10',
          accent: 'border-l-gray-500',
        };
      default:
        return {
          border: 'border-blue-500/50',
          bg: 'bg-blue-500/10',
          accent: 'border-l-blue-500',
        };
    }
  };

  const getPositionStyles = (pos: string) => {
    const baseTransform = isClosing 
      ? 'translate-x-full opacity-0' 
      : isVisible 
      ? 'translate-x-0 opacity-100' 
      : 'translate-x-full opacity-0';

    switch (pos) {
      case 'top-right':
        return `fixed top-4 right-4 transform ${baseTransform}`;
      case 'top-left':
        return `fixed top-4 left-4 transform ${baseTransform.replace('translate-x-full', '-translate-x-full').replace('translate-x-0', 'translate-x-0')}`;
      case 'bottom-right':
        return `fixed bottom-4 right-4 transform ${baseTransform}`;
      case 'bottom-left':
        return `fixed bottom-4 left-4 transform ${baseTransform.replace('translate-x-full', '-translate-x-full').replace('translate-x-0', 'translate-x-0')}`;
      case 'center':
        return `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isVisible && !isClosing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`;
      default:
        return `fixed top-4 right-4 transform ${baseTransform}`;
    }
  };

  const styles = getPriorityStyles(notification.priority);
  const positionClasses = getPositionStyles(position);

  return (
    <div
      className={`${positionClasses} transition-all duration-300 ease-out z-50 max-w-md w-full mx-auto`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`
          ${styles.bg} ${styles.border} ${styles.accent}
          backdrop-filter backdrop-blur-md border-l-4 rounded-xl p-4 shadow-2xl
          ring-1 ring-black/20 relative overflow-hidden
        `}
      >
        {/* Progress bar for auto-close */}
        {autoClose && notification.priority !== 'urgent' && (
          <div className="absolute top-0 left-0 h-1 bg-white/20 w-full">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all ease-linear"
              style={{ 
                width: '100%',
                animation: `shrink ${closeDelay}ms linear forwards`,
              }}
            />
          </div>
        )}

        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 pt-0.5">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="text-white font-semibold text-sm mb-1">
              {notification.title}
            </div>

            {/* Message */}
            <div className="text-white/80 text-sm leading-relaxed mb-2">
              {notification.message}
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{formatDistanceToNow(new Date(notification.createdAt))} ago</span>
              <span className="capitalize">{notification.priority} priority</span>
            </div>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-white/20">
                {notification.actions.slice(0, 2).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action.id, action.parameters)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      action.style === 'primary'
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                        : action.style === 'danger'
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30 backdrop-filter backdrop-blur-sm'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-white/60 hover:text-white/90 hover:bg-white/20 rounded-md transition-all duration-200"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
  onAction,
  position = 'top-right',
  maxVisible = 5,
}) => {
  const visibleNotifications = notifications.slice(0, maxVisible);

  if (visibleNotifications.length === 0) {
    return null;
  }

  const getContainerPositionStyles = (pos: string) => {
    switch (pos) {
      case 'top-right':
        return 'fixed top-4 right-4 space-y-2 z-50';
      case 'top-left':
        return 'fixed top-4 left-4 space-y-2 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 space-y-2 z-50';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 space-y-2 z-50';
      case 'center':
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 space-y-2 z-50';
      default:
        return 'fixed top-4 right-4 space-y-2 z-50';
    }
  };

  return (
    <div className={getContainerPositionStyles(position)}>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
            zIndex: 1000 - index,
          }}
        >
          <ToastNotification
            notification={notification}
            onDismiss={onDismiss}
            onAction={onAction}
            position="top-right" // Individual toasts don't need position since container handles it
            autoClose={notification.priority !== 'urgent'}
            closeDelay={notification.priority === 'urgent' ? 10000 : 5000}
          />
        </div>
      ))}

      {/* Stack indicator */}
      {notifications.length > maxVisible && (
        <div className="bg-black/80 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg p-2 text-center">
          <span className="text-white/60 text-xs">
            +{notifications.length - maxVisible} more notifications
          </span>
        </div>
      )}
    </div>
  );
};

// CSS for progress bar animation (add to your global styles)
const toastStyles = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

// Component to inject styles
export const ToastStyles: React.FC = () => (
  <style>{toastStyles}</style>
);

export { ToastNotification, ToastContainer };
export default ToastNotification;