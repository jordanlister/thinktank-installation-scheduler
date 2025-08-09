/**
 * Lead Route - ROI Calculator Form
 * Interactive calculator with real-time calculations and lead capture
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  Truck,
  Users,
  Building2,
  Download,
  Mail,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// UI Components
import { Input, Select } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

// Form schemas and utilities
import { 
  roiCalculatorSchema, 
  type ROICalculatorData,
  INDUSTRY_OPTIONS
} from '../../../lib/forms/schemas';
import { 
  submitForm, 
  trackFormEvent,
  type FormResponse 
} from '../../../lib/forms/utils';

interface ROICalculatorProps {
  onSuccess?: (data: ROICalculatorData & { calculations: ROIResults }) => void;
  className?: string;
  variant?: 'full' | 'embedded';
}

interface ROIResults {
  currentCosts: {
    monthlyFuelCosts: number;
    monthlyLaborCosts: number;
    totalMonthlyCosts: number;
    annualCosts: number;
  };
  savings: {
    timeReduction: number;
    fuelSavings: number;
    laborSavings: number;
    totalMonthlySavings: number;
    annualSavings: number;
  };
  roi: {
    paybackPeriod: number; // months
    roiPercentage: number;
    breakEvenPoint: string;
  };
  efficiency: {
    currentEfficiency: number;
    improvedEfficiency: number;
    improvementPercentage: number;
  };
}

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  showResults: boolean;
}

// Industry-specific improvement factors
const INDUSTRY_FACTORS = {
  hvac: { timeReduction: 0.35, efficiency: 0.28 },
  solar: { timeReduction: 0.30, efficiency: 0.25 },
  telecom: { timeReduction: 0.40, efficiency: 0.32 },
  security: { timeReduction: 0.25, efficiency: 0.22 },
  appliance: { timeReduction: 0.28, efficiency: 0.24 },
  electrical: { timeReduction: 0.32, efficiency: 0.27 },
  plumbing: { timeReduction: 0.30, efficiency: 0.26 },
  roofing: { timeReduction: 0.35, efficiency: 0.29 },
  internet: { timeReduction: 0.38, efficiency: 0.31 },
  other: { timeReduction: 0.30, efficiency: 0.25 }
};

// Platform costs (per technician per month)
const PLATFORM_COST_PER_TECH = 99;

export const ROICalculatorForm: React.FC<ROICalculatorProps> = ({
  onSuccess,
  className = '',
  variant = 'full'
}) => {
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    showResults: false
  });

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset
  } = useForm<ROICalculatorData>({
    resolver: zodResolver(roiCalculatorSchema),
    mode: 'onChange',
    defaultValues: {
      companyName: '',
      industry: undefined,
      monthlyInstallations: 100,
      averageTechnicians: 5,
      averageTravelTime: 45,
      fuelCostPerGallon: 4.50,
      averageWagePerHour: 35,
      email: '',
      phone: '',
      consent: false,
      _website: ''
    }
  });

  // Watch form values for real-time calculations
  const formValues = watch();

  // Track form start
  useEffect(() => {
    trackFormEvent('form_start', 'roi_calculator', { variant });
  }, [variant]);

  /**
   * Calculate ROI based on current form values
   */
  const roiCalculations = useMemo((): ROIResults | null => {
    const {
      industry,
      monthlyInstallations,
      averageTechnicians,
      averageTravelTime,
      fuelCostPerGallon,
      averageWagePerHour
    } = formValues;

    // Only calculate if required fields are present
    if (!industry || !monthlyInstallations || !averageTechnicians || 
        !averageTravelTime || !fuelCostPerGallon || !averageWagePerHour) {
      return null;
    }

    const factors = INDUSTRY_FACTORS[industry] || INDUSTRY_FACTORS.other;

    // Current costs calculation
    const dailyInstallations = monthlyInstallations / 22; // Assuming 22 working days
    const avgInstallationsPerTech = dailyInstallations / averageTechnicians;
    
    // Fuel costs (assuming 15 MPG and average 2x travel time for round trips)
    const milesPerInstallation = (averageTravelTime / 60) * 45; // 45 mph average
    const monthlyMiles = monthlyInstallations * milesPerInstallation;
    const monthlyGallons = monthlyMiles / 15; // 15 MPG average
    const monthlyFuelCosts = monthlyGallons * fuelCostPerGallon;

    // Labor costs (travel time)
    const monthlyTravelHours = (monthlyInstallations * averageTechnicians * averageTravelTime) / 60;
    const monthlyLaborCosts = monthlyTravelHours * averageWagePerHour;

    const totalMonthlyCosts = monthlyFuelCosts + monthlyLaborCosts;
    const annualCosts = totalMonthlyCosts * 12;

    // Savings calculation
    const timeReduction = factors.timeReduction;
    const fuelSavings = monthlyFuelCosts * timeReduction;
    const laborSavings = monthlyLaborCosts * timeReduction;
    const totalMonthlySavings = fuelSavings + laborSavings;
    const annualSavings = totalMonthlySavings * 12;

    // Platform cost
    const monthlyPlatformCost = averageTechnicians * PLATFORM_COST_PER_TECH;
    const netMonthlySavings = totalMonthlySavings - monthlyPlatformCost;
    const netAnnualSavings = netMonthlySavings * 12;

    // ROI calculation
    const paybackPeriod = monthlyPlatformCost / (netMonthlySavings > 0 ? netMonthlySavings : 1);
    const roiPercentage = ((netAnnualSavings / (monthlyPlatformCost * 12)) * 100);

    // Efficiency metrics
    const currentEfficiency = avgInstallationsPerTech;
    const improvedEfficiency = currentEfficiency * (1 + factors.efficiency);
    const improvementPercentage = factors.efficiency * 100;

    return {
      currentCosts: {
        monthlyFuelCosts,
        monthlyLaborCosts,
        totalMonthlyCosts,
        annualCosts
      },
      savings: {
        timeReduction: timeReduction * 100,
        fuelSavings,
        laborSavings,
        totalMonthlySavings: netMonthlySavings,
        annualSavings: netAnnualSavings
      },
      roi: {
        paybackPeriod,
        roiPercentage,
        breakEvenPoint: `${Math.ceil(paybackPeriod)} months`
      },
      efficiency: {
        currentEfficiency,
        improvedEfficiency,
        improvementPercentage
      }
    };
  }, [formValues]);

  /**
   * Handle form submission and results generation
   */
  const onSubmit = async (data: ROICalculatorData) => {
    if (formState.isSubmitting) return;

    // Show results immediately
    setFormState(prev => ({ ...prev, showResults: true }));

    // Track calculation completion
    trackFormEvent('roi_calculated', 'roi_calculator', {
      variant,
      industry: data.industry,
      monthly_installations: data.monthlyInstallations,
      team_size: data.averageTechnicians,
      has_email: !!data.email
    });

    // If email provided, submit the form
    if (data.email) {
      setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const submissionData = {
          ...data,
          calculations: roiCalculations
        };

        trackFormEvent('form_submit', 'roi_calculator', { variant });

        const response: FormResponse = await submitForm(submissionData, 'roi');

        if (response.ok) {
          setFormState(prev => ({ 
            ...prev, 
            isSubmitting: false, 
            isSuccess: true 
          }));

          trackFormEvent('form_success', 'roi_calculator', { variant });
          onSuccess?.(submissionData);

        } else {
          setFormState(prev => ({ 
            ...prev, 
            isSubmitting: false, 
            error: response.message 
          }));

          trackFormEvent('form_error', 'roi_calculator', { variant });
        }
      } catch (error) {
        console.error('ROI calculator submission error:', error);
        
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          error: 'Failed to save your results. You can still view them below.' 
        }));

        trackFormEvent('form_error', 'roi_calculator', { variant });
      }
    }
  };

  /**
   * Format currency values
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  /**
   * Format percentage values
   */
  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-brand-primary" />
          ROI Calculator
        </h2>
        <p className="text-text-secondary">
          Calculate the potential savings and ROI from implementing Lead Route's 
          field service optimization platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">
            Your Current Operations
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {formState.error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-error mt-0.5" />
                  <p className="text-error text-sm">{formState.error}</p>
                </div>
              </div>
            )}

            {/* Company Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-primary" />
                Company Information
              </h4>
              
              <Input
                label="Company Name (Optional)"
                {...register('companyName')}
                placeholder="Your company name"
                disabled={formState.isSubmitting}
              />
              
              <Select
                options={INDUSTRY_OPTIONS}
                placeholder="Select your industry"
                {...register('industry')}
                error={!!errors.industry}
              />
            </div>

            {/* Operations Data */}
            <div className="space-y-4">
              <h4 className="font-medium text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                Operations Data
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Monthly Installations"
                  type="number"
                  {...register('monthlyInstallations', { valueAsNumber: true })}
                  error={!!errors.monthlyInstallations}
                  errorMessage={errors.monthlyInstallations?.message}
                  min={1}
                  max={10000}
                />
                
                <Input
                  label="Number of Technicians"
                  type="number"
                  {...register('averageTechnicians', { valueAsNumber: true })}
                  error={!!errors.averageTechnicians}
                  errorMessage={errors.averageTechnicians?.message}
                  min={1}
                  max={1000}
                />
              </div>
              
              <Input
                label="Average Travel Time (minutes per job)"
                type="number"
                {...register('averageTravelTime', { valueAsNumber: true })}
                error={!!errors.averageTravelTime}
                errorMessage={errors.averageTravelTime?.message}
                min={5}
                max={480}
                helperText="One-way travel time to job sites"
              />
            </div>

            {/* Cost Data */}
            <div className="space-y-4">
              <h4 className="font-medium text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-primary" />
                Cost Information
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fuel Cost per Gallon"
                  type="number"
                  step="0.01"
                  {...register('fuelCostPerGallon', { valueAsNumber: true })}
                  error={!!errors.fuelCostPerGallon}
                  errorMessage={errors.fuelCostPerGallon?.message}
                  min={2}
                  max={10}
                />
                
                <Input
                  label="Average Hourly Wage"
                  type="number"
                  step="0.01"
                  {...register('averageWagePerHour', { valueAsNumber: true })}
                  error={!!errors.averageWagePerHour}
                  errorMessage={errors.averageWagePerHour?.message}
                  min={15}
                  max={200}
                />
              </div>
            </div>

            {/* Contact Information (Optional) */}
            <div className="space-y-4 border-t border-border pt-6">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary" />
                Get Detailed Results (Optional)
              </h4>
              <p className="text-sm text-text-muted">
                Provide your email to receive a detailed ROI report and schedule a consultation.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  errorMessage={errors.email?.message}
                  placeholder="your@email.com"
                  disabled={formState.isSubmitting}
                />
                
                <Input
                  label="Phone Number"
                  type="tel"
                  {...register('phone')}
                  error={!!errors.phone}
                  errorMessage={errors.phone?.message}
                  placeholder="(555) 123-4567"
                  disabled={formState.isSubmitting}
                />
              </div>
            </div>

            {/* Honeypot Field */}
            <input
              type="text"
              {...register('_website')}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!isValid}
            >
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate ROI
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Results Display */}
        <div className="space-y-6">
          {roiCalculations && formState.showResults ? (
            <>
              {/* Summary Card */}
              <Card className="p-6 bg-gradient-to-br from-brand-primary/10 to-success/10 border-brand-primary/20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Your ROI Results
                  </h3>
                  <div className="text-4xl font-bold text-brand-primary">
                    {formatCurrency(roiCalculations.savings.annualSavings)}
                  </div>
                  <div className="text-text-secondary">Annual Savings</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {formatPercentage(roiCalculations.roi.roiPercentage)}
                    </div>
                    <div className="text-sm text-text-muted">Annual ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-accent">
                      {roiCalculations.roi.breakEvenPoint}
                    </div>
                    <div className="text-sm text-text-muted">Payback Period</div>
                  </div>
                </div>
              </Card>

              {/* Detailed Breakdown */}
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Detailed Breakdown
                </h4>
                
                <div className="space-y-4">
                  {/* Current Costs */}
                  <div className="border border-border rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-error" />
                      Current Monthly Costs
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Fuel Costs:</span>
                        <span className="text-white">{formatCurrency(roiCalculations.currentCosts.monthlyFuelCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Travel Labor:</span>
                        <span className="text-white">{formatCurrency(roiCalculations.currentCosts.monthlyLaborCosts)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 font-medium">
                        <span className="text-white">Total:</span>
                        <span className="text-error">{formatCurrency(roiCalculations.currentCosts.totalMonthlyCosts)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="border border-success/20 rounded-lg p-4 bg-success/5">
                    <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      Monthly Savings with Lead Route
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Fuel Savings ({formatPercentage(roiCalculations.savings.timeReduction)}):</span>
                        <span className="text-success">+{formatCurrency(roiCalculations.savings.fuelSavings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Labor Savings:</span>
                        <span className="text-success">+{formatCurrency(roiCalculations.savings.laborSavings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Platform Cost:</span>
                        <span className="text-error">-{formatCurrency(formValues.averageTechnicians * PLATFORM_COST_PER_TECH)}</span>
                      </div>
                      <div className="flex justify-between border-t border-success/20 pt-2 font-medium">
                        <span className="text-white">Net Savings:</span>
                        <span className="text-success">{formatCurrency(roiCalculations.savings.totalMonthlySavings)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Efficiency Improvement */}
                  <div className="border border-brand-primary/20 rounded-lg p-4 bg-brand-primary/5">
                    <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-primary" />
                      Efficiency Improvements
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Current Efficiency:</span>
                        <span className="text-white">{roiCalculations.efficiency.currentEfficiency.toFixed(1)} jobs/tech/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">With Lead Route:</span>
                        <span className="text-brand-primary">{roiCalculations.efficiency.improvedEfficiency.toFixed(1)} jobs/tech/day</span>
                      </div>
                      <div className="flex justify-between border-t border-brand-primary/20 pt-2 font-medium">
                        <span className="text-white">Improvement:</span>
                        <span className="text-brand-primary">+{formatPercentage(roiCalculations.efficiency.improvementPercentage)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Success Message */}
              {formState.isSuccess && (
                <Card className="p-4 bg-success/10 border-success/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-success font-medium">Results saved!</p>
                      <p className="text-sm text-success/80">
                        A detailed ROI report has been sent to your email.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Call to Action */}
              <Card className="p-6 text-center">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Ready to achieve these savings?
                </h4>
                <p className="text-text-secondary mb-4">
                  Schedule a demo to see how Lead Route can transform your operations.
                </p>
                <Button variant="primary" size="lg" className="w-full">
                  Schedule Demo
                </Button>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center">
              <Calculator className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Calculate Your ROI
              </h3>
              <p className="text-text-secondary">
                Fill in your current operations data to see potential savings with Lead Route.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};