import { PreloadedKnowledge } from './types';

export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 450;

// ===== VISUAL STAGE CONFIGURATION =====
export const STAGE_CONFIG = {
  // Character rendering
  CHARACTER_RADIUS: 16,
  CHARACTER_NAME_FONT_SIZE: 14,
  CHARACTER_LABEL_OFFSET_Y: 24,
  
  // Stage boundaries
  STAGE_MARGIN: 20,
  STAGE_BORDER_WIDTH: 2,
  STAGE_GRID_SIZE: 100,
  
  // Color and styling
  CHARACTER_COLOR: '#f59e0b',
  STAGE_BORDER_COLOR: '#374151',
  STAGE_GRID_COLOR: '#1f2937',
  LABEL_COLOR: '#f8fafc',
} as const;

// ===== LIGHTING CONFIGURATION =====
export const LIGHTING_DEFAULTS = {
  // Intensity ranges
  MIN_INTENSITY: 0,
  MAX_INTENSITY: 100,
  DEFAULT_KEY_LIGHT: 80,
  DEFAULT_FILL_LIGHT: 40,
  DEFAULT_BACK_LIGHT: 60,
  DEFAULT_AMBIENT: 20,
  
  // Color temperature
  MIN_COLOR_TEMP: 2000,
  MAX_COLOR_TEMP: 8000,
  STEP_COLOR_TEMP: 100,
  DEFAULT_COLOR_TEMP: 4500,
} as const;

// Color palette for lighting
export const LIGHTING_COLORS = {
  KEY_LIGHT: '#FFD8A8',
  FILL_LIGHT: '#89CFF0',
  BACK_LIGHT: '#FACC15',
} as const;

// ===== COLOR GRADING CONFIGURATION =====
export const COLOR_GRADING_DEFAULTS = {
  // Tone adjustments
  MIN_TONE: -50,
  MAX_TONE: 50,
  DEFAULT_SATURATION: 10,
  DEFAULT_CONTRAST: 5,
  DEFAULT_HIGHLIGHTS: 5,
  DEFAULT_SHADOWS: -5,
} as const;

// Default color palette
export const DEFAULT_COLOR_PALETTE = [
  '#0F172A', '#1E293B', '#475569', '#F97316', 
  '#FBBF24', '#FDE68A', '#38BDF8', '#A855F7'
] as const;

// ===== CAMERA MOVEMENT CONFIGURATION =====
export const CAMERA_DEFAULTS = {
  // Position ranges
  MIN_X: 0,
  MIN_Y: 0,
  DEFAULT_START_X: 100,
  DEFAULT_START_Y: 300,
  DEFAULT_END_X: 700,
  DEFAULT_END_Y: 150,
  
  // Movement parameters
  DEFAULT_DURATION: 5,
  DEFAULT_FOCAL_LENGTH: 35,
  
  // Scale factors
  STAGE_SCALE_X: 1,
  STAGE_SCALE_Y: 1,
} as const;

