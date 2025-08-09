// Think Tank Technologies - Organization Setup Wizard
// Comprehensive onboarding flow for new organizations

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import type {
  OrganizationSetupData,
  OrganizationSetupStep,
  OrganizationSetupState,
  OrganizationSettings,
  OrganizationBranding,
  SubscriptionPlan,
  BillingCycle,
  OrganizationRole,
  ProjectRole,
  ValidationResult
} from '../../types';

// Subscription Plans Configuration
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for small teams getting started',
    pricing: { monthly: 0, yearly: 0 },
    limits: {
      projects: 1,
      teamMembers: 3,
      installations: 50,
      storage: 1,
      apiCalls: 1000
    },
    features: [
      'Basic scheduling',
      'Team management',
      'Mobile app access',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing installation businesses',
    pricing: { monthly: 49, yearly: 490 },
    limits: {
      projects: 5,
      teamMembers: 25,
      installations: 500,
      storage: 10,
      apiCalls: 10000
    },
    features: [
      'Advanced scheduling',
      'Route optimization',
      'Custom reporting',
      'API access',
      'Priority support'
    ],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with complex needs',
    pricing: { monthly: 199, yearly: 1990 },
    limits: {
      projects: -1,
      teamMembers: -1,
      installations: -1,
      storage: 100,
      apiCalls: 100000
    },
    features: [
      'Everything in Professional',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Custom branding'
    ]
  }
];

// Props
interface OrganizationSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OrganizationSetupData) => void;
}

// Validation functions
const validateOrganizationDetails = (data: Partial<OrganizationSetupData>): ValidationResult => {
  const errors: Record<string, string[]> = {};
  
  if (!data.organization?.name?.trim()) {
    errors.name = ['Organization name is required'];
  } else if (data.organization.name.length < 2 || data.organization.name.length > 100) {
    errors.name = ['Organization name must be between 2 and 100 characters'];
  }

  if (!data.organization?.slug?.trim()) {
    errors.slug = ['Organization slug is required'];
  } else if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(data.organization.slug)) {
    errors.slug = ['Slug must contain only lowercase letters, numbers, and hyphens'];
  }

  if (data.organization?.domain && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(data.organization.domain)) {
    errors.domain = ['Please enter a valid domain'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: {}
  };
};

