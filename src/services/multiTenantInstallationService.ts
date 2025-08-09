// Think Tank Technologies - Multi-Tenant Installation Service
// Transforms the original installation service for multi-tenant support

import { MultiTenantService, TenantContext } from './multiTenantService';
import type { Installation, InstallationStatus, Priority, Address } from '../types';

export interface CreateInstallationData {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  address: Address;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  status?: InstallationStatus;
  priority?: Priority;
  installationType?: string;
  specifications?: string[];
  requirements?: string;
  region?: string;
  notes?: string;
  leadId?: string;
  assistantId?: string;
  estimatedRevenue?: number;
  jobId?: string;
  storeNumber?: string;
}

export interface UpdateInstallationData extends Partial<CreateInstallationData> {
  id: string;
  actualRevenue?: number;
  completionPhotos?: string[];
  customerSignature?: string;
  customerSatisfactionScore?: number;
}

export interface InstallationFilters {
  status?: InstallationStatus[];
  priority?: Priority[];
  region?: string;
  leadId?: string;
  assistantId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface InstallationConflict {
  id: string;
  type: 'time_overlap' | 'capacity_exceeded' | 'travel_distance' | 'unavailable_team';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedInstallations: string[];
  affectedTeamMembers: string[];
  suggestedResolution?: string;
  autoResolvable: boolean;
}

export class MultiTenantInstallationService extends MultiTenantService {

  /**
   * Create a new installation within the organization/project context
   */
  async createInstallation(data: CreateInstallationData): Promise<Installation> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to create installations');
    }

    if (!this.projectId) {
      throw new Error('Project context required to create installations');
    }

