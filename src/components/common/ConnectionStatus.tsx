// Think Tank Technologies - Connection Status Indicator
// Shows real-time connection status with graceful degradation

import React from 'react';
import { Wifi, WifiOff, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useConnectionStatus } from '../../contexts/RealtimeProvider';
import { usePWAOfflineCapabilities } from '../../services/PWAManager';

export interface ConnectionStatusProps {
  className?: string;
  showDetailed?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showDetailed = false 
}) => {
  const { isConnected, isConnecting, connectionState } = useConnectionStatus();
  const offlineCapabilities = usePWAOfflineCapabilities();

  const getWebSocketStatus = () => {
    if (isConnecting) {
      return {
        icon: Clock,
        color: 'text-yellow-500',
        label: 'Connecting...',
        description: 'Establishing real-time connection'
      };
    }
    
    if (isConnected) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        label: 'Connected',
        description: 'Real-time updates active'
      };
    }

    if (connectionState.error) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        label: 'Connection Error',
        description: connectionState.error
      };
    }

    return {
      icon: WifiOff,
      color: 'text-orange-500',
      label: 'Offline Mode',
      description: 'Using cached data, will sync when reconnected'
    };
  };

  const getDatabaseStatus = () => {
    // Since we're using Supabase, we can assume database connectivity 
    // is tied to network connectivity
    if (offlineCapabilities?.isOnline) {
      return {
        icon: Database,
        color: 'text-green-500',
        label: 'Online',
        description: 'Database connected'
      };
    }

    return {
      icon: Database,
      color: 'text-orange-500',
      label: 'Offline',
      description: offlineCapabilities?.hasOfflineData 
        ? 'Using cached data' 
        : 'No cached data available'
    };
  };

  const webSocketStatus = getWebSocketStatus();
  const databaseStatus = getDatabaseStatus();

  if (!showDetailed) {
    // Compact view - just show overall status
    const overallConnected = isConnected && offlineCapabilities?.isOnline;
    const StatusIcon = overallConnected ? Wifi : WifiOff;
    
    return (
      <div 
        className={`flex items-center space-x-2 glass-subtle px-3 py-1.5 rounded-full hover:bg-white/15 transition-all duration-200 cursor-pointer group ${className}`}
        title={overallConnected ? 'All systems connected' : 'Working offline with cached data'}
      >
        <StatusIcon 
          className={`h-4 w-4 ${overallConnected ? 'text-success-400' : 'text-warning-400'} drop-shadow-sm group-hover:scale-110 transition-transform duration-200`} 
        />
        <span className={`text-xs font-medium ${overallConnected ? 'text-success-300' : 'text-warning-300'} group-hover:text-white/90 transition-colors duration-200`}>
          {overallConnected ? 'Online' : 'Offline'}
        </span>
      </div>
    );
  }

  // Detailed view with both WebSocket and database status
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Connection Status</h3>
      
      <div className="space-y-3">
        {/* WebSocket Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <webSocketStatus.icon className={`h-4 w-4 ${webSocketStatus.color}`} />
            <span className="text-sm font-medium text-gray-700">Real-time</span>
          </div>
          <div className="text-right">
            <div className={`text-xs font-medium ${webSocketStatus.color}`}>
              {webSocketStatus.label}
            </div>
            <div className="text-xs text-gray-500">
              {webSocketStatus.description}
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <databaseStatus.icon className={`h-4 w-4 ${databaseStatus.color}`} />
            <span className="text-sm font-medium text-gray-700">Database</span>
          </div>
          <div className="text-right">
            <div className={`text-xs font-medium ${databaseStatus.color}`}>
              {databaseStatus.label}
            </div>
            <div className="text-xs text-gray-500">
              {databaseStatus.description}
            </div>
          </div>
        </div>

        {/* Reconnection Status */}
        {connectionState.reconnectAttempts > 0 && (
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-xs text-gray-500">Reconnection attempts</span>
            <span className="text-xs font-medium text-yellow-600">
              {connectionState.reconnectAttempts}
            </span>
          </div>
        )}

        {/* Offline Data Status */}
        {offlineCapabilities?.hasOfflineData && !offlineCapabilities?.isOnline && (
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-xs text-gray-500">Pending sync</span>
            <span className="text-xs font-medium text-orange-600">
              {offlineCapabilities.pendingSyncCount || 0} items
            </span>
          </div>
        )}
      </div>

      {/* Graceful Degradation Message */}
      {!isConnected && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
          <div className="font-medium mb-1">Offline Mode Active</div>
          <div>
            The app is working with cached data. Changes will be synced automatically 
            when connection is restored.
          </div>
        </div>
      )}

      {/* Last Sync Time */}
      {offlineCapabilities?.lastSyncTime && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Last sync: {new Date(offlineCapabilities.lastSyncTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

// Hook for using connection status in components
export const useConnectionIndicator = () => {
  const { isConnected, connectionState } = useConnectionStatus();
  const offlineCapabilities = usePWAOfflineCapabilities();

  const isFullyOnline = isConnected && offlineCapabilities?.isOnline;
  const isWorkingOffline = !isFullyOnline && offlineCapabilities?.hasOfflineData;
  const hasNoConnectivity = !isFullyOnline && !offlineCapabilities?.hasOfflineData;

  return {
    isFullyOnline,
    isWorkingOffline,
    hasNoConnectivity,
    connectionState,
    offlineCapabilities,
    showConnectionWarning: !isFullyOnline,
    connectionMessage: isFullyOnline 
      ? 'All systems connected'
      : isWorkingOffline 
        ? 'Working offline with cached data'
        : 'Limited functionality - no cached data available'
  };
};

export default ConnectionStatus;