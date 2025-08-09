// Think Tank Technologies Installation Scheduler - Stripe Elements Integration
import React, { useState, useEffect, useCallback } from 'react';
import {
  loadStripe,
  StripeElementsOptions,
  StripeCardElement,
  StripeCardElementOptions
} from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
  usePaymentElement
} from '@stripe/react-stripe-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Input,
  Card,
  Loading,
  Typography
} from '../ui';
import {
  paymentMethodSchema,
  subscriptionSignupSchema,
  billingAddressSchema,
  PaymentMethodData,
  SubscriptionSignupData,
  BillingAddressData
} from '../../lib/forms/schemas';
import { stripeService } from '../../services/stripeService';
import { AlertCircle, CheckCircle, CreditCard, Lock } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Stripe Elements styling
const cardElementOptions: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false, // We'll collect this separately for better UX
};

const elementsOptions: StripeElementsOptions = {
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  },
};

interface StripeElementsWrapperProps {
  children: React.ReactNode;
  clientSecret?: string;
  options?: StripeElementsOptions;
}

/**
 * Wrapper component for Stripe Elements provider
 */
export const StripeElementsWrapper: React.FC<StripeElementsWrapperProps> = ({
  children,
  clientSecret,
  options = elementsOptions
}) => {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    stripePromise.then((stripeInstance) => {
      setStripe(stripeInstance);
    });
  }, []);

  if (!stripe) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loading size="lg" />
      </div>
    );
  }

  const elementsProps = clientSecret 
    ? { stripe, options: { ...options, clientSecret } }
    : { stripe, options };

  return (
    <Elements {...elementsProps}>
      {children}
    </Elements>
  );
};

interface PaymentMethodFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  organizationId: string;
  isProcessing?: boolean;
  buttonText?: string;
  showBillingAddress?: boolean;
}

/**
 * Payment method collection form using Stripe Elements
 */
export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSuccess,
  onError,
  organizationId,
  isProcessing = false,
  buttonText = 'Add Payment Method',
  showBillingAddress = true
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const form = useForm<PaymentMethodData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'card',
      setAsDefault: false,
      stripeElementsReady: false,
      billingDetails: {
        name: '',
        email: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US'
        }
      }
    }
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;

  // Handle card element changes
  const handleCardChange = useCallback((event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
    setValue('stripeElementsReady', event.complete);
  }, [setValue]);

  // Submit payment method
  const onSubmit = async (data: PaymentMethodData) => {
    if (!stripe || !elements) {
      onError('Stripe has not loaded yet.');
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      onError('Card element not found.');
      return;
    }

    setLoading(true);

    try {
      // Create setup intent for future payments
      const { clientSecret } = await stripeService.createSetupIntent(organizationId);

      // Confirm setup intent with payment method
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: data.billingDetails.name,
            email: data.billingDetails.email,
            address: {
              line1: data.billingDetails.address.line1,
              line2: data.billingDetails.address.line2,
              city: data.billingDetails.address.city,
              state: data.billingDetails.address.state,
              postal_code: data.billingDetails.address.postalCode,
              country: data.billingDetails.address.country,
            },
          },
        },
      });

      if (error) {
        console.error('Setup intent confirmation error:', error);
        onError(error.message || 'Payment method setup failed');
      } else if (setupIntent && setupIntent.payment_method) {
        onSuccess(setupIntent.payment_method.toString());
      }
    } catch (error) {
      console.error('Payment method creation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Card Element */}
      <div>
        <Typography variant="body1" className="font-medium mb-2">
          Card Information
        </Typography>
        <div className="p-4 border border-gray-300 rounded-md bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <div className="flex items-center gap-2 mt-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <Typography variant="body2">{cardError}</Typography>
          </div>
        )}
      </div>

      {/* Cardholder Name */}
      <div>
        <Typography variant="body1" className="font-medium mb-2">
          Cardholder Name
        </Typography>
        <Input
          {...register('billingDetails.name')}
          placeholder="Name on card"
          error={errors.billingDetails?.name?.message}
        />
      </div>

      {/* Email */}
      <div>
        <Typography variant="body1" className="font-medium mb-2">
          Email Address
        </Typography>
        <Input
          {...register('billingDetails.email')}
          type="email"
          placeholder="email@example.com"
          error={errors.billingDetails?.email?.message}
        />
      </div>

      {/* Billing Address */}
      {showBillingAddress && (
        <div>
          <Typography variant="body1" className="font-medium mb-3">
            Billing Address
          </Typography>
          <div className="grid grid-cols-1 gap-4">
            {/* Address Line 1 */}
            <Input
              {...register('billingDetails.address.line1')}
              placeholder="Address line 1"
              error={errors.billingDetails?.address?.line1?.message}
            />
            
            {/* Address Line 2 */}
            <Input
              {...register('billingDetails.address.line2')}
              placeholder="Address line 2 (optional)"
              error={errors.billingDetails?.address?.line2?.message}
            />
            
            {/* City, State, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                {...register('billingDetails.address.city')}
                placeholder="City"
                error={errors.billingDetails?.address?.city?.message}
              />
              <Input
                {...register('billingDetails.address.state')}
                placeholder="State"
                error={errors.billingDetails?.address?.state?.message}
              />
              <Input
                {...register('billingDetails.address.postalCode')}
                placeholder="ZIP Code"
                error={errors.billingDetails?.address?.postalCode?.message}
              />
            </div>
            
            {/* Country */}
            <select
              {...register('billingDetails.address.country')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
            </select>
            {errors.billingDetails?.address?.country && (
              <Typography variant="body2" className="text-red-600">
                {errors.billingDetails.address.country.message}
              </Typography>
            )}
          </div>
        </div>
      )}

      {/* Set as Default */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('setAsDefault')}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Typography variant="body2">
          Set as default payment method
        </Typography>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
        <Lock className="w-4 h-4 text-gray-600" />
        <Typography variant="body2" className="text-gray-700">
          Your payment information is encrypted and secure
        </Typography>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={!stripe || !cardComplete || loading || isProcessing}
        className="w-full flex items-center justify-center gap-2"
      >
        {loading || isProcessing ? (
          <>
            <Loading size="sm" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {buttonText}
          </>
        )}
      </Button>
    </form>
  );
};

