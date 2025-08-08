// Think Tank Technologies - Installation Card Component

import React from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  MoreHorizontal,
  Target,
  FileText,
  Users
} from 'lucide-react';
import type { Installation, InstallationStatus, Priority } from '../../types';

interface InstallationCardProps {
  installation: Installation;
  onView?: (installation: Installation) => void;
  onEdit?: (installation: Installation) => void;
  onSelect?: (installation: Installation) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const InstallationCard: React.FC<InstallationCardProps> = ({
  installation,
  onView,
  onEdit,
  onSelect,
  isSelected = false,
  showActions = true,
  compact = false
}) => {
  // Get status styling
  const getStatusStyle = (status: InstallationStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      rescheduled: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return styles[status] || styles.pending;
  };

  // Get priority styling
  const getPriorityStyle = (priority: Priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return styles[priority] || styles.medium;
  };

  // Check if installation is overdue
  const isOverdue = () => {
    if (installation.status === 'completed' || installation.status === 'cancelled') return false;
    const installationDate = new Date(`${installation.scheduledDate}T${installation.scheduledTime}`);
    return installationDate < new Date();
  };

  // Format date and time
  const formatDateTime = () => {
    const dateObj = new Date(`${installation.scheduledDate}T${installation.scheduledTime}`);
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: dateObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const overdue = isOverdue();
  const datetime = formatDateTime();

  return (
    <div 
      className={`
        bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'}
        ${overdue ? 'border-l-4 border-l-red-400' : ''}
        ${compact ? 'p-4' : 'p-6'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(installation)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {installation.customerName}
              </h3>
              {overdue && <AlertTriangle className="h-5 w-5 text-red-500" />}
            </div>
            
            <p className="text-sm text-gray-500 font-mono">
              ID: {installation.id}
            </p>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(installation.status)}`}>
                {installation.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                {installation.status === 'in_progress' && <div className="h-2 w-2 bg-current rounded-full mr-1 animate-pulse" />}
                {installation.status.replace('_', ' ')}
              </span>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(installation.priority)}`}>
                <Target className="h-3 w-3 mr-1" />
                {installation.priority}
              </span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-1 ml-2">
            {onView && (
              <button
                onClick={() => onView(installation)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(installation)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                title="Edit installation"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Installation Details */}
      <div className="space-y-3">
        {/* Contact Information */}
        <div className="flex items-center space-x-4 text-sm">
          {installation.customerPhone && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{installation.customerPhone}</span>
            </div>
          )}
          {installation.customerEmail && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{installation.customerEmail}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <div className="text-gray-900">{installation.address.street}</div>
            <div className="text-gray-600">
              {installation.address.city}, {installation.address.state} {installation.address.zipCode}
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
              {datetime.date}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {datetime.time} ({installation.duration}min)
            </span>
          </div>
        </div>

        {/* Team Assignment */}
        <div className="flex items-center space-x-4 text-sm">
          {installation.leadId || installation.assistantId ? (
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                {installation.leadId && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 text-blue-500" />
                    <span className="text-gray-600">Lead: {installation.leadId.slice(-8)}</span>
                  </div>
                )}
                {installation.assistantId && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 text-green-500" />
                    <span className="text-gray-600">Assistant: {installation.assistantId.slice(-8)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-amber-600">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Unassigned</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {installation.notes && !compact && (
          <div className="flex items-start space-x-2 text-sm">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-600 line-clamp-2">{installation.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with additional details or actions */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <span>Created: {new Date(installation.createdAt).toLocaleDateString()}</span>
              {installation.updatedAt !== installation.createdAt && (
                <span>Updated: {new Date(installation.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
            
            {overdue && (
              <div className="flex items-center space-x-1 text-red-600 font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>OVERDUE</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationCard;