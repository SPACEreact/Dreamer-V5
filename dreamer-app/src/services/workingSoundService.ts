// Working Sound Design Service (No External API Required)
// Provides professional sound design suggestions with built-in expertise

import { AudioMoodTag, AudioSuggestion, FoleySuggestion } from '../types';

// Professional sound design database
const soundDesignDatabase = {
    moods: {
        ambient: {
            tags: ['ambient', 'atmospheric', 'environmental'],
            sounds: [
                'Subtle room tone with gentle HVAC humming',
                'Soft wind through trees with distant bird calls',
                'Calm ocean waves lapping on shore',
                'Gentle rain on leaves with distant thunder',
                'Peaceful forest with rustling leaves'
            ],
            colors: ['from-blue-500 to-cyan-500']
        },
        tense: {
            tags: ['tense', 'suspenseful', 'anxiety-inducing'],
            sounds: [
                'Sharp digital beeps and electronic glitches',
                'Clock ticking with heartbeat percussion',
                'Heavy breathing with subtle metallic scraping',
                'Electrical hum with intermittent power surges',
                'Footsteps on creaking wooden floors'
            ],
            colors: ['from-red-500 to-orange-500']
        },
        romantic: {
            tags: ['romantic', 'intimate', 'warm'],
            sounds: [
                'Gentle piano with soft string swells',
                'Coffee shop ambiance with quiet conversations',
                'Fireplace crackling with warm acoustic guitar',
                'Violin solo with soft choir harmonies',
                'Ocean waves at sunset with acoustic melody'
            ],
            colors: ['from-pink-500 to-rose-500']
        },
        epic: {
            tags: ['epic', 'heroic', 'powerful'],
            sounds: [
                'Full orchestral swells with choir',
                'Dramatic percussion with brass fanfares',
                'Thunderous drums with electric guitars',
                'Choir building to powerful crescendo',
                'Massive orchestra with heroic themes'
            ],
            colors: ['from-purple-500 to-indigo-500']
        },
        mysterious: {
            tags: ['mysterious', 'enigmatic', 'intriguing'],
            sounds: [
                'Ethereal synthesizers with distant echoes',
                'Whispers and mysterious ambient pads',
                'Haunting vocalizations with reverb',
                'Dark ambient textures with subtle movement',
                'Mysterious chimes with deep drones'
            ],
            colors: ['from-violet-500 to-purple-500']
        },
        action: {
            tags: ['action', 'dynamic', 'energetic'],
            sounds: [
                'Fast-paced percussion with metal crashes',
                'Electric guitars with rapid drum patterns',
                'Helicopter blades with gunshots and explosions',
                'High-energy electronic beats with sound effects',
                'Car engines revving with tire screeching'
            ],
            colors: ['from-orange-500 to-red-600']
        },
        suspense: {
            tags: ['suspense', 'building tension', 'anticipation'],
            sounds: [
                'Slow build with string tremolo and low drones',
                'Pulsating heartbeat with building orchestra',
                'Steady ticking with escalating percussion',
                'Whispered voices with ominous background',
                'Creaking sounds with building electronic tension'
            ],
            colors: ['from-yellow-500 to-amber-500']
        }
    },
    
    categories: {
        environmental: {
            name: 'Environmental',
            type: 'atmosphere',
            sounds: ['Wind', 'Rain', 'Ocean', 'Forest', 'City traffic', 'Room tone', 'HVAC', 'Fire crackling']
        },
        musical: {
            name: 'Musical',
            type: 'score',
            sounds: ['Piano', 'Strings', 'Orchestra', 'Choir', 'Synthesizer', 'Guitar', 'Violin', 'Brass']
        },
        sfx: {
            name: 'Sound Effects',
            type: 'effects',
            sounds: ['Footsteps', 'Doors', 'Glass breaking', 'Metal clanking', 'Electronics', 'Weapons', 'Vehicles', 'Machinery']
        },
        atmospheric: {
            name: 'Atmospheric',
            type: 'ambience',
            sounds: ['Drones', 'Pads', 'Textures', 'White noise', 'Pink noise', 'Reverb', 'Echo', 'Processing']
        }
    }
};

