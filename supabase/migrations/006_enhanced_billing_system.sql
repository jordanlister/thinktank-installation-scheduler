-- Enhanced Billing System Migration
-- Adds comprehensive billing tables for Stripe integration, usage tracking, and analytics

-- =====================================================
-- ENUMS FOR BILLING SYSTEM
-- =====================================================

-- Payment method types
CREATE TYPE payment_method_type AS ENUM ('card', 'us_bank_account', 'sepa_debit');

-- Invoice status types
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'uncollectible', 'void');

-- Payment intent status types
CREATE TYPE payment_intent_status AS ENUM (
  'requires_payment_method', 'requires_confirmation', 'requires_action', 
  'processing', 'requires_capture', 'canceled', 'succeeded'
);

-- Usage warning types
CREATE TYPE usage_warning_type AS ENUM (
  'approaching_limit', 'limit_exceeded', 'feature_disabled', 'upgrade_required'
);

-- Webhook event types
CREATE TYPE webhook_event_type AS ENUM (
  'customer.created', 'customer.updated', 'customer.deleted',
  'customer.subscription.created', 'customer.subscription.updated', 
  'customer.subscription.deleted', 'customer.subscription.trial_will_end',
  'payment_method.attached', 'payment_method.detached',
  'payment_intent.succeeded', 'payment_intent.payment_failed',
  'invoice.created', 'invoice.finalized', 'invoice.paid', 
  'invoice.payment_failed', 'invoice.upcoming',
  'setup_intent.succeeded', 'setup_intent.setup_failed'
);

-- =====================================================
-- STRIPE INTEGRATION TABLES
-- =====================================================

-- Stripe customers
CREATE TABLE stripe_customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_customer_id text UNIQUE NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    address jsonb,
    default_payment_method_id text,
    tax_ids jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT stripe_customers_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$')
);

-- Payment methods
CREATE TABLE payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_payment_method_id text UNIQUE NOT NULL,
    customer_id uuid NOT NULL REFERENCES stripe_customers(id) ON DELETE CASCADE,
    type payment_method_type NOT NULL,
    card_data jsonb, -- card brand, last4, exp_month, exp_year, fingerprint
    billing_details jsonb DEFAULT '{}',
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Payment intents
CREATE TABLE payment_intents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_payment_intent_id text UNIQUE NOT NULL,
    customer_id uuid NOT NULL REFERENCES stripe_customers(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount_cents integer NOT NULL,
    currency text DEFAULT 'USD',
    status payment_intent_status NOT NULL,
    payment_method_id text,
    client_secret text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT payment_intents_positive_amount CHECK (amount_cents >= 0)
);

-- Invoices
CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_invoice_id text UNIQUE NOT NULL,
    subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES stripe_customers(id) ON DELETE CASCADE,
    status invoice_status NOT NULL,
    amount_paid_cents integer DEFAULT 0,
    amount_due_cents integer DEFAULT 0,
    amount_remaining_cents integer DEFAULT 0,
    currency text DEFAULT 'USD',
    description text,
    hosted_invoice_url text,
    invoice_pdf_url text,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    due_date timestamptz,
    paid_at timestamptz,
    line_items jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT invoices_positive_amounts CHECK (
        amount_paid_cents >= 0 AND 
        amount_due_cents >= 0 AND 
        amount_remaining_cents >= 0
    )
);

-- =====================================================
-- USAGE TRACKING AND METRICS
-- =====================================================

-- Organization usage metrics
CREATE TABLE usage_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    projects_count integer DEFAULT 0,
    projects_limit integer DEFAULT 0,
    team_members_count integer DEFAULT 0,
    team_members_limit integer DEFAULT 0,
    installations_count integer DEFAULT 0,
    installations_limit integer DEFAULT 0,
    storage_gb numeric(10,2) DEFAULT 0,
    storage_limit_gb numeric(10,2) DEFAULT 0,
    api_requests_count integer DEFAULT 0,
    api_requests_limit integer DEFAULT 0,
    api_requests_reset_date timestamptz,
    feature_usage jsonb DEFAULT '{}',
    calculated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, period_start),
    CONSTRAINT usage_metrics_positive_counts CHECK (
        projects_count >= 0 AND team_members_count >= 0 AND 
        installations_count >= 0 AND storage_gb >= 0 AND 
        api_requests_count >= 0
    )
);

