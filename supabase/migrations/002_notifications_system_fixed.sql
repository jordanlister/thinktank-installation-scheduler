-- Think Tank Technologies - Notification System Implementation
-- Fixed version that uses existing types and avoids conflicts

-- Create additional enum types that don't already exist
DO $$ BEGIN
    -- Check if notification_priority doesn't exist before creating
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
        CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
    END IF;
    
    -- Check if delivery_channel doesn't exist before creating  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_channel') THEN
        CREATE TYPE delivery_channel AS ENUM ('in_app', 'email', 'sms', 'push');
    END IF;
    
    -- Check if notification_status doesn't exist before creating
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'dismissed', 'failed');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'normal',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    action_url TEXT,
    action_label TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    assignment_updates_enabled BOOLEAN DEFAULT true,
    assignment_updates_channels delivery_channel[] DEFAULT ARRAY['in_app', 'email']::delivery_channel[],
    schedule_changes_enabled BOOLEAN DEFAULT true,
    schedule_changes_channels delivery_channel[] DEFAULT ARRAY['in_app', 'email']::delivery_channel[],
    performance_reports_enabled BOOLEAN DEFAULT true,
    performance_reports_channels delivery_channel[] DEFAULT ARRAY['in_app']::delivery_channel[],
    system_alerts_enabled BOOLEAN DEFAULT true,
    system_alerts_channels delivery_channel[] DEFAULT ARRAY['in_app', 'email']::delivery_channel[],
    marketing_enabled BOOLEAN DEFAULT false,
    marketing_channels delivery_channel[] DEFAULT ARRAY['email']::delivery_channel[],
    admin_messages_enabled BOOLEAN DEFAULT true,
    admin_messages_channels delivery_channel[] DEFAULT ARRAY['in_app', 'email']::delivery_channel[],
    email_frequency email_frequency DEFAULT 'immediate',
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'normal',
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    action_url_template TEXT,
    action_label TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification deliveries tracking table
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel delivery_channel NOT NULL,
    status notification_status DEFAULT 'pending',
    delivery_details JSONB DEFAULT '{}',
    error_message TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification events table (for analytics)
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_dismissed_at ON notifications(dismissed_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_channel ON notification_deliveries(channel);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_notification_events_notification_id ON notification_events(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_user_id ON notification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_created_at ON notification_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Admin users can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'scheduler')
        )
    );

-- RLS Policies for user notification preferences
CREATE POLICY "Users can manage their own notification preferences" ON user_notification_preferences
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all notification preferences" ON user_notification_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'scheduler')
        )
    );

-- RLS Policies for notification templates (admin only)
CREATE POLICY "Admin users can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "All users can view active notification templates" ON notification_templates
    FOR SELECT USING (is_active = true);

-- RLS Policies for notification deliveries
CREATE POLICY "Users can view their own notification deliveries" ON notification_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.id = notification_id 
            AND n.recipient_id = auth.uid()
        )
    );

CREATE POLICY "Admin users can manage all notification deliveries" ON notification_deliveries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'scheduler')
        )
    );

-- RLS Policies for notification events
CREATE POLICY "Users can view their own notification events" ON notification_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification events" ON notification_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin users can view all notification events" ON notification_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'scheduler')
        )
    );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification templates
INSERT INTO notification_templates (name, type, title_template, message_template, variables, action_url_template, action_label) VALUES
('installation_assigned', 'assignment_updates', 'New Installation Assignment', 'You have been assigned to installation {{job_id}} for {{customer_name}} on {{scheduled_date}} at {{scheduled_time}}.', '["job_id", "customer_name", "scheduled_date", "scheduled_time", "address"]', '/installations/{{installation_id}}', 'View Installation'),
('schedule_changed', 'schedule_changes', 'Schedule Update', 'Your installation for {{customer_name}} has been rescheduled from {{old_date}} {{old_time}} to {{new_date}} {{new_time}}.', '["customer_name", "old_date", "old_time", "new_date", "new_time", "installation_id"]', '/installations/{{installation_id}}', 'View Details'),
('conflict_detected', 'schedule_changes', 'Schedule Conflict Detected', 'A scheduling conflict has been detected for {{conflict_date}}. {{conflict_details}}', '["conflict_date", "conflict_details", "affected_installations"]', '/schedules/conflicts', 'Resolve Conflict'),
('installation_completed', 'assignment_updates', 'Installation Completed', 'Installation {{job_id}} for {{customer_name}} has been marked as completed.', '["job_id", "customer_name", "completion_time", "installation_id"]', '/installations/{{installation_id}}', 'View Report'),
('system_maintenance', 'system_alerts', 'System Maintenance Notice', 'Scheduled system maintenance will occur on {{maintenance_date}} from {{start_time}} to {{end_time}}. {{details}}', '["maintenance_date", "start_time", "end_time", "details"]', null, null),
('performance_report_ready', 'performance_reports', 'Performance Report Available', 'Your {{period}} performance report is now available for review. Overall completion rate: {{completion_rate}}%.', '["period", "completion_rate", "report_id"]', '/reports/performance/{{report_id}}', 'View Report')
ON CONFLICT (name) DO NOTHING;

-- Insert default user preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM user_notification_preferences 
    WHERE user_id = users.id
);

-- Create function to get user notification count
CREATE OR REPLACE FUNCTION get_user_notification_count(user_id UUID)
RETURNS TABLE (
    total_count INTEGER,
    unread_count INTEGER,
    urgent_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_count,
        COUNT(CASE WHEN read_at IS NULL THEN 1 END)::INTEGER as unread_count,
        COUNT(CASE WHEN read_at IS NULL AND priority = 'urgent' THEN 1 END)::INTEGER as urgent_count
    FROM notifications 
    WHERE recipient_id = user_id 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND dismissed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET read_at = NOW(), updated_at = NOW()
    WHERE id = notification_id 
    AND recipient_id = user_id 
    AND read_at IS NULL;
    
    -- Log the event
    INSERT INTO notification_events (notification_id, user_id, event_type)
    VALUES (notification_id, user_id, 'read');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to dismiss notification
CREATE OR REPLACE FUNCTION dismiss_notification(notification_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET dismissed_at = NOW(), updated_at = NOW()
    WHERE id = notification_id 
    AND recipient_id = user_id 
    AND dismissed_at IS NULL;
    
    -- Log the event
    INSERT INTO notification_events (notification_id, user_id, event_type)
    VALUES (notification_id, user_id, 'dismissed');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Core notifications table storing all user notifications';
COMMENT ON TABLE user_notification_preferences IS 'User-specific notification preferences and settings';
COMMENT ON TABLE notification_templates IS 'Reusable notification message templates with variables';
COMMENT ON TABLE notification_deliveries IS 'Tracking delivery status across multiple channels';
COMMENT ON TABLE notification_events IS 'Analytics and interaction tracking for notifications';

-- Grant appropriate permissions
GRANT SELECT ON notifications TO authenticated;
GRANT UPDATE (read_at, dismissed_at, updated_at) ON notifications TO authenticated;
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT SELECT ON notification_templates TO authenticated;
GRANT SELECT ON notification_deliveries TO authenticated;
GRANT INSERT, SELECT ON notification_events TO authenticated;