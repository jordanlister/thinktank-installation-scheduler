/**
 * Think Tank Technologies - Enterprise Contact Form
 * Comprehensive form for high-value lead qualification with detailed requirements gathering
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Building2, 
  Users, 
  Target, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Star,
  Calendar,
  DollarSign,
  Zap,
  Award,
  ArrowRight
} from 'lucide-react';

// UI Components
import { Input, Select, Checkbox, RadioGroup, Textarea } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

// Form schemas and utilities
import { 
  enterpriseFormSchema, 
  type EnterpriseFormData,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  REVENUE_OPTIONS,
  INTEGRATION_OPTIONS,
  EVALUATION_CRITERIA
} from '../../../lib/forms/schemas';
import { 
  submitForm, 
  trackFormEvent, 
  useFormAutoSave, 
  restoreFormData, 
  clearFormData,
  type FormResponse 
} from '../../../lib/forms/utils';

interface EnterpriseContactFormProps {
  onSuccess?: (data: EnterpriseFormData) => void;
  className?: string;
  priority?: 'high' | 'critical';
}

interface FormState {
  currentSection: number;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  progress: number;
}

const FORM_SECTIONS = [
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Your details for our enterprise team',
    icon: <Users className="w-5 h-5" />,
    weight: 20
  },
  {
    id: 'company',
    title: 'Company Overview',
    description: 'About your organization',
    icon: <Building2 className="w-5 h-5" />,
    weight: 25
  },
  {
    id: 'requirements',
    title: 'Technical Requirements',
    description: 'Your specific needs and integrations',
    icon: <Settings className="w-5 h-5" />,
    weight: 30
  },
  {
    id: 'decision',
    title: 'Decision Process',
    description: 'Timeline and evaluation criteria',
    icon: <Target className="w-5 h-5" />,
    weight: 25
  }
];

export const EnterpriseContactForm: React.FC<EnterpriseContactFormProps> = ({
  onSuccess,
  className = '',
  priority = 'high'
}) => {
  const [formState, setFormState] = useState<FormState>({
    currentSection: 0,
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
  } = useForm<EnterpriseFormData>({
    resolver: zodResolver(enterpriseFormSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      website: '',
      industry: undefined,
      teamSize: undefined,
      annualRevenue: undefined,
      currentSoftware: '',
      specificRequirements: '',
      integrationNeeds: [],
      deploymentTimeline: undefined,
      decisionMaker: undefined,
      evaluationCriteria: [],
      budget: undefined,
      additionalNotes: '',
      consent: false,
      marketing: false,
      _website: ''
    }
  });

  // Watch form values for auto-save
  const formValues = watch();

  // Auto-save functionality
  useFormAutoSave('enterprise', formValues, {
    enabled: true,
    debounceMs: 2000
  });

  // Restore saved data on component mount
  useEffect(() => {
    const savedData = restoreFormData('enterprise');
    if (savedData) {
      Object.entries(savedData).forEach(([key, value]) => {
        setValue(key as keyof EnterpriseFormData, value);
      });
    }
  }, [setValue]);

  // Track form start
  useEffect(() => {
    trackFormEvent('form_start', 'enterprise', { priority });
  }, [priority]);

  /**
   * Calculate current form completion progress
   */
  const calculateProgress = (): number => {
    let totalWeight = 0;
    let completedWeight = 0;

    FORM_SECTIONS.forEach((section, index) => {
      totalWeight += section.weight;
      if (index < formState.currentSection) {
        completedWeight += section.weight;
      } else if (index === formState.currentSection) {
        const sectionFields = getSectionFields(index);
        const currentValues = getValues();
        const completedFields = sectionFields.filter(field => {
          const value = currentValues[field];
          return value && (Array.isArray(value) ? value.length > 0 : true);
        }).length;
        const sectionProgress = completedFields / sectionFields.length;
        completedWeight += section.weight * sectionProgress;
      }
    });

    return Math.round((completedWeight / totalWeight) * 100);
  };

  /**
   * Gets fields for current section
   */
  const getSectionFields = (section: number): (keyof EnterpriseFormData)[] => {
    switch (section) {
      case 0: // Contact
        return ['firstName', 'lastName', 'email', 'phone'];
      case 1: // Company
        return ['company', 'jobTitle', 'website', 'industry', 'teamSize', 'annualRevenue'];
      case 2: // Requirements
        return ['currentSoftware', 'specificRequirements', 'integrationNeeds'];
      case 3: // Decision
        return ['deploymentTimeline', 'decisionMaker', 'evaluationCriteria', 'budget'];
      default:
        return [];
    }
  };

  /**
   * Validates current section fields
   */
  const validateCurrentSection = async (): Promise<boolean> => {
    const sectionFields = getSectionFields(formState.currentSection);
    const result = await trigger(sectionFields);
    return result;
  };

  /**
   * Navigate to next section
   */
  const nextSection = async () => {
    const isValid = await validateCurrentSection();
    if (isValid && formState.currentSection < FORM_SECTIONS.length - 1) {
      setFormState(prev => ({ 
        ...prev, 
        currentSection: prev.currentSection + 1 
      }));
      
      trackFormEvent('enterprise_section_completed', 'enterprise', {
        section: formState.currentSection,
        section_name: FORM_SECTIONS[formState.currentSection].id
      });
    }
  };

  /**
   * Navigate to previous section
   */
  const prevSection = () => {
    if (formState.currentSection > 0) {
      setFormState(prev => ({ 
        ...prev, 
        currentSection: prev.currentSection - 1 
      }));
    }
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: EnterpriseFormData) => {
    if (formState.isSubmitting) return;

    setFormState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      error: null, 
      progress: 0 
    }));

    try {
      trackFormEvent('form_submit', 'enterprise', {
        priority,
        industry: data.industry,
        team_size: data.teamSize,
        revenue: data.annualRevenue,
        decision_maker: data.decisionMaker,
        timeline: data.deploymentTimeline,
        evaluation_criteria_count: data.evaluationCriteria.length,
        integration_needs_count: data.integrationNeeds?.length || 0
      });

      const response: FormResponse = await submitForm(data, 'enterprise', {
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

        trackFormEvent('form_success', 'enterprise', { priority });
        clearFormData('enterprise');
        onSuccess?.(data);

      } else {
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          error: response.message,
          progress: 0 
        }));

        trackFormEvent('form_error', 'enterprise', { priority });
      }
    } catch (error) {
      console.error('Enterprise form submission error:', error);
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: 'An unexpected error occurred. Please try again.',
        progress: 0 
      }));

      trackFormEvent('form_error', 'enterprise', { priority });
    }
  };

  // Success state
  if (formState.isSuccess) {
    return (
      <Card className={`p-8 bg-success/10 border-success/20 ${className}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-success" />
          </div>
          <h3 className="text-2xl font-semibold text-success mb-4">
            Enterprise Inquiry Submitted!
          </h3>
          <p className="text-text-secondary mb-6">
            Thank you for your interest in Think Tank Technologies Enterprise. 
            Our dedicated enterprise team will contact you within 24 hours.
          </p>
          
          <div className="bg-surface/50 rounded-lg p-6 text-left">
            <h4 className="font-semibold text-white mb-4">What happens next?</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <div className="font-medium text-white">Enterprise Solution Review</div>
                  <div className="text-sm text-text-muted">Our enterprise architects will analyze your requirements</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <div className="font-medium text-white">Custom Proposal</div>
                  <div className="text-sm text-text-muted">Receive a tailored solution proposal within 48 hours</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <div className="font-medium text-white">Executive Demo</div>
                  <div className="text-sm text-text-muted">Personalized demo with our technical leadership team</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const currentProgress = calculateProgress();

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-6 h-6 text-warning" />
          <span className="text-warning font-medium">Enterprise Solution</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Enterprise Contact
        </h2>
        <p className="text-text-secondary">
          Tell us about your enterprise requirements and our dedicated team will create 
          a custom solution proposal for your organization.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {FORM_SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-center ${
                index === formState.currentSection
                  ? 'text-brand-primary'
                  : index < formState.currentSection
                  ? 'text-success'
                  : 'text-text-muted'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  index === formState.currentSection
                    ? 'bg-brand-primary text-white'
                    : index < formState.currentSection
                    ? 'bg-success text-white'
                    : 'bg-surface border border-border'
                }`}
              >
                {index < formState.currentSection ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <div className="hidden md:block text-sm">
                <div className="font-medium">{section.title}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="w-full bg-surface rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-brand-primary to-success h-3 rounded-full transition-all duration-500"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
        <div className="text-right text-sm text-text-muted mt-1">
          {currentProgress}% Complete
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

        {/* Section 1: Contact Information */}
        {formState.currentSection === 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-primary" />
              Contact Information
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
                required
                maxLength={20}
              />
            </div>
          </Card>
        )}

        {/* Section 2: Company Overview */}
        {formState.currentSection === 1 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-primary" />
              Company Overview
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
              
              <Input
                label="Company Website"
                type="url"
                {...register('website')}
                error={!!errors.website}
                errorMessage={errors.website?.message}
                placeholder="https://www.yourcompany.com"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  options={INDUSTRY_OPTIONS}
                  placeholder="Select industry"
                  {...register('industry')}
                  error={!!errors.industry}
                />
                
                <Select
                  options={TEAM_SIZE_OPTIONS}
                  placeholder="Team size"
                  {...register('teamSize')}
                  error={!!errors.teamSize}
                />
                
                <Select
                  options={REVENUE_OPTIONS}
                  placeholder="Annual revenue"
                  {...register('annualRevenue')}
                  error={!!errors.annualRevenue}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Section 3: Technical Requirements */}
        {formState.currentSection === 2 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-primary" />
              Technical Requirements
            </h3>
            
            <div className="space-y-6">
              <Textarea
                label="Current Software Solutions"
                {...register('currentSoftware')}
                error={!!errors.currentSoftware}
                errorMessage={errors.currentSoftware?.message}
                placeholder="Describe your current field service management tools and systems..."
                maxLength={500}
                rows={3}
              />
              
              <Textarea
                label="Specific Requirements"
                {...register('specificRequirements')}
                error={!!errors.specificRequirements}
                errorMessage={errors.specificRequirements?.message}
                placeholder="What specific features or capabilities are you looking for?"
                maxLength={1000}
                rows={4}
              />
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-4">
                  Integration Requirements (Select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {INTEGRATION_OPTIONS.map((integration) => (
                    <Checkbox
                      key={integration.value}
                      {...register('integrationNeeds')}
                      value={integration.value}
                      label={integration.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Section 4: Decision Process */}
        {formState.currentSection === 3 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-primary" />
              Decision Process
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Deployment Timeline *
                </label>
                <RadioGroup
                  {...register('deploymentTimeline')}
                  name="deploymentTimeline"
                  options={[
                    { value: 'asap', label: 'ASAP (Immediate need)' },
                    { value: 'within-month', label: 'Within 1 month' },
                    { value: 'within-quarter', label: 'Within 3 months' },
                    { value: 'within-year', label: 'Within 6-12 months' },
                    { value: 'exploring', label: 'Exploring options (12+ months)' }
                  ]}
                  error={!!errors.deploymentTimeline}
                  errorMessage={errors.deploymentTimeline?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Decision Making Authority *
                </label>
                <RadioGroup
                  {...register('decisionMaker')}
                  name="decisionMaker"
                  options={[
                    { value: 'yes', label: 'I am the decision maker' },
                    { value: 'influence', label: 'I influence the decision' },
                    { value: 'no', label: 'I am gathering information for others' }
                  ]}
                  error={!!errors.decisionMaker}
                  errorMessage={errors.decisionMaker?.message}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-4">
                  Key Evaluation Criteria (Select all that apply) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EVALUATION_CRITERIA.map((criteria) => (
                    <Checkbox
                      key={criteria.value}
                      {...register('evaluationCriteria')}
                      value={criteria.value}
                      label={criteria.label}
                    />
                  ))}
                </div>
                {errors.evaluationCriteria && (
                  <p className="text-error text-sm mt-2">{errors.evaluationCriteria.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Budget Range (Optional)
                </label>
                <RadioGroup
                  {...register('budget')}
                  name="budget"
                  options={[
                    { value: 'under-50k', label: 'Under $50,000' },
                    { value: '50k-100k', label: '$50,000 - $100,000' },
                    { value: '100k-250k', label: '$100,000 - $250,000' },
                    { value: '250k-500k', label: '$250,000 - $500,000' },
                    { value: '500k+', label: '$500,000+' }
                  ]}
                />
              </div>
              
              <Textarea
                label="Additional Notes"
                {...register('additionalNotes')}
                error={!!errors.additionalNotes}
                errorMessage={errors.additionalNotes?.message}
                placeholder="Any additional information that would help us understand your needs..."
                maxLength={2000}
                rows={3}
              />
              
              {/* Consent Checkboxes */}
              <div className="border-t border-border pt-6 space-y-4">
                <Checkbox
                  {...register('consent')}
                  error={!!errors.consent}
                  errorMessage={errors.consent?.message}
                  label="I agree to the Privacy Policy and consent to Think Tank Technologies contacting me about enterprise solutions."
                  required
                />
                
                <Checkbox
                  {...register('marketing')}
                  label="I'd like to receive updates about enterprise features and industry insights."
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

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={prevSection}
            disabled={formState.currentSection === 0}
            className={formState.currentSection === 0 ? 'invisible' : ''}
          >
            Previous
          </Button>

          <div className="text-center">
            <div className="text-sm text-text-muted">
              Step {formState.currentSection + 1} of {FORM_SECTIONS.length}
            </div>
          </div>

          {formState.currentSection < FORM_SECTIONS.length - 1 ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextSection}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
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
                  <Star className="w-4 h-4 mr-2" />
                  Submit Enterprise Inquiry
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};