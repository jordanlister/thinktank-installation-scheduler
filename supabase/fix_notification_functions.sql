-- Fix missing notification functions

-- Create function to get user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(target_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    assignment_updates_enabled BOOLEAN,
    assignment_updates_channels TEXT[],
    schedule_changes_enabled BOOLEAN,
    schedule_changes_channels TEXT[],
    performance_reports_enabled BOOLEAN,
    performance_reports_channels TEXT[],
    system_alerts_enabled BOOLEAN,
    system_alerts_channels TEXT[],
    marketing_enabled BOOLEAN,
    marketing_channels TEXT[],
    admin_messages_enabled BOOLEAN,
    admin_messages_channels TEXT[],
    email_frequency TEXT,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unp.user_id,
        unp.assignment_updates_enabled,
        array(select unnest(unp.assignment_updates_channels)::text) as assignment_updates_channels,
        unp.schedule_changes_enabled,
        array(select unnest(unp.schedule_changes_channels)::text) as schedule_changes_channels,
        unp.performance_reports_enabled,
        array(select unnest(unp.performance_reports_channels)::text) as performance_reports_channels,
        unp.system_alerts_enabled,
        array(select unnest(unp.system_alerts_channels)::text) as system_alerts_channels,
        unp.marketing_enabled,
        array(select unnest(unp.marketing_channels)::text) as marketing_channels,
        unp.admin_messages_enabled,
        array(select unnest(unp.admin_messages_channels)::text) as admin_messages_channels,
        unp.email_frequency::text,
        unp.quiet_hours_start,
        unp.quiet_hours_end,
        unp.timezone,
        unp.created_at,
        unp.updated_at
    FROM user_notification_preferences unp 
    WHERE unp.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications 
        WHERE recipient_id = target_user_id 
        AND read_at IS NULL
        AND dismissed_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_notification_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;