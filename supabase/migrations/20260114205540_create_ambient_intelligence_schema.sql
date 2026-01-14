/*
  # Ambient Intelligence Layer Schema

  1. New Tables
    - `prompt_configs` - Stores global and room-specific system prompts
      - `id` (uuid, primary key)
      - `scope` (text) - 'global' or 'room'
      - `room_number` (integer, nullable) - 1-9 for room-specific prompts
      - `name` (text) - Display name for the prompt config
      - `prompt_text` (text) - The actual system prompt content
      - `is_active` (boolean) - Whether this prompt is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `external_contexts` - Uploaded reference documents
      - `id` (uuid, primary key)
      - `title` (text) - Document title
      - `file_name` (text) - Original filename
      - `file_type` (text) - pdf, docx, txt
      - `content` (text) - Extracted text content
      - `chunk_index` (integer) - For split documents
      - `embedding` (vector) - For semantic search
      - `metadata` (jsonb) - Additional document metadata
      - `created_at` (timestamptz)

    - `analysis_summaries` - Room-level analysis results
      - `id` (uuid, primary key)
      - `meeting_id` (uuid, foreign key)
      - `room_number` (integer) - 0 for main, 1-8 for breakout
      - `summary_type` (text) - 'room', 'cross_room', 'context_gap'
      - `content` (text) - Summary text
      - `sentiment_score` (numeric) - -1 to 1 scale
      - `key_topics` (jsonb) - Extracted topics array
      - `key_speakers` (jsonb) - Active speakers
      - `action_items` (jsonb) - Detected action items
      - `last_transcript_id` (uuid) - Last processed transcript
      - `created_at` (timestamptz)

    - `topic_nodes` - Knowledge graph vertices
      - `id` (uuid, primary key)
      - `label` (text) - Topic name
      - `description` (text) - Brief description
      - `category` (text) - Theme category
      - `mention_count` (integer) - Total mentions
      - `room_mentions` (jsonb) - Count per room
      - `importance_score` (numeric) - Calculated importance
      - `first_seen` (timestamptz)
      - `last_seen` (timestamptz)
      - `created_at` (timestamptz)

    - `topic_edges` - Knowledge graph relationships
      - `id` (uuid, primary key)
      - `source_node_id` (uuid, foreign key)
      - `target_node_id` (uuid, foreign key)
      - `relationship_type` (text) - related_to, depends_on, conflicts_with
      - `weight` (numeric) - Relationship strength
      - `room_context` (jsonb) - Rooms where seen together
      - `created_at` (timestamptz)

    - `insight_events` - Real-time insight feed
      - `id` (uuid, primary key)
      - `insight_type` (text) - alignment, misalignment, gap, highlight
      - `severity` (text) - info, warning, alert
      - `title` (text) - Short headline
      - `description` (text) - Full insight text
      - `involved_rooms` (integer array) - Rooms involved
      - `related_topics` (text array) - Topic labels
      - `metadata` (jsonb) - Additional context
      - `created_at` (timestamptz)

    - `analysis_queue` - Processing queue for transcripts
      - `id` (uuid, primary key)
      - `transcript_id` (uuid, foreign key)
      - `meeting_id` (uuid, foreign key)
      - `room_number` (integer)
      - `status` (text) - pending, processing, completed, failed
      - `priority` (integer)
      - `retry_count` (integer)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Service role has full access for edge functions
    - Anon can read for public display

  3. Indexes
    - Vector similarity search index
    - Room and time-based filtering indexes
*/

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Prompt configurations table
CREATE TABLE IF NOT EXISTS prompt_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'room',
  room_number integer,
  name text NOT NULL,
  prompt_text text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_scope CHECK (scope IN ('global', 'room')),
  CONSTRAINT valid_room_number CHECK (
    (scope = 'global' AND room_number IS NULL) OR
    (scope = 'room' AND room_number >= 0 AND room_number <= 8)
  )
);

-- External context documents table
CREATE TABLE IF NOT EXISTS external_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  content text NOT NULL,
  chunk_index integer DEFAULT 0,
  embedding vector(768),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_file_type CHECK (file_type IN ('pdf', 'docx', 'txt'))
);

-- Analysis summaries table
CREATE TABLE IF NOT EXISTS analysis_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  room_number integer NOT NULL DEFAULT 0,
  summary_type text NOT NULL,
  content text NOT NULL,
  sentiment_score numeric DEFAULT 0,
  key_topics jsonb DEFAULT '[]',
  key_speakers jsonb DEFAULT '[]',
  action_items jsonb DEFAULT '[]',
  last_transcript_id uuid REFERENCES transcripts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_summary_type CHECK (summary_type IN ('room', 'cross_room', 'context_gap')),
  CONSTRAINT valid_room_range CHECK (room_number >= 0 AND room_number <= 8)
);

-- Topic nodes for knowledge graph
CREATE TABLE IF NOT EXISTS topic_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text UNIQUE NOT NULL,
  description text,
  category text,
  mention_count integer DEFAULT 1,
  room_mentions jsonb DEFAULT '{}',
  importance_score numeric DEFAULT 0,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Topic edges for knowledge graph
