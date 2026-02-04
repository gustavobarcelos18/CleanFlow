-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run daily at 3 AM
SELECT cron.schedule(
  'cleanup-incomplete-registrations',
  '0 3 * * *', -- Run at 3 AM every day
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/cleanup-incomplete-registrations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Add comment to document the cron job
COMMENT ON EXTENSION pg_cron IS 'Runs scheduled jobs including cleanup of incomplete user registrations';

-- Create a function to manually trigger cleanup (useful for testing)
CREATE OR REPLACE FUNCTION trigger_cleanup_incomplete_registrations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM cleanup_incomplete_registrations();
  RAISE NOTICE 'Cleanup of incomplete registrations completed';
END;
$$;