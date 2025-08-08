import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getPWAManager } from './services/PWAManager'

// Initialize PWA features
if ('serviceWorker' in navigator) {
  // Initialize PWA Manager
  const pwaManager = getPWAManager();
  
  // Service worker will be registered automatically by PWAManager
  console.log('PWA Manager initialized');

  // Handle PWA installation state changes
  pwaManager.addInstallationListener((state) => {
    console.log('PWA installation state changed:', state);
    
    // You can add custom logic here for installation prompts
    if (state.canInstall) {
      console.log('PWA can be installed');
    }
  });

  // Handle service worker state changes
  pwaManager.addServiceWorkerListener((state) => {
    console.log('Service Worker state changed:', state);
    
    if (state.hasUpdate) {
      console.log('Service Worker update available');
      // You could show a toast notification here
    }
  });

  // Handle offline capabilities
  pwaManager.addOfflineListener((capabilities) => {
    console.log('Offline capabilities changed:', capabilities);
    
    if (!capabilities.isOnline) {
      console.log('App is now offline');
    } else {
      console.log('App is back online');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
