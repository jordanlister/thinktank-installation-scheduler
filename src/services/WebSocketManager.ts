// Think Tank Technologies Installation Scheduler - WebSocket Manager
// Real-time connection management for live updates

import { WebSocketMessage, RealtimeSubscription } from '../types';

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  timeout: number;
}

export interface SubscriptionCallback {
  (data: any): void;
}

export interface WebSocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

export class WebSocketManager implements RealtimeSubscription {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private subscriptions = new Map<string, Set<SubscriptionCallback>>();
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private connectionState: WebSocketConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  };
  private messageQueue: WebSocketMessage[] = [];
  private stateChangeListeners = new Set<(state: WebSocketConnectionState) => void>();

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      timeout: config.timeout || 5000,
    };
  }

  /**
   * Establish WebSocket connection
   */
  public async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.updateConnectionState({ 
        isConnecting: true, 
        error: undefined 
      });

      try {
        this.ws = new WebSocket(this.config.url);

        const timeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error('WebSocket connection timeout'));
        }, this.config.timeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.handleConnectionOpen();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleConnectionClose(event);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.handleConnectionError(error);
          reject(error);
        };

      } catch (error) {
        this.updateConnectionState({ 
          isConnecting: false, 
          error: error instanceof Error ? error.message : 'Connection failed' 
        });
        reject(error);
      }
    });
  }

  /**
   * Close WebSocket connection
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateConnectionState({ 
      isConnected: false, 
      isConnecting: false,
      reconnectAttempts: 0 
    });
  }

  /**
   * Subscribe to real-time updates for a specific channel
   */
  public subscribe(channel: string, callback: SubscriptionCallback): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    this.subscriptions.get(channel)!.add(callback);

    // Send subscription message if connected
    if (this.connectionState.isConnected) {
      this.sendMessage({
        type: 'subscribe',
        payload: { channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channel: string, callback?: SubscriptionCallback): void {
    const channelSubscriptions = this.subscriptions.get(channel);
    if (!channelSubscriptions) return;

    if (callback) {
      channelSubscriptions.delete(callback);
      
      // Remove channel if no more subscribers
      if (channelSubscriptions.size === 0) {
        this.subscriptions.delete(channel);
        this.sendUnsubscribeMessage(channel);
      }
    } else {
      // Remove all subscribers for this channel
      this.subscriptions.delete(channel);
      this.sendUnsubscribeMessage(channel);
    }
  }

  /**
   * Emit data to a specific channel
   */
  public emit(channel: string, data: any): void {
    const message: WebSocketMessage = {
      type: 'broadcast',
      payload: {
        channel,
        data,
      },
      timestamp: new Date().toISOString(),
    };

    this.sendMessage(message);
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): WebSocketConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Add listener for connection state changes
   */
  public onStateChange(listener: (state: WebSocketConnectionState) => void): () => void {
    this.stateChangeListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  /**
   * Send message through WebSocket
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(message: WebSocketMessage): void {
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  /**
   * Send queued messages
   */
  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.sendMessage(message);
    }
  }

  /**
   * Handle WebSocket connection open
   */
  private handleConnectionOpen(): void {
    console.log('WebSocket connected');
    
    this.updateConnectionState({
      isConnected: true,
      isConnecting: false,
      lastConnected: new Date(),
      reconnectAttempts: 0,
      error: undefined,
    });

    // Start heartbeat
    this.startHeartbeat();

    // Send queued messages
    this.sendQueuedMessages();

    // Re-establish subscriptions
    this.reestablishSubscriptions();
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle heartbeat response
      if (message.type === 'pong') {
        return;
      }

      // Route message to subscribers
      this.routeMessage(message);
      
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Route message to appropriate subscribers
   */
  private routeMessage(message: WebSocketMessage): void {
    const { type, payload } = message;

    // Handle different message types
    switch (type) {
      case 'installation_update':
      case 'assignment_change':
      case 'team_status':
      case 'notification':
        // Broadcast to channel subscribers
        const channel = payload.channel || type;
        const subscribers = this.subscriptions.get(channel);
        
        if (subscribers) {
          subscribers.forEach(callback => {
            try {
              callback(payload);
            } catch (error) {
              console.error(`Error in subscription callback for channel ${channel}:`, error);
            }
          });
        }
        break;

      case 'broadcast':
        // Handle broadcast messages
        if (payload.channel) {
          const channelSubscribers = this.subscriptions.get(payload.channel);
          if (channelSubscribers) {
            channelSubscribers.forEach(callback => {
              try {
                callback(payload.data);
              } catch (error) {
                console.error(`Error in broadcast callback for channel ${payload.channel}:`, error);
              }
            });
          }
        }
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleConnectionClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
    });

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    // Attempt reconnection if not intentionally closed
    if (event.code !== 1000 && this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnection();
    }
  }

  /**
   * Handle WebSocket connection error
   */
  private handleConnectionError(error: Event): void {
    console.error('WebSocket error:', error);
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: 'Connection error',
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const reconnectDelay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.connectionState.reconnectAttempts),
      30000 // Max 30 seconds
    );

    this.updateConnectionState({
      reconnectAttempts: this.connectionState.reconnectAttempts + 1,
    });

    console.log(`Scheduling reconnection attempt ${this.connectionState.reconnectAttempts} in ${reconnectDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        if (this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnection();
        } else {
          console.error('Max reconnection attempts reached');
          this.updateConnectionState({
            error: 'Max reconnection attempts reached',
          });
        }
      });
    }, reconnectDelay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'ping',
          payload: {},
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Re-establish subscriptions after reconnection
   */
  private reestablishSubscriptions(): void {
    this.subscriptions.forEach((callbacks, channel) => {
      if (callbacks.size > 0) {
        this.sendMessage({
          type: 'subscribe',
          payload: { channel },
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Send unsubscribe message
   */
  private sendUnsubscribeMessage(channel: string): void {
    if (this.connectionState.isConnected) {
      this.sendMessage({
        type: 'unsubscribe',
        payload: { channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(updates: Partial<WebSocketConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...updates,
    };

    // Notify state change listeners
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // Use environment variable if available
    if (import.meta.env.VITE_WEBSOCKET_URL) {
      return import.meta.env.VITE_WEBSOCKET_URL;
    }
    
    // Default to same host with WebSocket path
    return `${protocol}//${host}/ws`;
  }
}

