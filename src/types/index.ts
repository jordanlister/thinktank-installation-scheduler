// Think Tank Technologies Installation Scheduler - Type Definitions

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  ADMIN: 'admin',
  SCHEDULER: 'scheduler',
  LEAD: 'lead',
  ASSISTANT: 'assistant',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface Installation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: Address;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  status: InstallationStatus;
  priority: Priority;
  notes?: string;
  leadId?: string;
  assistantId?: string;
  createdAt: string;
  updatedAt: string;
}

export const InstallationStatus = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
} as const;

export type InstallationStatus = typeof InstallationStatus[keyof typeof InstallationStatus];

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Schedule {
  id: string;
  date: string;
  installations: Installation[];
  totalInstallations: number;
  completedInstallations: number;
  notes?: string;
}

export interface Assignment {
  id: string;
  installationId: string;
  leadId: string;
  assistantId?: string;
  assignedAt: string;
  assignedBy: string;
  status: AssignmentStatus;
}

export const AssignmentStatus = {
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed'
} as const;

export type AssignmentStatus = typeof AssignmentStatus[keyof typeof AssignmentStatus];

// UI and Application Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface FilterOptions {
  status?: InstallationStatus[];
  priority?: Priority[];
  dateRange?: {
    start: string;
    end: string;
  };
  assignee?: string[];
}

export interface DashboardStats {
  totalInstallations: number;
  pendingInstallations: number;
  scheduledInstallations: number;
  completedInstallations: number;
  todayInstallations: number;
  weekInstallations: number;
  monthInstallations: number;
}

// Navigation and Routing
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles?: UserRole[];
  children?: NavItem[];
}

// Data Processing Types
export interface RawJobData {
  [key: string]: any;
}

export interface ProcessedJobData {
  id: string;
  jobId?: string;
  storeNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: Address;
  installDate: string;
  installTime?: string;
  duration?: number;
  installationType: string;
  specifications?: string[];
  requirements?: string;
  priority: Priority;
  region?: string;
  notes?: string;
  createdAt: string;
}

export interface ValidationError {
  row: number;
  column: string;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ProcessingResult {
  validData: ProcessedJobData[];
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata: ProcessingMetadata;
  schemaMap: ColumnMapping;
}

export interface ProcessingMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  dateRange?: {
    start: string;
    end: string;
  };
  regionsDetected: string[];
  installationTypes: string[];
  processedAt: string;
}

export interface ColumnMapping {
  [standardField: string]: {
    detectedColumn: string;
    confidence: number;
    aliases: string[];
  };
}

export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  progress: number;
  result: ProcessingResult | null;
  error: string | null;
}

export interface DataProcessingConfig {
  strictValidation: boolean;
  skipEmptyRows: boolean;
  dateFormat: string;
  timeFormat: string;
  requiredFields: string[];
  allowedFileTypes: string[];
  maxFileSize: number;
}

// Supported column aliases for intelligent mapping
export const COLUMN_ALIASES = {
  jobId: ['job_id', 'job id', 'id', 'job number', 'job_number', 'work order', 'wo'],
  storeNumber: ['store_number', 'store number', 'store_id', 'store id', 'location id', 'location_id', 'store #', 'store#'],
  customerName: ['customer_name', 'customer name', 'client name', 'client_name', 'name', 'customer'],
  customerPhone: ['customer_phone', 'customer phone', 'phone', 'phone number', 'phone_number', 'contact phone', 'mobile'],
  customerEmail: ['customer_email', 'customer email', 'email', 'email address', 'contact email'],
  street: ['street', 'address', 'street address', 'address line 1', 'address_line_1'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  zipCode: ['zip_code', 'zip code', 'zip', 'postal code', 'postal_code'],
  installDate: ['install_date', 'install date', 'date', 'scheduled date', 'scheduled_date', 'appointment date'],
  installTime: ['install_time', 'install time', 'time', 'scheduled time', 'scheduled_time', 'appointment time'],
  duration: ['duration', 'estimated duration', 'time required', 'hours'],
  installationType: ['installation_type', 'installation type', 'type', 'service type', 'work type'],
  specifications: ['specifications', 'specs', 'requirements', 'special requirements'],
  priority: ['priority', 'urgency', 'importance'],
  region: ['region', 'territory', 'area', 'district', 'zone'],
  notes: ['notes', 'comments', 'remarks', 'special notes', 'instructions']
} as const;

export type ColumnAlias = keyof typeof COLUMN_ALIASES;

// Team Management and Scheduling Types
export interface TeamMember extends User {
  region: string;
  subRegions: string[]; // Additional coverage areas
  specializations: string[];
  skills: Skill[];
  certifications: Certification[];
  equipment: Equipment[];
  availability: Availability[];
  capacity: number; // jobs per day
  travelRadius: number; // miles
  coordinates?: {
    lat: number;
    lng: number;
  };
  homeBase?: Address;
  performanceMetrics?: PerformanceMetrics;
  emergencyContact: EmergencyContact;
  preferredPartners?: string[]; // Team member IDs for preferred partnerships
  workPreferences: WorkPreferences;
  trainingRecord: TrainingRecord[];
  employmentInfo: EmploymentInfo;
  profilePhoto?: string;
  notes?: string;
}

export interface Availability {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringDays?: number[]; // 0-6 for Sunday-Saturday
  isAvailable: boolean;
  notes?: string;
}

export interface PerformanceMetrics {
  completionRate: number;
  averageTime: number;
  customerSatisfaction: number;
  travelEfficiency: number;
  totalJobs: number;
  totalDistance: number;
  qualityScore: number;
  safetyScore: number;
  punctualityScore: number;
  communicationScore: number;
  revenueGenerated: number;
  overtimeHours: number;
  periodStart: string;
  periodEnd: string;
}

// New comprehensive team management interfaces
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  acquiredDate: string;
  lastAssessed?: string;
  assessedBy?: string;
  notes?: string;
}

