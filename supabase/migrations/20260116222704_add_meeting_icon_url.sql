/*
  # Add Custom Icon Support for Meetings

  1. Schema Changes
    - Add `icon_url` column to `meetings` table for storing custom room icons
    - This allows users to upload custom images for meeting rooms
    - Null means use the default audio icon

  2. Notes
    - icon_url stores the public URL of the uploaded image
    - When null, the frontend will display the default Mic/AudioWaveform icons
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'icon_url'
  ) THEN
    ALTER TABLE meetings ADD COLUMN icon_url text;
  END IF;
END $$;