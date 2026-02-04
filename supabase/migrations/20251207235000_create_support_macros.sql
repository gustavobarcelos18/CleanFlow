-- Migration to create support_ticket_macros table
-- 20251207235000_create_support_macros.sql

CREATE TABLE IF NOT EXISTS support_ticket_macros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    visibilidade TEXT DEFAULT 'global', -- 'global' or 'tenant'
    categoria TEXT,
    variaveis_exemplo JSONB DEFAULT '{}'::jsonb,
    ativo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_ticket_macros ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can read active macros (authenticated users)
CREATE POLICY "Macros are viewable by authenticated users" ON support_ticket_macros
    FOR SELECT
    TO authenticated
    USING (ativo = true);

-- Only support staff can insert/update/delete
-- Using a subquery to check system_users role
CREATE POLICY "Support staff can manage macros" ON support_ticket_macros
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM system_users
            WHERE system_users.id = auth.uid()
            AND system_users.system_role IN ('master', 'support', 'support_basic', 'support_intermediate')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_ticket_macros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_support_ticket_macros_updated_at
    BEFORE UPDATE ON support_ticket_macros
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_macros_updated_at();
