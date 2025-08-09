-- Billing Security and Audit Logging Migration
-- Adds comprehensive audit logging for billing operations and security features

-- =====================================================
-- BILLING AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE billing_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Operation details
    action text NOT NULL,
    resource text NOT NULL,
    resource_id text, -- ID of the resource being acted upon
    
    -- Request context
    ip_address inet,
    user_agent text,
    
    -- Operation results
    success boolean NOT NULL,
    error_message text,
    
    -- Additional details
    details jsonb DEFAULT '{}',
    
    -- Timestamp
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_action CHECK (action ~ '^[a-z_]+$'),
    CONSTRAINT valid_resource CHECK (resource ~ '^[a-z_]+$')
);

-- =====================================================
-- BILLING SECURITY EVENTS TABLE
-- =====================================================

CREATE TABLE billing_security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event classification
    event_type text NOT NULL, -- 'rate_limit_exceeded', 'suspicious_activity', 'webhook_verification_failed'
    severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Request context
    ip_address inet,
    user_agent text,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event details
    description text NOT NULL,
    details jsonb DEFAULT '{}',
    
    -- Response actions
    action_taken text, -- 'blocked', 'logged', 'alerted'
    
    -- Timestamp
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type ~ '^[a-z_]+$'),
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_action_taken CHECK (action_taken IS NULL OR action_taken ~ '^[a-z_]+$')
);

-- =====================================================
-- BILLING RATE LIMIT VIOLATIONS TABLE
-- =====================================================

CREATE TABLE billing_rate_limit_violations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rate limit details
    operation text NOT NULL, -- 'billing', 'webhooks', 'subscription', 'payment'
    limit_key text NOT NULL, -- The key used for rate limiting
    
    -- Request context
    ip_address inet,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Violation details
    request_count integer NOT NULL,
    limit_exceeded integer NOT NULL, -- The limit that was exceeded
    window_duration_ms integer NOT NULL,
    
    -- Request details
    endpoint text,
    user_agent text,
    
    -- Timestamp
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_operation CHECK (operation IN ('billing', 'webhooks', 'subscription', 'payment')),
    CONSTRAINT valid_counts CHECK (request_count > 0 AND limit_exceeded > 0),
    CONSTRAINT valid_window CHECK (window_duration_ms > 0)
);

-- =====================================================
-- BILLING WEBHOOK VERIFICATION LOGS TABLE
-- =====================================================

CREATE TABLE billing_webhook_verification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook details
    webhook_event_id text,
    webhook_type text,
    
    -- Verification results
    verification_status text NOT NULL, -- 'success', 'failed', 'error'
    failure_reason text,
    
    -- Request context
    ip_address inet,
    user_agent text,
    
    -- Webhook payload info (no sensitive data)
    payload_size integer,
    signature_header text,
    timestamp_header text,
    
    -- Processing details
    processing_time_ms integer,
    
    -- Timestamp
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_verification_status CHECK (verification_status IN ('success', 'failed', 'error')),
    CONSTRAINT valid_payload_size CHECK (payload_size IS NULL OR payload_size >= 0),
    CONSTRAINT valid_processing_time CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0)
);

-- =====================================================
-- BILLING SECURITY METRICS TABLE
-- =====================================================

CREATE TABLE billing_security_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    
    -- Audit metrics
    total_operations integer DEFAULT 0,
    successful_operations integer DEFAULT 0,
    failed_operations integer DEFAULT 0,
    
    -- Security events
    security_events integer DEFAULT 0,
    rate_limit_violations integer DEFAULT 0,
    suspicious_activities integer DEFAULT 0,
    
    -- Webhook verification
    webhook_verifications integer DEFAULT 0,
    webhook_verification_failures integer DEFAULT 0,
    
    -- Rate limiting stats
    rate_limit_checks integer DEFAULT 0,
    rate_limit_blocks integer DEFAULT 0,
    
    -- Performance metrics
    avg_operation_duration_ms numeric(10,2) DEFAULT 0,
    max_operation_duration_ms integer DEFAULT 0,
    
    -- Unique metrics
    unique_ips integer DEFAULT 0,
    unique_user_agents integer DEFAULT 0,
    unique_organizations integer DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(date),
    CONSTRAINT valid_security_metrics CHECK (
        total_operations >= 0 AND successful_operations >= 0 AND failed_operations >= 0 AND
        security_events >= 0 AND rate_limit_violations >= 0 AND suspicious_activities >= 0 AND
        webhook_verifications >= 0 AND webhook_verification_failures >= 0 AND
        rate_limit_checks >= 0 AND rate_limit_blocks >= 0 AND
        avg_operation_duration_ms >= 0 AND max_operation_duration_ms >= 0 AND
        unique_ips >= 0 AND unique_user_agents >= 0 AND unique_organizations >= 0
    )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Audit logs indexes
