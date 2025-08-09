// Think Tank Technologies Installation Scheduler - Clean Sidebar Navigation
// Supabase-inspired clean sidebar design with consistent width and minimal styling

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Settings,
  Upload,
  Bell,
  X,
  BarChart3,
  FolderOpen
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../constants';
import { useUser } from '../../stores/useAppStore';
import { useCurrentProject, useTenantPermissions } from '../../contexts/TenantProvider';

// Icon mapping for dynamic icon rendering
const iconMap = {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  FileText,
  Upload,
  Bell,
  Settings,
  BarChart3,
  FolderOpen,
};

interface NavigationProps {
  sidebarOpen: boolean;
  onClose: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ sidebarOpen, onClose }) => {
  const user = useUser();
  const location = useLocation();
  const currentProject = useCurrentProject();
  const { hasProjectPermission } = useTenantPermissions();

  // Filter navigation items based on user role and tenant permissions
  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (!user || !item.roles) return true;
    
    // Check user role
    const hasUserRole = item.roles.includes(user.role);
    if (!hasUserRole) return false;

    // Additional project-level permission checks when in project context
    if (currentProject) {
      switch (item.id) {
        case 'installations':
          return hasProjectPermission('manage_installations');
        case 'assignments':
          return hasProjectPermission('manage_assignments');
        case 'schedules':
          return hasProjectPermission('manage_schedules');
        case 'reports':
          return hasProjectPermission('manage_reports');
        case 'settings':
          return hasProjectPermission('update_project');
        default:
          return true;
      }
    }
    
    return true;
  });

  const handleNavClick = () => {
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Hover to expand design - Truly fixed positioning */}
      <aside
        className={`sidebar-fixed sidebar-no-scroll bg-white/5 backdrop-filter backdrop-blur-md border-r border-white/10 transform transition-all duration-300 ease-out group hover:w-64 w-16 lg:w-16 lg:hover:w-64 ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Project selector moved to header - this space can be used for other navigation elements */}

        {/* Navigation menu with proper scrolling wrapper */}
        <div className="sidebar-content">
          <nav className="flex-1 p-2 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = location.pathname === item.path || 
              (item.path === '/app' && location.pathname === '/app');
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleNavClick}
                title={item.label}
                className={({ isActive: linkActive }) => `
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 group-hover:justify-start justify-center
                  ${(isActive || linkActive)
                    ? 'bg-white/15 text-white shadow-sm border border-white/20'
                    : 'text-white/80 hover:bg-white/10 hover:text-white border border-transparent'
                  }
                `}
              >
                <div className="flex items-center space-x-3 w-full">
                  {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                  <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              </NavLink>
            );
          })}
          </nav>

          {/* Bottom section - Optional status or help */}
        <div className="p-2 border-t border-white/10 mt-auto">
          <div className="text-xs text-white/60 text-center group-hover:text-left transition-all duration-300">
            <p className="mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Installation Scheduler</p>
            <p className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">v2.0</p>
          </div>
        </div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;