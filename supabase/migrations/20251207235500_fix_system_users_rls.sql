-- Migration to fix system_users RLS for theme updates
-- 20251207235500_fix_system_users_rls.sql

-- Allow system users to update their own record (needed for theme_preference)
-- We use a check to ensure they don't escalate their own privileges (role)
-- Note: Postgres RLS WITH CHECK applies to the NEW row. 
-- To strictly prevent changing role, we would need a trigger, but for now we assume 
-- the application logic handles this and we trust authenticated system users not to be malicious hackers 
-- (or we accept the risk for this specific feature in this context).
-- A safer way is to use a trigger to prevent role changes for non-masters.

CREATE POLICY "System users can update own record" ON system_users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Trigger to prevent non-masters from changing system_role or permissions
CREATE OR REPLACE FUNCTION protect_system_user_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is NOT a master, they cannot change role or permissions
    IF NOT EXISTS (
        SELECT 1 FROM system_users 
        WHERE id = auth.uid() AND system_role = 'master'
    ) THEN
        IF NEW.system_role IS DISTINCT FROM OLD.system_role THEN
            RAISE EXCEPTION 'You cannot change your own system role';
        END IF;
        
        IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
            RAISE EXCEPTION 'You cannot change your own permissions';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_system_user_fields_trigger
    BEFORE UPDATE ON system_users
    FOR EACH ROW
    EXECUTE FUNCTION protect_system_user_fields();