// ===== IMAGE GENERATION CONFIGURATION =====
export const IMAGE_GENERATION = {
  // Prompt limits
  MAX_PROMPT_LENGTH: 8000,
  NANO_PROMPT_LENGTH: 200,
  PREVIEW_PROMPT_LENGTH: 100,
  
  // Image quality settings
  DEFAULT_ASPECT_RATIO: '16:9',
  HIGH_QUALITY_ASPECT_RATIO: '16:9',
  
  // Rate limiting
  RATE_LIMIT_DELAY: 2000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// ===== FILE UPLOAD CONSTRAINTS =====
export const FILE_UPLOAD = {
  // Size limits (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,
  
  // MIME type validation
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  
  // Processing
  MAX_PROCESSING_TIME: 30000, // 30 seconds
} as const;

// ===== TIMING AND ANIMATION =====
export const TIMING = {
  // Animation durations (milliseconds)
  AUTO_SAVE_INTERVAL: 5000,
  FILE_UPLOAD_TIMEOUT: 30000,
  API_REQUEST_TIMEOUT: 45000,
  PROGRESS_SAVE_DEBOUNCE: 2000,
  
  // Animation scales
  HOVER_SCALE: 1.05,
  TAP_SCALE: 0.95,
  
  // Motion animation durations
  MOTION_DURATION: 0.8,
  BUTTON_SCALE_ANIMATION_DURATION: 0.6,
  MENU_ANIMATION_DURATION: 0.4,
  TRANSITION_DURATION: 0.5,
  
  // Local storage
  STORAGE_KEY_PREFIX: 'dreamer_',
  STORAGE_PREFIXES: {
    CONFIGS: 'dreamerConfigs',
    KNOWLEDGE: 'dreamerKnowledge',
    VISUAL_PRESETS: 'dreamerVisualPresets',
    COMPOSITIONS: 'dreamerCompositions',
    LIGHTING: 'dreamerLighting',
    COLOR: 'dreamerColor',
    MOVEMENT: 'dreamerMovement',
    STYLES: 'dreamerStyles',
  } as const,
} as const;

// ===== API AND SERVICE CONSTANTS =====
export const API_CONFIG = {
  // Gemini AI
  GEMINI_MODEL: 'gemini-2.5-pro',
  GEMINI_MAX_TOKENS: 32768,
  
  // File processing
  MAX_ANALYSIS_LENGTH: 8000,
  
  // Response schemas
  JSON_RESPONSE_TYPE: 'application/json',
} as const;

// ===== ERROR HANDLING PATTERNS =====
export const ERROR_PATTERNS = {
  // Standard error messages
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. The operation took longer than expected.',
  VALIDATION_ERROR: 'Invalid input provided. Please check your data and try again.',
  FILE_UPLOAD_ERROR: 'File upload failed. Please check your file and try again.',
  IMAGE_GENERATION_ERROR: 'Image generation failed. Please try again with a different prompt.',
  AI_SERVICE_ERROR: 'AI service temporarily unavailable. Please try again later.',
  
  // Error codes
  ERROR_CODES: {
    NETWORK_FAILED: 'NETWORK_FAILED',
    TIMEOUT: 'TIMEOUT',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION',
    RATE_LIMITED: 'RATE_LIMITED',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
    GENERATION_FAILED: 'GENERATION_FAILED',
  } as const,
} as const;

// ===== NUMERIC CONSTANTS =====
export const NUMERIC = {
  // Generic limits
  MAX_STRING_LENGTH: 500000,
  MAX_TOKENS: 8000,
  MIN_STRING_LENGTH: 0,
  
  // UI thresholds
  MAX_TIMELINE_ITEMS: 100,
  MAX_VISUAL_PRESETS: 100,
  MAX_KNOWLEDGE_DOCS: 50,
  MAX_TOTAL_ITEMS: 1000,
  
  // Font sizes
  FONT_SIZE_SMALL: 12,
  FONT_SIZE_MEDIUM: 14,
  FONT_SIZE_LARGE: 16,
  FONT_SIZE_XLARGE: 18,
  
  // Spacing
  SPACING_SMALL: 4,
  SPACING_MEDIUM: 8,
  SPACING_LARGE: 16,
  SPACING_XLARGE: 24,
  
  // Border widths
  BORDER_WIDTH_THIN: 1,
  BORDER_WIDTH_MEDIUM: 2,
  BORDER_WIDTH_THICK: 4,
  
  // Z-index layers
  Z_INDEX_MODAL: 1000,
  Z_INDEX_DROPDOWN: 999,
  Z_INDEX_TOOLTIP: 9999,
} as const;

// ===== UI THRESHOLDS =====
export const UI_THRESHOLDS = {
  // Mobile detection breakpoints
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  
  // Animation thresholds
  MIN_DRAG_DISTANCE: 5,
  
  // Content limits
  MAX_VISUAL_PRESETS: 100,
  MAX_KNOWLEDGE_DOCS: 50,
  MAX_TOTAL_ITEMS: 1000,
} as const;

// ===== CHARACTER POSITION CONSTANTS =====
export const CHARACTER_POSITIONS = {
  // Camera angle position adjustments
  X_OFFSETS: {
    'steep reverence': -100,
    'whispered low': 100,
    'Dutch slip': 50,
    'true-eye, honest': 0
  } as const,
  
  // Character positioning ranges
  MIN_X: 20,
  MIN_Y: 20,
  MAX_X: STAGE_WIDTH - 20,
  MAX_Y: STAGE_HEIGHT - 20,
  
  // Character rendering
  CHARACTER_RADIUS: 16,
  NAME_OFFSET_Y: 24,
  
  // Default character positions
  DEFAULT_CHARACTERS: [
    { id: 'char-1', name: 'Subject A', x: 400, y: 225 },
    { id: 'char-2', name: 'Subject B', x: 280, y: 260 }
  ] as const,
} as const;

// ===== MIDJOURNEY PROMPT CONSTANTS =====
export const MIDJOURNEY = {
  DEFAULT_ASPECT_RATIO: '16:9',
  STYLE_FLAG: '--style dramatic',
  VERSION_FLAG: '--v 6',
  PROMPT_PREFIX: '/imagine prompt:',
} as const;

// ===== REGEX PATTERNS =====
export const REGEX = {
  // File extensions
  IMAGE_EXTENSIONS: /\.(jpg|jpeg|png|webp|gif|bmp)$/i,
  DOCUMENT_EXTENSIONS: /\.(txt|md|json|pdf|doc|docx)$/i,
  
  // Validation patterns
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  API_KEY: /^[A-Za-z0-9\-_]{32,}$/,
  
  // Content filtering
  CONTROL_CHARS: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  IFRAME_TAGS: /<iframe[^>]*>.*?<\/iframe>/gi,
  JAVASCRIPT_PROTOCOLS: /javascript:/gi,
} as const;

export const cameraHeightOptions = ['ground-level soul gaze', 'eye-level witness', 'elevated guardian', 'angelic drift'];
export const cameraAngleOptions = ['true-eye, honest', 'steep reverence', 'whispered low', 'Dutch slip'];
export const lightingMoodOptions = [
  'chiaroscuro confession',
  'soft volumetric prayer',
  'neon fever dream',
  'moonlit echo',
  'burnt tungsten reminiscence'
];
export const colorHarmonyOptions = ['complementary pulse', 'analogous drift', 'triadic bloom', 'monochrome trance', 'split-complementary tension'];
export const easingOptions = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];
export const movementTypes = ['static contemplation', 'slow dolly-in', 'crane ascent', 'handheld tremor', 'steadicam drift', 'orbital pan'];
export const easingMap: Record<string, any> = {
  linear: 'linear',
  'ease-in': 'easeIn',
  'ease-out': 'easeOut',
  'ease-in-out': 'easeInOut'
};

