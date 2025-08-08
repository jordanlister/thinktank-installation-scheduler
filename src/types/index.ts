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
  jobId: ['job_id', 'job id', 'id', 'job number', 'job_number', 'work order', 'wo', 'order id', 'order_id', 'ticket', 'ticket id', 'reference', 'ref', 'tech', '1 tech', '2 tech', 'technician', 'installer'],
  storeNumber: ['store_number', 'store number', 'store_id', 'store id', 'location id', 'location_id', 'store #', 'store#', 'location', 'loc', 'site', 'site id', 'site_id', 'branch', 'branch id', 'outlet'],
  customerName: ['customer_name', 'customer name', 'client name', 'client_name', 'name', 'customer', 'store name', 'location name', 'business name', 'company', 'company name', 'site name', 'facility', 'facility name'],
  customerPhone: ['customer_phone', 'customer phone', 'phone', 'phone number', 'phone_number', 'contact phone', 'mobile', 'tel', 'telephone', 'contact', 'contact number', 'manager phone'],
  customerEmail: ['customer_email', 'customer email', 'email', 'email address', 'contact email', 'manager email', 'contact_email'],
  street: ['street', 'address', 'street address', 'address line 1', 'address_line_1', 'addr', 'location address', 'site address', 'full address', 'street_address'],
  city: ['city', 'town', 'municipality', 'locality'],
  state: ['state', 'province', 'region', 'st', 'prov'],
  zipCode: ['zip_code', 'zip code', 'zip', 'postal code', 'postal_code', 'postcode', 'postal'],
  installDate: ['install_date', 'install date', 'date', 'scheduled date', 'scheduled_date', 'appointment date', 'service date', 'work date', 'completion date', 'target date', 'due date', 'installation date'],
  installTime: ['install_time', 'install time', 'time', 'scheduled time', 'scheduled_time', 'appointment time', 'service time', 'start time', 'time slot'],
  duration: ['duration', 'estimated duration', 'time required', 'hours', 'est duration', 'time estimate', 'work hours', 'service hours'],
  installationType: ['installation_type', 'installation type', 'type', 'service type', 'work type', 'job type', 'service', 'category', 'work category', 'equipment type', 'product type'],
  specifications: ['specifications', 'specs', 'requirements', 'special requirements', 'details', 'description', 'work description', 'scope', 'equipment', 'products'],
  priority: ['priority', 'urgency', 'importance', 'rush', 'urgent', 'level', 'priority level'],
  region: ['region', 'territory', 'area', 'district', 'zone', 'market', 'division', 'sector'],
  notes: ['notes', 'comments', 'remarks', 'special notes', 'instructions', 'special instructions', 'additional info', 'info', 'memo', 'description']
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

// Settings Management Types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  defaultView: 'calendar' | 'list' | 'map';
  language: string;
  itemsPerPage: number;
  showAvatars: boolean;
  enableSounds: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

export interface SystemConfig {
  workingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  defaultJobDuration: number; // in minutes
  travelTimeBuffer: number;   // in minutes
  maxJobsPerDay: number;
  maxJobsPerTeamMember: number;
  autoAssignments: boolean;
  enableOptimization: boolean;
  optimizationGoal: 'travel_distance' | 'workload_balance' | 'deadline_priority';
  requireApprovalForChanges: boolean;
  allowOvertimeAssignment: boolean;
  backupTechnicianRequired: boolean;
  weatherIntegration: boolean;
  trafficIntegration: boolean;
  customerPreferenceWeighting: number; // 0-100
}

export interface NotificationSettings {
  emailNotifications: {
    enabled: boolean;
    scheduleChanges: boolean;
    newAssignments: boolean;
    deadlineReminders: boolean;
    performanceReports: boolean;
    systemAlerts: boolean;
    weeklyDigest: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  smsNotifications: {
    enabled: boolean;
    urgentOnly: boolean;
    scheduleChanges: boolean;
    newAssignments: boolean;
    emergencyAlerts: boolean;
    phoneNumber?: string;
  };
  pushNotifications: {
    enabled: boolean;
    scheduleChanges: boolean;
    newAssignments: boolean;
    deadlineReminders: boolean;
    systemAlerts: boolean;
  };
  digestSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    deliveryTime: string; // HH:MM format
    includeMetrics: boolean;
    includeUpcoming: boolean;
  };
}

