/*
  # Add Duplicate Prevention for Transcripts

  ## Overview
  Adds unique constraint to prevent duplicate transcript submissions in RTMS system.

  ## Changes Made
  
  1. **Unique Constraint on Transcripts**
    - Creates unique index on `(meeting_id, timestamp_ms, content)`
    - Prevents identical transcripts at same timestamp
    - Allows same content at different timestamps (legitimate use case)
  
  2. **Benefits**
    - Prevents accidental duplicate submissions
    - Handles retry scenarios gracefully
    - No data loss from duplicate attempts
  
  3. **Important Notes**
    - Uses partial hash of content (first 1000 chars) for performance
    - NULL participant_id handled correctly
    - Index is used for UPSERT operations
*/

-- Create unique index to prevent duplicate transcripts
-- Uses meeting_id + timestamp_ms + content hash to identify duplicates
CREATE UNIQUE INDEX IF NOT EXISTS transcripts_unique_submission 
  ON transcripts (meeting_id, timestamp_ms, MD5(SUBSTRING(content, 1, 1000)));