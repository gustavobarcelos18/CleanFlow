-- Migration to enable guest support tickets
-- Created at 2025-12-07 22:15:00

-- Modify support_tickets to allow guests
ALTER TABLE support_tickets ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE support_tickets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_phone text;

-- Modify support_ticket_messages to allow guest senders
ALTER TABLE support_ticket_messages ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE support_ticket_messages ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'user'; -- 'user', 'agent', 'guest', 'system'

-- Add policy for public creation of tickets (for landing page)
-- Note: This needs careful RLS. We want guests to be able to INSERT, but not SELECT (unless we use a session token, but for now just insert).
CREATE POLICY "Guests can create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');
CREATE POLICY "Guests can create messages" ON support_ticket_messages FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- Update existing RLS to ensure we don't break existing logic
-- (Assuming existing policies rely on tenant_id/user_id, they should be fine as they filter by those)
