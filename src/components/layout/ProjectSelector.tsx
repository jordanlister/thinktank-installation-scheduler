// Think Tank Technologies Installation Scheduler - Project Selector Component

import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderOpen, 
  ChevronDown, 
  Plus, 
  Search, 
  X, 
  Settings, 
  Users, 
  BarChart3, 
  Calendar,
  CheckCircle2,
  Clock,
  Pause,
  Archive
} from 'lucide-react';
import { useCurrentProject, useProjects, useTenant, useTenantPermissions } from '../../contexts/TenantProvider';
import type { Project, ProjectStatus } from '../../types';

interface ProjectSelectorProps {
  className?: string;
  showAllProjects?: boolean;
  compact?: boolean; // New prop for header usage
}

const ProjectStatusIcon: React.FC<{ status: ProjectStatus; className?: string }> = ({ status, className = 'h-4 w-4' }) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 className={`${className} text-green-400`} />;
    case 'planning':
      return <Clock className={`${className} text-blue-400`} />;
    case 'on_hold':
      return <Pause className={`${className} text-yellow-400`} />;
    case 'completed':
      return <CheckCircle2 className={`${className} text-green-500`} />;
    case 'archived':
      return <Archive className={`${className} text-gray-400`} />;
    default:
      return <FolderOpen className={`${className} text-white/60`} />;
  }
};

const ProjectStatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/20';
      case 'planning':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/20';
      case 'on_hold':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20';
      case 'completed':
        return 'bg-green-600/20 text-green-400 border-green-600/20';
      case 'archived':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/20';
      default:
        return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ className = '', showAllProjects = false, compact = false }) => {
  const currentProject = useCurrentProject();
  const projects = useProjects();
  const { switchProject, isLoading } = useTenant();
  const { hasOrgPermission } = useTenantPermissions();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Show all projects if showAllProjects is true, otherwise filter out archived
    return matchesSearch && (showAllProjects || project.status !== 'archived');
  });

  // Group projects by status
  const projectsByStatus = filteredProjects.reduce((acc, project) => {
    if (!acc[project.status]) {
      acc[project.status] = [];
    }
    acc[project.status].push(project);
    return acc;
  }, {} as Record<ProjectStatus, Project[]>);

  // Status order for display
  const statusOrder: ProjectStatus[] = ['active', 'planning', 'on_hold', 'completed', 'archived'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when menu opens
  useEffect(() => {
    if (showProjectMenu && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showProjectMenu]);

  const handleProjectSwitch = async (projectId: string | null) => {
    if ((projectId !== currentProject?.id) && !isLoading) {
      try {
        await switchProject(projectId);
        setShowProjectMenu(false);
        setSearchTerm('');
      } catch (error) {
        console.error('Failed to switch project:', error);
      }
    }
  };

  const formatProjectDates = (project: Project) => {
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const end = new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={dropdownRef}>
        <button
          onClick={() => setShowProjectMenu(!showProjectMenu)}
          className={`flex items-center ${compact ? 'space-x-2 px-3 py-2' : 'space-x-3 p-3'} bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 ${compact ? 'text-left' : 'w-full text-left'} group`}
          disabled={isLoading}
        >
          {/* Project Icon/Logo */}
          <div className="flex-shrink-0">
            {currentProject ? (
              <div className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} rounded-md flex items-center justify-center`} style={{ backgroundColor: currentProject.color || '#3B82F6' }}>
                <FolderOpen className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
              </div>
            ) : (
              <div className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} rounded-md bg-white/10 border border-white/20 flex items-center justify-center`}>
                <FolderOpen className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-white/60`} />
              </div>
            )}
          </div>
          
          {/* Project Details */}
          <div className={`${compact ? 'hidden sm:block' : 'flex-1'} min-w-0`}>
            {currentProject ? (
              <>
                <div className="flex items-center space-x-2">
                  <h3 className={`${compact ? 'text-sm' : 'text-sm'} font-semibold text-white truncate`}>{currentProject.name}</h3>
                  {!compact && <ProjectStatusBadge status={currentProject.status} />}
                </div>
                {!compact && (
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-xs text-white/60 truncate">
                      {currentProject.team.length} members
                    </p>
                    {formatProjectDates(currentProject) && (
                      <p className="text-xs text-white/60">
                        {formatProjectDates(currentProject)}
                      </p>
                    )}
                  </div>
                )}
                {compact && (
                  <div className="flex items-center space-x-2 mt-0.5">
                    <ProjectStatusBadge status={currentProject.status} />
                    {formatProjectDates(currentProject) && (
                      <p className="text-xs text-white/60 hidden md:block">
                        {formatProjectDates(currentProject)}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div>
                <h3 className={`${compact ? 'text-sm' : 'text-sm'} font-medium text-white/80`}>All Projects</h3>
                {!compact && <p className="text-xs text-white/60">Organization-wide view</p>}
              </div>
            )}
          </div>

          <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${showProjectMenu ? 'rotate-180' : ''} ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Project Dropdown Menu */}
        {showProjectMenu && (
          <div className={`absolute top-full ${compact ? 'left-0 w-80' : 'left-0 right-0'} mt-2 bg-black/90 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden`}>
            {/* Search Bar */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Project List */}
            <div className="max-h-64 overflow-y-auto">
              {/* All Projects Option */}
              <button
                onClick={() => handleProjectSwitch(null)}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 ${
                  !currentProject ? 'bg-white/5 text-white' : 'text-white/80'
                }`}
                disabled={isLoading}
              >
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">All Projects</h4>
                  <p className="text-xs text-white/60">Organization-wide dashboard</p>
                </div>
                {!currentProject && (
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                )}
              </button>

              {/* Projects by Status */}
              {statusOrder.map(status => {
                const statusProjects = projectsByStatus[status];
                if (!statusProjects || statusProjects.length === 0) return null;

                return (
                  <div key={status} className="border-t border-white/5">
                    <div className="px-4 py-2 bg-white/5">
                      <div className="flex items-center space-x-2">
                        <ProjectStatusIcon status={status} className="h-3 w-3" />
                        <h5 className="text-xs font-semibold text-white/70 uppercase tracking-wide capitalize">
                          {status.replace('_', ' ')} ({statusProjects.length})
                        </h5>
                      </div>
                    </div>
                    
                    {statusProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSwitch(project.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 ${
                          project.id === currentProject?.id ? 'bg-white/5 text-white' : 'text-white/80'
                        }`}
                        disabled={project.id === currentProject?.id || isLoading}
                      >
                        <div 
                          className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: project.color || '#3B82F6' }}
                        >
                          <FolderOpen className="h-4 w-4 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium truncate">{project.name}</h4>
                            {project.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-white/10 text-white/60 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-white/60">
                              {project.team.length} members
                            </p>
                            {formatProjectDates(project) && (
                              <p className="text-xs text-white/60">
                                {formatProjectDates(project)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle project settings
                            }}
                            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
                            title="Project Settings"
                          >
                            <Settings className="h-3 w-3" />
                          </button>
                        </div>

                        {project.id === currentProject?.id && (
                          <div className="h-2 w-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}

              {/* No Projects Found */}
              {filteredProjects.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <FolderOpen className="h-8 w-8 text-white/40 mx-auto mb-2" />
                  <p className="text-sm text-white/60">
                    {searchTerm ? 'No projects match your search' : 'No projects found'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {hasOrgPermission('manage_projects') && (
              <div className="border-t border-white/10 p-3">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setShowProjectMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center space-x-2 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Project</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 backdrop-filter backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
            <p className="text-white/60 mb-4">This is a placeholder for the create project modal.</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;