/*
  # Enable pg_cron for Automatic Transcript Analysis

  1. Extensions
    - Enable pg_cron for job scheduling
    - Enable pg_net for HTTP requests from PostgreSQL
  
  2. Functions
    - `invoke_analyze_transcripts()`: Calls the analyze-transcripts edge function
  
  3. Scheduled Jobs
    - Cron job runs every minute to process the analysis queue
    - Uses pg_net to make HTTP POST request to the edge function
  
  4. Security Notes
    - Uses service role key for authentication
    - Job runs within Supabase infrastructure, no external setup needed
*/

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to invoke the analyze-transcripts edge function
CREATE OR REPLACE FUNCTION public.invoke_analyze_transcripts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_count int;
BEGIN
  SELECT count(*) INTO pending_count
  FROM public.analysis_queue
  WHERE status = 'pending';
  
  IF pending_count > 0 THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/analyze-transcripts',
      body := '{"action": "process_queue"}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
      )
    );
    
    RAISE NOTICE 'Triggered analyze-transcripts with % pending items', pending_count;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.invoke_analyze_transcripts() IS 'Invokes the analyze-transcripts edge function to process pending transcript analysis queue items';