export const SkillCategory = {
  TECHNICAL: 'technical',
  SAFETY: 'safety',
  CUSTOMER_SERVICE: 'customer_service',
  EQUIPMENT: 'equipment',
  SPECIALIZED: 'specialized',
  MANAGEMENT: 'management'
} as const;

export type SkillCategory = typeof SkillCategory[keyof typeof SkillCategory];

export const SkillLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
  MASTER: 'master'
} as const;

export type SkillLevel = typeof SkillLevel[keyof typeof SkillLevel];

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  certificationNumber: string;
  issueDate: string;
  expirationDate?: string;
  status: CertificationStatus;
  renewalRequired: boolean;
  documentUrl?: string;
  cost?: number;
  notes?: string;
}

export const CertificationStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  EXPIRING_SOON: 'expiring_soon',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
} as const;

export type CertificationStatus = typeof CertificationStatus[keyof typeof CertificationStatus];

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  serialNumber?: string;
  assignedDate: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  lastInspected?: string;
  nextInspectionDue?: string;
  purchaseDate?: string;
  warranty?: {
    expirationDate: string;
    provider: string;
  };
  specifications?: { [key: string]: string };
  notes?: string;
}

export const EquipmentType = {
  VEHICLE: 'vehicle',
  TOOLS: 'tools',
  SAFETY_EQUIPMENT: 'safety_equipment',
  TESTING_EQUIPMENT: 'testing_equipment',
  COMMUNICATION: 'communication',
  TECHNOLOGY: 'technology',
  PPE: 'ppe'
} as const;

export type EquipmentType = typeof EquipmentType[keyof typeof EquipmentType];

export const EquipmentStatus = {
  ASSIGNED: 'assigned',
  AVAILABLE: 'available',
  IN_REPAIR: 'in_repair',
  OUT_OF_SERVICE: 'out_of_service',
  RETIRED: 'retired'
} as const;

export type EquipmentStatus = typeof EquipmentStatus[keyof typeof EquipmentStatus];

export const EquipmentCondition = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  NEEDS_REPLACEMENT: 'needs_replacement'
} as const;

export type EquipmentCondition = typeof EquipmentCondition[keyof typeof EquipmentCondition];

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  alternatePhone?: string;
  email?: string;
  address?: Address;
}

export interface WorkPreferences {
  preferredStartTime: string;
  preferredEndTime: string;
  maxDailyJobs: number;
  maxWeeklyHours: number;
  weekendsAvailable: boolean;
  overtimeAvailable: boolean;
  travelPreference: TravelPreference;
  specialRequests?: string[];
  unavailableDates: string[];
}

export const TravelPreference = {
  LOCAL_ONLY: 'local_only',
  REGIONAL: 'regional',
  MULTI_STATE: 'multi_state',
  NATIONWIDE: 'nationwide'
} as const;

export type TravelPreference = typeof TravelPreference[keyof typeof TravelPreference];

export interface TrainingRecord {
  id: string;
  courseName: string;
  provider: string;
  completedDate: string;
  expirationDate?: string;
  score?: number;
  certificateUrl?: string;
  renewalRequired: boolean;
  cost?: number;
  hoursCompleted: number;
  notes?: string;
}

