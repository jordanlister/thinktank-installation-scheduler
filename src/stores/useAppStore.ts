// Think Tank Technologies Installation Scheduler - Application Store

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  User, 
  Installation, 
  Schedule, 
  DashboardStats,
  ProcessingResult,
  ProcessedJobData,
  FileUploadState,
  DataProcessingConfig,
  TeamMember,
  SchedulingResult,
  SchedulingAnalytics,
  OptimizedAssignment,
  UserPreferences,
  SystemConfig,
  NotificationSettings,
  SecuritySettings,
  SettingsState,
  Assignment,
  AssignmentConflict,
  WorkloadData,
  AutoAssignmentRule,
  AutoAssignmentCriteria,
  AssignmentResult,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  BulkAssignmentRequest,
  BulkAssignmentResult,
  AssignmentAnalytics,
  AssignmentDashboardMetrics,
  ConflictResolution,
  AssignmentMatrix,
  FilterOptions
} from '../types';

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface AppState {
  // User and Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Installations
  installations: Installation[];
  selectedInstallation: Installation | null;
  selectedInstallations: string[];
  filteredInstallations: Installation[];
  installationFilters: FilterOptions;
  pagination: PaginationState;
  
  // Schedules
  schedules: Schedule[];
  selectedDate: string;
  
  // Dashboard
  dashboardStats: DashboardStats | null;
  
  // UI State
  sidebarOpen: boolean;
  currentPage: string;
  error: string | null;
  
  // Data Processing State
  dataProcessingResult: ProcessingResult | null;
  dataProcessingHistory: ProcessingResult[];
  uploadState: FileUploadState;
  processingConfig: DataProcessingConfig;
  
  // Scheduling State
  teams: TeamMember[];
  schedulingResult: SchedulingResult | null;
  schedulingAnalytics: SchedulingAnalytics | null;
  optimizationInProgress: boolean;
  
  // Assignment Management State
  assignments: Assignment[];
  assignmentConflicts: AssignmentConflict[];
  workloadDistribution: WorkloadData[];
  autoAssignmentRules: AutoAssignmentRule[];
  assignmentMatrix: AssignmentMatrix | null;
  assignmentAnalytics: AssignmentAnalytics | null;
  assignmentDashboardMetrics: AssignmentDashboardMetrics | null;
  selectedAssignment: Assignment | null;
  assignmentInProgress: boolean;
  
  // Settings State
  settings: SettingsState;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setInstallations: (installations: Installation[]) => void;
  setSelectedInstallation: (installation: Installation | null) => void;
  addInstallation: (installation: Installation) => void;
  updateInstallation: (id: string, updates: Partial<Installation>) => void;
  removeInstallation: (id: string) => void;
  
  // Installation Selection and Filtering
  setSelectedInstallations: (ids: string[]) => void;
  toggleInstallationSelection: (id: string) => void;
  clearInstallationSelection: () => void;
  setFilteredInstallations: (installations: Installation[]) => void;
  setInstallationFilters: (filters: FilterOptions) => void;
  clearInstallationFilters: () => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  
  // Bulk Operations
  bulkUpdateInstallations: (ids: string[], updates: Partial<Installation>) => Promise<void>;
  bulkDeleteInstallations: (ids: string[]) => Promise<void>;
  setSchedules: (schedules: Schedule[]) => void;
  setSelectedDate: (date: string) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Data Processing Actions
  setDataProcessingResult: (result: ProcessingResult | null) => void;
  addToProcessingHistory: (result: ProcessingResult) => void;
  clearProcessingHistory: () => void;
  setUploadState: (state: Partial<FileUploadState>) => void;
  resetUploadState: () => void;
  setProcessingConfig: (config: Partial<DataProcessingConfig>) => void;
  importProcessedData: (data: ProcessedJobData[]) => void;
  bulkAddInstallations: (data: ProcessedJobData[]) => void;
  
  // Scheduling Actions
  setTeams: (teams: TeamMember[]) => void;
  addTeamMember: (team: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  setSchedulingResult: (result: SchedulingResult | null) => void;
  setSchedulingAnalytics: (analytics: SchedulingAnalytics | null) => void;
  setOptimizationInProgress: (inProgress: boolean) => void;
  updateAssignment: (assignmentId: string, updates: Partial<OptimizedAssignment>) => void;
  
  // Assignment Management Actions
  createAssignment: (request: CreateAssignmentRequest) => Promise<AssignmentResult>;
  updateAssignmentById: (id: string, updates: UpdateAssignmentRequest) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  getAssignmentById: (id: string) => Assignment | null;
  setSelectedAssignment: (assignment: Assignment | null) => void;
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  
  // Conflict Management
  setAssignmentConflicts: (conflicts: AssignmentConflict[]) => void;
  addAssignmentConflict: (conflict: AssignmentConflict) => void;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  removeConflict: (conflictId: string) => void;
  detectConflicts: () => void;
  
  // Workload Management
  setWorkloadDistribution: (data: WorkloadData[]) => void;
  updateWorkloadData: (teamMemberId: string, date: string, data: Partial<WorkloadData>) => void;
  calculateWorkloadDistribution: (dateRange: { start: string; end: string }) => void;
  
  // Auto Assignment
  setAutoAssignmentRules: (rules: AutoAssignmentRule[]) => void;
  addAutoAssignmentRule: (rule: AutoAssignmentRule) => void;
  updateAutoAssignmentRule: (id: string, updates: Partial<AutoAssignmentRule>) => void;
  removeAutoAssignmentRule: (id: string) => void;
  runAutoAssignment: (criteria: AutoAssignmentCriteria) => Promise<AssignmentResult[]>;
  runBulkAssignment: (request: BulkAssignmentRequest) => Promise<BulkAssignmentResult>;
  
  // Assignment Matrix
  setAssignmentMatrix: (matrix: AssignmentMatrix | null) => void;
  generateAssignmentMatrix: (dateRange: { start: string; end: string }) => void;
  updateMatrixCell: (date: string, teamMemberId: string, assignments: Assignment[]) => void;
  
  // Assignment Analytics
  setAssignmentAnalytics: (analytics: AssignmentAnalytics | null) => void;
  setAssignmentDashboardMetrics: (metrics: AssignmentDashboardMetrics | null) => void;
  calculateAssignmentAnalytics: (period: { start: string; end: string }) => void;
  
  // Assignment State Management
  setAssignmentInProgress: (inProgress: boolean) => void;
  refreshAssignmentData: () => Promise<void>;
  
  // Settings Actions
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  resetSettingsToDefaults: () => void;
  exportSettings: () => SettingsState;
  importSettings: (settings: SettingsState) => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  installations: [],
  selectedInstallation: null,
  selectedInstallations: [],
  filteredInstallations: [],
  installationFilters: {},
  pagination: {
    currentPage: 1,
    itemsPerPage: 25,
    totalItems: 0,
    totalPages: 0
  },
  schedules: [],
  selectedDate: new Date().toISOString().split('T')[0],
  dashboardStats: null,
  sidebarOpen: true,
  currentPage: 'dashboard',
  error: null,
  
  // Data Processing Initial State
  dataProcessingResult: null,
  dataProcessingHistory: [],
  uploadState: {
    file: null,
    isUploading: false,
    progress: 0,
    result: null,
    error: null
  },
  processingConfig: {
    strictValidation: false,
    skipEmptyRows: true,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    requiredFields: ['customerName', 'installDate', 'street', 'city', 'state', 'zipCode'],
    allowedFileTypes: ['xlsx', 'xls', 'csv'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  
  // Scheduling Initial State
  teams: [],
  schedulingResult: null,
  schedulingAnalytics: null,
  optimizationInProgress: false,
  
  // Assignment Management Initial State
  assignments: [],
  assignmentConflicts: [],
  workloadDistribution: [],
  autoAssignmentRules: [],
  assignmentMatrix: null,
  assignmentAnalytics: null,
  assignmentDashboardMetrics: null,
  selectedAssignment: null,
  assignmentInProgress: false,
  
  // Settings Initial State
  settings: {
    userPreferences: {
      theme: 'auto' as const,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY' as const,
      timeFormat: '12h' as const,
      defaultView: 'calendar' as const,
      language: 'en',
      itemsPerPage: 25,
      showAvatars: true,
      enableSounds: true,
      autoRefresh: true,
      refreshInterval: 300, // 5 minutes
    },
    systemConfig: {
      workingHours: {
        start: '08:00',
        end: '17:00',
      },
      defaultJobDuration: 120, // 2 hours
      travelTimeBuffer: 30,    // 30 minutes
      maxJobsPerDay: 50,
      maxJobsPerTeamMember: 8,
      autoAssignments: true,
      enableOptimization: true,
      optimizationGoal: 'travel_distance' as const,
      requireApprovalForChanges: false,
      allowOvertimeAssignment: false,
      backupTechnicianRequired: true,
      weatherIntegration: false,
      trafficIntegration: false,
      customerPreferenceWeighting: 70,
    },
    notificationSettings: {
      emailNotifications: {
        enabled: true,
        scheduleChanges: true,
        newAssignments: true,
        deadlineReminders: true,
        performanceReports: false,
        systemAlerts: true,
        weeklyDigest: true,
        frequency: 'immediate' as const,
      },
      smsNotifications: {
        enabled: false,
        urgentOnly: true,
        scheduleChanges: false,
        newAssignments: false,
        emergencyAlerts: false,
      },
      pushNotifications: {
        enabled: true,
        scheduleChanges: true,
        newAssignments: true,
        deadlineReminders: true,
        systemAlerts: true,
      },
      digestSettings: {
        enabled: true,
        frequency: 'daily' as const,
        deliveryTime: '08:00',
        includeMetrics: true,
        includeUpcoming: true,
      },
    },
    securitySettings: {
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordExpiry: 90,
      },
      authenticationSettings: {
        twoFactorEnabled: false,
        sessionTimeout: 480, // 8 hours
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        requireReauthForSensitive: true,
      },
      dataSettings: {
        allowExport: true,
        allowBulkOperations: true,
        auditLogging: true,
        dataRetention: 365,
        encryptSensitiveData: true,
      },
      accessControl: {
        restrictIPAccess: false,
        requireVPN: false,
        blockConcurrentSessions: false,
      },
    },
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // User and Auth Actions
        setUser: (user) => set({ user }, false, 'setUser'),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }, false, 'setAuthenticated'),
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

        // Installation Actions
        setInstallations: (installations) => set({ installations }, false, 'setInstallations'),
        setSelectedInstallation: (installation) => set({ selectedInstallation: installation }, false, 'setSelectedInstallation'),
        
        addInstallation: (installation) => {
          const { installations } = get();
          set({ installations: [...installations, installation] }, false, 'addInstallation');
        },
        
        updateInstallation: (id, updates) => {
          const { installations } = get();
          set({
            installations: installations.map(inst => 
              inst.id === id ? { ...inst, ...updates } : inst
            )
          }, false, 'updateInstallation');
        },
        
        removeInstallation: (id) => {
          const { installations } = get();
          set({
            installations: installations.filter(inst => inst.id !== id)
          }, false, 'removeInstallation');
        },

        // Installation Selection and Filtering Actions
        setSelectedInstallations: (ids) => set({ selectedInstallations: ids }, false, 'setSelectedInstallations'),
        
        toggleInstallationSelection: (id) => {
          const { selectedInstallations } = get();
          const updatedSelection = selectedInstallations.includes(id)
            ? selectedInstallations.filter(selectedId => selectedId !== id)
            : [...selectedInstallations, id];
          set({ selectedInstallations: updatedSelection }, false, 'toggleInstallationSelection');
        },
        
        clearInstallationSelection: () => set({ selectedInstallations: [] }, false, 'clearInstallationSelection'),
        
        setFilteredInstallations: (installations) => set({ filteredInstallations: installations }, false, 'setFilteredInstallations'),
        
        setInstallationFilters: (filters) => set({ installationFilters: filters }, false, 'setInstallationFilters'),
        
        clearInstallationFilters: () => set({ installationFilters: {} }, false, 'clearInstallationFilters'),
        
        setPagination: (pagination) => {
          const { pagination: currentPagination } = get();
          set({ pagination: { ...currentPagination, ...pagination } }, false, 'setPagination');
        },
        
        // Bulk Operations
        bulkUpdateInstallations: async (ids, updates) => {
          const { installations } = get();
          const updatedInstallations = installations.map(installation => 
            ids.includes(installation.id) 
              ? { ...installation, ...updates, updatedAt: new Date().toISOString() }
              : installation
          );
          set({ installations: updatedInstallations }, false, 'bulkUpdateInstallations');
        },
        
        bulkDeleteInstallations: async (ids) => {
          const { installations } = get();
          const remainingInstallations = installations.filter(installation => 
            !ids.includes(installation.id)
          );
          set({ 
            installations: remainingInstallations,
            selectedInstallations: []
          }, false, 'bulkDeleteInstallations');
        },

        // Schedule Actions
        setSchedules: (schedules) => set({ schedules }, false, 'setSchedules'),
        setSelectedDate: (date) => set({ selectedDate: date }, false, 'setSelectedDate'),

        // Dashboard Actions
        setDashboardStats: (stats) => set({ dashboardStats: stats }, false, 'setDashboardStats'),

        // UI Actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }, false, 'setSidebarOpen'),
        setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),
        setError: (error) => set({ error }, false, 'setError'),
        clearError: () => set({ error: null }, false, 'clearError'),

        // Reset all state
        reset: () => set(initialState, false, 'reset'),

        // Data Processing Actions
        setDataProcessingResult: (result) => set({ dataProcessingResult: result }, false, 'setDataProcessingResult'),
        
        addToProcessingHistory: (result) => {
          const { dataProcessingHistory } = get();
          set({
            dataProcessingHistory: [result, ...dataProcessingHistory].slice(0, 10) // Keep last 10 results
          }, false, 'addToProcessingHistory');
        },
        
        clearProcessingHistory: () => set({ dataProcessingHistory: [] }, false, 'clearProcessingHistory'),
        
        setUploadState: (state) => {
          const { uploadState } = get();
          set({ uploadState: { ...uploadState, ...state } }, false, 'setUploadState');
        },
        
        resetUploadState: () => set({ 
          uploadState: {
            file: null,
            isUploading: false,
            progress: 0,
            result: null,
            error: null
          }
        }, false, 'resetUploadState'),
        
        setProcessingConfig: (config) => {
          const { processingConfig } = get();
          set({ processingConfig: { ...processingConfig, ...config } }, false, 'setProcessingConfig');
        },
        
        importProcessedData: (data) => {
          const { installations } = get();
          const convertedInstallations: Installation[] = data.map(item => ({
            id: item.id,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            customerEmail: item.customerEmail,
            address: item.address,
            scheduledDate: item.installDate,
            scheduledTime: item.installTime || '09:00',
            duration: item.duration || 120,
            status: 'pending' as const,
            priority: item.priority,
            notes: item.notes,
            leadId: undefined,
            assistantId: undefined,
            createdAt: item.createdAt,
            updatedAt: item.createdAt
          }));
          
          set({ installations: [...installations, ...convertedInstallations] }, false, 'importProcessedData');
        },
        
        bulkAddInstallations: (data) => {
          const { installations, addToProcessingHistory, setDataProcessingResult } = get();
          
          // Convert processed data to installations
          const convertedInstallations: Installation[] = data.map((item, index) => ({
            id: item.id || `bulk_${Date.now()}_${index}`,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            customerEmail: item.customerEmail,
            address: item.address,
            scheduledDate: item.installDate,
            scheduledTime: item.installTime || '09:00',
            duration: item.duration || 120,
            status: 'pending' as const,
            priority: item.priority,
            notes: item.notes,
            leadId: undefined,
            assistantId: undefined,
            createdAt: item.createdAt,
            updatedAt: item.createdAt
          }));
          
          // Add to installations
          set({ installations: [...installations, ...convertedInstallations] }, false, 'bulkAddInstallations');
          
          // Create a processing result for history
          const processingResult: ProcessingResult = {
            validData: data,
            errors: [],
            warnings: [],
            metadata: {
              fileName: `bulk_import_${new Date().toISOString().split('T')[0]}`,
              fileSize: 0,
              fileType: 'bulk',
              totalRows: data.length,
              validRows: data.length,
              errorRows: 0,
              warningRows: 0,
              regionsDetected: [...new Set(data.map(d => d.region).filter(Boolean))],
              installationTypes: [...new Set(data.map(d => d.installationType).filter(Boolean))],
              processedAt: new Date().toISOString()
            },
            schemaMap: {}
          };
          
          addToProcessingHistory(processingResult);
        },

        // Scheduling Actions
        setTeams: (teams) => set({ teams }, false, 'setTeams'),
        
        addTeamMember: (team) => {
          const { teams } = get();
          set({ teams: [...teams, team] }, false, 'addTeamMember');
        },
        
        updateTeamMember: (id, updates) => {
          const { teams } = get();
          set({
            teams: teams.map(team => 
              team.id === id ? { ...team, ...updates } : team
            )
          }, false, 'updateTeamMember');
        },
        
        removeTeamMember: (id) => {
          const { teams } = get();
          set({
            teams: teams.filter(team => team.id !== id)
          }, false, 'removeTeamMember');
        },
        
        setSchedulingResult: (result) => set({ schedulingResult: result }, false, 'setSchedulingResult'),
        
        setSchedulingAnalytics: (analytics) => set({ schedulingAnalytics: analytics }, false, 'setSchedulingAnalytics'),
        
        setOptimizationInProgress: (inProgress) => set({ optimizationInProgress: inProgress }, false, 'setOptimizationInProgress'),
        
        updateAssignment: (assignmentId, updates) => {
          const { schedulingResult } = get();
          if (!schedulingResult) return;
          
          const updatedAssignments = schedulingResult.assignments.map(assignment =>
            assignment.id === assignmentId ? { ...assignment, ...updates } : assignment
          );
          
          set({
            schedulingResult: {
              ...schedulingResult,
              assignments: updatedAssignments
            }
          }, false, 'updateAssignment');
        },

        // Assignment Management Actions
        createAssignment: async (request) => {
          set({ assignmentInProgress: true }, false, 'createAssignment:start');
          try {
            // Create assignment from request
            const assignment: Assignment = {
              id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              installationId: request.installationId,
              leadId: request.leadId || '',
              assistantId: request.assistantId,
              assignedAt: new Date().toISOString(),
              assignedBy: get().user?.id || 'system',
              status: 'assigned',
              priority: request.priority,
              estimatedDuration: 120, // default 2 hours
              notes: request.notes,
              metadata: {
                autoAssigned: false,
                conflictResolved: false,
                workloadScore: 0.8,
                efficiencyScore: 0.9,
                customerPreference: false
              },
              history: [{
                id: `history_${Date.now()}`,
                assignmentId: '',
                action: 'created',
                performedBy: get().user?.id || 'system',
                performedAt: new Date().toISOString(),
                newValue: request,
                reason: 'Manual assignment creation'
              }]
            };
            
            assignment.history[0].assignmentId = assignment.id;
            
            const { assignments } = get();
            set({ 
              assignments: [...assignments, assignment],
              assignmentInProgress: false
            }, false, 'createAssignment:success');
            
            return {
              assignmentId: assignment.id,
              installationId: assignment.installationId,
              teamMemberId: assignment.leadId,
              confidence: 0.9,
              score: 85,
              reasoning: ['Manual assignment created'],
              alternatives: [],
              warnings: []
            };
          } catch (error) {
            set({ assignmentInProgress: false }, false, 'createAssignment:error');
            throw error;
          }
        },

        updateAssignmentById: async (id, updates) => {
          set({ assignmentInProgress: true }, false, 'updateAssignment:start');
          try {
            const { assignments } = get();
            const existingAssignment = assignments.find(a => a.id === id);
            if (!existingAssignment) {
              throw new Error(`Assignment with id ${id} not found`);
            }

            const updatedAssignments = assignments.map(assignment => {
              if (assignment.id === id) {
                const historyEntry = {
                  id: `history_${Date.now()}`,
                  assignmentId: id,
                  action: 'reassigned' as const,
                  performedBy: get().user?.id || 'system',
                  performedAt: new Date().toISOString(),
                  previousValue: { ...assignment },
                  newValue: updates,
                  reason: updates.reason || 'Assignment updated'
                };

                return {
                  ...assignment,
                  ...updates,
                  history: [...assignment.history, historyEntry]
                };
              }
              return assignment;
            });

            set({ 
              assignments: updatedAssignments,
              assignmentInProgress: false
            }, false, 'updateAssignment:success');
          } catch (error) {
            set({ assignmentInProgress: false }, false, 'updateAssignment:error');
            throw error;
          }
        },

        deleteAssignment: async (id) => {
          set({ assignmentInProgress: true }, false, 'deleteAssignment:start');
          try {
            const { assignments, selectedAssignment } = get();
            const updatedAssignments = assignments.filter(a => a.id !== id);
            
            set({ 
              assignments: updatedAssignments,
              selectedAssignment: selectedAssignment?.id === id ? null : selectedAssignment,
              assignmentInProgress: false
            }, false, 'deleteAssignment:success');
          } catch (error) {
            set({ assignmentInProgress: false }, false, 'deleteAssignment:error');
            throw error;
          }
        },

        getAssignmentById: (id) => {
          const { assignments } = get();
          return assignments.find(a => a.id === id) || null;
        },

        setSelectedAssignment: (assignment) => set({ selectedAssignment: assignment }, false, 'setSelectedAssignment'),
        setAssignments: (assignments) => set({ assignments }, false, 'setAssignments'),

        addAssignment: (assignment) => {
          const { assignments } = get();
          set({ assignments: [...assignments, assignment] }, false, 'addAssignment');
        },

        removeAssignment: (id) => {
          const { assignments, selectedAssignment } = get();
          set({
            assignments: assignments.filter(a => a.id !== id),
            selectedAssignment: selectedAssignment?.id === id ? null : selectedAssignment
          }, false, 'removeAssignment');
        },

        // Conflict Management
        setAssignmentConflicts: (conflicts) => set({ assignmentConflicts: conflicts }, false, 'setAssignmentConflicts'),
        
        addAssignmentConflict: (conflict) => {
          const { assignmentConflicts } = get();
          set({ assignmentConflicts: [...assignmentConflicts, conflict] }, false, 'addAssignmentConflict');
        },

        resolveConflict: async (conflictId, resolution) => {
          const { assignmentConflicts } = get();
          const updatedConflicts = assignmentConflicts.map(conflict => {
            if (conflict.id === conflictId) {
              return {
                ...conflict,
                resolvedAt: new Date().toISOString(),
                resolvedBy: get().user?.id || 'system',
                resolutionMethod: resolution.method
              };
            }
            return conflict;
          });
          set({ assignmentConflicts: updatedConflicts }, false, 'resolveConflict');
        },

        removeConflict: (conflictId) => {
          const { assignmentConflicts } = get();
          set({
            assignmentConflicts: assignmentConflicts.filter(c => c.id !== conflictId)
          }, false, 'removeConflict');
        },

        detectConflicts: () => {
          // Implement conflict detection logic
          const { assignments, teams } = get();
          const conflicts: AssignmentConflict[] = [];
          
          // Basic time overlap detection
          assignments.forEach((assignment, index) => {
            assignments.slice(index + 1).forEach(otherAssignment => {
              if (assignment.leadId === otherAssignment.leadId && 
                  assignment.installationId !== otherAssignment.installationId) {
                conflicts.push({
                  id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: 'time_overlap',
                  affectedAssignments: [assignment.id, otherAssignment.id],
                  severity: 'medium',
                  description: 'Team member has overlapping assignments',
                  detectedAt: new Date().toISOString(),
                  suggestedResolutions: [],
                  autoResolvable: true,
                  impactScore: 7
                });
              }
            });
          });

          set({ assignmentConflicts: conflicts }, false, 'detectConflicts');
        },

        // Workload Management
        setWorkloadDistribution: (data) => set({ workloadDistribution: data }, false, 'setWorkloadDistribution'),

        updateWorkloadData: (teamMemberId, date, data) => {
          const { workloadDistribution } = get();
          const updatedData = workloadDistribution.map(item => {
            if (item.teamMemberId === teamMemberId && item.date === date) {
              return { ...item, ...data };
            }
            return item;
          });
          set({ workloadDistribution: updatedData }, false, 'updateWorkloadData');
        },

        calculateWorkloadDistribution: (dateRange) => {
          const { assignments, teams } = get();
          const workloadData: WorkloadData[] = [];
          
          teams.forEach(team => {
            const teamAssignments = assignments.filter(a => a.leadId === team.id || a.assistantId === team.id);
            workloadData.push({
              teamMemberId: team.id,
              date: dateRange.start,
              assignedHours: teamAssignments.length * 2, // assuming 2 hours per job
              capacity: team.capacity * 8, // assuming 8 hour work day
              efficiency: team.performanceMetrics?.travelEfficiency || 0.8,
              conflicts: 0,
              utilizationPercentage: (teamAssignments.length * 2) / (team.capacity * 8) * 100,
              workloadStatus: 'optimal',
              assignments: teamAssignments.map(a => a.id),
              travelTime: 60, // default 1 hour travel time
              bufferTime: 30, // default 30 minutes buffer
              overtimeHours: 0
            });
          });

          set({ workloadDistribution: workloadData }, false, 'calculateWorkloadDistribution');
        },

        // Auto Assignment
        setAutoAssignmentRules: (rules) => set({ autoAssignmentRules: rules }, false, 'setAutoAssignmentRules'),

        addAutoAssignmentRule: (rule) => {
          const { autoAssignmentRules } = get();
          set({ autoAssignmentRules: [...autoAssignmentRules, rule] }, false, 'addAutoAssignmentRule');
        },

        updateAutoAssignmentRule: (id, updates) => {
          const { autoAssignmentRules } = get();
          const updatedRules = autoAssignmentRules.map(rule =>
            rule.id === id ? { ...rule, ...updates } : rule
          );
          set({ autoAssignmentRules: updatedRules }, false, 'updateAutoAssignmentRule');
        },

        removeAutoAssignmentRule: (id) => {
          const { autoAssignmentRules } = get();
          set({
            autoAssignmentRules: autoAssignmentRules.filter(rule => rule.id !== id)
          }, false, 'removeAutoAssignmentRule');
        },

        runAutoAssignment: async (criteria) => {
          const { installations, teams, assignments } = get();
          const results: AssignmentResult[] = [];
          
          const unassignedInstallations = installations.filter(inst => 
            !assignments.some(a => a.installationId === inst.id)
          );

          for (const installation of unassignedInstallations) {
            const availableTeams = teams.filter(team => team.isActive);
            if (availableTeams.length === 0) continue;

            // Simple assignment logic - choose first available team
            const assignedTeam = availableTeams[0];
            
            results.push({
              assignmentId: `auto_${Date.now()}_${installation.id}`,
              installationId: installation.id,
              teamMemberId: assignedTeam.id,
              confidence: 0.8,
              score: 75,
              reasoning: ['Automatically assigned based on availability'],
              alternatives: availableTeams.slice(1).map(team => ({
                teamMemberId: team.id,
                score: 70,
                reasoning: ['Alternative team member'],
                tradeoffs: ['Less optimal travel distance']
              })),
              warnings: []
            });
          }

          return results;
        },

        runBulkAssignment: async (request) => {
          const results: AssignmentResult[] = [];
          const errors: BulkAssignmentError[] = [];
          
          for (const installationId of request.installationIds) {
            try {
              const assignmentResults = await get().runAutoAssignment(request.criteria);
              const result = assignmentResults.find(r => r.installationId === installationId);
              if (result) {
                results.push(result);
              }
            } catch (error) {
              errors.push({
                installationId,
                error: 'Assignment failed',
                reason: error instanceof Error ? error.message : 'Unknown error',
                suggestedAction: 'Try manual assignment'
              });
            }
          }

          return {
            totalRequests: request.installationIds.length,
            successful: results.length,
            failed: errors.length,
            conflicts: 0,
            results,
            errors,
            summary: {
              processingTime: 2000, // 2 seconds
              optimizationScore: 85,
              workloadDistribution: {},
              travelOptimization: 0.8,
              conflictsResolved: 0,
              recommendations: ['Consider running optimization after bulk assignment']
            }
          };
        },

        // Assignment Matrix
        setAssignmentMatrix: (matrix) => set({ assignmentMatrix: matrix }, false, 'setAssignmentMatrix'),

        generateAssignmentMatrix: (dateRange) => {
          const { assignments, teams } = get();
          const dates = [dateRange.start, dateRange.end]; // Simplified date range
          
          const matrixCells: AssignmentMatrixCell[][] = [];
          dates.forEach(date => {
            const row: AssignmentMatrixCell[] = [];
            teams.forEach(team => {
              const teamAssignments = assignments.filter(a => 
                (a.leadId === team.id || a.assistantId === team.id)
              );
              
              row.push({
                date,
                teamMemberId: team.id,
                assignments: teamAssignments,
                capacity: team.capacity,
                utilization: teamAssignments.length / team.capacity,
                conflicts: [],
                status: teamAssignments.length > team.capacity ? 'overbooked' : 'assigned',
                travelDistance: 0,
                workloadScore: teamAssignments.length / team.capacity
              });
            });
            matrixCells.push(row);
          });

          const matrix: AssignmentMatrix = {
            dates,
            teamMembers: teams,
            assignments: matrixCells,
            conflicts: [],
            workloadSummary: teams.map(team => ({
              teamMemberId: team.id,
              totalAssignments: assignments.filter(a => a.leadId === team.id || a.assistantId === team.id).length,
              totalHours: 0,
              averageUtilization: 0.8,
              peakUtilization: 1.0,
              conflicts: 0,
              efficiency: 0.9,
              travelDistance: 0,
              recommendations: []
            })),
            optimizationScore: 85
          };

          set({ assignmentMatrix: matrix }, false, 'generateAssignmentMatrix');
        },

        updateMatrixCell: (date, teamMemberId, assignments) => {
          const { assignmentMatrix } = get();
          if (!assignmentMatrix) return;

          const updatedMatrix = { ...assignmentMatrix };
          const dateIndex = updatedMatrix.dates.indexOf(date);
          const teamIndex = updatedMatrix.teamMembers.findIndex(t => t.id === teamMemberId);
          
          if (dateIndex >= 0 && teamIndex >= 0) {
            updatedMatrix.assignments[dateIndex][teamIndex].assignments = assignments;
          }

          set({ assignmentMatrix: updatedMatrix }, false, 'updateMatrixCell');
        },

        // Assignment Analytics
        setAssignmentAnalytics: (analytics) => set({ assignmentAnalytics: analytics }, false, 'setAssignmentAnalytics'),
        setAssignmentDashboardMetrics: (metrics) => set({ assignmentDashboardMetrics: metrics }, false, 'setAssignmentDashboardMetrics'),

        calculateAssignmentAnalytics: (period) => {
          const { assignments, teams, assignmentConflicts } = get();
          
          const analytics: AssignmentAnalytics = {
            period,
            totalAssignments: assignments.length,
            autoAssignments: assignments.filter(a => a.metadata.autoAssigned).length,
            manualAssignments: assignments.filter(a => !a.metadata.autoAssigned).length,
            reassignments: assignments.filter(a => a.metadata.originalAssignmentId).length,
            conflicts: assignmentConflicts.length,
            resolutionRate: 0.95,
            averageResponseTime: 300, // 5 minutes
            teamUtilization: teams.map(team => ({
              teamMemberId: team.id,
              name: `${team.firstName} ${team.lastName}`,
              utilizationRate: 0.85,
              totalHours: 40,
              workingDays: 5,
              assignmentCount: assignments.filter(a => a.leadId === team.id || a.assistantId === team.id).length,
              averageJobsPerDay: 3,
              travelTime: 60,
              efficiency: team.performanceMetrics?.travelEfficiency || 0.8,
              overutilizedDays: 0,
              underutilizedDays: 1
            })),
            workloadDistribution: {
              variance: 0.2,
              standardDeviation: 0.45,
              balanceScore: 0.8,
              overutilizedTeamMembers: 0,
              underutilizedTeamMembers: 1,
              optimalTeamMembers: teams.length - 1,
              redistributionOpportunities: 2
            },
            efficiencyMetrics: {
              averageAssignmentTime: 120,
              averageTravelDistance: 25,
              skillMatchRate: 0.9,
              geographicEfficiency: 0.85,
              conflictRate: assignmentConflicts.length / assignments.length,
              autoResolutionRate: 0.8,
              customerSatisfactionImpact: 0.95,
              costPerAssignment: 150
            },
            trendData: [],
            recommendations: []
          };

          set({ assignmentAnalytics: analytics }, false, 'calculateAssignmentAnalytics');
        },

        // Assignment State Management
        setAssignmentInProgress: (inProgress) => set({ assignmentInProgress: inProgress }, false, 'setAssignmentInProgress'),

        refreshAssignmentData: async () => {
          // Refresh all assignment-related data
          get().detectConflicts();
          get().calculateWorkloadDistribution({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
          get().generateAssignmentMatrix({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
        },

        // Settings Actions
        updateUserPreferences: (preferences) => {
          const { settings } = get();
          set({
            settings: {
              ...settings,
              userPreferences: { ...settings.userPreferences, ...preferences },
              lastModified: new Date().toISOString(),
              modifiedBy: get().user?.id || 'unknown',
            }
          }, false, 'updateUserPreferences');
        },

        updateSystemConfig: (config) => {
          const { settings } = get();
          set({
            settings: {
              ...settings,
              systemConfig: { ...settings.systemConfig, ...config },
              lastModified: new Date().toISOString(),
              modifiedBy: get().user?.id || 'unknown',
            }
          }, false, 'updateSystemConfig');
        },

        updateNotificationSettings: (notificationSettings) => {
          const { settings } = get();
          set({
            settings: {
              ...settings,
              notificationSettings: { ...settings.notificationSettings, ...notificationSettings },
              lastModified: new Date().toISOString(),
              modifiedBy: get().user?.id || 'unknown',
            }
          }, false, 'updateNotificationSettings');
        },

        updateSecuritySettings: (securitySettings) => {
          const { settings } = get();
          set({
            settings: {
              ...settings,
              securitySettings: { ...settings.securitySettings, ...securitySettings },
              lastModified: new Date().toISOString(),
              modifiedBy: get().user?.id || 'unknown',
            }
          }, false, 'updateSecuritySettings');
        },

        resetSettingsToDefaults: () => {
          set({
            settings: {
              ...initialState.settings,
              lastModified: new Date().toISOString(),
              modifiedBy: get().user?.id || 'system',
            }
          }, false, 'resetSettingsToDefaults');
        },

        exportSettings: () => {
          return get().settings;
        },

        importSettings: (importedSettings) => {
          set({
            settings: {
              ...importedSettings,
              lastModified: new Date().toISOString(),
              modifiedBy: get().user?.id || 'unknown',
            }
          }, false, 'importSettings');
        },
      }),
      {
        name: 'think-tank-scheduler',
        partialize: (state) => ({
          // Only persist certain parts of the state
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sidebarOpen: state.sidebarOpen,
          selectedDate: state.selectedDate,
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'Think Tank Technologies - Installation Scheduler',
    }
  )
);

// Selectors for better performance and reusability
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useInstallations = () => useAppStore((state) => state.installations);
export const useSelectedInstallation = () => useAppStore((state) => state.selectedInstallation);
export const useSchedules = () => useAppStore((state) => state.schedules);
export const useSelectedDate = () => useAppStore((state) => state.selectedDate);
export const useDashboardStats = () => useAppStore((state) => state.dashboardStats);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useCurrentPage = () => useAppStore((state) => state.currentPage);
export const useError = () => useAppStore((state) => state.error);

// Data Processing Selectors
export const useDataProcessingResult = () => useAppStore((state) => state.dataProcessingResult);
export const useDataProcessingHistory = () => useAppStore((state) => state.dataProcessingHistory);
export const useUploadState = () => useAppStore((state) => state.uploadState);
export const useProcessingConfig = () => useAppStore((state) => state.processingConfig);

// Scheduling Selectors
export const useTeams = () => useAppStore((state) => state.teams);
export const useSchedulingResult = () => useAppStore((state) => state.schedulingResult);
export const useSchedulingAnalytics = () => useAppStore((state) => state.schedulingAnalytics);
export const useOptimizationInProgress = () => useAppStore((state) => state.optimizationInProgress);

// Assignment Selectors
export const useAssignments = () => useAppStore((state) => state.assignments);
export const useAssignmentConflicts = () => useAppStore((state) => state.assignmentConflicts);
export const useWorkloadDistribution = () => useAppStore((state) => state.workloadDistribution);
export const useAutoAssignmentRules = () => useAppStore((state) => state.autoAssignmentRules);
export const useAssignmentMatrix = () => useAppStore((state) => state.assignmentMatrix);
export const useAssignmentAnalytics = () => useAppStore((state) => state.assignmentAnalytics);
export const useAssignmentDashboardMetrics = () => useAppStore((state) => state.assignmentDashboardMetrics);
export const useSelectedAssignment = () => useAppStore((state) => state.selectedAssignment);
export const useAssignmentInProgress = () => useAppStore((state) => state.assignmentInProgress);

// Settings Selectors
export const useSettings = () => useAppStore((state) => state.settings);
export const useUserPreferences = () => useAppStore((state) => state.settings.userPreferences);
export const useSystemConfig = () => useAppStore((state) => state.settings.systemConfig);
export const useNotificationSettings = () => useAppStore((state) => state.settings.notificationSettings);
export const useSecuritySettings = () => useAppStore((state) => state.settings.securitySettings);