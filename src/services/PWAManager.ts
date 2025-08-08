// Think Tank Technologies Installation Scheduler - PWA Manager
// Progressive Web App installation and management

export interface PWAInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallationState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: 'web' | 'android' | 'ios' | 'windows' | 'macos' | 'unknown';
  installPromptEvent?: PWAInstallPromptEvent;
  supportsPush: boolean;
  supportsBackgroundSync: boolean;
  supportsOffline: boolean;
}

export interface ServiceWorkerState {
  isRegistered: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

export interface OfflineCapabilities {
  isOnline: boolean;
  hasOfflineData: boolean;
  pendingSyncCount: number;
  lastSyncTime?: Date;
}

export class PWAManager {
  private installPromptEvent: PWAInstallPromptEvent | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private installationListeners = new Set<(state: PWAInstallationState) => void>();
  private serviceWorkerListeners = new Set<(state: ServiceWorkerState) => void>();
  private offlineListeners = new Set<(capabilities: OfflineCapabilities) => void>();
  
  private installationState: PWAInstallationState = {
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
    platform: 'unknown',
    supportsPush: false,
    supportsBackgroundSync: false,
    supportsOffline: false,
  };

  private serviceWorkerState: ServiceWorkerState = {
    isRegistered: false,
    isUpdating: false,
    hasUpdate: false,
  };

  private offlineCapabilities: OfflineCapabilities = {
    isOnline: navigator.onLine,
    hasOfflineData: false,
    pendingSyncCount: 0,
  };

  constructor() {
    this.detectPlatform();
    this.detectStandaloneMode();
    this.detectFeatureSupport();
    this.setupEventListeners();
    this.initializeServiceWorker();
  }

  /**
   * Register service worker
   */
  public async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.serviceWorkerRegistration = registration;
      this.updateServiceWorkerState({ 
        isRegistered: true, 
        registration 
      });

