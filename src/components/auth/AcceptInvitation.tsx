// Think Tank Technologies Installation Scheduler - Accept Invitation Component
// Handles user invitation acceptance and account creation

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Building, 
  Users, 
  Shield,
  Clock,
  Mail
} from 'lucide-react';
import { invitationService } from '../../services/invitationService';
import { authService } from '../../services/authService';
import {
  UserInvitation,
  OrganizationRole,
  ProjectRole
} from '../../types';

interface AcceptInvitationProps {
  className?: string;
}

interface InvitationFormData {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  general?: string;
}

const AcceptInvitation: React.FC<AcceptInvitationProps> = ({ className = '' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<UserInvitation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<InvitationFormData>({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  // Validate invitation token on component mount
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setErrors({ general: 'Invalid invitation link - no token provided' });
        setIsValidating(false);
        return;
      }

      try {
        const result = await invitationService.validateInvitation(token);
        
        if (result.valid && result.invitation) {
          setInvitation(result.invitation);
          setIsValid(true);
          
          // Pre-fill form with invitation data if available
          if (result.invitation.metadata.firstName) {
            setFormData(prev => ({
              ...prev,
              firstName: result.invitation.metadata.firstName!
            }));
          }
          
          if (result.invitation.metadata.lastName) {
            setFormData(prev => ({
              ...prev,
              lastName: result.invitation.metadata.lastName!
            }));
          }
        } else {
          setErrors({ general: result.error || 'Invalid or expired invitation' });
          setIsValid(false);
        }
      } catch (error) {
        setErrors({ general: 'Failed to validate invitation. Please try again.' });
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateInvitation();
  }, [token]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof InvitationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token || !invitation) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await invitationService.acceptInvitation({
        token,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password
      });

      if (result.success) {
        // Show success message and redirect to login
        setErrors({ 
          general: 'Account created successfully! Please check your email to verify your account, then sign in.' 
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              email: invitation.email,
              message: 'Account created successfully! Please sign in.' 
            }
          });
        }, 3000);
      } else {
        setErrors({ general: result.error || 'Failed to accept invitation' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: OrganizationRole | ProjectRole): string => {
    const roleNames: Record<string, string> = {
      owner: 'Owner',
      admin: 'Administrator',
      manager: 'Manager',
      member: 'Member',
      scheduler: 'Scheduler',
      lead: 'Lead Installer',
      assistant: 'Assistant Installer',
      viewer: 'Viewer'
    };
    return roleNames[role] || role;
  };

  // Loading state
  if (isValidating) {
    return (
      <div className={`min-h-screen bg-dark-gradient flex items-center justify-center ${className}`}>
        <div className="modal-glass p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-glass-primary mb-2">Validating Invitation</h2>
          <p className="text-glass-secondary">Please wait while we verify your invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid invitation state
  if (!isValid || !invitation) {
    return (
      <div className={`min-h-screen bg-dark-gradient flex items-center justify-center ${className}`}>
        <div className="modal-glass p-8 max-w-md w-full mx-4 text-center">
          <AlertTriangle className="h-16 w-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-glass-primary mb-2">Invalid Invitation</h2>
          <p className="text-glass-secondary mb-6">
            {errors.general || 'This invitation link is invalid or has expired.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-dark-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative ${className}`}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-glass-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-400/4 rounded-full blur-3xl animate-glass-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Header */}
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow-accent">
            <Building className="h-8 w-8 text-white drop-shadow-sm" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-semibold text-glass-primary">
          You're Invited!
        </h2>
        
        <p className="mt-2 text-center text-sm text-glass-secondary">
          Complete your account setup to join the team
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="modal-glass py-8 px-4 sm:px-10">
          {/* Invitation Details */}
          <div className="mb-8 p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-700">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-accent-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-accent-900 dark:text-accent-100">
                  Join {invitation.organizations?.name || 'Organization'}
                </p>
                <p className="text-sm text-accent-600 dark:text-accent-400">
                  as {getRoleDisplayName(invitation.organization_role)}
                </p>
                {invitation.projects && (
                  <p className="text-sm text-accent-600 dark:text-accent-400">
                    Project: {invitation.projects.name} ({getRoleDisplayName(invitation.project_role!)})
                  </p>
                )}
                {invitation.metadata.message && (
                  <p className="text-sm text-accent-700 dark:text-accent-300 mt-2 italic">
                    "{invitation.metadata.message}"
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex items-center space-x-4 text-xs text-accent-600 dark:text-accent-400">
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Invited by {invitation.metadata.inviterName || 'Team Admin'}</span>
              </span>
            </div>
          </div>

          {/* Success message */}
          {errors.general && errors.general.includes('successfully') && (
            <div className="alert-glass alert-success mb-6">
              <CheckCircle className="h-4 w-4" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Error message */}
          {errors.general && !errors.general.includes('successfully') && (
            <div className="alert-glass alert-error mb-6">
              <AlertTriangle className="h-4 w-4" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-glass-secondary">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  value={invitation.email}
                  readOnly
                  className="form-input bg-glass-subtle cursor-not-allowed"
                />
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-glass-secondary">
                First Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`form-input ${errors.firstName ? 'border-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-error-600">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-glass-secondary">
                Last Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`form-input ${errors.lastName ? 'border-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter your last name"
                  required
                />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-error-600">{errors.lastName}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-glass-secondary">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`form-input pr-10 ${errors.password ? 'border-error-500 focus:border-error-500' : ''}`}
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-glass-muted" />
                  ) : (
                    <Eye className="h-4 w-4 text-glass-muted" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-glass-muted">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-glass-secondary">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`form-input pr-10 ${errors.confirmPassword ? 'border-error-500 focus:border-error-500' : ''}`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-glass-muted" />
                  ) : (
                    <Eye className="h-4 w-4 text-glass-muted" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="focus:ring-accent-500 h-4 w-4 text-accent-600 border-glass-border rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="text-glass-secondary">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 hover:text-accent-500"
                    >
                      Terms and Conditions
                    </a>
                    {' '}and{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 hover:text-accent-500"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-error-600">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating Account...' : 'Accept Invitation & Create Account'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-glass-muted">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-accent-600 hover:text-accent-500 font-medium"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;