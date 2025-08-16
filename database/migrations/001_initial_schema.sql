-- Initial database schema for survey application
-- Compatible with both Supabase and PostgreSQL

-- Enable UUID extension if using PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Legacy surveys table (for backward compatibility)
CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey configurations
CREATE TABLE IF NOT EXISTS survey_configs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    sections JSONB NOT NULL,
    paginator_config JSONB,
    footer_config JSONB,
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(50) DEFAULT '1.0.0',
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey instances
CREATE TABLE IF NOT EXISTS survey_instances (
    id VARCHAR(255) PRIMARY KEY,
    config_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    active_date_range JSONB,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (config_id) REFERENCES survey_configs(id) ON DELETE CASCADE
);

-- General survey responses table (for backward compatibility)
CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    survey_instance_id VARCHAR(255) NOT NULL,
    config_version VARCHAR(255) NOT NULL,
    responses JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (survey_instance_id) REFERENCES survey_instances(id) ON DELETE CASCADE
);

-- Rating scales
CREATE TABLE IF NOT EXISTS rating_scales (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    options JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio option sets
CREATE TABLE IF NOT EXISTS radio_option_sets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    options JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-select option sets
CREATE TABLE IF NOT EXISTS multi_select_option_sets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    options JSONB NOT NULL,
    max_selections INTEGER,
    min_selections INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Select option sets
CREATE TABLE IF NOT EXISTS select_option_sets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    options JSONB NOT NULL,
    allow_multiple BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_configs_created_at ON survey_configs USING BTREE ((metadata->>'createdAt'));
CREATE INDEX IF NOT EXISTS idx_survey_instances_config_id ON survey_instances(config_id);
CREATE INDEX IF NOT EXISTS idx_survey_instances_active ON survey_instances(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_responses_instance_id ON survey_responses(survey_instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_rating_scales_created_at ON rating_scales USING BTREE ((metadata->>'createdAt'));
CREATE INDEX IF NOT EXISTS idx_radio_option_sets_created_at ON radio_option_sets USING BTREE ((metadata->>'createdAt'));
CREATE INDEX IF NOT EXISTS idx_multi_select_option_sets_created_at ON multi_select_option_sets USING BTREE ((metadata->>'createdAt'));
CREATE INDEX IF NOT EXISTS idx_select_option_sets_created_at ON select_option_sets USING BTREE ((metadata->>'createdAt'));

-- Update timestamps function (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update triggers
CREATE TRIGGER update_survey_configs_updated_at BEFORE UPDATE ON survey_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_instances_updated_at BEFORE UPDATE ON survey_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rating_scales_updated_at BEFORE UPDATE ON rating_scales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_radio_option_sets_updated_at BEFORE UPDATE ON radio_option_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_multi_select_option_sets_updated_at BEFORE UPDATE ON multi_select_option_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_select_option_sets_updated_at BEFORE UPDATE ON select_option_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();