export interface SecuritySettings {
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    passwordExpiry: number; // in days, 0 for no expiry
  };
  authenticationSettings: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // in minutes
    requireReauthForSensitive: boolean;
  };
  dataSettings: {
    allowExport: boolean;
    allowBulkOperations: boolean;
    auditLogging: boolean;
    dataRetention: number; // in days
    encryptSensitiveData: boolean;
  };
  accessControl: {
    restrictIPAccess: boolean;
    allowedIPs?: string[];
    requireVPN: boolean;
    blockConcurrentSessions: boolean;
  };
}

export interface SettingsState {
  userPreferences: UserPreferences;
  systemConfig: SystemConfig;
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  lastModified: string;
  modifiedBy: string;
}

export interface SettingsFormData {
  section: 'preferences' | 'system' | 'notifications' | 'security';
  data: any;
  isDirty: boolean;
  validationErrors: { [field: string]: string };
}

// Assignment Management Types

export interface Assignment {
  id: string;
  installationId: string;
  leadId: string;
  assistantId?: string;
  assignedAt: string;
  assignedBy: string;
  status: AssignmentStatus;
  priority: Priority;
  estimatedDuration: number;
  actualDuration?: number;
  notes?: string;
  metadata: AssignmentMetadata;
  history: AssignmentHistoryEntry[];
}

export interface AssignmentMetadata {
  autoAssigned: boolean;
  conflictResolved: boolean;
  originalAssignmentId?: string;
  reassignmentReason?: string;
  workloadScore: number;
  efficiencyScore: number;
  customerPreference?: boolean;
}

export interface AssignmentHistoryEntry {
  id: string;
  assignmentId: string;
  action: AssignmentAction;
  performedBy: string;
  performedAt: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  notes?: string;
}

export const AssignmentAction = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  REASSIGNED: 'reassigned',
  UNASSIGNED: 'unassigned',
  STARTED: 'started',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  CONFLICT_RESOLVED: 'conflict_resolved'
} as const;

export type AssignmentAction = typeof AssignmentAction[keyof typeof AssignmentAction];

export interface AssignmentConflict {
  id: string;
  type: AssignmentConflictType;
  affectedAssignments: string[];
  severity: ConflictSeverity;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionMethod?: ConflictResolutionMethod;
  suggestedResolutions: ConflictResolution[];
  autoResolvable: boolean;
  impactScore: number;
}

export const AssignmentConflictType = {
  TIME_OVERLAP: 'time_overlap',
  SKILL_MISMATCH: 'skill_mismatch',
  CAPACITY_EXCEEDED: 'capacity_exceeded',
  TRAVEL_DISTANCE: 'travel_distance',
  AVAILABILITY: 'availability',
  GEOGRAPHIC_CLUSTER: 'geographic_cluster',
  WORKLOAD_IMBALANCE: 'workload_imbalance',
  DEADLINE_RISK: 'deadline_risk'
} as const;

export type AssignmentConflictType = typeof AssignmentConflictType[keyof typeof AssignmentConflictType];

export const ConflictSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type ConflictSeverity = typeof ConflictSeverity[keyof typeof ConflictSeverity];

export const ConflictResolutionMethod = {
  AUTO_REASSIGN: 'auto_reassign',
  MANUAL_REASSIGN: 'manual_reassign',
  RESCHEDULE: 'reschedule',
  SPLIT_ASSIGNMENT: 'split_assignment',
  OVERRIDE: 'override',
  ESCALATE: 'escalate'
} as const;

export type ConflictResolutionMethod = typeof ConflictResolutionMethod[keyof typeof ConflictResolutionMethod];

export interface ConflictResolution {
  id: string;
  method: ConflictResolutionMethod;
  description: string;
  impactScore: number;
  estimatedEffort: number;
  affectedAssignments: string[];
  newAssignments?: Partial<Assignment>[];
  executionSteps: ResolutionStep[];
}

export interface ResolutionStep {
  id: string;
  order: number;
  action: string;
  parameters: { [key: string]: any };
  validationRules: string[];
  rollbackAction?: string;
}

export interface WorkloadData {
  teamMemberId: string;
  date: string;
  assignedHours: number;
  capacity: number;
  efficiency: number;
  conflicts: number;
  utilizationPercentage: number;
  workloadStatus: WorkloadStatus;
  assignments: string[];
  travelTime: number;
  bufferTime: number;
  overtimeHours: number;
}