interface SubscriptionSignupFormProps {
  onSuccess: (subscriptionId: string) => void;
  onError: (error: string) => void;
  organizationId: string;
  selectedPlan?: 'professional' | 'enterprise';
  selectedCycle?: 'monthly' | 'yearly';
}

/**
 * Complete subscription signup form with payment method collection
 */
export const SubscriptionSignupForm: React.FC<SubscriptionSignupFormProps> = ({
  onSuccess,
  onError,
  organizationId,
  selectedPlan = 'professional',
  selectedCycle = 'monthly'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const form = useForm<SubscriptionSignupData>({
    resolver: zodResolver(subscriptionSignupSchema),
    defaultValues: {
      planId: selectedPlan,
      billingCycle: selectedCycle,
      billingDetails: {
        name: '',
        email: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US'
        }
      },
      terms: false,
      privacy: false,
      marketing: false
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const watchedPlan = watch('planId');

  // Handle card element changes
  const handleCardChange = useCallback((event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  }, []);

  // Submit subscription
  const onSubmit = async (data: SubscriptionSignupData) => {
    if (!stripe || !elements) {
      onError('Stripe has not loaded yet.');
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      onError('Card element not found.');
      return;
    }

    setLoading(true);

    try {
      // Create payment method first
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: card,
        billing_details: {
          name: data.billingDetails.name,
          email: data.billingDetails.email,
          address: {
            line1: data.billingDetails.address.line1,
            line2: data.billingDetails.address.line2,
            city: data.billingDetails.address.city,
            state: data.billingDetails.address.state,
            postal_code: data.billingDetails.address.postalCode,
            country: data.billingDetails.address.country,
          },
        },
      });

      if (pmError) {
        console.error('Payment method creation error:', pmError);
        onError(pmError.message || 'Failed to create payment method');
        return;
      }

      // Create subscription
      const subscription = await stripeService.createSubscription(organizationId, {
        ...data,
        paymentMethodId: paymentMethod?.id
      });

      onSuccess(subscription.id);
    } catch (error) {
      console.error('Subscription creation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Plan Selection */}
      <div>
        <Typography variant="body1" className="font-medium mb-3">
          Selected Plan
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-blue-500">
            <input
              type="radio"
              {...register('planId')}
              value="professional"
              className="mr-3"
            />
            <div>
              <Typography variant="body1" className="font-semibold">
                Professional
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                $49/month or $529/year
              </Typography>
            </div>
          </label>
          
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-blue-500">
            <input
              type="radio"
              {...register('planId')}
              value="enterprise"
              className="mr-3"
            />
            <div>
              <Typography variant="body1" className="font-semibold">
                Enterprise
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                $199/month or $2149/year
              </Typography>
            </div>
          </label>
        </div>
      </div>

      {/* Billing Cycle */}
      <div>
        <Typography variant="body1" className="font-medium mb-3">
          Billing Cycle
        </Typography>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              {...register('billingCycle')}
              value="monthly"
              className="mr-2"
            />
            Monthly
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              {...register('billingCycle')}
              value="yearly"
              className="mr-2"
            />
            Yearly (Save 10%)
          </label>
        </div>
      </div>

      {/* Card Element */}
      <div>
        <Typography variant="body1" className="font-medium mb-2">
          Payment Information
        </Typography>
        <div className="p-4 border border-gray-300 rounded-md bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <div className="flex items-center gap-2 mt-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <Typography variant="body2">{cardError}</Typography>
          </div>
        )}
      </div>

      {/* Billing Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('billingDetails.name')}
          placeholder="Full name"
          error={errors.billingDetails?.name?.message}
          label="Name"
        />
        <Input
          {...register('billingDetails.email')}
          type="email"
          placeholder="email@example.com"
          error={errors.billingDetails?.email?.message}
          label="Email"
        />
      </div>

      {/* Billing Address */}
      <div>
        <Typography variant="body1" className="font-medium mb-3">
          Billing Address
        </Typography>
        <div className="space-y-4">
          <Input
            {...register('billingDetails.address.line1')}
            placeholder="123 Main Street"
            error={errors.billingDetails?.address?.line1?.message}
            label="Address"
          />
          <Input
            {...register('billingDetails.address.line2')}
            placeholder="Apt, suite, etc. (optional)"
            error={errors.billingDetails?.address?.line2?.message}
            label="Address Line 2"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('billingDetails.address.city')}
              placeholder="City"
              error={errors.billingDetails?.address?.city?.message}
              label="City"
            />
            <Input
              {...register('billingDetails.address.state')}
              placeholder="State"
              error={errors.billingDetails?.address?.state?.message}
              label="State"
            />
            <Input
              {...register('billingDetails.address.postalCode')}
              placeholder="12345"
              error={errors.billingDetails?.address?.postalCode?.message}
              label="ZIP Code"
            />
          </div>
        </div>
      </div>

      {/* Coupon Code */}
      <div>
        <Typography variant="body1" className="font-medium mb-2">
          Promotional Code (Optional)
        </Typography>
        <Input
          {...register('couponCode')}
          placeholder="Enter coupon code"
          error={errors.couponCode?.message}
        />
      </div>

      {/* Legal Agreements */}
      <div className="space-y-3">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            {...register('terms')}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Typography variant="body2">
            I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            {errors.terms && (
              <span className="block text-red-600 mt-1">{errors.terms.message}</span>
            )}
          </Typography>
        </label>
        
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            {...register('privacy')}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Typography variant="body2">
            I agree to the <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            {errors.privacy && (
              <span className="block text-red-600 mt-1">{errors.privacy.message}</span>
            )}
          </Typography>
        </label>
        
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            {...register('marketing')}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Typography variant="body2">
            I'd like to receive marketing emails about products and features
          </Typography>
        </label>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
        <Lock className="w-4 h-4 text-gray-600" />
        <Typography variant="body2" className="text-gray-700">
          Your payment information is encrypted and secure. Cancel anytime.
        </Typography>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={!stripe || !cardComplete || loading}
        className="w-full flex items-center justify-center gap-2"
        size="lg"
      >
        {loading ? (
          <>
            <Loading size="sm" />
            Creating Subscription...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Start {watchedPlan === 'professional' ? 'Professional' : 'Enterprise'} Plan
          </>
        )}
      </Button>
    </form>
  );
};

interface PaymentMethodListProps {
  organizationId: string;
  onPaymentMethodAdded?: () => void;
  onPaymentMethodRemoved?: () => void;
}

/**
 * Display and manage existing payment methods
 */
export const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  organizationId,
  onPaymentMethodAdded,
  onPaymentMethodRemoved
}) => {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, [organizationId]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await stripeService.getPaymentMethods(organizationId);
      setPaymentMethods(methods);
    } catch (err) {
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      await stripeService.deletePaymentMethod(paymentMethodId);
      await loadPaymentMethods();
      onPaymentMethodRemoved?.();
    } catch (err) {
      setError('Failed to remove payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-200 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No payment methods on file
        </div>
      ) : (
        paymentMethods.map((method) => (
          <Card key={method.id} className="p-4">
            <div className="flex items-center justify-between">
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
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Default
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemovePaymentMethod(method.id)}
                className="text-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default StripeElementsWrapper;