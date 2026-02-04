-- Function to create guest tickets securely
-- 20251207224500_create_guest_ticket_rpc.sql

CREATE OR REPLACE FUNCTION create_guest_ticket(
    p_name text,
    p_email text,
    p_title text,
    p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (postgres/admin)
SET search_path = public
AS $$
DECLARE
    v_ticket_id uuid;
    v_ticket_record record;
BEGIN
    -- Insert the ticket
    INSERT INTO support_tickets (
        title,
        description,
        status,
        priority,
        origem,
        guest_name,
        guest_email,
        user_id,
        tenant_id
    ) VALUES (
        p_title,
        p_description,
        'open',
        'medium',
        'widget',
        p_name,
        p_email,
        NULL, -- user_id is null for guests
        NULL  -- tenant_id is null for guests
    )
    RETURNING id, created_at INTO v_ticket_id, v_ticket_record;

    -- Return the created ticket data
    RETURN jsonb_build_object(
        'id', v_ticket_id,
        'created_at', v_ticket_record
    );
END;
$$;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION create_guest_ticket TO anon, authenticated;