export const questions = [
    // MILESTONE 1: Script & Core (step 0)
    { id: 'scriptText', step: 0, category: 'Script Foundation', question: 'Optional: Share your script fragment or scene description', placeholder: 'Drop in a fragment if you want Dreamer to adapt pacing and continuity from the page.', type: 'script', randomOptions: ['He edits reels of his past while rain combs the window.','She waits in a station bathed in crimson departures.','They argue in whispers beneath the crashing surf.'] },
    
    // MILESTONE 2: Technical Setup (step 1)
    { id: 'sceneCore', step: 1, category: 'Scene & Technical', question: 'Describe your scene and choose technical specs: who, what, emotion + shots + camera + focal length', placeholder: 'A man edits reels of his past in a dark room while rain falls. 5 shots, Arri Alexa 65, 35mm cinematic', type: 'text', randomOptions: ['A woman reading letters in candlelit attic. 3 shots, Sony Venice 2, 50mm human-eye','Two siblings argue on motel balcony. 7 shots, Red Monstro 8K, 85mm intimate'] },
    { id: 'depthOfField', step: 1, category: 'Scene & Technical', question: 'Set depth of field for your sequence:', type: 'select', options: ['f/1.4 dreamy shallow', 'f/2.8 cinematic shallow', 'f/5.6 balanced', 'f/11 deep focus'] },
    
    // MILESTONE 3: Framing (step 2)
    { id: 'framing', step: 2, category: 'Visual Composition', question: 'Choose composition + camera angle + character blocking in one:', placeholder: 'Rule of thirds with eye-level witness. Protagonist centered in soft light, edge isolation for conflict.', type: 'text', randomOptions: ['Negative space with low-angle reverence. Protagonist edge isolation, background silhouettes','Golden ratio with high-angle confession. Centered protagonist, overlapping movement'] },
    
    // MILESTONE 4: Characters (step 3) - Streamlined: combined blocking questions
    { id: 'characterChoreography', step: 3, category: 'Character Presence', question: 'Describe all character positions and tensions in the frame:', placeholder: 'Main: centered in glow of single practical. Secondary: midground silhouettes. Opposition: off-frame shadow creeping along wall.', type: 'text', randomOptions: ['Main: edge isolation, half in shadow. Secondary: background figures through frosted glass. Opposition: rear silhouette behind gauze curtain.'] },
    
    // MILESTONE 5: Lighting (step 4) - Streamlined: combined lighting into one comprehensive question
    { id: 'lightingAtmosphere', step: 4, category: 'Lighting & Mood', question: 'Lighting mood + technical setup + atmosphere:', placeholder: 'Chiaroscuro contrast with 4:1 ratio and halation glow. Slow rain trembling against panes, volumetric fog.', type: 'text', randomOptions: ['Golden hour glow with twin practicals. Floating dust motes in projector light, tungsten haze.','Silhouette rim with underexposed edges. Moonlit reflection, fluorescent spill.'] },
    
    // MILESTONE 6: Color & Film (step 5) - Streamlined: combined film stock, grade, and palette
    { id: 'visualStyle', step: 5, category: 'Film Stock & Color', question: 'Film stock + texture + color grade + palette:', placeholder: 'Kodak Vision3 500T 5219 with 35mm grain. Teal-orange tension. Background #1A1F2B, midtone #4A6C6F, highlight #F2C27E', type: 'text', randomOptions: ['Fuji Eterna with halation bloom. Noir desaturation. Background #120E1A, midtone #3B2F58, highlight #E6B4F6','Polaroid pastel dream with medium ISO texture. Golden warmth. Dominant teal shadows, warm peach highlights.'] },
    { id: 'colorHarmony', step: 5, category: 'Film Stock & Color', question: 'Color harmony style:', type: 'select', options: colorHarmonyOptions },
    
    // MILESTONE 7: Story Voice (step 6) - Combined into comprehensive narrative
    { id: 'narrativeVoice', step: 6, category: 'Story Identity', question: 'Poetic line + visual identity + continuity:', placeholder: 'He edits by rhythm now, not reason. Cinematic, painterly, liminal. Tight continuity with mutated seeds.', type: 'text', randomOptions: ['Her laughter flickers against the wall like a ghost of light. Mythic surrealism, emotional realism. Poetic drift with rhythm-based motif.'] },
    
    // MILESTONE 8: Output (step 7) - Streamlined: combined output questions
    { id: 'outputSettings', step: 7, category: 'Final Output', question: 'Output format + fidelity + motion style:', placeholder: 'Cinematic frame with 4K render and focus pull from background to foreground. Steadycam drift.', type: 'text', randomOptions: ['Storyboard with filmic softness and breathing zoom drift. Static contemplation.','AI film still with photoreal detail and razor still focus. Orbital pan.'] }
];

