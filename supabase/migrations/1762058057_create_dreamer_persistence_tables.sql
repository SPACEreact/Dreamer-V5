-- Migration: create_dreamer_persistence_tables
-- Created at: 1762058057

-- Create user sessions table for storing progress
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    current_question_index INTEGER DEFAULT 0,
    prompt_data JSONB DEFAULT '{}'::jsonb,
    knowledge_docs JSONB DEFAULT '[]'::jsonb,
    saved_configurations JSONB DEFAULT '[]'::jsonb,
    visual_presets JSONB DEFAULT '[]'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storyboard saves table
CREATE TABLE IF NOT EXISTS storyboard_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    timeline_items JSONB DEFAULT '[]'::jsonb,
    compositions JSONB DEFAULT '{}'::jsonb,
    lighting_data JSONB DEFAULT '{}'::jsonb,
    color_grading_data JSONB DEFAULT '{}'::jsonb,
    camera_movement JSONB DEFAULT '{}'::jsonb,
    aspect_ratios JSONB DEFAULT '{}'::jsonb,
    styles JSONB DEFAULT '{}'::jsonb,
    sound_design_data JSONB DEFAULT '{}'::jsonb,
    casting_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_storyboard_saves_session_id ON storyboard_saves(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_updated ON user_sessions(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboard_saves ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using session IDs, not user auth)
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on storyboard_saves" ON storyboard_saves
    FOR ALL USING (true) WITH CHECK (true);;