export interface EmploymentInfo {
  employeeId: string;
  hireDate: string;
  department: string;
  jobTitle: string;
  payGrade?: string;
  supervisor?: string;
  workLocation: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  probationEndDate?: string;
  benefits?: string[];
}

export const EmploymentType = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  TEMPORARY: 'temporary',
  INTERN: 'intern'
} as const;

export type EmploymentType = typeof EmploymentType[keyof typeof EmploymentType];

export const EmploymentStatus = {
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
  RETIRED: 'retired'
} as const;

export type EmploymentStatus = typeof EmploymentStatus[keyof typeof EmploymentStatus];

// Extended Availability interface
export interface TimeOffRequest {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  type: TimeOffType;
  status: TimeOffStatus;
  reason?: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export const TimeOffType = {
  VACATION: 'vacation',
  SICK_LEAVE: 'sick_leave',
  PERSONAL: 'personal',
  FAMILY_LEAVE: 'family_leave',
  TRAINING: 'training',
  OTHER: 'other'
} as const;

export type TimeOffType = typeof TimeOffType[keyof typeof TimeOffType];

export const TimeOffStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELLED: 'cancelled'
} as const;

export type TimeOffStatus = typeof TimeOffStatus[keyof typeof TimeOffStatus];

// Team Pairing and Assignment Types
export interface TeamPairing {
  id: string;
  leadId: string;
  assistantId: string;
  region: string;
  compatibilityScore: number;
  pairingDate: string;
  totalJobsCompleted: number;
  averagePerformance: number;
  status: PairingStatus;
  notes?: string;
}

export const PairingStatus = {
  ACTIVE: 'active',
  TEMPORARY: 'temporary',
  INACTIVE: 'inactive',
  PREFERRED: 'preferred',
  AVOID: 'avoid'
} as const;

export type PairingStatus = typeof PairingStatus[keyof typeof PairingStatus];

export interface WorkloadAssignment {
  teamMemberId: string;
  date: string;
  scheduledJobs: string[]; // Installation IDs
  estimatedHours: number;
  travelTime: number;
  utilizationPercentage: number;
  workloadScore: number;
  status: WorkloadStatus;
}

export const WorkloadStatus = {
  UNDERUTILIZED: 'underutilized',
  OPTIMAL: 'optimal',
  OVERLOADED: 'overloaded',
  CRITICAL: 'critical'
} as const;

export type WorkloadStatus = typeof WorkloadStatus[keyof typeof WorkloadStatus];

// Bulk Operations and Data Management Types
export interface BulkTeamOperation {
  id: string;
  type: BulkOperationType;
  teamMemberIds: string[];
  changes: { [field: string]: any };
  requestedBy: string;
  requestedAt: string;
  status: BulkOperationStatus;
  results?: BulkOperationResult[];
  completedAt?: string;
  errors?: string[];
}

export const BulkOperationType = {
  UPDATE_AVAILABILITY: 'update_availability',
  UPDATE_SKILLS: 'update_skills',
  UPDATE_CERTIFICATIONS: 'update_certifications',
  UPDATE_REGIONS: 'update_regions',
  UPDATE_CAPACITY: 'update_capacity',
  REASSIGN_EQUIPMENT: 'reassign_equipment',
  UPDATE_STATUS: 'update_status'
} as const;

export type BulkOperationType = typeof BulkOperationType[keyof typeof BulkOperationType];

export const BulkOperationStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIALLY_COMPLETED: 'partially_completed'
} as const;

export type BulkOperationStatus = typeof BulkOperationStatus[keyof typeof BulkOperationStatus];

export interface BulkOperationResult {
  teamMemberId: string;
  success: boolean;
  error?: string;
  changesApplied?: { [field: string]: any };
}

// Team Analytics and Reporting Types
export interface TeamAnalytics {
  period: {
    start: string;
    end: string;
  };
  teamMetrics: TeamMetrics;
  individualPerformance: IndividualPerformance[];
  regionAnalysis: RegionTeamAnalysis[];
  skillGapAnalysis: SkillGapReport[];
  certificationStatus: CertificationStatusReport;
  equipmentUtilization: EquipmentUtilizationReport[];
  workloadDistribution: WorkloadDistributionReport;
  recommendations: TeamRecommendation[];
}

export interface TeamMetrics {
  totalTeamMembers: number;
  activeMembers: number;
  averageExperience: number;
  totalCertifications: number;
  expiringCertifications: number;
  skillCoverage: { [skill: string]: number };
  regionCoverage: { [region: string]: number };
  overallUtilization: number;
  performanceScore: number;
}

