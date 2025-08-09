-- Billing Error Handling and Logging Migration
-- Adds comprehensive error logging and monitoring for billing operations

-- =====================================================
-- BILLING ERROR TYPES
-- =====================================================

CREATE TYPE billing_error_type AS ENUM (
  'stripe_api_error',
  'payment_declined',
  'insufficient_funds',
  'card_expired',
  'invalid_cvc',
  'processing_error',
  'rate_limited',
  'connection_error',
  'service_unavailable',
  'subscription_not_found',
  'invalid_plan',
  'usage_limit_exceeded',
  'validation_error',
  'database_error',
  'unknown_error'
);

CREATE TYPE billing_operation AS ENUM (
  'create_subscription',
  'update_subscription',
  'cancel_subscription',
  'create_customer',
  'update_customer',
  'create_payment_method',
  'update_payment_method',
  'delete_payment_method',
  'process_payment',
  'create_invoice',
  'webhook_processing',
  'usage_tracking',
  'other'
);

CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- =====================================================
-- BILLING ERROR LOGS TABLE
-- =====================================================

CREATE TABLE billing_error_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Error classification
    operation billing_operation NOT NULL,
    error_type billing_error_type NOT NULL,
    error_code text,
    
    -- Error details
    error_message text NOT NULL,
    user_message text NOT NULL,
    severity error_severity NOT NULL,
    retryable boolean DEFAULT false,
    retry_count integer DEFAULT 0,
    
    -- Context information
    context jsonb DEFAULT '{}',
    stack_trace text,
    
    -- Stripe-specific data
    stripe_request_id text,
    stripe_error_code text,
    stripe_error_type text,
    
    -- Request context
    user_agent text,
    ip_address inet,
    request_id text,
    
    -- Resolution tracking
    resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolution_notes text,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_retry_count CHECK (retry_count >= 0),
    CONSTRAINT resolved_has_timestamp CHECK (
        (resolved = false AND resolved_at IS NULL) OR
        (resolved = true AND resolved_at IS NOT NULL)
    )
);

-- =====================================================
-- BILLING RETRY ATTEMPTS TABLE
-- =====================================================

CREATE TABLE billing_retry_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    error_log_id uuid REFERENCES billing_error_logs(id) ON DELETE CASCADE,
    
    -- Retry details
    operation billing_operation NOT NULL,
    error_type billing_error_type NOT NULL,
    attempt_number integer NOT NULL,
    delay_ms integer NOT NULL,
    
    -- Scheduling
    scheduled_for timestamptz NOT NULL,
    executed_at timestamptz,
    
    -- Results
    success boolean,
    error_message text,
    
    -- Context
    error_context jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_attempt_number CHECK (attempt_number > 0),
    CONSTRAINT valid_delay CHECK (delay_ms >= 0),
    CONSTRAINT executed_has_result CHECK (
        (executed_at IS NULL AND success IS NULL) OR
        (executed_at IS NOT NULL AND success IS NOT NULL)
    )
);

-- =====================================================
-- BILLING ERROR RECOVERIES TABLE
-- =====================================================

CREATE TABLE billing_error_recoveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    error_log_id uuid REFERENCES billing_error_logs(id) ON DELETE CASCADE,
    
    -- Recovery details
    operation billing_operation NOT NULL,
    error_type billing_error_type NOT NULL,
    original_error text NOT NULL,
    attempts_to_success integer NOT NULL,
    
    -- Recovery context
    recovery_method text, -- 'automatic_retry', 'manual_intervention', 'user_action'
    recovery_notes text,
    
    -- Timestamps
    recovered_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_attempts CHECK (attempts_to_success > 0)
);

-- =====================================================
-- BILLING ERROR PATTERNS TABLE
-- =====================================================

