// Think Tank Technologies - Security Settings Panel

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Key,
  Clock,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Smartphone,
  Wifi,
  Download,
  Server,
  UserCheck
} from 'lucide-react';
import { useAppStore, useSecuritySettings } from '../../stores/useAppStore';
import type { SecuritySettings } from '../../types';

interface SecuritySettingsPanelProps {
  onChanged: () => void;
}

const SecuritySettingsPanel: React.FC<SecuritySettingsPanelProps> = ({ onChanged }) => {
  const securitySettings = useSecuritySettings();
  const { updateSecuritySettings } = useAppStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleUpdatePasswordRequirements = (field: keyof SecuritySettings['passwordRequirements'], value: any) => {
    updateSecuritySettings({
      passwordRequirements: {
        ...securitySettings.passwordRequirements,
        [field]: value
      }
    });
    onChanged();
  };

  const handleUpdateAuthSettings = (field: keyof SecuritySettings['authenticationSettings'], value: any) => {
    updateSecuritySettings({
      authenticationSettings: {
        ...securitySettings.authenticationSettings,
        [field]: value
      }
    });
    onChanged();
  };

  const handleUpdateDataSettings = (field: keyof SecuritySettings['dataSettings'], value: any) => {
    updateSecuritySettings({
      dataSettings: {
        ...securitySettings.dataSettings,
        [field]: value
      }
    });
    onChanged();
  };

  const handleUpdateAccessControl = (field: keyof SecuritySettings['accessControl'], value: any) => {
    updateSecuritySettings({
      accessControl: {
        ...securitySettings.accessControl,
        [field]: value
      }
    });
    onChanged();
  };

  const handleAllowedIPsChange = (value: string) => {
    const ips = value.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    handleUpdateAccessControl('allowedIPs', ips);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-primary-900 mb-6 flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Settings</span>
        </h2>
        <div className="flex items-start space-x-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-warning-800">Security Notice</h3>
            <p className="text-sm text-warning-700 mt-1">
              These settings affect system security and user access. Changes should be made carefully and may require administrator privileges.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Password Requirements */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Password Requirements</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Minimum Password Length
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="6"
                    max="50"
                    value={securitySettings.passwordRequirements.minLength}
                    onChange={(e) => handleUpdatePasswordRequirements('minLength', parseInt(e.target.value))}
                    className="form-input w-full pr-20"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-primary-500 text-sm">characters</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-primary-800">Character Requirements</h4>
                
                {[
                  { key: 'requireUppercase', label: 'Require uppercase letters (A-Z)' },
                  { key: 'requireLowercase', label: 'Require lowercase letters (a-z)' },
                  { key: 'requireNumbers', label: 'Require numbers (0-9)' },
                  { key: 'requireSpecialChars', label: 'Require special characters (!@#$%^&*)' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequirements[key as keyof typeof securitySettings.passwordRequirements] as boolean}
                      onChange={(e) => handleUpdatePasswordRequirements(key as keyof SecuritySettings['passwordRequirements'], e.target.checked)}
                      className="form-checkbox h-4 w-4 text-accent-600"
                    />
                    <span className="text-sm text-primary-700">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Password Expiry
                </label>
                <div className="relative">
                  <select
                    value={securitySettings.passwordRequirements.passwordExpiry}
                    onChange={(e) => handleUpdatePasswordRequirements('passwordExpiry', parseInt(e.target.value))}
                    className="form-input w-full"
                  >
                    <option value={0}>Never expires</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>6 months</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
                <p className="text-xs text-primary-500 mt-1">
                  How often users must change their passwords
                </p>
              </div>
            </div>
          </div>

          {/* Authentication Settings */}
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Authentication</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className={`h-5 w-5 ${securitySettings.authenticationSettings.twoFactorEnabled ? 'text-success-600' : 'text-primary-400'}`} />
                    <div>
                      <div className="font-medium text-primary-900">Two-Factor Authentication</div>
                      <div className="text-sm text-primary-600">
                        {securitySettings.authenticationSettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.authenticationSettings.twoFactorEnabled}
                      onChange={(e) => handleUpdateAuthSettings('twoFactorEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Session Timeout
                  </label>
                  <div className="relative">
                    <select
                      value={securitySettings.authenticationSettings.sessionTimeout}
                      onChange={(e) => handleUpdateAuthSettings('sessionTimeout', parseInt(e.target.value))}
                      className="form-input w-full"
                    >
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>4 hours</option>
                      <option value={480}>8 hours</option>
                      <option value={720}>12 hours</option>
                      <option value={1440}>24 hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={securitySettings.authenticationSettings.maxLoginAttempts}
                    onChange={(e) => handleUpdateAuthSettings('maxLoginAttempts', parseInt(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Lockout Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    step="5"
                    value={securitySettings.authenticationSettings.lockoutDuration}
                    onChange={(e) => handleUpdateAuthSettings('lockoutDuration', parseInt(e.target.value))}
                    className="form-input w-full"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={securitySettings.authenticationSettings.requireReauthForSensitive}
                      onChange={(e) => handleUpdateAuthSettings('requireReauthForSensitive', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-accent-600"
                    />
                    <span className="text-sm text-primary-700">Re-authenticate for sensitive operations</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Security & Access Control */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Data Security</span>
            </h3>

            <div className="space-y-4">
              {[
                { key: 'allowExport', label: 'Allow data export', icon: Download, description: 'Users can export data to files' },
                { key: 'allowBulkOperations', label: 'Allow bulk operations', icon: Server, description: 'Users can perform bulk updates and changes' },
                { key: 'auditLogging', label: 'Enable audit logging', icon: Eye, description: 'Log all user actions for security audits' },
                { key: 'encryptSensitiveData', label: 'Encrypt sensitive data', icon: Lock, description: 'Encrypt sensitive information in storage' }
              ].map(({ key, label, icon: Icon, description }) => (
                <div key={key} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-25 transition-colors">
                  <input
                    type="checkbox"
                    checked={securitySettings.dataSettings[key as keyof typeof securitySettings.dataSettings] as boolean}
                    onChange={(e) => handleUpdateDataSettings(key as keyof SecuritySettings['dataSettings'], e.target.checked)}
                    className="form-checkbox h-4 w-4 text-accent-600 mt-0.5"
                  />
                  <Icon className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary-700">{label}</div>
                    <div className="text-xs text-primary-500">{description}</div>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Data Retention Period (days)
                </label>
                <div className="relative">
                  <select
                    value={securitySettings.dataSettings.dataRetention}
                    onChange={(e) => handleUpdateDataSettings('dataRetention', parseInt(e.target.value))}
                    className="form-input w-full"
                  >
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>6 months</option>
                    <option value={365}>1 year</option>
                    <option value={730}>2 years</option>
                    <option value={1825}>5 years</option>
                    <option value={-1}>Never delete</option>
                  </select>
                </div>
                <p className="text-xs text-primary-500 mt-1">
                  How long to keep deleted data before permanent removal
                </p>
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div>
            <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Access Control</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wifi className={`h-5 w-5 ${securitySettings.accessControl.restrictIPAccess ? 'text-warning-600' : 'text-primary-400'}`} />
                    <div>
                      <div className="font-medium text-primary-900">IP Address Restrictions</div>
                      <div className="text-sm text-primary-600">
                        {securitySettings.accessControl.restrictIPAccess ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.accessControl.restrictIPAccess}
                      onChange={(e) => handleUpdateAccessControl('restrictIPAccess', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                  </label>
                </div>

                {securitySettings.accessControl.restrictIPAccess && (
                  <div className="ml-4 border-l-2 border-primary-200 pl-4 mt-4">
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Allowed IP Addresses
                    </label>
                    <textarea
                      value={securitySettings.accessControl.allowedIPs?.join(', ') || ''}
                      onChange={(e) => handleAllowedIPsChange(e.target.value)}
                      placeholder="192.168.1.100, 10.0.0.0/24, 203.0.113.0/24"
                      rows={3}
                      className="form-input w-full"
                    />
                    <p className="text-xs text-primary-500 mt-1">
                      Enter IP addresses or CIDR ranges, separated by commas
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {[
                  { key: 'requireVPN', label: 'Require VPN connection', description: 'Users must connect via VPN to access the system' },
                  { key: 'blockConcurrentSessions', label: 'Block concurrent sessions', description: 'Prevent users from logging in from multiple devices' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-25 transition-colors">
                    <input
                      type="checkbox"
                      checked={securitySettings.accessControl[key as keyof typeof securitySettings.accessControl] as boolean}
                      onChange={(e) => handleUpdateAccessControl(key as keyof SecuritySettings['accessControl'], e.target.checked)}
                      className="form-checkbox h-4 w-4 text-accent-600 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary-700">{label}</div>
                      <div className="text-xs text-primary-500">{description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Summary */}
      <div className="border-t border-primary-200 pt-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Security Status Summary</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="text-sm font-medium text-primary-700">Password Security</div>
            <div className="text-xs text-primary-600 mt-1">
              {securitySettings.passwordRequirements.minLength} char min, 
              {[
                securitySettings.passwordRequirements.requireUppercase,
                securitySettings.passwordRequirements.requireLowercase,
                securitySettings.passwordRequirements.requireNumbers,
                securitySettings.passwordRequirements.requireSpecialChars
              ].filter(Boolean).length} requirements
            </div>
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="text-sm font-medium text-primary-700">Two-Factor Auth</div>
            <div className={`text-xs mt-1 ${securitySettings.authenticationSettings.twoFactorEnabled ? 'text-success-600' : 'text-warning-600'}`}>
              {securitySettings.authenticationSettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="text-sm font-medium text-primary-700">Data Encryption</div>
            <div className={`text-xs mt-1 ${securitySettings.dataSettings.encryptSensitiveData ? 'text-success-600' : 'text-warning-600'}`}>
              {securitySettings.dataSettings.encryptSensitiveData ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="text-sm font-medium text-primary-700">Access Control</div>
            <div className="text-xs text-primary-600 mt-1">
              {securitySettings.accessControl.restrictIPAccess ? 'IP Restricted' : 'Open Access'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPanel;