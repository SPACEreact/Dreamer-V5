// Enhanced Gemini Service with Extended Capabilities
// Adds TTS, advanced prompting, and enhanced AI features

import { 
    analyzeSoundMood as geminiAnalyzeSoundMood,
    generateSoundSuggestions as geminiGenerateSoundSuggestions,
    generateFoleySuggestions as geminiGenerateFoleySuggestions,
    analyzeCharacter as geminiAnalyzeCharacter,
    generateCastingSuggestions as geminiGenerateCastingSuggestions
} from './geminiService';
import { AudioMoodTag, AudioSuggestion, FoleySuggestion, CharacterAnalysis, CastingSuggestion } from '../types';

// Text-to-Speech using Web Speech API as fallback
class TextToSpeechService {
    private synth: SpeechSynthesis | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    
    constructor() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.synth = window.speechSynthesis;
            this.loadVoices();
        }
    }
    
    private loadVoices() {
        if (!this.synth) return;
        
        this.voices = this.synth.getVoices();
        
        if (this.voices.length === 0) {
            this.synth.addEventListener('voiceschanged', () => {
                this.voices = this.synth!.getVoices();
            });
        }
    }
    
    speak(text: string, options: { voice?: string, rate?: number, pitch?: number } = {}) {
        if (!this.synth) {
            console.warn('Text-to-Speech not supported in this environment');
            return;
        }
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find appropriate voice
        if (options.voice) {
            const voice = this.voices.find(v => v.name.includes(options.voice!));
            if (voice) utterance.voice = voice;
        } else {
            // Use a natural-sounding voice if available
            const preferredVoice = this.voices.find(v => 
                v.name.includes('Natural') || 
                v.name.includes('Premium') ||
                v.lang.startsWith('en-')
            );
            if (preferredVoice) utterance.voice = preferredVoice;
        }
        
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        
        this.synth.speak(utterance);
    }
    
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
    
    getAvailableVoices() {
        return this.voices;
    }
}

// Singleton instance
const ttsService = new TextToSpeechService();

// Enhanced Sound Design Functions with TTS Preview
/**
 * Sanitizes error messages to prevent sensitive information exposure
 */
