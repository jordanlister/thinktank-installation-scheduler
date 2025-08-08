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
        className={`fixed left-0 z-50 nav-glass transform transition-all duration-300 ease-in-out ${
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
        <div className={`lg:hidden flex justify-end p-3 border-b border-white/10 ${
          shouldShowExpanded ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
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
                    `flex items-center ${shouldShowExpanded ? 'px-4' : 'px-3 justify-center'} py-3 text-sm font-medium rounded-lg transition-all duration-300 relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-accent-500/20 to-accent-400/10 text-accent-300 border-r-2 border-accent-500 shadow-glow-accent'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
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
                  {/* Active indicator glow */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </NavLink>
                
                {/* Tooltip for collapsed state */}
                {!shouldShowExpanded && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-2 glass-strong text-white text-xs rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 shadow-glass-lg">
                    {item.label}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1">
                      <div className="border-4 border-transparent border-r-white/20"></div>
                    </div>
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