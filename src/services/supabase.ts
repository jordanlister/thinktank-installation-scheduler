// Think Tank Technologies Installation Scheduler - Multi-Tenant Supabase Configuration

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface OrganizationContext {
  organizationId: string;
  organizationSlug: string;
  organizationRole: string;
  projects: Array<{
    projectId: string;
    projectName: string;
    projectRole: string;
    isActive: boolean;
  }>;
}

// Create mock client for cases where environment variables are missing
const mockClient = {
  auth: {
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: new Error('Supabase not configured') }),
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase not configured') }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null })
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    delete: () => Promise.resolve({ error: new Error('Supabase not configured') })
  }),
  rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
};

// Export either real or mock client
export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? mockClient as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

// Log if using mock client
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Using mock Supabase client - environment variables missing:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    nodeEnv: import.meta.env.NODE_ENV || 'development'
  });
}

// Multi-tenant auth helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  },

  signUp: async (email: string, password: string, userData: { 
    firstName: string; 
    lastName: string; 
    role?: string;
    invitationToken?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || 'member',
          invitation_token: userData.invitationToken,
          is_active: true
        }
      }
    });
    
    return { data, error };
  },

  signUpWithInvitation: async (
    invitationToken: string, 
    email: string, 
    password: string, 
    userData: { 
      firstName: string; 
      lastName: string; 
    }
  ) => {
    // Validate invitation token first
    const { data: invitation, error: invError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('token', invitationToken)
      .eq('email', email)
      .gt('expires_at', new Date().toISOString())
      .is('accepted_at', null)
      .single();

    if (invError || !invitation) {
      return { data: null, error: { message: 'Invalid or expired invitation' } };
    }

    // Sign up with invitation context
    return await auth.signUp(email, password, {
      ...userData,
      role: invitation.organization_role,
      invitationToken: invitationToken
    });
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  getSession: async () => {
    return await supabase.auth.getSession();
  },

  getUser: async () => {
    return await supabase.auth.getUser();
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  // Organization management
  createOrganization: async (organizationData: {
    name: string;
    slug: string;
    domain?: string;
    settings?: any;
  }) => {
    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single();
    
    if (error) return { data: null, error };
    
    // Create default project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([{
        organization_id: data.id,
        name: 'Default Project',
        description: 'Default project created with organization',
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    
    return { 
      data: { 
        organization: data, 
        defaultProject: projectData 
      }, 
      error: projectError 
    };
  },

  inviteUser: async (
    organizationId: string, 
    email: string, 
    organizationRole: string,
    projectId?: string,
    projectRole?: string
  ) => {
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data, error } = await supabase
      .from('user_invitations')
      .insert([{
        organization_id: organizationId,
        project_id: projectId,
        email,
        organization_role: organizationRole,
        project_role: projectRole,
        invited_by: (await supabase.auth.getUser()).data.user?.id,
        token,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    return { data, error };
  },

  switchProject: async (projectId: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { error: { message: 'Not authenticated' } };
    
    // Validate project access
    const { data: projectUser, error } = await supabase
      .from('project_users')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.data.user.id)
      .eq('is_active', true)
      .single();
    
    if (error || !projectUser) {
      return { error: { message: 'No access to project' } };
    }
    
    // Update session with new project context
    // This would typically update the JWT token
    return { data: { projectId, role: projectUser.role }, error: null };
  }
};

// Database helpers with proper error handling
export const db = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      const { data, error } = await supabase
        .from(table)
        .select(columns);
      
      if (error) {
        console.error(`Error selecting from ${table}:`, error);
        throw error;
      }
      
      return data;
    },

    insert: async (records: any[]) => {
      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select();
      
      if (error) {
        console.error(`Error inserting into ${table}:`, error);
        throw error;
      }
      
      return data;
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error updating ${table}:`, error);
        throw error;
      }
      
      return data;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
      }
      
      return true;
    }
  })
};

// Realtime helpers
export const realtime = {
  /**
   * Subscribe to real-time changes on a table
   */
  subscribe: (table: string, callback: (payload: any) => void) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Realtime subscription failed - Supabase not configured');
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to ${table} changes`);
        }
      });

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  },

  /**
   * Get connection status
   */
  getStatus: () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        connected: false, 
        connecting: false, 
        error: 'Supabase not configured' 
      };
    }

    // Check if we have an active connection
    const channels = supabase.getChannels();
    const hasActiveChannels = channels.length > 0;
    
    return {
      connected: hasActiveChannels,
      connecting: false,
      error: null,
      channels: channels.length
    };
  },

  /**
   * Create a custom channel for specific real-time communication
   */
  createChannel: (channelName: string) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Cannot create channel - Supabase not configured');
      return null;
    }

    return supabase.channel(channelName);
  }
};

// Helper functions
async function getOrganizationContext(userId: string): Promise<OrganizationContext | null> {
  try {
    console.log('📡 Attempting to fetch organization context for user:', userId);
    
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Organization context fetch timeout')), 3000);
    });
    
    const fetchPromise = supabase.rpc('get_user_context', { user_id: userId });
    
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (error) {
      console.warn('RPC get_user_context failed:', error.message);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('No organization context found for user');
      return null;
    }
    
    const userContext = data[0];
    const projects = Array.isArray(userContext.projects) ? userContext.projects : [];
    
    console.log('✅ Organization context loaded:', userContext.organization_id);
    return {
      organizationId: userContext.organization_id,
      organizationSlug: userContext.organization_slug || 'unknown',
      organizationRole: userContext.organization_role,
      projects: projects.map((p: any) => ({
        projectId: p.project_id,
        projectName: p.project_name,
        projectRole: p.project_role,
        isActive: p.is_active || false
      }))
    };
  } catch (error) {
    console.error('Error fetching organization context:', error);
    return null;
  }
}

function generateInvitationToken(): string {
  return 'inv_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Multi-tenant helpers
export const tenantHelpers = {
  async getCurrentOrganization(): Promise<OrganizationContext | null> {
    console.log('getCurrentOrganization: Multi-tenant features not yet configured');
    return null;
  },

  async switchProject(projectId: string): Promise<boolean> {
    try {
      const result = await auth.switchProject(projectId);
      return !result.error;
    } catch (error) {
      console.error('Error switching project:', error);
      return false;
    }
  },

  async getOrganizationProjects(organizationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');
    
    return data || [];
  },

  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('first_name');
    
    return data || [];
  }
};

export default supabase;