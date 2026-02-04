-- Migration to add support scheduling and knowledge base
-- Created at 2025-12-07 22:30:00

-- Enable pg_trgm for fuzzy search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Table for Operating Hours
CREATE TABLE IF NOT EXISTS support_operating_hours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (day_of_week)
);

-- Table for Holidays
CREATE TABLE IF NOT EXISTS support_holidays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL UNIQUE,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Table for Knowledge Base (Bot Brain)
CREATE TABLE IF NOT EXISTS support_knowledge_base (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question text NOT NULL,
    answer text NOT NULL,
    keywords text[], -- For manual keyword matching
    use_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Function to search knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(search_query text)
RETURNS TABLE (
    id uuid,
    question text,
    answer text,
    similarity real
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.question,
        kb.answer,
        similarity(kb.question, search_query) as similarity
    FROM
        support_knowledge_base kb
    WHERE
        kb.is_active = true
        AND (
            kb.question % search_query -- Trigram match
            OR search_query ILIKE ANY(kb.keywords) -- Keyword match
        )
    ORDER BY
        similarity DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Seed default operating hours (Mon-Fri, 9-18)
INSERT INTO support_operating_hours (day_of_week, start_time, end_time)
VALUES
    (1, '09:00', '18:00'), -- Monday
    (2, '09:00', '18:00'), -- Tuesday
    (3, '09:00', '18:00'), -- Wednesday
    (4, '09:00', '18:00'), -- Thursday
    (5, '09:00', '18:00')  -- Friday
ON CONFLICT (day_of_week) DO NOTHING;

-- RLS Policies
ALTER TABLE support_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY "Admins can manage operating hours" ON support_operating_hours
    FOR ALL USING (
        EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage holidays" ON support_holidays
    FOR ALL USING (
        EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage knowledge base" ON support_knowledge_base
    FOR ALL USING (
        EXISTS (SELECT 1 FROM system_users WHERE id = auth.uid())
    );

-- Everyone (including anon) can read for the chat widget
CREATE POLICY "Public read operating hours" ON support_operating_hours
    FOR SELECT USING (true);

CREATE POLICY "Public read holidays" ON support_holidays
    FOR SELECT USING (true);

CREATE POLICY "Public read knowledge base" ON support_knowledge_base
    FOR SELECT USING (true);
