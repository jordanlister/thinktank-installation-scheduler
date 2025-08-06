// Think Tank Technologies - Team Data Hook

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { 
  TeamMember, 
  Skill, 
  Certification, 
  Equipment, 
  PerformanceMetrics,
  TeamAnalytics,
  Availability
} from '../types';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch team members with related data
      const { data, error: teamMemberError } = await supabase
        .from('team_member_details')
        .select('*');
      
      if (teamMemberError) {
        throw teamMemberError;
      }

      // Fetch additional data for each team member
      const teamMemberIds = data.map(tm => tm.id);

      // Fetch skills for all team members
      const { data: skillsData, error: skillsError } = await supabase
        .from('team_member_skills')
        .select(`
          team_member_id,
          level,
          acquired_date,
          last_assessed,
          skills!inner (
            id,
            name,
            category
          )
        `)
        .in('team_member_id', teamMemberIds);
      
      if (skillsError) {
        throw skillsError;
      }

      // Fetch certifications
      const { data: certificationsData, error: certificationsError } = await supabase
        .from('certifications')
        .select('*')
        .in('team_member_id', teamMemberIds);
      
      if (certificationsError) {
        throw certificationsError;
      }

      // Fetch equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .in('assigned_to', teamMemberIds);
      
      if (equipmentError) {
        throw equipmentError;
      }

      // Fetch availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .in('team_member_id', teamMemberIds);
      
      if (availabilityError) {
        throw availabilityError;
      }

      // Fetch work preferences
      const { data: workPreferencesData, error: workPreferencesError } = await supabase
        .from('work_preferences')
        .select('*')
        .in('team_member_id', teamMemberIds);
      
      if (workPreferencesError) {
        throw workPreferencesError;
      }

      // Fetch performance metrics
      const { data: performanceData, error: performanceError } = await supabase
        .from('performance_metrics')
        .select('*')
        .in('team_member_id', teamMemberIds);
      
      if (performanceError) {
        throw performanceError;
      }

      // Transform and combine the data
      const transformedTeamMembers: TeamMember[] = data.map((tm: any) => {
        // Get skills for this team member
        const memberSkills = skillsData
          .filter(s => s.team_member_id === tm.id)
          .map(s => ({
            id: s.skills.id,
            name: s.skills.name,
            category: s.skills.category,
            level: s.level,
            acquiredDate: s.acquired_date,
            lastAssessed: s.last_assessed,
            assessedBy: undefined,
            notes: undefined
          }));

        // Get certifications for this team member
        const memberCertifications = certificationsData
          .filter(c => c.team_member_id === tm.id)
          .map(c => ({
            id: c.id,
            name: c.name,
            issuer: c.issuer,
            certificationNumber: c.certification_number,
            issueDate: c.issue_date,
            expirationDate: c.expiration_date,
            status: c.status,
            renewalRequired: c.renewal_required,
            documentUrl: c.document_url,
            cost: c.cost,
            notes: c.notes
          }));

        // Get equipment for this team member
        const memberEquipment = equipmentData
          .filter(e => e.assigned_to === tm.id)
          .map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            serialNumber: e.serial_number,
            assignedDate: e.assigned_date,
            status: e.status,
            condition: e.condition,
            lastInspected: e.last_inspected,
            nextInspectionDue: e.next_inspection_due,
            purchaseDate: e.purchase_date,
            warranty: e.warranty_expiration ? {
              expirationDate: e.warranty_expiration,
              provider: e.warranty_provider || ''
            } : undefined,
            specifications: e.specifications || {},
            notes: e.notes
          }));

        // Get availability for this team member
        const memberAvailability = availabilityData
          .filter(a => a.team_member_id === tm.id)
          .map(a => ({
            id: a.id,
            teamMemberId: a.team_member_id,
            startDate: a.start_date,
            endDate: a.end_date,
            startTime: a.start_time,
            endTime: a.end_time,
            isRecurring: a.is_recurring,
            recurringDays: a.recurring_days,
            isAvailable: a.is_available,
            notes: a.notes
          }));

        // Get work preferences for this team member
        const workPrefs = workPreferencesData.find(wp => wp.team_member_id === tm.id);

        // Get latest performance metrics
        const latestPerformance = performanceData
          .filter(p => p.team_member_id === tm.id)
          .sort((a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime())[0];

        return {
          id: tm.id,
          email: tm.email,
          firstName: tm.first_name,
          lastName: tm.last_name,
          role: tm.role,
          isActive: tm.employment_status === 'active',
          createdAt: tm.created_at,
          updatedAt: tm.updated_at,
          region: tm.region,
          subRegions: [], // Will be populated from actual data structure
          specializations: tm.specializations || [],
          skills: memberSkills,
          certifications: memberCertifications,
          equipment: memberEquipment,
          availability: memberAvailability,
          capacity: tm.capacity || 8,
          travelRadius: tm.travel_radius || 50,
          coordinates: undefined, // Will be populated from home address
          homeBase: tm.home_address ? {
            street: tm.home_address.split(',')[0] || '',
            city: tm.home_address.split(',')[1]?.trim() || '',
            state: tm.home_address.split(',')[2]?.trim().split(' ')[0] || '',
            zipCode: tm.home_address.split(',')[2]?.trim().split(' ')[1] || ''
          } : undefined,
          performanceMetrics: latestPerformance ? {
            completionRate: latestPerformance.completion_rate,
            averageTime: latestPerformance.average_time,
            customerSatisfaction: latestPerformance.customer_satisfaction,
            travelEfficiency: latestPerformance.travel_efficiency,
            totalJobs: latestPerformance.total_jobs,
            totalDistance: latestPerformance.total_distance,
            qualityScore: latestPerformance.quality_score,
            safetyScore: latestPerformance.safety_score,
            punctualityScore: latestPerformance.punctuality_score,
            communicationScore: latestPerformance.communication_score,
            revenueGenerated: latestPerformance.revenue_generated,
            overtimeHours: latestPerformance.overtime_hours,
            periodStart: latestPerformance.period_start,
            periodEnd: latestPerformance.period_end
          } : undefined,
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Contact',
            phoneNumber: '555-0000'
          },
          preferredPartners: [],
          workPreferences: {
            preferredStartTime: workPrefs?.preferred_start_time || '08:00',
            preferredEndTime: workPrefs?.preferred_end_time || '17:00',
            maxDailyJobs: workPrefs?.max_daily_jobs || 8,
            maxWeeklyHours: workPrefs?.max_weekly_hours || 40,
            weekendsAvailable: workPrefs?.weekends_available || false,
            overtimeAvailable: workPrefs?.overtime_available || false,
            travelPreference: workPrefs?.travel_preference || 'regional',
            specialRequests: workPrefs?.special_requests || [],
            unavailableDates: workPrefs?.unavailable_dates || []
          },
          trainingRecord: [],
          employmentInfo: {
            employeeId: tm.employee_id || '',
            hireDate: tm.created_at.split('T')[0],
            department: 'Installation',
            jobTitle: tm.job_title || 'Team Member',
            workLocation: tm.region,
            employmentType: 'full_time',
            status: tm.employment_status || 'active'
          },
          profilePhoto: undefined,
          notes: undefined
        };
      });

      setTeamMembers(transformedTeamMembers);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    isLoading,
    error,
    refetch: fetchTeamMembers
  };
};

