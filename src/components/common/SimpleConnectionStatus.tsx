// Simple Connection Status - Uses Supabase connection instead of WebSocket
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { realtime } from '../../services/supabase';

export interface SimpleConnectionStatusProps {
  className?: string;
}

export const SimpleConnectionStatus: React.FC<SimpleConnectionStatusProps> = ({ 
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseStatus, setSupabaseStatus] = useState({ 
    connected: false, 
    channels: 0 
  });

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Supabase connection status
  useEffect(() => {
    const checkSupabaseStatus = () => {
      const status = realtime.getStatus();
      setSupabaseStatus({
        connected: status.connected && !status.error,
        channels: status.channels || 0
      });
    };

    // Check initially
    checkSupabaseStatus();

    // Check periodically
    const interval = setInterval(checkSupabaseStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Offline',
        description: 'No internet connection'
      };
    }

    if (supabaseStatus.connected) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Online',
        description: `Connected with ${supabaseStatus.channels} active channels`
      };
    }

    return {
      icon: Database,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      label: 'Connected',
      description: 'Database connected, no real-time channels'
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div 
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${status.bgColor} hover:bg-opacity-20 transition-all duration-200 cursor-pointer group ${className}`}
      title={status.description}
    >
      <StatusIcon 
        className={`h-4 w-4 ${status.color} drop-shadow-sm group-hover:scale-110 transition-transform duration-200`} 
      />
      <span className={`text-xs font-medium ${status.color} group-hover:text-opacity-90 transition-colors duration-200`}>
        {status.label}
      </span>
    </div>
  );
};

export default SimpleConnectionStatus;