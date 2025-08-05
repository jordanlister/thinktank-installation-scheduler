// Think Tank Technologies - Team Management Store

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  TeamMember,
  Skill,
  Certification,
  Equipment,
  TimeOffRequest,
  TeamPairing,
  WorkloadAssignment,
  BulkTeamOperation,
  TeamAnalytics,
  UserRole,
  SkillCategory,
  CertificationStatus,
  EquipmentStatus,
  TimeOffStatus,
  PairingStatus,
  WorkloadStatus,
  BulkOperationStatus
} from '../types';

interface TeamManagementState {
  // Core Team Data
  teamMembers: TeamMember[];
  selectedTeamMember: TeamMember | null;
  
  // Skills and Certifications
  skills: Skill[];
  certifications: Certification[];
  expiringCertifications: Certification[];
  
  // Equipment Management
  equipment: Equipment[];
  availableEquipment: Equipment[];
  
  // Time Off and Availability
  timeOffRequests: TimeOffRequest[];
  pendingTimeOffRequests: TimeOffRequest[];
  
  // Team Pairing and Assignments
  teamPairings: TeamPairing[];
  workloadAssignments: WorkloadAssignment[];
  
  // Bulk Operations
  bulkOperations: BulkTeamOperation[];
  activeBulkOperation: BulkTeamOperation | null;
  
  // Analytics and Reporting
  teamAnalytics: TeamAnalytics | null;
  performanceMetrics: { [teamMemberId: string]: any };
  
  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterCriteria: TeamFilterCriteria;
  selectedRegion: string | null;
  viewMode: TeamViewMode;
  