CREATE TABLE billing_error_patterns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern identification
    error_type billing_error_type NOT NULL,
    operation billing_operation NOT NULL,
    error_signature text NOT NULL, -- Hash or key to identify similar errors
    
    -- Pattern statistics
    occurrence_count integer DEFAULT 1,
    first_occurrence timestamptz DEFAULT now(),
    last_occurrence timestamptz DEFAULT now(),
    
    -- Pattern analysis
    common_context jsonb DEFAULT '{}',
    affected_organizations uuid[] DEFAULT ARRAY[]::uuid[],
    resolution_success_rate numeric(5,2) DEFAULT 0,
    
    -- Pattern metadata
    severity error_severity NOT NULL,
    auto_resolved boolean DEFAULT false,
    requires_investigation boolean DEFAULT false,
    
    -- Notes and actions
    investigation_notes text,
    preventive_actions text,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(error_type, operation, error_signature),
    CONSTRAINT valid_occurrence_count CHECK (occurrence_count > 0),
    CONSTRAINT valid_success_rate CHECK (resolution_success_rate >= 0 AND resolution_success_rate <= 100)
);

-- =====================================================
-- BILLING ERROR METRICS TABLE
-- =====================================================

CREATE TABLE billing_error_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Error counts by type
    total_errors integer DEFAULT 0,
    stripe_api_errors integer DEFAULT 0,
    payment_errors integer DEFAULT 0,
    validation_errors integer DEFAULT 0,
    system_errors integer DEFAULT 0,
    
    -- Error counts by severity
    critical_errors integer DEFAULT 0,
    high_severity_errors integer DEFAULT 0,
    medium_severity_errors integer DEFAULT 0,
    low_severity_errors integer DEFAULT 0,
    
    -- Retry statistics
    total_retries integer DEFAULT 0,
    successful_retries integer DEFAULT 0,
    failed_retries integer DEFAULT 0,
    retry_success_rate numeric(5,2) DEFAULT 0,
    
    -- Recovery statistics
    auto_resolved_errors integer DEFAULT 0,
    manual_resolved_errors integer DEFAULT 0,
    unresolved_errors integer DEFAULT 0,
    
    -- Performance impact
    avg_resolution_time_minutes numeric(10,2) DEFAULT 0,
    max_resolution_time_minutes numeric(10,2) DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(date, organization_id),
    CONSTRAINT valid_error_counts CHECK (
        total_errors >= 0 AND stripe_api_errors >= 0 AND payment_errors >= 0 AND 
        validation_errors >= 0 AND system_errors >= 0 AND
        critical_errors >= 0 AND high_severity_errors >= 0 AND 
        medium_severity_errors >= 0 AND low_severity_errors >= 0 AND
        total_retries >= 0 AND successful_retries >= 0 AND failed_retries >= 0 AND
        auto_resolved_errors >= 0 AND manual_resolved_errors >= 0 AND unresolved_errors >= 0
    ),
    CONSTRAINT valid_success_rate CHECK (retry_success_rate >= 0 AND retry_success_rate <= 100)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Error logs indexes
CREATE INDEX idx_billing_error_logs_org_id ON billing_error_logs(organization_id);
CREATE INDEX idx_billing_error_logs_user_id ON billing_error_logs(user_id);
CREATE INDEX idx_billing_error_logs_operation ON billing_error_logs(operation);
CREATE INDEX idx_billing_error_logs_error_type ON billing_error_logs(error_type);
CREATE INDEX idx_billing_error_logs_severity ON billing_error_logs(severity);
CREATE INDEX idx_billing_error_logs_created_at ON billing_error_logs(created_at);
CREATE INDEX idx_billing_error_logs_resolved ON billing_error_logs(resolved) WHERE resolved = false;
CREATE INDEX idx_billing_error_logs_stripe_request_id ON billing_error_logs(stripe_request_id) WHERE stripe_request_id IS NOT NULL;

-- Retry attempts indexes
CREATE INDEX idx_retry_attempts_org_id ON billing_retry_attempts(organization_id);
CREATE INDEX idx_retry_attempts_error_log_id ON billing_retry_attempts(error_log_id);
CREATE INDEX idx_retry_attempts_scheduled ON billing_retry_attempts(scheduled_for) WHERE executed_at IS NULL;
CREATE INDEX idx_retry_attempts_operation ON billing_retry_attempts(operation);
CREATE INDEX idx_retry_attempts_created_at ON billing_retry_attempts(created_at);

