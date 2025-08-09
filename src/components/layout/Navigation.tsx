// Think Tank Technologies Installation Scheduler - Navigation Component

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
import { useUser } from '../../stores/useAppStore';

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
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Filter navigation items based on user role
  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (!user || !item.roles) return true;
    return item.roles.includes(user.role);
  });

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Sidebar is always collapsed on desktop, always expanded on mobile when open
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const shouldShowExpanded = isMobile || isHovered;

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
        className={`fixed left-0 z-30 nav-glass transform transition-all ease-linear ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          top: '4rem', // Create clean separation like Supabase (64px)
          bottom: 0,
          width: shouldShowExpanded ? '12rem' : '3rem',
          transitionDuration: '150ms',
          transitionProperty: 'width, transform',
        }}
      >
        {/* Mobile close button */}
        <div className={`lg:hidden flex justify-end p-3 border-b border-white/10 ${
          shouldShowExpanded ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className={`flex-1 pb-2 space-y-0.5 ${shouldShowExpanded ? 'px-2' : 'px-1'}`}>
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = location.pathname === item.path || 
              (item.path === '/app' && location.pathname === '/app');
            
            return (
              <div key={item.id} className="relative group">
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center ${shouldShowExpanded ? 'px-2' : 'px-1.5 justify-center'} py-1.5 text-sm font-normal rounded-md transition-colors duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                  title={!shouldShowExpanded ? item.label : undefined}
                >
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-150 ease-linear ${
                    shouldShowExpanded ? 'opacity-100 ml-2.5 w-auto' : 'opacity-0 ml-0 w-0'
                  }`}>
                    {item.label}
                  </span>
                </NavLink>
                
                {/* Tooltip for collapsed state */}
                {!shouldShowExpanded && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      </aside>
    </>
  );
};

export default Navigation;