-- Usage warnings and alerts
CREATE TABLE usage_warnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type usage_warning_type NOT NULL,
    resource_type text NOT NULL,
    current_usage integer NOT NULL,
    limit_value integer NOT NULL,
    usage_percentage numeric(5,2) NOT NULL,
    severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message text NOT NULL,
    action_required boolean DEFAULT false,
    suggested_action text,
    acknowledged boolean DEFAULT false,
    acknowledged_at timestamptz,
    acknowledged_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT usage_warnings_valid_percentage CHECK (usage_percentage >= 0 AND usage_percentage <= 100)
);

-- Historical usage tracking for analytics
CREATE TABLE usage_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date date NOT NULL,
    metric_name text NOT NULL,
    metric_value numeric(15,4) NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, date, metric_name)
);

-- =====================================================
-- WEBHOOK EVENT PROCESSING
-- =====================================================

-- Webhook event logs
CREATE TABLE webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id text UNIQUE NOT NULL,
    event_type webhook_event_type NOT NULL,
    organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
    processed boolean DEFAULT false,
    processed_at timestamptz,
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    next_retry_at timestamptz,
    event_data jsonb NOT NULL,
    api_version text,
    livemode boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT webhook_events_valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

-- =====================================================
-- BILLING ANALYTICS AND REPORTING
-- =====================================================

-- Revenue tracking
CREATE TABLE revenue_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    date date NOT NULL,
    total_revenue_cents integer DEFAULT 0,
    recurring_revenue_cents integer DEFAULT 0,
    one_time_revenue_cents integer DEFAULT 0,
    refunds_cents integer DEFAULT 0,
    net_revenue_cents integer DEFAULT 0,
    currency text DEFAULT 'USD',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT revenue_metrics_positive_values CHECK (
        total_revenue_cents >= 0 AND recurring_revenue_cents >= 0 AND 
        one_time_revenue_cents >= 0 AND refunds_cents >= 0
    )
);

-- Subscription analytics
CREATE TABLE subscription_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    plan_id text NOT NULL,
    new_subscriptions integer DEFAULT 0,
    canceled_subscriptions integer DEFAULT 0,
    upgraded_subscriptions integer DEFAULT 0,
    downgraded_subscriptions integer DEFAULT 0,
    active_subscriptions integer DEFAULT 0,
    trial_subscriptions integer DEFAULT 0,
    revenue_cents integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(date, plan_id)
);

-- Customer analytics
CREATE TABLE customer_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    new_customers integer DEFAULT 0,
    churned_customers integer DEFAULT 0,
    active_customers integer DEFAULT 0,
    total_customers integer DEFAULT 0,
    average_revenue_per_user_cents integer DEFAULT 0,
    customer_lifetime_value_cents integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(date)
);

-- =====================================================
-- ENHANCED SUBSCRIPTIONS TABLE UPDATES
-- =====================================================

-- Add additional columns to existing subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_amount_cents integer DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tax_percentage numeric(5,2) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS collection_method text DEFAULT 'charge_automatically';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS days_until_due integer;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS default_tax_rates text[];

