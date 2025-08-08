// Think Tank Technologies - Installation Modal Component

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  AlertTriangle,
  FileText,
  Target,
  Users
} from 'lucide-react';
import { installationService } from '../../services/installationService';
import { teamService } from '../../services/teamService';
import type { Installation, InstallationStatus, Priority, Address, TeamMember } from '../../types';

interface InstallationModalProps {
  installation: Installation | null;
  onClose: () => void;
  onSave?: () => void;
  viewMode?: boolean;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: Address;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: InstallationStatus;
  priority: Priority;
  notes: string;
  leadId: string;
  assistantId: string;
}

const InstallationModal: React.FC<InstallationModalProps> = ({
  installation,
  onClose,
  onSave,
  viewMode = false
}) => {
  const [teams, setTeams] = useState<TeamMember[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    duration: 240,
    status: 'pending',
    priority: 'medium',
    notes: '',
    leadId: '',
    assistantId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Load team members
  useEffect(() => {
    loadTeamMembers();
  }, []);

  // Initialize form data when installation changes
  useEffect(() => {
    if (installation) {
      setFormData({
        customerName: installation.customerName,
        customerPhone: installation.customerPhone,
        customerEmail: installation.customerEmail,
        address: installation.address,
        scheduledDate: installation.scheduledDate,
        scheduledTime: installation.scheduledTime,
        duration: installation.duration,
        status: installation.status,
        priority: installation.priority,
        notes: installation.notes || '',
        leadId: installation.leadId || '',
        assistantId: installation.assistantId || ''
      });
    } else {
      // Reset form for create mode
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        duration: 240,
        status: 'pending',
        priority: 'medium',
        notes: '',
        leadId: '',
        assistantId: ''
      });
    }
    setErrors({});
    setConflicts([]);
  }, [installation]);

  // Load team members
  const loadTeamMembers = async () => {
    try {
      setLoadingTeams(true);
      // Get all team members from the team service
      const { data } = await teamService.getTeamMembers();
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Handle form field changes
  const handleChange = (field: keyof FormData, value: any) => {
    if (field === 'address') {
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, ...value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Check for conflicts when scheduling changes
    if (field === 'scheduledDate' || field === 'scheduledTime' || field === 'leadId' || field === 'assistantId') {
      debouncedConflictCheck();
    }
  };

  // Debounced conflict checking
  const debouncedConflictCheck = React.useCallback(
    React.useMemo(
      () => {
        let timeoutId: NodeJS.Timeout;
        return () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            checkSchedulingConflicts();
          }, 1000);
        };
      },
      []
    ),
    []
  );

  // Check for scheduling conflicts
  const checkSchedulingConflicts = async () => {
    if (!formData.leadId || !formData.scheduledDate || !formData.scheduledTime) return;
    
    setCheckingConflicts(true);
    try {
      // For new installations, we'll do a manual check
      // For existing installations, we can use the service's conflict detection
      if (installation) {
        const detectedConflicts = await installationService.detectSchedulingConflicts(installation.id);
        setConflicts(detectedConflicts);
      } else {
        // Manual conflict check for new installations
        const isAvailable = await installationService.checkTeamMemberAvailability(
          formData.leadId,
          formData.scheduledDate,
          formData.scheduledTime,
          formData.duration
        );
        
        if (!isAvailable) {
          setConflicts([{
            id: 'temp-conflict',
            type: 'unavailable_team',
            severity: 'high',
            description: 'Selected team member is not available at this time',
            affectedInstallations: [],
            affectedTeamMembers: [formData.leadId],
            suggestedResolution: 'Choose a different time or team member',
            autoResolvable: false
          }]);
        } else {
          setConflicts([]);
        }
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setConflicts([]);
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.address.zipCode)) {
      newErrors['address.zipCode'] = 'Invalid ZIP code format';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required';
    }

    // Email validation (if provided)
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email format';
    }

    // Phone validation (if provided)
    if (formData.customerPhone && !/^[\+]?[\(\)\-\s\d]{10,}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Invalid phone number format';
    }

    // Duration validation
    if (formData.duration <= 0 || formData.duration > 960) {
      newErrors.duration = 'Duration must be between 1 and 960 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (viewMode) {
      onClose();
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Check for critical conflicts
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical' || c.severity === 'high');
    if (criticalConflicts.length > 0) {
      const confirmOverride = window.confirm(
        `There are ${criticalConflicts.length} scheduling conflicts detected. Do you want to proceed anyway?`
      );
      if (!confirmOverride) return;
    }

    setIsSubmitting(true);

    try {
      // Geocode address if needed
      const geocodedAddress = await installationService.geocodeAddress(formData.address);
      
      const installationData = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim() || undefined,
        customerEmail: formData.customerEmail.trim() || undefined,
        address: geocodedAddress,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        duration: formData.duration,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes.trim() || undefined,
        leadId: formData.leadId || undefined,
        assistantId: formData.assistantId || undefined
      };

      if (installation) {
        // Update existing installation
        await installationService.updateInstallation(installation.id, installationData);
      } else {
        // Create new installation
        await installationService.createInstallation(installationData);
      }

      // Call the parent callback
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error saving installation:', error);
      setErrors({ submit: 'Failed to save installation. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const modalTitle = installation ? (viewMode ? 'Installation Details' : 'Edit Installation') : 'New Installation';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-glass border border-white/20 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden backdrop-filter backdrop-blur-md">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{modalTitle}</h2>
                {installation && (
                  <p className="text-sm text-white/70">ID: {installation.id}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {checkingConflicts && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-accent-500/10 border border-accent-500/30 rounded text-accent-300">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Checking conflicts...</span>
                </div>
              )}
              
              {conflicts.length > 0 && !checkingConflicts && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-warning-500/10 border border-warning-500/30 rounded text-warning-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">{conflicts.length} conflicts</span>
                </div>
              )}
              
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="h-5 w-5 text-white/40" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Error Alert */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-error-500/10 border border-error-500/30 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
                <span className="text-error-300">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Conflicts Alert */}
          {conflicts.length > 0 && !checkingConflicts && (
            <div className="mb-4 p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-warning-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-warning-300 font-medium">Scheduling Conflicts Detected</h4>
                  <ul className="mt-2 space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index} className="text-sm text-warning-200">
                        • {conflict.description}
                        {conflict.suggestedResolution && (
                          <div className="text-xs text-warning-200/80 ml-2 mt-1">
                            Suggestion: {conflict.suggestedResolution}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Customer Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white flex items-center">
                  <User className="h-4 w-4 mr-2 text-accent-400" />
                  Customer Information
                </h4>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    disabled={viewMode}
                    className={`form-input ${
                      errors.customerName ? 'border-error-500/50 focus:border-error-500/70' : ''
                    }`}
                    placeholder="Enter customer name"
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-error-400">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleChange('customerPhone', e.target.value)}
                    disabled={viewMode}
                    className={`form-input ${
                      errors.customerPhone ? 'border-error-500/50 focus:border-error-500/70' : ''
                    }`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.customerPhone && (
                    <p className="mt-1 text-sm text-error-400">{errors.customerPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleChange('customerEmail', e.target.value)}
                    disabled={viewMode}
                    className={`form-input ${
                      errors.customerEmail ? 'border-error-500/50 focus:border-error-500/70' : ''
                    }`}
                    placeholder="customer@example.com"
                  />
                  {errors.customerEmail && (
                    <p className="mt-1 text-sm text-error-400">{errors.customerEmail}</p>
                  )}
                </div>

                {/* Address Section */}
                <h4 className="text-sm font-medium text-white flex items-center pt-4">
                  <MapPin className="h-4 w-4 mr-2 text-accent-400" />
                  Installation Address
                </h4>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleChange('address', { street: e.target.value })}
                    disabled={viewMode}
                    className={`form-input ${
                      errors['address.street'] ? 'border-error-500/50 focus:border-error-500/70' : ''
                    }`}
                    placeholder="123 Main Street"
                  />
                  {errors['address.street'] && (
                    <p className="mt-1 text-sm text-error-400">{errors['address.street']}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleChange('address', { city: e.target.value })}
                      disabled={viewMode}
                      className={`form-input ${
                        errors['address.city'] ? 'border-error-500/50 focus:border-error-500/70' : ''
                      }`}
                      placeholder="City"
                    />
                    {errors['address.city'] && (
                      <p className="mt-1 text-sm text-error-400">{errors['address.city']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleChange('address', { state: e.target.value })}
                      disabled={viewMode}
                      className={`form-input ${
                        errors['address.state'] ? 'border-error-500/50 focus:border-error-500/70' : ''
                      }`}
                      placeholder="ST"
                      maxLength={2}
                    />
                    {errors['address.state'] && (
                      <p className="mt-1 text-sm text-error-400">{errors['address.state']}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => handleChange('address', { zipCode: e.target.value })}
                    disabled={viewMode}
                    className={`form-input ${
                      errors['address.zipCode'] ? 'border-error-500/50 focus:border-error-500/70' : ''
                    }`}
                    placeholder="12345"
                  />
                  {errors['address.zipCode'] && (
                    <p className="mt-1 text-sm text-error-400">{errors['address.zipCode']}</p>
                  )}
                </div>
              </div>

              {/* Right Column - Installation Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-accent-400" />
                  Installation Details
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => handleChange('scheduledDate', e.target.value)}
                      disabled={viewMode}
                      className={`form-input ${
                        errors.scheduledDate ? 'border-error-500/50 focus:border-error-500/70' : ''
                      }`}
                    />
                    {errors.scheduledDate && (
                      <p className="mt-1 text-sm text-error-400">{errors.scheduledDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Scheduled Time *
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => handleChange('scheduledTime', e.target.value)}
                      disabled={viewMode}
                      className={`form-input ${
                        errors.scheduledTime ? 'border-error-500/50 focus:border-error-500/70' : ''
                      }`}
                    />
                    {errors.scheduledTime && (
                      <p className="mt-1 text-sm text-error-400">{errors.scheduledTime}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="960"
                    step="30"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value) || 240)}
                    disabled={viewMode}
                    className={`form-input ${
                      errors.duration ? 'border-error-500/50 focus:border-error-500/70' : ''
                    }`}
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-error-400">{errors.duration}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value as InstallationStatus)}
                      disabled={viewMode}
                      className="form-input"
                    >
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value as Priority)}
                      disabled={viewMode}
                      className="form-input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Team Assignment Section */}
                <h4 className="text-sm font-medium text-white flex items-center pt-4">
                  <Users className="h-4 w-4 mr-2 text-accent-400" />
                  Team Assignment
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Lead Technician
                    </label>
                    <select
                      value={formData.leadId}
                      onChange={(e) => handleChange('leadId', e.target.value)}
                      disabled={viewMode || loadingTeams}
                      className="form-input"
                    >
                      <option value="">Unassigned</option>
                      {loadingTeams ? (
                        <option disabled>Loading team members...</option>
                      ) : (
                        teams.filter(t => t.role === 'lead').map(team => (
                          <option key={team.id} value={team.id}>
                            {team.firstName} {team.lastName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Assistant
                    </label>
                    <select
                      value={formData.assistantId}
                      onChange={(e) => handleChange('assistantId', e.target.value)}
                      disabled={viewMode || loadingTeams}
                      className="form-input"
                    >
                      <option value="">Unassigned</option>
                      {loadingTeams ? (
                        <option disabled>Loading team members...</option>
                      ) : (
                        teams.filter(t => t.role === 'assistant').map(team => (
                          <option key={team.id} value={team.id}>
                            {team.firstName} {team.lastName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    disabled={viewMode}
                    rows={4}
                    className="form-input"
                    placeholder="Additional notes or special requirements..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                {viewMode ? 'Close' : 'Cancel'}
              </button>
              
              {!viewMode && (
                <button
                  type="submit"
                  disabled={isSubmitting || (conflicts.some(c => c.severity === 'critical'))}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-lg hover:bg-accent-500/30 transition-all duration-200 backdrop-filter backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-300"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{installation ? 'Save Changes' : 'Create Installation'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstallationModal;