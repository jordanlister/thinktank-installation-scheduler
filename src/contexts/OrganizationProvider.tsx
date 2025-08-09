// Think Tank Technologies Installation Scheduler - Organization Context Provider
// Manages organization-wide state, user context, and tenant isolation

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabase';
import {
  AuthUser,
  Organization,
  Project,
  ProjectAssignment,
  OrganizationRole,
  ProjectRole,
  Permission,
  OrganizationActivity,
  UserInvitation,
  Subscription
} from '../types';

// Organization state interface
export interface OrganizationState {
  // Authentication & User Context
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Organization Context
  organization: Organization | null;
  subscription: Subscription | null;
  
  // Project Context
  currentProject: Project | null;
  projects: Project[];
  userProjectAssignments: ProjectAssignment[];
  
  // Permissions & RBAC
  permissions: Permission[];
  organizationRole: OrganizationRole | null;
  currentProjectRole: ProjectRole | null;
  
  // Organization Management
  organizationMembers: AuthUser[];
  pendingInvitations: UserInvitation[];
  recentActivity: OrganizationActivity[];
  
  // UI State
  error: string | null;
  notifications: OrganizationNotification[];
  lastUpdated: string | null;
}

export interface OrganizationNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  style: 'primary' | 'secondary' | 'danger';
}

// Action types for organization state management
type OrganizationAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_USER'; payload: AuthUser | null }
  | { type: 'SET_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_SUBSCRIPTION'; payload: Subscription | null }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_USER_PROJECT_ASSIGNMENTS'; payload: ProjectAssignment[] }
  | { type: 'SET_PERMISSIONS'; payload: Permission[] }
  | { type: 'SET_ORGANIZATION_MEMBERS'; payload: AuthUser[] }
  | { type: 'SET_PENDING_INVITATIONS'; payload: UserInvitation[] }
  | { type: 'SET_RECENT_ACTIVITY'; payload: OrganizationActivity[] }
  | { type: 'ADD_NOTIFICATION'; payload: OrganizationNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_LAST_UPDATED' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: OrganizationState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  organization: null,
  subscription: null,
  currentProject: null,
  projects: [],
  userProjectAssignments: [],
  permissions: [],
  organizationRole: null,
  currentProjectRole: null,
  organizationMembers: [],
  pendingInvitations: [],
  recentActivity: [],
  error: null,
  notifications: [],
  lastUpdated: null,
};

// Reducer function
function organizationReducer(state: OrganizationState, action: OrganizationAction): OrganizationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CURRENT_USER':
      const user = action.payload;
      return {
        ...state,
        currentUser: user,
        isAuthenticated: !!user,
        organization: user?.organization || null,
        permissions: user?.permissions || [],
        organizationRole: user?.organizationRole || null,
        userProjectAssignments: user?.projects || [],
        currentProject: user?.currentProject || null,
        currentProjectRole: user?.currentProject ? 
          user.projects.find(p => p.projectId === user.currentProject?.id)?.role || null : null,
      };
    
    case 'SET_ORGANIZATION':
      return { ...state, organization: action.payload };
    
    case 'SET_SUBSCRIPTION':
      return { ...state, subscription: action.payload };
    
    case 'SET_CURRENT_PROJECT':
      const project = action.payload;
      const projectRole = project && state.userProjectAssignments 
        ? state.userProjectAssignments.find(p => p.projectId === project.id)?.role || null
        : null;
      return { 
        ...state, 
        currentProject: project,
        currentProjectRole: projectRole 
      };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    
    case 'SET_USER_PROJECT_ASSIGNMENTS':
      return { ...state, userProjectAssignments: action.payload };
    
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    
    case 'SET_ORGANIZATION_MEMBERS':
      return { ...state, organizationMembers: action.payload };
    
    case 'SET_PENDING_INVITATIONS':
      return { ...state, pendingInvitations: action.payload };
    
    case 'SET_RECENT_ACTIVITY':
      return { ...state, recentActivity: action.payload };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications.slice(0, 49)] // Keep last 50
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'CLEAR_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'UPDATE_LAST_UPDATED':
      return { ...state, lastUpdated: new Date().toISOString() };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context interface
export interface OrganizationContextType {
  // State
  state: OrganizationState;
  
  // Authentication Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  getCurrentUser: () => Promise<AuthUser | null>;
  
  // Organization Actions
  switchProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  refreshOrganizationData: () => Promise<void>;
  
