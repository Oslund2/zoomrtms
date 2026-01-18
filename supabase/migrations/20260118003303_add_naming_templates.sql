/*
  # Add Naming Templates System

  1. New Tables
    - `naming_templates`
      - `id` (uuid, primary key)
      - `name` (text) - Display name for the template
      - `template_pattern` (text) - The naming pattern with variables
      - `description` (text) - Description of when to use this template
      - `is_default` (boolean) - Whether this is a default system template
      - `category` (text) - Category like 'meeting', 'workshop', 'standup'
      - `sort_order` (integer) - Display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `naming_templates` table
    - Add policies for authenticated users to read templates
    - Add policies for authenticated users to create/update custom templates

  3. Sample Data
    - Insert default naming templates for common meeting types
*/

-- Create naming_templates table
CREATE TABLE IF NOT EXISTS naming_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_pattern text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  category text DEFAULT 'general',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE naming_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for reading templates
CREATE POLICY "Anyone can view naming templates"
  ON naming_templates FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for creating custom templates
CREATE POLICY "Authenticated users can create custom templates"
  ON naming_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_default = false);

-- Create policies for updating custom templates
CREATE POLICY "Authenticated users can update custom templates"
  ON naming_templates FOR UPDATE
  TO authenticated
  USING (is_default = false)
  WITH CHECK (is_default = false);

-- Create policies for deleting custom templates
CREATE POLICY "Authenticated users can delete custom templates"
  ON naming_templates FOR DELETE
  TO authenticated
  USING (is_default = false);

-- Insert default naming templates
INSERT INTO naming_templates (name, template_pattern, description, is_default, category, sort_order)
VALUES
  (
    'Team Discussion',
    'Team Discussion - Breakout Room {ROOM_NUMBER}',
    'General team discussion format for breakout rooms',
    true,
    'meeting',
    1
  ),
  (
    'Working Session',
    'Working Session - Breakout Room {ROOM_NUMBER}',
    'Collaborative working session format',
    true,
    'workshop',
    2
  ),
  (
    'Department Meeting',
    'Department Meeting - Breakout Room {ROOM_NUMBER}',
    'Department-specific meeting format',
    true,
    'meeting',
    3
  ),
  (
    'Project Workshop',
    'Project Workshop - Breakout Room {ROOM_NUMBER}',
    'Project-focused workshop format',
    true,
    'workshop',
    4
  ),
  (
    'Training Session',
    'Training Session - Breakout Room {ROOM_NUMBER}',
    'Training and learning format',
    true,
    'training',
    5
  ),
  (
    'Daily Standup',
    'Daily Standup - Breakout Room {ROOM_NUMBER}',
    'Quick daily sync meeting format',
    true,
    'standup',
    6
  ),
  (
    'Sprint Planning',
    'Sprint Planning - Breakout Room {ROOM_NUMBER}',
    'Sprint planning session format',
    true,
    'planning',
    7
  ),
  (
    'Client Meeting',
    'Client Meeting - Breakout Room {ROOM_NUMBER}',
    'Client-facing meeting format',
    true,
    'client',
    8
  )
ON CONFLICT DO NOTHING;
