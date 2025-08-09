// Think Tank Technologies Installation Scheduler - Clean Layout Component
// Supabase-inspired layout with single header and clean sidebar positioning

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import Breadcrumbs from './Breadcrumbs';
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
    <div className="min-h-screen bg-black relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

      {/* Global error notification */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full mx-4">
          <div className="bg-red-500/20 border border-red-500/30 text-white px-4 py-3 rounded-lg backdrop-filter backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm font-medium">{error}</p>
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
        </div>
      )}

      {/* Single consolidated header */}
      <Header 
        onMenuToggle={handleMenuToggle} 
        sidebarOpen={sidebarOpen} 
      />

      {/* Navigation Sidebar */}
      <Navigation 
        sidebarOpen={sidebarOpen} 
        onClose={handleSidebarClose} 
      />

      {/* Main content area */}
      <div className="lg:ml-16 transition-all duration-300 ease-out">
        {/* Breadcrumbs bar */}
        <div className="sticky top-16 z-20 bg-white/5 backdrop-filter backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumbs />
          </div>
        </div>

        {/* Main content */}
        <main className="min-h-[calc(100vh-8rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;