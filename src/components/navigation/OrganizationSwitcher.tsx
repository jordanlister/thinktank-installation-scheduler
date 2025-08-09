// Think Tank Technologies - Organization and Project Switching Components
// Header navigation with organization context and project switching

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../ui/Button';
import { useOrganization } from '../../contexts/OrganizationProvider';
import { useProject } from '../../contexts/ProjectProvider';
import type { Project } from '../../types';

// Organization Header Component
export const OrganizationHeader: React.FC = () => {
  const { organization, userRole } = useOrganization();

  if (!organization) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          {/* Organization Logo */}
          {organization.branding?.logoUrl ? (
            <img
              src={organization.branding.logoUrl}
              alt={organization.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Organization Info */}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {organization.branding?.companyName || organization.name}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="capitalize">{userRole}</span>
              <span>•</span>
              <span>{organization.projects?.length || 0} projects</span>
              <span>•</span>
              <span>{organization.memberCount || 0} members</span>
            </div>
          </div>
        </div>

        {/* Organization Actions */}
        <div className="flex items-center space-x-3">
          {organization.subscriptionPlan && (
            <span className={`
              px-2.5 py-1 rounded-full text-xs font-medium
              ${organization.subscriptionPlan.id === 'free' 
                ? 'bg-gray-100 text-gray-700'
                : organization.subscriptionPlan.id === 'professional'
                ? 'bg-blue-100 text-blue-700'  
                : 'bg-purple-100 text-purple-700'
              }
            `}>
              {organization.subscriptionPlan.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Selector Component
export const ProjectSelector: React.FC = () => {
  const { currentProject, projects, switchProject } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleProjectSwitch = async (projectId: string) => {
    try {
      await switchProject(projectId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching project:', error);
    }
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-medium text-xs">
              {currentProject?.name.charAt(0).toUpperCase() || 'P'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900 truncate max-w-32">
            {currentProject?.name || 'Select Project'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Switch Project</h3>
              <p className="text-xs text-gray-500 mt-1">
                Select a project to work on
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSwitch(project.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50
                    ${currentProject?.id === project.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded flex items-center justify-center font-medium text-sm
                    ${currentProject?.id === project.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                    }
                  `}>
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`
                        text-sm font-medium truncate
                        ${currentProject?.id === project.id ? 'text-blue-900' : 'text-gray-900'}
                      `}>
                        {project.name}
                      </span>
                      {currentProject?.id === project.id && (
                        <svg className="w-4 h-4 text-blue-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                      <span>{project.memberCount || 0} members</span>
                      <span>•</span>
                      <span>{project.installationCount || 0} installations</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to project management
                  window.location.href = '/projects/new';
                }}
              >
                + Create New Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation Breadcrumbs Component
interface BreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const { organization } = useOrganization();
  const { project } = useProject();

  // Build breadcrumb items with organization and project context
  const contextItems = [
    {
      label: organization?.name || 'Organization',
      href: '/dashboard',
      current: false
    },
    ...(project ? [{
      label: project.name,
      href: `/projects/${project.id}`,
      current: false
    }] : []),
    ...items
  ];

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {contextItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            )}
            
            {item.current ? (
              <span className="text-sm font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Quick Actions Menu Component
export const QuickActionsMenu: React.FC = () => {
  const { organization, userRole } = useOrganization();
  const { project } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const quickActions = [
    {
      label: 'New Installation',
      icon: '📅',
      href: '/installations/new',
      show: project && ['admin', 'manager', 'scheduler'].includes(userRole || '')
    },
    {
      label: 'Team Members',
      icon: '👥',
      href: '/team',
      show: ['owner', 'admin', 'manager'].includes(userRole || '')
    },
    {
      label: 'Analytics',
      icon: '📊',
      href: '/analytics',
      show: ['owner', 'admin', 'manager'].includes(userRole || '')
    },
    {
      label: 'Settings',
      icon: '⚙️',
      href: '/settings',
      show: ['owner', 'admin'].includes(userRole || '')
    },
    {
      label: 'Project Settings',
      icon: '🔧',
      href: `/projects/${project?.id}/settings`,
      show: project && ['admin', 'manager'].includes(userRole || '')
    }
  ].filter(action => action.show);

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="Quick Actions"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider">
                Quick Actions
              </h3>
            </div>

            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsOpen(false);
                  router.push(action.href);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
              >
                <span className="text-sm">{action.icon}</span>
                <span className="text-sm font-medium text-gray-900">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Context Status Indicator Component
export const ContextStatusIndicator: React.FC = () => {
  const { organization, currentProject, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>No Organization</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      <span>
        {organization.name}
        {currentProject && (
          <>
            <span className="text-gray-400 mx-1">•</span>
            <span>{currentProject.name}</span>
          </>
        )}
      </span>
    </div>
  );
};

// Main Navigation Header Component
export const NavigationHeader: React.FC<{
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string; current?: boolean }>;
  actions?: React.ReactNode;
  showProjectSelector?: boolean;
}> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  showProjectSelector = true
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Breadcrumbs and Title */}
          <div className="flex-1 min-w-0">
            {breadcrumbs.length > 0 && (
              <Breadcrumbs items={breadcrumbs} className="mb-1" />
            )}
            
            <div className="flex items-center space-x-4">
              {title && (
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-500">{subtitle}</p>
                  )}
                </div>
              )}
              
              <ContextStatusIndicator />
            </div>
          </div>

          {/* Right Section - Actions and Selectors */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {showProjectSelector && <ProjectSelector />}
            
            <QuickActionsMenu />
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Badge Component for context switching
export const NotificationBadge: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 0, className = '' }) => {
  if (count === 0) return null;

  return (
    <span className={`
      inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full
      ${className}
    `}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default {
  OrganizationHeader,
  ProjectSelector,
  Breadcrumbs,
  QuickActionsMenu,
  ContextStatusIndicator,
  NavigationHeader,
  NotificationBadge
};