// Singleton instance for global use
let wsManager: WebSocketManager | null = null;

/**
 * Get or create WebSocket manager instance
 */
export function getWebSocketManager(config?: Partial<WebSocketConfig>): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(config);
  }
  return wsManager;
}

/**
 * Initialize WebSocket connection
 */
export async function initializeWebSocket(config?: Partial<WebSocketConfig>): Promise<WebSocketManager> {
  const manager = getWebSocketManager(config);
  await manager.connect();
  return manager;
}

/**
 * Real-time event types for the application
 */
export const RealtimeEvents = {
  INSTALLATION_CREATED: 'installation:created',
  INSTALLATION_UPDATED: 'installation:updated',
  INSTALLATION_DELETED: 'installation:deleted',
  ASSIGNMENT_CREATED: 'assignment:created',
  ASSIGNMENT_UPDATED: 'assignment:updated',
  ASSIGNMENT_DELETED: 'assignment:deleted',
  TEAM_MEMBER_UPDATED: 'team:member_updated',
  TEAM_STATUS_CHANGED: 'team:status_changed',
  SCHEDULE_UPDATED: 'schedule:updated',
  CONFLICT_DETECTED: 'conflict:detected',
  CONFLICT_RESOLVED: 'conflict:resolved',
  NOTIFICATION_SENT: 'notification:sent',
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DISMISSED: 'notification:dismissed',
  NOTIFICATION_DELETED: 'notification:deleted',
  NOTIFICATION_BULK_READ: 'notification:bulk_read',
  NOTIFICATION_STATUS_CHANGED: 'notification:status_changed',
  BULK_OPERATION_PROGRESS: 'bulk:progress',
  BULK_OPERATION_COMPLETE: 'bulk:complete',
} as const;

export type RealtimeEvent = typeof RealtimeEvents[keyof typeof RealtimeEvents];

/**
 * Utility hooks and functions for React components
 */
export interface RealtimeHookOptions {
  autoConnect?: boolean;
  onConnectionChange?: (state: WebSocketConnectionState) => void;
}

/**
 * React hook for WebSocket connection state
 */
export function useWebSocketConnection(options: RealtimeHookOptions = {}): {
  connectionState: WebSocketConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
} {
  const manager = getWebSocketManager();
  const [connectionState, setConnectionState] = React.useState(manager.getConnectionState());

  React.useEffect(() => {
    const unsubscribe = manager.onStateChange(setConnectionState);
    
    if (options.autoConnect && !connectionState.isConnected && !connectionState.isConnecting) {
      manager.connect().catch(console.error);
    }

    return unsubscribe;
  }, [options.autoConnect]);

  React.useEffect(() => {
    if (options.onConnectionChange) {
      options.onConnectionChange(connectionState);
    }
  }, [connectionState, options.onConnectionChange]);

  return {
    connectionState,
    connect: () => manager.connect(),
    disconnect: () => manager.disconnect(),
    isConnected: connectionState.isConnected,
  };
}

/**
 * React hook for subscribing to real-time events
 */
export function useRealtimeSubscription<T = any>(
  channel: string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
): void {
  const manager = getWebSocketManager();

  React.useEffect(() => {
    manager.subscribe(channel, callback);

    return () => {
      manager.unsubscribe(channel, callback);
    };
  }, [channel, ...deps]);
}

// React import for hooks (will be imported by components using these hooks)
import React from 'react';