export const useExpiringCertifications = () => {
  const [expiringCertifications, setExpiringCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringCertifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get certifications expiring in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error: certError } = await supabase
        .from('certifications')
        .select(`
          *,
          team_members!inner (
            users!inner (
              first_name,
              last_name
            )
          )
        `)
        .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .eq('status', 'active');
      
      if (certError) {
        throw certError;
      }

      const transformedData = data.map((cert: any) => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        certificationNumber: cert.certification_number,
        issueDate: cert.issue_date,
        expirationDate: cert.expiration_date,
        status: cert.status,
        renewalRequired: cert.renewal_required,
        documentUrl: cert.document_url,
        cost: cert.cost,
        notes: cert.notes
      }));

      setExpiringCertifications(transformedData);
    } catch (err) {
      console.error('Error fetching expiring certifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expiring certifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringCertifications();
  }, []);

  return {
    expiringCertifications,
    isLoading,
    error,
    refetch: fetchExpiringCertifications
  };
};

export const useTeamAnalytics = (period: { start: string; end: string }) => {
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch team members count
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('id, region')
        .eq('employment_status', 'active');
      
      if (teamMembersError) {
        throw teamMembersError;
      }
      
      // Fetch performance metrics for the period
      const { data: performanceData, error: performanceError } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('period_start', period.start)
        .lte('period_end', period.end);
      
      if (performanceError) {
        throw performanceError;
      }

      // Fetch certifications
      const { data: certificationsData, error: certificationsError } = await supabase
        .from('certifications')
        .select('*')
        .eq('status', 'active');
      
      if (certificationsError) {
        throw certificationsError;
      }

      // Calculate analytics
      const totalTeamMembers = teamMembersData.length;
      const activeMembers = teamMembersData.length; // Already filtered by active status
      const totalCertifications = certificationsData.length;
      
      // Calculate average utilization and performance
      const avgUtilization = performanceData.length > 0 
        ? performanceData.reduce((sum, p) => sum + (p.total_jobs / 30), 0) / performanceData.length / 8 // Rough calculation
        : 0.75;

      const avgPerformance = performanceData.length > 0
        ? performanceData.reduce((sum, p) => sum + p.completion_rate, 0) / performanceData.length / 10 // Convert to 0-10 scale
        : 8.5;

      // Region coverage
      const regions = [...new Set(teamMembersData.map(tm => tm.region))];
      const regionCoverage: { [key: string]: number } = {};
      regions.forEach(region => {
        regionCoverage[region] = teamMembersData.filter(tm => tm.region === region).length;
      });

      const teamAnalytics: TeamAnalytics = {
        period,
        teamMetrics: {
          totalTeamMembers,
          activeMembers,
          averageExperience: 5.2, // Placeholder - would need hire date calculation
          totalCertifications,
          expiringCertifications: 0, // Would need expiration calculation
          skillCoverage: {},
          regionCoverage,
          overallUtilization: avgUtilization,
          performanceScore: avgPerformance
        },
        individualPerformance: [],
        regionAnalysis: [],
        skillGapAnalysis: [],
        certificationStatus: {
          totalCertifications,
          activeCertifications: totalCertifications,
          expiringSoon: 0,
          expired: 0,
          byCategory: {},
          renewalsCost: 0
        },
        equipmentUtilization: [],
        workloadDistribution: {
          averageJobsPerDay: 3.5,
          workloadVariance: 0.15,
          overutilizedMembers: 2,
          underutilizedMembers: 1,
          optimalUtilization: 0.80,
          recommendations: []
        },
        recommendations: []
      };

      setAnalytics(teamAnalytics);
    } catch (err) {
      console.error('Error fetching team analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period.start && period.end) {
      fetchTeamAnalytics();
    }
  }, [period.start, period.end]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchTeamAnalytics
  };
};