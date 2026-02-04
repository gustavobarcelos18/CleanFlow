-- Function to cleanup incomplete registrations (profiles without tenant_id older than 24h)
CREATE OR REPLACE FUNCTION public.cleanup_incomplete_registrations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete profiles without tenant_id that are older than 24 hours
  DELETE FROM public.profiles 
  WHERE tenant_id IS NULL 
    AND created_at < NOW() - INTERVAL '24 hours';
    
  -- Log cleanup action
  RAISE NOTICE 'Incomplete registrations cleanup completed at %', NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_incomplete_registrations() TO service_role;