// Think Tank Technologies Installation Scheduler - Realtime Provider
// React context for real-time data subscriptions and state management

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { 
  WebSocketManager, 
  getWebSocketManager, 
  WebSocketConnectionState,
  RealtimeEvents,
  RealtimeEvent 
} from '../services/WebSocketManager';
import { 
  Installation, 
  Assignment, 
  TeamMember, 
  AssignmentConflict,
  WebSocketMessage 
} from '../types';

// Real-time state interface
export interface RealtimeState {
  connectionState: WebSocketConnectionState;
  installations: Map<string, Installation>;
  assignments: Map<string, Assignment>;
  teamMembers: Map<string, TeamMember>;
  conflicts: Map<string, AssignmentConflict>;
  notifications: RealtimeNotification[];
  lastUpdate: string | null;
  subscriptions: Set<string>;
}

// Real-time notification interface
export interface RealtimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedEntityId?: string;
  relatedEntityType?: 'installation' | 'assignment' | 'team_member';
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  parameters?: { [key: string]: any };
}

// Real-time action types
type RealtimeAction = 
  | { type: 'CONNECTION_STATE_CHANGED'; payload: WebSocketConnectionState }
  | { type: 'INSTALLATION_UPDATED'; payload: Installation }
  | { type: 'INSTALLATION_DELETED'; payload: { id: string } }
  | { type: 'ASSIGNMENT_UPDATED'; payload: Assignment }
  | { type: 'ASSIGNMENT_DELETED'; payload: { id: string } }
  | { type: 'TEAM_MEMBER_UPDATED'; payload: TeamMember }
  | { type: 'CONFLICT_DETECTED'; payload: AssignmentConflict }
  | { type: 'CONFLICT_RESOLVED'; payload: { id: string } }
  | { type: 'NOTIFICATION_RECEIVED'; payload: RealtimeNotification }
  | { type: 'NOTIFICATION_READ'; payload: { id: string } }
  | { type: 'NOTIFICATION_CLEARED'; payload: { id: string } }
  | { type: 'BULK_UPDATE'; payload: { type: string; items: any[] } }
  | { type: 'SUBSCRIPTION_ADDED'; payload: { channel: string } }
  | { type: 'SUBSCRIPTION_REMOVED'; payload: { channel: string } }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: RealtimeState = {
  connectionState: {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  },
  installations: new Map(),
  assignments: new Map(),
  teamMembers: new Map(),
  conflicts: new Map(),
  notifications: [],
  lastUpdate: null,
  subscriptions: new Set(),
};

