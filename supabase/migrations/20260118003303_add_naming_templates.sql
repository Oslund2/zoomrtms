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
    'All Participants',
    'All Participants - Breakout Room {ROOM_NUMBER}',
    'General meeting format for all participants',
    true,
    'general',
    1
  ),
  (
    'HR',
    'HR - Breakout Room {ROOM_NUMBER}',
    'Human Resources department format',
    true,
    'department',
    2
  ),
  (
    'Finance',
    'Finance - Breakout Room {ROOM_NUMBER}',
    'Finance department format',
    true,
    'department',
    3
  ),
  (
    'Legal',
    'Legal - Breakout Room {ROOM_NUMBER}',
    'Legal department format',
    true,
    'department',
    4
  ),
  (
    'Revenue',
    'Revenue - Breakout Room {ROOM_NUMBER}',
    'Revenue department format',
    true,
    'department',
    5
  ),
  (
    'Local News',
    'Local News - Breakout Room {ROOM_NUMBER}',
    'Local news coverage format',
    true,
    'news',
    6
  ),
  (
    'National News',
    'National News - Breakout Room {ROOM_NUMBER}',
    'National news coverage format',
    true,
    'news',
    7
  ),
  (
    'Marketing',
    'Marketing - Breakout Room {ROOM_NUMBER}',
    'Marketing department format',
    true,
    'department',
    8
  ),
  (
    'Promotion',
    'Promotion - Breakout Room {ROOM_NUMBER}',
    'Promotional activities format',
    true,
    'marketing',
    9
  ),
  (
    'AI',
    'AI - Breakout Room {ROOM_NUMBER}',
    'Artificial Intelligence topics format',
    true,
    'technology',
    10
  ),
  (
    'Communications',
    'Communications - Breakout Room {ROOM_NUMBER}',
    'Communications department format',
    true,
    'department',
    11
  ),
  (
    'C-Suite',
    'C-Suite - Breakout Room {ROOM_NUMBER}',
    'Executive leadership format',
    true,
    'executive',
    12
  )
ON CONFLICT DO NOTHING;