CREATE INDEX idx_audit_logs_org_id ON billing_audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON billing_audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON billing_audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON billing_audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON billing_audit_logs(created_at);
CREATE INDEX idx_audit_logs_success ON billing_audit_logs(success) WHERE success = false;
CREATE INDEX idx_audit_logs_ip ON billing_audit_logs(ip_address);

-- Security events indexes
CREATE INDEX idx_security_events_type ON billing_security_events(event_type);
CREATE INDEX idx_security_events_severity ON billing_security_events(severity);
CREATE INDEX idx_security_events_created_at ON billing_security_events(created_at);
CREATE INDEX idx_security_events_ip ON billing_security_events(ip_address);
CREATE INDEX idx_security_events_org_id ON billing_security_events(organization_id);

-- Rate limit violations indexes
CREATE INDEX idx_rate_limit_violations_operation ON billing_rate_limit_violations(operation);
CREATE INDEX idx_rate_limit_violations_ip ON billing_rate_limit_violations(ip_address);
CREATE INDEX idx_rate_limit_violations_created_at ON billing_rate_limit_violations(created_at);
CREATE INDEX idx_rate_limit_violations_org_id ON billing_rate_limit_violations(organization_id);

-- Webhook verification logs indexes
CREATE INDEX idx_webhook_verification_status ON billing_webhook_verification_logs(verification_status);
CREATE INDEX idx_webhook_verification_type ON billing_webhook_verification_logs(webhook_type);
CREATE INDEX idx_webhook_verification_created_at ON billing_webhook_verification_logs(created_at);
CREATE INDEX idx_webhook_verification_ip ON billing_webhook_verification_logs(ip_address);

-- Security metrics indexes
CREATE INDEX idx_security_metrics_date ON billing_security_metrics(date);

-- =====================================================
-- FUNCTIONS FOR SECURITY OPERATIONS
-- =====================================================