CREATE TABLE IF NOT EXISTS topic_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id uuid NOT NULL REFERENCES topic_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES topic_nodes(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'related_to',
  weight numeric DEFAULT 1,
  room_context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_relationship CHECK (relationship_type IN ('related_to', 'depends_on', 'conflicts_with', 'supports')),
  CONSTRAINT no_self_reference CHECK (source_node_id != target_node_id),
  UNIQUE(source_node_id, target_node_id)
);

-- Insight events feed
CREATE TABLE IF NOT EXISTS insight_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text NOT NULL,
  involved_rooms integer[] DEFAULT '{}',
  related_topics text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_insight_type CHECK (insight_type IN ('alignment', 'misalignment', 'gap', 'highlight', 'action')),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'alert'))
);

-- Analysis processing queue
CREATE TABLE IF NOT EXISTS analysis_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  room_number integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 0,
  retry_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Enable RLS on all tables
ALTER TABLE prompt_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_queue ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
CREATE POLICY "Service role full access to prompt_configs"
  ON prompt_configs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to external_contexts"
  ON external_contexts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to analysis_summaries"
  ON analysis_summaries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to topic_nodes"
  ON topic_nodes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to topic_edges"
  ON topic_edges FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to insight_events"
  ON insight_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to analysis_queue"
  ON analysis_queue FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anon read policies for public display
CREATE POLICY "Anon can read prompt_configs"
  ON prompt_configs FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can read external_contexts"
  ON external_contexts FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can read analysis_summaries"
  ON analysis_summaries FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can read topic_nodes"
  ON topic_nodes FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can read topic_edges"
  ON topic_edges FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can read insight_events"
  ON insight_events FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can read analysis_queue"
  ON analysis_queue FOR SELECT TO anon
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_configs_scope ON prompt_configs(scope);
CREATE INDEX IF NOT EXISTS idx_prompt_configs_room ON prompt_configs(room_number) WHERE room_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompt_configs_active ON prompt_configs(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_external_contexts_file_type ON external_contexts(file_type);
CREATE INDEX IF NOT EXISTS idx_external_contexts_created ON external_contexts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_summaries_meeting ON analysis_summaries(meeting_id);
CREATE INDEX IF NOT EXISTS idx_analysis_summaries_room ON analysis_summaries(room_number);
CREATE INDEX IF NOT EXISTS idx_analysis_summaries_type ON analysis_summaries(summary_type);
CREATE INDEX IF NOT EXISTS idx_analysis_summaries_created ON analysis_summaries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_topic_nodes_label ON topic_nodes(label);
CREATE INDEX IF NOT EXISTS idx_topic_nodes_category ON topic_nodes(category);
CREATE INDEX IF NOT EXISTS idx_topic_nodes_importance ON topic_nodes(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_topic_nodes_last_seen ON topic_nodes(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_topic_edges_source ON topic_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_topic_edges_target ON topic_edges(target_node_id);

CREATE INDEX IF NOT EXISTS idx_insight_events_type ON insight_events(insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_events_severity ON insight_events(severity);
CREATE INDEX IF NOT EXISTS idx_insight_events_created ON insight_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_queue_status ON analysis_queue(status);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_meeting ON analysis_queue(meeting_id);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_priority ON analysis_queue(priority DESC, created_at ASC);

-- Update trigger for prompt_configs
CREATE TRIGGER update_prompt_configs_updated_at
  BEFORE UPDATE ON prompt_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default global prompt
INSERT INTO prompt_configs (scope, room_number, name, prompt_text, is_active)
VALUES (
  'global',
  NULL,
  'Default Global Prompt',
  'You are an AI analyst monitoring a company transformation event. Analyze meeting transcripts for:
- Key discussion topics and themes
- Sentiment and engagement levels
- Action items and decisions
- Potential risks or concerns
- Strategic alignment with transformation goals

Always be objective, concise, and focus on business-critical insights.',
  true
) ON CONFLICT DO NOTHING;

-- Insert default room prompts for all 9 rooms (0=main, 1-8=breakout)
INSERT INTO prompt_configs (scope, room_number, name, prompt_text, is_active)
VALUES 
  (
    'room', 0, 'Main Conference Room',
    'This is the Main Conference Room where executive presentations and plenary sessions occur. Focus on:
- Strategic announcements and decisions
- Leadership communications
- Cross-team coordination topics
- Overall event themes and objectives',
    true
  ),
  (
    'room', 1, 'Breakout Room 1',
    'Breakout Room 1. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  ),
  (
    'room', 2, 'Breakout Room 2',
    'Breakout Room 2. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  ),
  (
    'room', 3, 'Breakout Room 3',
    'Breakout Room 3. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  ),
  (
    'room', 4, 'Breakout Room 4',
    'Breakout Room 4. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  ),
  (
    'room', 5, 'Breakout Room 5',
    'Breakout Room 5. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  ),
  (
    'room', 6, 'Breakout Room 6',
    'Breakout Room 6. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  ),
  (
    'room', 7, 'Breakout Room 7',
    'Breakout Room 7. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  ),
  (
    'room', 8, 'Breakout Room 8',
    'Breakout Room 8. Monitor for team-specific discussions, working sessions, and group exercises. Note any unique perspectives or concerns raised.',
    true
  )
ON CONFLICT DO NOTHING;
