-- 1. Create table for bot training queue
CREATE TABLE IF NOT EXISTS support_bot_training_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question text NOT NULL,
    ticket_id uuid REFERENCES support_tickets(id),
    created_at timestamptz DEFAULT now(),
    processed boolean DEFAULT false,
    suggested_answer text
);

-- 2. Function to log unanswered questions
CREATE OR REPLACE FUNCTION log_unanswered_question(
    p_question text,
    p_ticket_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO support_bot_training_queue (question, ticket_id)
    VALUES (p_question, p_ticket_id);
END;
$$;

GRANT EXECUTE ON FUNCTION log_unanswered_question TO anon, authenticated;

-- 3. Trigger to log when a support agent responds (for email notification logic)
-- We'll create a log table for now to demonstrate the logic, as actual email sending requires Edge Functions + API Keys
CREATE TABLE IF NOT EXISTS support_email_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid,
    recipient_email text,
    message_content text,
    status text DEFAULT 'pending', -- pending, sent, failed
    created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION queue_response_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket_owner_email text;
    v_guest_email text;
    v_recipient text;
BEGIN
    -- Only trigger if the sender is an agent or admin (not the user/bot)
    IF NEW.sender_type IN ('agent', 'admin') THEN
        -- Get ticket details
        SELECT 
            u.email, 
            t.guest_email 
        INTO 
            v_ticket_owner_email, 
            v_guest_email
        FROM support_tickets t
        LEFT JOIN auth.users u ON t.user_id = u.id
        WHERE t.id = NEW.ticket_id;

        -- Determine recipient
        IF v_ticket_owner_email IS NOT NULL THEN
            v_recipient := v_ticket_owner_email;
        ELSE
            v_recipient := v_guest_email;
        END IF;

        -- Queue the email
        IF v_recipient IS NOT NULL THEN
            INSERT INTO support_email_queue (ticket_id, recipient_email, message_content)
            VALUES (NEW.ticket_id, v_recipient, NEW.mensagem);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_support_message_response ON support_ticket_messages;
CREATE TRIGGER on_support_message_response
    AFTER INSERT ON support_ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION queue_response_email();