export const preloadedKnowledgeBase: PreloadedKnowledge[] = [
    {
      id: 'preloaded-1',
      name: 'Story Structure & Narrative Frameworks',
      content: `A story structure... Generally story follow some structure, there are various way to do it and one of them is Harmon story circle 1. You A character in their zone of comfort 2. Need wants something 3. Go! so they enter an unfamiliar situation 4. Struggle to which they have to adapt 5. Find in order to get what they want 6. Suffer yet they have to make a sacrifice 7. Return before they return to their familiar situation 8. Change having changed fundamentally. The Hero’s journey- story structure: THE ORDINARY WORLD. THE CALL TO ADVENTURE. REFUSAL OF THE QUEST. ACCEPTING THE CALL: ENTERING THE UNKNOWN. SUPERNATURAL AID. TALISMAN: ALLIES/HELPERS. TESTS & THE SUPREME ORDEAL. REWARD AND THE JOURNEY HOME. MASTER OF TWO WORLDS/ RESTORING THE WORLD.`,
      extractedKnowledge: { themes: ['redemption', 'transformation', 'return'], visualStyles: ['epic journey', 'cyclical narrative', 'three-act structure'], characters: ['mentor', 'herald', 'trickster'], techniques: ['inciting incident', 'dark night of the soul', 'climax', 'The Hero\'s Journey'] }
    },
    {
      id: 'preloaded-2',
      name: 'Advanced Character Development',
      content: `A compelling protagonist is defined by their journey. Past: A character's past should not be a mere footnote, but a formative influence that actively shapes their present motivations, fears, and strengths. These past experiences, whether traumatic or triumphant, should ripple through their current actions and decisions. Present: The immediate challenges a character faces are the engine of your story. These conflicts can be multifaceted: External Conflict, Internal Conflict, Interpersonal Conflict. Escalate the Stakes: The inciting incident should not be a universal event with equal impact on all. For your protagonist, the stakes must be inherently higher, more personal, and potentially devastating if they fail. Pushing Boundaries: Don't hesitate to thrust your character out of their comfort zone from the outset. Chained Reactions: Avoid easily resolvable conflicts. A truly engaging narrative thrives on a chain reaction of escalating problems. ARCHETYPES APPEARING IN THE HERO’S JOURNEY: HEROES, SHADOWS, MENTORS, HERALD, THRESHOLD GUARDIANS, SHAPESHIFTERS, TRICKSTERS, ALLIES, WOMAN AS TEMPTRESS. Character arc, positive change- character might believe in a lie, goes through confrontation and then reaches acceptance. Flat character ARC- character already believe in truth, truth is tested… he wins and keep the truth. Negative character arc- character might loose positive character trait, keep believing in a lie and take decision on the basis of it resulting into negative outcome. Save the Cat is a screenwriting concept where the protagonist does something early in the story to make them relatable or likable.`,
      extractedKnowledge: { themes: ['internal conflict', 'fatal flaw', 'growth vs. stagnation'], visualStyles: ['character-driven scenes', 'subjective POV', 'emotional close-ups'], characters: ['reformer', 'loyalist', 'challenger', 'hero', 'shadow', 'mentor'], techniques: ['ghost/wound', 'active vs. passive choice', 'character introductions', 'positive arc', 'flat arc', 'negative arc', 'save the cat'] }
    },
    {
      id: 'preloaded-3',
      name: 'Cinematography & Camera Techniques',
      content: 'Notes. Write or draw the use of lightning, sound, camera movement, aspects ratio, character movment. Framing, composition. Angle. Transition between two frame Depth of field, by crossing out ,0ut of focus stuff. 180° rule, an imaginary line between two characters drawn… we are not supposed to cross the line… makes it look like both characters are in same place. Cut on action, switch between full to medium shot in a single scene. Show weather, time of the day. Movement of character should give sense of what they would do... Audience should be able to anticipate.',
      extractedKnowledge: { themes: ['power dynamics', 'isolation', 'freedom', 'anticipation'], visualStyles: ['dolly zoom', 'long take', 'dutch angle', 'weather effects'], characters: [], techniques: ['180-degree rule', 'rule of thirds', 'lead room', 'motivated character movement', 'cut on action', 'depth of field'] }
    },
    {
      id: 'preloaded-4',
      name: 'Professional Lighting',
      content: `Understanding Lighting: Shaping Mood and Form. Three-Point Lighting System: Key Light, Fill Light, Backlight (Rim/Separation Light), Kicker Light, Motivated Lighting. Lighting Techniques & Styles: Rembrandt Lighting, Loop Lighting, Split Lighting, Butterfly (Paramount) Lighting, Clamshell Lighting, Silhouette Lighting, Low-Key Lighting, High-Key Lighting. Light Softness & Distance: Larger light source = Softer shadows. Smaller light source = Harsher shadows. Closer light = Softer shadows. Farther light = Harsher shadows. Modifiers to Soften Light: Softbox, Umbrella, Bounce (Reflector), Diffusion Gel or Scrim. Additional Cinematic Rules: Shoot from the Dark Side. Broad vs. Short Lighting.`,
      extractedKnowledge: { themes: ['mystery', 'spirituality', 'interrogation', 'beauty', 'glamour'], visualStyles: ['chiaroscuro', 'high-key', 'low-key', 'silhouette', 'soft light', 'hard light'], characters: ['femme fatale', 'hardboiled detective'], techniques: ['three-point lighting', 'motivated lighting', 'practical lights', 'Butterfly lighting', 'Clamshell lighting', 'Rembrandt Lighting', 'Loop Lighting', 'Split Lighting', 'Short vs Broad lighting', 'light modifiers (softbox, umbrella)'] }
    },
    {
      id: 'preloaded-5',
      name: 'Dialogue & Subtext',
      content: `The Art of Scene Writing: Subtext and Transformation. A well-crafted scene is more than just dialogue and action. Subtext: Inject subtext into your scenes. Hint at deeper meanings, unspoken emotions, or underlying tensions without explicitly stating them. A subtle gesture, a loaded silence, or an object's placement can speak volumes. Scene Arc: Every scene should have a mini-arc, transforming the character or the situation. Initial Goal, Initial Action, Obstacle/Reaction, Transformation/New Correlation. Driving Questions: "Who wants what from whom?", "What happens if they don't get it?", "Why now?". Subtext is the unsaid—what’s felt, implied, or hinted at but never directly spoken. It turns simple dialogue into rich, multi-layered interactions. Enter Late, Exit Early: A storytelling principle used to keep scenes tight and impactful.`,
      extractedKnowledge: { themes: ['deception', 'unspoken truth', 'power struggle'], visualStyles: ['over-the-shoulder shots', 'reaction shots', 'two-shots'], characters: [], techniques: ['subtext', 'exposition as ammunition', 'pacing and rhythm', 'scene arc', 'enter late, exit early'] }
    },
    {
      id: 'preloaded-6',
      name: 'Conflict & Stakes',
      content: `The real unity of opposites is one in which compromise is impossible." - to write conflict dialogue becomes powerful when characters have hidden agendas. The Unity of Opposites is the theory that great conflict comes from characters with opposing needs, values, or goals, who are locked together in a situation where neither can back down or walk away. Inciting incidents, story generation methods, logline structure. Frame of movie writing process: LOGLINE, SYNOPSIS, PLOT DEVELOPMENT.`,
      extractedKnowledge: { themes: ['man vs. self', 'man vs. society', 'man vs. nature'], visualStyles: ['rising tension', 'montage sequences', 'cross-cutting'], characters: ['antagonist', 'protagonist'], techniques: ['ticking clock', 'raising the stakes', 'reversal of fortune', 'unity of opposites', 'logline', 'synopsis'] }
    },
    {
        id: 'preloaded-7',
        name: 'Opening Scene Hooks',
        content: 'Opening scene- flashback, flash forward, mid-story (in media res), newsreel, the setting, crime, direct addressing, tragedy, a day in life. These can even be called hooks… Establishing shot: wide shots that are shows in the starts of scene. Another hook, could be a tripod shot (static) or a chasing sequence.',
        extractedKnowledge: { themes: ['memory', 'destiny', 'chaos', 'exposition', 'atmosphere', 'justice', 'intimacy', 'loss', 'normalcy'], visualStyles: ['non-linear', 'in media res', 'documentary', 'world-building', 'noir', 'fourth-wall break', 'dramatic'], characters: [], techniques: ['flashback', 'flash-forward', 'cold open', 'montage', 'establishing shot', 'direct address'] }
    },
    {
        id: 'preloaded-8',
        name: 'Advanced Screenwriting Principles',
        content: 'Screenplay convention: Keep it visual and in present tense. Write V.O for voice over, add cut to or back to for scene change. Montage start and montage end. Dialogues in the centre. Linear vs Non-Linear Storylines. Exposition: The method of conveying backstory or world-building. Good exposition feels natural and is integrated into the story. Techniques include: Dialogues, Photographs/Documents, Flashbacks, Environment/Props.',
        extractedKnowledge: { themes: ['hidden meaning', 'efficiency', 'narrative structure', 'backstory'], visualStyles: ['layered performance', 'tight pacing', 'chronological vs fragmented', 'naturalistic reveals'], characters: [], techniques: ['subtextual dialogue', 'scene transitions', 'non-linear storytelling', 'show don\'t tell', 'V.O.', 'montage formatting'] }
    },
    {
        id: 'preloaded-9',
        name: 'Narrative Development & Visual Execution',
        content: `This guide explores key elements of narrative development and visual execution, offering insights for screenwriters, directors, and storytellers alike. Character Development: Past, Present, and Conflict. A compelling protagonist is defined by their journey. Their past should actively shape their present motivations, fears, and strengths. The immediate challenges a character faces are the engine of your story, including external, internal, and interpersonal conflicts. Escalate the stakes to be personal and devastating for the protagonist. Push characters out of their comfort zone from the outset. A truly engaging narrative thrives on a chain reaction of escalating problems. The Art of Scene Writing: Subtext and Transformation. Inject subtext into your scenes, hinting at deeper meanings without explicitly stating them. Every scene should have a mini-arc that transforms the character or the situation. Structure a powerful scene by asking: "Who wants what from whom?", "What happens if they don't get it?", and "Why now?". Storyboarding: Visualizing the Narrative. Storyboarding is the visual blueprint, detailing lighting, sound, camera movement, aspect ratio, character movement, framing, composition, angle, transition between frames, and depth of field. Screenplay Conventions: Adhere to standard conventions for clarity and professionalism. Describe what can be seen and heard in the present tense. Use standard formatting for Voice Over (V.O.), scene transitions ("CUT TO:"), and montages. Story Structure: Harmon Story Circle. A simplified variation of the "Hero's Journey": 1. You (Comfort Zone), 2. Need (Desire), 3. Go! (Unfamiliar Situation), 4. Struggle (Adaptation), 5. Find (Achievement), 6. Suffer (Sacrifice), 7. Return (Familiar Situation), 8. Change (Transformation).`,
        extractedKnowledge: { themes: ['Conflict', 'Transformation', 'Sacrifice', 'Personal Stakes', 'Duality', 'Introspection', 'Mystery'], visualStyles: ['Chiaroscuro', 'High Contrast', 'Motivated Lighting', 'Visual Blueprinting', 'Dynamic Composition'], characters: ['Protagonist', 'Antagonist'], techniques: ['Subtext','Scene Arc','Inciting Incident','Escalating Stakes','Three-Point Lighting','Key Light','Fill Light','Backlight','Kicker Light', 'Rembrandt Lighting','Loop Lighting','Split Lighting','Depth of Field','Screenplay Formatting (V.O., Montage)','Harmon Story Circle'] }
    },
    {
        id: 'preloaded-10',
        name: 'Advanced Character, World & Story Dynamics',
        content: `Deep character psychology including conscious/unconscious forces (people, institutions vs. myths, culture, memory). Core external conflict of the world. Thematic Suture (Unity of Opposites): a core theme confronted through two opposing values, with an antagonist who mirrors or distorts the protagonist. Dialogue & Contrast: a character's first line reflects their false belief; subvert stereotypes and reveal core contradictions. Plot & Arc (From Fracture to Catharsis): an external conflict drives the plot while an internal contradiction drives the character, from an inciting crisis through a midpoint twist to a final transformation or failure. Relatability & Transcendence: find the ordinary/human in a character to make their life feel mythic, creating an audience bond. Symbolic Objects & Motivated Cuts: use objects to represent inner truths and motivate visual cuts (match cut, smash cut). Enneagram x Want/Need x Power Dynamics grid for character reactions. 3 KEYFRAME STORY SEED STRUCTURE: a 7-step process from setup to final expression. CHARACTER–WORLD DYNAMIC GRID: maps conscious/unconscious characters pursuing need/want against a supporting/opposing world. Character Internal States: Outer Mask, Private Self, Core Wound/Truth. Social Reaction Shifts: "We are who we think they think we are."`,
        extractedKnowledge: { themes: ['Duality (Conscious/Unconscious)', 'Conflict (Internal/External)', 'Transformation', 'Subversion', 'Power Dynamics', 'Want vs. Need', 'Fate vs. Choice', 'Relatability', 'Transcendence', 'Audience Connection'], visualStyles: ['Symbolic Motifs', 'Motivated Cuts (Match, Smash, Echo)', 'Visual Echoes', 'Character-centric Framing', 'Thematic Color Palettes'], characters: ['Enneagram Archetypes', 'Characters defined by internal states (Mask, Private Self, Core Wound)', 'Antagonists as Mirrors', 'Subverted Stereotypes', 'Characters with hidden agendas'], techniques: ['Enneagram Story Arcs', 'Keyframe Story Structure', 'Character-World Dynamic Grid', 'Unity of Opposites', 'Inciting Crisis', 'Midpoint Twist', 'Symbolic Objects', 'First Line Character Reveal', 'Contradictory Behavior', 'Fracture to Catharsis Arc', 'Want/Need Grid', 'Social Mirror (Character Shifts)'] }
    },
    {
        id: 'preloaded-11',
        name: 'Advanced Story & Narrative Theory',
        content: `The Hero's Journey story structure (THE ORDINARY WORLD, THE CALL TO ADVENTURE, REFUSAL, ENTERING THE UNKNOWN, SUPERNATURAL AID, ALLIES, TESTS & THE SUPREME ORDEAL, REWARD, THE JOURNEY HOME, MASTER OF TWO WORLDS). Classic character archetypes (HEROES, SHADOWS, MENTORS, HERALD, THRESHOLD GUARDIANS, SHAPESHIFTERS, TRICKSTERS, ALLIES). Various character arcs (positive change, flat, negative). Techniques for story generation ("What If", dreams, forced connections, personal experience). Professional screenplay formatting for LOGLINE and SYNOPSIS.`,
        extractedKnowledge: { themes: ["The Call to Adventure", "Transformation", "Moral Choice", "Growth", "Stagnation", "Corruption"], visualStyles: ["Epic Journey", "Mythic Structure", "Character-driven Pacing"], characters: ["Hero", "Shadow", "Mentor", "Herald", "Threshold Guardian", "Shapeshifter", "Trickster", "Ally"], techniques: ["The Hero's Journey", "Positive Change Arc", "Flat Character Arc", "Negative Character Arc", "Logline", "Synopsis", "Save the Cat", "What If Scenarios"] }
    },
    {
        id: 'preloaded-12',
        name: 'Advanced Cinematic Techniques',
        content: `Advanced camera movements (Slow Push-In for tension/intimacy, Creep-Out for isolation, The Moment for emotional peaks). Paranoid framing (wide frame, distant subject, slow zooms). Distraction techniques to mislead audience focus. Walter Murch's 'In the Blink of an Eye' editing theory: editing is emotional, not just technical. The "Rule of Six" for a good cut: 1. Emotion (51%), 2. Story (23%), 3. Rhythm (10%), 4. Eye-trace (7%), 5. 2D Plane (5%), 6. 3D Space (4%). Great editing is invisible. Fundamental principles of exposure and camera settings (Aperture, Shutter Speed, ISO).`,
        extractedKnowledge: { themes: ["Tension", "Intimacy", "Isolation", "Paranoia", "Powerlessness", "Emotional Continuity"], visualStyles: ["Invisible Editing", "Rhythmic Cutting", "Paranoid Thriller", "Subjective Camera"], characters: [], techniques: ["Slow Push-In", "Creep-Out", "The Moment (Emotional Peak)", "Distraction (Misdirection)", "Paranoid Zoom", "Walter Murch's Rule of Six", "Exposure Triangle (Aperture, Shutter, ISO)", "Cut on Action"] }
    },
    {
        id: 'preloaded-13',
        name: '2025 Cinematic Trends & Technology',
        content: `AI-Assisted Filmmaking: Integration of artificial intelligence in pre-production planning, script analysis, and visual effects. AI tools are now commonly used for storyboarding, concept art generation, and post-production efficiency. Virtual Production: Real-time rendering with LED walls has revolutionized location shooting. Programs like Unreal Engine enable filmmakers to create photorealistic environments that react to camera movement. Sustainable Filmmaking: Environmental consciousness drives new production techniques - LED lighting for reduced carbon footprint, virtual locations to minimize travel, and eco-friendly post-production workflows. Higher Frame Rates: Movies are embracing 48fps, 60fps, and even 120fps for enhanced immersion, particularly in action and immersive content. Light Field Cameras: Capture entire light fields for post-production flexibility, allowing focus changes, perspective shifts, and depth manipulation after filming. Immersive Audio: Dolby Atmos and spatial audio are standard, creating 360-degree soundscapes that enhance storytelling. Micro-Budget Mastery: Professional-quality content can now be created with smartphone cameras and consumer-grade equipment, democratizing high-end cinematography techniques. Interactive Storytelling: Films are beginning to incorporate interactive elements, allowing audiences to influence narrative direction through smart TV interfaces and streaming platforms.`,
        extractedKnowledge: { themes: ["Innovation", "Accessibility", "Sustainability", "Immersion", "Technology Integration"], visualStyles: ["Real-time rendering", "Virtual environments", "High frame rate smoothness", "LED wall photography", "AI-enhanced post-production"], characters: ["Tech-savvy director", "AI-assisted creator", "Sustainable filmmaker"], techniques: ["AI storyboarding", "Virtual production", "LED wall lighting", "Real-time rendering", "Light field capture", "Spatial audio mixing", "Micro-budget optimization", "Interactive narrative"] }
    },
    {
        id: 'preloaded-14',
        name: '2025 Storytelling & Genre Evolution',
        content: `Diverse Storytelling: Films now embrace multiple perspectives and non-linear narratives more readily. Stories often weave between different cultural viewpoints and time periods. Character-Driven Narratives: Audiences connect more deeply with character development than plot complexity. Multi-protagonist stories and ensemble casts are increasingly popular. Genre Fluidity: Traditional genre boundaries have blurred - horror-comedies, sci-fi dramas, action-mysteries are commonplace. Films borrow techniques from multiple genres to create unique experiences. Climate Fiction: Environmental themes are woven into various genres, from apocalyptic thrillers to romantic dramas with eco-consciousness. Mental Health Representation: Films increasingly depict psychological realities with accuracy and sensitivity, moving beyond stereotypical portrayals. Global Storytelling: International co-productions bring diverse cultural perspectives to mainstream cinema. Subtitles are more accepted, and dubbing quality has improved significantly. Accessibility-First Design: Filmmakers now consider hearing impaired, visually impaired, and neurodivergent audiences from the beginning of production, not as an afterthought. Serialized Feature Films: Limited series formats allow for deeper character development while maintaining theatrical-quality cinematography and production values.`,
        extractedKnowledge: { themes: ["Diversity", "Cultural Integration", "Mental Health Awareness", "Environmental Consciousness", "Accessibility"], visualStyles: ["Multi-perspective framing", "Non-linear editing", "Cultural fusion aesthetics", "Climate-conscious visuals", "Inclusive design"], characters: ["Diverse protagonists", "Cultural bridges", "Environmentally conscious characters", "Neurodivergent representation"], techniques: ["Multi-protagonist structure", "Cultural sensitivity", "Climate-conscious production", "Accessibility integration", "Serialized storytelling", "Genre fusion"] }
    },
    {
        id: 'preloaded-15',
        name: '2025 Production & Post-Production Innovation',
        content: `Cloud-Based Collaboration: Entire films can be shot, edited, and graded remotely using cloud services. Teams across continents collaborate in real-time on the same project. AI-Powered Color Grading: Machine learning algorithms can automatically grade footage based on reference images or director preferences, while maintaining creative control. Real-Time VFX: Visual effects are added and refined during shooting, allowing directors to see final results immediately. This reduces post-production time and costs significantly. Smart Lighting Systems: Automated lighting setups that adjust based on scene requirements, time of day, and weather conditions, creating consistent looks across different shooting days. Advanced Drone Cinematography: Miniaturized cameras and AI-guided flight paths enable complex aerial shots that were previously impossible or extremely expensive. Voice-Controlled Editing: Editors can now use voice commands to perform complex editing tasks, speeding up the workflow dramatically. Predictive Analytics: AI analyzes audience engagement patterns to predict which cuts, pacing, and visual elements will be most effective. Blockchain Rights Management: Smart contracts automatically manage music licensing, actor royalties, and distribution rights, reducing legal complexities. Mobile-First Post-Production: High-quality editing, color grading, and sound mixing can be performed entirely on mobile devices with cloud computing power.`,
        extractedKnowledge: { themes: ["Efficiency", "Automation", "Collaboration", "Cost Reduction", "Quality Enhancement"], visualStyles: ["AI-enhanced grading", "Real-time compositing", "Automated lighting", "Mobile-optimized workflows"], characters: ["Remote collaborators", "AI-assisted editors", "Mobile filmmakers"], techniques: ["Cloud collaboration", "AI color grading", "Real-time VFX", "Voice-controlled editing", "Predictive analytics", "Blockchain rights", "Mobile post-production", "Smart lighting"] }
    }
  ];