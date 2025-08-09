// Think Tank Technologies Installation Scheduler - Subscription Plans Configuration
import { 
  SubscriptionPlan, 
  SubscriptionPlanConfig, 
  SubscriptionLimits, 
  SubscriptionFeatures 
} from '../types';

// Base limits for Free plan
const FREE_LIMITS: SubscriptionLimits = {
  projects: 1,
  teamMembers: 5,
  installations: 100, // per month
  storageGB: 1,
  apiRequests: 1000, // per month
  webhookEndpoints: 0,
  customIntegrations: 0
};

// Enhanced limits for Professional plan
const PROFESSIONAL_LIMITS: SubscriptionLimits = {
  projects: 10,
  teamMembers: 25,
  installations: 2500, // per month
  storageGB: 10,
  apiRequests: 25000, // per month
  webhookEndpoints: 5,
  customIntegrations: 3
};

// Premium limits for Enterprise plan
const ENTERPRISE_LIMITS: SubscriptionLimits = {
  projects: -1, // unlimited
  teamMembers: -1, // unlimited
  installations: -1, // unlimited
  storageGB: 100,
  apiRequests: -1, // unlimited
  webhookEndpoints: -1, // unlimited
  customIntegrations: -1 // unlimited
};

// Free plan features
const FREE_FEATURES: SubscriptionFeatures = {
  analytics: false,
  advancedReporting: false,
  customBranding: false,
  apiAccess: false,
  webhookSupport: false,
  prioritySupport: false,
  customIntegrations: false,
  auditLogs: false,
  ssoIntegration: false,
  advancedSecurity: false,
  customFields: false,
  bulkOperations: false,
  exportData: true, // Basic export
  whiteLabeling: false,
  dedicatedSupport: false
};

// Professional plan features
const PROFESSIONAL_FEATURES: SubscriptionFeatures = {
  analytics: true,
  advancedReporting: true,
  customBranding: false,
  apiAccess: true,
  webhookSupport: true,
  prioritySupport: true,
  customIntegrations: true,
  auditLogs: true,
  ssoIntegration: false,
  advancedSecurity: true,
  customFields: true,
  bulkOperations: true,
  exportData: true,
  whiteLabeling: false,
  dedicatedSupport: false
};

// Enterprise plan features
const ENTERPRISE_FEATURES: SubscriptionFeatures = {
  analytics: true,
  advancedReporting: true,
  customBranding: true,
  apiAccess: true,
  webhookSupport: true,
  prioritySupport: true,
  customIntegrations: true,
  auditLogs: true,
  ssoIntegration: true,
  advancedSecurity: true,
  customFields: true,
  bulkOperations: true,
  exportData: true,
  whiteLabeling: true,
  dedicatedSupport: true
};

// Subscription plan configurations
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  [SubscriptionPlan.FREE]: {
    id: SubscriptionPlan.FREE,
    name: 'Free',
    description: 'Perfect for getting started with basic installation scheduling',
    price: {
      monthly: 0,
      yearly: 0
    },
    stripePriceId: {
      monthly: '', // No Stripe price for free plan
      yearly: ''
    },
    limits: FREE_LIMITS,
    features: FREE_FEATURES,
    isPopular: false,
    isCustom: false
  },
  
  [SubscriptionPlan.PROFESSIONAL]: {
    id: SubscriptionPlan.PROFESSIONAL,
    name: 'Professional',
    description: 'Advanced features for growing teams with enhanced scheduling capabilities',
    price: {
      monthly: 4900, // $49.00 in cents
      yearly: 52920 // $529.20 in cents (10% discount: $588 - $58.80)
    },
    stripePriceId: {
      monthly: process.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '',
      yearly: process.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || ''
    },
    limits: PROFESSIONAL_LIMITS,
    features: PROFESSIONAL_FEATURES,
    isPopular: true,
    isCustom: false
  },
  
  [SubscriptionPlan.ENTERPRISE]: {
    id: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise',
    description: 'Complete solution for large organizations with unlimited capabilities',
    price: {
      monthly: 19900, // $199.00 in cents
      yearly: 214920 // $2149.20 in cents (10% discount: $2388 - $238.80)
    },
    stripePriceId: {
      monthly: process.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
      yearly: process.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ''
    },
    limits: ENTERPRISE_LIMITS,
    features: ENTERPRISE_FEATURES,
    isPopular: false,
    isCustom: false
  }
};

// Helper functions for plan management
export const getPlanConfig = (planId: SubscriptionPlan): SubscriptionPlanConfig => {
  return SUBSCRIPTION_PLANS[planId];
};

export const getAllPlans = (): SubscriptionPlanConfig[] => {
  return Object.values(SUBSCRIPTION_PLANS);
};

export const getAvailableUpgrades = (currentPlan: SubscriptionPlan): SubscriptionPlanConfig[] => {
  const planOrder = [SubscriptionPlan.FREE, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.ENTERPRISE];
  const currentIndex = planOrder.indexOf(currentPlan);
  
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return [];
  }
  
  return planOrder
    .slice(currentIndex + 1)
    .map(planId => SUBSCRIPTION_PLANS[planId]);
};

