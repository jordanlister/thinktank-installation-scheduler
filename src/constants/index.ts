// Think Tank Technologies Installation Scheduler - Constants

import type { NavItem } from '../types';
import { UserRole, InstallationStatus, Priority } from '../types';

// Application Constants
export const APP_NAME = 'Think Tank Technologies Installation Scheduler';
export const APP_VERSION = '1.0.0';

// Date and Time Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';
export const DISPLAY_DATE_FORMAT = 'MMM DD, YYYY';
export const DISPLAY_DATETIME_FORMAT = 'MMM DD, YYYY HH:mm';

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Installation Duration Options (in minutes)
export const DURATION_OPTIONS = [
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
];

// Status Options
export const STATUS_OPTIONS = [
  { value: InstallationStatus.PENDING, label: 'Pending', color: 'gray' },
  { value: InstallationStatus.SCHEDULED, label: 'Scheduled', color: 'blue' },
  { value: InstallationStatus.IN_PROGRESS, label: 'In Progress', color: 'yellow' },
  { value: InstallationStatus.COMPLETED, label: 'Completed', color: 'green' },
  { value: InstallationStatus.CANCELLED, label: 'Cancelled', color: 'red' },
  { value: InstallationStatus.RESCHEDULED, label: 'Rescheduled', color: 'orange' },
];

// Priority Options
export const PRIORITY_OPTIONS = [
  { value: Priority.LOW, label: 'Low', color: 'gray' },
  { value: Priority.MEDIUM, label: 'Medium', color: 'blue' },
  { value: Priority.HIGH, label: 'High', color: 'orange' },
  { value: Priority.URGENT, label: 'Urgent', color: 'red' },
];

// User Role Options
export const ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Administrator' },
  { value: UserRole.SCHEDULER, label: 'Scheduler' },
  { value: UserRole.LEAD, label: 'Lead Installer' },
  { value: UserRole.ASSISTANT, label: 'Assistant Installer' },
  { value: UserRole.VIEWER, label: 'Viewer' },
];

// Navigation Configuration
export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER, UserRole.LEAD, UserRole.ASSISTANT, UserRole.VIEWER],
  },
  {
    id: 'schedules',
    label: 'Schedules',
    path: '/schedules',
    icon: 'Calendar',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER, UserRole.LEAD, UserRole.ASSISTANT],
  },
  {
    id: 'installations',
    label: 'Installations',
    path: '/installations',
    icon: 'MapPin',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER, UserRole.LEAD, UserRole.ASSISTANT],
  },
  {
    id: 'assignments',
    label: 'Assignments',
    path: '/assignments',
    icon: 'Users',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER],
  },
  {
    id: 'team-management',
    label: 'Team Management',
    path: '/team',
    icon: 'Users',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER],
  },
  {
    id: 'data-processing',
    label: 'Data Processing',
    path: '/data-processing',
    icon: 'Upload',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER],
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: 'FileText',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
    roles: [UserRole.ADMIN, UserRole.SCHEDULER, UserRole.LEAD],
  },
];

// Time Slots for Scheduling (24-hour format)
export const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
];

// States for Address Validation
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  DUPLICATE_ENTRY: 'This entry already exists.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_DATE: 'Please enter a valid date.',
  INVALID_TIME: 'Please enter a valid time.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  INSTALLATION_CREATED: 'Installation created successfully.',
  INSTALLATION_UPDATED: 'Installation updated successfully.',
  INSTALLATION_DELETED: 'Installation deleted successfully.',
  ASSIGNMENT_CREATED: 'Assignment created successfully.',
  ASSIGNMENT_UPDATED: 'Assignment updated successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  DATA_EXPORTED: 'Data exported successfully.',
  EMAIL_SENT: 'Email sent successfully.',
} as const;