export interface IndividualPerformance {
  teamMemberId: string;
  name: string;
  role: UserRole;
  metrics: PerformanceMetrics;
  skillsAssessed: number;
  certificationsCurrent: number;
  utilizationRate: number;
  growthTrend: number;
  recommendations: string[];
}

export interface RegionTeamAnalysis {
  region: string;
  teamCount: number;
  leadCount: number;
  assistantCount: number;
  averagePerformance: number;
  coverage: number;
  demandVsCapacity: number;
  recommendations: string[];
}

export interface SkillGapReport {
  skill: string;
  category: SkillCategory;
  currentCapacity: number;
  requiredCapacity: number;
  gap: number;
  affectedRegions: string[];
  trainingRecommendations: string[];
}

export interface CertificationStatusReport {
  totalCertifications: number;
  activeCertifications: number;
  expiringSoon: number; // Within 30 days
  expired: number;
  byCategory: { [category: string]: number };
  renewalsCost: number;
}

export interface EquipmentUtilizationReport {
  equipmentType: EquipmentType;
  totalUnits: number;
  assignedUnits: number;
  utilizationRate: number;
  maintenanceRequired: number;
  replacementNeeded: number;
  totalValue: number;
}

export interface WorkloadDistributionReport {
  averageJobsPerDay: number;
  workloadVariance: number;
  overutilizedMembers: number;
  underutilizedMembers: number;
  optimalUtilization: number;
  recommendations: string[];
}

export interface TeamRecommendation {
  type: TeamRecommendationType;
  priority: Priority;
  description: string;
  impact: string;
  actionItems: string[];
  estimatedCost?: number;
  timeline?: string;
  affectedTeamMembers?: string[];
}

export const TeamRecommendationType = {
  HIRING: 'hiring',
  TRAINING: 'training',
  CERTIFICATION_RENEWAL: 'certification_renewal',
  EQUIPMENT_UPGRADE: 'equipment_upgrade',
  REGION_REBALANCING: 'region_rebalancing',
  PERFORMANCE_IMPROVEMENT: 'performance_improvement',
  WORKLOAD_ADJUSTMENT: 'workload_adjustment'
} as const;

export type TeamRecommendationType = typeof TeamRecommendationType[keyof typeof TeamRecommendationType];

// Scheduling Optimization Types
export interface SchedulingRequest {
  jobs: Installation[];
  teams: TeamMember[];
  constraints: SchedulingConstraints;
  preferences: SchedulingPreferences;
}

export interface SchedulingConstraints {
  maxDailyJobs: number;
  maxTravelDistance: number;
  bufferTime: number; // minutes between jobs
  workingHours: {
    start: string;
    end: string;
  };
  requiredSpecializations: { [jobId: string]: string[] };
  deadlines: { [jobId: string]: string };
  teamPreferences: { [jobId: string]: string[] }; // preferred team member IDs
}

export interface SchedulingPreferences {
  optimizationGoal: 'travel_distance' | 'workload_balance' | 'deadline_priority' | 'customer_satisfaction';
  allowOvertimeAssignment: boolean;
  prioritizeLeadContinuity: boolean;
  minimizeTeamSplits: boolean;
  geographicClustering: boolean;
}

export interface SchedulingResult {
  assignments: OptimizedAssignment[];
  unassignedJobs: Installation[];
  optimizationMetrics: OptimizationMetrics;
  conflicts: SchedulingConflict[];
  recommendations: string[];
  scheduleByDate: { [date: string]: DailySchedule };
}

export interface OptimizedAssignment extends Assignment {
  estimatedTravelTime: number;
  estimatedTravelDistance: number;
  travelRoute?: RoutePoint[];
  previousJobId?: string;
  nextJobId?: string;
  bufferTime: number;
  workloadScore: number;
  efficiencyScore: number;
}

export interface RoutePoint {
  jobId: string;
  address: Address;
  estimatedArrival: string;
  estimatedDeparture: string;
  distanceFromPrevious: number;
  travelTimeFromPrevious: number;
}

export interface DailySchedule {
  date: string;
  assignments: OptimizedAssignment[];
  totalJobs: number;
  totalTravelDistance: number;
  totalTravelTime: number;
  teamUtilization: { [teamMemberId: string]: number };
  warnings: string[];
}

export interface OptimizationMetrics {
  totalTravelDistance: number;
  totalTravelTime: number;
  averageJobsPerTeamMember: number;
  workloadVariance: number;
  geographicEfficiency: number;
  deadlineCompliance: number;
  utilizationRate: number;
  conflictRate: number;
  improvementPercentage: number;
}