-- Error recoveries indexes
CREATE INDEX idx_error_recoveries_org_id ON billing_error_recoveries(organization_id);
CREATE INDEX idx_error_recoveries_error_log_id ON billing_error_recoveries(error_log_id);
CREATE INDEX idx_error_recoveries_operation ON billing_error_recoveries(operation);
CREATE INDEX idx_error_recoveries_recovered_at ON billing_error_recoveries(recovered_at);

-- Error patterns indexes
CREATE INDEX idx_error_patterns_error_type ON billing_error_patterns(error_type);
CREATE INDEX idx_error_patterns_operation ON billing_error_patterns(operation);
CREATE INDEX idx_error_patterns_signature ON billing_error_patterns(error_signature);
CREATE INDEX idx_error_patterns_occurrence_count ON billing_error_patterns(occurrence_count);
CREATE INDEX idx_error_patterns_last_occurrence ON billing_error_patterns(last_occurrence);
CREATE INDEX idx_error_patterns_investigation ON billing_error_patterns(requires_investigation) WHERE requires_investigation = true;

-- Error metrics indexes
CREATE INDEX idx_error_metrics_date ON billing_error_metrics(date);
CREATE INDEX idx_error_metrics_org_date ON billing_error_metrics(organization_id, date);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Trigger for error patterns updated_at
CREATE TRIGGER update_error_patterns_updated_at 
    BEFORE UPDATE ON billing_error_patterns
    FOR EACH ROW EXECUTE FUNCTION update_error_patterns_updated_at();