export interface AssignmentMatrix {
  dates: string[];
  teamMembers: TeamMember[];
  assignments: AssignmentMatrixCell[][];
  conflicts: AssignmentConflict[];
  workloadSummary: WorkloadSummary[];
  optimizationScore: number;
}

export interface AssignmentMatrixCell {
  date: string;
  teamMemberId: string;
  assignments: Assignment[];
  capacity: number;
  utilization: number;
  conflicts: string[];
  status: MatrixCellStatus;
  travelDistance: number;
  workloadScore: number;
}

export const MatrixCellStatus = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  OVERBOOKED: 'overbooked',
  UNAVAILABLE: 'unavailable',
  CONFLICT: 'conflict',
  OPTIMIZED: 'optimized'
} as const;

export type MatrixCellStatus = typeof MatrixCellStatus[keyof typeof MatrixCellStatus];

export interface WorkloadSummary {
  teamMemberId: string;
  totalAssignments: number;
  totalHours: number;
  averageUtilization: number;
  peakUtilization: number;
  conflicts: number;
  efficiency: number;
  travelDistance: number;
  recommendations: string[];
}

export interface AutoAssignmentRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  conditions: AutoAssignmentCondition[];
  actions: AutoAssignmentAction[];
  createdBy: string;
  createdAt: string;
  lastModified: string;
  usageCount: number;
  successRate: number;
}

export interface AutoAssignmentCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  weight: number;
  logicalOperator?: LogicalOperator;
}

export const ConditionOperator = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  CONTAINS: 'contains',
  IN: 'in',
  NOT_IN: 'not_in',
  BETWEEN: 'between',
  EXISTS: 'exists'
} as const;

export type ConditionOperator = typeof ConditionOperator[keyof typeof ConditionOperator];

export const LogicalOperator = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT'
} as const;

export type LogicalOperator = typeof LogicalOperator[keyof typeof LogicalOperator];

export interface AutoAssignmentAction {
  id: string;
  type: AutoAssignmentActionType;
  parameters: { [key: string]: any };
  weight: number;
  order: number;
}

export const AutoAssignmentActionType = {
  ASSIGN_BY_SKILL: 'assign_by_skill',
  ASSIGN_BY_LOCATION: 'assign_by_location',
  ASSIGN_BY_AVAILABILITY: 'assign_by_availability',
  ASSIGN_BY_WORKLOAD: 'assign_by_workload',
  ASSIGN_BY_PERFORMANCE: 'assign_by_performance',
  ASSIGN_BY_PREFERENCE: 'assign_by_preference',
  SKIP_ASSIGNMENT: 'skip_assignment',
  ESCALATE_ASSIGNMENT: 'escalate_assignment'
} as const;

export type AutoAssignmentActionType = typeof AutoAssignmentActionType[keyof typeof AutoAssignmentActionType];

export interface AutoAssignmentCriteria {
  optimizationGoal: OptimizationGoal;
  considerSkills: boolean;
  considerLocation: boolean;
  considerAvailability: boolean;
  considerWorkload: boolean;
  considerPerformance: boolean;
  considerPreferences: boolean;
  maxTravelDistance: number;
  workloadBalanceWeight: number;
  skillMatchWeight: number;
  performanceWeight: number;
  urgencyWeight: number;
  geographicWeight: number;
}

export const OptimizationGoal = {
  MINIMIZE_TRAVEL: 'minimize_travel',
  BALANCE_WORKLOAD: 'balance_workload',
  MAXIMIZE_EFFICIENCY: 'maximize_efficiency',
  PRIORITIZE_SKILLS: 'prioritize_skills',
  CUSTOMER_SATISFACTION: 'customer_satisfaction',
  HYBRID: 'hybrid'
} as const;

export type OptimizationGoal = typeof OptimizationGoal[keyof typeof OptimizationGoal];

export interface AssignmentResult {
  assignmentId: string;
  installationId: string;
  teamMemberId: string;
  confidence: number;
  score: number;
  reasoning: string[];
  alternatives: AlternativeAssignment[];
  warnings: string[];
}

export interface AlternativeAssignment {
  teamMemberId: string;
  score: number;
  reasoning: string[];
  tradeoffs: string[];
}

export interface CreateAssignmentRequest {
  installationId: string;
  leadId?: string;
  assistantId?: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: Priority;
  notes?: string;
  autoResolveConflicts: boolean;
  preferredTeamMembers?: string[];
  requiredSkills?: string[];
  maxTravelDistance?: number;
}

