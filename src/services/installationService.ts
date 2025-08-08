// Think Tank Technologies - Installation Management Service

import { supabase } from './supabase';
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

export const installationService = {
  // Create a new installation
  async createInstallation(data: CreateInstallationData): Promise<Installation> {
    try {
      // First, create or find the address
      const addressData = {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zipCode,
        coordinates: data.address.coordinates ? `POINT(${data.address.coordinates.lng} ${data.address.coordinates.lat})` : null
      };

      // Check if address already exists
      let addressId: string;
      const { data: existingAddress } = await supabase
        .from('addresses')
        .select('id')
        .eq('street', addressData.street)
        .eq('city', addressData.city)
        .eq('state', addressData.state)
        .eq('zip_code', addressData.zip_code)
        .single();

      if (existingAddress) {
        addressId = existingAddress.id;
      } else {
        const { data: newAddress, error: addressError } = await supabase
          .from('addresses')
          .insert(addressData)
          .select('id')
          .single();

        if (addressError) throw addressError;
        addressId = newAddress.id;
      }

      // Create the installation
      const installationData = {
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
      };

      const { data: installation, error } = await supabase
        .from('installations')
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

      return this.transformInstallationData(installation);
    } catch (error) {
      console.error('Error creating installation:', error);
      throw error;
    }
  },

  // Update an existing installation
  async updateInstallation(id: string, updates: Partial<UpdateInstallationData>): Promise<Installation> {
    try {
      // Handle address updates
      let addressId: string | undefined;
      if (updates.address) {
        const addressData = {
          street: updates.address.street,
          city: updates.address.city,
          state: updates.address.state,
          zip_code: updates.address.zipCode,
          coordinates: updates.address.coordinates ? `POINT(${updates.address.coordinates.lng} ${updates.address.coordinates.lat})` : null
        };

        // Check if address already exists
        const { data: existingAddress } = await supabase
          .from('addresses')
          .select('id')
          .eq('street', addressData.street)
          .eq('city', addressData.city)
          .eq('state', addressData.state)
          .eq('zip_code', addressData.zip_code)
          .single();

        if (existingAddress) {
          addressId = existingAddress.id;
        } else {
          const { data: newAddress, error: addressError } = await supabase
            .from('addresses')
            .insert(addressData)
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

      const { data: installation, error } = await supabase
        .from('installations')
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

      return this.transformInstallationData(installation);
    } catch (error) {
      console.error('Error updating installation:', error);
      throw error;
    }
  },

  // Delete an installation
  async deleteInstallation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('installations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting installation:', error);
      throw error;
    }
  },

  // Get a single installation by ID
  async getInstallationById(id: string): Promise<Installation> {
    try {
      const { data: installation, error } = await supabase
        .from('installations')
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
  },

  // Get all installations with optional filtering
  async getInstallations(filters?: InstallationFilters): Promise<Installation[]> {
    try {
      let query = supabase
        .from('installations')
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
  },

  // Get installations for a specific date range
  async getInstallationsByDateRange(startDate: string, endDate: string): Promise<Installation[]> {
    return this.getInstallations({
      dateFrom: startDate,
      dateTo: endDate
    });
  },

  // Get installations by team member
  async getInstallationsByTeamMember(teamMemberId: string): Promise<Installation[]> {
    return this.getInstallations({
      leadId: teamMemberId
    });
  },

  // Create or update assignment
  async createAssignment(installationId: string, leadId: string, assistantId?: string): Promise<void> {
    try {
      // Delete existing assignment
      await supabase
        .from('assignments')
        .delete()
        .eq('installation_id', installationId);

      // Create new assignment
      const assignmentData = {
        installation_id: installationId,
        lead_id: leadId,
        assistant_id: assistantId || null,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
        status: 'assigned'
      };

      const { error } = await supabase
        .from('assignments')
        .insert(assignmentData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  // Update assignment
  async updateAssignment(installationId: string, leadId?: string, assistantId?: string): Promise<void> {
    try {
      if (leadId || assistantId) {
        // Check if assignment exists
        const { data: existingAssignment } = await supabase
          .from('assignments')
          .select('id')
          .eq('installation_id', installationId)
          .single();

        if (existingAssignment) {
          // Update existing assignment
          const updateData: any = {};
          if (leadId !== undefined) updateData.lead_id = leadId;
          if (assistantId !== undefined) updateData.assistant_id = assistantId || null;

          const { error } = await supabase
            .from('assignments')
            .update(updateData)
            .eq('installation_id', installationId);

          if (error) throw error;
        } else if (leadId) {
          // Create new assignment
          await this.createAssignment(installationId, leadId, assistantId);
        }
      } else {
        // Remove assignment if no team members specified
        await supabase
          .from('assignments')
          .delete()
          .eq('installation_id', installationId);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  // Detect scheduling conflicts
  async detectSchedulingConflicts(installationId: string): Promise<InstallationConflict[]> {
    try {
      const installation = await this.getInstallationById(installationId);
      const conflicts: InstallationConflict[] = [];

      // Check for time overlaps with the same team members
      if (installation.leadId || installation.assistantId) {
        const teamMemberIds = [installation.leadId, installation.assistantId].filter(Boolean);
        
        for (const memberId of teamMemberIds) {
          const { data: overlappingInstallations } = await supabase
            .from('installations')
            .select('id, customer_name, scheduled_date, scheduled_time, duration')
            .neq('id', installationId)
            .eq('scheduled_date', installation.scheduledDate)
            .or(`lead_id.eq.${memberId},assistant_id.eq.${memberId}`)
            .not('status', 'in', '(cancelled,completed)');

          if (overlappingInstallations && overlappingInstallations.length > 0) {
            const installationStart = new Date(`${installation.scheduledDate}T${installation.scheduledTime}`);
            const installationEnd = new Date(installationStart.getTime() + installation.duration * 60000);

            for (const overlap of overlappingInstallations) {
              const overlapStart = new Date(`${overlap.scheduled_date}T${overlap.scheduled_time}`);
              const overlapEnd = new Date(overlapStart.getTime() + overlap.duration * 60000);

              if (installationStart < overlapEnd && installationEnd > overlapStart) {
                conflicts.push({
                  id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: 'time_overlap',
                  severity: 'high',
                  description: `Time overlap detected with installation ${overlap.id} for customer ${overlap.customer_name}`,
                  affectedInstallations: [installationId, overlap.id],
                  affectedTeamMembers: [memberId],
                  suggestedResolution: 'Reschedule one of the installations or assign different team members',
                  autoResolvable: false
                });
              }
            }
          }
        }
      }

      // Check team member availability
      if (installation.leadId) {
        const isAvailable = await this.checkTeamMemberAvailability(
          installation.leadId,
          installation.scheduledDate,
          installation.scheduledTime,
          installation.duration
        );

        if (!isAvailable) {
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'unavailable_team',
            severity: 'critical',
            description: 'Lead team member is not available at the scheduled time',
            affectedInstallations: [installationId],
            affectedTeamMembers: [installation.leadId],
            suggestedResolution: 'Choose a different time or assign a different team member',
            autoResolvable: false
          });
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Error detecting scheduling conflicts:', error);
      return [];
    }
  },

  // Check team member availability
  async checkTeamMemberAvailability(
    teamMemberId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<boolean> {
    try {
      // Use the database function to check availability
      const { data } = await supabase
        .rpc('get_team_member_availability', {
          member_id: teamMemberId,
          check_date: date
        });

      return data === true;
    } catch (error) {
      console.error('Error checking team member availability:', error);
      return false;
    }
  },

  // Geocode address
  async geocodeAddress(address: Address): Promise<Address> {
    try {
      // In a production environment, you would integrate with a geocoding service
      // For now, we'll return the address as-is
      // This could integrate with Google Maps API, MapBox, or similar
      
      // Example implementation would look like:
      // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${API_KEY}`);
      // const data = await response.json();
      // if (data.results && data.results.length > 0) {
      //   const location = data.results[0].geometry.location;
      //   address.coordinates = { lat: location.lat, lng: location.lng };
      // }

      return address;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return address;
    }
  },

  // Get installation statistics
  async getInstallationStats(): Promise<{
    total: number;
    pending: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('installations')
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
  },

  // Transform database data to Installation type
  transformInstallationData(data: any): Installation {
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
  },

  // Parse PostGIS POINT to coordinates
  parsePoint(point: string): { lat: number; lng: number } | undefined {
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
};