// Reducer function
function realtimeReducer(state: RealtimeState, action: RealtimeAction): RealtimeState {
  switch (action.type) {
    case 'CONNECTION_STATE_CHANGED':
      return {
        ...state,
        connectionState: action.payload,
      };

    case 'INSTALLATION_UPDATED': {
      const newInstallations = new Map(state.installations);
      newInstallations.set(action.payload.id, action.payload);
      return {
        ...state,
        installations: newInstallations,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'INSTALLATION_DELETED': {
      const newInstallations = new Map(state.installations);
      newInstallations.delete(action.payload.id);
      return {
        ...state,
        installations: newInstallations,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'ASSIGNMENT_UPDATED': {
      const newAssignments = new Map(state.assignments);
      newAssignments.set(action.payload.id, action.payload);
      return {
        ...state,
        assignments: newAssignments,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'ASSIGNMENT_DELETED': {
      const newAssignments = new Map(state.assignments);
      newAssignments.delete(action.payload.id);
      return {
        ...state,
        assignments: newAssignments,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'TEAM_MEMBER_UPDATED': {
      const newTeamMembers = new Map(state.teamMembers);
      newTeamMembers.set(action.payload.id, action.payload);
      return {
        ...state,
        teamMembers: newTeamMembers,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'CONFLICT_DETECTED': {
      const newConflicts = new Map(state.conflicts);
      newConflicts.set(action.payload.id, action.payload);
      return {
        ...state,
        conflicts: newConflicts,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'CONFLICT_RESOLVED': {
      const newConflicts = new Map(state.conflicts);
      newConflicts.delete(action.payload.id);
      return {
        ...state,
        conflicts: newConflicts,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'NOTIFICATION_RECEIVED':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 49)], // Keep last 50
        lastUpdate: new Date().toISOString(),
      };

    case 'NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload.id ? { ...n, read: true } : n
        ),
      };

    case 'NOTIFICATION_CLEARED':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id),
      };

    case 'BULK_UPDATE': {
      const { type, items } = action.payload;
      let newState = { ...state };

      switch (type) {
        case 'installations':
          const newInstallations = new Map(state.installations);
          items.forEach((item: Installation) => {
            newInstallations.set(item.id, item);
          });
          newState.installations = newInstallations;
          break;

        case 'assignments':
          const newAssignments = new Map(state.assignments);
          items.forEach((item: Assignment) => {
            newAssignments.set(item.id, item);
          });
          newState.assignments = newAssignments;
          break;

        case 'team_members':
          const newTeamMembers = new Map(state.teamMembers);
          items.forEach((item: TeamMember) => {
            newTeamMembers.set(item.id, item);
          });
          newState.teamMembers = newTeamMembers;
          break;
      }

      return {
        ...newState,
        lastUpdate: new Date().toISOString(),
      };
    }

    case 'SUBSCRIPTION_ADDED': {
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.add(action.payload.channel);
      return {
        ...state,
        subscriptions: newSubscriptions,
      };
    }

    case 'SUBSCRIPTION_REMOVED': {
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.delete(action.payload.channel);
      return {
        ...state,
        subscriptions: newSubscriptions,
      };
    }

    case 'RESET_STATE':
      return {
        ...initialState,
        connectionState: state.connectionState,
      };

    default:
      return state;
  }
}

// Context interface
export interface RealtimeContextType {
  state: RealtimeState;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getInstallation: (id: string) => Installation | undefined;
  getAssignment: (id: string) => Assignment | undefined;
  getTeamMember: (id: string) => TeamMember | undefined;
  getConflict: (id: string) => AssignmentConflict | undefined;
  getUnreadNotificationCount: () => number;
}

// Create context
const RealtimeContext = createContext<RealtimeContextType | null>(null);

// Provider component props
export interface RealtimeProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
  onConnectionError?: (error: string) => void;
}

// Provider component
export function RealtimeProvider({ 
  children, 
  autoConnect = true,
  onConnectionError 
}: RealtimeProviderProps) {
  const [state, dispatch] = useReducer(realtimeReducer, initialState);
  const wsManager = useMemo(() => getWebSocketManager(), []);

  // Connection state handler
  const handleConnectionStateChange = useCallback((connectionState: WebSocketConnectionState) => {
    dispatch({ type: 'CONNECTION_STATE_CHANGED', payload: connectionState });
    
    if (connectionState.error && onConnectionError) {
      onConnectionError(connectionState.error);
    }
  }, [onConnectionError]);

  // Message handlers
  const handleInstallationUpdate = useCallback((data: any) => {
    if (data.type === 'delete') {
      dispatch({ type: 'INSTALLATION_DELETED', payload: { id: data.id } });
    } else {
      dispatch({ type: 'INSTALLATION_UPDATED', payload: data.installation });
    }
  }, []);

  const handleAssignmentUpdate = useCallback((data: any) => {
    if (data.type === 'delete') {
      dispatch({ type: 'ASSIGNMENT_DELETED', payload: { id: data.id } });
    } else {
      dispatch({ type: 'ASSIGNMENT_UPDATED', payload: data.assignment });
    }
  }, []);

  const handleTeamMemberUpdate = useCallback((data: any) => {
    dispatch({ type: 'TEAM_MEMBER_UPDATED', payload: data.teamMember });
  }, []);

  const handleConflictUpdate = useCallback((data: any) => {
    if (data.type === 'resolved') {
      dispatch({ type: 'CONFLICT_RESOLVED', payload: { id: data.id } });
    } else {
      dispatch({ type: 'CONFLICT_DETECTED', payload: data.conflict });
    }
  }, []);

  const handleNotification = useCallback((data: any) => {
    const notification: RealtimeNotification = {
      id: data.id || Date.now().toString(),
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      relatedEntityId: data.relatedEntityId,
      relatedEntityType: data.relatedEntityType,
      actions: data.actions,
    };
    
    dispatch({ type: 'NOTIFICATION_RECEIVED', payload: notification });
  }, []);

  const handleBulkUpdate = useCallback((data: any) => {
    dispatch({ type: 'BULK_UPDATE', payload: data });
  }, []);

  const handleNotificationStatusChange = useCallback((data: any) => {
    // Handle individual notification status changes
    if (data.id && data.status) {
      dispatch({ 
        type: 'NOTIFICATION_READ', 
        payload: { 
          id: data.id, 
          status: data.status,
          userId: data.userId 
        } 
      });
    }
  }, []);

  const handleBulkNotificationRead = useCallback((data: any) => {
    // Handle bulk notification read operations
    const notification: RealtimeNotification = {
      id: `bulk-${Date.now()}`,
      type: 'info',
      title: 'Notifications Updated',
      message: `${data.count || 'All'} notifications marked as read`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    dispatch({ type: 'NOTIFICATION_RECEIVED', payload: notification });
  }, []);

  // Initialize WebSocket connection and subscriptions
  useEffect(() => {
    // Set up connection state listener
    const unsubscribeConnectionState = wsManager.onStateChange(handleConnectionStateChange);

    // Set up event subscriptions
    wsManager.subscribe(RealtimeEvents.INSTALLATION_CREATED, handleInstallationUpdate);
    wsManager.subscribe(RealtimeEvents.INSTALLATION_UPDATED, handleInstallationUpdate);
    wsManager.subscribe(RealtimeEvents.INSTALLATION_DELETED, handleInstallationUpdate);
    
    wsManager.subscribe(RealtimeEvents.ASSIGNMENT_CREATED, handleAssignmentUpdate);
    wsManager.subscribe(RealtimeEvents.ASSIGNMENT_UPDATED, handleAssignmentUpdate);
    wsManager.subscribe(RealtimeEvents.ASSIGNMENT_DELETED, handleAssignmentUpdate);
    
    wsManager.subscribe(RealtimeEvents.TEAM_MEMBER_UPDATED, handleTeamMemberUpdate);
    wsManager.subscribe(RealtimeEvents.TEAM_STATUS_CHANGED, handleTeamMemberUpdate);
    
    wsManager.subscribe(RealtimeEvents.CONFLICT_DETECTED, handleConflictUpdate);
    wsManager.subscribe(RealtimeEvents.CONFLICT_RESOLVED, handleConflictUpdate);
    
    wsManager.subscribe(RealtimeEvents.NOTIFICATION_SENT, handleNotification);
    wsManager.subscribe(RealtimeEvents.NOTIFICATION_CREATED, handleNotification);
    wsManager.subscribe(RealtimeEvents.NOTIFICATION_READ, handleNotificationStatusChange);
    wsManager.subscribe(RealtimeEvents.NOTIFICATION_DISMISSED, handleNotificationStatusChange);
    wsManager.subscribe(RealtimeEvents.NOTIFICATION_DELETED, handleNotificationStatusChange);
    wsManager.subscribe(RealtimeEvents.NOTIFICATION_STATUS_CHANGED, handleNotificationStatusChange);
    wsManager.subscribe(RealtimeEvents.NOTIFICATION_BULK_READ, handleBulkNotificationRead);
    
    wsManager.subscribe(RealtimeEvents.BULK_OPERATION_PROGRESS, handleBulkUpdate);
    wsManager.subscribe(RealtimeEvents.BULK_OPERATION_COMPLETE, handleBulkUpdate);

    // Auto-connect if enabled
    if (autoConnect) {
      wsManager.connect().catch(error => {
        console.error('Failed to auto-connect WebSocket:', error);
      });
    }

    // Cleanup function
    return () => {
      unsubscribeConnectionState();
      
      // Unsubscribe from all events
      wsManager.unsubscribe(RealtimeEvents.INSTALLATION_CREATED, handleInstallationUpdate);
      wsManager.unsubscribe(RealtimeEvents.INSTALLATION_UPDATED, handleInstallationUpdate);
      wsManager.unsubscribe(RealtimeEvents.INSTALLATION_DELETED, handleInstallationUpdate);
      
      wsManager.unsubscribe(RealtimeEvents.ASSIGNMENT_CREATED, handleAssignmentUpdate);
      wsManager.unsubscribe(RealtimeEvents.ASSIGNMENT_UPDATED, handleAssignmentUpdate);
      wsManager.unsubscribe(RealtimeEvents.ASSIGNMENT_DELETED, handleAssignmentUpdate);
      
      wsManager.unsubscribe(RealtimeEvents.TEAM_MEMBER_UPDATED, handleTeamMemberUpdate);
      wsManager.unsubscribe(RealtimeEvents.TEAM_STATUS_CHANGED, handleTeamMemberUpdate);
      
      wsManager.unsubscribe(RealtimeEvents.CONFLICT_DETECTED, handleConflictUpdate);
      wsManager.unsubscribe(RealtimeEvents.CONFLICT_RESOLVED, handleConflictUpdate);
      
      wsManager.unsubscribe(RealtimeEvents.NOTIFICATION_SENT, handleNotification);
      wsManager.unsubscribe(RealtimeEvents.NOTIFICATION_CREATED, handleNotification);
      wsManager.unsubscribe(RealtimeEvents.NOTIFICATION_READ, handleNotificationStatusChange);
      wsManager.unsubscribe(RealtimeEvents.NOTIFICATION_DISMISSED, handleNotificationStatusChange);
      wsManager.unsubscribe(RealtimeEvents.NOTIFICATION_DELETED, handleNotificationStatusChange);
      wsManager.unsubscribe(RealtimeEvents.NOTIFICATION_STATUS_CHANGED, handleNotificationStatusChange);
      wsManager.unsubscribe(RealtimeEvents.NOTIFICATION_BULK_READ, handleBulkNotificationRead);
      
      wsManager.unsubscribe(RealtimeEvents.BULK_OPERATION_PROGRESS, handleBulkUpdate);
      wsManager.unsubscribe(RealtimeEvents.BULK_OPERATION_COMPLETE, handleBulkUpdate);
    };
  }, [
    wsManager,
    autoConnect,
    handleConnectionStateChange,
    handleInstallationUpdate,
    handleAssignmentUpdate,
    handleTeamMemberUpdate,
    handleConflictUpdate,
    handleNotification,
    handleBulkUpdate,
    handleNotificationStatusChange,
    handleBulkNotificationRead,
  ]);

  // Context value
  const contextValue: RealtimeContextType = useMemo(() => ({
    state,
    isConnected: state.connectionState.isConnected,
    
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    
    subscribe: (channel: string) => {
      wsManager.subscribe(channel, () => {});
      dispatch({ type: 'SUBSCRIPTION_ADDED', payload: { channel } });
    },
    
    unsubscribe: (channel: string) => {
      wsManager.unsubscribe(channel);
      dispatch({ type: 'SUBSCRIPTION_REMOVED', payload: { channel } });
    },
    
    markNotificationAsRead: (id: string) => {
      dispatch({ type: 'NOTIFICATION_READ', payload: { id } });
    },
    
    clearNotification: (id: string) => {
      dispatch({ type: 'NOTIFICATION_CLEARED', payload: { id } });
    },
    
    clearAllNotifications: () => {
      state.notifications.forEach(notification => {
        dispatch({ type: 'NOTIFICATION_CLEARED', payload: { id: notification.id } });
      });
    },
    
    getInstallation: (id: string) => state.installations.get(id),
    getAssignment: (id: string) => state.assignments.get(id),
    getTeamMember: (id: string) => state.teamMembers.get(id),
    getConflict: (id: string) => state.conflicts.get(id),
    
    getUnreadNotificationCount: () => state.notifications.filter(n => !n.read).length,
  }), [state, wsManager]);

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Hook to use realtime context
export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Custom hooks for specific data types
export function useRealtimeInstallations(): Installation[] {
  const { state } = useRealtime();
  return Array.from(state.installations.values());
}

export function useRealtimeAssignments(): Assignment[] {
  const { state } = useRealtime();
  return Array.from(state.assignments.values());
}

export function useRealtimeTeamMembers(): TeamMember[] {
  const { state } = useRealtime();
  return Array.from(state.teamMembers.values());
}

export function useRealtimeConflicts(): AssignmentConflict[] {
  const { state } = useRealtime();
  return Array.from(state.conflicts.values());
}

export function useRealtimeNotifications(): RealtimeNotification[] {
  const { state } = useRealtime();
  return state.notifications;
}

// Hook for connection status
export function useConnectionStatus(): {
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: WebSocketConnectionState;
} {
  const { state, isConnected } = useRealtime();
  return {
    isConnected,
    isConnecting: state.connectionState.isConnecting,
    connectionState: state.connectionState,
  };
}

// Hook for specific entity updates
export function useRealtimeEntity<T>(
  entityType: 'installation' | 'assignment' | 'team_member' | 'conflict',
  entityId: string
): T | undefined {
  const { getInstallation, getAssignment, getTeamMember, getConflict } = useRealtime();
  
  switch (entityType) {
    case 'installation':
      return getInstallation(entityId) as T | undefined;
    case 'assignment':
      return getAssignment(entityId) as T | undefined;
    case 'team_member':
      return getTeamMember(entityId) as T | undefined;
    case 'conflict':
      return getConflict(entityId) as T | undefined;
    default:
      return undefined;
  }
}

export default RealtimeProvider;