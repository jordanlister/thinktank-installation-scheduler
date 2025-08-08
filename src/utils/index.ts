// Think Tank Technologies Installation Scheduler - Utility Functions

import type { Installation, InstallationStatus, Priority } from '../types';

// Date and Time Utilities
export const formatDate = (date: string | Date, format = 'MMM DD, YYYY'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'YYYY-MM-DD':
      return d.toISOString().split('T')[0];
    case 'MMM DD, YYYY':
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'MM/DD/YYYY':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    default:
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
  }
  
  return d.toLocaleDateString('en-US', options);
};

export const formatTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
};

export const formatDateTime = (date: string | Date, time?: string): string => {
  const formattedDate = formatDate(date);
  return time ? `${formattedDate} at ${formatTime(time)}` : formattedDate;
};

export const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return formatDate(date, 'MMM DD');
  }
};

export const isToday = (date: string | Date): boolean => {
  const today = new Date();
  const compareDate = new Date(date);
  return today.toDateString() === compareDate.toDateString();
};

export const isThisWeek = (date: string | Date): boolean => {
  const today = new Date();
  const compareDate = new Date(date);
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return compareDate >= startOfWeek && compareDate <= endOfWeek;
};

export const addDays = (date: string | Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// String Utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatName = (firstName: string, lastName: string): string => {
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
};

export const truncate = (str: string, length: number): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Phone Number Utilities
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

// Email Utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Address Utilities
export const formatAddress = (address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}): string => {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
};

// Status and Priority Utilities
export const getStatusBadgeClass = (status: InstallationStatus): string => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  switch (status) {
    case 'pending':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    case 'scheduled':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'in_progress':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'cancelled':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'rescheduled':
      return `${baseClasses} bg-orange-100 text-orange-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export const getPriorityBadgeClass = (priority: Priority): string => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  switch (priority) {
    case 'low':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    case 'medium':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'high':
      return `${baseClasses} bg-orange-100 text-orange-800`;
    case 'urgent':
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

// Array Utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const filterBy = <T>(
  array: T[],
  filters: Partial<Record<keyof T, any>>
): T[] => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;
      if (Array.isArray(value)) return value.includes(item[key as keyof T]);
      return item[key as keyof T] === value;
    });
  });
};

// Installation Utilities
export const calculateInstallationDuration = (
  scheduledTime: string,
  duration: number
): string => {
  try {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    return `${formatTime(scheduledTime)} - ${formatTime(
      `${endDate.getHours().toString().padStart(2, '0')}:${endDate
        .getMinutes()
        .toString()
        .padStart(2, '0')}`
    )}`;
  } catch {
    return scheduledTime;
  }
};

export const getInstallationsForDate = (
  installations: Installation[],
  date: string
): Installation[] => {
  return installations.filter(installation => installation.scheduledDate === date);
};

export const getInstallationsByStatus = (
  installations: Installation[],
  status: InstallationStatus
): Installation[] => {
  return installations.filter(installation => installation.status === status);
};

// Local Storage Utilities
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// URL Utilities
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

// Validation Utilities
export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
};

export const validateZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

// Error Handling Utilities
export const handleApiError = (error: any): string => {
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};

// CSV Export Utility
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string
): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : String(value);
        })
        .join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};