export const getAvailableDowngrades = (currentPlan: SubscriptionPlan): SubscriptionPlanConfig[] => {
  const planOrder = [SubscriptionPlan.FREE, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.ENTERPRISE];
  const currentIndex = planOrder.indexOf(currentPlan);
  
  if (currentIndex === -1 || currentIndex === 0) {
    return [];
  }
  
  return planOrder
    .slice(0, currentIndex)
    .map(planId => SUBSCRIPTION_PLANS[planId]);
};

export const calculateYearlySavings = (plan: SubscriptionPlanConfig): number => {
  if (plan.price.monthly === 0 || plan.price.yearly === 0) {
    return 0;
  }
  
  const monthlyTotal = plan.price.monthly * 12;
  return monthlyTotal - plan.price.yearly;
};

export const calculateYearlySavingsPercentage = (plan: SubscriptionPlanConfig): number => {
  if (plan.price.monthly === 0 || plan.price.yearly === 0) {
    return 0;
  }
  
  const monthlyTotal = plan.price.monthly * 12;
  const savings = monthlyTotal - plan.price.yearly;
  return Math.round((savings / monthlyTotal) * 100);
};

export const formatPrice = (priceInCents: number, currency: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: priceInCents % 100 === 0 ? 0 : 2
  });
  
  return formatter.format(priceInCents / 100);
};

export const isFeatureEnabled = (plan: SubscriptionPlan, feature: keyof SubscriptionFeatures): boolean => {
  return SUBSCRIPTION_PLANS[plan].features[feature];
};

export const isWithinLimits = (
  plan: SubscriptionPlan, 
  resource: keyof SubscriptionLimits, 
  currentUsage: number
): boolean => {
  const limit = SUBSCRIPTION_PLANS[plan].limits[resource];
  
  // -1 means unlimited
  if (limit === -1) {
    return true;
  }
  
  return currentUsage < limit;
};

export const getRemainingQuota = (
  plan: SubscriptionPlan,
  resource: keyof SubscriptionLimits,
  currentUsage: number
): number => {
  const limit = SUBSCRIPTION_PLANS[plan].limits[resource];
  
  // -1 means unlimited
  if (limit === -1) {
    return -1;
  }
  
  return Math.max(0, limit - currentUsage);
};

export const getUsagePercentage = (
  plan: SubscriptionPlan,
  resource: keyof SubscriptionLimits,
  currentUsage: number
): number => {
  const limit = SUBSCRIPTION_PLANS[plan].limits[resource];
  
  // -1 means unlimited
  if (limit === -1) {
    return 0;
  }
  
  if (limit === 0) {
    return currentUsage > 0 ? 100 : 0;
  }
  
  return Math.min(100, (currentUsage / limit) * 100);
};

// Plan comparison utilities
export const compareFeatures = (
  plan1: SubscriptionPlan,
  plan2: SubscriptionPlan
): Array<{
  feature: keyof SubscriptionFeatures;
  plan1HasFeature: boolean;
  plan2HasFeature: boolean;
  featureName: string;
}> => {
  const featureNames: Record<keyof SubscriptionFeatures, string> = {
    analytics: 'Advanced Analytics',
    advancedReporting: 'Advanced Reporting',
    customBranding: 'Custom Branding',
    apiAccess: 'API Access',
    webhookSupport: 'Webhook Support',
    prioritySupport: 'Priority Support',
    customIntegrations: 'Custom Integrations',
    auditLogs: 'Audit Logs',
    ssoIntegration: 'SSO Integration',
    advancedSecurity: 'Advanced Security',
    customFields: 'Custom Fields',
    bulkOperations: 'Bulk Operations',
    exportData: 'Data Export',
    whiteLabeling: 'White Labeling',
    dedicatedSupport: 'Dedicated Support'
  };
  
  const config1 = SUBSCRIPTION_PLANS[plan1];
  const config2 = SUBSCRIPTION_PLANS[plan2];
  
  return Object.keys(featureNames).map(feature => ({
    feature: feature as keyof SubscriptionFeatures,
    plan1HasFeature: config1.features[feature as keyof SubscriptionFeatures],
    plan2HasFeature: config2.features[feature as keyof SubscriptionFeatures],
    featureName: featureNames[feature as keyof SubscriptionFeatures]
  }));
};

// Trial and promotional utilities
export const DEFAULT_TRIAL_DAYS = 14;

export const isTrialEligible = (organizationCreatedAt: string): boolean => {
  const createdDate = new Date(organizationCreatedAt);
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Allow trial within 7 days of organization creation
  return daysSinceCreation <= 7;
};

export const calculateTrialEndDate = (startDate?: Date): Date => {
  const start = startDate || new Date();
  const trialEnd = new Date(start);
  trialEnd.setDate(trialEnd.getDate() + DEFAULT_TRIAL_DAYS);
  return trialEnd;
};