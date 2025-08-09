import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown,
  UserCircle 
} from 'lucide-react';
import { Button } from '../../ui';
import type { User as UserType } from '../../../types';

interface UserProfileDropdownProps {
  user: UserType;
  onSignOut: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownClick = (action?: () => void) => {
    setIsOpen(false);
    if (action) action();
  };

  const handleSignOut = () => {
    setIsOpen(false);
    onSignOut();
    navigate('/');
  };

  const getUserInitials = (user: UserType) => {
    if (!user.email) return 'U';
    if (user.full_name) {
      const names = user.full_name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getUserDisplayName = (user: UserType) => {
    return user.full_name || user.email;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/30"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-medium text-sm">
          {getUserInitials(user)}
        </div>
        
        {/* User Name (hidden on mobile) */}
        <span className="hidden sm:block text-sm font-medium text-white max-w-32 truncate">
          {getUserDisplayName(user)}
        </span>
        
        {/* Chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-glass backdrop-blur-xl rounded-xl border border-border shadow-xl z-50">
          <div className="p-3 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-medium">
                {getUserInitials(user)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            {/* Dashboard Link */}
            <Link
              to="/app"
              onClick={() => handleDropdownClick()}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {/* Profile Link */}
            <Link
              to="/app/settings"
              onClick={() => handleDropdownClick()}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>Profile</span>
            </Link>

            {/* Account Settings Link */}
            <Link
              to="/app/settings"
              onClick={() => handleDropdownClick()}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </Link>
          </div>

          <div className="border-t border-border py-2">
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;