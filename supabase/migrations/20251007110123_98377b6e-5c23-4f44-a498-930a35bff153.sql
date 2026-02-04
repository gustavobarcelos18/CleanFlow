-- Step 1: Add new support levels to system_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'support_basic' AND enumtypid = 'system_role'::regtype) THEN
    ALTER TYPE system_role ADD VALUE 'support_basic';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'support_intermediate' AND enumtypid = 'system_role'::regtype) THEN
    ALTER TYPE system_role ADD VALUE 'support_intermediate';
  END IF;
END $$;