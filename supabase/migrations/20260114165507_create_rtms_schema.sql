/*
  # Zoom RTMS Multi-Meeting Processing Schema

  1. New Tables
    - `meetings` - Stores active and historical meeting records
      - `id` (uuid, primary key)
      - `meeting_uuid` (text, unique) - Zoom meeting UUID
      - `rtms_stream_id` (text) - RTMS stream identifier
      - `server_urls` (text) - WebSocket server URLs
      - `host_id` (text) - Zoom host user ID
      - `host_name` (text) - Host display name
      - `topic` (text) - Meeting topic/title
      - `status` (text) - active, ended, error
      - `started_at` (timestamptz) - When RTMS stream started
      - `ended_at` (timestamptz) - When RTMS stream ended
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `participants` - Tracks per-meeting participant data
      - `id` (uuid, primary key)
      - `meeting_id` (uuid, foreign key)
      - `participant_id` (text) - Zoom participant ID
      - `user_name` (text)
      - `email` (text)
      - `role` (text) - host, co-host, participant
      - `joined_at` (timestamptz)
      - `left_at` (timestamptz)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `transcripts` - Real-time transcript segments
      - `id` (uuid, primary key)
      - `meeting_id` (uuid, foreign key)
      - `participant_id` (uuid, foreign key)
      - `speaker_name` (text)
      - `content` (text) - Transcript text
      - `timestamp_ms` (bigint) - Media timestamp
      - `sequence` (integer) - Order sequence
      - `is_final` (boolean) - Final vs interim transcript
      - `created_at` (timestamptz)

    - `chat_messages` - Meeting chat data
      - `id` (uuid, primary key)
      - `meeting_id` (uuid, foreign key)
      - `participant_id` (uuid, foreign key)
      - `sender_name` (text)
      - `message` (text)
      - `message_type` (text) - text, file, etc.
      - `recipient` (text) - everyone, specific user
      - `timestamp_ms` (bigint)
      - `created_at` (timestamptz)

    - `media_events` - Audio/video/screenshare event logs
      - `id` (uuid, primary key)
      - `meeting_id` (uuid, foreign key)
      - `event_type` (text) - audio, video, screenshare
      - `participant_id` (uuid, foreign key)
      - `action` (text) - started, stopped, data_received
      - `bytes_processed` (bigint)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated access (service role for edge functions)

  3. Indexes
    - meeting_uuid for fast lookup
    - meeting_id foreign keys for joins
    - timestamps for ordering
*/

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_uuid text UNIQUE NOT NULL,
  rtms_stream_id text,
  server_urls text,
  host_id text,
  host_name text,
  topic text,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_id text NOT NULL,
  user_name text,
  email text,
  role text DEFAULT 'participant',
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, participant_id)
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  speaker_name text,
  content text NOT NULL,
  timestamp_ms bigint,
  sequence integer,
  is_final boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  sender_name text,
  message text NOT NULL,
  message_type text DEFAULT 'text',
  recipient text DEFAULT 'everyone',
  timestamp_ms bigint,
  created_at timestamptz DEFAULT now()
);

-- Media events table
CREATE TABLE IF NOT EXISTS media_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  action text NOT NULL,
  bytes_processed bigint DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_events ENABLE ROW LEVEL SECURITY;

-- Service role policies (for edge functions)
CREATE POLICY "Service role full access to meetings"
  ON meetings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to participants"
  ON participants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to transcripts"
  ON transcripts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to chat_messages"
  ON chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to media_events"
  ON media_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon read policies for frontend dashboard
CREATE POLICY "Anon can read meetings"
  ON meetings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read participants"
  ON participants FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read transcripts"
  ON transcripts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read chat_messages"
  ON chat_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read media_events"
  ON media_events FOR SELECT
  TO anon
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_started_at ON meetings(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_is_active ON participants(is_active);
CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting_id ON chat_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_media_events_meeting_id ON media_events(meeting_id);

-- Update trigger for meetings.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();