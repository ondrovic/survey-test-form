-- ===================================
-- Schema Migration: 00000000000001
-- Description: Schema setup
-- ===================================

CREATE TABLE IF NOT EXISTS survey_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sections JSONB NOT NULL DEFAULT '[]',
    version VARCHAR(50) DEFAULT '1.0.0',
    paginator_config JSONB DEFAULT '{}',
    footer_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES survey_configs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    paginator_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    config_valid BOOLEAN DEFAULT true NOT NULL,
    active_date_range JSONB,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_sessions (
    id UUID PRIMARY KEY DEFAULT  uuid_generate_v4(),
    survey_instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    current_section INTEGER DEFAULT 0,
    total_sections INTEGER,
    status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned', 'expired')),
    user_agent TEXT,
    ip_address INET,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    session_id UUID REFERENCES survey_sessions(id) ON DELETE SET NULL,
    config_version VARCHAR(50) DEFAULT '1.0.0',
    responses JSONB NOT NULL DEFAULT '{}',
    
    -- Timing tracking
    started_at TIMESTAMP WITH TIME ZONE, -- When survey was first started (may be null for legacy data)
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- When survey was completed
    completion_time_seconds INTEGER, -- Calculated completion time in seconds
    
    -- Status tracking
    completion_status VARCHAR(20) DEFAULT 'completed' CHECK (completion_status IN ('partial', 'completed', 'abandoned')),
    completion_percentage DECIMAL(5,2) DEFAULT 100.00, -- Percentage of fields completed
    
    -- Legacy field (renamed for clarity)
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- Alias for completed_at for backward compatibility
    
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rating_scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS radio_option_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkbox_option_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    min_selections INTEGER,
    max_selections INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dropdown_option_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    allow_multiple BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_instance_status_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES survey_instances(id) ON DELETE CASCADE,
    old_status BOOLEAN,
    new_status BOOLEAN NOT NULL,
    reason VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    changed_by VARCHAR(255) DEFAULT 'system',
    details JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Timestamp and basic info
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Error details
    error_message TEXT NOT NULL,
    error_code VARCHAR(100), -- Application-specific error codes
    stack_trace TEXT, -- Full stack trace if available
    
    -- Context information
    component_name VARCHAR(255), -- React component name
    file_path VARCHAR(500), -- File where error occurred
    line_number INTEGER, -- Line number where error occurred
    function_name VARCHAR(255), -- Function where error occurred
    user_action TEXT, -- What the user was doing when error occurred
    
    -- User and session context
    user_id UUID, -- Authenticated user ID (if available)
    user_email VARCHAR(255), -- User email (if available)
    session_token VARCHAR(255), -- Survey session token (if applicable)
    survey_instance_id UUID REFERENCES survey_instances(id) ON DELETE SET NULL, -- Related survey (if applicable)
    
    -- System information
    user_agent TEXT, -- Browser user agent
    ip_address INET, -- User IP address
    url TEXT, -- URL where error occurred
    http_method VARCHAR(10), -- HTTP method if API error
    
    -- Browser/Client info
    browser_info JSONB DEFAULT '{}', -- Detailed browser information
    screen_resolution VARCHAR(50), -- Screen resolution
    viewport_size VARCHAR(50), -- Viewport dimensions
    
    -- Error metadata
    error_boundary BOOLEAN DEFAULT false, -- Was this caught by React Error Boundary?
    is_handled BOOLEAN DEFAULT false, -- Was this a handled error or unhandled?
    error_hash VARCHAR(64), -- Hash of error for deduplication
    occurrence_count INTEGER DEFAULT 1, -- How many times this error occurred
    
    -- Resolution tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    assigned_to VARCHAR(255), -- Who is investigating this error
    resolution_notes TEXT, -- Notes about the resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    
    -- Additional context
    additional_context JSONB DEFAULT '{}', -- Any other relevant data
    tags TEXT[], -- Tags for categorizing errors
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);