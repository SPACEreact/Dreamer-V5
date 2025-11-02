// Working Casting Service (No External API Required)
// Provides professional casting suggestions with built-in expertise

import { CharacterAnalysis, CastingSuggestion, AgeRange, Gender, Ethnicity, PhysicalBuild } from '../types';

// Professional casting database with diverse options
const castingDatabase = {
    ageRanges: ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'] as AgeRange[],
    genders: ['male', 'female', 'non-binary', 'any'] as Gender[],
    ethnicities: ['any', 'caucasian', 'african', 'asian', 'hispanic', 'middle-eastern', 'mixed'] as Ethnicity[],
    builds: ['slim', 'athletic', 'average', 'muscular', 'plus-size'] as PhysicalBuild[],
    
    physicalTraits: {
        height: ['short', 'average height', 'tall', 'very tall'],
        builds: {
            slim: ['lean build', 'delicate frame', 'wiry physique', 'graceful silhouette'],
            athletic: ['toned physique', 'muscular yet agile', 'sporty build', 'fitness-oriented body'],
            average: ['balanced proportions', 'classic build', 'middle-of-the-road physique', 'versatile frame'],
            muscular: ['powerful build', 'defined musculature', 'strong frame', 'imposing presence'],
            'plus-size': ['full-figured', 'voluptuous silhouette', 'curvaceous form', 'lush proportions']
        }
    },
    
    personalityTraits: [
        'confident', 'introspective', 'dynamic', 'mysterious', 'warm', 'intense',
        'charismatic', 'thoughtful', 'rebellious', 'nurturing', 'determined', 'vulnerable',
        'witty', 'serious', 'playful', 'dramatic', 'calm', 'passionate'
    ],
    
    actingStyles: [
        'method acting', 'naturalistic style', 'theatrical presence', 'subtle realism',
        'charismatic performance', 'intense emotional range', 'comedic timing',
        'dramatic gravitas', 'athletic physicality', 'vocal versatility'
    ],
    
    diverseActors: {
        caucasian: [
            {
                description: 'Strong-jawed actor with piercing blue eyes and athletic build',
                physicalDescription: 'Tall, athletic build with defined features and natural stage presence',
                actingNotes: 'Method actor with intense emotional preparation and strong physical commitment',
                diversityConsideration: 'Brings authenticity to complex emotional characters with deep psychological depth'
            },
            {
                description: 'Warm, approachable performer with natural comedic timing',
                physicalDescription: 'Average height with expressive features and engaging smile',
                actingNotes: 'Natural comedic instincts with strong improv skills and audience connection',
                diversityConsideration: 'Represents everyday working-class characters with genuine relatability'
            }
        ],
        african: [
            {
                description: 'Regal presence with commanding voice and natural authority',
                physicalDescription: 'Tall, dignified bearing with strong bone structure and expressive eyes',
                actingNotes: 'Classical training with powerful vocal projection and dramatic presence',
                diversityConsideration: 'Brings gravitas to leadership roles and challenges stereotypical casting'
            },
            {
                description: 'Dynamic performer with infectious energy and emotional depth',
                physicalDescription: 'Athletic build with radiant smile and expressive facial features',
                actingNotes: 'Versatile performer equally comfortable with drama and comedy',
                diversityConsideration: 'Represents the full spectrum of Black experiences and stories'
            }
        ],
        asian: [
            {
                description: 'Subtle performer with nuanced emotional expression',
                physicalDescription: 'Medium build with delicate features and thoughtful demeanor',
                actingNotes: 'Precision-based acting style with attention to subtle character details',
                diversityConsideration: 'Brings authentic representation to Asian characters beyond stereotypical roles'
            },
            {
                description: 'Martial arts trained actor with disciplined physical presence',
                physicalDescription: 'Lean, athletic build with focused eyes and controlled movements',
                actingNotes: 'Combines physical training with emotional depth and character analysis',
                diversityConsideration: 'Represents diverse Asian backgrounds and experiences authentically'
            }
        ],
        hispanic: [
            {
                description: 'Passionate performer with natural warmth and emotional intensity',
                physicalDescription: 'Medium height with expressive eyes and vibrant personality',
                actingNotes: 'Method approach with deep emotional investment and cultural authenticity',
                diversityConsideration: 'Brings genuine Latino representation with complex character depth'
            },
            {
                description: 'Charismatic actor with infectious humor and stage presence',
                physicalDescription: 'Average build with engaging smile and confident posture',
                actingNotes: 'Natural comedic timing with strong dramatic range and improvisation skills',
                diversityConsideration: 'Represents the warmth and complexity of Hispanic cultures'
            }
        ],
        'middle-eastern': [
            {
                description: 'Sophisticated performer with intellectual gravitas',
                physicalDescription: 'Medium-tall build with refined features and thoughtful eyes',
                actingNotes: 'Classical training combined with modern approach to character work',
                diversityConsideration: 'Brings authentic Middle Eastern representation with cultural depth'
            }
        ],
        mixed: [
            {
                description: 'Unique appearance with captivating presence and versatility',
                physicalDescription: 'Mixed heritage features with distinctive looks and confident bearing',
                actingNotes: 'Adaptable performer who can portray diverse characters authentically',
                diversityConsideration: 'Represents the beautiful diversity of mixed-race experiences and identities'
            }
        ],
        any: [
            {
                description: 'Incredibly versatile performer who can adapt to any character type',
                physicalDescription: 'Flexible physicality and chameleon-like ability to transform',
                actingNotes: 'Master of character transformation with extensive training in multiple techniques',
                diversityConsideration: 'Can authentically represent any background while bringing fresh perspective'
            }
        ]
    }
};

