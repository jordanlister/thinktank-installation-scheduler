// Think Tank Technologies Installation Scheduler - Multi-Tenant Context Provider

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import type { 
  Organization, 
  Project, 
  TenantContext, 
  TenantActions, 
  OrganizationRole, 
  ProjectRole,
  OrganizationPermission,
  ProjectPermission
} from '../types';
import { useAppStore } from '../stores/useAppStore';

// Tenant context state and actions
interface TenantProviderProps {
  children: React.ReactNode;
}

// Context definition
const TenantContext = createContext<(TenantContext & TenantActions) | undefined>(undefined);

// Action types for reducer
type TenantAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_PROJECT'; payload: Project | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_USER_ROLE'; payload: OrganizationRole | null }
  | { type: 'SET_PROJECT_ROLE'; payload: ProjectRole | null }
  | { type: 'SET_PERMISSIONS'; payload: { organization: OrganizationPermission[]; project: ProjectPermission[] } }
  | { type: 'UPDATE_PROJECT'; payload: { projectId: string; updates: Partial<Project> } }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'REMOVE_PROJECT'; payload: string };

// Initial state
const initialState: TenantContext = {
  organization: null,
  project: null,
  userRole: null,
  projectRole: null,
  permissions: {
    organization: [],
    project: []
  },
  projects: [],
  isLoading: false,
  error: null
};

// Reducer function
function tenantReducer(state: TenantContext, action: TenantAction): TenantContext {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_ORGANIZATION':
      return { ...state, organization: action.payload };
    
    case 'SET_PROJECT':
      return { ...state, project: action.payload };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };
    
    case 'SET_PROJECT_ROLE':
      return { ...state, projectRole: action.payload };
    
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : p
        ),
        project: state.project?.id === action.payload.projectId
          ? { ...state.project, ...action.payload.updates, updatedAt: new Date().toISOString() }
          : state.project
      };
    
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload]
      };
    
    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        project: state.project?.id === action.payload ? null : state.project
      };
    
    default:
      return state;
  }
}

