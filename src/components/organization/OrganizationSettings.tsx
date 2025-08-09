// Think Tank Technologies - Organization Settings Management
// Comprehensive organization settings, branding, and configuration interface

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useOrganization, usePermissions } from '../../contexts/OrganizationProvider';
import type {
  Organization,
  OrganizationSettings as OrgSettings,
  OrganizationBranding
} from '../../types';

// Props
interface OrganizationSettingsProps {
  className?: string;
}

// Settings Tab Type
type SettingsTab = 'general' | 'branding' | 'preferences' | 'integrations' | 'advanced';

// General Settings Component
const GeneralSettings: React.FC<{
  organization: Organization;
  onUpdate: (updates: Partial<Organization>) => Promise<void>;
  isLoading: boolean;
}> = ({ organization, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState({
    name: organization.name || '',
    slug: organization.slug || '',
    domain: organization.domain || ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const hasFormChanges = 
      formData.name !== organization.name ||
      formData.slug !== organization.slug ||
      formData.domain !== organization.domain;
    
    setHasChanges(hasFormChanges);
  }, [formData, organization]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Organization name must be between 2 and 100 characters';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Organization slug is required';
    } else if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    if (formData.domain && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(formData.domain)) {
      newErrors.domain = 'Please enter a valid domain';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await onUpdate({
        name: formData.name,
        slug: formData.slug,
        domain: formData.domain || undefined
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name
          </label>
          <Input
            id="orgName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            disabled={isLoading}
            className="max-w-md"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="orgSlug" className="block text-sm font-medium text-gray-700 mb-2">
            URL Slug
          </label>
          <div className="flex items-center max-w-md">
            <span className="text-gray-500 text-sm mr-2">yourapp.com/</span>
            <Input
              id="orgSlug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
              error={errors.slug}
              disabled={isLoading}
              className="flex-1"
            />
          </div>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This will be used in your organization's URL. Changing this may affect bookmarks and integrations.
          </p>
        </div>

        <div>
          <label htmlFor="orgDomain" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Domain
          </label>
          <Input
            id="orgDomain"
            type="text"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            placeholder="schedule.yourcompany.com"
            error={errors.domain}
            disabled={isLoading}
            className="max-w-md"
          />
          {errors.domain && (
            <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional. You'll need to configure DNS records after setting this up.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            loading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Branding Settings Component
const BrandingSettings: React.FC<{
  organization: Organization;
  onUpdate: (branding: Partial<OrganizationBranding>) => Promise<void>;
  isLoading: boolean;
}> = ({ organization, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState<OrganizationBranding>(
    organization.branding || {
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
      accentColor: '#10B981',
      companyName: organization.name || ''
    }
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(organization.branding || {});
    setHasChanges(hasFormChanges || logoFile !== null);
  }, [formData, organization.branding, logoFile]);

  const handleColorChange = (field: keyof OrganizationBranding, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('Image size should be less than 2MB');
        return;
      }
      setLogoFile(file);
    }
  };

  const handleSave = async () => {
    try {
      let updatedBranding = { ...formData };

      // Handle logo upload if needed
      if (logoFile) {
        // TODO: Implement file upload to storage service
        // For now, we'll create a placeholder URL
        const logoUrl = `https://example.com/logos/${organization.id}/${logoFile.name}`;
        updatedBranding.logoUrl = logoUrl;
        setLogoFile(null);
      }

      await onUpdate(updatedBranding);
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating branding:', error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Settings</h3>
      
      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo
          </label>
          <div className="flex items-center space-x-4">
            {(formData.logoUrl || logoFile) && (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {logoFile ? (
                  <img 
                    src={URL.createObjectURL(logoFile)} 
                    alt="Logo preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={formData.logoUrl} 
                    alt="Current logo" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
            <div>
              <input
                type="file"
                id="logoUpload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logoUpload"
                className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {formData.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 2MB. Recommended: 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Company Name
          </label>
          <Input
            id="companyName"
            type="text"
            value={formData.companyName || ''}
            onChange={(e) => handleColorChange('companyName', e.target.value)}
            placeholder={organization.name}
            disabled={isLoading}
            className="max-w-md"
          />
          <p className="mt-1 text-sm text-gray-500">
            This name will appear in emails and reports
          </p>
        </div>

        {/* Color Palette */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="primaryColor"
                value={formData.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                disabled={isLoading}
              />
              <Input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="secondaryColor"
                value={formData.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                disabled={isLoading}
              />
              <Input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="accentColor"
                value={formData.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                disabled={isLoading}
              />
              <Input
                type="text"
                value={formData.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.primaryColor }}
              />
              <span className="text-sm text-gray-600">Primary</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.secondaryColor }}
              />
              <span className="text-sm text-gray-600">Secondary</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.accentColor }}
              />
              <span className="text-sm text-gray-600">Accent</span>
            </div>
          </div>
        </div>

        {/* Email Signature */}
        <div>
          <label htmlFor="emailSignature" className="block text-sm font-medium text-gray-700 mb-2">
            Email Signature
          </label>
          <textarea
            id="emailSignature"
            rows={3}
            value={formData.emailSignature || ''}
            onChange={(e) => handleColorChange('emailSignature', e.target.value)}
            placeholder="Best regards,&#10;The Installation Team"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            This signature will be added to automated emails
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            loading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Preferences Settings Component
const PreferencesSettings: React.FC<{
  organization: Organization;
  onUpdate: (settings: Partial<OrgSettings>) => Promise<void>;
  isLoading: boolean;
}> = ({ organization, onUpdate, isLoading }) => {
  const [formData, setFormData] = useState<OrgSettings>(
    organization.settings || {
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en',
      workingHours: {
        start: '08:00',
        end: '17:00',
        days: [1, 2, 3, 4, 5] // Monday to Friday
      },
      defaultJobDuration: 240,
      travelTimeBuffer: 30,
      maxJobsPerTeamMember: 8,
      autoAssignments: true,
      enableOptimization: true,
      optimizationGoal: 'travel_distance',
      requireApprovalForChanges: false,
      allowOvertimeAssignment: false,
      weatherIntegration: false,
      trafficIntegration: false,
      customerPreferenceWeighting: 70,
      retentionDays: 365,
      auditLogging: true,
      encryptSensitiveData: true
    }
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(organization.settings || {});
    setHasChanges(hasFormChanges);
  }, [formData, organization.settings]);

  const updateField = <K extends keyof OrgSettings>(field: K, value: OrgSettings[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await onUpdate(formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver', 
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Preferences</h3>
      
      <div className="space-y-6">
        {/* Localization */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              id="dateFormat"
              value={formData.dateFormat}
              onChange={(e) => updateField('dateFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              id="timeFormat"
              value={formData.timeFormat}
              onChange={(e) => updateField('timeFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Default Working Hours</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="workStart" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <Input
                id="workStart"
                type="time"
                value={formData.workingHours.start}
                onChange={(e) => updateField('workingHours', {
                  ...formData.workingHours,
                  start: e.target.value
                })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="workEnd" className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <Input
                id="workEnd"
                type="time"
                value={formData.workingHours.end}
                onChange={(e) => updateField('workingHours', {
                  ...formData.workingHours,
                  end: e.target.value
                })}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Job Defaults */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Installation Defaults</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="defaultDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Default Duration (minutes)
              </label>
              <Input
                id="defaultDuration"
                type="number"
                min="30"
                max="960"
                value={formData.defaultJobDuration.toString()}
                onChange={(e) => updateField('defaultJobDuration', parseInt(e.target.value) || 240)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="travelBuffer" className="block text-sm font-medium text-gray-700 mb-2">
                Travel Buffer (minutes)
              </label>
              <Input
                id="travelBuffer"
                type="number"
                min="0"
                max="120"
                value={formData.travelTimeBuffer.toString()}
                onChange={(e) => updateField('travelTimeBuffer', parseInt(e.target.value) || 30)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="maxJobs" className="block text-sm font-medium text-gray-700 mb-2">
                Max Jobs per Team Member
              </label>
              <Input
                id="maxJobs"
                type="number"
                min="1"
                max="20"
                value={formData.maxJobsPerTeamMember.toString()}
                onChange={(e) => updateField('maxJobsPerTeamMember', parseInt(e.target.value) || 8)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Automation & Optimization</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoAssignments}
                onChange={(e) => updateField('autoAssignments', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-900">Enable automatic assignments</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enableOptimization}
                onChange={(e) => updateField('enableOptimization', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-900">Enable route optimization</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requireApprovalForChanges}
                onChange={(e) => updateField('requireApprovalForChanges', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-900">Require approval for schedule changes</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            loading={isLoading}
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Main Organization Settings Component
export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({ className = '' }) => {
  const { organization, updateOrganization, updateOrganizationSettings, updateOrganizationBranding } = useOrganization();
  const { canManageOrganization } = usePermissions();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLoading, setIsLoading] = useState(false);

  // Check permissions
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    canManageOrganization().then(setHasPermission);
  }, [canManageOrganization]);

  if (!organization) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No organization loaded</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">You don't have permission to manage organization settings</p>
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; description: string }[] = [
    { id: 'general', label: 'General', description: 'Basic organization information' },
    { id: 'branding', label: 'Branding', description: 'Logo, colors, and visual identity' },
    { id: 'preferences', label: 'Preferences', description: 'Defaults and automation settings' }
  ];

  const handleUpdateOrganization = async (updates: Partial<Organization>) => {
    setIsLoading(true);
    try {
      await updateOrganization(updates);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBranding = async (branding: Partial<OrganizationBranding>) => {
    setIsLoading(true);
    try {
      await updateOrganizationBranding(branding);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (settings: Partial<OrgSettings>) => {
    setIsLoading(true);
    try {
      await updateOrganizationSettings(settings);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your organization's configuration and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div>
                <div>{tab.label}</div>
                <div className="text-xs text-gray-400 mt-1">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && (
          <GeneralSettings
            organization={organization}
            onUpdate={handleUpdateOrganization}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'branding' && (
          <BrandingSettings
            organization={organization}
            onUpdate={handleUpdateBranding}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'preferences' && (
          <PreferencesSettings
            organization={organization}
            onUpdate={handleUpdateSettings}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default OrganizationSettings;