      console.log('Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Check if there's already an update waiting
      if (registration.waiting) {
        this.updateServiceWorkerState({ hasUpdate: true });
      }

      // Listen for controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.updateServiceWorkerState({ 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  }

  /**
   * Get current installation state
   */
  public getInstallationState(): PWAInstallationState {
    return { ...this.installationState };
  }

  /**
   * Get current service worker state
   */
  public getServiceWorkerState(): ServiceWorkerState {
    return { ...this.serviceWorkerState };
  }

  /**
   * Get offline capabilities
   */
  public getOfflineCapabilities(): OfflineCapabilities {
    return { ...this.offlineCapabilities };
  }

  /**
   * Prompt user to install PWA
   */
  public async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;
      
      console.log('Install prompt result:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        this.updateInstallationState({ 
          canInstall: false,
          isInstalled: true 
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Update service worker
   */
  public async updateServiceWorker(): Promise<void> {
    if (!this.serviceWorkerRegistration || !this.serviceWorkerState.hasUpdate) {
      return;
    }

    try {
      const waitingWorker = this.serviceWorkerRegistration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  /**
   * Check for service worker updates
   */
  public async checkForUpdates(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      return;
    }

    try {
      await this.serviceWorkerRegistration.update();
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  /**
   * Clear all caches
   */
  public async clearCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames
        .filter(name => name.startsWith('ttt-scheduler-'))
        .map(name => caches.delete(name));
      
      await Promise.all(deletePromises);
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * Cache specific URLs
   */
  public async cacheUrls(urls: string[]): Promise<void> {
    try {
      const cache = await caches.open('ttt-scheduler-v1');
      await cache.addAll(urls);
      console.log('URLs cached:', urls);
    } catch (error) {
      console.error('Failed to cache URLs:', error);
    }
  }

  /**
   * Get cached data size
   */
  public async getCacheSize(): Promise<number> {
    try {
      let totalSize = 0;
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames.filter(name => name.startsWith('ttt-scheduler-'))) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const key of keys) {
          const response = await cache.match(key);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Register for background sync
   */
  public async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.serviceWorkerRegistration || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background Sync not supported');
      return;
    }

    try {
      await this.serviceWorkerRegistration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // This would be your VAPID public key
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('Push notification subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push notification unsubscribed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  /**
   * Add installation state listener
   */
  public addInstallationListener(listener: (state: PWAInstallationState) => void): () => void {
    this.installationListeners.add(listener);
    return () => this.installationListeners.delete(listener);
  }

  /**
   * Add service worker state listener
   */
  public addServiceWorkerListener(listener: (state: ServiceWorkerState) => void): () => void {
    this.serviceWorkerListeners.add(listener);
    return () => this.serviceWorkerListeners.delete(listener);
  }

  /**
   * Add offline capabilities listener
   */
  public addOfflineListener(listener: (capabilities: OfflineCapabilities) => void): () => void {
    this.offlineListeners.add(listener);
    return () => this.offlineListeners.delete(listener);
  }

  /**
   * Detect platform
   */
  private detectPlatform(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) {
      this.installationState.platform = 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      this.installationState.platform = 'ios';
    } else if (/windows/.test(userAgent)) {
      this.installationState.platform = 'windows';
    } else if (/mac/.test(userAgent)) {
      this.installationState.platform = 'macos';
    } else {
      this.installationState.platform = 'web';
    }
  }

  /**
   * Detect standalone mode
   */
  private detectStandaloneMode(): void {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true ||
                        document.referrer.includes('android-app://');

    this.installationState.isStandalone = isStandalone;
    this.installationState.isInstalled = isStandalone;
  }

  /**
   * Detect feature support
   */
  private detectFeatureSupport(): void {
    this.installationState.supportsPush = 'PushManager' in window && 'Notification' in window;
    this.installationState.supportsBackgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    this.installationState.supportsOffline = 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e as PWAInstallPromptEvent;
      this.updateInstallationState({ 
        canInstall: true,
        installPromptEvent: this.installPromptEvent 
      });
      console.log('Install prompt available');
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.installPromptEvent = null;
      this.updateInstallationState({ 
        canInstall: false,
        isInstalled: true,
        installPromptEvent: undefined 
      });
    });

    // Listen for online/offline changes
    window.addEventListener('online', () => {
      this.updateOfflineCapabilities({ isOnline: true });
      console.log('App is online');
    });

    window.addEventListener('offline', () => {
      this.updateOfflineCapabilities({ isOnline: false });
      console.log('App is offline');
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.updateInstallationState({ 
        isStandalone: e.matches,
        isInstalled: e.matches 
      });
    });
  }

  /**
   * Handle service worker update
   */
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    this.updateServiceWorkerState({ isUpdating: true });

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.updateServiceWorkerState({ 
          isUpdating: false,
          hasUpdate: true 
        });
        console.log('New service worker available');
      }
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;
        
      case 'OFFLINE_READY':
        this.updateOfflineCapabilities({ hasOfflineData: true });
        console.log('Offline data ready');
        break;
        
      case 'SYNC_COMPLETED':
        this.updateOfflineCapabilities({ 
          pendingSyncCount: payload.remaining,
          lastSyncTime: new Date()
        });
        console.log('Background sync completed');
        break;
        
      default:
        console.log('Unknown service worker message:', type);
    }
  }

  /**
   * Update installation state and notify listeners
   */
  private updateInstallationState(updates: Partial<PWAInstallationState>): void {
    this.installationState = {
      ...this.installationState,
      ...updates,
    };

    this.installationListeners.forEach(listener => {
      try {
        listener(this.installationState);
      } catch (error) {
        console.error('Installation listener error:', error);
      }
    });
  }

  /**
   * Update service worker state and notify listeners
   */
  private updateServiceWorkerState(updates: Partial<ServiceWorkerState>): void {
    this.serviceWorkerState = {
      ...this.serviceWorkerState,
      ...updates,
    };

    this.serviceWorkerListeners.forEach(listener => {
      try {
        listener(this.serviceWorkerState);
      } catch (error) {
        console.error('Service worker listener error:', error);
      }
    });
  }

  /**
   * Update offline capabilities and notify listeners
   */
  private updateOfflineCapabilities(updates: Partial<OfflineCapabilities>): void {
    this.offlineCapabilities = {
      ...this.offlineCapabilities,
      ...updates,
    };

    this.offlineListeners.forEach(listener => {
      try {
        listener(this.offlineCapabilities);
      } catch (error) {
        console.error('Offline listener error:', error);
      }
    });
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Singleton instance
let pwaManager: PWAManager | null = null;

/**
 * Get PWA manager instance
 */
export function getPWAManager(): PWAManager {
  if (!pwaManager) {
    pwaManager = new PWAManager();
  }
  return pwaManager;
}

/**
 * React hooks for PWA features
 */
export function usePWAInstallation() {
  const [state, setState] = React.useState<PWAInstallationState>();
  const manager = getPWAManager();

  React.useEffect(() => {
    setState(manager.getInstallationState());
    const unsubscribe = manager.addInstallationListener(setState);
    return unsubscribe;
  }, [manager]);

  return {
    ...state,
    promptInstall: () => manager.promptInstall(),
  };
}

export function usePWAServiceWorker() {
  const [state, setState] = React.useState<ServiceWorkerState>();
  const manager = getPWAManager();

  React.useEffect(() => {
    setState(manager.getServiceWorkerState());
    const unsubscribe = manager.addServiceWorkerListener(setState);
    return unsubscribe;
  }, [manager]);

  return {
    ...state,
    updateServiceWorker: () => manager.updateServiceWorker(),
    checkForUpdates: () => manager.checkForUpdates(),
  };
}

export function usePWAOfflineCapabilities() {
  const [capabilities, setCapabilities] = React.useState<OfflineCapabilities>();
  const manager = getPWAManager();

  React.useEffect(() => {
    setCapabilities(manager.getOfflineCapabilities());
    const unsubscribe = manager.addOfflineListener(setCapabilities);
    return unsubscribe;
  }, [manager]);

  return {
    ...capabilities,
    registerBackgroundSync: (tag: string) => manager.registerBackgroundSync(tag),
  };
}

// React import for hooks
import React from 'react';

export default PWAManager;