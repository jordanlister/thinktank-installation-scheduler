-- Subscription Lifecycle Automation Migration
-- Adds tables and functions for automated subscription lifecycle management

-- =====================================================
-- LIFECYCLE TASK TYPES
-- =====================================================

CREATE TYPE lifecycle_task_type AS ENUM (
  'trial_expiring',
  'trial_expired',
  'payment_failed',
  'payment_overdue',
  'subscription_downgrade',
  'usage_limit_exceeded',
  'subscription_renewal',
  'payment_retry'
);

CREATE TYPE lifecycle_task_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

-- =====================================================
-- SUBSCRIPTION LIFECYCLE TASKS TABLE
-- =====================================================

CREATE TABLE subscription_lifecycle_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type lifecycle_task_type NOT NULL,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_id text, -- Stripe invoice ID for payment-related tasks
    
    -- Scheduling
    scheduled_for timestamptz NOT NULL,
    executed_at timestamptz,
    
    -- Retry logic
    attempt_count integer DEFAULT 1,
    max_attempts integer DEFAULT 3,
    
    -- Status and results
    status lifecycle_task_status DEFAULT 'pending',
    error_message text,
    
    -- Task data
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_attempt_count CHECK (attempt_count >= 1 AND attempt_count <= max_attempts),
    CONSTRAINT scheduled_for_future CHECK (scheduled_for >= created_at)
);

-- =====================================================
-- SUBSCRIPTION LIFECYCLE EVENTS LOG
-- =====================================================

CREATE TABLE subscription_lifecycle_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}',
    
    -- Event context
    triggered_by text, -- 'system', 'user', 'webhook', etc.
    task_id uuid REFERENCES subscription_lifecycle_tasks(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Indexes for querying
    CONSTRAINT valid_event_type CHECK (event_type ~ '^[a-z_]+$')
);

-- =====================================================
-- PAYMENT RETRY CONFIGURATIONS
-- =====================================================

CREATE TABLE payment_retry_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Retry settings
    max_retries integer DEFAULT 3,
    retry_delays integer[] DEFAULT ARRAY[3, 7, 14], -- days between retries
    grace_period_days integer DEFAULT 30,
    
    -- Downgrade settings
    downgrade_after_failures boolean DEFAULT true,
    downgrade_to_plan text DEFAULT 'free',
    
    -- Notification settings
    notify_on_failure boolean DEFAULT true,
    notification_recipients text[] DEFAULT ARRAY[]::text[],
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_max_retries CHECK (max_retries >= 0 AND max_retries <= 10),
    CONSTRAINT valid_grace_period CHECK (grace_period_days >= 0 AND grace_period_days <= 365),
    CONSTRAINT valid_retry_delays CHECK (array_length(retry_delays, 1) <= 10),
    
    -- One config per organization
    UNIQUE(organization_id)
);

-- =====================================================
-- SUBSCRIPTION DOWNGRADE HISTORY
-- =====================================================

CREATE TABLE subscription_downgrade_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Downgrade details
    from_plan text NOT NULL,
    to_plan text NOT NULL,
    reason text NOT NULL,
    
    -- Financial impact
    amount_credited_cents integer DEFAULT 0,
    refund_issued boolean DEFAULT false,
    refund_amount_cents integer DEFAULT 0,
    
    -- Context
    initiated_by text, -- 'system', 'user', 'admin'
    task_id uuid REFERENCES subscription_lifecycle_tasks(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    downgraded_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_amounts CHECK (
        amount_credited_cents >= 0 AND 
        refund_amount_cents >= 0 AND
        (refund_issued = false OR refund_amount_cents > 0)
    )
);

-- =====================================================
-- SUBSCRIPTION LIFECYCLE METRICS
-- =====================================================

CREATE TABLE subscription_lifecycle_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    
    -- Task metrics
    tasks_created integer DEFAULT 0,
    tasks_completed integer DEFAULT 0,
    tasks_failed integer DEFAULT 0,
    
    -- Subscription lifecycle metrics
    trials_started integer DEFAULT 0,
    trials_converted integer DEFAULT 0,
    trials_expired integer DEFAULT 0,
    
    -- Payment metrics
    payment_failures integer DEFAULT 0,
    payment_retries_attempted integer DEFAULT 0,
    payment_retries_successful integer DEFAULT 0,
    
    -- Downgrade metrics
    downgrades_scheduled integer DEFAULT 0,
    downgrades_executed integer DEFAULT 0,
    downgrades_prevented integer DEFAULT 0,
    
    -- Revenue impact
    revenue_lost_cents integer DEFAULT 0,
    revenue_recovered_cents integer DEFAULT 0,
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(date),
    CONSTRAINT valid_metrics CHECK (
        tasks_created >= 0 AND tasks_completed >= 0 AND tasks_failed >= 0 AND
        trials_started >= 0 AND trials_converted >= 0 AND trials_expired >= 0 AND
        payment_failures >= 0 AND payment_retries_attempted >= 0 AND payment_retries_successful >= 0 AND
        downgrades_scheduled >= 0 AND downgrades_executed >= 0 AND downgrades_prevented >= 0 AND
        revenue_lost_cents >= 0 AND revenue_recovered_cents >= 0
    )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Lifecycle tasks indexes