export interface UpdateAssignmentRequest {
  assignmentId: string;
  leadId?: string;
  assistantId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  priority?: Priority;
  status?: AssignmentStatus;
  notes?: string;
  reason?: string;
}

export interface BulkAssignmentRequest {
  installationIds: string[];
  criteria: AutoAssignmentCriteria;
  overrideConflicts: boolean;
  preserveExisting: boolean;
  dryRun: boolean;
}

export interface BulkAssignmentResult {
  totalRequests: number;
  successful: number;
  failed: number;
  conflicts: number;
  results: AssignmentResult[];
  errors: BulkAssignmentError[];
  summary: BulkAssignmentSummary;
}

export interface BulkAssignmentError {
  installationId: string;
  error: string;
  reason: string;
  suggestedAction: string;
}

export interface BulkAssignmentSummary {
  processingTime: number;
  optimizationScore: number;
  workloadDistribution: { [teamMemberId: string]: number };
  travelOptimization: number;
  conflictsResolved: number;
  recommendations: string[];
}

export interface AssignmentAnalytics {
  period: {
    start: string;
    end: string;
  };
  totalAssignments: number;
  autoAssignments: number;
  manualAssignments: number;
  reassignments: number;
  conflicts: number;
  resolutionRate: number;
  averageResponseTime: number;
  teamUtilization: TeamUtilizationMetrics[];
  workloadDistribution: WorkloadDistributionMetrics;
  efficiencyMetrics: AssignmentEfficiencyMetrics;
  trendData: AssignmentTrendData[];
  recommendations: AssignmentRecommendation[];
}

export interface TeamUtilizationMetrics {
  teamMemberId: string;
  name: string;
  utilizationRate: number;
  totalHours: number;
  workingDays: number;
  assignmentCount: number;
  averageJobsPerDay: number;
  travelTime: number;
  efficiency: number;
  overutilizedDays: number;
  underutilizedDays: number;
}

export interface WorkloadDistributionMetrics {
  variance: number;
  standardDeviation: number;
  balanceScore: number;
  overutilizedTeamMembers: number;
  underutilizedTeamMembers: number;
  optimalTeamMembers: number;
  redistributionOpportunities: number;
}

export interface AssignmentEfficiencyMetrics {
  averageAssignmentTime: number;
  averageTravelDistance: number;
  skillMatchRate: number;
  geographicEfficiency: number;
  conflictRate: number;
  autoResolutionRate: number;
  customerSatisfactionImpact: number;
  costPerAssignment: number;
}

export interface AssignmentTrendData {
  date: string;
  metric: AssignmentMetricType;
  value: number;
  target?: number;
  variance?: number;
}

export const AssignmentMetricType = {
  TOTAL_ASSIGNMENTS: 'total_assignments',
  AUTO_ASSIGNMENTS: 'auto_assignments',
  CONFLICTS: 'conflicts',
  UTILIZATION: 'utilization',
  EFFICIENCY: 'efficiency',
  TRAVEL_DISTANCE: 'travel_distance',
  RESPONSE_TIME: 'response_time'
} as const;

export type AssignmentMetricType = typeof AssignmentMetricType[keyof typeof AssignmentMetricType];

export interface AssignmentRecommendation {
  type: AssignmentRecommendationType;
  priority: Priority;
  description: string;
  impact: string;
  effort: RecommendationEffort;
  expectedBenefit: string;
  actionItems: ActionItem[];
  affectedTeamMembers: string[];
  timeline: string;
  metrics: RecommendationMetrics;
}

export const AssignmentRecommendationType = {
  WORKLOAD_REBALANCING: 'workload_rebalancing',
  SKILL_TRAINING: 'skill_training',
  GEOGRAPHIC_OPTIMIZATION: 'geographic_optimization',
  CAPACITY_ADJUSTMENT: 'capacity_adjustment',
  AUTOMATION_IMPROVEMENT: 'automation_improvement',
  CONFLICT_PREVENTION: 'conflict_prevention',
  PERFORMANCE_ENHANCEMENT: 'performance_enhancement'
} as const;

export type AssignmentRecommendationType = typeof AssignmentRecommendationType[keyof typeof AssignmentRecommendationType];

export const RecommendationEffort = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export type RecommendationEffort = typeof RecommendationEffort[keyof typeof RecommendationEffort];

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: Priority;
  status: ActionItemStatus;
  progress: number;
  dependencies: string[];
}

export const ActionItemStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled'
} as const;

