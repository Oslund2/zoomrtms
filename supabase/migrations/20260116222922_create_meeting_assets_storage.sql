/*
  # Create Storage Bucket for Meeting Assets

  1. Storage Setup
    - Create `meeting-assets` bucket for storing room icons and other meeting media
    - Enable public access for reading assets
    - Allow authenticated uploads

  2. Security
    - Public read access for all assets
    - Insert/update permissions for authenticated users
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-assets', 'meeting-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for meeting assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'meeting-assets');

CREATE POLICY "Authenticated users can upload meeting assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-assets');

CREATE POLICY "Authenticated users can update meeting assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'meeting-assets')
WITH CHECK (bucket_id = 'meeting-assets');

CREATE POLICY "Authenticated users can delete meeting assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'meeting-assets');

CREATE POLICY "Anonymous users can upload meeting assets"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'meeting-assets');

CREATE POLICY "Anonymous users can update meeting assets"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'meeting-assets')
WITH CHECK (bucket_id = 'meeting-assets');