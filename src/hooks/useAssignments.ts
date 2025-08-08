// Think Tank Technologies - Assignments Hook

import { useState, useEffect, useCallback } from 'react';
import { AssignmentService } from '../services/assignmentService';
import type { 
  Assignment, 
  AssignmentConflict,
  WorkloadData,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentResult,
  AssignmentAnalytics
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { DatabaseErrorHandler, useErrorHandler } from '../utils/errorHandling';

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { withErrorHandling } = useErrorHandler();

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await withErrorHandling(
      async () => {
        return await AssignmentService.getAllAssignments();
      },
      'fetchAssignments',
      { 
        maxRetries: 3, 
        retryDelay: 1000,
        retryOnNetworkError: true 
      }
    );

    if (data) {
      setAssignments(data);
    } else if (fetchError) {
      const errorMessage = DatabaseErrorHandler.getErrorMessage(fetchError);
      setError(errorMessage);
      
      // If it's a network error, keep existing data if available
      if (fetchError.isNetworkError && assignments.length === 0) {
        console.log('Network error and no cached assignments available');
      }
    }

    setIsLoading(false);
  }, [withErrorHandling, assignments.length]);

  useEffect(() => {
    fetchAssignments();

    // Set up real-time subscription for assignments
    const channel: RealtimeChannel = supabase
      .channel('assignments-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'assignments' 
        }, 
        (payload) => {
          console.log('Assignment real-time update:', payload);
          // Refetch assignments when changes occur
          fetchAssignments();
        }
      )
      .subscribe((status) => {
        console.log('Assignments subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [fetchAssignments]);

  return {
    assignments,
    isLoading,
    error,
    refetch: fetchAssignments
  };
};

export const useAssignmentsByDateRange = (startDate: string, endDate: string) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignmentsByDateRange = useCallback(async () => {
    if (!startDate || !endDate) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await AssignmentService.getAssignmentsByDateRange(startDate, endDate);
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching assignments by date range:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAssignmentsByDateRange();
  }, [fetchAssignmentsByDateRange]);

  return {
    assignments,
    isLoading,
    error,
    refetch: fetchAssignmentsByDateRange
  };
};

export const useAssignmentsByTeamMember = (teamMemberId: string) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignmentsByTeamMember = useCallback(async () => {
    if (!teamMemberId) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await AssignmentService.getAssignmentsByTeamMember(teamMemberId);
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching team member assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team member assignments');
    } finally {
      setIsLoading(false);
    }
  }, [teamMemberId]);

  useEffect(() => {
    fetchAssignmentsByTeamMember();
  }, [fetchAssignmentsByTeamMember]);

  return {
    assignments,
    isLoading,
    error,
    refetch: fetchAssignmentsByTeamMember
  };
};

export const useAssignmentConflicts = (dateRange: { start: string; end: string }) => {
  const [conflicts, setConflicts] = useState<AssignmentConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectConflicts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await AssignmentService.detectConflicts(dateRange);
      setConflicts(data);
    } catch (err) {
      console.error('Error detecting conflicts:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect conflicts');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      detectConflicts();
    }
  }, [detectConflicts]);

  return {
    conflicts,
    isLoading,
    error,
    refetch: detectConflicts
  };
};

export const useWorkloadDistribution = (dateRange: { start: string; end: string }) => {
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateWorkload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await AssignmentService.calculateWorkloadDistribution(dateRange);
      setWorkloadData(data);
    } catch (err) {
      console.error('Error calculating workload distribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate workload distribution');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      calculateWorkload();
    }
  }, [calculateWorkload]);

  return {
    workloadData,
    isLoading,
    error,
    refetch: calculateWorkload
  };
};

export const useAssignmentAnalytics = (period: { start: string; end: string }) => {
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await AssignmentService.getAssignmentAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching assignment analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment analytics');
    } finally {
      setIsLoading(false);
    }
  }, [period.start, period.end]);

  useEffect(() => {
    if (period.start && period.end) {
      fetchAnalytics();
    }
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics
  };
};

export const useAssignmentOperations = () => {
  const [isOperating, setIsOperating] = useState(false);

  const createAssignment = async (request: CreateAssignmentRequest): Promise<AssignmentResult> => {
    setIsOperating(true);
    try {
      const result = await AssignmentService.createAssignment(request);
      return result;
    } finally {
      setIsOperating(false);
    }
  };

  const updateAssignment = async (id: string, updates: UpdateAssignmentRequest): Promise<Assignment> => {
    setIsOperating(true);
    try {
      const result = await AssignmentService.updateAssignment(id, updates);
      return result;
    } finally {
      setIsOperating(false);
    }
  };

  const deleteAssignment = async (id: string): Promise<void> => {
    setIsOperating(true);
    try {
      await AssignmentService.deleteAssignment(id);
    } finally {
      setIsOperating(false);
    }
  };

  return {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    isOperating
  };
};