CREATE INDEX idx_lifecycle_tasks_org_id ON subscription_lifecycle_tasks(organization_id);
CREATE INDEX idx_lifecycle_tasks_subscription_id ON subscription_lifecycle_tasks(subscription_id);
CREATE INDEX idx_lifecycle_tasks_type ON subscription_lifecycle_tasks(type);
CREATE INDEX idx_lifecycle_tasks_status ON subscription_lifecycle_tasks(status);
CREATE INDEX idx_lifecycle_tasks_scheduled ON subscription_lifecycle_tasks(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_lifecycle_tasks_created_at ON subscription_lifecycle_tasks(created_at);
CREATE INDEX idx_lifecycle_tasks_pending_due ON subscription_lifecycle_tasks(scheduled_for, status) 
    WHERE status = 'pending';

-- Lifecycle events indexes
CREATE INDEX idx_lifecycle_events_org_id ON subscription_lifecycle_events(organization_id);
CREATE INDEX idx_lifecycle_events_subscription_id ON subscription_lifecycle_events(subscription_id);
CREATE INDEX idx_lifecycle_events_type ON subscription_lifecycle_events(event_type);
CREATE INDEX idx_lifecycle_events_created_at ON subscription_lifecycle_events(created_at);
CREATE INDEX idx_lifecycle_events_task_id ON subscription_lifecycle_events(task_id);

-- Payment retry configs indexes
CREATE INDEX idx_payment_retry_org_id ON payment_retry_configs(organization_id);

-- Downgrade history indexes
CREATE INDEX idx_downgrade_history_org_id ON subscription_downgrade_history(organization_id);
CREATE INDEX idx_downgrade_history_subscription_id ON subscription_downgrade_history(subscription_id);
CREATE INDEX idx_downgrade_history_reason ON subscription_downgrade_history(reason);
CREATE INDEX idx_downgrade_history_date ON subscription_downgrade_history(downgraded_at);

-- Lifecycle metrics indexes
CREATE INDEX idx_lifecycle_metrics_date ON subscription_lifecycle_metrics(date);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lifecycle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_lifecycle_tasks_updated_at 
    BEFORE UPDATE ON subscription_lifecycle_tasks
    FOR EACH ROW EXECUTE FUNCTION update_lifecycle_updated_at();

CREATE TRIGGER update_payment_retry_configs_updated_at 
    BEFORE UPDATE ON payment_retry_configs
    FOR EACH ROW EXECUTE FUNCTION update_lifecycle_updated_at();

-- Function to log lifecycle events
CREATE OR REPLACE FUNCTION log_lifecycle_event(
    p_organization_id uuid,
    p_subscription_id uuid,
    p_event_type text,
    p_event_data jsonb DEFAULT '{}',
    p_triggered_by text DEFAULT 'system',
    p_task_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    event_id uuid;
BEGIN
    INSERT INTO subscription_lifecycle_events (
        organization_id,
        subscription_id,
        event_type,
        event_data,
        triggered_by,
        task_id
    ) VALUES (
        p_organization_id,
        p_subscription_id,
        p_event_type,
        p_event_data,
        p_triggered_by,
        p_task_id
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create lifecycle task
CREATE OR REPLACE FUNCTION create_lifecycle_task(
    p_type lifecycle_task_type,
    p_organization_id uuid,
    p_subscription_id uuid DEFAULT NULL,
    p_invoice_id text DEFAULT NULL,
    p_scheduled_for timestamptz DEFAULT now(),
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    task_id uuid;
BEGIN
    -- Check if similar pending task exists
    IF EXISTS (
        SELECT 1 FROM subscription_lifecycle_tasks 
        WHERE type = p_type 
        AND organization_id = p_organization_id 
        AND status = 'pending'
        AND scheduled_for >= now()
    ) THEN
        -- Return NULL if similar task already exists
        RETURN NULL;
    END IF;
    
    -- Create new task
    INSERT INTO subscription_lifecycle_tasks (
        type,
        organization_id,
        subscription_id,
        invoice_id,
        scheduled_for,
        metadata
    ) VALUES (
        p_type,
        p_organization_id,
        p_subscription_id,
        p_invoice_id,
        p_scheduled_for,
        p_metadata
    ) RETURNING id INTO task_id;
    
    -- Log the task creation
    PERFORM log_lifecycle_event(
        p_organization_id,
        p_subscription_id,
        'task_created',
        jsonb_build_object(
            'task_id', task_id,
            'task_type', p_type,
            'scheduled_for', p_scheduled_for
        )
    );
    
    RETURN task_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending tasks ready for processing
CREATE OR REPLACE FUNCTION get_pending_lifecycle_tasks()
RETURNS TABLE (
    id uuid,
    type lifecycle_task_type,
    organization_id uuid,
    subscription_id uuid,
    invoice_id text,
    scheduled_for timestamptz,
    attempt_count integer,
    max_attempts integer,
    metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.type,
        t.organization_id,
        t.subscription_id,
        t.invoice_id,
        t.scheduled_for,
        t.attempt_count,
        t.max_attempts,
        t.metadata
    FROM subscription_lifecycle_tasks t
    WHERE t.status = 'pending'
    AND t.scheduled_for <= now()
    ORDER BY t.scheduled_for ASC, t.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily lifecycle metrics
CREATE OR REPLACE FUNCTION update_lifecycle_metrics(p_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
    metrics_record record;
BEGIN
    -- Calculate daily metrics
    SELECT 
        -- Task metrics
        COUNT(*) FILTER (WHERE status = 'pending') as tasks_created,
        COUNT(*) FILTER (WHERE status = 'completed') as tasks_completed,
        COUNT(*) FILTER (WHERE status = 'failed') as tasks_failed,
        
        -- Subscription metrics
        COUNT(*) FILTER (WHERE type = 'trial_expiring') as trials_expiring,
        COUNT(*) FILTER (WHERE type = 'trial_expired') as trials_expired,
        
        -- Payment metrics
        COUNT(*) FILTER (WHERE type = 'payment_failed') as payment_failures,
        COUNT(*) FILTER (WHERE type = 'payment_retry') as payment_retries,
        
        -- Downgrade metrics
        COUNT(*) FILTER (WHERE type = 'subscription_downgrade') as downgrades_scheduled
    INTO metrics_record
    FROM subscription_lifecycle_tasks
    WHERE DATE(created_at) = p_date;
    
    -- Upsert metrics
    INSERT INTO subscription_lifecycle_metrics (
        date,
        tasks_created,
        tasks_completed,
        tasks_failed,
        payment_failures,
        payment_retries_attempted,
        downgrades_scheduled
    ) VALUES (
        p_date,
        COALESCE(metrics_record.tasks_created, 0),
        COALESCE(metrics_record.tasks_completed, 0),
        COALESCE(metrics_record.tasks_failed, 0),
        COALESCE(metrics_record.payment_failures, 0),
        COALESCE(metrics_record.payment_retries, 0),
        COALESCE(metrics_record.downgrades_scheduled, 0)
    )
    ON CONFLICT (date) 
    DO UPDATE SET
        tasks_created = EXCLUDED.tasks_created,
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_failed = EXCLUDED.tasks_failed,
        payment_failures = EXCLUDED.payment_failures,
        payment_retries_attempted = EXCLUDED.payment_retries_attempted,
        downgrades_scheduled = EXCLUDED.downgrades_scheduled;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old completed tasks
CREATE OR REPLACE FUNCTION cleanup_old_lifecycle_tasks(days_old integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM subscription_lifecycle_tasks
    WHERE status IN ('completed', 'failed')
    AND updated_at < (now() - (days_old || ' days')::interval);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on lifecycle tables
ALTER TABLE subscription_lifecycle_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_retry_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_downgrade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_lifecycle_metrics ENABLE ROW LEVEL SECURITY;

-- Organization-scoped access policies
CREATE POLICY "Organizations can view their lifecycle tasks"
    ON subscription_lifecycle_tasks FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their lifecycle events"
    ON subscription_lifecycle_events FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can manage their retry configs"
    ON payment_retry_configs FOR ALL
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their downgrade history"
    ON subscription_downgrade_history FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

-- Service role policies for system operations
CREATE POLICY "Service role can manage all lifecycle data"
    ON subscription_lifecycle_tasks FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all lifecycle events"
    ON subscription_lifecycle_events FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all retry configs"
    ON payment_retry_configs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all downgrade history"
    ON subscription_downgrade_history FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all lifecycle metrics"
    ON subscription_lifecycle_metrics FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Create default payment retry configurations for existing organizations
INSERT INTO payment_retry_configs (organization_id)
SELECT id FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM payment_retry_configs WHERE organization_id = organizations.id
);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE subscription_lifecycle_tasks IS 'Automated tasks for subscription lifecycle management';
COMMENT ON TABLE subscription_lifecycle_events IS 'Log of all subscription lifecycle events';
COMMENT ON TABLE payment_retry_configs IS 'Payment retry configuration per organization';
COMMENT ON TABLE subscription_downgrade_history IS 'History of subscription downgrades';
COMMENT ON TABLE subscription_lifecycle_metrics IS 'Daily metrics for lifecycle automation';

COMMENT ON FUNCTION create_lifecycle_task(lifecycle_task_type, uuid, uuid, text, timestamptz, jsonb) IS 'Creates a new lifecycle task with deduplication';
COMMENT ON FUNCTION get_pending_lifecycle_tasks() IS 'Returns all pending lifecycle tasks ready for processing';
COMMENT ON FUNCTION update_lifecycle_metrics(date) IS 'Updates daily lifecycle metrics';
COMMENT ON FUNCTION cleanup_old_lifecycle_tasks(integer) IS 'Cleans up old completed/failed lifecycle tasks';