export interface SchedulingConflict {
  id: string;
  type: ConflictType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedJobs: string[];
  affectedTeamMembers: string[];
  suggestedResolution?: string;
  autoResolvable: boolean;
}

export const ConflictType = {
  TIME_OVERLAP: 'time_overlap',
  CAPACITY_EXCEEDED: 'capacity_exceeded',
  TRAVEL_DISTANCE: 'travel_distance',
  UNAVAILABLE_TEAM: 'unavailable_team',
  MISSING_SPECIALIZATION: 'missing_specialization',
  DEADLINE_CONFLICT: 'deadline_conflict',
  GEOGRAPHIC_MISMATCH: 'geographic_mismatch'
} as const;

export type ConflictType = typeof ConflictType[keyof typeof ConflictType];

// Geographic and Routing Types
export interface GeographicCluster {
  id: string;
  center: { lat: number; lng: number };
  jobs: Installation[];
  radius: number;
  density: number;
  suggestedTeam?: string;
}

export interface DistanceMatrix {
  [fromJobId: string]: {
    [toJobId: string]: {
      distance: number;
      duration: number;
      route?: string;
    };
  };
}

export interface TravelOptimization {
  route: RoutePoint[];
  totalDistance: number;
  totalTime: number;
  savings: {
    distanceSaved: number;
    timeSaved: number;
    percentageImprovement: number;
  };
}

// Scheduling UI and Interface Types
export interface ScheduleViewConfig {
  viewType: 'calendar' | 'timeline' | 'list' | 'map';
  dateRange: {
    start: string;
    end: string;
  };
  filters: ScheduleFilters;
  groupBy: 'team' | 'date' | 'region' | 'priority';
}

export interface ScheduleFilters extends FilterOptions {
  teamMembers?: string[];
  regions?: string[];
  conflicts?: ConflictType[];
  utilizationRange?: {
    min: number;
    max: number;
  };
}

export interface DragDropOperation {
  sourceJobId: string;
  targetTeamMemberId: string;
  targetDate: string;
  targetTime?: string;
  operation: 'assign' | 'reassign' | 'swap';
}

export interface BulkOperation {
  type: 'assign' | 'reassign' | 'unassign' | 'reschedule';
  jobIds: string[];
  targetTeamMembers?: string[];
  targetDates?: string[];
  criteria?: BulkOperationCriteria;
}

export interface BulkOperationCriteria {
  region?: string;
  priority?: Priority;
  specialization?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  maxTravelDistance?: number;
}

// Analytics and Reporting Types
export interface SchedulingAnalytics {
  period: {
    start: string;
    end: string;
  };
  teamPerformance: TeamPerformanceReport[];
  regionAnalysis: RegionAnalysisReport[];
  efficiencyMetrics: EfficiencyMetrics;
  trendData: TrendData[];
  recommendations: AnalyticsRecommendation[];
}

export interface TeamPerformanceReport {
  teamMemberId: string;
  teamMemberName: string;
  role: UserRole;
  region: string;
  metrics: {
    totalJobs: number;
    completedJobs: number;
    averageJobsPerDay: number;
    totalTravelDistance: number;
    averageTravelDistance: number;
    utilizationRate: number;
    efficiencyScore: number;
    customerSatisfactionAvg: number;
  };
  trends: {
    jobVolumeChange: number;
    efficiencyChange: number;
    utilizationChange: number;
  };
}

export interface RegionAnalysisReport {
  region: string;
  totalJobs: number;
  teamCount: number;
  averageResponse: number;
  geographicSpread: number;
  utilizationRate: number;
  conflictRate: number;
  recommendations: string[];
}

export interface EfficiencyMetrics {
  overallUtilization: number;
  travelOptimization: number;
  workloadBalance: number;
  deadlineCompliance: number;
  costPerJob: number;
  timePerJob: number;
  customerSatisfaction: number;
}

export interface TrendData {
  date: string;
  metric: string;
  value: number;
  target?: number;
}

export interface AnalyticsRecommendation {
  type: 'team_adjustment' | 'route_optimization' | 'capacity_change' | 'specialization_training';
  priority: Priority;
  description: string;
  expectedImpact: string;
  actionItems: string[];
}

// Integration Types
export interface IntegrationData {
  source: 'data_processor' | 'team_management' | 'geographic_routing' | 'email_reports';
  timestamp: string;
  dataType: string;
  records: number;
  errors?: string[];
}

// Email and PDF Generation System Types
export interface EmailTemplate {
  id: string;
  name: string;
  type: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  bodyPlain: string;
  variables: EmailVariable[];
  targetAudience: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  metadata?: EmailTemplateMetadata;
}