function sanitizeErrorMessage(error: unknown): string {
  const errorStr = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack || '' : '';
  
  const fullErrorText = `${errorStr}\n${errorStack}`;
  
  const sanitized = fullErrorText
    .replace(/AIza[0-9A-Za-z\-_]{35}/g, '[API_KEY]')
    .replace(/api[_-]?key["']?\s*[:=]\s*["']?([0-9A-Za-z\-_]{32,})/gi, 'api_key: [REDACTED]')
    .replace(/authorization["']?\s*[:=]\s*["']?Bearer\s+[0-9A-Za-z\-_.]+/gi, 'Authorization: Bearer [REDACTED]')
    .replace(/\b[0-9A-Za-z\-_]{40,}\b/g, '[REDACTED_TOKEN]')
    .replace(/process\.env\.[A-Z_]+/g, '[ENV_VAR]')
    .split('\n')[0];
    
  return sanitized;
}

export const analyzeSoundMoodEnhanced = async (
    sceneDescription: string, 
    visualMood: string
): Promise<{ moods: AudioMoodTag[], reasoning: string }> => {
    try {
        const moods = await geminiAnalyzeSoundMood(sceneDescription, visualMood);
        
        // Generate reasoning for the mood selection
        const reasoning = `Based on the scene description "${sceneDescription.substring(0, 50)}..." and visual mood "${visualMood}", the AI has identified ${moods.length} primary audio moods: ${moods.join(', ')}. This selection creates an immersive soundscape that enhances the emotional impact of the scene.`;
        
        return { moods, reasoning };
    } catch (error) {
        console.error('Enhanced sound mood analysis failed:', sanitizeErrorMessage(error));
        return { 
            moods: ['ambient'], 
            reasoning: 'Using default ambient mood due to analysis error.' 
        };
    }
};

export const generateSoundSuggestionsEnhanced = async (
    sceneDescription: string,
    mood: AudioMoodTag[],
    cameraMovement: string,
    lighting: string
): Promise<{ suggestions: AudioSuggestion[], description: string }> => {
    try {
        const suggestions = await geminiGenerateSoundSuggestions(
            sceneDescription, 
            mood, 
            cameraMovement, 
            lighting
        );
        
        const description = `Generated ${suggestions.length} professional sound suggestions optimized for ${mood.join('/')} mood with ${cameraMovement} camera movement and ${lighting} lighting. Each suggestion is carefully crafted to enhance the cinematic experience.`;
        
        return { suggestions, description };
    } catch (error) {
        console.error('Enhanced sound suggestions failed:', sanitizeErrorMessage(error));
        return { 
            suggestions: [], 
            description: 'Sound generation encountered an error.' 
        };
    }
};

export const generateFoleySuggestionsEnhanced = async (
    characters: string[],
    sceneDescription: string,
    cameraMovement: string
): Promise<{ suggestions: FoleySuggestion[], insights: string }> => {
    try {
        const suggestions = await geminiGenerateFoleySuggestions(
            characters,
            sceneDescription,
            cameraMovement
        );
        
        const insights = `Generated ${suggestions.length} foley suggestions for ${characters.length} character(s). These sound effects add realistic layers to character movements and interactions, creating a more immersive audio experience.`;
        
        return { suggestions, insights };
    } catch (error) {
        console.error('Enhanced foley suggestions failed:', sanitizeErrorMessage(error));
        return { 
            suggestions: [], 
            insights: 'Foley generation encountered an error.' 
        };
    }
};

// Preview audio suggestion using TTS
export const previewAudioSuggestion = (description: string) => {
    const previewText = `Audio suggestion: ${description}`;
    ttsService.speak(previewText, { rate: 1.1 });
};

// Stop audio preview
export const stopAudioPreview = () => {
    ttsService.stop();
};

// Enhanced Casting Functions with Advanced Analysis
export const analyzeCharacterEnhanced = async (
    characterName: string,
    description: string,
    dialogueSamples?: string
): Promise<{ analysis: CharacterAnalysis, insights: string }> => {
    try {
        const analysis = await geminiAnalyzeCharacter(characterName, description, dialogueSamples);
        
        const insights = `AI analysis for ${characterName}: Identified as ${analysis.ageRange} ${analysis.gender} with ${analysis.physicalTraits.build} build. The character exhibits ${analysis.personalityTraits.length} key personality traits and requires ${analysis.actingStyle.length} specific acting approaches. This comprehensive analysis ensures authentic casting recommendations.`;
        
        return { analysis, insights };
    } catch (error) {
        console.error('Enhanced character analysis failed:', sanitizeErrorMessage(error));
        return {
            analysis: {
                name: characterName,
                ageRange: '26-35',
                gender: 'any',
                ethnicity: ['any'],
                physicalTraits: {
                    build: 'average',
                    distinctiveFeatures: []
                },
                personalityTraits: [],
                actingStyle: []
            },
            insights: 'Character analysis encountered an error. Using default values.'
        };
    }
};

export const generateCastingSuggestionsEnhanced = async (
    character: CharacterAnalysis,
    sceneContext: string,
    diversityFocus: boolean = true
): Promise<{ suggestions: CastingSuggestion, diversityScore: number, summary: string }> => {
    try {
        const suggestions = await geminiGenerateCastingSuggestions(character, sceneContext, diversityFocus);
        
        // Calculate diversity score based on suggestions
        const diversityScore = calculateDiversityScore(suggestions);
        
        const summary = `Generated ${suggestions.suggestions.length} diverse casting options for ${character.name}. ${diversityFocus ? 'Diversity-focused casting ensures inclusive representation across multiple backgrounds and perspectives.' : 'Standard casting approach with balanced options.'} Diversity score: ${diversityScore}%.`;
        
        return { suggestions, diversityScore, summary };
    } catch (error) {
        console.error('Enhanced casting suggestions failed:', sanitizeErrorMessage(error));
        return {
            suggestions: {
                id: crypto.randomUUID(),
                characterName: character.name,
                suggestions: []
            },
            diversityScore: 0,
            summary: 'Casting generation encountered an error.'
        };
    }
};

const calculateDiversityScore = (castingSuggestion: CastingSuggestion): number => {
    // Safe array access with bounds checking
    if (!castingSuggestion || !castingSuggestion.suggestions || castingSuggestion.suggestions.length === 0) {
        return 0;
    }
    
    try {
        const uniqueBackgrounds = new Set(
            castingSuggestion.suggestions
                .filter(s => s && s.diversityConsideration) // Filter null/undefined items
                .map(s => s.diversityConsideration)
        );
        
        // Higher score for more diverse suggestions
        const score = (uniqueBackgrounds.size / castingSuggestion.suggestions.length) * 100;
        return Math.min(100, Math.max(0, score)); // Ensure score is between 0-100
    } catch (error) {
        console.error('Error calculating diversity score:', sanitizeErrorMessage(error));
        return 0;
    }
};

// Voice preview for casting suggestions
export const previewCastingSuggestion = (suggestion: string) => {
    const previewText = `Casting suggestion: ${suggestion}`;
    ttsService.speak(previewText, { rate: 1.0, pitch: 0.9 });
};

// Advanced prompt enhancement for better AI results
export const enhancePromptForAI = (basePrompt: string, context: string): string => {
    return `${basePrompt}

ADDITIONAL CONTEXT:
${context}

Please provide detailed, professional, and creative suggestions that align with industry best practices and cinematic excellence.`;
};

// Get TTS service for external use
export const getTTSService = () => ttsService;

// Export usage monitoring
export const getEnhancedServiceStats = () => {
    return {
        ttsAvailable: ttsService !== null,
        availableVoices: ttsService?.getAvailableVoices().length || 0,
        timestamp: new Date().toISOString()
    };
};
