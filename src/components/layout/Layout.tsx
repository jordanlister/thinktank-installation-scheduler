// Think Tank Technologies Installation Scheduler - Main Layout Component

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import { useAppStore } from '../../stores/useAppStore';
import ErrorBoundary from '../common/ErrorBoundary';

export const Layout: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, error, clearError } = useAppStore();

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen relative" style={{ minHeight: '100vh' }}>
      {/* Ambient background effects - covers full page height */}
      <div className="absolute inset-0 pointer-events-none" style={{ minHeight: '100vh' }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-glass-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-400/4 rounded-full blur-3xl animate-glass-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-accent-600/3 rounded-full blur-3xl animate-glass-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Global error notification */}
      {error && (
        <div className="glass-strong border-error-500/30 text-white px-4 py-3 relative z-50 mx-4 mt-4 rounded-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 bg-error-500 rounded-full flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-white/80 hover:text-white ml-4 transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Close error notification"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative min-h-screen">
        {/* Navigation Sidebar - Fixed overlay */}
        <Navigation 
          sidebarOpen={sidebarOpen} 
          onClose={handleSidebarClose} 
        />

        {/* Header - Full width across entire screen */}
        <Header 
          onMenuToggle={handleMenuToggle} 
          sidebarOpen={sidebarOpen} 
        />
        
        {/* Main content area - Full width with left margin for collapsed sidebar */}
        <div className="ml-16 transition-none"
             style={{ 
               minHeight: 'calc(100vh - 3rem)',
               marginTop: '3rem' // Add top margin to push content below header
             }}>

          {/* Main content */}
          <main className="min-h-full">
            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-full">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;