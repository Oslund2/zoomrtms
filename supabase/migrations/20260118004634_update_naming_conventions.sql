/*
  # Update Naming Conventions

  1. Changes
    - Update existing naming templates to new Scripps conventions
    - Update existing meeting names to align with new naming patterns

  2. Updates Applied
    - Team Discussion → All Participants
    - Working Session → HR
    - Daily Standup → Finance
    - Sprint Planning → Legal
    - Department Meeting → Revenue
    - Training Session → Marketing
    - Client Meeting → Communications
    - Project Workshop → C-Suite
*/

-- First, delete old default templates to make room for new ones
DELETE FROM naming_templates
WHERE is_default = true
AND name IN (
  'Team Discussion',
  'Working Session',
  'Department Meeting',
  'Project Workshop',
  'Training Session',
  'Daily Standup',
  'Sprint Planning',
  'Client Meeting'
);

-- Update existing meeting names to align with new conventions
UPDATE meetings
SET topic = REPLACE(topic, 'Team Discussion', 'All Participants')
WHERE topic LIKE '%Team Discussion%';

UPDATE meetings
SET topic = REPLACE(topic, 'Working Session', 'HR')
WHERE topic LIKE '%Working Session%';

UPDATE meetings
SET topic = REPLACE(topic, 'Daily Standup', 'Finance')
WHERE topic LIKE '%Daily Standup%';

UPDATE meetings
SET topic = REPLACE(topic, 'Sprint Planning', 'Legal')
WHERE topic LIKE '%Sprint Planning%';

UPDATE meetings
SET topic = REPLACE(topic, 'Department Meeting', 'Revenue')
WHERE topic LIKE '%Department Meeting%';

UPDATE meetings
SET topic = REPLACE(topic, 'Training Session', 'Marketing')
WHERE topic LIKE '%Training Session%';

UPDATE meetings
SET topic = REPLACE(topic, 'Client Meeting', 'Communications')
WHERE topic LIKE '%Client Meeting%';

UPDATE meetings
SET topic = REPLACE(topic, 'Project Workshop', 'C-Suite')
WHERE topic LIKE '%Project Workshop%';
