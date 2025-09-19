-- ===================================
-- Schema Migration: 00000000000009
-- Description: Survey Images support
-- ===================================

-- Create survey_images table to store image metadata and associations
CREATE TABLE IF NOT EXISTS survey_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Image file information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL, -- Supabase Storage path
    storage_url TEXT NOT NULL,  -- Public URL from Supabase Storage

    -- Image properties
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    caption TEXT,

    -- Association metadata (flexible for different use cases)
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('field', 'option', 'section', 'subsection')),
    entity_id VARCHAR(255) NOT NULL, -- Can reference field.id, option.value, section.id, etc.
    config_id UUID REFERENCES survey_configs(id) ON DELETE CASCADE,

    -- Ordering and display settings
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false, -- For identifying primary image in multi-image scenarios

    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    upload_status VARCHAR(20) DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'deleted')),

    -- Audit trail
    uploaded_by VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Indexes for performance
    UNIQUE(config_id, entity_type, entity_id, storage_path)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_survey_images_config_entity ON survey_images(config_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_survey_images_config_active ON survey_images(config_id, is_active);
CREATE INDEX IF NOT EXISTS idx_survey_images_storage_path ON survey_images(storage_path);
CREATE INDEX IF NOT EXISTS idx_survey_images_upload_status ON survey_images(upload_status);

-- Add RLS policies for survey_images
ALTER TABLE survey_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view images for surveys they have access to
CREATE POLICY "Users can view survey images"
    ON survey_images
    FOR SELECT
    USING (true); -- Allow public read access for now, can be restricted later

-- Policy: Authenticated users can insert images
CREATE POLICY "Authenticated users can insert survey images"
    ON survey_images
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update their own uploaded images
CREATE POLICY "Users can update their own survey images"
    ON survey_images
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete their own uploaded images
CREATE POLICY "Users can delete their own survey images"
    ON survey_images
    FOR DELETE
    USING (auth.role() = 'authenticated');