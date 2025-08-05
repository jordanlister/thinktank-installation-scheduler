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
  OptimizedAssignment
} from '../types';

interface AppState {
  // User and Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Installations
  installations: Installation[];
  selectedInstallation: Installation | null;
  
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
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setInstallations: (installations: Installation[]) => void;
  setSelectedInstallation: (installation: Installation | null) => void;
  addInstallation: (installation: Installation) => void;
  updateInstallation: (id: string, updates: Partial<Installation>) => void;
  removeInstallation: (id: string) => void;
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
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  installations: [],
  selectedInstallation: null,
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
      }),
      {
        name: 'think-tank-scheduler',
        partialize: (state) => ({
          // Only persist certain parts of the state
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sidebarOpen: state.sidebarOpen,
          selectedDate: state.selectedDate,
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