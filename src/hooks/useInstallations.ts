// Think Tank Technologies - Installation Data Hook

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Installation, DashboardStats } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { DatabaseErrorHandler, useErrorHandler } from '../utils/errorHandling';

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
  const { withErrorHandling } = useErrorHandler();

  const fetchInstallations = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await withErrorHandling(
      async () => {
        const { data, error: installationsError } = await supabase
          .from('installation_details')
          .select('*');
        
        if (installationsError) {
          throw installationsError;
        }

        const transformedData: Installation[] = data.map((item: any) => {
          // Parse address from the combined address string
          const addressParts = item.address?.split(', ') || [];
          const zipStateParts = addressParts[addressParts.length - 1]?.split(' ') || [];
          const zipCode = zipStateParts[zipStateParts.length - 1] || '';
          const state = zipStateParts.slice(0, -1).join(' ') || '';
          
          return {
            id: item.id,
            customerName: item.customer_name,
            customerPhone: item.customer_phone || '',
            customerEmail: item.customer_email || '',
            address: {
              street: addressParts[0] || '',
              city: addressParts[1] || '',
              state: state,
              zipCode: zipCode,
              coordinates: undefined // Not available in view
            },
            scheduledDate: item.scheduled_date,
            scheduledTime: item.scheduled_time || '09:00',
            duration: item.duration || 240,
            status: item.status,
            priority: item.priority,
            notes: item.notes || '',
            leadId: item.lead_id,
            assistantId: item.assistant_id,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          };
        });

        return transformedData;
      },
      'fetchInstallations',
      { 
        maxRetries: 3, 
        retryDelay: 1000,
        retryOnNetworkError: true 
      }
    );

    if (data) {
      setInstallations(data);
    } else if (fetchError) {
      const errorMessage = DatabaseErrorHandler.getErrorMessage(fetchError);
      setError(errorMessage);
      
      // If it's a network error, keep existing data if available
      if (fetchError.isNetworkError && installations.length === 0) {
        console.log('Network error and no cached data available');
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchInstallations();

    // Set up real-time subscription for installations
    const channel: RealtimeChannel = supabase
      .channel('installations-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'installations' 
        }, 
        (payload) => {
          console.log('Installation real-time update:', payload);
          // Refetch installations when changes occur
          fetchInstallations();
        }
      )
      .subscribe((status) => {
        console.log('Installation subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
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
      const { data: installations, error: installationsError } = await supabase
        .from('installations')
        .select('*');
      
      if (installationsError) {
        throw installationsError;
      }
      
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

      const { data, error: installationsError } = await supabase
        .from('installation_details')
        .select('*')
        .eq('scheduled_date', date);
      
      if (installationsError) {
        throw installationsError;
      }

      const transformedData: Installation[] = data.map((item: any) => {
        // Parse address from the combined address string
        const addressParts = item.address?.split(', ') || [];
        const zipStateParts = addressParts[addressParts.length - 1]?.split(' ') || [];
        const zipCode = zipStateParts[zipStateParts.length - 1] || '';
        const state = zipStateParts.slice(0, -1).join(' ') || '';
        
        return {
          id: item.id,
          customerName: item.customer_name,
          customerPhone: item.customer_phone || '',
          customerEmail: item.customer_email || '',
          address: {
            street: addressParts[0] || '',
            city: addressParts[1] || '',
            state: state,
            zipCode: zipCode,
            coordinates: undefined // Not available in view
          },
          scheduledDate: item.scheduled_date,
          scheduledTime: item.scheduled_time || '09:00',
          duration: item.duration || 240,
          status: item.status,
          priority: item.priority,
          notes: item.notes || '',
          leadId: item.lead_id,
          assistantId: item.assistant_id,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString()
        };
      });

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