export const EmailTemplateType = {
  ASSIGNMENT_NOTIFICATION: 'assignment_notification',
  SCHEDULE_UPDATE: 'schedule_update',
  PERFORMANCE_REPORT: 'performance_report',
  CUSTOMER_CONFIRMATION: 'customer_confirmation',
  TEAM_COMMUNICATION: 'team_communication',
  MANAGER_REPORT: 'manager_report',
  AUTOMATED_REMINDER: 'automated_reminder',
  BULK_NOTIFICATION: 'bulk_notification'
} as const;

export type EmailTemplateType = typeof EmailTemplateType[keyof typeof EmailTemplateType];

export interface EmailVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  example?: any;
}

export interface EmailTemplateMetadata {
  tags: string[];
  category: string;
  description: string;
  lastUsed?: string;
  usageCount: number;
  previewImageUrl?: string;
}

export interface EmailMessage {
  id: string;
  templateId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  from: string;
  replyTo?: string;
  subject: string;
  bodyHtml: string;
  bodyPlain: string;
  attachments?: EmailAttachment[];
  scheduledAt?: string;
  sentAt?: string;
  status: EmailStatus;
  variables: { [key: string]: any };
  metadata: EmailMessageMetadata;
  priority: Priority;
  trackingEnabled: boolean;
  deliveryReceipt?: EmailDeliveryReceipt;
}

export const EmailStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  BOUNCED: 'bounced',
  REJECTED: 'rejected'
} as const;

export type EmailStatus = typeof EmailStatus[keyof typeof EmailStatus];

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  content?: Buffer | string;
  cid?: string; // For inline attachments
}

export interface EmailMessageMetadata {
  campaignId?: string;
  sourceSystem: string;
  contextData: { [key: string]: any };
  recipientGroups: string[];
  generatedAt: string;
  externalId?: string;
}

export interface EmailDeliveryReceipt {
  messageId: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bounceReason?: string;
  rejectionReason?: string;
  events: EmailEvent[];
}

export interface EmailEvent {
  type: EmailEventType;
  timestamp: string;
  data?: any;
}

export const EmailEventType = {
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  COMPLAINED: 'complained',
  UNSUBSCRIBED: 'unsubscribed'
} as const;

export type EmailEventType = typeof EmailEventType[keyof typeof EmailEventType];

// PDF Report Generation Types
export interface PDFTemplate {
  id: string;
  name: string;
  type: PDFTemplateType;
  description: string;
  layout: PDFLayout;
  components: PDFComponent[];
  variables: PDFVariable[];
  styling: PDFStyling;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  metadata: PDFTemplateMetadata;
}

export const PDFTemplateType = {
  INSTALLATION_SCHEDULE: 'installation_schedule',
  TEAM_PERFORMANCE: 'team_performance',
  CUSTOMER_REPORT: 'customer_report',
  ANALYTICS_DASHBOARD: 'analytics_dashboard',
  INVENTORY_REPORT: 'inventory_report',
  FINANCIAL_SUMMARY: 'financial_summary',
  COMPLIANCE_REPORT: 'compliance_report',
  ROUTE_OPTIMIZATION: 'route_optimization'
} as const;

export type PDFTemplateType = typeof PDFTemplateType[keyof typeof PDFTemplateType];

export interface PDFLayout {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: PDFComponent;
  footer?: PDFComponent;
  watermark?: PDFWatermark;
}

export interface PDFComponent {
  id: string;
  type: PDFComponentType;
  position: PDFPosition;
  size: PDFSize;
  content: any;
  styling?: PDFComponentStyling;
  conditions?: PDFCondition[];
  dataBinding?: PDFDataBinding;
}

export const PDFComponentType = {
  TEXT: 'text',
  IMAGE: 'image',
  TABLE: 'table',
  CHART: 'chart',
  LIST: 'list',
  HEADER: 'header',
  FOOTER: 'footer',
  PAGE_BREAK: 'page_break',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  QR_CODE: 'qr_code',
  BARCODE: 'barcode'
} as const;

export type PDFComponentType = typeof PDFComponentType[keyof typeof PDFComponentType];

export interface PDFPosition {
  x: number;
  y: number;
  relative?: boolean;
}

export interface PDFSize {
  width: number;
  height: number;
  autoSize?: boolean;
}

export interface PDFVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object' | 'image';
  description: string;
  required: boolean;
  defaultValue?: any;
  format?: string; // For dates, numbers, etc.
}

export interface PDFStyling {
  fontFamily: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  brandColors: ThinkTankColors;
}

export interface ThinkTankColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
}