-- Function to log security event
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type text,
    p_severity text DEFAULT 'medium',
    p_description text,
    p_details jsonb DEFAULT '{}',
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_organization_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_action_taken text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    event_id uuid;
BEGIN
    INSERT INTO billing_security_events (
        event_type,
        severity,
        description,
        details,
        ip_address,
        user_agent,
        organization_id,
        user_id,
        action_taken
    ) VALUES (
        p_event_type,
        p_severity,
        p_description,
        p_details,
        p_ip_address,
        p_user_agent,
        p_organization_id,
        p_user_id,
        p_action_taken
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log rate limit violation
CREATE OR REPLACE FUNCTION log_rate_limit_violation(
    p_operation text,
    p_limit_key text,
    p_request_count integer,
    p_limit_exceeded integer,
    p_window_duration_ms integer,
    p_ip_address inet DEFAULT NULL,
    p_organization_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_endpoint text DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    violation_id uuid;
BEGIN
    INSERT INTO billing_rate_limit_violations (
        operation,
        limit_key,
        request_count,
        limit_exceeded,
        window_duration_ms,
        ip_address,
        organization_id,
        user_id,
        endpoint,
        user_agent
    ) VALUES (
        p_operation,
        p_limit_key,
        p_request_count,
        p_limit_exceeded,
        p_window_duration_ms,
        p_ip_address,
        p_organization_id,
        p_user_id,
        p_endpoint,
        p_user_agent
    ) RETURNING id INTO violation_id;
    
    -- Also log as security event
    PERFORM log_security_event(
        'rate_limit_exceeded',
        'medium',
        format('Rate limit exceeded for operation %s', p_operation),
        jsonb_build_object(
            'operation', p_operation,
            'request_count', p_request_count,
            'limit', p_limit_exceeded,
            'window_ms', p_window_duration_ms
        ),
        p_ip_address,
        p_user_agent,
        p_organization_id,
        p_user_id,
        'blocked'
    );
    
    RETURN violation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily security metrics
CREATE OR REPLACE FUNCTION update_security_metrics(p_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO billing_security_metrics (
        date,
        total_operations,
        successful_operations,
        failed_operations,
        security_events,
        rate_limit_violations,
        webhook_verifications,
        webhook_verification_failures,
        unique_ips,
        unique_user_agents,
        unique_organizations
    )
    SELECT 
        p_date,
        
        -- Audit metrics
        COUNT(*),
        COUNT(*) FILTER (WHERE success = true),
        COUNT(*) FILTER (WHERE success = false),
        
        -- Security events (subquery)
        (SELECT COUNT(*) FROM billing_security_events WHERE DATE(created_at) = p_date),
        
        -- Rate limit violations (subquery)
        (SELECT COUNT(*) FROM billing_rate_limit_violations WHERE DATE(created_at) = p_date),
        
        -- Webhook verifications (subquery)
        (SELECT COUNT(*) FROM billing_webhook_verification_logs WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM billing_webhook_verification_logs WHERE DATE(created_at) = p_date AND verification_status = 'failed'),
        
        -- Unique counts
        COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL),
        COUNT(DISTINCT user_agent) FILTER (WHERE user_agent IS NOT NULL),
        COUNT(DISTINCT organization_id) FILTER (WHERE organization_id IS NOT NULL)
        
    FROM billing_audit_logs 
    WHERE DATE(created_at) = p_date
    
    ON CONFLICT (date) 
    DO UPDATE SET
        total_operations = EXCLUDED.total_operations,
        successful_operations = EXCLUDED.successful_operations,
        failed_operations = EXCLUDED.failed_operations,
        security_events = EXCLUDED.security_events,
        rate_limit_violations = EXCLUDED.rate_limit_violations,
        webhook_verifications = EXCLUDED.webhook_verifications,
        webhook_verification_failures = EXCLUDED.webhook_verification_failures,
        unique_ips = EXCLUDED.unique_ips,
        unique_user_agents = EXCLUDED.unique_user_agents,
        unique_organizations = EXCLUDED.unique_organizations;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old security logs
CREATE OR REPLACE FUNCTION cleanup_old_security_logs(days_old integer DEFAULT 365)
RETURNS record AS $$
DECLARE
    audit_deleted integer;
    security_deleted integer;
    rate_limit_deleted integer;
    webhook_deleted integer;
    result record;
BEGIN
    -- Delete old audit logs
    DELETE FROM billing_audit_logs
    WHERE created_at < (now() - (days_old || ' days')::interval);
    GET DIAGNOSTICS audit_deleted = ROW_COUNT;
    
    -- Delete old security events
    DELETE FROM billing_security_events
    WHERE created_at < (now() - (days_old || ' days')::interval);
    GET DIAGNOSTICS security_deleted = ROW_COUNT;
    
    -- Delete old rate limit violations
    DELETE FROM billing_rate_limit_violations
    WHERE created_at < (now() - (days_old || ' days')::interval);
    GET DIAGNOSTICS rate_limit_deleted = ROW_COUNT;
    
    -- Delete old webhook verification logs
    DELETE FROM billing_webhook_verification_logs
    WHERE created_at < (now() - (days_old || ' days')::interval);
    GET DIAGNOSTICS webhook_deleted = ROW_COUNT;
    
    -- Return counts
    SELECT audit_deleted, security_deleted, rate_limit_deleted, webhook_deleted
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on security tables
ALTER TABLE billing_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_webhook_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_security_metrics ENABLE ROW LEVEL SECURITY;

-- Organization-scoped access policies for audit logs
CREATE POLICY "Organizations can view their audit logs"
    ON billing_audit_logs FOR SELECT
    USING (organization_id IN (
        SELECT id FROM organizations 
        WHERE id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    ));

-- Admin policies for security monitoring
CREATE POLICY "Admins can view all security events"
    ON billing_security_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Admins can view all security metrics"
    ON billing_security_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- Service role policies for system operations
CREATE POLICY "Service role can manage all security data"
    ON billing_audit_logs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all security events"
    ON billing_security_events FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all rate limit data"
    ON billing_rate_limit_violations FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all webhook verification data"
    ON billing_webhook_verification_logs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all security metrics"
    ON billing_security_metrics FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE billing_audit_logs IS 'Comprehensive audit trail for all billing operations';
COMMENT ON TABLE billing_security_events IS 'Log of security-related events and anomalies';
COMMENT ON TABLE billing_rate_limit_violations IS 'Record of rate limiting violations';
COMMENT ON TABLE billing_webhook_verification_logs IS 'Log of webhook signature verification attempts';
COMMENT ON TABLE billing_security_metrics IS 'Daily aggregated security and audit metrics';

COMMENT ON FUNCTION log_security_event(text, text, text, jsonb, inet, text, uuid, uuid, text) IS 'Logs a security event with context';
COMMENT ON FUNCTION log_rate_limit_violation(text, text, integer, integer, integer, inet, uuid, uuid, text, text) IS 'Logs a rate limit violation with details';
COMMENT ON FUNCTION update_security_metrics(date) IS 'Updates daily security metrics';
COMMENT ON FUNCTION cleanup_old_security_logs(integer) IS 'Cleans up old security logs and events';