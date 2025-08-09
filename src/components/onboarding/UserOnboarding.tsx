// Think Tank Technologies - User Invitation and Onboarding System
// Comprehensive onboarding flow for new organization members

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { supabase } from '../../services/supabase';
import { useOrganization } from '../../contexts/OrganizationProvider';
import type {
  UserInvitation,
  Organization,
  Project,
  UserSettings,
  OrganizationRole,
  ProjectRole
} from '../../types';

// Invitation Acceptance Page Component
interface InvitationAcceptanceProps {
  token: string;
  onAcceptComplete: (invitation: UserInvitation) => void;
}

const InvitationAcceptance: React.FC<InvitationAcceptanceProps> = ({ token, onAcceptComplete }) => {
  const [invitation, setInvitation] = useState<UserInvitation | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string>('');
  const [userCredentials, setUserCredentials] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });

  // Load invitation details
  useEffect(() => {
    const loadInvitation = async () => {
      try {
        setIsLoading(true);
        
        // Get invitation by token
        const { data: invitationData, error: invitationError } = await supabase
          .from('user_invitations')
          .select(`
            *,
            organizations(*),
            projects(*)
          `)
          .eq('token', token)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (invitationError || !invitationData) {
          setError('Invalid or expired invitation');
          return;
        }

        setInvitation(invitationData as UserInvitation);
        setOrganization(invitationData.organizations as Organization);
        
        if (invitationData.project_id) {
          setProject(invitationData.projects as Project);
        }

      } catch (err) {
        setError('Failed to load invitation details');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadInvitation();
    }
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !organization) return;

    // Validate form
    if (!userCredentials.firstName.trim() || !userCredentials.lastName.trim()) {
      setError('Please enter your first and last name');
      return;
    }

    if (userCredentials.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (userCredentials.password !== userCredentials.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsAccepting(true);

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: userCredentials.password,
        options: {
          data: {
            first_name: userCredentials.firstName,
            last_name: userCredentials.lastName,
            invitation_token: token
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // The user creation trigger will handle the invitation acceptance
      // and organization/project assignment
      
      onAcceptComplete(invitation);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              variant="secondary" 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!invitation || !organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-lg w-full mx-4 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Join {organization.name}</h2>
          <p className="text-gray-600">
            You've been invited to join as a {invitation.organizationRole}
            {project && (
              <span> and work on the <strong>{project.name}</strong> project</span>
            )}
          </p>
        </div>

        {invitation.metadata.message && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Welcome Message</h3>
            <p className="text-sm text-blue-700">{invitation.metadata.message}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <Input
                id="firstName"
                type="text"
                value={userCredentials.firstName}
                onChange={(e) => setUserCredentials(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
                disabled={isAccepting}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <Input
                id="lastName"
                type="text"
                value={userCredentials.lastName}
                onChange={(e) => setUserCredentials(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Smith"
                disabled={isAccepting}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={invitation.email}
              disabled
              className="w-full bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <Input
              id="password"
              type="password"
              value={userCredentials.password}
              onChange={(e) => setUserCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Choose a strong password"
              disabled={isAccepting}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={userCredentials.confirmPassword}
              onChange={(e) => setUserCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm your password"
              disabled={isAccepting}
              className="w-full"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            loading={isAccepting}
            className="w-full"
            size="lg"
          >
            Accept Invitation & Join Organization
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          By accepting this invitation, you agree to the terms of service and privacy policy.
        </div>
      </Card>
    </div>
  );
};

// User Onboarding Flow Component
interface UserOnboardingFlowProps {
  invitation: UserInvitation;
  onComplete: () => void;
}

const UserOnboardingFlow: React.FC<UserOnboardingFlowProps> = ({ invitation, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserSettings>>({
    theme: 'auto',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en',
    preferences: {
      defaultView: 'calendar',
      itemsPerPage: 25,
      showAvatars: true,
      enableSounds: true,
      autoRefresh: true,
      refreshInterval: 300
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      title: 'Welcome to the Team',
      description: 'Let\'s get you set up with your new account'
    },
    {
      title: 'Set Your Preferences',
      description: 'Customize your experience'
    },
    {
      title: 'Learn the Basics',
      description: 'Quick overview of key features'
    },
    {
      title: 'You\'re All Set!',
      description: 'Ready to start working'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Update user preferences
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            settings: preferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user preferences:', error);
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const WelcomeStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to the Team!</h2>
      <p className="text-gray-600 mb-6">
        Your account has been successfully created. You're now part of the organization and ready to start collaborating.
      </p>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Your Role & Access</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <div>Organization Role: <strong className="capitalize">{invitation.organizationRole}</strong></div>
          {invitation.projectRole && (
            <div>Project Role: <strong className="capitalize">{invitation.projectRole}</strong></div>
          )}
        </div>
      </div>

      <div className="text-left">
        <h4 className="text-sm font-medium text-gray-900 mb-3">What you can do next:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            View and manage your assigned installations
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Collaborate with team members
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Access project schedules and reports
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Customize your account preferences
          </li>
        </ul>
      </div>
    </div>
  );

  const PreferencesStep = () => (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Set Your Preferences</h2>
        <p className="text-gray-600">Customize how you want to use the platform</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={preferences.theme}
              onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'auto' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="auto">Auto (System)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
            <select
              value={preferences.timeFormat}
              onChange={(e) => setPreferences(prev => ({ ...prev, timeFormat: e.target.value as '12h' | '24h' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default View</label>
            <select
              value={preferences.preferences?.defaultView}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                preferences: { 
                  ...prev.preferences, 
                  defaultView: e.target.value as 'calendar' | 'list' | 'map' 
                } 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="calendar">Calendar View</option>
              <option value="list">List View</option>
              <option value="map">Map View</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Notification Preferences</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.preferences?.enableSounds || false}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  preferences: { 
                    ...prev.preferences, 
                    enableSounds: e.target.checked 
                  } 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Enable notification sounds</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.preferences?.autoRefresh || false}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  preferences: { 
                    ...prev.preferences, 
                    autoRefresh: e.target.checked 
                  } 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Auto-refresh data</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const FeaturesStep = () => (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Feature Overview</h2>
        <p className="text-gray-600">Here's what you can do with the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Schedule Management</h3>
          <p className="text-sm text-gray-600">View and manage installation schedules, assign team members, and track progress.</p>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Team Collaboration</h3>
          <p className="text-sm text-gray-600">Work with team members, share updates, and coordinate on installations.</p>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Analytics & Reports</h3>
          <p className="text-sm text-gray-600">Track performance, view analytics, and generate reports for insights.</p>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Settings & Customization</h3>
          <p className="text-sm text-gray-600">Customize your experience and manage your account settings.</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Need Help Getting Started?</h3>
        <p className="text-sm text-blue-700 mb-3">
          Check out our help documentation or reach out to your team admin for assistance.
        </p>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">
            View Documentation
          </Button>
          <Button variant="secondary" size="sm">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );

  const CompleteStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h2>
      <p className="text-gray-600 mb-8">
        Your account is ready and configured. Welcome to the team!
      </p>
      
      <div className="bg-green-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-medium text-green-900 mb-4">What's Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-800 text-xs font-bold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-green-900">Explore the Dashboard</h4>
              <p className="text-sm text-green-700">Get familiar with the main interface</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-800 text-xs font-bold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-green-900">Check Your Assignments</h4>
              <p className="text-sm text-green-700">See if you have any pending tasks</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-800 text-xs font-bold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-green-900">Meet Your Team</h4>
              <p className="text-sm text-green-700">Connect with other team members</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-800 text-xs font-bold">4</span>
            </div>
            <div>
              <h4 className="font-medium text-green-900">Update Your Profile</h4>
              <p className="text-sm text-green-700">Add more details to your profile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep />;
      case 1: return <PreferencesStep />;
      case 2: return <FeaturesStep />;
      case 3: return <CompleteStep />;
      default: return <WelcomeStep />;
    }
  };

  return (
    <Modal isOpen={true} onClose={() => {}} size="lg">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <div className="text-sm font-medium text-gray-900">{steps[currentStep].title}</div>
            <div className="text-xs text-gray-500">{steps[currentStep].description}</div>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            loading={isLoading}
            disabled={isLoading}
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Main Component
interface UserOnboardingProps {
  token?: string;
}

export const UserOnboarding: React.FC<UserOnboardingProps> = ({ token }) => {
  const [acceptedInvitation, setAcceptedInvitation] = useState<UserInvitation | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  const handleInvitationAccepted = (invitation: UserInvitation) => {
    setAcceptedInvitation(invitation);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Redirect to dashboard
    router.push('/dashboard');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Invitation Token</h2>
            <p className="text-gray-600 mb-6">Please check your invitation email for the correct link.</p>
            <Button 
              variant="secondary" 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showOnboarding && acceptedInvitation) {
    return (
      <UserOnboardingFlow
        invitation={acceptedInvitation}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <InvitationAcceptance
      token={token}
      onAcceptComplete={handleInvitationAccepted}
    />
  );
};

export default UserOnboarding;