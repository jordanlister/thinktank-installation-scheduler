// Think Tank Technologies Installation Scheduler - Stripe Service
import Stripe from 'stripe';
import { supabase } from './supabase';
import {
  SubscriptionPlan,
  BillingCycle,
  StripeCustomer,
  Subscription,
  PaymentMethod,
  Invoice,
  PaymentIntent,
  BillingAddress,
  SubscriptionSignupForm,
  PaymentMethodForm,
  BillingError,
  BillingErrorType,
  SubscriptionStatus
} from '../types';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

class StripeService {
  private stripe: Stripe;
  private initialized = false;

  constructor() {
    // Initialize Stripe with secret key (server-side only)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      typescript: true
    });

    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Stripe service not initialized');
    }
  }

  private handleStripeError(error: any): BillingError {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        type: BillingErrorType.STRIPE_API_ERROR,
        message: error.message,
        details: {
          type: error.type,
          code: error.code,
          declineCode: error.decline_code,
          requestId: error.requestId
        },
        retryable: error.type === 'StripeConnectionError' || error.type === 'StripeAPIError',
        userMessage: this.getUserFriendlyMessage(error)
      };
    }

    return {
      type: BillingErrorType.STRIPE_API_ERROR,
      message: error.message || 'Unknown Stripe error',
      details: error,
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again or contact support.'
    };
  }

  private getUserFriendlyMessage(error: Stripe.errors.StripeError): string {
    switch (error.type) {
      case 'StripeCardError':
        switch (error.code) {
          case 'card_declined':
            return 'Your card was declined. Please try a different payment method.';
          case 'insufficient_funds':
            return 'Your card has insufficient funds.';
          case 'expired_card':
            return 'Your card has expired. Please use a different card.';
          case 'incorrect_cvc':
            return 'Your card\'s security code is incorrect.';
          default:
            return 'There was an issue with your payment method.';
        }
      case 'StripeRateLimitError':
        return 'Too many requests. Please wait a moment and try again.';
      case 'StripeInvalidRequestError':
        return 'Invalid request. Please check your information and try again.';
      case 'StripeAPIError':
        return 'A temporary issue occurred. Please try again.';
      case 'StripeConnectionError':
        return 'Connection error. Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  }

  // Customer Management
  async createCustomer(organizationId: string, customerData: {
    email: string;
    name: string;
    address?: BillingAddress;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    this.ensureInitialized();

    try {
      const stripeCustomer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        address: customerData.address ? {
          line1: customerData.address.line1,
          line2: customerData.address.line2,
          city: customerData.address.city,
          state: customerData.address.state,
          postal_code: customerData.address.postalCode,
          country: customerData.address.country
        } : undefined,
        metadata: {
          organizationId,
          ...customerData.metadata
        }
      });

      // Store customer in our database
      const customer: StripeCustomer = {
        id: crypto.randomUUID(),
        organizationId,
        stripeCustomerId: stripeCustomer.id,
        email: customerData.email,
        name: customerData.name,
        address: customerData.address,
        paymentMethods: [],
        taxIds: [],
        metadata: customerData.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('stripe_customers')
        .insert([customer]);

      if (error) {
        throw new Error(`Failed to store customer: ${error.message}`);
      }

      return customer;
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async getCustomer(organizationId: string): Promise<StripeCustomer | null> {
    const { data, error } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as StripeCustomer;
  }

  async updateCustomer(organizationId: string, updates: {
    email?: string;
    name?: string;
    address?: BillingAddress;
  }): Promise<StripeCustomer> {
    this.ensureInitialized();

    const customer = await this.getCustomer(organizationId);
    if (!customer) {
      throw new BillingError({
        type: BillingErrorType.SUBSCRIPTION_NOT_FOUND,
        message: 'Customer not found',
        userMessage: 'Customer not found'
      });
    }

    try {
      await this.stripe.customers.update(customer.stripeCustomerId, {
        email: updates.email,
        name: updates.name,
        address: updates.address ? {
          line1: updates.address.line1,
          line2: updates.address.line2,
          city: updates.address.city,
          state: updates.address.state,
          postal_code: updates.address.postalCode,
          country: updates.address.country
        } : undefined
      });

      // Update in our database
      const updatedCustomer = {
        ...customer,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('stripe_customers')
        .update(updatedCustomer)
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(`Failed to update customer: ${error.message}`);
      }

      return updatedCustomer;
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // Subscription Management
  async createSubscription(organizationId: string, signupData: SubscriptionSignupForm): Promise<Subscription> {
    this.ensureInitialized();

    try {
      let customer = await this.getCustomer(organizationId);
      
      // Create customer if doesn't exist
      if (!customer) {
        customer = await this.createCustomer(organizationId, {
          email: signupData.billingDetails.email,
          name: signupData.billingDetails.name,
          address: signupData.billingDetails.address
        });
      }

      const planConfig = SUBSCRIPTION_PLANS[signupData.planId];
      const priceId = signupData.billingCycle === BillingCycle.YEARLY 
        ? planConfig.stripePriceId.yearly 
        : planConfig.stripePriceId.monthly;

      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent', 'customer'],
        metadata: {
          organizationId,
          planId: signupData.planId,
          billingCycle: signupData.billingCycle
        }
      };

      // Add payment method if provided
      if (signupData.paymentMethodId) {
        subscriptionData.default_payment_method = signupData.paymentMethodId;
      }

      // Add coupon if provided
      if (signupData.couponCode) {
        subscriptionData.coupon = signupData.couponCode;
      }

      // Add trial if eligible
      if (signupData.planId !== SubscriptionPlan.FREE) {
        subscriptionData.trial_period_days = 14;
      }

      const stripeSubscription = await this.stripe.subscriptions.create(subscriptionData);

      // Store subscription in our database
      const subscription: Subscription = {
        id: crypto.randomUUID(),
        organizationId,
        planId: signupData.planId,
        status: this.mapStripeSubscriptionStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : undefined,
        billingCycle: signupData.billingCycle,
        amountCents: planConfig.price[signupData.billingCycle],
        currency: 'usd',
        stripeCustomerId: customer.stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        paymentMethodId: signupData.paymentMethodId,
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        metadata: {
          referralCode: signupData.couponCode
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('subscriptions')
        .insert([subscription]);

      if (error) {
        throw new Error(`Failed to store subscription: ${error.message}`);
      }

      return subscription;
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async getSubscription(organizationId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Subscription;
  }

  async updateSubscription(organizationId: string, updates: {
    planId?: SubscriptionPlan;
    billingCycle?: BillingCycle;
    paymentMethodId?: string;
  }): Promise<Subscription> {
    this.ensureInitialized();

    const subscription = await this.getSubscription(organizationId);
    if (!subscription) {
      throw new BillingError({
        type: BillingErrorType.SUBSCRIPTION_NOT_FOUND,
        message: 'Subscription not found',
        userMessage: 'Subscription not found'
      });
    }

    try {
      const updateData: Stripe.SubscriptionUpdateParams = {};

      // Handle plan change
      if (updates.planId && updates.planId !== subscription.planId) {
        const newPlanConfig = SUBSCRIPTION_PLANS[updates.planId];
        const billingCycle = updates.billingCycle || subscription.billingCycle;
        const priceId = billingCycle === BillingCycle.YEARLY 
          ? newPlanConfig.stripePriceId.yearly 
          : newPlanConfig.stripePriceId.monthly;

        updateData.items = [{
          id: subscription.stripeSubscriptionId,
          price: priceId
        }];
        updateData.proration_behavior = 'create_prorations';
      }

      // Handle payment method change
      if (updates.paymentMethodId) {
        updateData.default_payment_method = updates.paymentMethodId;
      }

      const updatedStripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        updateData
      );

      // Update in our database
      const updatedSubscription = {
        ...subscription,
        planId: updates.planId || subscription.planId,
        billingCycle: updates.billingCycle || subscription.billingCycle,
        paymentMethodId: updates.paymentMethodId || subscription.paymentMethodId,
        status: this.mapStripeSubscriptionStatus(updatedStripeSubscription.status),
        currentPeriodStart: new Date(updatedStripeSubscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(updatedStripeSubscription.current_period_end * 1000).toISOString(),
        nextBillingDate: new Date(updatedStripeSubscription.current_period_end * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...subscription.metadata,
          upgradedFrom: updates.planId !== subscription.planId ? subscription.planId : undefined
        }
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updatedSubscription)
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      return updatedSubscription;
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async cancelSubscription(organizationId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    this.ensureInitialized();

    const subscription = await this.getSubscription(organizationId);
    if (!subscription) {
      throw new BillingError({
        type: BillingErrorType.SUBSCRIPTION_NOT_FOUND,
        message: 'Subscription not found',
        userMessage: 'Subscription not found'
      });
    }

    try {
      const canceledSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: cancelAtPeriodEnd,
          metadata: {
            canceled_by: 'customer',
            canceled_at: new Date().toISOString()
          }
        }
      );

      // Update in our database
      const updatedSubscription = {
        ...subscription,
        status: cancelAtPeriodEnd ? SubscriptionStatus.ACTIVE : SubscriptionStatus.CANCELED,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...subscription.metadata,
          canceledAt: new Date().toISOString(),
          cancelAtPeriodEnd
        }
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updatedSubscription)
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      return updatedSubscription;
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // Payment Methods
  async createSetupIntent(organizationId: string): Promise<{ clientSecret: string }> {
    this.ensureInitialized();

    const customer = await this.getCustomer(organizationId);
    if (!customer) {
      throw new BillingError({
        type: BillingErrorType.SUBSCRIPTION_NOT_FOUND,
        message: 'Customer not found',
        userMessage: 'Customer not found'
      });
    }

    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customer.stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      return { clientSecret: setupIntent.client_secret! };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async getPaymentMethods(organizationId: string): Promise<PaymentMethod[]> {
    this.ensureInitialized();

    const customer = await this.getCustomer(organizationId);
    if (!customer) {
      return [];
    }

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customer.stripeCustomerId,
        type: 'card'
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card' as const,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
          fingerprint: pm.card.fingerprint || ''
        } : undefined,
        billingDetails: {
          name: pm.billing_details.name,
          email: pm.billing_details.email,
          address: pm.billing_details.address ? {
            line1: pm.billing_details.address.line1 || '',
            line2: pm.billing_details.address.line2,
            city: pm.billing_details.address.city || '',
            state: pm.billing_details.address.state || '',
            postalCode: pm.billing_details.address.postal_code || '',
            country: pm.billing_details.address.country || ''
          } : undefined
        },
        isDefault: customer.defaultPaymentMethodId === pm.id,
        createdAt: new Date(pm.created * 1000).toISOString()
      }));
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // Billing Portal
  async createBillingPortalSession(organizationId: string, returnUrl: string): Promise<{ url: string }> {
    this.ensureInitialized();

    const customer = await this.getCustomer(organizationId);
    if (!customer) {
      throw new BillingError({
        type: BillingErrorType.SUBSCRIPTION_NOT_FOUND,
        message: 'Customer not found',
        userMessage: 'Customer not found'
      });
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: returnUrl
      });

      return { url: session.url };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // Invoices
  async getInvoices(organizationId: string, limit: number = 10): Promise<Invoice[]> {
    this.ensureInitialized();

    const customer = await this.getCustomer(organizationId);
    if (!customer) {
      return [];
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customer.stripeCustomerId,
        limit,
        expand: ['data.payment_intent']
      });

      return invoices.data.map(invoice => ({
        id: crypto.randomUUID(),
        organizationId,
        stripeInvoiceId: invoice.id,
        subscriptionId: invoice.subscription?.toString() || '',
        status: invoice.status as any,
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
        amountRemaining: invoice.amount_remaining,
        currency: invoice.currency,
        description: invoice.description,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        periodStart: new Date(invoice.period_start * 1000).toISOString(),
        periodEnd: new Date(invoice.period_end * 1000).toISOString(),
        dueDate: new Date(invoice.due_date! * 1000).toISOString(),
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : undefined,
        lineItems: invoice.lines.data.map(line => ({
          id: line.id,
          description: line.description || '',
          amount: line.amount,
          currency: line.currency,
          quantity: line.quantity || 1,
          unitAmount: line.unit_amount || 0,
          period: {
            start: new Date(line.period.start * 1000).toISOString(),
            end: new Date(line.period.end * 1000).toISOString()
          },
          proration: line.proration,
          metadata: line.metadata
        })),
        metadata: invoice.metadata,
        createdAt: new Date(invoice.created * 1000).toISOString()
      }));
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // Utility Methods
  private mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      case 'paused':
        return SubscriptionStatus.PAUSED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  async syncSubscriptionFromStripe(stripeSubscriptionId: string): Promise<void> {
    this.ensureInitialized();

    try {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      
      // Find organization from customer metadata
      const customer = await this.stripe.customers.retrieve(stripeSubscription.customer as string);
      const organizationId = (customer as any).metadata?.organizationId;

      if (!organizationId) {
        throw new Error('Organization ID not found in customer metadata');
      }

      // Update subscription in database
      const subscription = await this.getSubscription(organizationId);
      if (subscription) {
        const updatedSubscription = {
          ...subscription,
          status: this.mapStripeSubscriptionStatus(stripeSubscription.status),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : undefined,
          nextBillingDate: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        };

        await supabase
          .from('subscriptions')
          .update(updatedSubscription)
          .eq('stripe_subscription_id', stripeSubscriptionId);
      }
    } catch (error) {
      console.error('Failed to sync subscription from Stripe:', error);
      throw this.handleStripeError(error);
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();