    try {
      // First, create or find the address
      const addressData = {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zipCode,
        coordinates: data.address.coordinates ? 
          `POINT(${data.address.coordinates.lng} ${data.address.coordinates.lat})` : null
      };

      // Check if address already exists within organization
      let addressId: string;
      const { data: existingAddress } = await this.getBaseQuery('addresses')
        .select('id')
        .eq('street', addressData.street)
        .eq('city', addressData.city)
        .eq('state', addressData.state)
        .eq('zip_code', addressData.zip_code)
        .single();

      if (existingAddress) {
        addressId = existingAddress.id;
      } else {
        const { data: newAddress, error: addressError } = await this.getBaseQuery('addresses')
          .insert(this.addOrganizationContext(addressData))
          .select('id')
          .single();

        if (addressError) throw addressError;
        addressId = newAddress.id;
      }

      // Create the installation with multi-tenant context
      const installationData = this.addProjectContext({
        job_id: data.jobId || `JOB-${Date.now()}`,
        store_number: data.storeNumber,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        address_id: addressId,
        scheduled_date: data.scheduledDate,
        scheduled_time: data.scheduledTime,
        duration: data.duration || 240,
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        installation_type: data.installationType,
        specifications: data.specifications || [],
        requirements: data.requirements,
        region: data.region,
        notes: data.notes,
        lead_id: data.leadId || null,
        assistant_id: data.assistantId || null,
        estimated_revenue: data.estimatedRevenue
      });

      const { data: installation, error } = await this.getProjectQuery('installations')
        .insert(installationData)
        .select(`
          *,
          addresses!inner (
            street,
            city,
            state,
            zip_code,
            coordinates
          ),
          lead:team_members!lead_id (
            id,
            users!inner (first_name, last_name, email)
          ),
          assistant:team_members!assistant_id (
            id,
            users!inner (first_name, last_name, email)
          )
        `)
        .single();

      if (error) throw error;

      // Create assignment if team members are specified
      if (data.leadId || data.assistantId) {
        await this.createAssignment(installation.id, data.leadId!, data.assistantId);
      }

      // Log activity
      await this.logActivity(
        'installation_created',
        `Created installation for ${data.customerName}`,
        'installation',
        installation.id,
        { jobId: installation.job_id, customerName: data.customerName }
      );

      return this.transformInstallationData(installation);
    } catch (error) {
      console.error('Error creating installation:', error);
      throw error;
    }
  }

  /**
   * Update an existing installation
   */
  async updateInstallation(id: string, updates: Partial<UpdateInstallationData>): Promise<Installation> {
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to update installations');
    }

    try {
      // Handle address updates
      let addressId: string | undefined;
      if (updates.address) {
        const addressData = {
          street: updates.address.street,
          city: updates.address.city,
          state: updates.address.state,
          zip_code: updates.address.zipCode,
          coordinates: updates.address.coordinates ? 
            `POINT(${updates.address.coordinates.lng} ${updates.address.coordinates.lat})` : null
        };

        // Check if address already exists within organization
        const { data: existingAddress } = await this.getBaseQuery('addresses')
          .select('id')
          .eq('street', addressData.street)
          .eq('city', addressData.city)
          .eq('state', addressData.state)
          .eq('zip_code', addressData.zip_code)
          .single();

        if (existingAddress) {
          addressId = existingAddress.id;
        } else {
          const { data: newAddress, error: addressError } = await this.getBaseQuery('addresses')
            .insert(this.addOrganizationContext(addressData))
            .select('id')
            .single();

          if (addressError) throw addressError;
          addressId = newAddress.id;
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (updates.customerName) updateData.customer_name = updates.customerName;
      if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone;
      if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail;
      if (addressId) updateData.address_id = addressId;
      if (updates.scheduledDate) updateData.scheduled_date = updates.scheduledDate;
      if (updates.scheduledTime) updateData.scheduled_time = updates.scheduledTime;
      if (updates.duration) updateData.duration = updates.duration;
      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.installationType) updateData.installation_type = updates.installationType;
      if (updates.specifications) updateData.specifications = updates.specifications;
      if (updates.requirements !== undefined) updateData.requirements = updates.requirements;
      if (updates.region) updateData.region = updates.region;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.leadId !== undefined) updateData.lead_id = updates.leadId || null;
      if (updates.assistantId !== undefined) updateData.assistant_id = updates.assistantId || null;
      if (updates.estimatedRevenue) updateData.estimated_revenue = updates.estimatedRevenue;
      if (updates.actualRevenue) updateData.actual_revenue = updates.actualRevenue;
      if (updates.completionPhotos) updateData.completion_photos = updates.completionPhotos;
      if (updates.customerSignature) updateData.customer_signature = updates.customerSignature;
      if (updates.customerSatisfactionScore) updateData.customer_satisfaction_score = updates.customerSatisfactionScore;
      if (updates.jobId) updateData.job_id = updates.jobId;
      if (updates.storeNumber) updateData.store_number = updates.storeNumber;

      const { data: installation, error } = await this.getProjectQuery('installations')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          addresses!inner (
            street,
            city,
            state,
            zip_code,
            coordinates
          ),
          lead:team_members!lead_id (
            id,
            users!inner (first_name, last_name, email)
          ),
          assistant:team_members!assistant_id (
            id,
            users!inner (first_name, last_name, email)
          )
        `)
        .single();

      if (error) throw error;

      // Update assignment if team members changed
      if (updates.leadId !== undefined || updates.assistantId !== undefined) {
        await this.updateAssignment(id, updates.leadId, updates.assistantId);
      }

      // Log activity
      await this.logActivity(
        'installation_updated',
        `Updated installation ${id}`,
        'installation',
        id,
        { updates: Object.keys(updateData) }
      );

      return this.transformInstallationData(installation);
    } catch (error) {
      console.error('Error updating installation:', error);
      throw error;
    }
  }

  /**
   * Delete an installation
   */
  async deleteInstallation(id: string): Promise<void> {
    if (!this.hasPermission('admin')) {
      throw new Error('Insufficient permissions to delete installations');
    }

    try {
      const { error } = await this.getProjectQuery('installations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await this.logActivity(
        'installation_deleted',
        `Deleted installation ${id}`,
        'installation',
        id
      );
    } catch (error) {
      console.error('Error deleting installation:', error);
      throw error;
    }
  }

  /**
   * Get a single installation by ID
   */
  async getInstallationById(id: string): Promise<Installation> {
    try {
      const { data: installation, error } = await this.getProjectQuery('installations')
        .select(`
          *,
          addresses!inner (
            street,
            city,
            state,
            zip_code,
            coordinates
          ),
          lead:team_members!lead_id (
            id,
            users!inner (first_name, last_name, email)
          ),
          assistant:team_members!assistant_id (
            id,
            users!inner (first_name, last_name, email)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.transformInstallationData(installation);
    } catch (error) {
      console.error('Error fetching installation:', error);
      throw error;
    }
  }

  /**
   * Get all installations with optional filtering
   */
  async getInstallations(filters?: InstallationFilters): Promise<Installation[]> {
    try {
      let query = this.getProjectQuery('installations')
        .select(`
          *,
          addresses!inner (
            street,
            city,
            state,
            zip_code,
            coordinates
          ),
          lead:team_members!lead_id (
            id,
            users!inner (first_name, last_name, email)
          ),
          assistant:team_members!assistant_id (
            id,
            users!inner (first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.priority && filters.priority.length > 0) {
          query = query.in('priority', filters.priority);
        }
        if (filters.region) {
          query = query.eq('region', filters.region);
        }
        if (filters.leadId) {
          query = query.eq('lead_id', filters.leadId);
        }
        if (filters.assistantId) {
          query = query.eq('assistant_id', filters.assistantId);
        }
        if (filters.dateFrom) {
          query = query.gte('scheduled_date', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('scheduled_date', filters.dateTo);
        }
        if (filters.search) {
          query = query.or(`customer_name.ilike.%${filters.search}%,job_id.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`);
        }
      }

      const { data: installations, error } = await query;

      if (error) throw error;
      return installations.map(installation => this.transformInstallationData(installation));
    } catch (error) {
      console.error('Error fetching installations:', error);
      throw error;
    }
  }

  /**
   * Get installations for a specific date range
   */
  async getInstallationsByDateRange(startDate: string, endDate: string): Promise<Installation[]> {
    return this.getInstallations({
      dateFrom: startDate,
      dateTo: endDate
    });
  }

  /**
   * Get installations by team member
   */
  async getInstallationsByTeamMember(teamMemberId: string): Promise<Installation[]> {
    return this.getInstallations({
      leadId: teamMemberId
    });
  }

  /**
   * Create or update assignment
   */
  private async createAssignment(installationId: string, leadId: string, assistantId?: string): Promise<void> {
    try {
      // Delete existing assignment
      await this.getProjectQuery('assignments')
        .delete()
        .eq('installation_id', installationId);

      // Create new assignment with multi-tenant context
      const assignmentData = this.addProjectContext({
        installation_id: installationId,
        lead_id: leadId,
        assistant_id: assistantId || null,
        assigned_by: this.userId,
        status: 'assigned'
      });

      const { error } = await this.getProjectQuery('assignments')
        .insert(assignmentData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Update assignment
   */
  private async updateAssignment(installationId: string, leadId?: string, assistantId?: string): Promise<void> {
    try {
      if (leadId || assistantId) {
        // Check if assignment exists
        const { data: existingAssignment } = await this.getProjectQuery('assignments')
          .select('id')
          .eq('installation_id', installationId)
          .single();

        if (existingAssignment) {
          // Update existing assignment
          const updateData: any = {};
          if (leadId !== undefined) updateData.lead_id = leadId;
          if (assistantId !== undefined) updateData.assistant_id = assistantId || null;

          const { error } = await this.getProjectQuery('assignments')
            .update(updateData)
            .eq('installation_id', installationId);

          if (error) throw error;
        } else if (leadId) {
          // Create new assignment
          await this.createAssignment(installationId, leadId, assistantId);
        }
      } else {
        // Remove assignment if no team members specified
        await this.getProjectQuery('assignments')
          .delete()
          .eq('installation_id', installationId);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  /**
   * Get installation statistics for the current project
   */
  async getInstallationStats(): Promise<{
    total: number;
    pending: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const { data, error } = await this.getProjectQuery('installations')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(i => i.status === 'pending').length,
        scheduled: data.filter(i => i.status === 'scheduled').length,
        inProgress: data.filter(i => i.status === 'in_progress').length,
        completed: data.filter(i => i.status === 'completed').length,
        cancelled: data.filter(i => i.status === 'cancelled').length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching installation stats:', error);
      throw error;
    }
  }

  /**
   * Transform database data to Installation type
   */
  private transformInstallationData(data: any): Installation {
    return {
      id: data.id,
      customerName: data.customer_name,
      customerPhone: data.customer_phone || '',
      customerEmail: data.customer_email || '',
      address: {
        street: data.addresses.street,
        city: data.addresses.city,
        state: data.addresses.state,
        zipCode: data.addresses.zip_code,
        coordinates: data.addresses.coordinates ? this.parsePoint(data.addresses.coordinates) : undefined
      },
      scheduledDate: data.scheduled_date,
      scheduledTime: data.scheduled_time,
      duration: data.duration,
      status: data.status,
      priority: data.priority,
      notes: data.notes || '',
      leadId: data.lead_id,
      assistantId: data.assistant_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Parse PostGIS POINT to coordinates
   */
  private parsePoint(point: string): { lat: number; lng: number } | undefined {
    if (!point) return undefined;
    
    // PostGIS POINT format: "POINT(lng lat)"
    const match = point.match(/POINT\(([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2])
      };
    }
    
    return undefined;
  }
}

export default MultiTenantInstallationService;