export const analyzeCharacter = async (
    characterName: string,
    description: string,
    dialogueSamples?: string
): Promise<CharacterAnalysis> => {
    try {
        // Intelligent character analysis based on name and description
        const name = characterName.toLowerCase();
        const desc = description.toLowerCase();
        const dialogue = (dialogueSamples || '').toLowerCase();
        
        // Determine age range based on context
        let ageRange: AgeRange = '26-35'; // Default
        if (desc.includes('young') || name.includes('child') || name.includes('teen')) {
            ageRange = '18-25';
        } else if (desc.includes('elderly') || desc.includes('senior') || name.includes('grandma')) {
            ageRange = '56-65';
        }
        
        // Determine gender preference
        let gender: Gender = 'any';
        if (desc.includes('he ') || desc.includes('his ') || desc.includes('male')) {
            gender = 'male';
        } else if (desc.includes('she ') || desc.includes('her ') || desc.includes('female')) {
            gender = 'female';
        }
        
        // Determine ethnicity options (focus on diversity)
        const ethnicityOptions: Ethnicity[] = ['caucasian', 'african', 'asian', 'hispanic', 'mixed', 'any'];
        
        // Determine physical build based on context
        let build: PhysicalBuild = 'average';
        if (desc.includes('muscular') || desc.includes('strong') || desc.includes('athletic')) {
            build = 'athletic';
        } else if (desc.includes('slim') || desc.includes('thin') || desc.includes('delicate')) {
            build = 'slim';
        } else if (desc.includes('large') || desc.includes('big') || desc.includes('plus-size')) {
            build = 'plus-size';
        }
        
        // Generate personality traits based on character
        const personalityTraits = generatePersonalityTraits(desc);
        
        // Determine acting style requirements
        const actingStyle = generateActingStyle(desc, dialogue);
        
        // Generate distinctive features
        const distinctiveFeatures = generateDistinctiveFeatures(desc);
        
        return {
            name: characterName,
            ageRange,
            gender,
            ethnicity: ethnicityOptions,
            physicalTraits: {
                build,
                distinctiveFeatures
            },
            personalityTraits,
            actingStyle
        };
        
    } catch (error) {
        console.error("Character analysis failed:", error);
        // Return safe default
        return {
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
        };
    }
};

const generatePersonalityTraits = (description: string): string[] => {
    const traits: string[] = [];
    
    // Map descriptive words to personality traits
    const traitMap: { [key: string]: string } = {
        'leader': 'confident',
        'quiet': 'introspective', 
        'funny': 'witty',
        'serious': 'serious',
        'caring': 'nurturing',
        'rebel': 'rebellious',
        'thinker': 'thoughtful',
        'dreamer': 'passionate',
        'fighter': 'determined',
        'mysterious': 'mysterious',
        'warm': 'warm',
        'cold': 'intense'
    };
    
    for (const [key, trait] of Object.entries(traitMap)) {
        if (description.includes(key)) {
            traits.push(trait);
        }
    }
    
    // Add some random traits for diversity
    const availableTraits = castingDatabase.personalityTraits.filter(t => !traits.includes(t));
    while (traits.length < 3 && availableTraits.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTraits.length);
        traits.push(availableTraits.splice(randomIndex, 1)[0]);
    }
    
    return traits;
};

const generateActingStyle = (description: string, dialogue: string): string[] => {
    const styles: string[] = [];
    
    if (description.includes('comedy') || description.includes('funny')) {
        styles.push('comedic timing');
    }
    if (description.includes('drama') || description.includes('serious')) {
        styles.push('dramatic gravitas');
    }
    if (description.includes('action') || description.includes('physical')) {
        styles.push('athletic physicality');
    }
    if (dialogue && dialogue.length > 0) {
        styles.push('vocal versatility');
    }
    
    // Add some general styles
    const generalStyles = ['naturalistic style', 'subtle realism', 'charismatic performance'];
    styles.push(...generalStyles.slice(0, 2));
    
    return styles;
};

const generateDistinctiveFeatures = (description: string): string[] => {
    const features: string[] = [];
    
    if (description.includes('scar')) features.push('distinctive scar');
    if (description.includes('tattoo')) features.push('prominent tattoos');
    if (description.includes('glasses')) features.push('distinctive eyewear');
    if (description.includes('hair')) features.push('striking hair color/style');
    
    return features;
};

export const generateCastingSuggestions = async (
    character: CharacterAnalysis,
    sceneContext: string,
    diversityFocus: boolean = true
): Promise<CastingSuggestion> => {
    try {
        const suggestions = [];
        
        // Generate diverse casting suggestions
        const selectedEthnicities = diversityFocus 
            ? ['african', 'asian', 'hispanic', 'mixed', 'caucasian']
            : ['caucasian', 'any'];
        
        for (const ethnicity of selectedEthnicities.slice(0, 5)) {
            const actors = castingDatabase.diverseActors[ethnicity];
            if (actors && actors.length > 0) {
                const actor = actors[Math.floor(Math.random() * actors.length)];
                
                suggestions.push({
                    description: actor.description,
                    ageRange: character.ageRange,
                    physicalDescription: actor.physicalDescription,
                    actingNotes: actor.actingNotes,
                    diversityConsideration: actor.diversityConsideration
                });
            }
        }
        
        return {
            id: crypto.randomUUID(),
            characterName: character.name,
            suggestions
        };
        
    } catch (error) {
        console.error("Casting suggestions generation failed:", error);
        return {
            id: crypto.randomUUID(),
            characterName: character.name,
            suggestions: []
        };
    }
};