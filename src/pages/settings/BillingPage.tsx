// Think Tank Technologies Installation Scheduler - Billing Management Page
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  Button,
  Input,
  Modal,
  Loading,
  Typography
} from '../../components/ui';
import {
  Subscription,
  UsageMetrics,
  PaymentMethod,
  Invoice,
  SubscriptionPlan,
  BillingCycle,
  SubscriptionPlanConfig
} from '../../types';
import {
  subscriptionUpdateSchema,
  subscriptionCancellationSchema,
  paymentMethodSchema,
  billingDetailsUpdateSchema,
  SubscriptionUpdateData,
  SubscriptionCancellationData,
  PaymentMethodData,
  BillingDetailsUpdateData
} from '../../lib/forms/schemas';
import { stripeService } from '../../services/stripeService';
import { usageTrackingService } from '../../services/usageTrackingService';
import { SUBSCRIPTION_PLANS, formatPrice, calculateYearlySavings } from '../../config/subscriptionPlans';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle, Settings, Download } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface BillingPageProps {
  organizationId: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({ organizationId }) => {
  // State Management
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showBillingDetailsModal, setShowBillingDetailsModal] = useState(false);

  // Form Management
  const planChangeForm = useForm<SubscriptionUpdateData>({
    resolver: zodResolver(subscriptionUpdateSchema)
  });

  const cancelForm = useForm<SubscriptionCancellationData>({
    resolver: zodResolver(subscriptionCancellationSchema)
  });

  const paymentMethodForm = useForm<PaymentMethodData>({
    resolver: zodResolver(paymentMethodSchema)
  });

  const billingDetailsForm = useForm<BillingDetailsUpdateData>({
    resolver: zodResolver(billingDetailsUpdateSchema)
  });

  // Data Loading
  useEffect(() => {
    loadBillingData();
  }, [organizationId]);

  const loadBillingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [subscriptionData, usageData, paymentMethodsData, invoicesData] = await Promise.all([
        stripeService.getSubscription(organizationId),
        usageTrackingService.getUsageMetrics(organizationId),
        stripeService.getPaymentMethods(organizationId),
        stripeService.getInvoices(organizationId, 10)
      ]);

      setSubscription(subscriptionData);
      setUsageMetrics(usageData);
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);
    } catch (error) {
      setError('Failed to load billing information');
      console.error('Error loading billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Plan Change Handlers
  const handlePlanChange = async (data: SubscriptionUpdateData) => {
    try {
      setIsLoading(true);
      await stripeService.updateSubscription(organizationId, data);
      await loadBillingData();
      setShowPlanChangeModal(false);
      // Show success notification
    } catch (error) {
      setError('Failed to update subscription');
      console.error('Plan change error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (data: SubscriptionCancellationData) => {
    try {
      setIsLoading(true);
      await stripeService.cancelSubscription(organizationId, data.cancelAtPeriodEnd);
      await loadBillingData();
      setShowCancelModal(false);
      // Show success notification
    } catch (error) {
      setError('Failed to cancel subscription');
      console.error('Cancellation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const { url } = await stripeService.createBillingPortalSession(
        organizationId,
        window.location.href
      );
      window.open(url, '_blank');
    } catch (error) {
      setError('Failed to open billing portal');
      console.error('Billing portal error:', error);
    }
  };

  // Render Loading State
  if (isLoading && !subscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  const currentPlan = subscription ? SUBSCRIPTION_PLANS[subscription.planId] : SUBSCRIPTION_PLANS.free;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h2" className="text-2xl font-bold">
            Billing & Subscription
          </Typography>
          <Typography variant="body2" className="text-gray-600 mt-1">
            Manage your subscription, billing details, and usage
          </Typography>
        </div>
        <Button
          onClick={handleBillingPortal}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Billing Portal
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <Typography variant="body1" className="text-red-800 font-medium">
                Error
              </Typography>
              <Typography variant="body2" className="text-red-700">
                {error}
              </Typography>
            </div>
          </div>
        </Card>
      )}

      {/* Current Subscription */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Typography variant="h3" className="text-lg font-semibold mb-2">
                Current Plan
              </Typography>
              <div className="flex items-center gap-3">
                <Typography variant="h4" className="text-xl font-bold text-blue-600">
                  {currentPlan.name}
                </Typography>
                {subscription && subscription.status === 'trialing' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Trial
                  </span>
                )}
                {subscription && subscription.status === 'active' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <Typography variant="body2" className="text-gray-600 mt-1">
                {currentPlan.description}
              </Typography>
            </div>
            <div className="text-right">
              {subscription && subscription.planId !== SubscriptionPlan.FREE && (
                <div>
                  <Typography variant="h4" className="text-xl font-bold">
                    {formatPrice(
                      subscription.billingCycle === BillingCycle.YEARLY
                        ? currentPlan.price.yearly
                        : currentPlan.price.monthly
                    )}
                    <span className="text-sm font-normal text-gray-600">
                      /{subscription.billingCycle === BillingCycle.YEARLY ? 'year' : 'month'}
                    </span>
                  </Typography>
                  {subscription.billingCycle === BillingCycle.YEARLY && (
                    <Typography variant="body2" className="text-green-600">
                      Save {formatPrice(calculateYearlySavings(currentPlan))} annually
                    </Typography>
                  )}
                </div>
              )}
              {subscription?.planId === SubscriptionPlan.FREE && (
                <Typography variant="h4" className="text-xl font-bold text-green-600">
                  Free
                </Typography>
              )}
            </div>
          </div>

          {/* Plan Actions */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setShowPlanChangeModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {subscription?.planId === SubscriptionPlan.FREE ? 'Upgrade Plan' : 'Change Plan'}
            </Button>
            {subscription && subscription.planId !== SubscriptionPlan.FREE && (
              <Button
                onClick={() => setShowCancelModal(true)}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancel Subscription
              </Button>
            )}
          </div>

          {/* Subscription Details */}
          {subscription && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
              <div>
                <Typography variant="body2" className="text-gray-600">Status</Typography>
                <Typography variant="body1" className="font-medium capitalize">
                  {subscription.status.replace('_', ' ')}
                </Typography>
              </div>
              {subscription.currentPeriodEnd && (
                <div>
                  <Typography variant="body2" className="text-gray-600">
                    {subscription.status === 'canceled' ? 'Ends' : 'Renews'}
                  </Typography>
                  <Typography variant="body1" className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </Typography>
                </div>
              )}
              {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                <div>
                  <Typography variant="body2" className="text-gray-600">Trial Ends</Typography>
                  <Typography variant="body1" className="font-medium">
                    {new Date(subscription.trialEnd).toLocaleDateString()}
                  </Typography>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Usage Overview */}
      {usageMetrics && (
        <Card>
          <div className="p-6">
            <Typography variant="h3" className="text-lg font-semibold mb-4">
              Usage Overview
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Projects Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Typography variant="body2" className="text-gray-600">Projects</Typography>
                  <Typography variant="body2" className="font-medium">
                    {usageMetrics.projects.current} / {usageMetrics.projects.limit === -1 ? '∞' : usageMetrics.projects.limit}
                  </Typography>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usageMetrics.projects.percentage > 90
                        ? 'bg-red-500'
                        : usageMetrics.projects.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(usageMetrics.projects.percentage, 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Team Members Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Typography variant="body2" className="text-gray-600">Team Members</Typography>
                  <Typography variant="body2" className="font-medium">
                    {usageMetrics.teamMembers.current} / {usageMetrics.teamMembers.limit === -1 ? '∞' : usageMetrics.teamMembers.limit}
                  </Typography>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usageMetrics.teamMembers.percentage > 90
                        ? 'bg-red-500'
                        : usageMetrics.teamMembers.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(usageMetrics.teamMembers.percentage, 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Installations Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Typography variant="body2" className="text-gray-600">Monthly Installations</Typography>
                  <Typography variant="body2" className="font-medium">
                    {usageMetrics.installations.current} / {usageMetrics.installations.limit === -1 ? '∞' : usageMetrics.installations.limit}
                  </Typography>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usageMetrics.installations.percentage > 90
                        ? 'bg-red-500'
                        : usageMetrics.installations.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(usageMetrics.installations.percentage, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Usage Warnings */}
            {usageMetrics.warnings.length > 0 && (
              <div className="mt-6 space-y-2">
                {usageMetrics.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      warning.severity === 'critical'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        warning.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    />
                    <div className="flex-1">
                      <Typography variant="body2" className="font-medium">
                        {warning.message}
                      </Typography>
                      {warning.suggestedAction && (
                        <Typography variant="body2" className="text-gray-600 text-sm mt-1">
                          {warning.suggestedAction}
                        </Typography>
                      )}
                    </div>
                    {warning.actionRequired && (
                      <Button
                        size="sm"
                        onClick={() => setShowPlanChangeModal(true)}
                        className="ml-auto"
                      >
                        Upgrade
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Payment Methods */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h3" className="text-lg font-semibold">
              Payment Methods
            </Typography>
            <Button
              onClick={() => setShowPaymentMethodModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Add Payment Method
            </Button>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Typography variant="body1" className="text-gray-600 mb-2">
                No payment methods added
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                Add a payment method to upgrade your subscription
              </Typography>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div>
                      <Typography variant="body1" className="font-medium">
                        •••• •••• •••• {method.card?.last4}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {method.card?.brand.toUpperCase()} expires {method.card?.expMonth}/{method.card?.expYear}
                      </Typography>
                    </div>
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Handle payment method deletion
                    }}
                    className="text-red-600"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Billing History */}
      <Card>
        <div className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            Billing History
          </Typography>

          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Typography variant="body1" className="text-gray-600 mb-2">
                No invoices yet
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                Your billing history will appear here
              </Typography>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <Typography variant="body1" className="font-medium">
                      {formatPrice(invoice.amountPaid)} - {invoice.description || 'Subscription'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    {invoice.hostedInvoiceUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Plan Change Modal */}
      <Modal
        isOpen={showPlanChangeModal}
        onClose={() => setShowPlanChangeModal(false)}
        title="Change Subscription Plan"
        size="lg"
      >
        <PlanChangeModal
          currentPlan={subscription?.planId || SubscriptionPlan.FREE}
          onSubmit={handlePlanChange}
          onCancel={() => setShowPlanChangeModal(false)}
          form={planChangeForm}
        />
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
      >
        <CancelSubscriptionModal
          subscription={subscription}
          onSubmit={handleCancelSubscription}
          onCancel={() => setShowCancelModal(false)}
          form={cancelForm}
        />
      </Modal>
    </div>
  );
};

// Plan Change Modal Component
interface PlanChangeModalProps {
  currentPlan: SubscriptionPlan;
  onSubmit: (data: SubscriptionUpdateData) => void;
  onCancel: () => void;
  form: any;
}

const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
  currentPlan,
  onSubmit,
  onCancel,
  form
}) => {
  const { register, handleSubmit, watch, formState: { errors } } = form;
  const selectedPlan = watch('newPlanId', currentPlan);
  const selectedCycle = watch('newBillingCycle', 'monthly');

  const availablePlans = Object.values(SUBSCRIPTION_PLANS).filter(
    plan => plan.id !== currentPlan
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Plan Selection */}
      <div>
        <Typography variant="body1" className="font-medium mb-3">
          Select New Plan
        </Typography>
        <div className="space-y-3">
          {availablePlans.map((plan) => (
            <label
              key={plan.id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                {...register('newPlanId')}
                value={plan.id}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Typography variant="body1" className="font-semibold">
                    {plan.name}
                  </Typography>
                  <div className="text-right">
                    <Typography variant="body1" className="font-bold">
                      {formatPrice(plan.price[selectedCycle as keyof typeof plan.price])}
                      <span className="text-sm font-normal">/{selectedCycle}</span>
                    </Typography>
                  </div>
                </div>
                <Typography variant="body2" className="text-gray-600 mt-1">
                  {plan.description}
                </Typography>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Billing Cycle */}
      {selectedPlan !== SubscriptionPlan.FREE && (
        <div>
          <Typography variant="body1" className="font-medium mb-3">
            Billing Cycle
          </Typography>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                {...register('newBillingCycle')}
                value="monthly"
                className="mr-2"
              />
              Monthly
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                {...register('newBillingCycle')}
                value="yearly"
                className="mr-2"
              />
              Yearly (Save 10%)
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Update Subscription
        </Button>
      </div>
    </form>
  );
};

// Cancel Subscription Modal Component
interface CancelSubscriptionModalProps {
  subscription: Subscription | null;
  onSubmit: (data: SubscriptionCancellationData) => void;
  onCancel: () => void;
  form: any;
}

const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  subscription,
  onSubmit,
  onCancel,
  form
}) => {
  const { register, handleSubmit, watch, formState: { errors } } = form;
  const cancelAtPeriodEnd = watch('cancelAtPeriodEnd', true);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <Typography variant="h3" className="text-lg font-semibold text-red-800 mb-2">
          Cancel Subscription
        </Typography>
        <Typography variant="body2" className="text-gray-600">
          We're sorry to see you go. Help us improve by telling us why you're canceling.
        </Typography>
      </div>

      {/* Cancellation Timing */}
      <div>
        <Typography variant="body1" className="font-medium mb-3">
          When should the cancellation take effect?
        </Typography>
        <div className="space-y-2">
          <label className="flex items-start">
            <input
              type="radio"
              {...register('cancelAtPeriodEnd')}
              value="true"
              className="mt-1 mr-3"
            />
            <div>
              <Typography variant="body2" className="font-medium">
                At the end of current billing period
              </Typography>
              <Typography variant="body2" className="text-gray-600 text-sm">
                Continue using features until {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'period end'}
              </Typography>
            </div>
          </label>
          <label className="flex items-start">
            <input
              type="radio"
              {...register('cancelAtPeriodEnd')}
              value="false"
              className="mt-1 mr-3"
            />
            <div>
              <Typography variant="body2" className="font-medium">
                Immediately
              </Typography>
              <Typography variant="body2" className="text-gray-600 text-sm">
                Lose access to premium features right away
              </Typography>
            </div>
          </label>
        </div>
      </div>

      {/* Cancellation Reason */}
      <div>
        <Typography variant="body1" className="font-medium mb-3">
          What's your primary reason for canceling?
        </Typography>
        <select {...register('reason')} className="w-full p-2 border rounded-md">
          <option value="">Please select a reason</option>
          <option value="too_expensive">Too expensive</option>
          <option value="missing_features">Missing required features</option>
          <option value="poor_support">Unsatisfactory customer support</option>
          <option value="technical_issues">Technical problems or bugs</option>
          <option value="switching_provider">Switching to another provider</option>
          <option value="no_longer_needed">No longer need the service</option>
          <option value="other">Other reason</option>
        </select>
      </div>

      {/* Feedback */}
      <div>
        <Typography variant="body1" className="font-medium mb-2">
          Additional feedback (optional)
        </Typography>
        <textarea
          {...register('feedback')}
          rows={3}
          className="w-full p-2 border rounded-md resize-none"
          placeholder="Help us improve by sharing more details..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" onClick={onCancel} variant="outline">
          Keep Subscription
        </Button>
        <Button type="submit" variant="danger">
          Cancel Subscription
        </Button>
      </div>
    </form>
  );
};

export default BillingPage;