  // User Management
  inviteUser: (email: string, organizationRole: OrganizationRole, projectId?: string, projectRole?: ProjectRole) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, role: OrganizationRole) => Promise<{ success: boolean; error?: string }>;
  removeUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Project Management
  createProject: (name: string, description?: string) => Promise<{ success: boolean; projectId?: string; error?: string }>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Permissions & RBAC
  hasPermission: (resource: string, action: string, context?: any) => boolean;
  hasOrganizationRole: (role: OrganizationRole) => boolean;
  hasProjectRole: (projectId: string, role: ProjectRole) => boolean;
  
  // Notifications
  addNotification: (notification: Omit<OrganizationNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Utility
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// Create context
const OrganizationContext = createContext<OrganizationContextType | null>(null);

// Provider component props
export interface OrganizationProviderProps {
  children: React.ReactNode;
  autoLoad?: boolean;
  onAuthStateChange?: (user: AuthUser | null) => void;
  onError?: (error: string) => void;
}

// Provider component
export function OrganizationProvider({ 
  children, 
  autoLoad = true,
  onAuthStateChange,
  onError 
}: OrganizationProviderProps) {
  const [state, dispatch] = useReducer(organizationReducer, initialState);

  // Sign in action
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const response = await authService.signIn({ email, password });
    
    if (response.error) {
      dispatch({ type: 'SET_ERROR', payload: response.error });
      dispatch({ type: 'SET_LOADING', payload: false });
      onError?.(response.error);
      return { success: false, error: response.error };
    }

    if (response.user) {
      dispatch({ type: 'SET_CURRENT_USER', payload: response.user });
      await loadOrganizationData(response.user.organizationId);
      onAuthStateChange?.(response.user);
      
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: `Signed in as ${response.user.email}`
      });
    }

    dispatch({ type: 'SET_LOADING', payload: false });
    return { success: true };
  }, [onAuthStateChange, onError]);

  // Sign out action
  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const response = await authService.signOut();
    
    if (response.error) {
      dispatch({ type: 'SET_ERROR', payload: response.error });
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: response.error };
    }

    dispatch({ type: 'RESET_STATE' });
    onAuthStateChange?.(null);
    return { success: true };
  }, [onAuthStateChange]);

  // Get current user
  const getCurrentUser = useCallback(async (): Promise<AuthUser | null> => {
    const user = await authService.getCurrentUser();
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
    
    if (user) {
      await loadOrganizationData(user.organizationId);
    }
    
    return user;
  }, []);

  // Switch project context
  const switchProject = useCallback(async (projectId: string): Promise<{ success: boolean; error?: string }> => {
    const response = await authService.switchProject(projectId);
    
    if (response.success && state.currentUser) {
      // Refresh user context
      const updatedUser = await authService.getCurrentUser();
      dispatch({ type: 'SET_CURRENT_USER', payload: updatedUser });
      
      addNotification({
        type: 'info',
        title: 'Project switched',
        message: `Switched to ${updatedUser?.currentProject?.name || 'project'}`
      });
    }
    
    return response;
  }, [state.currentUser]);

  // Load organization data
  const loadOrganizationData = useCallback(async (organizationId: string): Promise<void> => {
    try {
      // Load organization projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (projectsError) throw projectsError;
      dispatch({ type: 'SET_PROJECTS', payload: projects || [] });

      // Load organization members
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select(`
          *,
          project_users (
            project_id,
            role,
            is_active,
            projects (name)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('first_name');

      if (membersError) throw membersError;
      
      // Transform members data
      const organizationMembers: AuthUser[] = (members || []).map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        organizationId: member.organization_id,
        organizationRole: member.role,
        organization: state.organization!, // Will be set by user context
        projects: (member.project_users || []).map((pu: any) => ({
          projectId: pu.project_id,
          projectName: pu.projects.name,
          role: pu.role,
          isActive: pu.is_active
        })),
        permissions: [], // Would be calculated based on roles
        settings: member.settings || {},
        lastLoginAt: member.last_login_at || ''
      }));

      dispatch({ type: 'SET_ORGANIZATION_MEMBERS', payload: organizationMembers });

      // Load pending invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;
      dispatch({ type: 'SET_PENDING_INVITATIONS', payload: invitations || [] });

      // Load subscription data
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (!subscriptionError && subscription) {
        dispatch({ type: 'SET_SUBSCRIPTION', payload: subscription });
      }

      // Load recent activity
      const { data: activity, error: activityError } = await supabase
        .from('organization_activities')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!activityError && activity) {
        dispatch({ type: 'SET_RECENT_ACTIVITY', payload: activity });
      }

      dispatch({ type: 'UPDATE_LAST_UPDATED' });
    } catch (error) {
      console.error('Failed to load organization data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load organization data' });
    }
  }, [state.organization]);

  // Refresh organization data
  const refreshOrganizationData = useCallback(async (): Promise<void> => {
    if (state.currentUser) {
      await loadOrganizationData(state.currentUser.organizationId);
    }
  }, [state.currentUser, loadOrganizationData]);

  // Invite user
  const inviteUser = useCallback(async (
    email: string, 
    organizationRole: OrganizationRole, 
    projectId?: string, 
    projectRole?: ProjectRole
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await authService.inviteUser(email, organizationRole, projectId, projectRole);
    
    if (response.success) {
      await refreshOrganizationData(); // Refresh to show new invitation
      addNotification({
        type: 'success',
        title: 'Invitation sent',
        message: `Invitation sent to ${email}`
      });
    }
    
    return response;
  }, [refreshOrganizationData]);

  // Check permissions
  const hasPermission = useCallback((resource: string, action: string, context?: any): boolean => {
    return authService.hasPermission(resource, action, context);
  }, []);

  // Check organization role
  const hasOrganizationRole = useCallback((role: OrganizationRole): boolean => {
    return state.organizationRole === role;
  }, [state.organizationRole]);

  // Check project role
  const hasProjectRole = useCallback((projectId: string, role: ProjectRole): boolean => {
    return state.userProjectAssignments.some(p => 
      p.projectId === projectId && p.role === role && p.isActive
    );
  }, [state.userProjectAssignments]);

  // Add notification
  const addNotification = useCallback((notification: Omit<OrganizationNotification, 'id' | 'timestamp' | 'read'>): void => {
    const fullNotification: OrganizationNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string): void => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  }, []);

  // Clear notification
  const clearNotification = useCallback((notificationId: string): void => {
    dispatch({ type: 'CLEAR_NOTIFICATION', payload: notificationId });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback((): void => {
    state.notifications.forEach(notification => {
      dispatch({ type: 'CLEAR_NOTIFICATION', payload: notification.id });
    });
  }, [state.notifications]);

  // Clear error
  const clearError = useCallback((): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Placeholder implementations for other methods
  const updateUserRole = useCallback(async (userId: string, role: OrganizationRole): Promise<{ success: boolean; error?: string }> => {
    // TODO: Implement user role update
    return { success: false, error: 'Not implemented yet' };
  }, []);

  const removeUser = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    // TODO: Implement user removal
    return { success: false, error: 'Not implemented yet' };
  }, []);

  const createProject = useCallback(async (name: string, description?: string): Promise<{ success: boolean; projectId?: string; error?: string }> => {
    // TODO: Implement project creation
    return { success: false, error: 'Not implemented yet' };
  }, []);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<{ success: boolean; error?: string }> => {
    // TODO: Implement project update
    return { success: false, error: 'Not implemented yet' };
  }, []);

  const deleteProject = useCallback(async (projectId: string): Promise<{ success: boolean; error?: string }> => {
    // TODO: Implement project deletion
    return { success: false, error: 'Not implemented yet' };
  }, []);

  // Initialize authentication state
  useEffect(() => {
    if (autoLoad) {
      getCurrentUser().finally(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      });
    }
  }, [autoLoad, getCurrentUser]);

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'RESET_STATE' });
        onAuthStateChange?.(null);
      } else if (event === 'SIGNED_IN' && session) {
        const user = await authService.getCurrentUser();
        dispatch({ type: 'SET_CURRENT_USER', payload: user });
        if (user) {
          await loadOrganizationData(user.organizationId);
          onAuthStateChange?.(user);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onAuthStateChange, loadOrganizationData]);

  // Context value
  const contextValue: OrganizationContextType = useMemo(() => ({
    state,
    signIn,
    signOut,
    getCurrentUser,
    switchProject,
    refreshOrganizationData,
    inviteUser,
    updateUserRole,
    removeUser,
    createProject,
    updateProject,
    deleteProject,
    hasPermission,
    hasOrganizationRole,
    hasProjectRole,
    addNotification,
    markNotificationRead,
    clearNotification,
    clearAllNotifications,
    isLoading: state.isLoading,
    error: state.error,
    clearError,
  }), [
    state,
    signIn,
    signOut,
    getCurrentUser,
    switchProject,
    refreshOrganizationData,
    inviteUser,
    updateUserRole,
    removeUser,
    createProject,
    updateProject,
    deleteProject,
    hasPermission,
    hasOrganizationRole,
    hasProjectRole,
    addNotification,
    markNotificationRead,
    clearNotification,
    clearAllNotifications,
    clearError,
  ]);

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Hook to use organization context
export function useOrganization(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

// Custom hooks for specific aspects of organization context
export function useOrganizationAuth() {
  const { signIn, signOut, getCurrentUser, state: { currentUser, isAuthenticated, isLoading } } = useOrganization();
  return { signIn, signOut, getCurrentUser, currentUser, isAuthenticated, isLoading };
}

export function useOrganizationProjects() {
  const { 
    state: { projects, currentProject, userProjectAssignments }, 
    switchProject, 
    createProject, 
    updateProject, 
    deleteProject 
  } = useOrganization();
  
  return { 
    projects, 
    currentProject, 
    userProjectAssignments, 
    switchProject, 
    createProject, 
    updateProject, 
    deleteProject 
  };
}

export function useOrganizationPermissions() {
  const { hasPermission, hasOrganizationRole, hasProjectRole, state: { permissions, organizationRole } } = useOrganization();
  return { hasPermission, hasOrganizationRole, hasProjectRole, permissions, organizationRole };
}

export function useOrganizationMembers() {
  const { 
    inviteUser, 
    updateUserRole, 
    removeUser, 
    state: { organizationMembers, pendingInvitations } 
  } = useOrganization();
  
  return { 
    inviteUser, 
    updateUserRole, 
    removeUser, 
    organizationMembers, 
    pendingInvitations 
  };
}

export default OrganizationProvider;