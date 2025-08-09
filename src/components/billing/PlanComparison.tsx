// Think Tank Technologies Installation Scheduler - Plan Comparison Component
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography
} from '../ui';
import {
  SubscriptionPlan,
  SubscriptionPlanConfig,
  BillingCycle,
  Subscription
} from '../../types';
import {
  SUBSCRIPTION_PLANS,
  getAllPlans,
  formatPrice,
  calculateYearlySavings,
  calculateYearlySavingsPercentage
} from '../../config/subscriptionPlans';
import {
  Check,
  X,
  Star,
  Zap,
  Shield,
  Users,
  FolderOpen,
  Wrench,
  BarChart3,
  Settings,
  Crown,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface PlanComparisonProps {
  currentPlan?: SubscriptionPlan;
  currentSubscription?: Subscription;
  selectedCycle?: BillingCycle;
  onPlanSelect: (planId: SubscriptionPlan, cycle: BillingCycle) => void;
  showCurrentPlanBadge?: boolean;
  highlightUpgrades?: boolean;
  className?: string;
}

interface PlanFeatureProps {
  feature: string;
  included: boolean;
  highlight?: boolean;
}

const PlanFeature: React.FC<PlanFeatureProps> = ({ feature, included, highlight = false }) => (
  <div className={`flex items-center gap-3 py-2 ${highlight ? 'bg-blue-50 px-3 rounded-md' : ''}`}>
    {included ? (
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
    ) : (
      <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
    )}
    <Typography 
      variant="body2" 
      className={`${included ? 'text-gray-900' : 'text-gray-500'} ${highlight ? 'font-medium' : ''}`}
    >
      {feature}
    </Typography>
  </div>
);

const getPlanIcon = (planId: SubscriptionPlan) => {
  switch (planId) {
    case SubscriptionPlan.FREE:
      return Star;
    case SubscriptionPlan.PROFESSIONAL:
      return Zap;
    case SubscriptionPlan.ENTERPRISE:
      return Crown;
    default:
      return Settings;
  }
};

const getPlanColor = (planId: SubscriptionPlan) => {
  switch (planId) {
    case SubscriptionPlan.FREE:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        accent: 'text-gray-600',
        button: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      };
    case SubscriptionPlan.PROFESSIONAL:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        accent: 'text-blue-600',
        button: 'bg-blue-600 text-white hover:bg-blue-700'
      };
    case SubscriptionPlan.ENTERPRISE:
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        accent: 'text-purple-600',
        button: 'bg-purple-600 text-white hover:bg-purple-700'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        accent: 'text-gray-600',
        button: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      };
  }
};

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  currentPlan = SubscriptionPlan.FREE,
  currentSubscription,
  selectedCycle = BillingCycle.MONTHLY,
  onPlanSelect,
  showCurrentPlanBadge = true,
  highlightUpgrades = true,
  className = ''
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(selectedCycle);
  const plans = getAllPlans();

  const isCurrentPlan = (planId: SubscriptionPlan) => {
    return currentPlan === planId;
  };

  const isUpgrade = (planId: SubscriptionPlan) => {
    const planOrder = [SubscriptionPlan.FREE, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.ENTERPRISE];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(planId);
    return targetIndex > currentIndex;
  };

  const isDowngrade = (planId: SubscriptionPlan) => {
    const planOrder = [SubscriptionPlan.FREE, SubscriptionPlan.PROFESSIONAL, SubscriptionPlan.ENTERPRISE];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(planId);
    return targetIndex < currentIndex;
  };

  const getPlanFeatures = (plan: SubscriptionPlanConfig) => {
    const baseFeatures = [
      {
        name: `${plan.limits.projects === -1 ? 'Unlimited' : plan.limits.projects} ${plan.limits.projects === 1 ? 'Project' : 'Projects'}`,
        included: true,
        icon: FolderOpen
      },
      {
        name: `${plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers} Team ${plan.limits.teamMembers === 1 ? 'Member' : 'Members'}`,
        included: true,
        icon: Users
      },
      {
        name: `${plan.limits.installations === -1 ? 'Unlimited' : plan.limits.installations.toLocaleString()} Monthly Installations`,
        included: true,
        icon: Wrench
      },
      {
        name: `${plan.limits.storageGB === -1 ? 'Unlimited' : plan.limits.storageGB} GB Storage`,
        included: true,
        icon: Shield
      }
    ];

    const advancedFeatures = [
      { name: 'Advanced Analytics', included: plan.features.analytics, icon: BarChart3 },
      { name: 'Advanced Reporting', included: plan.features.advancedReporting, icon: BarChart3 },
      { name: 'API Access', included: plan.features.apiAccess, icon: Settings },
      { name: 'Webhook Support', included: plan.features.webhookSupport, icon: Settings },
      { name: 'Priority Support', included: plan.features.prioritySupport, icon: Shield },
      { name: 'Custom Integrations', included: plan.features.customIntegrations, icon: Settings },
      { name: 'SSO Integration', included: plan.features.ssoIntegration, icon: Shield },
      { name: 'Custom Branding', included: plan.features.customBranding, icon: Settings },
      { name: 'White Labeling', included: plan.features.whiteLabeling, icon: Settings },
      { name: 'Dedicated Support', included: plan.features.dedicatedSupport, icon: Shield }
    ];

    return [...baseFeatures, ...advancedFeatures];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setBillingCycle(BillingCycle.MONTHLY)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === BillingCycle.MONTHLY
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle(BillingCycle.YEARLY)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingCycle === BillingCycle.YEARLY
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded text-[10px]">
              Save 10%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.id);
          const colors = getPlanColor(plan.id);
          const features = getPlanFeatures(plan);
          const price = billingCycle === BillingCycle.YEARLY ? plan.price.yearly : plan.price.monthly;
          const savings = billingCycle === BillingCycle.YEARLY ? calculateYearlySavings(plan) : 0;
          
          return (
            <Card
              key={plan.id}
              className={`relative p-6 ${
                isCurrentPlan(plan.id) 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : plan.isPopular 
                  ? 'ring-2 ring-blue-200 shadow-lg' 
                  : 'shadow-sm hover:shadow-md'
              } transition-shadow`}
            >
              {/* Popular Badge */}
              {plan.isPopular && !isCurrentPlan(plan.id) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan(plan.id) && showCurrentPlanBadge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex p-3 rounded-lg ${colors.bg} ${colors.border} border mb-4`}>
                  <Icon className={`w-8 h-8 ${colors.accent}`} />
                </div>
                
                <Typography variant="h3" className="text-xl font-bold mb-2">
                  {plan.name}
                </Typography>
                
                <Typography variant="body2" className="text-gray-600 mb-4">
                  {plan.description}
                </Typography>

                {/* Pricing */}
                <div className="mb-4">
                  {plan.id === SubscriptionPlan.FREE ? (
                    <Typography variant="h2" className="text-3xl font-bold">
                      Free
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="h2" className="text-3xl font-bold">
                        {formatPrice(price)}
                        <span className="text-sm font-normal text-gray-600">
                          /{billingCycle === BillingCycle.YEARLY ? 'year' : 'month'}
                        </span>
                      </Typography>
                      
                      {billingCycle === BillingCycle.YEARLY && savings > 0 && (
                        <Typography variant="body2" className="text-green-600 mt-1">
                          Save {formatPrice(savings)} annually
                        </Typography>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-1 mb-6">
                {features.slice(0, 8).map((feature, index) => (
                  <PlanFeature
                    key={index}
                    feature={feature.name}
                    included={feature.included}
                    highlight={highlightUpgrades && isUpgrade(plan.id) && feature.included && !SUBSCRIPTION_PLANS[currentPlan].features[feature.name as keyof typeof SUBSCRIPTION_PLANS[typeof currentPlan]['features']]}
                  />
                ))}
                
                {features.length > 8 && (
                  <div className="pt-2">
                    <Typography variant="body2" className="text-gray-500 text-center">
                      + {features.length - 8} more features
                    </Typography>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                {isCurrentPlan(plan.id) ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => onPlanSelect(plan.id, billingCycle)}
                    className={`w-full transition-colors ${colors.button}`}
                  >
                    {isUpgrade(plan.id) ? (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Upgrade to {plan.name}
                      </>
                    ) : isDowngrade(plan.id) ? (
                      <>
                        Downgrade to {plan.name}
                      </>
                    ) : (
                      <>
                        Get Started with {plan.name}
                      </>
                    )}
                  </Button>
                )}
                
                {plan.id !== SubscriptionPlan.FREE && (
                  <Typography variant="body2" className="text-gray-500 text-center mt-2">
                    14-day free trial • Cancel anytime
                  </Typography>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <Typography variant="h3" className="text-lg font-semibold">
            Detailed Feature Comparison
          </Typography>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Features</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-4 font-medium text-gray-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Resource Limits */}
              <tr>
                <td className="p-4 font-medium text-gray-900">Projects</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-4 text-center">
                    {plan.limits.projects === -1 ? '∞' : plan.limits.projects}
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="p-4 font-medium text-gray-900">Team Members</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-4 text-center">
                    {plan.limits.teamMembers === -1 ? '∞' : plan.limits.teamMembers}
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="p-4 font-medium text-gray-900">Monthly Installations</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-4 text-center">
                    {plan.limits.installations === -1 ? '∞' : plan.limits.installations.toLocaleString()}
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="p-4 font-medium text-gray-900">Storage</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-4 text-center">
                    {plan.limits.storageGB === -1 ? '∞' : `${plan.limits.storageGB} GB`}
                  </td>
                ))}
              </tr>

              {/* Features */}
              {[
                { key: 'analytics', name: 'Advanced Analytics' },
                { key: 'advancedReporting', name: 'Advanced Reporting' },
                { key: 'apiAccess', name: 'API Access' },
                { key: 'webhookSupport', name: 'Webhook Support' },
                { key: 'prioritySupport', name: 'Priority Support' },
                { key: 'customIntegrations', name: 'Custom Integrations' },
                { key: 'ssoIntegration', name: 'SSO Integration' },
                { key: 'customBranding', name: 'Custom Branding' },
                { key: 'whiteLabeling', name: 'White Labeling' },
                { key: 'dedicatedSupport', name: 'Dedicated Support' }
              ].map((feature) => (
                <tr key={feature.key}>
                  <td className="p-4 font-medium text-gray-900">{feature.name}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="p-4 text-center">
                      {plan.features[feature.key as keyof typeof plan.features] ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PlanComparison;