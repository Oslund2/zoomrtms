/*
  # Add Multi-Room Support for RTMS

  1. Schema Changes
    - Add `room_type` column to meetings table (main, breakout)
    - Add `room_number` column to meetings table (1-8 for breakout rooms)
    - Add `parent_meeting_id` column to link breakout rooms to main meeting
    - Add indexes for efficient room filtering

  2. Notes
    - Main conference room: room_type='main', room_number=null
    - Breakout rooms: room_type='breakout', room_number=1-8
    - Breakout rooms can reference parent main meeting via parent_meeting_id
*/

-- Add room_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'room_type'
  ) THEN
    ALTER TABLE meetings ADD COLUMN room_type text DEFAULT 'main';
  END IF;
END $$;

-- Add room_number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'room_number'
  ) THEN
    ALTER TABLE meetings ADD COLUMN room_number integer;
  END IF;
END $$;

-- Add parent_meeting_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'parent_meeting_id'
  ) THEN
    ALTER TABLE meetings ADD COLUMN parent_meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for efficient room queries
CREATE INDEX IF NOT EXISTS idx_meetings_room_type ON meetings(room_type);
CREATE INDEX IF NOT EXISTS idx_meetings_room_number ON meetings(room_number);
CREATE INDEX IF NOT EXISTS idx_meetings_parent_meeting_id ON meetings(parent_meeting_id);

-- Add check constraint to ensure room_number is between 1 and 8 for breakout rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'check_room_number_range'
  ) THEN
    ALTER TABLE meetings ADD CONSTRAINT check_room_number_range 
      CHECK (room_number IS NULL OR (room_number >= 1 AND room_number <= 8));
  END IF;
END $$;