/*
  # Trigger-based Automatic Transcript Analysis

  1. Approach
    - Instead of pg_cron (which has privilege issues), use a trigger on analysis_queue
    - When new items are inserted, automatically invoke the analyze-transcripts function
    - Uses pg_net for async HTTP calls (non-blocking)
  
  2. Functions
    - `trigger_analyze_transcripts()`: Trigger function that calls edge function
  
  3. Triggers
    - `on_analysis_queue_insert`: Fires after INSERT on analysis_queue
  
  4. Benefits
    - Event-driven (processes immediately when transcripts arrive)
    - No external scheduler needed
    - Runs entirely within Supabase
*/

-- Create trigger function to invoke analysis
CREATE OR REPLACE FUNCTION public.trigger_analyze_transcripts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text;
  service_key text;
BEGIN
  -- Get settings
  base_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.supabase_service_role_key', true);
  
  -- Only proceed if we have the necessary settings
  IF base_url IS NOT NULL AND service_key IS NOT NULL THEN
    -- Use pg_net to make async HTTP request
    PERFORM net.http_post(
      url := base_url || '/functions/v1/analyze-transcripts',
      body := '{"action": "process_queue"}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on analysis_queue
DROP TRIGGER IF EXISTS on_analysis_queue_insert ON public.analysis_queue;

CREATE TRIGGER on_analysis_queue_insert
  AFTER INSERT ON public.analysis_queue
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_analyze_transcripts();

COMMENT ON FUNCTION public.trigger_analyze_transcripts() IS 'Trigger function that invokes analyze-transcripts edge function when new items are queued';
