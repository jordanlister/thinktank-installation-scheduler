// Think Tank Technologies Installation Scheduler - Breadcrumbs Component

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Building2, 
  FolderOpen, 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Upload, 
  Bell, 
  Settings,
  BarChart3
} from 'lucide-react';
import { useOrganization, useCurrentProject } from '../../contexts/TenantProvider';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  isClickable?: boolean;
}

interface BreadcrumbsProps {
  className?: string;
  maxItems?: number;
  showIcons?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  className = '', 
  maxItems = 5, 
  showIcons = true 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const organization = useOrganization();
  const currentProject = useCurrentProject();

  // Icon mapping for different page types
  const getPageIcon = (path: string) => {
    if (path.includes('/dashboard') || path === '/app') return <LayoutDashboard className="h-4 w-4" />;
    if (path.includes('/schedules')) return <Calendar className="h-4 w-4" />;
    if (path.includes('/installations')) return <MapPin className="h-4 w-4" />;
    if (path.includes('/assignments')) return <Users className="h-4 w-4" />;
    if (path.includes('/team')) return <Users className="h-4 w-4" />;
    if (path.includes('/reports')) return <FileText className="h-4 w-4" />;
    if (path.includes('/data-processing')) return <Upload className="h-4 w-4" />;
    if (path.includes('/notifications')) return <Bell className="h-4 w-4" />;
    if (path.includes('/settings')) return <Settings className="h-4 w-4" />;
    if (path.includes('/analytics')) return <BarChart3 className="h-4 w-4" />;
    return <LayoutDashboard className="h-4 w-4" />;
  };

  // Get readable label for path segments
  const getPageLabel = (segment: string) => {
    const labelMap: { [key: string]: string } = {
      'app': 'Dashboard',
      'dashboard': 'Dashboard',
      'schedules': 'Schedules',
      'installations': 'Installations',
      'assignments': 'Assignments',
      'team': 'Team Management',
      'reports': 'Reports',
      'data-processing': 'Data Processing',
      'notifications': 'Notifications',
      'settings': 'Settings',
      'analytics': 'Analytics'
    };
    
    return labelMap[segment] || segment.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Build breadcrumb items based on current location and tenant context
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Always start with organization
    if (organization) {
      items.push({
        label: organization.name,
        path: currentProject ? undefined : '/app', // Only clickable if not in project context
        icon: showIcons ? <Building2 className="h-4 w-4" /> : undefined,
        isClickable: !currentProject
      });
    }

    // Add project if one is selected
    if (currentProject) {
      items.push({
        label: currentProject.name,
        path: '/app',
        icon: showIcons ? (
          <div 
            className="h-4 w-4 rounded flex items-center justify-center"
            style={{ backgroundColor: currentProject.color || '#3B82F6' }}
          >
            <FolderOpen className="h-3 w-3 text-white" />
          </div>
        ) : undefined,
        isClickable: true
      });
    }

    // Add page-specific breadcrumbs
    if (pathSegments.length > 0) {
      let currentPath = '';
      
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        
        // Skip 'app' segment as it's represented by project/organization
        if (segment === 'app') return;
        
        const isLast = index === pathSegments.length - 1;
        const label = getPageLabel(segment);
        
        items.push({
          label,
          path: isLast ? undefined : currentPath,
          icon: showIcons ? getPageIcon(currentPath) : undefined,
          isActive: isLast,
          isClickable: !isLast
        });
      });
    }

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Handle breadcrumb click
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (item.path && item.isClickable) {
      navigate(item.path);
    }
  };

  // Truncate breadcrumbs if too many
  const displayBreadcrumbs = breadcrumbs.length > maxItems 
    ? [
        breadcrumbs[0], // Always show first (organization)
        { label: '...', isClickable: false } as BreadcrumbItem,
        ...breadcrumbs.slice(-(maxItems - 2)) // Show last few items
      ]
    : breadcrumbs;

  if (displayBreadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center">
        {displayBreadcrumbs.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-white/30 mx-2 flex-shrink-0" />
            )}
            
            {item.label === '...' ? (
              <span className="text-white/50 px-1">...</span>
            ) : item.isClickable ? (
              <button
                onClick={() => handleBreadcrumbClick(item)}
                className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors max-w-xs group text-sm"
                title={item.label}
              >
                {item.icon && (
                  <span className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                )}
                <span className="truncate font-normal">
                  {item.label}
                </span>
              </button>
            ) : (
              <div className={`flex items-center space-x-1.5 px-2 py-1 max-w-xs ${
                item.isActive ? 'text-white font-medium' : 'text-white/50'
              }`}>
                {item.icon && (
                  <span className="flex-shrink-0 opacity-60">{item.icon}</span>
                )}
                <span className="truncate text-sm" title={item.label}>
                  {item.label}
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Utility hook for getting current breadcrumb context
export const useBreadcrumbContext = () => {
  const location = useLocation();
  const organization = useOrganization();
  const currentProject = useCurrentProject();

  const getCurrentContext = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentPage = pathSegments[pathSegments.length - 1] || 'dashboard';
    
    return {
      organization: organization?.name || 'Unknown Organization',
      project: currentProject?.name || null,
      page: currentPage,
      fullPath: location.pathname,
      isProjectContext: !!currentProject,
      isOrganizationContext: !currentProject
    };
  };

  return getCurrentContext();
};

export default Breadcrumbs;