export const analyzeSoundMood = async (
    sceneDescription: string, 
    visualMood: string
): Promise<AudioMoodTag[]> => {
    try {
        // Intelligent mood analysis based on scene content
        const description = sceneDescription.toLowerCase();
        const visual = visualMood.toLowerCase();
        
        const detectedMoods: AudioMoodTag[] = [];
        
        // Scene-based mood detection
        if (description.includes('love') || description.includes('romantic') || description.includes('kiss') || description.includes('intimate')) {
            detectedMoods.push('romantic');
        }
        
        if (description.includes('action') || description.includes('fight') || description.includes('chase') || description.includes('fast')) {
            detectedMoods.push('action');
        }
        
        if (description.includes('dark') || description.includes('mystery') || description.includes('unknown') || description.includes('secret')) {
            detectedMoods.push('mysterious');
        }
        
        if (description.includes('peaceful') || description.includes('calm') || description.includes('quiet') || description.includes('serene')) {
            detectedMoods.push('ambient');
        }
        
        if (description.includes('heroic') || description.includes('triumph') || description.includes('victory') || description.includes('powerful')) {
            detectedMoods.push('epic');
        }
        
        if (description.includes('tension') || description.includes('worry') || description.includes('fear') || description.includes('nervous')) {
            detectedMoods.push('tense');
        }
        
        if (description.includes('waiting') || description.includes('anticipation') || description.includes('building') || description.includes('suspense')) {
            detectedMoods.push('suspense');
        }
        
        // Default moods if none detected
        if (detectedMoods.length === 0) {
            detectedMoods.push('ambient');
            if (Math.random() > 0.5) detectedMoods.push('mysterious');
        }
        
        // Limit to 2-3 moods for focus
        return detectedMoods.slice(0, 3);
        
    } catch (error) {
        console.error("Sound mood analysis failed:", error);
        return ['ambient']; // Safe fallback
    }
};

export const generateSoundSuggestions = async (
    sceneDescription: string,
    mood: AudioMoodTag[],
    cameraMovement: string,
    lighting: string
): Promise<AudioSuggestion[]> => {
    try {
        const suggestions: AudioSuggestion[] = [];
        
        // Generate 5-7 professional sound suggestions based on moods
        for (let i = 0; i < 6; i++) {
            const selectedMood = mood[i % mood.length];
            const moodData = soundDesignDatabase.moods[selectedMood];
            
            if (moodData) {
                const soundIndex = Math.floor(Math.random() * moodData.sounds.length);
                const sound = moodData.sounds[soundIndex];
                const categoryKeys = Object.keys(soundDesignDatabase.categories);
                const randomCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
                const categoryData = soundDesignDatabase.categories[randomCategory];
                
                suggestions.push({
                    id: `sound_${Date.now()}_${i}`,
                    category: categoryData,
                    description: sound,
                    duration: Math.floor(Math.random() * 8) + 3, // 3-10 seconds
                    mood: selectedMood
                });
            }
        }
        
        // Add camera movement-specific sounds
        if (cameraMovement.toLowerCase().includes('dolly')) {
            suggestions.push({
                id: `sound_${Date.now()}_camera`,
                category: { 
                    id: 'sfx_effects', 
                    name: 'Sound Effects', 
                    type: 'sfx' as const, 
                    description: 'Sound effects for various actions and movements',
                    mood: ['ambient'] as AudioMoodTag[]
                },
                description: 'Subtle dolly track mechanical sounds',
                duration: 4,
                mood: 'ambient'
            });
        }
        
        return suggestions;
        
    } catch (error) {
        console.error("Sound suggestions generation failed:", error);
        return [];
    }
};

export const generateFoleySuggestions = async (
    characters: string[],
    sceneDescription: string,
    cameraMovement: string
): Promise<FoleySuggestion[]> => {
    try {
        const foley: FoleySuggestion[] = [];
        
        // Character-specific foley suggestions
        characters.forEach((character, index) => {
            const foleyTypes = [
                {
                    effect: `Subtle ${character.toLowerCase()} footsteps on hardwood`,
                    timing: 'continuous during movement',
                    description: 'Natural walking rhythm with slight heel strikes'
                },
                {
                    effect: `Clothing rustle from ${character.toLowerCase()}'s movement`,
                    timing: 'during gestures',
                    description: 'Fabric movement adding realism to character actions'
                },
                {
                    effect: `Breathing and vocal nuances for ${character.toLowerCase()}`,
                    timing: 'during dialogue pauses',
                    description: 'Subtle breathing and vocal expression details'
                }
            ];
            
            foleyTypes.forEach((foleyType, foleyIndex) => {
                foley.push({
                    id: `foley_${Date.now()}_${index}_${foleyIndex}`,
                    characterName: character,
                    soundEffect: foleyType.effect,
                    timing: foleyType.timing,
                    description: foleyType.description
                });
            });
        });
        
        // Environmental foley based on scene
        const scene = sceneDescription.toLowerCase();
        if (scene.includes('office') || scene.includes('workplace')) {
            foley.push({
                id: `foley_${Date.now()}_env_1`,
                characterName: 'Environment',
                soundEffect: 'Keyboard typing and office ambiance',
                timing: 'background atmosphere',
                description: 'Professional workplace sound layer'
            });
        }
        
        if (scene.includes('cafe') || scene.includes('restaurant')) {
            foley.push({
                id: `foley_${Date.now()}_env_2`,
                characterName: 'Environment',
                soundEffect: 'Coffee machine and quiet conversations',
                timing: 'persistent ambience',
                description: 'Warm social atmosphere sound design'
            });
        }
        
        return foley.slice(0, 8); // Limit to 8 suggestions
        
    } catch (error) {
        console.error("Foley suggestions generation failed:", error);
        return [];
    }
};