// Mock data for development - will be replaced with API calls
const mockOrganization: Organization = {
  id: 'org-1',
  name: 'Think Tank Technologies',
  slug: 'think-tank-tech',
  description: 'Leading installation scheduling platform',
  logoUrl: '/thinktanklogo.png',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#F59E0B',
  settings: {
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    language: 'en',
    allowPublicProjects: false,
    requireProjectApproval: true,
    maxProjectsPerUser: 10,
    defaultUserRole: 'scheduler' as any
  },
  subscription: {
    plan: 'professional',
    status: 'active',
    startDate: '2024-01-01',
    maxUsers: 50,
    maxProjects: 25,
    features: ['advanced_analytics', 'custom_branding', 'api_access'],
    billingCycle: 'monthly'
  },
  contact: {
    email: 'hello@thinktanktech.com',
    phone: '+1 (555) 123-4567',
    billingEmail: 'billing@thinktanktech.com',
    supportEmail: 'support@thinktanktech.com'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-08-09T00:00:00Z',
  isActive: true,
  memberCount: 15,
  projectCount: 8
};

const mockProjects: Project[] = [
  {
    id: 'project-1',
    organizationId: 'org-1',
    name: 'Starbucks Rollout Q3',
    slug: 'starbucks-rollout-q3',
    description: 'Q3 nationwide Starbucks installation project',
    status: 'active',
    visibility: 'organization',
    settings: {
      allowExternalSharing: false,
      requireApprovalForChanges: true,
      enableTimeTracking: true,
      defaultTaskPriority: 'medium',
      autoAssignTasks: true,
      notificationsEnabled: true,
      customFields: []
    },
    team: [],
    tags: ['retail', 'nationwide', 'q3'],
    color: '#10B981',
    startDate: '2024-07-01',
    endDate: '2024-09-30',
    budget: {
      total: 150000,
      spent: 45000,
      currency: 'USD',
      trackingEnabled: true,
      approvalRequired: true
    },
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-08-09T00:00:00Z',
    createdBy: 'user-1',
    lastActivityAt: '2024-08-09T00:00:00Z'
  },
  {
    id: 'project-2',
    organizationId: 'org-1',
    name: 'Regional Expansion East',
    slug: 'regional-expansion-east',
    description: 'Expanding operations to eastern markets',
    status: 'planning',
    visibility: 'organization',
    settings: {
      allowExternalSharing: false,
      requireApprovalForChanges: false,
      enableTimeTracking: true,
      defaultTaskPriority: 'high',
      autoAssignTasks: false,
      notificationsEnabled: true,
      customFields: []
    },
    team: [],
    tags: ['expansion', 'east-coast', 'planning'],
    color: '#F59E0B',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    budget: {
      total: 200000,
      spent: 0,
      currency: 'USD',
      trackingEnabled: true,
      approvalRequired: true
    },
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-09T00:00:00Z',
    createdBy: 'user-1',
    lastActivityAt: '2024-08-09T00:00:00Z'
  }
];

// Provider component
export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tenantReducer, initialState);
  const { user } = useAppStore();

  // Initialize with mock data on mount
  useEffect(() => {
    const initializeTenant = async () => {
      if (!user) return;

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // In a real app, this would be API calls
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
        
        dispatch({ type: 'SET_ORGANIZATION', payload: mockOrganization });
        dispatch({ type: 'SET_PROJECTS', payload: mockProjects });
        dispatch({ type: 'SET_PROJECT', payload: mockProjects[0] }); // Set first project as current
        dispatch({ type: 'SET_USER_ROLE', payload: 'admin' });
        dispatch({ type: 'SET_PROJECT_ROLE', payload: 'admin' });
        dispatch({
          type: 'SET_PERMISSIONS',
          payload: {
            organization: ['manage_organization', 'manage_members', 'manage_projects', 'manage_settings', 'view_analytics', 'export_data'],
            project: ['read_project', 'update_project', 'manage_members', 'manage_installations', 'manage_assignments', 'manage_schedules', 'manage_reports', 'view_analytics', 'export_data']
          }
        });
      } catch (error) {
        console.error('Failed to initialize tenant:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load organization data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeTenant();
  }, [user]);

  // Action implementations
  const switchOrganization = useCallback(async (organizationId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For now, just use mock data
      if (organizationId === mockOrganization.id) {
        dispatch({ type: 'SET_ORGANIZATION', payload: mockOrganization });
        dispatch({ type: 'SET_PROJECTS', payload: mockProjects });
        dispatch({ type: 'SET_PROJECT', payload: null }); // Reset project when switching org
      } else {
        throw new Error('Organization not found');
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to switch organization' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const switchProject = useCallback(async (projectId: string | null) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      if (projectId === null) {
        dispatch({ type: 'SET_PROJECT', payload: null });
        dispatch({ type: 'SET_PROJECT_ROLE', payload: null });
        dispatch({
          type: 'SET_PERMISSIONS',
          payload: {
            organization: state.permissions.organization,
            project: []
          }
        });
      } else {
        const project = state.projects.find(p => p.id === projectId);
        if (project) {
          dispatch({ type: 'SET_PROJECT', payload: project });
          dispatch({ type: 'SET_PROJECT_ROLE', payload: 'admin' }); // Mock role
          dispatch({
            type: 'SET_PERMISSIONS',
            payload: {
              organization: state.permissions.organization,
              project: ['read_project', 'update_project', 'manage_members', 'manage_installations', 'manage_assignments', 'manage_schedules', 'manage_reports', 'view_analytics', 'export_data']
            }
          });
        } else {
          throw new Error('Project not found');
        }
      }
    } catch (error) {
      console.error('Failed to switch project:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to switch project' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.projects, state.permissions.organization]);

  const refreshTenantData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Simulate API calls to refresh data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch({ type: 'SET_PROJECTS', payload: mockProjects });
      if (state.project) {
        const updatedProject = mockProjects.find(p => p.id === state.project!.id);
        if (updatedProject) {
          dispatch({ type: 'SET_PROJECT', payload: updatedProject });
        }
      }
    } catch (error) {
      console.error('Failed to refresh tenant data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.project]);

  const createProject = useCallback(async (projectData: Partial<Project>): Promise<Project> => {
    if (!state.organization) {
      throw new Error('No organization selected');
    }

    const newProject: Project = {
      id: `project-${Date.now()}`,
      organizationId: state.organization.id,
      name: projectData.name || 'New Project',
      slug: projectData.slug || `new-project-${Date.now()}`,
      description: projectData.description,
      status: projectData.status || 'planning',
      visibility: projectData.visibility || 'private',
      settings: projectData.settings || {
        allowExternalSharing: false,
        requireApprovalForChanges: false,
        enableTimeTracking: true,
        defaultTaskPriority: 'medium',
        autoAssignTasks: true,
        notificationsEnabled: true,
        customFields: []
      },
      team: [],
      tags: projectData.tags || [],
      color: projectData.color || '#3B82F6',
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      budget: projectData.budget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.id || 'unknown',
      lastActivityAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_PROJECT', payload: newProject });
    return newProject;
  }, [state.organization, user]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { projectId, updates } });
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    dispatch({ type: 'REMOVE_PROJECT', payload: projectId });
  }, []);

  const inviteToProject = useCallback(async (projectId: string, email: string, role: ProjectRole) => {
    // Mock implementation
    console.log(`Inviting ${email} to project ${projectId} with role ${role}`);
  }, []);

  const updateMemberRole = useCallback(async (projectId: string, memberId: string, role: ProjectRole) => {
    // Mock implementation
    console.log(`Updating member ${memberId} in project ${projectId} to role ${role}`);
  }, []);

  const removeMember = useCallback(async (projectId: string, memberId: string) => {
    // Mock implementation
    console.log(`Removing member ${memberId} from project ${projectId}`);
  }, []);

  // Context value
  const contextValue = useMemo(
    () => ({
      ...state,
      switchOrganization,
      switchProject,
      refreshTenantData,
      createProject,
      updateProject,
      deleteProject,
      inviteToProject,
      updateMemberRole,
      removeMember
    }),
    [
      state,
      switchOrganization,
      switchProject,
      refreshTenantData,
      createProject,
      updateProject,
      deleteProject,
      inviteToProject,
      updateMemberRole,
      removeMember
    ]
  );

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook to use tenant context
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Utility hooks for specific tenant data
export const useOrganization = () => {
  const { organization } = useTenant();
  return organization;
};

export const useCurrentProject = () => {
  const { project } = useTenant();
  return project;
};

export const useProjects = () => {
  const { projects } = useTenant();
  return projects;
};

export const useTenantPermissions = () => {
  const { permissions, userRole, projectRole } = useTenant();
  
  const hasOrgPermission = useCallback((permission: OrganizationPermission) => {
    return permissions.organization.includes(permission);
  }, [permissions.organization]);

  const hasProjectPermission = useCallback((permission: ProjectPermission) => {
    return permissions.project.includes(permission);
  }, [permissions.project]);

  const canManageOrganization = useCallback(() => {
    return hasOrgPermission('manage_organization');
  }, [hasOrgPermission]);

  const canManageProjects = useCallback(() => {
    return hasOrgPermission('manage_projects');
  }, [hasOrgPermission]);

  const canManageCurrentProject = useCallback(() => {
    return hasProjectPermission('update_project');
  }, [hasProjectPermission]);

  return {
    permissions,
    userRole,
    projectRole,
    hasOrgPermission,
    hasProjectPermission,
    canManageOrganization,
    canManageProjects,
    canManageCurrentProject
  };
};