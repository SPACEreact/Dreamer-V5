// Supabase Client for Data Persistence
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://etdopfjlgpdhcjjyirvd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZG9wZmpsZ3BkaGNqanlpcnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODM4NjEsImV4cCI6MjA3NzU1OTg2MX0.a_gBdqeIsDZ2onrWk7Bi27mJjajthUof1tUCvrnJKMM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate or retrieve session ID from localStorage
export const getSessionId = (): string => {
    let sessionId = localStorage.getItem('dreamer_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('dreamer_session_id', sessionId);
    }
    return sessionId;
};

// Save user progress to Supabase
export const saveUserProgress = async (data: {
    currentQuestionIndex: number;
    promptData: any;
    knowledgeDocs: any[];
    savedConfigurations: any[];
    visualPresets: any[];
}) => {
    try {
        const sessionId = getSessionId();
        
        const { error } = await supabase
            .from('user_sessions')
            .upsert({
                session_id: sessionId,
                current_question_index: data.currentQuestionIndex,
                prompt_data: data.promptData,
                knowledge_docs: data.knowledgeDocs,
                saved_configurations: data.savedConfigurations,
                visual_presets: data.visualPresets,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'session_id'
            });
        
        if (error) {
            console.error('Error saving progress:', error);
            return false;
        }
        
        console.log('Progress saved successfully');
        return true;
    } catch (error) {
        console.error('Failed to save progress:', error);
        return false;
    }
};

// Load user progress from Supabase
export const loadUserProgress = async () => {
    try {
        const sessionId = getSessionId();
        
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // No data found, return null
                return null;
            }
            console.error('Error loading progress:', error);
            return null;
        }
        
        return {
            currentQuestionIndex: data.current_question_index || 0,
            promptData: data.prompt_data || {},
            knowledgeDocs: data.knowledge_docs || [],
            savedConfigurations: data.saved_configurations || [],
            visualPresets: data.visual_presets || []
        };
    } catch (error) {
        console.error('Failed to load progress:', error);
        return null;
    }
};

// Save complete storyboard
export const saveStoryboard = async (name: string, data: {
    timelineItems: any[];
    compositions: any;
    lightingData: any;
    colorGradingData: any;
    cameraMovement: any;
    aspectRatios: any;
    styles: any;
    soundDesignData?: any;
    castingData?: any;
}) => {
    try {
        const sessionId = getSessionId();
        
        const { error } = await supabase
            .from('storyboard_saves')
            .insert({
                session_id: sessionId,
                name,
                timeline_items: data.timelineItems,
                compositions: data.compositions,
                lighting_data: data.lightingData,
                color_grading_data: data.colorGradingData,
                camera_movement: data.cameraMovement,
                aspect_ratios: data.aspectRatios,
                styles: data.styles,
                sound_design_data: data.soundDesignData || {},
                casting_data: data.castingData || {}
            });
        
        if (error) {
            console.error('Error saving storyboard:', error);
            return false;
        }
        
        console.log('Storyboard saved successfully');
        return true;
    } catch (error) {
        console.error('Failed to save storyboard:', error);
        return false;
    }
};

// Load all storyboards for current session
export const loadStoryboards = async () => {
    try {
        const sessionId = getSessionId();
        
        const { data, error } = await supabase
            .from('storyboard_saves')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading storyboards:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Failed to load storyboards:', error);
        return [];
    }
};

// Delete a storyboard
export const deleteStoryboard = async (id: string) => {
    try {
        const { error } = await supabase
            .from('storyboard_saves')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Error deleting storyboard:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Failed to delete storyboard:', error);
        return false;
    }
};

// Auto-save functionality with debouncing
let autoSaveTimeout: NodeJS.Timeout | null = null;

export const scheduleAutoSave = (callback: () => void, delay: number = 2000) => {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    autoSaveTimeout = setTimeout(() => {
        callback();
        autoSaveTimeout = null;
    }, delay);
};
