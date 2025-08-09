-- Add all missing notification functions (fixed version)

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

-- Create function to create notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
    template_name TEXT,
    recipient_user_id UUID,
    template_variables JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    template_record RECORD;
    notification_id UUID;
    processed_title TEXT;
    processed_message TEXT;
    processed_action_url TEXT;
    variable_key TEXT;
BEGIN
    -- Get template
    SELECT * INTO template_record
    FROM notification_templates 
    WHERE name = template_name AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found or inactive', template_name;
    END IF;
    
    -- Process template variables
    processed_title := template_record.title_template;
    processed_message := template_record.message_template;
    processed_action_url := template_record.action_url_template;
    
    -- Simple variable replacement (replace {{variable}} with values from JSONB)
    FOR variable_key IN SELECT jsonb_object_keys(template_variables) LOOP
        processed_title := REPLACE(processed_title, '{{' || variable_key || '}}', template_variables->>variable_key);
        processed_message := REPLACE(processed_message, '{{' || variable_key || '}}', template_variables->>variable_key);
        IF processed_action_url IS NOT NULL THEN
            processed_action_url := REPLACE(processed_action_url, '{{' || variable_key || '}}', template_variables->>variable_key);
        END IF;
    END LOOP;
    
    -- Create notification
    INSERT INTO notifications (
        recipient_id,
        type,
        priority,
        title,
        message,
        metadata,
        action_url,
        action_label
    ) VALUES (
        recipient_user_id,
        template_record.type,
        template_record.priority,
        processed_title,
        processed_message,
        template_variables,
        processed_action_url,
        template_record.action_label
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The mark_notification_read and dismiss_notification functions already exist from the previous migration
-- Just ensuring they work with the correct column name (recipient_id)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification_from_template(TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, UUID) TO authenticated;