export interface PDFComponentStyling {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  color?: string;
  backgroundColor?: string;
  border?: PDFBorder;
  padding?: PDFPadding;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  opacity?: number;
}

export interface PDFBorder {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface PDFPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PDFCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'exists';
  value: any;
}

export interface PDFDataBinding {
  source: string;
  field: string;
  transformation?: PDFDataTransformation;
}

export interface PDFDataTransformation {
  type: 'format' | 'calculate' | 'filter' | 'sort' | 'group';
  options: { [key: string]: any };
}

export interface PDFWatermark {
  text?: string;
  image?: string;
  opacity: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  rotation?: number;
}

export interface PDFTemplateMetadata {
  tags: string[];
  category: string;
  description: string;
  lastGenerated?: string;
  generationCount: number;
  fileSize?: number;
  pageCount?: number;
}

export interface PDFReport {
  id: string;
  templateId: string;
  name: string;
  generatedAt: string;
  generatedBy: string;
  status: PDFStatus;
  variables: { [key: string]: any };
  metadata: PDFReportMetadata;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  pageCount?: number;
  error?: string;
}

export const PDFStatus = {
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  QUEUED: 'queued'
} as const;

export type PDFStatus = typeof PDFStatus[keyof typeof PDFStatus];

export interface PDFReportMetadata {
  contextData: { [key: string]: any };
  dataSource: string;
  reportPeriod?: {
    start: string;
    end: string;
  };
  recipients?: string[];
  deliveryMethod?: 'download' | 'email' | 'storage';
}

// Report Management Types
export interface ReportSchedule {
  id: string;
  name: string;
  templateId: string;
  templateType: 'email' | 'pdf';
  schedule: CronSchedule;
  recipients: ReportRecipient[];
  variables: { [key: string]: any };
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  createdBy: string;
  metadata: ReportScheduleMetadata;
}

export interface CronSchedule {
  expression: string;
  timezone: string;
  description: string;
}

export interface ReportRecipient {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferences: RecipientPreferences;
}

export interface RecipientPreferences {
  format: 'pdf' | 'excel' | 'csv';
  deliveryTime: string;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  includeCharts: boolean;
  includeRawData: boolean;
}

export interface ReportScheduleMetadata {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageGenerationTime: number;
  lastError?: string;
}

// Template Editor and Management Types
export interface TemplateEditor {
  templateId: string;
  templateType: 'email' | 'pdf';
  currentVersion: number;
  draftVersion?: TemplateVersion;
  publishedVersion?: TemplateVersion;
  previewData?: any;
  isEditing: boolean;
  lastSaved?: string;
  collaborators: TemplateCollaborator[];
}

export interface TemplateVersion {
  version: number;
  content: any;
  changelog: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
}

export interface TemplateCollaborator {
  userId: string;
  role: 'editor' | 'viewer' | 'admin';
  joinedAt: string;
  lastActive: string;
}

// Bulk Operations and Automation Types
export interface BulkReportOperation {
  id: string;
  type: BulkReportOperationType;
  templateIds: string[];
  recipients: string[];
  variables: { [key: string]: any };
  scheduledAt?: string;
  status: BulkOperationStatus;
  progress: BulkOperationProgress;
  results: BulkReportResult[];
  createdAt: string;
  createdBy: string;
}

export const BulkReportOperationType = {
  GENERATE_REPORTS: 'generate_reports',
  SEND_EMAILS: 'send_emails',
  SCHEDULE_DELIVERY: 'schedule_delivery',
  UPDATE_TEMPLATES: 'update_templates',
  ARCHIVE_REPORTS: 'archive_reports'
} as const;

export type BulkReportOperationType = typeof BulkReportOperationType[keyof typeof BulkReportOperationType];

export interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentTask?: string;
  estimatedTimeRemaining?: number;
}

export interface BulkReportResult {
  templateId: string;
  success: boolean;
  reportId?: string;
  messageId?: string;
  error?: string;
  generatedAt?: string;
  filePath?: string;
}

// Analytics and Tracking Types
export interface ReportAnalytics {
  period: {
    start: string;
    end: string;
  };
  emailMetrics: EmailAnalyticsMetrics;
  pdfMetrics: PDFAnalyticsMetrics;
  templateUsage: TemplateUsageReport[];
  recipientEngagement: RecipientEngagementReport[];
  systemPerformance: ReportSystemPerformance;
  recommendations: ReportRecommendation[];
}

export interface EmailAnalyticsMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  spamComplaintRate: number;
}

export interface PDFAnalyticsMetrics {
  totalGenerated: number;
  totalDownloaded: number;
  averageGenerationTime: number;
  averageFileSize: number;
  failureRate: number;
  mostPopularTemplates: string[];
  peakGenerationTimes: string[];
}

