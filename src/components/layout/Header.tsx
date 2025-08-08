// Lead Route - Header Component

import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Bell, User, LogOut, Settings, UserCircle, ChevronDown } from 'lucide-react';
import { useAppStore, useUser } from '../../stores/useAppStore';
import { formatName } from '../../utils';
import { ConnectionStatus } from '../common/ConnectionStatus';
import NotificationBell from '../common/NotificationBell';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, sidebarOpen }) => {
  const user = useUser();
  const { setAuthenticated, setUser } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    // Add sign out logic here with Supabase
    setAuthenticated(false);
    setUser(null);
    setShowUserMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header-glass fixed top-0 left-0 right-0 z-60">
      <div className="flex justify-between items-center pr-4 sm:pr-6 lg:pr-8 h-12">
        {/* Left section - Logo and menu toggle */}
        <div className="flex items-center">
          <div className="flex items-center pl-4">
            <div className="flex-shrink-0">
              <img 
                src="/thinktanklogo.png" 
                alt="Lead Route Logo" 
                className="h-10 w-10 rounded-lg filter drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.3))'
                }}
              />
            </div>
          </div>
          
          <button
            onClick={onMenuToggle}
            className="btn-ghost ml-6 lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {/* Right section - Notifications and user menu */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <ConnectionStatus className="hidden sm:flex" />
          
          {/* Notifications */}
          <NotificationBell />

          {/* User menu dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-200 backdrop-filter backdrop-blur-md"
              aria-label="User menu"
            >
              {/* User avatar */}
              <div className="h-7 w-7 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center border border-white/20">
                <User className="h-4 w-4 text-white/90" />
              </div>
              
              {/* User info - hidden on mobile */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white leading-tight">
                  {user ? formatName(user.firstName, user.lastName) : 'Unknown User'}
                </p>
                <p className="text-xs text-white/70 capitalize leading-tight">
                  {user?.role || 'No Role'}
                </p>
              </div>

              <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Add profile navigation logic
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-2"
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Add account settings navigation logic
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </button>
                  
                  <div className="border-t border-white/20 mt-2 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile user info - shown when sidebar is closed */}
      {!sidebarOpen && (
        <div className="lg:hidden px-4 py-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center space-x-3">
            <div className="h-7 w-7 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center border border-white/20">
              <User className="h-4 w-4 text-white/90" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {user ? formatName(user.firstName, user.lastName) : 'Unknown User'}
              </p>
              <p className="text-xs text-white/70 capitalize">
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