  // Actions - Team Member Management
  setTeamMembers: (members: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  setSelectedTeamMember: (member: TeamMember | null) => void;
  
  // Actions - Skills Management
  addSkill: (teamMemberId: string, skill: Skill) => void;
  updateSkill: (teamMemberId: string, skillId: string, updates: Partial<Skill>) => void;
  removeSkill: (teamMemberId: string, skillId: string) => void;
  assessSkill: (teamMemberId: string, skillId: string, level: string, assessedBy: string) => void;
  
  // Actions - Certification Management
  addCertification: (teamMemberId: string, certification: Certification) => void;
  updateCertification: (teamMemberId: string, certId: string, updates: Partial<Certification>) => void;
  removeCertification: (teamMemberId: string, certId: string) => void;
  renewCertification: (teamMemberId: string, certId: string, newExpirationDate: string) => void;
  checkExpiringCertifications: () => void;
  
  // Actions - Equipment Management
  assignEquipment: (teamMemberId: string, equipment: Equipment) => void;
  unassignEquipment: (teamMemberId: string, equipmentId: string) => void;
  updateEquipmentStatus: (equipmentId: string, status: EquipmentStatus) => void;
  scheduleEquipmentInspection: (equipmentId: string, inspectionDate: string) => void;
  
  // Actions - Time Off Management
  submitTimeOffRequest: (request: TimeOffRequest) => void;
  approveTimeOffRequest: (requestId: string, approvedBy: string) => void;
  denyTimeOffRequest: (requestId: string, reason?: string) => void;
  cancelTimeOffRequest: (requestId: string) => void;
  
  // Actions - Team Pairing
  createTeamPairing: (pairing: TeamPairing) => void;
  updatePairingStatus: (pairingId: string, status: PairingStatus) => void;
  calculatePairingCompatibility: (leadId: string, assistantId: string) => number;
  findOptimalPairings: (region?: string) => TeamPairing[];
  
  // Actions - Workload Management
  assignWorkload: (assignment: WorkloadAssignment) => void;
  updateWorkloadStatus: (teamMemberId: string, date: string, status: WorkloadStatus) => void;
  balanceWorkload: (region?: string, date?: string) => WorkloadAssignment[];
  calculateUtilization: (teamMemberId: string, dateRange: { start: string; end: string }) => number;
  
  // Actions - Bulk Operations
  startBulkOperation: (operation: BulkTeamOperation) => void;
  completeBulkOperation: (operationId: string) => void;
  cancelBulkOperation: (operationId: string) => void;
  
  // Actions - Analytics and Reporting
  generateTeamAnalytics: (period: { start: string; end: string }) => void;
  updatePerformanceMetrics: (teamMemberId: string, metrics: any) => void;
  exportTeamReport: (format: 'csv' | 'excel' | 'pdf') => void;
  
  // Actions - Search and Filtering
  setSearchQuery: (query: string) => void;
  setFilterCriteria: (criteria: Partial<TeamFilterCriteria>) => void;
  setSelectedRegion: (region: string | null) => void;
  setViewMode: (mode: TeamViewMode) => void;
  clearFilters: () => void;
  
  // Actions - Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Selectors
  getAvailableTeamMembers: (date: string, region?: string) => TeamMember[];
  getTeamMembersByRole: (role: UserRole) => TeamMember[];
  getTeamMembersByRegion: (region: string) => TeamMember[];
  getTeamMembersBySkill: (skill: string) => TeamMember[];
  getExpiringCertifications: (days: number) => Certification[];
  getAvailableEquipment: (type?: string) => Equipment[];
  getPendingTimeOffRequests: () => TimeOffRequest[];
  getWorkloadByDate: (date: string) => WorkloadAssignment[];
  getTeamPairingsForRegion: (region: string) => TeamPairing[];
}

interface TeamFilterCriteria {
  roles?: UserRole[];
  regions?: string[];
  skills?: string[];
  availabilityStatus?: boolean;
  certificationStatus?: CertificationStatus[];
  performanceThreshold?: number;
}

export const TeamViewMode = {
  GRID: 'grid',
  LIST: 'list',
  CALENDAR: 'calendar',
  MAP: 'map',
  ANALYTICS: 'analytics'
} as const;

export type TeamViewMode = typeof TeamViewMode[keyof typeof TeamViewMode];

const initialState = {
  // Core Data
  teamMembers: [],
  selectedTeamMember: null,
  skills: [],
  certifications: [],
  expiringCertifications: [],
  equipment: [],
  availableEquipment: [],
  timeOffRequests: [],
  pendingTimeOffRequests: [],
  teamPairings: [],
  workloadAssignments: [],
  bulkOperations: [],
  activeBulkOperation: null,
  teamAnalytics: null,
  performanceMetrics: {},
  
  // UI State
  isLoading: false,
  error: null,
  searchQuery: '',
  filterCriteria: {
    roles: undefined,
    regions: undefined,
    skills: undefined,
    availabilityStatus: undefined,
    certificationStatus: undefined,
    performanceThreshold: undefined
  },
  selectedRegion: null,
  viewMode: TeamViewMode.GRID
};

export const useTeamStore = create<TeamManagementState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Team Member Management Actions
        setTeamMembers: (members) => set({ teamMembers: members }, false, 'setTeamMembers'),
        
        addTeamMember: (member) => {
          const { teamMembers } = get();
          set({ teamMembers: [...teamMembers, member] }, false, 'addTeamMember');
        },
        