export interface TemplateUsageReport {
  templateId: string;
  templateName: string;
  templateType: 'email' | 'pdf';
  usageCount: number;
  lastUsed: string;
  averageRating?: number;
  popularVariables: string[];
  commonErrors: string[];
}

export interface RecipientEngagementReport {
  recipientId: string;
  email: string;
  role: UserRole;
  totalReceived: number;
  totalOpened: number;
  totalClicked: number;
  engagementScore: number;
  preferences: RecipientPreferences;
  lastActive: string;
}

export interface ReportSystemPerformance {
  averageEmailDeliveryTime: number;
  averagePDFGenerationTime: number;
  systemUptime: number;
  errorRate: number;
  peakLoadTimes: string[];
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
}

export interface ReportRecommendation {
  type: 'template_optimization' | 'delivery_time' | 'recipient_segmentation' | 'performance_improvement';
  priority: Priority;
  description: string;
  expectedImpact: string;
  actionItems: string[];
  estimatedEffort: string;
}

// Integration and Data Binding Types
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connectionString: string;
  schema: DataSchema;
  isActive: boolean;
  lastSync?: string;
  syncFrequency: string;
  credentials?: DataSourceCredentials;
}

export const DataSourceType = {
  DATABASE: 'database',
  API: 'api',
  FILE: 'file',
  WEBHOOK: 'webhook',
  SUPABASE: 'supabase',
  EXTERNAL_SERVICE: 'external_service'
} as const;

export type DataSourceType = typeof DataSourceType[keyof typeof DataSourceType];

export interface DataSchema {
  tables: DataTable[];
  relationships: DataRelationship[];
  indexes: DataIndex[];
}

export interface DataTable {
  name: string;
  columns: DataColumn[];
  primaryKey: string[];
  description?: string;
}

export interface DataColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  description?: string;
}

export interface DataRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface DataIndex {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

export interface DataSourceCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  token?: string;
  certificate?: string;
  [key: string]: any;
}

// Communication Preferences and Settings Types
export interface CommunicationPreferences {
  userId: string;
  emailFrequency: EmailFrequency;
  preferredFormats: ReportFormat[];
  deliveryTimes: PreferredDeliveryTime[];
  notificationTypes: NotificationType[];
  unsubscribedCategories: string[];
  language: string;
  timezone: string;
  mobileOptIn: boolean;
  updatedAt: string;
}

export const EmailFrequency = {
  IMMEDIATE: 'immediate',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  NEVER: 'never'
} as const;

export type EmailFrequency = typeof EmailFrequency[keyof typeof EmailFrequency];

export const ReportFormat = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json',
  HTML: 'html'
} as const;

export type ReportFormat = typeof ReportFormat[keyof typeof ReportFormat];

export interface PreferredDeliveryTime {
  day: number; // 0-6 for Sunday-Saturday
  hour: number; // 0-23
  timezone: string;
}

export const NotificationType = {
  ASSIGNMENT_UPDATES: 'assignment_updates',
  SCHEDULE_CHANGES: 'schedule_changes',
  PERFORMANCE_REPORTS: 'performance_reports',
  SYSTEM_ALERTS: 'system_alerts',
  MARKETING: 'marketing',
  ADMIN_MESSAGES: 'admin_messages'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// Advanced Features Types
export interface ConditionalContent {
  id: string;
  conditions: ContentCondition[];
  content: any;
  alternativeContent?: any;
  priority: number;
}

export interface ContentCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface DynamicContent {
  id: string;
  type: 'text' | 'image' | 'chart' | 'table' | 'list';
  dataSource: string;
  query: string;
  template: string;
  refreshInterval?: number;
  cacheTimeout?: number;
}

export interface InteractiveElement {
  id: string;
  type: 'button' | 'link' | 'form' | 'calendar' | 'survey';
  action: string;
  parameters: { [key: string]: any };
  tracking: boolean;
  styling: any;
}

// Archive and History Types
export interface ReportArchive {
  id: string;
  originalReportId: string;
  archivedAt: string;
  archivedBy: string;
  retentionPolicy: RetentionPolicy;
  storageLocation: string;
  fileSize: number;
  metadata: ArchiveMetadata;
}

export interface RetentionPolicy {
  duration: number; // in days
  autoDelete: boolean;
  compressionEnabled: boolean;
  backupRequired: boolean;
}

export interface ArchiveMetadata {
  originalCreatedAt: string;
  originalCreatedBy: string;
  templateVersion: number;
  dataSnapshot: any;
  tags: string[];
}