-- Update metadata column to be more structured if it doesn't exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_thresholds jsonb DEFAULT '{}';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pending_setup_intent text;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Stripe customers indexes
CREATE INDEX idx_stripe_customers_org_id ON stripe_customers(organization_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_email ON stripe_customers(email);

-- Payment methods indexes
CREATE INDEX idx_payment_methods_org_id ON payment_methods(organization_id);
CREATE INDEX idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(is_default) WHERE is_default = true;

-- Payment intents indexes
CREATE INDEX idx_payment_intents_org_id ON payment_intents(organization_id);
CREATE INDEX idx_payment_intents_customer_id ON payment_intents(customer_id);
CREATE INDEX idx_payment_intents_subscription_id ON payment_intents(subscription_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_created_at ON payment_intents(created_at);

-- Invoices indexes
CREATE INDEX idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- Usage metrics indexes
CREATE INDEX idx_usage_metrics_org_id ON usage_metrics(organization_id);
CREATE INDEX idx_usage_metrics_period ON usage_metrics(period_start, period_end);
CREATE INDEX idx_usage_metrics_calculated_at ON usage_metrics(calculated_at);

-- Usage warnings indexes
CREATE INDEX idx_usage_warnings_org_id ON usage_warnings(organization_id);
CREATE INDEX idx_usage_warnings_type ON usage_warnings(type);
CREATE INDEX idx_usage_warnings_severity ON usage_warnings(severity);
CREATE INDEX idx_usage_warnings_acknowledged ON usage_warnings(acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_usage_warnings_created_at ON usage_warnings(created_at);

-- Usage history indexes
CREATE INDEX idx_usage_history_org_date ON usage_history(organization_id, date);
CREATE INDEX idx_usage_history_metric ON usage_history(metric_name);
CREATE INDEX idx_usage_history_date ON usage_history(date);

-- Webhook events indexes
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_org_id ON webhook_events(organization_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed) WHERE processed = false;
CREATE INDEX idx_webhook_events_retry ON webhook_events(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- Analytics indexes
CREATE INDEX idx_revenue_metrics_org_date ON revenue_metrics(organization_id, date);
CREATE INDEX idx_revenue_metrics_date ON revenue_metrics(date);

CREATE INDEX idx_subscription_analytics_date_plan ON subscription_analytics(date, plan_id);
CREATE INDEX idx_subscription_analytics_date ON subscription_analytics(date);

CREATE INDEX idx_customer_analytics_date ON customer_analytics(date);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Triggers for updated_at on billing tables
CREATE TRIGGER update_stripe_customers_updated_at 
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER update_payment_intents_updated_at 
    BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();

-- Function to calculate usage metrics
CREATE OR REPLACE FUNCTION calculate_usage_metrics(org_id uuid, start_date timestamptz, end_date timestamptz)
RETURNS void AS $$
DECLARE
    projects_count integer;
    team_members_count integer;
    installations_count integer;
    storage_usage numeric;
    current_subscription record;
BEGIN
    -- Get current subscription for limits
    SELECT * INTO current_subscription 
    FROM subscriptions 
    WHERE organization_id = org_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Count projects
    SELECT COUNT(*) INTO projects_count
    FROM projects 
    WHERE organization_id = org_id AND is_active = true;
    
    -- Count team members
    SELECT COUNT(*) INTO team_members_count
    FROM team_members 
    WHERE organization_id = org_id;
    
    -- Count installations in period
    SELECT COUNT(*) INTO installations_count
    FROM installations 
    WHERE organization_id = org_id 
    AND created_at BETWEEN start_date AND end_date;
    
    -- Calculate storage usage (placeholder - would need actual file storage calculation)
    storage_usage := 0;
    
    -- Insert or update usage metrics
    INSERT INTO usage_metrics (
        organization_id,
        period_start,
        period_end,
        projects_count,
        projects_limit,
        team_members_count,
        team_members_limit,
        installations_count,
        installations_limit,
        storage_gb,
        storage_limit_gb,
        calculated_at
    ) VALUES (
        org_id,
        start_date,
        end_date,
        projects_count,
        CASE 
            WHEN current_subscription.plan_id = 'free' THEN 1
            WHEN current_subscription.plan_id = 'professional' THEN 10
            ELSE -1 -- unlimited
        END,
        team_members_count,
        CASE 
            WHEN current_subscription.plan_id = 'free' THEN 5
            WHEN current_subscription.plan_id = 'professional' THEN 25
            ELSE -1 -- unlimited
        END,
        installations_count,
        CASE 
            WHEN current_subscription.plan_id = 'free' THEN 100
            WHEN current_subscription.plan_id = 'professional' THEN 2500
            ELSE -1 -- unlimited
        END,
        storage_usage,
        CASE 
            WHEN current_subscription.plan_id = 'free' THEN 1
            WHEN current_subscription.plan_id = 'professional' THEN 10
            ELSE 100
        END,
        now()
    )
    ON CONFLICT (organization_id, period_start) 
    DO UPDATE SET
        projects_count = EXCLUDED.projects_count,
        team_members_count = EXCLUDED.team_members_count,
        installations_count = EXCLUDED.installations_count,
        storage_gb = EXCLUDED.storage_gb,
        calculated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to generate usage warnings
CREATE OR REPLACE FUNCTION generate_usage_warnings(org_id uuid)
RETURNS void AS $$
DECLARE
    current_metrics record;
    warning_threshold numeric := 0.8; -- 80% threshold
    critical_threshold numeric := 0.95; -- 95% threshold
BEGIN
    -- Get latest usage metrics
    SELECT * INTO current_metrics
    FROM usage_metrics
    WHERE organization_id = org_id
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    IF current_metrics IS NULL THEN
        RETURN;
    END IF;
    
    -- Clear existing warnings for this organization
    DELETE FROM usage_warnings WHERE organization_id = org_id;
    
    -- Check projects usage
    IF current_metrics.projects_limit > 0 THEN
        DECLARE
            projects_percentage numeric := current_metrics.projects_count::numeric / current_metrics.projects_limit;
        BEGIN
            IF projects_percentage >= critical_threshold THEN
                INSERT INTO usage_warnings (organization_id, type, resource_type, current_usage, limit_value, usage_percentage, severity, message, action_required, suggested_action)
                VALUES (org_id, 'limit_exceeded', 'projects', current_metrics.projects_count, current_metrics.projects_limit, projects_percentage * 100, 'critical', 
                       'You have reached your project limit. Consider upgrading your plan.', true, 'Upgrade to Professional or Enterprise plan');
            ELSIF projects_percentage >= warning_threshold THEN
                INSERT INTO usage_warnings (organization_id, type, resource_type, current_usage, limit_value, usage_percentage, severity, message, action_required, suggested_action)
                VALUES (org_id, 'approaching_limit', 'projects', current_metrics.projects_count, current_metrics.projects_limit, projects_percentage * 100, 'warning', 
                       'You are approaching your project limit.', false, 'Consider upgrading your plan');
            END IF;
        END;
    END IF;
    
    -- Check team members usage
    IF current_metrics.team_members_limit > 0 THEN
        DECLARE
            team_percentage numeric := current_metrics.team_members_count::numeric / current_metrics.team_members_limit;
        BEGIN
            IF team_percentage >= critical_threshold THEN
                INSERT INTO usage_warnings (organization_id, type, resource_type, current_usage, limit_value, usage_percentage, severity, message, action_required, suggested_action)
                VALUES (org_id, 'limit_exceeded', 'team_members', current_metrics.team_members_count, current_metrics.team_members_limit, team_percentage * 100, 'critical', 
                       'You have reached your team member limit. Consider upgrading your plan.', true, 'Upgrade to Professional or Enterprise plan');
            ELSIF team_percentage >= warning_threshold THEN
                INSERT INTO usage_warnings (organization_id, type, resource_type, current_usage, limit_value, usage_percentage, severity, message, action_required, suggested_action)
                VALUES (org_id, 'approaching_limit', 'team_members', current_metrics.team_members_count, current_metrics.team_members_limit, team_percentage * 100, 'warning', 
                       'You are approaching your team member limit.', false, 'Consider upgrading your plan');
            END IF;
        END;
    END IF;
    
    -- Similar checks for installations and storage could be added here
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all billing tables
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization-scoped access
CREATE POLICY "Organizations can manage their Stripe customers"
    ON stripe_customers FOR ALL
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can manage their payment methods"
    ON payment_methods FOR ALL
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their payment intents"
    ON payment_intents FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their invoices"
    ON invoices FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their usage metrics"
    ON usage_metrics FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can manage their usage warnings"
    ON usage_warnings FOR ALL
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

-- Service role policies for system operations
CREATE POLICY "Service role can manage all billing data"
    ON stripe_customers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all payment methods"
    ON payment_methods FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all payment intents"
    ON payment_intents FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all invoices"
    ON invoices FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all usage data"
    ON usage_metrics FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all webhook events"
    ON webhook_events FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- INITIAL DATA AND CLEANUP
-- =====================================================

-- Create initial usage metrics for existing organizations
INSERT INTO usage_metrics (organization_id, period_start, period_end)
SELECT 
    id,
    date_trunc('month', created_at) as period_start,
    (date_trunc('month', created_at) + interval '1 month - 1 day')::timestamptz as period_end
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM usage_metrics WHERE organization_id = organizations.id
);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE stripe_customers IS 'Stores Stripe customer data linked to organizations';
COMMENT ON TABLE payment_methods IS 'Payment methods associated with Stripe customers';
COMMENT ON TABLE payment_intents IS 'Payment intents for processing payments';
COMMENT ON TABLE invoices IS 'Invoice records from Stripe';
COMMENT ON TABLE usage_metrics IS 'Real-time usage tracking for subscription limits';
COMMENT ON TABLE usage_warnings IS 'Automated warnings for usage limit violations';
COMMENT ON TABLE usage_history IS 'Historical usage data for analytics';
COMMENT ON TABLE webhook_events IS 'Stripe webhook event processing log';
COMMENT ON TABLE revenue_metrics IS 'Revenue analytics and reporting data';
COMMENT ON TABLE subscription_analytics IS 'Subscription-specific analytics data';
COMMENT ON TABLE customer_analytics IS 'Customer lifecycle analytics data';

COMMENT ON FUNCTION calculate_usage_metrics(uuid, timestamptz, timestamptz) IS 'Calculates current usage metrics for an organization';
COMMENT ON FUNCTION generate_usage_warnings(uuid) IS 'Generates usage warnings based on current metrics and thresholds';