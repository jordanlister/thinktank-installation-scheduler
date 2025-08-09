/**
 * Lead Route - Demo Request Form
 * Multi-step form for qualified lead capture with progressive disclosure
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Building2,
  Users,
  Target,
  Clock,
  DollarSign,
  Globe
} from 'lucide-react';

// UI Components
import { Input, Select, Checkbox, RadioGroup } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

// Form schemas and utilities
import { 
  demoFormSchema, 
  type DemoFormData,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  CHALLENGE_OPTIONS
} from '../../../lib/forms/schemas';
import { 
  submitForm, 
  trackFormEvent, 
  useFormAutoSave, 
  restoreFormData, 
  clearFormData,
  type FormResponse 
} from '../../../lib/forms/utils';

interface DemoRequestFormProps {
  onSuccess?: (data: DemoFormData) => void;
  className?: string;
  variant?: 'full' | 'modal';
}

interface FormState {
  currentStep: number;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  progress: number;
}

const STEPS = [
  {
    id: 'personal',
    title: 'Your Information',
    description: 'Tell us about yourself',
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 'company',
    title: 'Company Details',
    description: 'About your organization',
    icon: <Building2 className="w-5 h-5" />
  },
  {
    id: 'requirements',
    title: 'Requirements',
    description: 'Your specific needs',
    icon: <Target className="w-5 h-5" />
  },
  {
    id: 'timeline',
    title: 'Timeline & Budget',
    description: 'Implementation details',
    icon: <Clock className="w-5 h-5" />
  }
];

export const DemoRequestForm: React.FC<DemoRequestFormProps> = ({
  onSuccess,
  className = '',
  variant = 'full'
}) => {
  // Form state management
  const [formState, setFormState] = useState<FormState>({
    currentStep: 0,
    isSubmitting: false,
    isSuccess: false,
    error: null,
    progress: 0
  });

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
    reset,
    setValue,
    getValues
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      industry: undefined,
      teamSize: undefined,
      currentSolution: '',
      challenges: [],
      timeline: undefined,
      budget: undefined,
      website: '',
      consent: false,
      marketing: false,
      _website: ''
    }
  });

  // Watch form values for auto-save and step validation
  const formValues = watch();

  // Auto-save functionality
  useFormAutoSave('demo', formValues, {
    enabled: true,
    debounceMs: 1500
  });

  // Restore saved data on component mount
  useEffect(() => {
    const savedData = restoreFormData('demo');
    if (savedData) {
      Object.entries(savedData).forEach(([key, value]) => {
        setValue(key as keyof DemoFormData, value);
      });
    }
  }, [setValue]);

  // Track form start
  useEffect(() => {
    trackFormEvent('form_start', 'demo', { variant });
  }, [variant]);

  /**
   * Validates current step fields
   */
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepFields = getStepFields(formState.currentStep);
    const result = await trigger(stepFields);
    return result;
  };

  /**
   * Gets fields for current step
   */
  const getStepFields = (step: number): (keyof DemoFormData)[] => {
    switch (step) {
      case 0: // Personal Info
        return ['firstName', 'lastName', 'email', 'phone'];
      case 1: // Company Info
        return ['company', 'jobTitle', 'industry', 'teamSize'];
      case 2: // Requirements
        return ['challenges'];
      case 3: // Timeline
        return ['timeline'];
      default:
        return [];
    }
  };

  /**
   * Navigate to next step
   */
  const nextStep = async () => {
    const isStepValid = await validateCurrentStep();
    if (isStepValid && formState.currentStep < STEPS.length - 1) {
      setFormState(prev => ({ 
        ...prev, 
        currentStep: prev.currentStep + 1 
      }));
      
      trackFormEvent('form_progress', 'demo', {
        step: formState.currentStep + 1,
        step_name: STEPS[formState.currentStep + 1].id
      });
    }
  };

  /**
   * Navigate to previous step
   */
  const prevStep = () => {
    if (formState.currentStep > 0) {
      setFormState(prev => ({ 
        ...prev, 
        currentStep: prev.currentStep - 1 
      }));
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: DemoFormData) => {
    if (formState.isSubmitting) return;

    setFormState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      error: null, 
      progress: 0 
    }));

    try {
      trackFormEvent('form_submit', 'demo', {
        variant,
        industry: data.industry,
        team_size: data.teamSize,
        has_current_solution: !!data.currentSolution,
        challenges_count: data.challenges.length,
        timeline: data.timeline
      });

      const response: FormResponse = await submitForm(data, 'demo', {
        onProgress: (progress) => {
          setFormState(prev => ({ ...prev, progress }));
        }
      });

      if (response.ok) {
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          isSuccess: true,
          progress: 100 
        }));

        trackFormEvent('form_success', 'demo', { variant });
        clearFormData('demo');
        onSuccess?.(data);

      } else {
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          error: response.message,
          progress: 0 
        }));

        trackFormEvent('form_error', 'demo', {
          variant,
          error_type: 'submission_failed'
        });
      }
    } catch (error) {
      console.error('Demo form submission error:', error);
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: 'An unexpected error occurred. Please try again.',
        progress: 0 
      }));

      trackFormEvent('form_error', 'demo', {
        variant,
        error_type: 'exception'
      });
    }
  };

  // Success state
  if (formState.isSuccess) {
    return (
      <Card className={`p-8 bg-success/10 border-success/20 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-success mb-4">
            Demo Request Submitted!
          </h3>
          <p className="text-text-secondary mb-6">
            Thank you for your interest in Lead Route. 
            Our team will contact you within 24 hours to schedule your personalized demo.
          </p>
          <div className="bg-surface/50 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-white mb-2">What's next?</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Our solution specialist will review your requirements
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                We'll prepare a customized demo for your industry
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                You'll receive a calendar link to book your preferred time
              </li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Request a Personalized Demo
        </h2>
        <p className="text-text-secondary">
          See how Lead Route can transform your field service operations. 
          This takes just 3 minutes.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index === formState.currentStep
                  ? 'text-brand-primary'
                  : index < formState.currentStep
                  ? 'text-success'
                  : 'text-text-muted'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  index === formState.currentStep
                    ? 'bg-brand-primary text-white'
                    : index < formState.currentStep
                    ? 'bg-success text-white'
                    : 'bg-surface border border-border'
                }`}
              >
                {index < formState.currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="hidden md:block">
                <div className="font-medium">{step.title}</div>
                <div className="text-xs">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-surface rounded-full h-2">
          <div 
            className="bg-brand-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((formState.currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Message */}
        {formState.error && (
          <Card className="p-4 bg-error/10 border-error/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error mt-0.5" />
              <div>
                <p className="text-error font-medium">Submission Failed</p>
                <p className="text-sm text-error/80 mt-1">{formState.error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Submission Progress */}
        {formState.isSubmitting && (
          <div className="w-full bg-surface rounded-full h-2">
            <div 
              className="bg-brand-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${formState.progress}%` }}
            />
          </div>
        )}

        {/* Step 1: Personal Information */}
        {formState.currentStep === 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-primary" />
              Your Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                {...register('firstName')}
                error={!!errors.firstName}
                errorMessage={errors.firstName?.message}
                required
                maxLength={50}
              />
              
              <Input
                label="Last Name"
                {...register('lastName')}
                error={!!errors.lastName}
                errorMessage={errors.lastName?.message}
                required
                maxLength={50}
              />
              
              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={!!errors.email}
                errorMessage={errors.email?.message}
                required
                maxLength={254}
              />
              
              <Input
                label="Phone Number"
                type="tel"
                {...register('phone')}
                error={!!errors.phone}
                errorMessage={errors.phone?.message}
                maxLength={20}
                helperText="For scheduling your demo call"
              />
            </div>
          </Card>
        )}

        {/* Step 2: Company Information */}
        {formState.currentStep === 1 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-primary" />
              Company Details
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Company Name"
                  {...register('company')}
                  error={!!errors.company}
                  errorMessage={errors.company?.message}
                  required
                  maxLength={100}
                />
                
                <Input
                  label="Job Title"
                  {...register('jobTitle')}
                  error={!!errors.jobTitle}
                  errorMessage={errors.jobTitle?.message}
                  required
                  maxLength={100}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  options={INDUSTRY_OPTIONS}
                  placeholder="Select your industry"
                  {...register('industry')}
                  error={!!errors.industry}
                />
                
                <Select
                  options={TEAM_SIZE_OPTIONS}
                  placeholder="Select team size"
                  {...register('teamSize')}
                  error={!!errors.teamSize}
                />
              </div>
              
              <Input
                label="Company Website"
                type="url"
                {...register('website')}
                error={!!errors.website}
                errorMessage={errors.website?.message}
                placeholder="https://www.yourcompany.com"
                helperText="Optional - helps us understand your business"
              />
            </div>
          </Card>
        )}

        {/* Step 3: Requirements */}
        {formState.currentStep === 2 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-primary" />
              Your Requirements
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-4">
                  What challenges are you facing? (Select all that apply) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CHALLENGE_OPTIONS.map((challenge) => (
                    <Checkbox
                      key={challenge.value}
                      {...register('challenges')}
                      value={challenge.value}
                      label={challenge.label}
                    />
                  ))}
                </div>
                {errors.challenges && (
                  <p className="text-error text-sm mt-2">{errors.challenges.message}</p>
                )}
              </div>
              
              <Input
                label="Current Solution"
                {...register('currentSolution')}
                error={!!errors.currentSolution}
                errorMessage={errors.currentSolution?.message}
                placeholder="What tools/software do you currently use?"
                helperText="Optional - helps us understand your current setup"
                maxLength={500}
              />
            </div>
          </Card>
        )}

        {/* Step 4: Timeline & Budget */}
        {formState.currentStep === 3 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              Timeline & Budget
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Implementation Timeline *
                </label>
                <RadioGroup
                  {...register('timeline')}
                  name="timeline"
                  options={[
                    { value: 'immediate', label: 'Immediate (within 1 month)' },
                    { value: 'within-month', label: 'Within 1-3 months' },
                    { value: 'within-quarter', label: 'Within 3-6 months' },
                    { value: 'exploring', label: 'Just exploring options' }
                  ]}
                  error={!!errors.timeline}
                  errorMessage={errors.timeline?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Budget Range (Optional)
                </label>
                <RadioGroup
                  {...register('budget')}
                  name="budget"
                  options={[
                    { value: 'under-10k', label: 'Under $10,000' },
                    { value: '10k-25k', label: '$10,000 - $25,000' },
                    { value: '25k-50k', label: '$25,000 - $50,000' },
                    { value: '50k-100k', label: '$50,000 - $100,000' },
                    { value: '100k+', label: '$100,000+' }
                  ]}
                />
              </div>
              
              {/* Consent Checkboxes */}
              <div className="border-t border-border pt-6 space-y-4">
                <Checkbox
                  {...register('consent')}
                  error={!!errors.consent}
                  errorMessage={errors.consent?.message}
                  label="I agree to the Privacy Policy and consent to Lead Route contacting me about their services."
                  required
                />
                
                <Checkbox
                  {...register('marketing')}
                  label="I'd like to receive updates about new features and industry insights."
                />
              </div>
            </div>
          </Card>
        )}

        {/* Honeypot Field */}
        <input
          type="text"
          {...register('_website')}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={prevStep}
            disabled={formState.currentStep === 0}
            className={formState.currentStep === 0 ? 'invisible' : ''}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {formState.currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={formState.isSubmitting || !isValid}
              className="min-w-[200px]"
            >
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Demo
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};