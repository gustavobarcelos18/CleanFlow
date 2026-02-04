-- Create function to clean up incomplete user registrations
CREATE OR REPLACE FUNCTION cleanup_incomplete_registrations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find auth users without profiles (incomplete registrations older than 24 hours)
  FOR user_record IN
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    AND au.created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Log the cleanup
    RAISE NOTICE 'Cleaning up incomplete registration for user % (email: %, created: %)', 
      user_record.id, user_record.email, user_record.created_at;
    
    -- Delete the user (this will cascade to any related data)
    DELETE FROM auth.users WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- Create a scheduled job to run cleanup daily (this will be executed via edge function)
COMMENT ON FUNCTION cleanup_incomplete_registrations() IS 
'Removes users who created accounts but never completed registration (no profile after 24h)';

-- Add index to speed up the cleanup query
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Create function to check if user registration is complete
CREATE OR REPLACE FUNCTION is_registration_complete(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id AND tenant_id IS NOT NULL
  );
END;
$$;