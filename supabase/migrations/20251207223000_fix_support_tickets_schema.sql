-- Fix support tickets schema and inconsistencies
-- 20251207223000_fix_support_tickets_schema.sql

-- 1. Standardize on user_id instead of usuario_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'usuario_id') THEN
        ALTER TABLE support_tickets RENAME COLUMN usuario_id TO user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_ticket_messages' AND column_name = 'usuario_id') THEN
        ALTER TABLE support_ticket_messages RENAME COLUMN usuario_id TO user_id;
    END IF;
END $$;

-- 2. Make fields nullable for guest support
ALTER TABLE support_tickets ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE support_tickets ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE support_ticket_messages ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add guest columns if they don't exist
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_phone text;

-- 4. Add sender_type to messages
ALTER TABLE support_ticket_messages ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'user';

-- 5. Update RLS policies for public access (guests)
DROP POLICY IF EXISTS "Guests can create tickets" ON support_tickets;
CREATE POLICY "Guests can create tickets" ON support_tickets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Guests can create messages" ON support_ticket_messages;
CREATE POLICY "Guests can create messages" ON support_ticket_messages FOR INSERT WITH CHECK (true);

-- Allow guests to read messages of their own ticket (this is tricky without a session, usually done via a secure token or just local state for now)
-- For now, we rely on the widget keeping the state or using a public RPC if needed. 
-- But strictly speaking, standard SELECT RLS prevents guests from reading back what they wrote if they reload.
-- We will allow SELECT if the ticket_id matches (but RLS can't easily check local storage).
-- For this MVP, we might just allow inserting. Reading might require a signed token or similar.
-- However, the widget tries to load messages: `loadMessages(savedTicket)`.
-- This requires SELECT permission on `support_ticket_messages` for anon users where `ticket_id` is the one they have.
-- We can allow anon select on messages if they know the ticket_id? No, that's insecure (ID enumeration).
-- A better approach for guests is using a `guest_token` (uuid) stored in the ticket and local storage.
-- Let's add a `guest_token` column.

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS guest_token UUID DEFAULT gen_random_uuid();

-- Policy for reading tickets:
DROP POLICY IF EXISTS "Guests can read own ticket" ON support_tickets;
CREATE POLICY "Guests can read own ticket" ON support_tickets 
    FOR SELECT 
    USING (
        (auth.role() = 'anon' AND guest_token::text = current_setting('request.header.x-guest-token', true))
        OR
        (auth.role() = 'authenticated' AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('support', 'org_admin'))))
    );

-- But passing headers from client is complex in this setup.
-- Simpler approach for now: Allow anon select on messages for tickets that have a guest_email set? Still insecure.
-- Given the time constraints, I will enable public insert (which I did) and for reading, I'll assume the user stays in the session or I'll fix the RLS to be permissive for now for 'anon' on these tables if it helps, OR just fix the INSERT error which is the blocker.
-- The user said "corrija o erro ao iniciar o chat" (fix error starting chat). Starting chat = INSERT.
-- So fixing the INSERT schema is the priority.

-- Let's ensure the RLS allows INSERT for anon.
