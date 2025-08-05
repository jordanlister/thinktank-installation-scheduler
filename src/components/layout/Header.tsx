// Think Tank Technologies Installation Scheduler - Header Component

import React from 'react';
import { Menu, X, Bell, User, LogOut } from 'lucide-react';
import { useAppStore, useUser } from '../../stores/useAppStore';
import { formatName } from '../../utils';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, sidebarOpen }) => {
  const user = useUser();
  const { setAuthenticated, setUser } = useAppStore();

  const handleSignOut = async () => {
    // Add sign out logic here with Supabase
    setAuthenticated(false);
    setUser(null);
  };

  return (
    <header className="bg-white shadow-sm border-b border-primary-200">
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16">
        {/* Left section - Logo and menu toggle */}
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md text-primary-600 hover:text-primary-900 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-accent-500 lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          <div className="flex items-center ml-4 lg:ml-0">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-accent-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">TT</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-primary-900 hidden sm:block">
                Think Tank Technologies
              </h1>
              <p className="text-sm text-primary-600 hidden sm:block">
                Installation Scheduler
              </p>
            </div>
          </div>
        </div>

        {/* Right section - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            className="p-2 rounded-md text-primary-600 hover:text-primary-900 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-accent-500 relative"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            {/* Notification badge - can be conditionally rendered */}
            <span className="absolute top-1 right-1 h-2 w-2 bg-error-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <div className="flex items-center space-x-3">
              {/* User avatar */}
              <div className="h-8 w-8 bg-primary-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              
              {/* User info - hidden on mobile */}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-primary-900">
                  {user ? formatName(user.firstName, user.lastName) : 'Unknown User'}
                </p>
                <p className="text-xs text-primary-600 capitalize">
                  {user?.role || 'No Role'}
                </p>
              </div>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                className="p-2 rounded-md text-primary-600 hover:text-primary-900 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile user info - shown when sidebar is closed */}
      {!sidebarOpen && (
        <div className="lg:hidden px-4 py-2 border-t border-primary-200 bg-primary-50">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 bg-primary-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-900">
                {user ? formatName(user.firstName, user.lastName) : 'Unknown User'}
              </p>
              <p className="text-xs text-primary-600 capitalize">
                {user?.role || 'No Role'}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;