        updateTeamMember: (id, updates) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === id ? { ...member, ...updates } : member
            )
          }, false, 'updateTeamMember');
        },
        
        removeTeamMember: (id) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.filter(member => member.id !== id)
          }, false, 'removeTeamMember');
        },
        
        setSelectedTeamMember: (member) => set({ selectedTeamMember: member }, false, 'setSelectedTeamMember'),

        // Skills Management Actions
        addSkill: (teamMemberId, skill) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? { ...member, skills: [...member.skills, skill] }
                : member
            )
          }, false, 'addSkill');
        },
        
        updateSkill: (teamMemberId, skillId, updates) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? {
                    ...member,
                    skills: member.skills.map(skill => 
                      skill.id === skillId ? { ...skill, ...updates } : skill
                    )
                  }
                : member
            )
          }, false, 'updateSkill');
        },
        
        removeSkill: (teamMemberId, skillId) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? { ...member, skills: member.skills.filter(skill => skill.id !== skillId) }
                : member
            )
          }, false, 'removeSkill');
        },
        
        assessSkill: (teamMemberId, skillId, level, assessedBy) => {
          const { updateSkill } = get();
          updateSkill(teamMemberId, skillId, {
            level: level as any,
            lastAssessed: new Date().toISOString(),
            assessedBy
          });
        },

        // Certification Management Actions
        addCertification: (teamMemberId, certification) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? { ...member, certifications: [...member.certifications, certification] }
                : member
            )
          }, false, 'addCertification');
        },
        
        updateCertification: (teamMemberId, certId, updates) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? {
                    ...member,
                    certifications: member.certifications.map(cert => 
                      cert.id === certId ? { ...cert, ...updates } : cert
                    )
                  }
                : member
            )
          }, false, 'updateCertification');
        },
        
        removeCertification: (teamMemberId, certId) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? { ...member, certifications: member.certifications.filter(cert => cert.id !== certId) }
                : member
            )
          }, false, 'removeCertification');
        },
        
        renewCertification: (teamMemberId, certId, newExpirationDate) => {
          const { updateCertification } = get();
          updateCertification(teamMemberId, certId, {
            expirationDate: newExpirationDate,
            status: 'active' as CertificationStatus
          });
        },
        
        checkExpiringCertifications: () => {
          const { teamMembers } = get();
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          
          const expiring: Certification[] = [];
          
          teamMembers.forEach(member => {
            member.certifications.forEach(cert => {
              if (cert.expirationDate) {
                const expirationDate = new Date(cert.expirationDate);
                if (expirationDate <= thirtyDaysFromNow && cert.status === 'active') {
                  expiring.push(cert);
                }
              }
            });
          });
          
          set({ expiringCertifications: expiring }, false, 'checkExpiringCertifications');
        },

        // Equipment Management Actions
        assignEquipment: (teamMemberId, equipment) => {
          const { teamMembers } = get();
          const updatedEquipment = { ...equipment, status: 'assigned' as EquipmentStatus };
          
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? { ...member, equipment: [...member.equipment, updatedEquipment] }
                : member
            )
          }, false, 'assignEquipment');
        },
        
        unassignEquipment: (teamMemberId, equipmentId) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => 
              member.id === teamMemberId 
                ? { ...member, equipment: member.equipment.filter(eq => eq.id !== equipmentId) }
                : member
            )
          }, false, 'unassignEquipment');
        },
        
        updateEquipmentStatus: (equipmentId, status) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => ({
              ...member,
              equipment: member.equipment.map(eq => 
                eq.id === equipmentId ? { ...eq, status } : eq
              )
            }))
          }, false, 'updateEquipmentStatus');
        },
        
        scheduleEquipmentInspection: (equipmentId, inspectionDate) => {
          const { teamMembers } = get();
          set({
            teamMembers: teamMembers.map(member => ({
              ...member,
              equipment: member.equipment.map(eq => 
                eq.id === equipmentId ? { ...eq, nextInspectionDue: inspectionDate } : eq
              )
            }))
          }, false, 'scheduleEquipmentInspection');
        },

        // Time Off Management Actions
        submitTimeOffRequest: (request) => {
          const { timeOffRequests } = get();
          set({ 
            timeOffRequests: [...timeOffRequests, request],
            pendingTimeOffRequests: [...timeOffRequests.filter(r => r.status === 'pending'), request]
          }, false, 'submitTimeOffRequest');
        },
        
        approveTimeOffRequest: (requestId, approvedBy) => {
          const { timeOffRequests } = get();
          const updatedRequests = timeOffRequests.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  status: 'approved' as TimeOffStatus,
                  approvedBy,
                  approvedAt: new Date().toISOString()
                }
              : request
          );
          
          set({
            timeOffRequests: updatedRequests,
            pendingTimeOffRequests: updatedRequests.filter(r => r.status === 'pending')
          }, false, 'approveTimeOffRequest');
        },
        
        denyTimeOffRequest: (requestId, reason) => {
          const { timeOffRequests } = get();
          const updatedRequests = timeOffRequests.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  status: 'denied' as TimeOffStatus,
                  notes: reason || request.notes
                }
              : request
          );
          
          set({
            timeOffRequests: updatedRequests,
            pendingTimeOffRequests: updatedRequests.filter(r => r.status === 'pending')
          }, false, 'denyTimeOffRequest');
        },
        
        cancelTimeOffRequest: (requestId) => {
          const { timeOffRequests } = get();
          const updatedRequests = timeOffRequests.map(request => 
            request.id === requestId 
              ? { ...request, status: 'cancelled' as TimeOffStatus }
              : request
          );
          
          set({
            timeOffRequests: updatedRequests,
            pendingTimeOffRequests: updatedRequests.filter(r => r.status === 'pending')
          }, false, 'cancelTimeOffRequest');
        },

        // Team Pairing Actions
        createTeamPairing: (pairing) => {
          const { teamPairings } = get();
          set({ teamPairings: [...teamPairings, pairing] }, false, 'createTeamPairing');
        },
        
        updatePairingStatus: (pairingId, status) => {
          const { teamPairings } = get();
          set({
            teamPairings: teamPairings.map(pairing => 
              pairing.id === pairingId ? { ...pairing, status } : pairing
            )
          }, false, 'updatePairingStatus');
        },
        
        calculatePairingCompatibility: (leadId, assistantId) => {
          const { teamMembers } = get();
          const lead = teamMembers.find(m => m.id === leadId);
          const assistant = teamMembers.find(m => m.id === assistantId);
          
          if (!lead || !assistant) return 0;
          
          // Simple compatibility calculation based on region, skills, and preferences
          let score = 0;
          
          // Region compatibility (40% weight)
          if (lead.region === assistant.region) score += 40;
          else if (lead.subRegions.includes(assistant.region) || assistant.subRegions.includes(lead.region)) score += 20;
          
          // Skill complementarity (30% weight)
          const sharedSkills = lead.skills.filter(skill => 
            assistant.skills.some(aSkill => aSkill.name === skill.name)
          ).length;
          score += Math.min(sharedSkills * 5, 30);
          
          // Preferred partners (30% weight)
          if (lead.preferredPartners?.includes(assistantId)) score += 30;
          if (assistant.preferredPartners?.includes(leadId)) score += 30;
          
          return Math.min(score, 100);
        },
        
        findOptimalPairings: (region) => {
          const { teamMembers, calculatePairingCompatibility } = get();
          const leads = teamMembers.filter(m => m.role === 'lead' && (!region || m.region === region));
          const assistants = teamMembers.filter(m => m.role === 'assistant' && (!region || m.region === region));
          
          const pairings: TeamPairing[] = [];
          
          leads.forEach(lead => {
            let bestAssistant = null;
            let bestScore = 0;
            
            assistants.forEach(assistant => {
              const score = calculatePairingCompatibility(lead.id, assistant.id);
              if (score > bestScore) {
                bestScore = score;
                bestAssistant = assistant;
              }
            });
            
            if (bestAssistant && bestScore > 50) {
              pairings.push({
                id: `pairing_${lead.id}_${bestAssistant.id}`,
                leadId: lead.id,
                assistantId: bestAssistant.id,
                region: region || lead.region,
                compatibilityScore: bestScore,
                pairingDate: new Date().toISOString(),
                totalJobsCompleted: 0,
                averagePerformance: 0,
                status: 'active',
                notes: 'Auto-generated optimal pairing'
              });
            }
          });
          
          return pairings;
        },

        // Workload Management Actions
        assignWorkload: (assignment) => {
          const { workloadAssignments } = get();
          set({ workloadAssignments: [...workloadAssignments, assignment] }, false, 'assignWorkload');
        },
        
        updateWorkloadStatus: (teamMemberId, date, status) => {
          const { workloadAssignments } = get();
          set({
            workloadAssignments: workloadAssignments.map(assignment => 
              assignment.teamMemberId === teamMemberId && assignment.date === date
                ? { ...assignment, status }
                : assignment
            )
          }, false, 'updateWorkloadStatus');
        },
        
        balanceWorkload: (region, date) => {
          const { teamMembers, workloadAssignments } = get();
          
          // Filter team members by region if specified
          const relevantMembers = region 
            ? teamMembers.filter(m => m.region === region)
            : teamMembers;
          
          // Filter assignments by date if specified
          const relevantAssignments = date
            ? workloadAssignments.filter(a => a.date === date)
            : workloadAssignments;
          
          // Calculate current workload distribution
          const workloadDistribution = relevantMembers.map(member => {
            const assignments = relevantAssignments.filter(a => a.teamMemberId === member.id);
            const totalHours = assignments.reduce((sum, a) => sum + a.estimatedHours, 0);
            const utilization = totalHours / (member.capacity * 8); // Assuming 8-hour workdays
            
            return {
              teamMemberId: member.id,
              currentHours: totalHours,
              utilization,
              capacity: member.capacity
            };
          });
          
          // Identify rebalancing opportunities
          const overloaded = workloadDistribution.filter(w => w.utilization > 0.9);
          const underutilized = workloadDistribution.filter(w => w.utilization < 0.6);
          
          // Return balanced assignments (simplified logic)
          return relevantAssignments.map(assignment => ({
            ...assignment,
            status: assignment.utilizationPercentage > 90 ? 'overloaded' as WorkloadStatus : 'optimal' as WorkloadStatus
          }));
        },
        
        calculateUtilization: (teamMemberId, dateRange) => {
          const { workloadAssignments } = get();
          const member = get().teamMembers.find(m => m.id === teamMemberId);
          
          if (!member) return 0;
          
          const rangeAssignments = workloadAssignments.filter(assignment => 
            assignment.teamMemberId === teamMemberId &&
            assignment.date >= dateRange.start &&
            assignment.date <= dateRange.end
          );
          
          const totalHours = rangeAssignments.reduce((sum, a) => sum + a.estimatedHours, 0);
          const workingDays = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
          const availableHours = workingDays * member.capacity * 8; // 8 hours per capacity unit
          
          return totalHours / availableHours;
        },

        // Bulk Operations Actions
        startBulkOperation: (operation) => {
          const { bulkOperations } = get();
          set({ 
            bulkOperations: [...bulkOperations, operation],
            activeBulkOperation: operation
          }, false, 'startBulkOperation');
        },
        
        completeBulkOperation: (operationId) => {
          const { bulkOperations } = get();
          set({
            bulkOperations: bulkOperations.map(op => 
              op.id === operationId 
                ? { ...op, status: 'completed' as BulkOperationStatus, completedAt: new Date().toISOString() }
                : op
            ),
            activeBulkOperation: null
          }, false, 'completeBulkOperation');
        },
        
        cancelBulkOperation: (operationId) => {
          const { bulkOperations } = get();
          set({
            bulkOperations: bulkOperations.filter(op => op.id !== operationId),
            activeBulkOperation: null
          }, false, 'cancelBulkOperation');
        },

        // Analytics and Reporting Actions
        generateTeamAnalytics: (period) => {
          const { teamMembers } = get();
          
          // Generate comprehensive analytics (simplified implementation)
          const analytics: TeamAnalytics = {
            period,
            teamMetrics: {
              totalTeamMembers: teamMembers.length,
              activeMembers: teamMembers.filter(m => m.isActive).length,
              averageExperience: 5, // Placeholder
              totalCertifications: teamMembers.reduce((sum, m) => sum + m.certifications.length, 0),
              expiringCertifications: 0, // Would be calculated
              skillCoverage: {},
              regionCoverage: {},
              overallUtilization: 0.75,
              performanceScore: 8.5
            },
            individualPerformance: [],
            regionAnalysis: [],
            skillGapAnalysis: [],
            certificationStatus: {
              totalCertifications: 0,
              activeCertifications: 0,
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
          
          set({ teamAnalytics: analytics }, false, 'generateTeamAnalytics');
        },
        
        updatePerformanceMetrics: (teamMemberId, metrics) => {
          const { performanceMetrics } = get();
          set({
            performanceMetrics: {
              ...performanceMetrics,
              [teamMemberId]: metrics
            }
          }, false, 'updatePerformanceMetrics');
        },
        
        exportTeamReport: (format) => {
          // Implementation would generate and download report
          console.log(`Exporting team report in ${format} format`);
        },

        // Search and Filtering Actions
        setSearchQuery: (query) => set({ searchQuery: query }, false, 'setSearchQuery'),
        
        setFilterCriteria: (criteria) => {
          const { filterCriteria } = get();
          set({ filterCriteria: { ...filterCriteria, ...criteria } }, false, 'setFilterCriteria');
        },
        
        setSelectedRegion: (region) => set({ selectedRegion: region }, false, 'setSelectedRegion'),
        
        setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),
        
        clearFilters: () => set({ 
          searchQuery: '',
          filterCriteria: initialState.filterCriteria,
          selectedRegion: null
        }, false, 'clearFilters'),

        // Utility Actions
        setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
        
        setError: (error) => set({ error }, false, 'setError'),
        
        clearError: () => set({ error: null }, false, 'clearError'),
        
        reset: () => set(initialState, false, 'reset'),

        // Selectors
        getAvailableTeamMembers: (date, region) => {
          const { teamMembers } = get();
          return teamMembers.filter(member => {
            const regionMatch = !region || member.region === region || member.subRegions.includes(region);
            const availabilityMatch = member.availability.some(avail => 
              avail.isAvailable && 
              date >= avail.startDate && 
              date <= avail.endDate
            );
            return regionMatch && availabilityMatch && member.isActive;
          });
        },
        
        getTeamMembersByRole: (role) => {
          const { teamMembers } = get();
          return teamMembers.filter(member => member.role === role);
        },
        
        getTeamMembersByRegion: (region) => {
          const { teamMembers } = get();
          return teamMembers.filter(member => member.region === region || member.subRegions.includes(region));
        },
        
        getTeamMembersBySkill: (skill) => {
          const { teamMembers } = get();
          return teamMembers.filter(member => 
            member.skills.some(s => s.name.toLowerCase().includes(skill.toLowerCase()))
          );
        },
        
        getExpiringCertifications: (days) => {
          const { teamMembers } = get();
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + days);
          
          const expiring: Certification[] = [];
          teamMembers.forEach(member => {
            member.certifications.forEach(cert => {
              if (cert.expirationDate && new Date(cert.expirationDate) <= targetDate) {
                expiring.push(cert);
              }
            });
          });
          
          return expiring;
        },
        
        getAvailableEquipment: (type) => {
          const { teamMembers } = get();
          const allEquipment: Equipment[] = [];
          
          teamMembers.forEach(member => {
            member.equipment.forEach(eq => {
              if (eq.status === 'available' && (!type || eq.type === type)) {
                allEquipment.push(eq);
              }
            });
          });
          
          return allEquipment;
        },
        
        getPendingTimeOffRequests: () => {
          const { timeOffRequests } = get();
          return timeOffRequests.filter(request => request.status === 'pending');
        },
        
        getWorkloadByDate: (date) => {
          const { workloadAssignments } = get();
          return workloadAssignments.filter(assignment => assignment.date === date);
        },
        
        getTeamPairingsForRegion: (region) => {
          const { teamPairings } = get();
          return teamPairings.filter(pairing => pairing.region === region);
        }
      }),
      {
        name: 'think-tank-team-management',
        partialize: (state) => ({
          // Persist important team data but not UI state
          teamMembers: state.teamMembers,
          teamPairings: state.teamPairings,
          selectedRegion: state.selectedRegion,
          viewMode: state.viewMode
        }),
      }
    ),
    {
      name: 'Think Tank Technologies - Team Management Store',
    }
  )
);

// Specialized selectors for better performance
export const useTeamMembers = () => useTeamStore((state) => state.teamMembers);
export const useSelectedTeamMember = () => useTeamStore((state) => state.selectedTeamMember);
export const useTeamAnalytics = () => useTeamStore((state) => state.teamAnalytics);
export const useExpiringCertifications = () => useTeamStore((state) => state.expiringCertifications);
export const usePendingTimeOffRequests = () => useTeamStore((state) => state.pendingTimeOffRequests);
export const useTeamPairings = () => useTeamStore((state) => state.teamPairings);
export const useWorkloadAssignments = () => useTeamStore((state) => state.workloadAssignments);
export const useTeamSearchQuery = () => useTeamStore((state) => state.searchQuery);
export const useTeamFilterCriteria = () => useTeamStore((state) => state.filterCriteria);
export const useTeamViewMode = () => useTeamStore((state) => state.viewMode);
export const useTeamLoading = () => useTeamStore((state) => state.isLoading);
export const useTeamError = () => useTeamStore((state) => state.error);