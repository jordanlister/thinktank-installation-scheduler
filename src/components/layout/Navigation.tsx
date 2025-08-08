// Think Tank Technologies Installation Scheduler - Navigation Component

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Settings,
  Upload,
  X,
  ChevronRight,
  ChevronLeft
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
  ChevronRight,
  ChevronLeft,
};

interface NavigationProps {
  sidebarOpen: boolean;
  onClose: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ sidebarOpen, onClose }) => {
  const user = useUser();
  const { setCurrentPage } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  const [isHovered, setIsHovered] = useState(false);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Determine if sidebar should show full width (expanded state)
  // On mobile (when sidebarOpen is controlled externally), always show expanded
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const shouldShowExpanded = isMobile ? true : (!isCollapsed || isHovered);
  const sidebarWidth = shouldShowExpanded ? 'w-64' : 'w-16';

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - starts below header */}
      <aside
        className={`fixed left-0 z-50 bg-white shadow-lg border-r border-primary-200 transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          top: '4rem', // Start below the 64px header
          bottom: 0,
          width: shouldShowExpanded ? '16rem' : '4rem',
          transition: 'width 0.3s ease-in-out',
        }}
      >
        {/* Mobile close button */}
        <div className={`lg:hidden flex justify-end p-2 border-b border-primary-200 ${
          shouldShowExpanded ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-primary-600 hover:text-primary-900 hover:bg-primary-100"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className={`flex-1 py-6 space-y-2 ${shouldShowExpanded ? 'px-4' : 'px-2'}`}>
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            
            return (
              <div key={item.id} className="relative group/item">
                <NavLink
                  to={item.path}
                  onClick={() => handleNavClick(item.id)}
                  className={({ isActive }) =>
                    `flex items-center ${shouldShowExpanded ? 'px-3' : 'px-3 justify-center'} py-2 text-sm font-medium rounded-md transition-all duration-200 relative ${
                      isActive
                        ? 'bg-accent-100 text-accent-700 border-r-2 border-accent-600'
                        : 'text-primary-700 hover:bg-primary-100 hover:text-primary-900'
                    }`
                  }
                  title={!shouldShowExpanded ? item.label : undefined}
                >
                  {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                  <span className={`transition-all duration-300 ${
                    shouldShowExpanded ? 'opacity-100 ml-3 w-auto' : 'opacity-0 w-0 ml-0'
                  } whitespace-nowrap overflow-hidden`}>
                    {item.label}
                  </span>
                </NavLink>
                
                {/* Tooltip for collapsed state */}
                {!shouldShowExpanded && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full">
                      <div className="border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer - User role indicator */}
        <div className={`py-4 border-t border-primary-200 ${shouldShowExpanded ? 'px-4' : 'px-2'}`}>
          <div className={`flex items-center ${shouldShowExpanded ? 'space-x-3' : 'justify-center'}`}>
            <div className="h-8 w-8 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary-700">
                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${
              shouldShowExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}>
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