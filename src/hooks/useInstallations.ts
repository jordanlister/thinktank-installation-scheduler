// Think Tank Technologies - Installation Data Hook

import { useState, useEffect } from 'react';
import { db } from '../services/supabase';
import type { Installation, DashboardStats } from '../types';

interface InstallationWithAddress extends Omit<Installation, 'address'> {
  address: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  leadName?: string;
  assistantName?: string;
}

export const useInstallations = () => {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await db.from('installations').select(`
        id,
        job_id,
        store_number,
        customer_name,
        customer_phone,
        customer_email,
        scheduled_date,
        scheduled_time,
        duration,
        status,
        priority,
        installation_type,
        specifications,
        requirements,
        region,
        notes,
        lead_id,
        assistant_id,
        estimated_revenue,
        actual_revenue,
        customer_satisfaction_score,
        created_at,
        updated_at,
        addresses!inner (
          id,
          street,
          city,
          state,
          zip_code,
          coordinates
        ),
        lead:users!lead_id (
          first_name,
          last_name
        ),
        assistant:users!assistant_id (
          first_name,
          last_name
        )
      `);

      const transformedData: Installation[] = data.map((item: any) => ({
        id: item.id,
        customerName: item.customer_name,
        customerPhone: item.customer_phone || '',
        customerEmail: item.customer_email || '',
        address: {
          street: item.addresses.street,
          city: item.addresses.city,
          state: item.addresses.state,
          zipCode: item.addresses.zip_code,
          coordinates: item.addresses.coordinates ? {
            lat: item.addresses.coordinates.x,
            lng: item.addresses.coordinates.y
          } : undefined
        },
        scheduledDate: item.scheduled_date,
        scheduledTime: item.scheduled_time || '09:00',
        duration: item.duration || 240,
        status: item.status,
        priority: item.priority,
        notes: item.notes,
        leadId: item.lead_id,
        assistantId: item.assistant_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setInstallations(transformedData);
    } catch (err) {
      console.error('Error fetching installations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch installations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);

  return {
    installations,
    isLoading,
    error,
    refetch: fetchInstallations
  };
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all installations
      const installations = await db.from('installations').select('*');
      
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      // Calculate stats
      const totalInstallations = installations.length;
      const pendingInstallations = installations.filter(i => i.status === 'pending').length;
      const scheduledInstallations = installations.filter(i => i.status === 'scheduled').length;
      const completedInstallations = installations.filter(i => i.status === 'completed').length;
      
      const todayInstallations = installations.filter(i => 
        i.scheduled_date === today
      ).length;
      
      const weekInstallations = installations.filter(i => 
        i.scheduled_date >= weekStartStr && i.scheduled_date <= today
      ).length;
      
      const monthInstallations = installations.filter(i => 
        i.scheduled_date >= monthStartStr && i.scheduled_date <= today
      ).length;

      const dashboardStats: DashboardStats = {
        totalInstallations,
        pendingInstallations,
        scheduledInstallations,
        completedInstallations,
        todayInstallations,
        weekInstallations,
        monthInstallations
      };

      setStats(dashboardStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchDashboardStats
  };
};

export const useInstallationsForDate = (date: string) => {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallationsForDate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await db.from('installations').select(`
        id,
        job_id,
        customer_name,
        customer_phone,
        customer_email,
        scheduled_date,
        scheduled_time,
        duration,
        status,
        priority,
        installation_type,
        region,
        notes,
        lead_id,
        assistant_id,
        addresses!inner (
          street,
          city,
          state,
          zip_code
        ),
        lead:users!lead_id (
          first_name,
          last_name
        ),
        assistant:users!assistant_id (
          first_name,
          last_name
        )
      `).eq('scheduled_date', date);

      const transformedData: Installation[] = data.map((item: any) => ({
        id: item.id,
        customerName: item.customer_name,
        customerPhone: item.customer_phone || '',
        customerEmail: item.customer_email || '',
        address: {
          street: item.addresses.street,
          city: item.addresses.city,
          state: item.addresses.state,
          zipCode: item.addresses.zip_code
        },
        scheduledDate: item.scheduled_date,
        scheduledTime: item.scheduled_time || '09:00',
        duration: item.duration || 240,
        status: item.status,
        priority: item.priority,
        notes: item.notes,
        leadId: item.lead_id,
        assistantId: item.assistant_id,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString()
      }));

      setInstallations(transformedData);
    } catch (err) {
      console.error('Error fetching installations for date:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch installations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (date) {
      fetchInstallationsForDate();
    }
  }, [date]);

  return {
    installations,
    isLoading,
    error,
    refetch: fetchInstallationsForDate
  };
};