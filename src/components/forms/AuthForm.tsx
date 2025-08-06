// Think Tank Technologies Installation Scheduler - Authentication Form Component

import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Building } from 'lucide-react';
import { auth } from '../../services/supabase';
import { useAppStore } from '../../stores/useAppStore';
import { UserRole, type User as UserType } from '../../types';

interface AuthFormProps {
  /** Optional callback when authentication is successful */
  onSuccess?: (user: UserType) => void;
  /** Optional callback when there's an error */
  onError?: (error: string) => void;
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

export default function AuthForm({ onSuccess, onError }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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

  const { setAuthenticated, setUser, setLoading } = useAppStore();

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

    // Name validation (register only)
    if (mode === 'register') {
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
    setLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        const { data, error } = await auth.signIn(formData.email, formData.password);
        
        if (error) {
          const errorMessage = error.message === 'Supabase not configured' 
            ? 'Authentication service not configured. Using demo mode.'
            : 'Invalid email or password. Please try again.';
          
          if (error.message === 'Supabase not configured') {
            // Demo mode - simulate successful login
            const mockUser: UserType = {
              id: '1',
              email: formData.email,
              firstName: 'Demo',
              lastName: 'User',
              role: 'admin',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            setAuthenticated(true);
            setUser(mockUser);
            onSuccess?.(mockUser);
            return;
          }
          
          throw new Error(errorMessage);
        }

        if (data.user) {
          const user: UserType = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: data.user.user_metadata?.first_name || 'User',
            lastName: data.user.user_metadata?.last_name || '',
            role: data.user.user_metadata?.role || UserRole.SCHEDULER,
            isActive: data.user.user_metadata?.is_active ?? true,
            createdAt: data.user.created_at || new Date().toISOString(),
            updatedAt: data.user.updated_at || new Date().toISOString(),
          };
          
          setAuthenticated(true);
          setUser(user);
          onSuccess?.(user);
        }
      } else if (mode === 'register') {
        const { data: _, error } = await auth.signUp(formData.email, formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        });

        if (error) {
          const errorMessage = error.message === 'Supabase not configured'
            ? 'Registration service not configured. Please contact your administrator.'
            : error.message;
          throw new Error(errorMessage);
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
      } else if (mode === 'forgot') {
        const { error } = await auth.resetPassword(formData.email);
        
        if (error) {
          const errorMessage = error.message === 'Supabase not configured'
            ? 'Password reset service not configured. Please contact your administrator.'
            : error.message;
          throw new Error(errorMessage);
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
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'register': return 'Create Your Account';
      case 'forgot': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  const getSubmitButtonText = () => {
    if (isLoading) return 'Please wait...';
    switch (mode) {
      case 'register': return 'Create Account';
      case 'forgot': return 'Send Reset Email';
      default: return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-accent-600 rounded-lg flex items-center justify-center">
            <Building className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-semibold text-primary-900">
          Think Tank Technologies
        </h2>
        <p className="mt-2 text-center text-sm text-primary-600">
          Installation Scheduler
        </p>
        <h3 className="mt-4 text-center text-xl font-medium text-primary-800">
          {getTitle()}
        </h3>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-primary-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`form-input pl-10 ${errors.email ? 'border-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email}</p>
              )}
            </div>

            {/* First Name (Register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-primary-700">
                  First name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-primary-400" />
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

            {/* Last Name (Register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-primary-700">
                  Last name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-primary-400" />
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

            {/* Role Selection (Register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-primary-700">
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
                <label htmlFor="password" className="block text-sm font-medium text-primary-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-primary-400" />
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-primary-400 hover:text-primary-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary-400 hover:text-primary-600" />
                    )}
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-700">
                  Confirm password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-primary-400" />
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-primary-400 hover:text-primary-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary-400 hover:text-primary-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* General Error/Success Message */}
            {errors.general && (
              <div className={`p-3 rounded-md text-sm ${
                errors.general.includes('successful') || errors.general.includes('sent')
                  ? 'bg-success-50 text-success-700 border border-success-200'
                  : 'bg-error-50 text-error-700 border border-error-200'
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
                <div className="w-full border-t border-primary-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-primary-500">
                  {mode === 'login' ? 'New to Think Tank?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {mode === 'login' && (
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
                    className="text-sm text-accent-600 hover:text-accent-500 text-center"
                  >
                    Forgot your password?
                  </button>
                </>
              )}
              
              {(mode === 'register' || mode === 'forgot') && (
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