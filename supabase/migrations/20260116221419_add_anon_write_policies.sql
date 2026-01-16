/*
  # Add Write Policies for Anonymous Users

  1. Changes
    - Add UPDATE policy for meetings table to allow anon users to edit meetings
    - Add DELETE policy for meetings table to allow anon users to delete meetings
    - Add INSERT policy for meetings table to allow anon users to create meetings
    - Add DELETE policies for related tables (participants, transcripts, chat_messages, media_events)
      to allow cascade deletion when a meeting is deleted

  2. Security Notes
    - These policies allow public access for this demo/testing application
    - In a production environment, these should be restricted to authenticated users
      with proper ownership checks
*/

-- Meetings table policies
DROP POLICY IF EXISTS "Anon can insert meetings" ON public.meetings;
CREATE POLICY "Anon can insert meetings"
ON public.meetings
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update meetings" ON public.meetings;
CREATE POLICY "Anon can update meetings"
ON public.meetings
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete meetings" ON public.meetings;
CREATE POLICY "Anon can delete meetings"
ON public.meetings
FOR DELETE
TO anon
USING (true);

-- Participants table policies
DROP POLICY IF EXISTS "Anon can delete participants" ON public.participants;
CREATE POLICY "Anon can delete participants"
ON public.participants
FOR DELETE
TO anon
USING (true);

-- Transcripts table policies
DROP POLICY IF EXISTS "Anon can delete transcripts" ON public.transcripts;
CREATE POLICY "Anon can delete transcripts"
ON public.transcripts
FOR DELETE
TO anon
USING (true);

-- Chat messages table policies
DROP POLICY IF EXISTS "Anon can delete chat_messages" ON public.chat_messages;
CREATE POLICY "Anon can delete chat_messages"
ON public.chat_messages
FOR DELETE
TO anon
USING (true);

-- Media events table policies
DROP POLICY IF EXISTS "Anon can delete media_events" ON public.media_events;
CREATE POLICY "Anon can delete media_events"
ON public.media_events
FOR DELETE
TO anon
USING (true);
