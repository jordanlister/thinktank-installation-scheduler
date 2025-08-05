// Think Tank Technologies Installation Scheduler - Navigation Component

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Settings,
  Upload,
  X 
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../constants';
import { useUser, useAppStore } from '../../stores/useAppStore';

// Icon mapping for dynamic icon rendering
const iconMap = {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  FileText,
  Upload,
  Settings,
};

interface NavigationProps {
  sidebarOpen: boolean;
  onClose: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ sidebarOpen, onClose }) => {
  const user = useUser();
  const { setCurrentPage } = useAppStore();

  // Filter navigation items based on user role
  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (!user || !item.roles) return true;
    return item.roles.includes(user.role);
  });

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-primary-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-primary-200 bg-white">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-accent-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">TT</span>
            </div>
            <div className="ml-3">
              <h2 className="text-sm font-semibold text-primary-900">
                Installation Scheduler
              </h2>
            </div>
          </div>
          
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="p-2 rounded-md text-primary-600 hover:text-primary-900 hover:bg-primary-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => handleNavClick(item.id)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-100 text-accent-700 border-r-2 border-accent-600'
                      : 'text-primary-700 hover:bg-primary-100 hover:text-primary-900'
                  }`
                }
              >
                {Icon && <Icon className="h-5 w-5 mr-3 flex-shrink-0" />}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer - User role indicator */}
        <div className="px-4 py-4 border-t border-primary-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700">
                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
              </p>
              <p className="text-xs text-primary-600 capitalize">
                {user?.role || 'No Role'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;