-- Function to log billing error
CREATE OR REPLACE FUNCTION log_billing_error(
    p_organization_id uuid,
    p_user_id uuid,
    p_operation billing_operation,
    p_error_type billing_error_type,
    p_error_message text,
    p_user_message text,
    p_severity error_severity DEFAULT 'medium',
    p_retryable boolean DEFAULT false,
    p_context jsonb DEFAULT '{}',
    p_stripe_request_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    error_id uuid;
    error_signature text;
BEGIN
    -- Create error signature for pattern tracking
    error_signature := md5(p_operation::text || ':' || p_error_type::text || ':' || p_error_message);
    
    -- Insert error log
    INSERT INTO billing_error_logs (
        organization_id,
        user_id,
        operation,
        error_type,
        error_message,
        user_message,
        severity,
        retryable,
        context,
        stripe_request_id
    ) VALUES (
        p_organization_id,
        p_user_id,
        p_operation,
        p_error_type,
        p_error_message,
        p_user_message,
        p_severity,
        p_retryable,
        p_context,
        p_stripe_request_id
    ) RETURNING id INTO error_id;
    
    -- Update or create error pattern
    INSERT INTO billing_error_patterns (
        error_type,
        operation,
        error_signature,
        occurrence_count,
        first_occurrence,
        last_occurrence,
        severity,
        affected_organizations
    ) VALUES (
        p_error_type,
        p_operation,
        error_signature,
        1,
        now(),
        now(),
        p_severity,
        ARRAY[p_organization_id]
    )
    ON CONFLICT (error_type, operation, error_signature)
    DO UPDATE SET
        occurrence_count = billing_error_patterns.occurrence_count + 1,
        last_occurrence = now(),
        affected_organizations = array_append(
            array_remove(billing_error_patterns.affected_organizations, p_organization_id),
            p_organization_id
        );
    
    RETURN error_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark error as resolved
CREATE OR REPLACE FUNCTION resolve_billing_error(
    p_error_id uuid,
    p_resolution_notes text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    UPDATE billing_error_logs
    SET resolved = true,
        resolved_at = now(),
        resolution_notes = p_resolution_notes
    WHERE id = p_error_id
    AND resolved = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_billing_error_stats(
    p_organization_id uuid DEFAULT NULL,
    p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_errors bigint,
    errors_by_type jsonb,
    errors_by_severity jsonb,
    retry_success_rate numeric,
    resolution_rate numeric,
    avg_resolution_time numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH error_stats AS (
        SELECT 
            e.*,
            CASE WHEN e.resolved THEN 
                EXTRACT(EPOCH FROM (e.resolved_at - e.created_at)) / 60.0 
            END as resolution_time_minutes
        FROM billing_error_logs e
        WHERE (p_organization_id IS NULL OR e.organization_id = p_organization_id)
        AND e.created_at::date BETWEEN p_start_date AND p_end_date
    ),
    retry_stats AS (
        SELECT 
            COUNT(*) as total_retries,
            COUNT(*) FILTER (WHERE success = true) as successful_retries
        FROM billing_retry_attempts r
        WHERE (p_organization_id IS NULL OR r.organization_id = p_organization_id)
        AND r.created_at::date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        COUNT(*)::bigint,
        jsonb_object_agg(error_type, type_count) as errors_by_type,
        jsonb_object_agg(severity, severity_count) as errors_by_severity,
        CASE WHEN rs.total_retries > 0 THEN 
            ROUND((rs.successful_retries::numeric / rs.total_retries::numeric) * 100, 2)
        ELSE 0 END,
        CASE WHEN COUNT(*) > 0 THEN
            ROUND((COUNT(*) FILTER (WHERE resolved = true)::numeric / COUNT(*)::numeric) * 100, 2)
        ELSE 0 END,
        ROUND(AVG(resolution_time_minutes), 2)
    FROM (
        SELECT 
            error_type,
            severity,
            resolved,
            resolution_time_minutes,
            COUNT(*) OVER (PARTITION BY error_type) as type_count,
            COUNT(*) OVER (PARTITION BY severity) as severity_count
        FROM error_stats
    ) grouped_stats
    CROSS JOIN retry_stats rs
    GROUP BY rs.total_retries, rs.successful_retries;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily error metrics
CREATE OR REPLACE FUNCTION update_billing_error_metrics(p_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
    org_record record;
BEGIN
    -- Update metrics for each organization
    FOR org_record IN 
        SELECT DISTINCT organization_id 
        FROM billing_error_logs 
        WHERE created_at::date = p_date
        AND organization_id IS NOT NULL
    LOOP
        INSERT INTO billing_error_metrics (
            date,
            organization_id,
            total_errors,
            stripe_api_errors,
            payment_errors,
            validation_errors,
            system_errors,
            critical_errors,
            high_severity_errors,
            medium_severity_errors,
            low_severity_errors,
            total_retries,
            successful_retries,
            failed_retries,
            retry_success_rate,
            auto_resolved_errors,
            manual_resolved_errors,
            unresolved_errors
        )
        SELECT 
            p_date,
            org_record.organization_id,
            COUNT(*),
            COUNT(*) FILTER (WHERE error_type IN ('stripe_api_error', 'rate_limited', 'connection_error', 'service_unavailable')),
            COUNT(*) FILTER (WHERE error_type IN ('payment_declined', 'insufficient_funds', 'card_expired', 'invalid_cvc', 'processing_error')),
            COUNT(*) FILTER (WHERE error_type = 'validation_error'),
            COUNT(*) FILTER (WHERE error_type IN ('database_error', 'unknown_error')),
            COUNT(*) FILTER (WHERE severity = 'critical'),
            COUNT(*) FILTER (WHERE severity = 'high'),
            COUNT(*) FILTER (WHERE severity = 'medium'),
            COUNT(*) FILTER (WHERE severity = 'low'),
            COALESCE(retry_stats.total_retries, 0),
            COALESCE(retry_stats.successful_retries, 0),
            COALESCE(retry_stats.failed_retries, 0),
            CASE WHEN COALESCE(retry_stats.total_retries, 0) > 0 THEN
                ROUND((COALESCE(retry_stats.successful_retries, 0)::numeric / retry_stats.total_retries::numeric) * 100, 2)
            ELSE 0 END,
            COUNT(*) FILTER (WHERE resolved = true AND resolution_notes IS NULL),
            COUNT(*) FILTER (WHERE resolved = true AND resolution_notes IS NOT NULL),
            COUNT(*) FILTER (WHERE resolved = false)
        FROM billing_error_logs e
        LEFT JOIN (
            SELECT 
                organization_id,
                COUNT(*) as total_retries,
                COUNT(*) FILTER (WHERE success = true) as successful_retries,
                COUNT(*) FILTER (WHERE success = false) as failed_retries
            FROM billing_retry_attempts 
            WHERE created_at::date = p_date
            AND organization_id = org_record.organization_id
            GROUP BY organization_id
        ) retry_stats ON retry_stats.organization_id = e.organization_id
        WHERE e.created_at::date = p_date
        AND e.organization_id = org_record.organization_id
        GROUP BY org_record.organization_id, retry_stats.total_retries, retry_stats.successful_retries, retry_stats.failed_retries
        ON CONFLICT (date, organization_id) DO UPDATE SET
            total_errors = EXCLUDED.total_errors,
            stripe_api_errors = EXCLUDED.stripe_api_errors,
            payment_errors = EXCLUDED.payment_errors,
            validation_errors = EXCLUDED.validation_errors,
            system_errors = EXCLUDED.system_errors,
            critical_errors = EXCLUDED.critical_errors,
            high_severity_errors = EXCLUDED.high_severity_errors,
            medium_severity_errors = EXCLUDED.medium_severity_errors,
            low_severity_errors = EXCLUDED.low_severity_errors,
            total_retries = EXCLUDED.total_retries,
            successful_retries = EXCLUDED.successful_retries,
            failed_retries = EXCLUDED.failed_retries,
            retry_success_rate = EXCLUDED.retry_success_rate,
            auto_resolved_errors = EXCLUDED.auto_resolved_errors,
            manual_resolved_errors = EXCLUDED.manual_resolved_errors,
            unresolved_errors = EXCLUDED.unresolved_errors;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old error logs
CREATE OR REPLACE FUNCTION cleanup_old_billing_errors(days_old integer DEFAULT 365)
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Delete old resolved error logs
    DELETE FROM billing_error_logs
    WHERE resolved = true
    AND resolved_at < (now() - (days_old || ' days')::interval);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned retry attempts
    DELETE FROM billing_retry_attempts
    WHERE error_log_id NOT IN (SELECT id FROM billing_error_logs);
    
    -- Clean up orphaned error recoveries
    DELETE FROM billing_error_recoveries
    WHERE error_log_id NOT IN (SELECT id FROM billing_error_logs);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on error tables
ALTER TABLE billing_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_retry_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_error_recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_error_metrics ENABLE ROW LEVEL SECURITY;

-- Organization-scoped access policies
CREATE POLICY "Organizations can view their error logs"
    ON billing_error_logs FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their retry attempts"
    ON billing_retry_attempts FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their error recoveries"
    ON billing_error_recoveries FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organizations can view their error metrics"
    ON billing_error_metrics FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

-- Admin policies for error patterns
CREATE POLICY "Admins can view error patterns"
    ON billing_error_patterns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- Service role policies for system operations
CREATE POLICY "Service role can manage all error data"
    ON billing_error_logs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all retry data"
    ON billing_retry_attempts FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all recovery data"
    ON billing_error_recoveries FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all pattern data"
    ON billing_error_patterns FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all metrics data"
    ON billing_error_metrics FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE billing_error_logs IS 'Comprehensive logging of all billing-related errors';
COMMENT ON TABLE billing_retry_attempts IS 'Tracking of automatic retry attempts for failed operations';
COMMENT ON TABLE billing_error_recoveries IS 'Log of successful error recoveries and resolutions';
COMMENT ON TABLE billing_error_patterns IS 'Pattern analysis for recurring billing errors';
COMMENT ON TABLE billing_error_metrics IS 'Daily aggregated metrics for error monitoring';

COMMENT ON FUNCTION log_billing_error(uuid, uuid, billing_operation, billing_error_type, text, text, error_severity, boolean, jsonb, text) IS 'Logs a billing error with automatic pattern tracking';
COMMENT ON FUNCTION resolve_billing_error(uuid, text) IS 'Marks a billing error as resolved';
COMMENT ON FUNCTION get_billing_error_stats(uuid, date, date) IS 'Returns comprehensive error statistics for monitoring';
COMMENT ON FUNCTION update_billing_error_metrics(date) IS 'Updates daily error metrics for all organizations';
COMMENT ON FUNCTION cleanup_old_billing_errors(integer) IS 'Cleans up old resolved error logs';