export type ActionItemStatus = typeof ActionItemStatus[keyof typeof ActionItemStatus];

export interface RecommendationMetrics {
  expectedEfficiencyGain: number;
  expectedCostSavings: number;
  expectedConflictReduction: number;
  riskLevel: RecommendationRisk;
  confidenceLevel: number;
}

export const RecommendationRisk = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export type RecommendationRisk = typeof RecommendationRisk[keyof typeof RecommendationRisk];

export interface AssignmentDashboardMetrics {
  todayAssignments: number;
  activeConflicts: number;
  utilizationRate: number;
  autoAssignmentRate: number;
  averageResponseTime: number;
  pendingReassignments: number;
  teamMemberStats: TeamMemberDashboardStats[];
  recentActivity: RecentAssignmentActivity[];
  alerts: AssignmentAlert[];
  quickActions: QuickAction[];
}

export interface TeamMemberDashboardStats {
  teamMemberId: string;
  name: string;
  todayAssignments: number;
  weekAssignments: number;
  utilization: number;
  efficiency: number;
  conflicts: number;
  status: TeamMemberAssignmentStatus;
}

export const TeamMemberAssignmentStatus = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  OVERBOOKED: 'overbooked',
  UNAVAILABLE: 'unavailable'
} as const;

export type TeamMemberAssignmentStatus = typeof TeamMemberAssignmentStatus[keyof typeof TeamMemberAssignmentStatus];

export interface RecentAssignmentActivity {
  id: string;
  type: AssignmentActivityType;
  description: string;
  timestamp: string;
  performedBy: string;
  affectedAssignments: string[];
  impact: ActivityImpact;
}

export const AssignmentActivityType = {
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_MODIFIED: 'assignment_modified',
  CONFLICT_DETECTED: 'conflict_detected',
  CONFLICT_RESOLVED: 'conflict_resolved',
  AUTO_ASSIGNMENT_RUN: 'auto_assignment_run',
  BULK_UPDATE: 'bulk_update',
  TEAM_MEMBER_UPDATED: 'team_member_updated'
} as const;

export type AssignmentActivityType = typeof AssignmentActivityType[keyof typeof AssignmentActivityType];

export const ActivityImpact = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export type ActivityImpact = typeof ActivityImpact[keyof typeof ActivityImpact];

export interface AssignmentAlert {
  id: string;
  type: AssignmentAlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionRequired: boolean;
  relatedAssignments: string[];
  suggestedActions: string[];
}

export const AssignmentAlertType = {
  CRITICAL_CONFLICT: 'critical_conflict',
  CAPACITY_WARNING: 'capacity_warning',
  SKILL_GAP: 'skill_gap',
  DEADLINE_RISK: 'deadline_risk',
  SYSTEM_ERROR: 'system_error',
  PERFORMANCE_ISSUE: 'performance_issue'
} as const;

export type AssignmentAlertType = typeof AssignmentAlertType[keyof typeof AssignmentAlertType];

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
} as const;

export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: string;
  parameters?: { [key: string]: any };
  permissions: UserRole[];
  enabled: boolean;
}

// Bulk Assignment Types for Enhanced Modal
export interface BulkAssignmentData {
  selectedInstallations: string[];
  assignmentType: 'lead' | 'assistant' | 'both';
  targetTeamMembers: string[];
  dateRange?: { start: string; end: string };
  overrideConflicts: boolean;
  preserveExisting: boolean;
}

// Duplicate interfaces removed - using the ones defined earlier in the file

// Bulk Assignment Wizard Step Types
export const BulkAssignmentStep = {
  SELECTION: 'selection',
  CONFIGURATION: 'configuration', 
  PREVIEW: 'preview',
  EXECUTE: 'execute'
} as const;

export type BulkAssignmentStep = typeof BulkAssignmentStep[keyof typeof BulkAssignmentStep];

export interface BulkAssignmentWizardState {
  currentStep: BulkAssignmentStep;
  completedSteps: BulkAssignmentStep[];
  canProgress: boolean;
  data: BulkAssignmentData;
  previewData?: BulkAssignmentResult;
  executionProgress?: BulkExecutionProgress;
}

export interface BulkExecutionProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  percentage: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
}

export interface TeamMemberAvailability {
  teamMemberId: string;
  availableSlots: number;
  currentWorkload: number;
  capacity: number;
  utilizationPercentage: number;
  conflicts: string[];
  isOverloaded: boolean;
}

