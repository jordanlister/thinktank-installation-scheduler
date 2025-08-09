// Think Tank Technologies Installation Scheduler - Authentication Form Component

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Building } from 'lucide-react';
import { authService } from '../../services/authService';
import { invitationService } from '../../services/invitationService';
import { useOrganizationAuth } from '../../contexts/OrganizationProvider';
import { UserRole, type AuthUser, OrganizationRole } from '../../types';

interface AuthFormProps {
  /** Optional callback when authentication is successful */
  onSuccess?: (user: AuthUser) => void;
  /** Optional callback when there's an error */
  onError?: (error: string) => void;
  /** Optional invitation token for signup */
  invitationToken?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

export default function AuthForm({ onSuccess, onError, invitationToken }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'accept-invitation'>(
    invitationToken ? 'accept-invitation' : 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: UserRole.SCHEDULER,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [invitation, setInvitation] = useState<any>(null);

  const { signIn, isLoading: authLoading, currentUser } = useOrganizationAuth();

  // Load and validate invitation if token provided
  useEffect(() => {
    if (invitationToken) {
      const validateInvitation = async () => {
        const result = await invitationService.validateInvitation(invitationToken);
        if (result.valid && result.invitation) {
          setInvitation(result.invitation);
          setFormData(prev => ({
            ...prev,
            email: result.invitation!.email,
            firstName: result.invitation!.metadata?.firstName || '',
            lastName: result.invitation!.metadata?.lastName || '',
          }));
        } else {
          setErrors({ general: result.error || 'Invalid invitation' });
          setMode('login');
        }
      };
      validateInvitation();
    }
  }, [invitationToken]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (mode !== 'forgot') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (mode === 'register' && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (mode === 'register' && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }

      // Confirm password validation (register only)
      if (mode === 'register') {
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    // Name validation (register and accept-invitation)
    if (mode === 'register' || mode === 'accept-invitation') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        const result = await signIn(formData.email, formData.password);
        
        if (!result.success) {
          throw new Error(result.error || 'Login failed');
        }
        
        // Success callback will be handled by OrganizationProvider's onAuthStateChange
        onSuccess?.(currentUser!);
        
      } else if (mode === 'register') {
        const response = await authService.signUp({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          organizationRole: formData.role as OrganizationRole
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // For most Supabase setups, user needs to verify email before they can sign in
        setErrors({
          general: 'Registration successful! Please check your email to verify your account before signing in.'
        });
        
        // Switch to login mode after successful registration
        setTimeout(() => {
          setMode('login');
          setErrors({});
        }, 3000);
        
      } else if (mode === 'accept-invitation' && invitationToken) {
        const result = await invitationService.acceptInvitation({
          token: invitationToken,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to accept invitation');
        }

        // Set success message and auto-login
        setErrors({
          general: 'Account created successfully! You can now sign in.'
        });
        
        // Switch to login mode and pre-fill email
        setTimeout(() => {
          setMode('login');
          setFormData(prev => ({ ...prev, email: invitation?.email || '' }));
          setErrors({});
        }, 3000);
        
      } else if (mode === 'forgot') {
        const response = await authService.resetPassword(formData.email);
        
        if (response.error) {
          throw new Error(response.error);
        }

        setErrors({
          general: 'Password reset email sent! Please check your inbox for further instructions.'
        });
        
        // Switch back to login mode
        setTimeout(() => {
          setMode('login');
          setErrors({});
        }, 3000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ general: message });
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'register': return 'Create Your Account';
      case 'accept-invitation': return 'Complete Your Registration';
      case 'forgot': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  const getSubmitButtonText = () => {
    if (isLoading || authLoading) return 'Please wait...';
    switch (mode) {
      case 'register': return 'Create Account';
      case 'accept-invitation': return 'Complete Registration';
      case 'forgot': return 'Send Reset Email';
      default: return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen bg-dark-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-glass-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-400/4 rounded-full blur-3xl animate-glass-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow-accent">
            <Building className="h-8 w-8 text-white drop-shadow-sm" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-semibold text-glass-primary">
          Think Tank Technologies
        </h2>
        <p className="mt-2 text-center text-sm text-glass-secondary">
          Installation Scheduler
        </p>
        <h3 className="mt-4 text-center text-xl font-medium text-glass-primary">
          {getTitle()}
        </h3>
        {mode === 'accept-invitation' && invitation && (
          <div className="mt-4 text-center">
            <p className="text-sm text-glass-secondary">
              You've been invited to join <span className="font-medium text-accent-400">{invitation.organizations?.name}</span>
            </p>
            {invitation.projects && (
              <p className="text-xs text-glass-muted mt-1">
                Project: {invitation.projects.name}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="modal-glass py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-glass-secondary">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-glass-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={mode === 'accept-invitation'}
                  className={`form-input pl-10 ${errors.email ? 'border-error-500 focus:border-error-500' : ''} ${mode === 'accept-invitation' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email}</p>
              )}
            </div>

            {/* First Name (Register and Accept Invitation) */}
            {(mode === 'register' || mode === 'accept-invitation') && (
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-glass-secondary">
                  First name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-glass-muted" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    className={`form-input pl-10 ${errors.firstName ? 'border-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-error-600">{errors.firstName}</p>
                )}
              </div>
            )}

            {/* Last Name (Register and Accept Invitation) */}
            {(mode === 'register' || mode === 'accept-invitation') && (
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-glass-secondary">
                  Last name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-glass-muted" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    className={`form-input pl-10 ${errors.lastName ? 'border-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-error-600">{errors.lastName}</p>
                )}
              </div>
            )}

            {/* Role Selection (Register only - not for invitation acceptance) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-glass-secondary">
                  Role
                </label>
                <div className="mt-1">
                  <select
                    id="role"
                    name="role"
                    className="form-input"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                  >
                    <option value={UserRole.SCHEDULER}>Scheduler</option>
                    <option value={UserRole.LEAD}>Lead Installer</option>
                    <option value={UserRole.ASSISTANT}>Assistant Installer</option>
                    <option value={UserRole.VIEWER}>Viewer</option>
                  </select>
                </div>
              </div>
            )}

            {/* Password Field */}
            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-glass-secondary">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-glass-muted" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    required
                    className={`form-input pl-10 pr-10 ${errors.password ? 'border-error-500 focus:border-error-500' : ''}`}
                    placeholder={mode === 'register' ? 'Create a strong password' : 'Enter your password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-glass-muted hover:text-glass-secondary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password}</p>
                )}
              </div>
            )}

            {/* Confirm Password Field (Register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-glass-secondary">
                  Confirm password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-glass-muted" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'border-error-500 focus:border-error-500' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-glass-muted hover:text-glass-secondary transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* General Error/Success Message */}
            {errors.general && (
              <div className={`alert-glass text-sm ${
                errors.general.includes('successful') || errors.general.includes('sent')
                  ? 'alert-success'
                  : 'alert-error'
              }`}>
                {errors.general}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center"
              >
                {getSubmitButtonText()}
              </button>
            </div>
          </form>

          {/* Mode Switching Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black/20 text-glass-muted">
                  {mode === 'login' ? 'New to Think Tank?' : 
                   mode === 'accept-invitation' ? 'Already have an account?' :
                   'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {mode === 'login' && !invitationToken && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="btn-secondary w-full justify-center"
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-accent-300 hover:text-accent-200 text-center transition-colors"
                  >
                    Forgot your password?
                  </button>
                </>
              )}
              
              {(mode === 'register' || mode === 'forgot' || mode === 'accept-invitation') && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="btn-secondary w-full justify-center"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}