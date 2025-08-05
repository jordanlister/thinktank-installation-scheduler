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
    <div className="min-h-screen bg-gray-50">
      {/* Global error notification */}
      {error && (
        <div className="bg-error-600 text-white px-4 py-3 relative">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={clearError}
              className="text-white hover:text-error-100 ml-4"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Navigation Sidebar */}
        <Navigation 
          sidebarOpen={sidebarOpen} 
          onClose={handleSidebarClose} 
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            onMenuToggle={handleMenuToggle} 
            sidebarOpen={sidebarOpen} 
          />

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="py-6">
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