const validateProjectDetails = (data: Partial<OrganizationSetupData>): ValidationResult => {
  const errors: Record<string, string[]> = {};
  
  if (!data.firstProject?.name?.trim()) {
    errors.projectName = ['Project name is required'];
  } else if (data.firstProject.name.length < 2 || data.firstProject.name.length > 100) {
    errors.projectName = ['Project name must be between 2 and 100 characters'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: {}
  };
};

const validateTeamInvites = (data: Partial<OrganizationSetupData>): ValidationResult => {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  
  if (!data.teamInvites || data.teamInvites.length === 0) {
    warnings.invites = ['Consider inviting team members to get started faster'];
  } else {
    data.teamInvites.forEach((invite, index) => {
      if (!invite.email?.trim()) {
        errors[`invite${index}Email`] = ['Email is required'];
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) {
        errors[`invite${index}Email`] = ['Please enter a valid email address'];
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

// Step Components
const OrganizationDetailsStep: React.FC<{
  data: Partial<OrganizationSetupData>;
  onUpdate: (data: Partial<OrganizationSetupData>) => void;
  errors: Record<string, string[]>;
}> = ({ data, onUpdate, errors }) => {
  const [organizationData, setOrganizationData] = useState(data.organization || {
    name: '',
    slug: '',
    domain: ''
  });

  // Generate slug from name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    const updatedData = { ...organizationData, name, slug };
    setOrganizationData(updatedData);
    onUpdate({ ...data, organization: updatedData });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
        <p className="text-gray-600 mt-2">
          Let's start by setting up your organization's basic information
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <Input
            id="orgName"
            type="text"
            value={organizationData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Think Tank Technologies"
            error={errors.name?.[0]}
            className="w-full"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="orgSlug" className="block text-sm font-medium text-gray-700 mb-2">
            URL Slug *
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 text-sm mr-2">yourapp.com/</span>
            <Input
              id="orgSlug"
              type="text"
              value={organizationData.slug}
              onChange={(e) => setOrganizationData(prev => {
                const updated = { ...prev, slug: e.target.value };
                onUpdate({ ...data, organization: updated });
                return updated;
              })}
              placeholder="think-tank-tech"
              error={errors.slug?.[0]}
              className="flex-1"
            />
          </div>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug[0]}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This will be used in your organization's URL
          </p>
        </div>

        <div>
          <label htmlFor="orgDomain" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Domain (Optional)
          </label>
          <Input
            id="orgDomain"
            type="text"
            value={organizationData.domain}
            onChange={(e) => setOrganizationData(prev => {
              const updated = { ...prev, domain: e.target.value };
              onUpdate({ ...data, organization: updated });
              return updated;
            })}
            placeholder="schedule.yourcompany.com"
            error={errors.domain?.[0]}
            className="w-full"
          />
          {errors.domain && (
            <p className="mt-1 text-sm text-red-600">{errors.domain[0]}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            You can add a custom domain later in your settings
          </p>
        </div>
      </div>
    </div>
  );
};

const FirstProjectStep: React.FC<{
  data: Partial<OrganizationSetupData>;
  onUpdate: (data: Partial<OrganizationSetupData>) => void;
  errors: Record<string, string[]>;
}> = ({ data, onUpdate, errors }) => {
  const [projectData, setProjectData] = useState(data.firstProject || {
    name: '',
    description: ''
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create Your First Project</h2>
        <p className="text-gray-600 mt-2">
          Projects help you organize your installations and team members
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <Input
            id="projectName"
            type="text"
            value={projectData.name}
            onChange={(e) => {
              const updated = { ...projectData, name: e.target.value };
              setProjectData(updated);
              onUpdate({ ...data, firstProject: updated });
            }}
            placeholder="Main Installation Project"
            error={errors.projectName?.[0]}
            className="w-full"
          />
          {errors.projectName && (
            <p className="mt-1 text-sm text-red-600">{errors.projectName[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="projectDescription"
            rows={3}
            value={projectData.description}
            onChange={(e) => {
              const updated = { ...projectData, description: e.target.value };
              setProjectData(updated);
              onUpdate({ ...data, firstProject: updated });
            }}
            placeholder="Describe what this project is for..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900">Project Benefits</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Separate teams and installations by project</li>
            <li>Project-specific settings and permissions</li>
            <li>Better organization for multiple locations or divisions</li>
            <li>Detailed project-level analytics and reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const TeamInvitesStep: React.FC<{
  data: Partial<OrganizationSetupData>;
  onUpdate: (data: Partial<OrganizationSetupData>) => void;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}> = ({ data, onUpdate, errors, warnings }) => {
  const [invites, setInvites] = useState(data.teamInvites || []);

  const addInvite = () => {
    const newInvites = [...invites, { email: '', role: 'member' as OrganizationRole }];
    setInvites(newInvites);
    onUpdate({ ...data, teamInvites: newInvites });
  };

  const removeInvite = (index: number) => {
    const newInvites = invites.filter((_, i) => i !== index);
    setInvites(newInvites);
    onUpdate({ ...data, teamInvites: newInvites });
  };

  const updateInvite = (index: number, field: string, value: any) => {
    const newInvites = [...invites];
    newInvites[index] = { ...newInvites[index], [field]: value };
    setInvites(newInvites);
    onUpdate({ ...data, teamInvites: newInvites });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Invite Your Team</h2>
        <p className="text-gray-600 mt-2">
          Invite team members to collaborate on your projects
        </p>
      </div>

      {warnings.invites && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{warnings.invites[0]}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {invites.map((invite, index) => (
          <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Input
                type="email"
                value={invite.email}
                onChange={(e) => updateInvite(index, 'email', e.target.value)}
                placeholder="colleague@company.com"
                error={errors[`invite${index}Email`]?.[0]}
                className="w-full"
              />
              {errors[`invite${index}Email`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`invite${index}Email`][0]}</p>
              )}
            </div>
            <div className="w-32">
              <select
                value={invite.role}
                onChange={(e) => updateInvite(index, 'role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => removeInvite(index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}

        <Button
          variant="secondary"
          onClick={addInvite}
          className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
        >
          + Add Team Member
        </Button>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Role Permissions</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div><strong>Admin:</strong> Full access to organization and project management</div>
            <div><strong>Manager:</strong> Can manage projects and team members within projects</div>
            <div><strong>Member:</strong> Can view and work on assigned projects</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionStep: React.FC<{
  data: Partial<OrganizationSetupData>;
  onUpdate: (data: Partial<OrganizationSetupData>) => void;
}> = ({ data, onUpdate }) => {
  const [selectedPlan, setSelectedPlan] = useState(data.subscription?.planId || 'free');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(data.subscription?.billingCycle || 'monthly');

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onUpdate({
      ...data,
      subscription: { planId, billingCycle }
    });
  };

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    onUpdate({
      ...data,
      subscription: { planId: selectedPlan, billingCycle: cycle }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">
          Select a plan that fits your team's needs. You can upgrade or downgrade anytime.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleBillingCycleChange('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleBillingCycleChange('yearly')}
          >
            Yearly (2 months free!)
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-colors ${
              selectedPlan === plan.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${plan.isPopular ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 text-xs rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
              
              <div className="mt-4">
                {plan.pricing[billingCycle] === 0 ? (
                  <span className="text-3xl font-bold text-gray-900">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.pricing[billingCycle]}
                    </span>
                    <span className="text-gray-600">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </>
                )}
              </div>
            </div>

            <ul className="mt-6 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-4 text-xs text-gray-500">
              <div>• {plan.limits.projects === -1 ? 'Unlimited' : plan.limits.projects} projects</div>
              <div>• {plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers} team members</div>
              <div>• {plan.limits.installations === -1 ? 'Unlimited' : plan.limits.installations} installations/month</div>
            </div>

            {selectedPlan === plan.id && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const CompleteStep: React.FC<{
  data: OrganizationSetupData;
  onComplete: () => void;
}> = ({ data, onComplete }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Setup Complete!</h2>
        <p className="text-gray-600 mt-2">
          Your organization is ready to go. Let's review your setup.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Summary</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Organization</h4>
            <p className="text-gray-600">{data.organization.name}</p>
            <p className="text-sm text-gray-500">yourapp.com/{data.organization.slug}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">First Project</h4>
            <p className="text-gray-600">{data.firstProject.name}</p>
            {data.firstProject.description && (
              <p className="text-sm text-gray-500">{data.firstProject.description}</p>
            )}
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Team Invitations</h4>
            {data.teamInvites.length > 0 ? (
              <ul className="text-gray-600">
                {data.teamInvites.map((invite, index) => (
                  <li key={index} className="text-sm">
                    {invite.email} - {invite.role}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No invitations sent</p>
            )}
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Subscription</h4>
            <p className="text-gray-600">
              {SUBSCRIPTION_PLANS.find(p => p.id === data.subscription.planId)?.name} - {data.subscription.billingCycle}
            </p>
          </div>
        </div>

        <Button
          onClick={onComplete}
          className="w-full mt-6"
          size="lg"
        >
          Complete Setup
        </Button>
      </Card>
    </div>
  );
};

// Main Wizard Component
export const OrganizationSetupWizard: React.FC<OrganizationSetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<OrganizationSetupStep>('organization_details');
  const [completedSteps, setCompletedSteps] = useState<OrganizationSetupStep[]>([]);
  const [setupData, setSetupData] = useState<Partial<OrganizationSetupData>>({
    teamInvites: []
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const steps: { step: OrganizationSetupStep; title: string; description: string }[] = [
    { step: 'organization_details', title: 'Organization', description: 'Basic information' },
    { step: 'first_project', title: 'First Project', description: 'Create project' },
    { step: 'team_invites', title: 'Team', description: 'Invite members' },
    { step: 'subscription', title: 'Plan', description: 'Choose subscription' },
    { step: 'complete', title: 'Complete', description: 'Finish setup' }
  ];

  const currentStepIndex = steps.findIndex(s => s.step === currentStep);

  const validateCurrentStep = useCallback((): boolean => {
    let validation: ValidationResult = { isValid: true, errors: {}, warnings: {} };

    switch (currentStep) {
      case 'organization_details':
        validation = validateOrganizationDetails(setupData);
        break;
      case 'first_project':
        validation = validateProjectDetails(setupData);
        break;
      case 'team_invites':
        validation = validateTeamInvites(setupData);
        break;
      case 'subscription':
        // Subscription step doesn't need validation - default is already set
        validation = { isValid: true, errors: {}, warnings: {} };
        break;
      default:
        break;
    }

    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);
    return validation.isValid;
  }, [currentStep, setupData]);

  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) return;

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].step);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
    }
  }, [currentStep, currentStepIndex, steps, completedSteps, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].step);
    }
  }, [currentStepIndex, steps]);

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      // Ensure we have all required data
      const completeData: OrganizationSetupData = {
        organization: setupData.organization!,
        firstProject: setupData.firstProject!,
        teamInvites: setupData.teamInvites || [],
        subscription: setupData.subscription || { planId: 'free', billingCycle: 'monthly' }
      };

      await onComplete(completeData);
    } catch (error) {
      console.error('Error completing setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canGoNext = currentStep !== 'complete' && validateCurrentStep();
  const canGoPrevious = currentStepIndex > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${index <= currentStepIndex 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {completedSteps.includes(step.step) ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-2 text-sm">
                  <div className="font-medium text-gray-900">{step.title}</div>
                  <div className="text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    index < currentStepIndex ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {currentStep === 'organization_details' && (
            <OrganizationDetailsStep
              data={setupData}
              onUpdate={setSetupData}
              errors={validationErrors}
            />
          )}
          
          {currentStep === 'first_project' && (
            <FirstProjectStep
              data={setupData}
              onUpdate={setSetupData}
              errors={validationErrors}
            />
          )}
          
          {currentStep === 'team_invites' && (
            <TeamInvitesStep
              data={setupData}
              onUpdate={setSetupData}
              errors={validationErrors}
              warnings={validationWarnings}
            />
          )}
          
          {currentStep === 'subscription' && (
            <SubscriptionStep
              data={setupData}
              onUpdate={setSetupData}
            />
          )}
          
          {currentStep === 'complete' && (
            <CompleteStep
              data={setupData as OrganizationSetupData}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* Navigation */}
        {currentStep !== 'complete' && (
          <div className="flex justify-between mt-8">
            <Button
              variant="secondary"
              onClick={goToPreviousStep}
              disabled={!canGoPrevious}
            >
              Previous
            </Button>
            
            <Button
              onClick={goToNextStep}
              disabled={!canGoNext}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrganizationSetupWizard;