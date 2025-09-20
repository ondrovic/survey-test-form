-- ===================================
-- Storage Setup Migration: 00000000000011
-- Description: Create storage bucket and disable RLS for development
-- ===================================

-- Create storage bucket for survey images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('survey-images', 'survey-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow all d1fr63_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'survey-images') AND  (
    storage.extension(name) = 'jpeg' OR
    storage.extension(name) = 'jpg' OR
    storage.extension(name) = 'png' OR
    storage.extension(name) = 'gif' OR
    storage.extension(name) = 'webp'
  );
CREATE POLICY "allow all d1fr63_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'survey-images') AND  (
    storage.extension(name) = 'jpeg' OR
    storage.extension(name) = 'jpg' OR
    storage.extension(name) = 'png' OR
    storage.extension(name) = 'gif' OR
    storage.extension(name) = 'webp'
  );
CREATE POLICY "allow all d1fr63_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'survey-images') AND  (
    storage.extension(name) = 'jpeg' OR
    storage.extension(name) = 'jpg' OR
    storage.extension(name) = 'png' OR
    storage.extension(name) = 'gif' OR
    storage.extension(name) = 'webp'
  );
CREATE POLICY "allow all d1fr63_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'survey-images') AND  (
    storage.extension(name) = 'jpeg' OR
    storage.extension(name) = 'jpg' OR
    storage.extension(name) = 'png' OR
    storage.extension(name) = 'gif' OR
    storage.extension(name) = 'webp'
  );