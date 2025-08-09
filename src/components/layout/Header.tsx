// Think Tank Technologies Installation Scheduler - Consolidated Header Component
// Clean Supabase-inspired design with organization and user controls in single header

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  UserCircle, 
  ChevronDown,
  Building2,
  Users,
  CreditCard,
  HelpCircle,
  Plus
} from 'lucide-react';
import { useAppStore, useUser } from '../../stores/useAppStore';
import { useOrganization, useTenant, useTenantPermissions } from '../../contexts/TenantProvider';
import { formatName } from '../../utils';
import { SimpleConnectionStatus } from '../common/SimpleConnectionStatus';
import NotificationBell from '../common/NotificationBell';
import ProjectSelector from './ProjectSelector';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, sidebarOpen }) => {
  const user = useUser();
  const organization = useOrganization();
  const { switchOrganization, isLoading } = useTenant();
  const { hasOrgPermission } = useTenantPermissions();
  const { setAuthenticated, setUser } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Mock list of available organizations for switching
  const availableOrganizations = [
    {
      id: 'org-1',
      name: 'Think Tank Technologies',
      slug: 'think-tank-tech',
      logoUrl: '/thinktanklogo.png',
      isActive: true
    },
    {
      id: 'org-2',
      name: 'Demo Organization',
      slug: 'demo-org',
      logoUrl: '/thinktanklogo.png',
      isActive: false
    }
  ];

  const handleSignOut = async () => {
    setAuthenticated(false);
    setUser(null);
    setShowUserMenu(false);
    setShowOrgMenu(false);
  };

  const handleOrganizationSwitch = async (orgId: string) => {
    if (orgId !== organization?.id && !isLoading) {
      try {
        await switchOrganization(orgId);
        setShowOrgMenu(false);
      } catch (error) {
        console.error('Failed to switch organization:', error);
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setShowOrgMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!organization) {
    return (
      <header className="bg-white/5 backdrop-filter backdrop-blur-md border-b border-white/10 h-16 flex items-center px-6">
        <div className="animate-pulse text-white/60">Loading...</div>
      </header>
    );
  }

  return (
    <header className="bg-white/5 backdrop-filter backdrop-blur-md border-b border-white/10 h-16 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-full px-6 max-w-none">
        {/* Left section - Logo, org info, and mobile menu toggle */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>

          {/* Organization selector */}
          <div className="relative" ref={orgDropdownRef}>
            <button
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className="flex items-center space-x-3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              disabled={isLoading}
            >
              {/* Organization Logo */}
              <img 
                src={organization.logoUrl || '/thinktanklogo.png'} 
                alt={`${organization.name} Logo`}
                className="h-6 w-6 rounded-lg object-cover"
              />
              
              {/* Organization Details - Desktop only */}
              <div className="hidden sm:block text-left">
                <h2 className="text-sm font-semibold text-white">{organization.name}</h2>
              </div>

              <ChevronDown className={`h-4 w-4 text-white/70 transition-transform ${showOrgMenu ? 'rotate-180' : ''} ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Organization Dropdown Menu */}
            {showOrgMenu && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-black/95 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[60]">
                {/* Current Organization Section */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={organization.logoUrl || '/thinktanklogo.png'} 
                      alt={organization.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{organization.name}</h3>
                      <p className="text-xs text-white/60">{organization.contact.email}</p>
                    </div>
                  </div>
                </div>

                {/* Organization Actions */}
                <div className="py-2">
                  {hasOrgPermission('manage_organization') && (
                    <button className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Organization Settings</span>
                    </button>
                  )}
                  
                  {hasOrgPermission('manage_members') && (
                    <button className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Manage Members</span>
                    </button>
                  )}
                  
                  {hasOrgPermission('manage_billing') && (
                    <button className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Billing & Subscription</span>
                    </button>
                  )}
                </div>

                {/* Switch Organization Section */}
                {availableOrganizations.length > 1 && (
                  <>
                    <div className="border-t border-white/10 py-2">
                      <div className="px-4 py-2">
                        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wide">Switch Organization</h4>
                      </div>
                      {availableOrganizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => handleOrganizationSwitch(org.id)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center space-x-2 ${
                            org.id === organization.id ? 'bg-white/5 text-white' : 'text-white/80'
                          }`}
                          disabled={org.id === organization.id || isLoading}
                        >
                          <img 
                            src={org.logoUrl} 
                            alt={org.name}
                            className="h-6 w-6 rounded object-cover"
                          />
                          <span className="flex-1">{org.name}</span>
                          {org.id === organization.id && (
                            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Create New Organization */}
                    <div className="border-t border-white/10 py-2">
                      <button className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create New Organization</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Footer Actions */}
                <div className="border-t border-white/10 py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Project Selector - Positioned after organization selector */}
          <div className="hidden md:block ml-4">
            <ProjectSelector compact className="min-w-fit" />
          </div>

          {/* Subscription Status - Desktop only */}
          <div className="hidden xl:flex items-center space-x-2 text-sm">
            <span className="text-white/60">Plan:</span>
            <span className={`px-2 py-1 rounded-full text-xs capitalize ${
              organization.subscription.status === 'active'
                ? 'bg-green-500/20 text-green-300 border border-green-500/20'
                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20'
            }`}>
              {organization.subscription.plan}
            </span>
            <span className="text-white/60">
              ({organization.subscription.maxUsers - organization.memberCount} seats available)
            </span>
          </div>
        </div>

        {/* Right section - Connection status, notifications, and user menu */}
        <div className="flex items-center space-x-3">
          {/* Connection Status - Desktop only */}
          <SimpleConnectionStatus className="hidden lg:flex" />
          
          {/* Notifications */}
          <NotificationBell />

          {/* User menu dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="User menu"
            >
              {/* User avatar */}
              <div className="h-6 w-6 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center border border-white/20">
                <User className="h-3 w-3 text-white/90" />
              </div>
              
              {/* User info - Desktop only */}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white leading-tight">
                  {user ? formatName(user.firstName, user.lastName) : 'Unknown User'}
                </p>
                <p className="text-xs text-white/70 capitalize leading-tight">
                  {user?.role || 'No Role'}
                </p>
              </div>

              <ChevronDown className={`h-4 w-4 text-white/70 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[60]">
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
    </header>
  );
};

export default Header;