export interface InstallationSelectionCriteria {
  status?: InstallationStatus[];
  priority?: Priority[];
  dateRange?: { start: string; end: string };
  region?: string[];
  unassignedOnly?: boolean;
  hasConflicts?: boolean;
  customFilter?: string;
}

// Enhanced Conflict Resolution Types
export interface DateRange {
  start: string;
  end: string;
}

export interface ConflictResolutionEngine {
  detectConflicts: (assignments: Assignment[], timeWindow: DateRange) => AssignmentConflict[];
  suggestResolutions: (conflict: AssignmentConflict) => ConflictResolution[];
  assessResolutionImpact: (resolution: ConflictResolution) => ResolutionImpact;
  applyResolution: (conflict: AssignmentConflict, resolution: ConflictResolution) => Promise<void>;
}

export interface ConflictResolution {
  id: string;
  type: 'reschedule' | 'reassign' | 'split' | 'cancel';
  description: string;
  proposedChanges: ProposedChange[];
  confidence: number; // 0-100
  impact: ResolutionImpact;
}

export interface ResolutionImpact {
  affectedAssignments: number;
  customerImpact: 'none' | 'low' | 'medium' | 'high';
  teamImpact: 'none' | 'low' | 'medium' | 'high';
  costImpact: number;
  timeImpact: number; // in minutes
}

export interface ProposedChange {
  type: 'reschedule' | 'reassign' | 'modify';
  installationId: string;
  currentValue: any;
  proposedValue: any;
  reason: string;
}

export interface ConflictTimelineEvent {
  id: string;
  timestamp: string;
  type: 'conflict_detected' | 'resolution_applied' | 'manual_override';
  description: string;
  relatedConflicts: string[];
  performedBy?: string;
}

export interface ConflictAnalytics {
  totalConflicts: number;
  resolvedConflicts: number;
  averageResolutionTime: number;
  conflictsByType: { [key: string]: number };
  resolutionSuccessRate: number;
  preventionRecommendations: string[];
}

export interface ConflictResolutionHistory {
  id: string;
  conflictId: string;
  resolutionId: string;
  appliedAt: string;
  appliedBy: string;
  outcome: 'successful' | 'failed' | 'reverted';
  metrics: ResolutionMetrics;
  notes?: string;
}

export interface ResolutionMetrics {
  timeToResolve: number; // in minutes
  affectedTeamMembers: number;
  customerSatisfactionImpact: number;
  costSavings: number;
  efficiencyGain: number;
}

// Notification System Types
export interface AppNotification {
  id: string;
  userId: string;
  type: AppNotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  channels: NotificationChannel[];
  sentAt: string;
  readAt?: string;
  dismissedAt?: string;
  archivedAt?: string;
  scheduledFor?: string;
  expiresAt?: string;
  threadId?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'danger';
  requireConfirmation?: boolean;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  emailEnabled: boolean;
  emailFrequency: NotificationFrequency;
  smsEnabled: boolean;
  smsPhone?: string;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  typePreferences: Record<string, any>;
  prioritySettings: Record<string, any>;
  digestEnabled: boolean;
  digestFrequency: NotificationFrequency;
  digestTime: string;
  digestIncludeRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  type: AppNotificationType;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  variables: any[];
  validationRules: Record<string, any>;
  icon?: string;
  color?: string;
  sound?: string;
  actionsTemplate: any[];
  isActive: boolean;
  expiresAfterHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationThread {
  id: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  isActive: boolean;
  autoCloseAfterHours: number;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: Record<NotificationPriority, number>;
  byType: Record<AppNotificationType, number>;
  byStatus: Record<NotificationStatus, number>;
  last24Hours: number;
  thisWeek: number;
  avgReadTime: number; // in minutes
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface RealtimeSubscription {
  subscribe: (channel: string, callback: (data: any) => void) => void;
  unsubscribe: (channel: string, callback?: (data: any) => void) => void;
  emit: (channel: string, data: any) => void;
}

// Notification Enums
export type AppNotificationType = 
  | 'installation_created'
  | 'installation_updated' 
  | 'installation_assigned'
  | 'installation_completed'
  | 'installation_cancelled'
  | 'assignment_created'
  | 'assignment_updated'
  | 'assignment_cancelled'
  | 'schedule_changed'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'team_status_changed'
  | 'performance_alert'
  | 'system_maintenance'
  | 'deadline_reminder'
  | 'urgent_update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'dismissed' | 'archived';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'monthly' | 'never';


