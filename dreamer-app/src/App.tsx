



import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Save,
  Upload,
  Trash2,
  X,
  BookOpen,
  Lightbulb,
  Image as ImageIcon,
  Film,
  ClipboardCopy,
  WandSparkles,
  RefreshCcw,
  Send,
  Plus,
  FileText,
  Type as TypeIcon,
  Scissors,
  GripVertical,
  Palette,
  Download,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import {
  questions,
  preloadedKnowledgeBase,
  STAGE_WIDTH,
  STAGE_HEIGHT,
  cameraHeightOptions,
  cameraAngleOptions,
  lightingMoodOptions,
  colorHarmonyOptions,
  easingOptions,
  movementTypes,
  easingMap,
  LIGHTING_DEFAULTS,
  COLOR_GRADING_DEFAULTS,
  CAMERA_DEFAULTS,
  CHARACTER_POSITIONS,
  TIMING,
  NUMERIC,
  MIDJOURNEY,
  REGEX
} from './constants';
import { appLogger } from './lib/logger';
import { handleError, handleAIServiceError, validateFile } from './lib/errorHandler';
import {
    PromptData,
    ShotPrompt,
    SavedConfiguration,
    KnowledgeDocument,
    CompositionData,
    LightingData,
    ColorGradingData,
    CameraMovementData,
    VisualPreset,
    Stage,
    CameraEasing,
    CompositionCharacter,
    StoryboardShot,
    AnyTimelineItem,
    ShotItem,
    SequenceStyle,
    TimelineItemType,
    BrollItem,
    TransitionItem,
    TextItem,
    SoundDesignData,
    CastingData,
} from './types';
import { SoundDesignModule } from './components/SoundDesignModule';
import { CastingAssistant } from './components/CastingAssistant';
import { VisualProgressTracker } from './components/VisualProgressTracker';
import { StoryIdeation } from './components/StoryIdeation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { generateImage, generateNanoImage } from './services/imageGenerationService';
import { 
    extractKnowledge, 
    getAISuggestions, 
    enhanceShotPrompt, 
    generateStoryFromIdea, 
    getRandomInspiration,
    generateStoryboard, 
    generateVideoPrompt,
    getTimelineSuggestion,
    analyzeSequenceStyle,
    generateBrollPrompt,
    generateSmartVisualDescription,
    initializeVisualsFromStoryboardShot,
    makeExplainerPromptCinematic,
    getKnowledgeBasedSuggestions
} from './services/geminiService';
import { huggingFaceService } from './services/huggingFaceService';
import { genreIntelligenceService } from './services/genreIntelligenceService';
import { moduleCollaborationService } from './services/moduleCollaborationService';
import { 
    loadUserProgress, 
    saveUserProgress, 
    scheduleAutoSave 
} from './services/supabaseService';

// #############################################################################################
/* AI MODEL PROMPT FORMATTING */
// #############################################################################################

// AI Model configurations for prompt formatting
export interface AIModel {
  id: string;
  name: string;
  description: string;
  promptPrefix?: string;
  promptSuffix?: string;
  aspectRatio?: string;
  styleModifiers?: string[];
  website?: string;
}

const AI_MODELS: AIModel[] = [
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'High-quality artistic image generation',
    promptPrefix: '/imagine prompt:',
    website: 'https://midjourney.com'
  },
  {
    id: 'dalle',
    name: 'DALL-E',
    description: 'OpenAI\'s advanced image generation',
    promptPrefix: '',
    website: 'https://openai.com/dall-e'
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: 'Open-source image generation',
    promptPrefix: '',
    website: 'https://stability.ai'
  },
  {
    id: 'leonardo-ai',
    name: 'Leonardo AI',
    description: 'Professional AI image generation',
    promptPrefix: '',
    website: 'https://leonardo.ai'
  },
  {
    id: 'firefly',
    name: 'Adobe Firefly',
    description: 'Commercial-safe image generation',
    promptPrefix: '',
    website: 'https://firefly.adobe.com'
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    description: 'Text-aware image generation',
    promptPrefix: '',
    website: 'https://ideogram.ai'
  },
  {
    id: 'flux',
    name: 'Flux',
    description: 'High-quality text-to-image',
    promptPrefix: '',
    website: 'https://fal.ai/models/fal-ai/flux'
  },
  {
    id: 'runway',
    name: 'Runway ML',
    description: 'Creative AI for image and video',
    promptPrefix: '',
    website: 'https://runwayml.com'
  },
  {
    id: 'bluewillow',
    name: 'BlueWillow',
    description: 'Free AI image generation',
    promptPrefix: '/imagine prompt:',
    website: 'https://bluewillow.ai'
  }
];

// Format prompt for different AI models
const formatPromptForModel = (shot: any, model: AIModel): string => {
  const basePrompt = `${shot.shotDetails.shotType} ${shot.shotDetails.cameraAngle}. ${shot.shotDetails.description}. ${shot.shotDetails.lightingMood} lighting. ${shot.shotDetails.cameraMovement} camera movement.`;
  
  switch (model.id) {
    case 'midjourney':
    case 'bluewillow':
      // Midjourney-specific formatting
      const midjourneyPrompt = `${basePrompt} --ar ${MIDJOURNEY.DEFAULT_ASPECT_RATIO} ${MIDJOURNEY.STYLE_FLAG} ${MIDJOURNEY.VERSION_FLAG}`;
      return model.promptPrefix ? `${model.promptPrefix} ${midjourneyPrompt}` : midjourneyPrompt;
    
    case 'stable-diffusion':
      // Stable Diffusion specific formatting
      return `${basePrompt}, high quality, cinematic lighting, professional photography, 8k resolution`;
    
    case 'dalle':
    case 'firefly':
      // DALL-E and Firefly prefer concise, clear prompts
      return basePrompt;
    
    case 'leonardo-ai':
      // Leonardo AI specific formatting
      return `${basePrompt}, masterpiece, high detail, professional quality`;
    
    case 'ideogram':
      // Ideogram specific formatting for text-aware generation
      return `${basePrompt}, sharp focus, detailed, cinematic`;
    
    case 'flux':
      // Flux specific formatting
      return `${basePrompt}, ultra detailed, photorealistic, 4k`;
    
    case 'runway':
      // Runway ML formatting for creative generation
      return `${basePrompt}, artistic interpretation, creative composition`;
    
    default:
      return basePrompt;
  }
};

// #############################################################################################
// HELPER FUNCTIONS & DEFAULTS
// #############################################################################################

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const formatValue = (value: string | string[] | boolean | undefined): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (!value) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
};

const getCameraLinePosition = (height: string, angle: string): { x1: number; y1: number; x2: number; y2: number } => {
    const heightMap: Record<string, { y1: number; y2: number }> = {
      'ground-level soul gaze': { y1: STAGE_HEIGHT, y2: (STAGE_HEIGHT * 2) / 3 },
      'eye-level witness': { y1: STAGE_HEIGHT, y2: STAGE_HEIGHT / 2 },
      'elevated guardian': { y1: STAGE_HEIGHT, y2: STAGE_HEIGHT / 3 },
      'angelic drift': { y1: STAGE_HEIGHT, y2: 0 }
    };
    const angleMap: Record<string, { xOffset: number }> = {
      'true-eye, honest': { xOffset: 0 },
      'steep reverence': { xOffset: -100 },
      'whispered low': { xOffset: 100 },
      'Dutch slip': { xOffset: 50 }
    };
    const heightPos = heightMap[height] || heightMap['eye-level witness'];
    const anglePos = angleMap[angle] || angleMap['true-eye, honest'];
    const centerX = STAGE_WIDTH / 2;
    const x1 = centerX + anglePos.xOffset;
    const x2 = centerX + anglePos.xOffset;
    return { x1, y1: heightPos.y1, x2, y2: heightPos.y2 };
};

const downloadBase64Image = (base64Data: string, mimeType: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const defaultComposition: CompositionData = { characters: [{ id: 'char-1', name: 'Subject A', x: 400, y: 225 }, { id: 'char-2', name: 'Subject B', x: 280, y: 260 }], cameraAngle: 'true-eye, honest', cameraHeight: 'eye-level witness' };
const defaultLighting: LightingData = { keyLightIntensity: 80, keyLightColor: '#FFD8A8', fillLightIntensity: 40, fillLightColor: '#89CFF0', backLightIntensity: 60, backLightColor: '#FACC15', ambientIntensity: 20, colorTemperature: 4500, mood: lightingMoodOptions[0] };
const defaultColorGrading: ColorGradingData = { colorGrade: 'Dreamer Grade', saturation: 10, contrast: 5, highlights: 5, shadows: -5, colorPalette: ['#0F172A', '#1E293B', '#475569', '#F97316', '#FBBF24', '#FDE68A', '#38BDF8', '#A855F7'], colorHarmony: colorHarmonyOptions[0] };
const defaultCameraMovement: CameraMovementData = { movementType: movementTypes[0], startPos: { x: 100, y: 300 }, endPos: { x: 700, y: 150 }, duration: 5, easing: 'ease-in-out', focalLength: 35 };

// #############################################################################################
// COMPONENT: VISUAL EDITORS
// #############################################################################################

interface CompositionEditorProps {
    composition: CompositionData;
    onAddCharacter: () => void;
    onRemoveCharacter: (characterId: string) => void;
    onDrag: (characterId: string, event: React.MouseEvent<SVGCircleElement, MouseEvent>) => void;
    onNameChange: (characterId: string, name: string) => void;
    onCameraAngleChange: (angle: string) => void;
    onCameraHeightChange: (height: string) => void;
    onPositionChange: (characterId: string, x: number, y: number) => void;
}
  
interface LightingEditorProps {
    lighting: LightingData;
    onChange: (field: keyof LightingData, value: number | string) => void;
}
  
interface ColorGradingEditorProps {
    color: ColorGradingData;
    onChange: (field: keyof ColorGradingData, value: number | string | string[]) => void;
}
  
interface CameraMovementEditorProps {
    camera: CameraMovementData;
    onChange: (field: keyof CameraMovementData, value: number | string | { x: number; y: number }) => void;
    onPathChange: (key: 'startPos' | 'endPos', coord: 'x' | 'y', value: number) => void;
}

const CompositionEditor = React.memo<CompositionEditorProps>(({ 
    composition, 
    onAddCharacter, 
    onRemoveCharacter, 
    onDrag, 
    onNameChange, 
    onCameraAngleChange, 
    onCameraHeightChange, 
    onPositionChange 
}) => {
    // Memoize expensive callbacks to prevent unnecessary re-renders
    const handleAddCharacter = useCallback(() => {
        onAddCharacter();
    }, [onAddCharacter]);

    const handleRemoveCharacter = useCallback((characterId: string) => {
        onRemoveCharacter(characterId);
    }, [onRemoveCharacter]);

    const handleNameChange = useCallback((characterId: string, name: string) => {
        onNameChange(characterId, name);
    }, [onNameChange]);

    const handleCameraAngleChange = useCallback((angle: string) => {
        onCameraAngleChange(angle);
    }, [onCameraAngleChange]);

    const handleCameraHeightChange = useCallback((height: string) => {
        onCameraHeightChange(height);
    }, [onCameraHeightChange]);
    const handleCharacterDrag = useCallback((characterId: string, event: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return;
        
        const bbox = svg.getBoundingClientRect();
        const scaleX = STAGE_WIDTH / bbox.width;
        const scaleY = STAGE_HEIGHT / bbox.height;

        const toStageCoords = useCallback((clientX: number, clientY: number) => {
          const localX = Math.max(0, Math.min(bbox.width, clientX - bbox.left));
          const localY = Math.max(0, Math.min(bbox.height, clientY - bbox.top));
          const stageX = Math.max(20, Math.min(STAGE_WIDTH - 20, localX * scaleX));
          const stageY = Math.max(20, Math.min(STAGE_HEIGHT - 20, localY * scaleY));
          return { stageX, stageY };
        }, [bbox, scaleX, scaleY]);
    
        const moveListener = useCallback((moveEvent: MouseEvent) => {
          const { stageX, stageY } = toStageCoords(moveEvent.clientX, moveEvent.clientY);
          onPositionChange(characterId, stageX, stageY);
        }, [characterId, onPositionChange, toStageCoords]);
    
        const upListener = useCallback(() => {
          window.removeEventListener('mousemove', moveListener);
          window.removeEventListener('mouseup', upListener);
        }, [moveListener]);
    
        // Add event listeners with proper cleanup
        window.addEventListener('mousemove', moveListener);
        window.addEventListener('mouseup', upListener);
    
        // Cleanup function to prevent memory leaks
        return () => {
          window.removeEventListener('mousemove', moveListener);
          window.removeEventListener('mouseup', upListener);
        };
    
        const { stageX, stageY } = toStageCoords(event.clientX, event.clientY);
        onPositionChange(characterId, 
          Math.max(CHARACTER_POSITIONS.MIN_X, Math.min(CHARACTER_POSITIONS.MAX_X, stageX)),
          Math.max(CHARACTER_POSITIONS.MIN_Y, Math.min(CHARACTER_POSITIONS.MAX_Y, stageY))
        );
    }, [onPositionChange]);

    return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-400">Composition Grid</h3>
              <p className="text-sm text-gray-400">Arrange characters and camera posture.</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddCharacter} className="px-3 py-2 text-sm rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30">
              Add Character
            </motion.button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gray-950 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Shot Stage</p>
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 via-gray-950 to-black rounded-lg overflow-hidden">
                <svg viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} className="w-full h-full" onMouseLeave={() => window.dispatchEvent(new MouseEvent('mouseup'))}>
                    <defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1f2937" strokeWidth="1" /></pattern></defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <rect width="100%" height="100%" fill="none" stroke="#374151" strokeWidth="2" />
                    <line x1={STAGE_WIDTH / 3} y1={0} x2={STAGE_WIDTH / 3} y2={STAGE_HEIGHT} stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={(STAGE_WIDTH / 3) * 2} y1={0} x2={(STAGE_WIDTH / 3) * 2} y2={STAGE_HEIGHT} stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={0} y1={STAGE_HEIGHT / 3} x2={STAGE_WIDTH} y2={STAGE_HEIGHT / 3} stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={0} y1={(STAGE_HEIGHT / 3) * 2} x2={STAGE_WIDTH} y2={(STAGE_HEIGHT / 3) * 2} stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
                    {(() => { const linePos = getCameraLinePosition(composition.cameraHeight, composition.cameraAngle); return <line x1={linePos.x1} y1={linePos.y1} x2={linePos.x2} y2={linePos.y2} stroke="#3b82f6" strokeWidth="2" strokeDasharray="8 6" />; })()}
                    {composition.characters.map((character: CompositionCharacter) => (
                    <g key={character.id}>
                        <circle cx={character.x} cy={character.y} r={16} fill="#f59e0b" className="cursor-grab" onMouseDown={(event) => handleCharacterDrag(character.id, event)} />
                        <text x={character.x} y={character.y - 24} textAnchor="middle" fill="#f8fafc" fontSize={14} className="pointer-events-none">{character.name}</text>
                    </g>
                    ))}
                </svg>
                </div>
            </div>
            <div className="space-y-4">
                {composition.characters.map((character: CompositionCharacter) => (
                <div key={character.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                    <input value={character.name} onChange={(event) => handleNameChange(character.id, event.target.value)} className="w-full text-sm bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="Character name" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleRemoveCharacter(character.id)} className="ml-2 p-2 rounded bg-gray-800 hover:bg-gray-700"><Trash2 className="w-4 h-4 text-red-400" /></motion.button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400"><span>X: {Math.round(character.x)}</span><span>Y: {Math.round(character.y)}</span></div>
                </div>
                ))}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                <div>
                    <label className="text-xs text-gray-400 uppercase">Camera Angle</label>
                    <select value={composition.cameraAngle} onChange={(event) => handleCameraAngleChange(event.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">{cameraAngleOptions.map(option => <option key={option} value={option}>{option}</option>)}</select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 uppercase">Camera Height</label>
                    <select value={composition.cameraHeight} onChange={(event) => handleCameraHeightChange(event.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">{cameraHeightOptions.map(option => <option key={option} value={option}>{option}</option>)}</select>
                </div>
                </div>
            </div>
          </div>
        </div>
      );
});
CompositionEditor.displayName = 'CompositionEditor';

const LightingEditor = React.memo<LightingEditorProps>(({ lighting, onChange }) => {
    // Memoize the update function to prevent unnecessary re-renders
    const updateNumber = useCallback((field: keyof LightingData, value: number) => {
        // Comprehensive validation for different field types
        let validatedValue: number;
        
        switch (field) {
            case 'keyLightIntensity':
            case 'fillLightIntensity':
            case 'backLightIntensity':
            case 'ambientIntensity':
                // Clamp to 0-100 range for light intensities
                validatedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
                break;
            case 'colorTemperature':
                // Clamp to reasonable camera color temperature range
                validatedValue = Math.min(8000, Math.max(2000, isNaN(value) ? 4500 : value));
                break;
            default:
                validatedValue = isNaN(value) ? 0 : value;
        }
        
        onChange(field, validatedValue);
    }, [onChange]);

    // Memoize the reset function
    const handleReset = useCallback(() => {
        onChange('keyLightIntensity', LIGHTING_DEFAULTS.DEFAULT_KEY_LIGHT);
        onChange('fillLightIntensity', LIGHTING_DEFAULTS.DEFAULT_FILL_LIGHT);
        onChange('backLightIntensity', LIGHTING_DEFAULTS.DEFAULT_BACK_LIGHT);
        onChange('ambientIntensity', LIGHTING_DEFAULTS.DEFAULT_AMBIENT);
        onChange('keyLightColor', '#FFD8A8');
        onChange('fillLightColor', '#89CFF0');
        onChange('backLightColor', '#FACC15');
        onChange('colorTemperature', LIGHTING_DEFAULTS.DEFAULT_COLOR_TEMP);
        onChange('mood', lightingMoodOptions[0]);
    }, [onChange]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-semibold text-amber-400">Lighting Mixer</h3><p className="text-sm text-gray-400">Dial in key/fill/back ratios, temperature, and mood.</p></div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleReset} className="px-3 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700">Reset Lighting</motion.button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {([ { label: 'Key Light', field: 'keyLightIntensity', colorField: 'keyLightColor' }, { label: 'Fill Light', field: 'fillLightIntensity', colorField: 'fillLightColor' }, { label: 'Back Light', field: 'backLightIntensity', colorField: 'backLightColor' }, { label: 'Ambient', field: 'ambientIntensity', colorField: null } ] as const).map(({ label, field, colorField }) => (
            <div key={field} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-gray-300">{label}</span><span className="text-amber-400">{lighting[field]}%</span></div>
              <input type="range" min={0} max={100} value={lighting[field]} onChange={(event) => updateNumber(field, Number(event.target.value))} className="w-full accent-amber-500" />
              {colorField && (<div className="flex items-center space-x-2"><label className="text-xs text-gray-400">Color</label><input type="color" value={lighting[colorField as keyof LightingData] as string} onChange={(event) => onChange(colorField as keyof LightingData, event.target.value)} className="w-10 h-10 rounded border border-gray-700 bg-gray-900" /></div>)}
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2"><label className="text-xs text-gray-400 uppercase">Mood Preset</label><select value={lighting.mood} onChange={(event) => onChange('mood', event.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500">{lightingMoodOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2"><label className="text-xs text-gray-400 uppercase">Color Temperature (K)</label><input type="number" value={lighting.colorTemperature} onChange={(event) => onChange('colorTemperature', Number(event.target.value))} min={2000} max={8000} step={100} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>
        </div>
      </div>
    );
});
LightingEditor.displayName = 'LightingEditor';

const ColorGradingEditor = React.memo<ColorGradingEditorProps>(({ color, onChange }) => {
    const handlePaletteChange = (index: number, value: string) => { 
        // Validate hex color format
        if (REGEX.HEX_COLOR.test(value)) {
            const next = [...color.colorPalette]; 
            next[index] = value; 
            onChange('colorPalette', next); 
        }
    };
    
    const updateTone = (field: keyof ColorGradingData, value: number) => {
        // Comprehensive validation for color grading values
        let validatedValue: number;
        
        switch (field) {
            case 'saturation':
            case 'contrast':
            case 'highlights':
            case 'shadows':
                // Clamp to -50 to 50 range for tone adjustments
                validatedValue = Math.max(-50, Math.min(50, isNaN(value) ? 0 : value));
                break;
            default:
                validatedValue = isNaN(value) ? 0 : value;
        }
        
        onChange(field, validatedValue);
    };
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-semibold text-amber-400">Color Grading Deck</h3><p className="text-sm text-gray-400">Shape palette, contrast, saturation, and harmony.</p></div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { onChange('colorGrade', 'Dreamer Grade'); onChange('saturation', 10); onChange('contrast', 5); onChange('highlights', 5); onChange('shadows', -5); onChange('colorPalette', ['#0F172A', '#1E293B', '#475569', '#F97316', '#FBBF24', '#FDE68A', '#38BDF8', '#A855F7']); onChange('colorHarmony', colorHarmonyOptions[0]); }} className="px-3 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700">Reset Color</motion.button>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"><label className="text-xs text-gray-400 uppercase">Grade Name</label><input value={color.colorGrade} onChange={(event) => onChange('colorGrade', event.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"><label className="text-xs text-gray-400 uppercase">Color Harmony</label><select value={color.colorHarmony} onChange={(event) => onChange('colorHarmony', event.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500">{colorHarmonyOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
          <label className="text-xs text-gray-400 uppercase">Palette</label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {color.colorPalette.map((swatch, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <input type="color" value={swatch} onChange={(event) => handlePaletteChange(index, event.target.value)} className="w-full h-12 rounded border border-gray-700" />
                <input value={swatch} onChange={(event) => handlePaletteChange(index, event.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-amber-500" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {([ { label: 'Saturation', field: 'saturation' }, { label: 'Contrast', field: 'contrast' }, { label: 'Highlights', field: 'highlights' }, { label: 'Shadows', field: 'shadows' } ] as const).map(({ label, field }) => (
            <div key={field} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-gray-300">{label}</span><span className="text-amber-400">{color[field]}</span></div>
              <input type="range" min={-50} max={50} value={color[field] as number} onChange={(event) => updateTone(field, Number(event.target.value))} className="w-full accent-amber-500" />
            </div>
          ))}
        </div>
      </div>
    );
});
ColorGradingEditor.displayName = 'ColorGradingEditor';

const CameraMovementEditor = React.memo<CameraMovementEditorProps>(({ camera, onChange, onPathChange }) => {
    const updateMovement = (field: keyof CameraMovementData, value: number | string) => {
        if (field === 'duration' && typeof value === 'number') {
            // Validate duration: 1-30 seconds
            onChange(field, Math.min(30, Math.max(1, value)));
        } else if (field === 'focalLength' && typeof value === 'number') {
            // Validate focal length: 10-200mm
            onChange(field, Math.min(200, Math.max(10, value)));
        } else {
            onChange(field, value);
        }
    };

    const updatePathCoordinate = (position: 'startPos' | 'endPos', coord: 'x' | 'y', value: number) => {
        // Validate path coordinates: 0-800
        onPathChange(position, coord, Math.min(800, Math.max(0, value)));
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-semibold text-amber-400">Camera Motion Lab</h3><p className="text-sm text-gray-400">Define movement, path, easing, and focal rhythm.</p></div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { onChange('movementType', movementTypes[0]); onChange('duration', 5); onChange('easing', 'ease-in-out'); onChange('focalLength', 35); onPathChange('startPos', 'x', 100); onPathChange('startPos', 'y', 300); onPathChange('endPos', 'x', 700); onPathChange('endPos', 'y', 150); }} className="px-3 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700">Reset Motion</motion.button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"><label className="text-xs text-gray-400 uppercase">Movement Type</label><select value={camera.movementType} onChange={(event) => updateMovement('movementType', event.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500">{movementTypes.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"><label className="text-xs text-gray-400 uppercase">Duration (seconds)</label><input type="number" value={camera.duration} onChange={(event) => updateMovement('duration', Number(event.target.value))} min={1} max={30} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"><label className="text-xs text-gray-400 uppercase">Easing</label><select value={camera.easing} onChange={(event) => updateMovement('easing', event.target.value as CameraEasing)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500">{easingOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"><label className="text-xs text-gray-400 uppercase">Focal Length (mm)</label><input type="number" value={camera.focalLength} onChange={(event) => updateMovement('focalLength', Number(event.target.value))} min={10} max={200} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-semibold text-amber-400 uppercase">Path Coordinates</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-400">
            {(['x', 'y'] as const).map(coord => <div key={`start-${coord}`} className="space-y-1"><label className="text-xs uppercase">Start {coord.toUpperCase()}</label><input type="number" value={camera.startPos[coord]} onChange={(event) => updatePathCoordinate('startPos', coord, Number(event.target.value))} min={0} max={800} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>)}
            {(['x', 'y'] as const).map(coord => <div key={`end-${coord}`} className="space-y-1"><label className="text-xs uppercase">End {coord.toUpperCase()}</label><input type="number" value={camera.endPos[coord]} onChange={(event) => updatePathCoordinate('endPos', coord, Number(event.target.value))} min={0} max={800} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>)}
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Camera Path Preview</p>
            <svg viewBox="0 0 200 120" className="w-full h-32"><defs><linearGradient id="cameraPathGradient" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#f97316" /></linearGradient></defs><path d={`M ${camera.startPos.x / 4} ${camera.startPos.y / 4} L ${camera.endPos.x / 4} ${camera.endPos.y / 4}`} stroke="url(#cameraPathGradient)" strokeWidth="2" fill="none" strokeDasharray="6 4" /><circle cx={camera.startPos.x / 4} cy={camera.startPos.y / 4} r={4} fill="#10B981" /><circle cx={camera.endPos.x / 4} cy={camera.endPos.y / 4} r={4} fill="#EF4444" /><motion.circle r={4} fill="#FBBF24" animate={{ cx: [camera.startPos.x / 4, camera.endPos.x / 4, camera.startPos.x / 4], cy: [camera.startPos.y / 4, camera.endPos.y / 4, camera.startPos.y / 4] }} transition={{ repeat: Infinity, duration: Math.max(1, camera.duration), ease: easingMap[camera.easing] || 'linear' }} /></svg>
          </div>
        </div>
      </div>
    );
});
CameraMovementEditor.displayName = 'CameraMovementEditor';

// #############################################################################################
// COMPONENT: PAGE COMPONENTS
// #############################################################################################

interface LandingPageProps {
    onStartBuilder: (idea: string) => void;
    onStartStoryboard: (script: string) => void;
    onGenerateStory: (idea: string) => void;
    isGenerating: boolean;
}
  
const LandingPage: React.FC<LandingPageProps> = ({ onStartBuilder, onStartStoryboard, onGenerateStory, isGenerating }) => {
    const [landingIdea, setLandingIdea] = useState('');
    const [showHeart, setShowHeart] = useState(false);
  
    const handleMadeByClick = () => {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 2000);
    };

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl w-full text-center space-y-12">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="space-y-6">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Dreamer</h1>
            <div className="space-y-3">
              <p className="text-2xl text-gray-300 font-medium">
                🎬 Your filmmaking buddy with serious cinematic chops
              </p>
              <p className="text-lg text-gray-400 leading-relaxed">
                From initial spark to full framework, I'm here to help you craft prompts that make your visual story sing ✨
              </p>
            </div>
          </motion.div>
  
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="space-y-6">
            <div className="space-y-4">
              <textarea 
                value={landingIdea} 
                onChange={(e) => setLandingIdea(e.target.value)} 
                placeholder="Describe your cinematic vision, paste a script, or just share that wild idea you can't shake..." 
                className="w-full h-40 p-6 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none text-lg leading-relaxed" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => onStartBuilder(landingIdea)} 
                className="py-5 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-3 shadow-lg"
              >
                <span className="text-lg">Prompt Builder</span><Sparkles className="w-6 h-6" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => onStartStoryboard(landingIdea)} 
                className="py-5 px-6 bg-gray-800 border-2 border-gray-700 hover:border-gray-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-3"
              >
                <span className="text-lg">Script to Storyboard</span><Film className="w-6 h-6" />
              </motion.button>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => onGenerateStory(landingIdea)} 
              disabled={!landingIdea.trim() || isGenerating} 
              className="w-full py-5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-3 shadow-lg"
            >
              {isGenerating ? ( 
                <><div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-white" /><span className="text-lg">Dreaming up ideas...</span></> 
              ) : ( 
                <><Lightbulb className="w-6 h-6" /><span className="text-lg">Let AI Dream (Expand Idea)</span></> 
              )}
            </motion.button>
          </motion.div>
          
          {/* Made by Himanshu with love */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8, duration: 0.6 }}
            className="pt-8 border-t border-gray-800"
          >
            <motion.button
              onClick={handleMadeByClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-gray-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center space-x-2 mx-auto"
            >
              <span>made with</span>
              <motion.span
                animate={showHeart ? { scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.6 }}
                className="text-red-400"
              >
                ❤️
              </motion.span>
              <span>by Himanshu</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
};

interface BuilderPageProps {
    promptData: PromptData;
    handleAnswer: <K extends keyof PromptData>(id: K, value: PromptData[K]) => void;
    handleRandomAnswer: (id: keyof PromptData, question: string) => void;
    isGeneratingRandom: boolean;
    generatePrompt: () => void;
    savedConfigurations: SavedConfiguration[];
    knowledgeDocs: KnowledgeDocument[];
    saveConfiguration: (name: string) => void;
    loadConfiguration: (config: SavedConfiguration) => void;
    deleteConfiguration: (id: string) => void;
    deleteKnowledgeDoc: (id: string) => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isProcessingDoc: boolean;
    currentQuestionIndex: number;
    setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
    onBackToHome: () => void;
}
  
const BuilderPage: React.FC<BuilderPageProps> = ({ 
    promptData, handleAnswer, handleRandomAnswer, isGeneratingRandom, generatePrompt, 
    savedConfigurations, knowledgeDocs, saveConfiguration, loadConfiguration, 
    deleteConfiguration, deleteKnowledgeDoc, handleFileUpload, isProcessingDoc,
    currentQuestionIndex, setCurrentQuestionIndex, onBackToHome
}) => {
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [huggingFaceReady, setHuggingFaceReady] = useState(false);
    const [knowledgeInsights, setKnowledgeInsights] = useState<string[]>([]);
    const [narrativeAnalysis, setNarrativeAnalysis] = useState<{
        genre: string;
        emotionalTone: string;
        visualCues: string[];
        narrativeElements: string[];
    } | null>(null);
    const [genreProfile, setGenreProfile] = useState<{
        genre: string;
        confidence: number;
        subgenres: string[];
        characteristics: any;
        suggestions: any;
    } | null>(null);
    const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
    const [multipleMode, setMultipleMode] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [showKnowledgePanel, setShowKnowledgePanel] = useState(false);
    
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
    const toggleMultipleSelection = (option: string) => {
        const key = currentQuestion.id as keyof PromptData;
        const currentValue = promptData[key];

        if (typeof currentValue === 'boolean' || !currentQuestion.options) {
            return;
        }

        if (Array.isArray(currentValue)) {
          if (currentValue.includes(option)) {
            const newValue = currentValue.filter(value => value !== option);
            handleAnswer(key, newValue.length > 0 ? newValue : '');
          } else {
            handleAnswer(key, [...currentValue, option]);
          }
        } else if (currentValue) {
          handleAnswer(key, [String(currentValue), option]);
        } else {
          handleAnswer(key, [option]);
        }
    };
    
    // Initialize HuggingFace service with proper cleanup
    useEffect(() => {
        let isMounted = true;
        const initHuggingFace = async () => {
            try {
                await huggingFaceService.initialize();
                if (isMounted) {
                    setHuggingFaceReady(true);
                }
            } catch (error) {
                appLogger.info('HuggingFace not available, using fallback mode');
                if (isMounted) {
                    setHuggingFaceReady(false);
                }
            }
        };
        initHuggingFace();
        
        // Cleanup function to prevent memory leaks
        return () => {
            isMounted = false;
            // HuggingFace service cleanup if available
            if (huggingFaceService.cleanup && typeof huggingFaceService.cleanup === 'function') {
                try {
                    huggingFaceService.cleanup();
                } catch (error) {
                    appLogger.warn('Error cleaning up HuggingFace service:', error);
                }
            }
        };
    }, []);

    const fetchAISuggestions = async () => {
        setIsLoadingAI(true);
        setAiSuggestions([]);
        setKnowledgeInsights([]);
        setNarrativeAnalysis(null);
        setGenreProfile(null);
        setGenreSuggestions([]);

        const previousAnswers = questions
            .filter(q => q.id !== currentQuestion.id && promptData[q.id as keyof PromptData])
            .map(q => `${q.question}: ${formatValue(promptData[q.id as keyof PromptData])}`)
            .join('\n');
        
        const knowledgeContext = `KNOWLEDGE BASE:\n` + knowledgeDocs.map(doc => `[${doc.name}]: Themes: ${doc.extractedKnowledge?.themes.join(', ')}. Techniques: ${doc.extractedKnowledge?.techniques.join(', ')}`).join('\n');
        const storyContext = promptData.scriptText ? `\n\nSTORY SCRIPT:\n${promptData.scriptText}` : '';
        const fullContext = `${knowledgeContext}\n\nPREVIOUS ANSWERS:\n${previousAnswers}${storyContext}`;
        
        // Get enhanced knowledge-based suggestions
        try {
            const { suggestions, relevantKnowledge } = await getKnowledgeBasedSuggestions(
                fullContext, 
                currentQuestion.question, 
                knowledgeDocs
            );
            
            // Get genre intelligence analysis
            try {
                const genre = await genreIntelligenceService.detectGenre(
                    promptData.scriptText || '',
                    promptData
                );
                setGenreProfile(genre);
                
                // Get genre-specific suggestions for current question
                const contextualGenreSuggestions = await genreIntelligenceService.getContextualQuestionHelp(
                    currentQuestion.question,
                    genre
                );
                setGenreSuggestions(contextualGenreSuggestions);
            } catch (genreError) {
                appLogger.warn('Genre intelligence failed:', genreError);
            }
            
            setAiSuggestions(suggestions);
            setKnowledgeInsights(relevantKnowledge);
            
            // Also get local narrative analysis if HuggingFace is ready
            if (huggingFaceReady) {
                const analysis = await huggingFaceService.analyzeNarrative(fullContext);
                setNarrativeAnalysis(analysis);
            }
        } catch (error) {
            appLogger.error('Enhanced suggestions failed, falling back to basic AI suggestions:', error);
            const suggestions = await getAISuggestions(fullContext, currentQuestion.question, knowledgeDocs);
            setAiSuggestions(suggestions);
        }
        
        setIsLoadingAI(false);
    };
    
    const onSave = () => { if (!saveName.trim()) { alert('Please enter a name for this configuration'); return; } saveConfiguration(saveName); setSaveName(''); setShowSaveModal(false); }
    const nextQuestion = () => { if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(prev => prev + 1); setAiSuggestions([]); } };
    const prevQuestion = () => { if (currentQuestionIndex > 0) { setCurrentQuestionIndex(prev => prev - 1); setAiSuggestions([]); } };

    return (
        <div className="min-h-screen bg-black text-white">
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Dreamer Builder</h1>
                <div className="flex space-x-3">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSaveModal(true)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"><Save className="w-5 h-5" /></motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowLoadModal(true)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"><Upload className="w-5 h-5" /></motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowKnowledgePanel(!showKnowledgePanel)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"><BookOpen className="w-5 h-5" /></motion.button>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between text-base text-gray-300"><span>Step {currentQuestionIndex + 1} of {questions.length}</span><span className="font-semibold">{Math.round(progress)}%</span></div>
                <div className="w-full bg-gray-800 rounded-full h-3 shadow-inner"><motion.div className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full shadow-lg" style={{ width: `${progress}%` }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} /></div>
            </div>
          </motion.div>
  
          <VisualProgressTracker 
            currentStep={currentQuestion.step}
            totalSteps={questions.length}
            promptData={promptData}
            questions={questions}
          />

          <AnimatePresence mode="wait">
            <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3"><span className="px-3 py-1 text-sm bg-amber-500/20 text-amber-400 rounded-full">{currentQuestion.category}</span></div>
                <h2 className="text-3xl font-semibold leading-tight">{currentQuestion.question}</h2>
              </div>
              <div className="space-y-6">
                {currentQuestion.type === 'select' ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                      <label className="flex items-center space-x-3 text-base text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={multipleMode} onChange={(e) => { const newMode = e.target.checked; setMultipleMode(newMode); if (!newMode) { const currentValue = promptData[currentQuestion.id as keyof PromptData]; if (Array.isArray(currentValue) && currentValue.length > 0) { handleAnswer(currentQuestion.id as keyof PromptData, currentValue[0]); } } }} className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0" />
                        <span>Enable multiple selection</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options?.map((option) => { 
                        const currentValue = promptData[currentQuestion.id as keyof PromptData]; 
                        const isSelected = multipleMode ? Array.isArray(currentValue) && currentValue.includes(option) : formatValue(currentValue) === option; 
                        return (
                          <motion.button 
                            key={option} 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.98 }} 
                            onClick={() => multipleMode ? toggleMultipleSelection(option) : handleAnswer(currentQuestion.id as keyof PromptData, option)} 
                            className={`p-5 rounded-xl border-2 transition-all text-left ${ isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-100' : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-white hover:bg-gray-800' }`}
                          >
                            <span className="text-base font-medium">{option}</span>
                          </motion.button>
                        ); 
                      })}
                    </div>
                  </>
                ) : currentQuestion.type === 'script' ? (
                  <div className="space-y-3">
                    <textarea 
                      value={formatValue(promptData[currentQuestion.id as keyof PromptData])} 
                      onChange={(e) => handleAnswer(currentQuestion.id as keyof PromptData, e.target.value)} 
                      placeholder={currentQuestion.placeholder} 
                      className="w-full h-40 p-5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none text-lg leading-relaxed" 
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      value={formatValue(promptData[currentQuestion.id as keyof PromptData])} 
                      onChange={(e) => handleAnswer(currentQuestion.id as keyof PromptData, e.target.value)} 
                      placeholder={currentQuestion.placeholder} 
                      className="w-full p-5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none text-lg" 
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => handleRandomAnswer(currentQuestion.id as keyof PromptData, currentQuestion.question)} 
                  disabled={isGeneratingRandom} 
                  className="py-4 px-6 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-base">Inspire Me</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={fetchAISuggestions} 
                  disabled={isLoadingAI} 
                  className={`py-4 px-6 rounded-xl transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                    huggingFaceReady 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                  }`}
                >
                  {isLoadingAI ? ( 
                    <><div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white" /><span className="text-base">Dreamer is analyzing...</span></> 
                  ) : ( 
                    <><Lightbulb className="w-5 h-5" /><span className="text-base">{huggingFaceReady ? 'Enhanced Insight' : 'Dreamer Insight'}</span></> 
                  )}
                </motion.button>
              </div>

              {/* Show HuggingFace status and knowledge insights */}
              {huggingFaceReady && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-900/20 border border-green-700/30 rounded-xl"
                >
                  <div className="flex items-center space-x-3 text-green-400">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">🧠 Local AI Active - Enhanced Context Analysis</span>
                  </div>
                </motion.div>
              )}

              {knowledgeInsights.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-900/20 border border-amber-700/30 rounded-xl space-y-3">
                  <h4 className="text-amber-400 text-base font-semibold">📚 Relevant Knowledge</h4>
                  <div className="space-y-2">
                    {knowledgeInsights.map((insight, index) => (
                      <div key={index} className="text-amber-300 text-sm leading-relaxed">{insight}</div>
                    ))}
                  </div>
                </motion.div>
              )}

              {genreProfile && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-xl space-y-3">
                  <h4 className="text-purple-400 text-base font-semibold">🎭 Genre Intelligence</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-purple-300 font-medium capitalize text-lg">{genreProfile.genre}</span>
                    <span className="text-purple-500 text-sm bg-purple-800/30 px-2 py-1 rounded-full">({Math.round(genreProfile.confidence * 100)}% confidence)</span>
                  </div>
                  {genreProfile.subgenres.length > 0 && (
                    <div className="text-purple-300 text-sm">
                      <span className="font-medium">Subgenres:</span> {genreProfile.subgenres.join(', ')}
                    </div>
                  )}
                  <div className="text-purple-200 text-sm">
                    <span className="font-medium">Visual Style:</span> {genreProfile.characteristics.visualStyle.join(', ')}
                  </div>
                </motion.div>
              )}

              {genreSuggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl space-y-3">
                  <h4 className="text-blue-400 text-base font-semibold">🎬 Genre-Specific Tips</h4>
                  <div className="space-y-2">
                    {genreSuggestions.map((suggestion, index) => (
                      <div key={index} className="text-blue-300 text-sm leading-relaxed">{suggestion}</div>
                    ))}
                  </div>
                </motion.div>
              )}

              {aiSuggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="space-y-3"
                >
                  {aiSuggestions.map((suggestion, index) => (
                    <motion.button 
                      key={index} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: index * 0.1 }} 
                      whileHover={{ scale: 1.01, x: 4 }} 
                      whileTap={{ scale: 0.99 }} 
                      onClick={() => handleAnswer(currentQuestion.id as keyof PromptData, suggestion)} 
                      className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-amber-400 text-lg group-hover:scale-110 transition-transform">✨</span>
                        <span className="text-gray-200 text-base leading-relaxed group-hover:text-white transition-colors">{suggestion}</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
  
          <div className="pt-8 flex justify-between items-center">
            {currentQuestionIndex === 0 ? (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={onBackToHome} 
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center space-x-3 text-base"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={prevQuestion} 
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center space-x-3 text-base"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Previous</span>
              </motion.button>
            )}
            {currentQuestionIndex === questions.length - 1 ? (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={generatePrompt} 
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all flex items-center space-x-3 text-base font-semibold shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate Sequence</span>
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={nextQuestion} 
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center space-x-3 text-base"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
        
        {showSaveModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6 z-50" onClick={() => setShowSaveModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full space-y-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-semibold text-center">Save Configuration</h3>
                <input 
                  type="text" 
                  value={saveName} 
                  onChange={(e) => setSaveName(e.target.value)} 
                  placeholder="Enter a memorable name..." 
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none text-lg" 
                  autoFocus
                />
                <div className="flex space-x-4">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSave} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors text-base">Save</motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowSaveModal(false)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors text-base">Cancel</motion.button>
                </div>
            </motion.div>
            </motion.div>
        )}

        {showLoadModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setShowLoadModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">Load Configuration</h3>
                <div className="flex-grow overflow-y-auto pr-2">
                    {savedConfigurations.length === 0 ? ( <p className="text-gray-400 text-center py-8">No saved configurations</p> ) : (
                    <div className="space-y-2">{savedConfigurations.map((config) => <div key={config.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"><div className="flex-1"><p className="font-medium">{config.name}</p><p className="text-sm text-gray-400">{new Date(config.savedAt).toLocaleDateString()}</p></div><div className="flex space-x-2"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => {loadConfiguration(config); setShowLoadModal(false);}} className="p-2 bg-amber-500 hover:bg-amber-600 text-black rounded transition-colors"><Upload className="w-4 h-4" /></motion.button><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => deleteConfiguration(config.id)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"><Trash2 className="w-4 h-4" /></motion.button></div></div>)}</div>
                    )}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowLoadModal(false)} className="w-full mt-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex-shrink-0">Close</motion.button>
            </motion.div>
            </motion.div>
        )}

        {showKnowledgePanel && (
            <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto z-40">
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold">Knowledge Base</h3><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowKnowledgePanel(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors"><X className="w-5 h-5" /></motion.button></div>
            <div className="mb-6"><label className="block text-sm font-medium mb-2">Upload Documents</label><input type="file" multiple accept=".txt,.md,.json,.pdf" onChange={handleFileUpload} disabled={isProcessingDoc} className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium disabled:opacity-50" />{isProcessingDoc && <div className="mt-2 text-center text-amber-400 text-sm">Processing...</div>}</div>
            <div className="space-y-4">{knowledgeDocs.map((doc) => <div key={doc.id} className="p-3 bg-gray-800 rounded-lg"><div className="flex items-center justify-between mb-2"><h4 className="font-medium text-sm flex-1 truncate pr-2">{doc.name}</h4><div className="flex items-center space-x-2">{doc.id.startsWith('preloaded-') ? <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">Preloaded</span> : <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => deleteKnowledgeDoc(doc.id)} className="p-1 hover:bg-gray-700 rounded transition-colors"><Trash2 className="w-3 h-3 text-red-400" /></motion.button>}</div></div><p className="text-xs text-gray-400">Themes: {doc.extractedKnowledge?.themes.slice(0, 3).join(', ')}</p></div>)}</div>
            </motion.div>
        )}
      </div>
    );
};

// Added this missing interface for type safety in StoryboardPage
interface StoryboardProgressUpdate {
    completedChunks: number;
    totalChunks: number;
    estimatedMsRemaining: number;
    progressRatio: number;
    status: 'preparing' | 'processing' | 'completed' | 'error';
    statusText: string;
    partialShots: StoryboardShot[];
    errorMessage?: string;
    debug?: {
        averageChunkMs?: number;
        chunkProcessingMs?: number;
        accumulatedShots?: number;
        error?: string;
    };
}

const funLoadingTexts = [
    'Brewing cinematic coffee...',
    'Warming up the script...',
    'Finding the perfect lens flare...',
    'Consulting with the gaffer...',
    'Setting the key light...',
    'Scouting virtual locations...',
    'Reticulating splines for the dolly track...',
    'Adjusting the Kuleshov effect...',
    'Polishing the dailies...',
    'Enhancing emotional subtext...',
];

const StoryboardPage: React.FC<{
    setStage: (stage: Stage) => void;
    setGeneratedPrompts: React.Dispatch<React.SetStateAction<ShotPrompt[]>>;
    scriptText: string;
    setTimelineItems: React.Dispatch<React.SetStateAction<AnyTimelineItem[]>>;
    setCompositions: React.Dispatch<React.SetStateAction<Record<string, CompositionData>>>;
    setLightingData: React.Dispatch<React.SetStateAction<Record<string, LightingData>>>;
    setColorGradingData: React.Dispatch<React.SetStateAction<Record<string, ColorGradingData>>>;
    setCameraMovement: React.Dispatch<React.SetStateAction<Record<string, CameraMovementData>>>;
}> = ({ setStage, setTimelineItems, scriptText, setCompositions, setLightingData, setColorGradingData, setCameraMovement }) => {
    const [script, setScript] = useState(scriptText);
    const [customInstructions, setCustomInstructions] = useState('');
    const [storyboard, setStoryboard] = useState<StoryboardShot[]>([]);
    const [storyboardStyle, setStoryboardStyle] = useState<'cinematic' | 'explainer'>('cinematic');
    const [progress, setProgress] = useState<StoryboardProgressUpdate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [enhancingShotIndex, setEnhancingShotIndex] = useState<number | null>(null);
    const [copiedShotIndex, setCopiedShotIndex] = useState<number | null>(null);
    const [showStoryIdeation, setShowStoryIdeation] = useState(false);
    const progressIntervalRef = useRef<number | null>(null);
    
    useEffect(() => {
        // Cleanup interval on component unmount
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[id^="dropdown-"]')) {
                // Close all dropdowns
                const dropdowns = document.querySelectorAll('[id^="dropdown-"]');
                dropdowns.forEach(dropdown => {
                    dropdown.classList.add('hidden');
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleGenerateStoryboard = async () => {
        if (!script.trim() || isLoading) return;
        setIsLoading(true);
        setStoryboard([]);
        setProgress(null);

        const estimatedDurationMs = 25000; // 25 seconds estimate
        let elapsedTimeMs = 0;
        const intervalTimeMs = 250;

        // Start the simulated progress interval
        progressIntervalRef.current = window.setInterval(() => {
            elapsedTimeMs += intervalTimeMs;
            const progressRatio = Math.min(0.95, elapsedTimeMs / estimatedDurationMs); // Cap at 95% until done

            setProgress({
                completedChunks: Math.floor(progressRatio * 10),
                totalChunks: 10,
                estimatedMsRemaining: Math.max(0, estimatedDurationMs - elapsedTimeMs),
                progressRatio: progressRatio,
                status: 'processing',
                statusText: funLoadingTexts[Math.floor(Math.random() * funLoadingTexts.length)],
                partialShots: [],
            });
        }, intervalTimeMs);

        try {
            const result = await generateStoryboard(script, storyboardStyle, customInstructions.trim());

            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setProgress({
                completedChunks: 10,
                totalChunks: 10,
                estimatedMsRemaining: 0,
                progressRatio: 1,
                status: 'completed',
                statusText: 'Storyboard ready!',
                partialShots: result,
            });
            setStoryboard(result);
        } catch (error) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            appLogger.error('Storyboard generation error:', error);
            const message = error instanceof Error ? error.message : 'Storyboard generation failed.';
            setProgress(prev => ({
                ...(prev || { completedChunks: 0, totalChunks: 10, estimatedMsRemaining: 0, progressRatio: 0, partialShots:[] }),
                status: 'error',
                statusText: message,
                errorMessage: message,
            }));
        } finally {
            setIsLoading(false);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
    };

    const handleMakeCinematic = async (shotToEnhance: StoryboardShot, index: number) => {
        if (enhancingShotIndex !== null) return; // Prevent multiple requests
        setEnhancingShotIndex(index);
        try {
            const knowledgeContext = preloadedKnowledgeBase.map(doc => `## ${doc.name}\n${doc.content}`).join('\n\n');
            const enhancedShot = await makeExplainerPromptCinematic(shotToEnhance, knowledgeContext);
            
            if (enhancedShot && enhancedShot.screenplayLine && enhancedShot.shotDetails) {
                setStoryboard(prevStoryboard => {
                    const newStoryboard = [...prevStoryboard];
                    newStoryboard[index] = enhancedShot;
                    return newStoryboard;
                });
            } else {
                throw new Error("Received invalid shot data from enhancement API.");
            }
        } catch (error) {
            appLogger.error("Failed to make shot cinematic:", error);
        } finally {
            setEnhancingShotIndex(null);
        }
    };

    const convertToTimeline = async () => {
        if (storyboard.length === 0 || isConverting) return;
        setIsConverting(true);
    
        // Create item stubs first to get stable IDs.
        const items: ShotItem[] = storyboard.map((shot, index) => {
            const prompt = `Cinematic shot ${index + 1}: ${shot.shotDetails.shotType}. Scene: ${shot.screenplayLine}. Description: ${shot.shotDetails.description}. Camera Angle: ${shot.shotDetails.cameraAngle}. Camera Movement: ${shot.shotDetails.cameraMovement}. Lighting: ${shot.shotDetails.lightingMood}.`;
            return {
                id: crypto.randomUUID(),
                type: 'shot',
                data: {
                    shotNumber: index + 1,
                    prompt: prompt,
                    originalPrompt: prompt,
                    description: shot.screenplayLine,
                    role: shot.shotDetails.shotType,
                }
            };
        });
    
        // Fire all visual generation requests in parallel for performance.
        const visualPromises = storyboard.map(shot => initializeVisualsFromStoryboardShot(shot));
        const allVisuals = await Promise.all(visualPromises);
    
        const newCompositions: Record<string, CompositionData> = {};
        const newLighting: Record<string, LightingData> = {};
        const newColor: Record<string, ColorGradingData> = {};
        const newCamera: Record<string, CameraMovementData> = {};
    
        // Map the resolved visual data to the corresponding item IDs.
        items.forEach((item, index) => {
            const visuals = allVisuals[index];
            newCompositions[item.id] = visuals.composition;
            newLighting[item.id] = visuals.lighting;
            newColor[item.id] = visuals.color;
            newCamera[item.id] = visuals.camera;
        });
    
        setCompositions(prev => ({ ...prev, ...newCompositions }));
        setLightingData(prev => ({ ...prev, ...newLighting }));
        setColorGradingData(prev => ({ ...prev, ...newColor }));
        setCameraMovement(prev => ({ ...prev, ...newCamera }));
        
        setTimelineItems(items);
        setIsConverting(false);
        setStage('final');
    };

    const estimatedSeconds = progress ? Math.max(0, Math.round(progress.estimatedMsRemaining / 1000)) : 0;

    const handleStoryIdeationComplete = (context: any, generatedScript: string) => {
        // Add the generated script to the existing script content
        const enhancedScript = script.trim() 
            ? `${script}\n\n--- STORY CONTEXT ---\n${generatedScript}`
            : generatedScript;
        
        setScript(enhancedScript);
        setShowStoryIdeation(false);
        
        // Show a brief notification that story context was added
        setTimeout(() => {
            // Could add a toast notification here
            appLogger.info('Story context added to script!');
        }, 500);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Script to Storyboard</h1>
                    <p className="text-center text-gray-400 mb-6">Paste your script and let Dreamer break it down into a visual sequence.</p>

                    <div className="flex justify-center mb-4">
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-1 flex space-x-1">
                            <button
                                onClick={() => setStoryboardStyle('cinematic')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${storyboardStyle === 'cinematic' ? 'bg-amber-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                Cinematic Style
                            </button>
                            <button
                                onClick={() => setStoryboardStyle('explainer')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${storyboardStyle === 'explainer' ? 'bg-amber-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                Explainer Style
                            </button>
                        </div>
                    </div>

                    <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Paste your script here..." className="w-full h-48 p-4 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none mb-4" />
                    
                    {/* Story Ideation Button */}
                    <div className="mb-6">
                        <motion.button
                            onClick={() => setShowStoryIdeation(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all flex items-center justify-center space-x-2 mb-3"
                        >
                            <WandSparkles className="w-5 h-5" />
                            <span>🎭 Get Story Ideas (AI-Powered)</span>
                        </motion.button>
                        <p className="text-xs text-gray-400 text-center">
                            Need help developing your story? Let Dreamer guide you through smart questions to build compelling characters, conflict, and narrative.
                        </p>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Custom Instructions (Optional)
                        </label>
                        <textarea 
                            value={customInstructions} 
                            onChange={e => setCustomInstructions(e.target.value)} 
                            placeholder="Add specific instructions for your storyboard... (e.g., 'Use warmer color palette', 'Focus on close-up emotional shots', 'Include more action sequences', 'Emphasize the protagonist's perspective')" 
                            className="w-full h-24 p-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            These instructions will influence the visual style, composition, lighting, and overall approach of your storyboard shots.
                        </p>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                        <motion.button onClick={() => setStage('landing')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg">Back</motion.button>
                        <motion.button onClick={handleGenerateStoryboard} disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2">
                            {isLoading && <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white" />}
                            <span>Generate Storyboard</span>
                        </motion.button>
                    </div>

                    {progress && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <span>{progress.statusText}</span>
                                <span>{estimatedSeconds > 0 ? `~${estimatedSeconds}s remaining` : progress.status === 'completed' ? 'Done' : progress.status === 'error' ? 'Error' : 'Processing...'}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                <motion.div className="bg-gradient-to-r from-amber-500 to-orange-600 h-2" initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.round((progress.progressRatio || 0) * 100))}%` }} transition={{ duration: 0.3 }} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Shots: {progress.status === 'completed' ? storyboard.length : 0}</span>
                                <span>Status: {progress.status}</span>
                            </div>
                            {progress.status === 'error' && (
                                <div className="text-xs text-red-400 space-y-1">
                                    {progress.errorMessage && <p>Error: {progress.errorMessage}</p>}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {storyboard.length > 0 && progress?.status === 'completed' && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-semibold mb-4 text-center">Generated Storyboard</h2>
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">{storyboard.map((shot, index) => (
                                <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                                    <p className="text-sm font-mono text-gray-400 mb-2">{shot.screenplayLine}</p>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <p><strong className="text-amber-400">Shot:</strong> {shot.shotDetails.shotType} ({shot.shotDetails.cameraAngle})</p>
                                        <p><strong className="text-amber-400">Movement:</strong> {shot.shotDetails.cameraMovement}</p>
                                        <p><strong className="text-amber-400">Description:</strong> {shot.shotDetails.description}</p>
                                        <p><strong className="text-amber-400">Lighting:</strong> {shot.shotDetails.lightingMood}</p>
                                    </div>
                                    
                                    {/* Copy Prompt Buttons */}
                                    <div className="mt-3 flex justify-between items-center gap-2">
                                        {/* Original Copy Prompt Button - Kept Intact */}
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }} 
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                const promptText = `${shot.shotDetails.shotType} ${shot.shotDetails.cameraAngle}. ${shot.shotDetails.description}. ${shot.shotDetails.lightingMood} lighting. ${shot.shotDetails.cameraMovement} camera movement.`;
                                                navigator.clipboard.writeText(promptText).then(() => {
                                                    setCopiedShotIndex(index);
                                                    setTimeout(() => setCopiedShotIndex(null), 2000);
                                                });
                                            }}
                                            className="px-3 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center space-x-1"
                                        >
                                            {copiedShotIndex === index ? (
                                                <>
                                                    <Check className="w-3 h-3" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardCopy className="w-3 h-3" />
                                                    <span>Copy Prompt</span>
                                                </>
                                            )}
                                        </motion.button>

                                        {/* Multi-Model Copy Dropdown */}
                                        <div className="relative">
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }} 
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    const dropdownId = `dropdown-${index}`;
                                                    const dropdown = document.getElementById(dropdownId);
                                                    if (dropdown) {
                                                        dropdown.classList.toggle('hidden');
                                                    }
                                                }}
                                                className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 flex items-center space-x-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                <span>AI Models</span>
                                                <ChevronDown className="w-3 h-3" />
                                            </motion.button>
                                            
                                            {/* Dropdown Menu */}
                                            <div id={`dropdown-${index}`} className="hidden absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-600">
                                                    <p className="text-xs text-gray-300 font-medium">Copy for AI Image Generation</p>
                                                </div>
                                                {AI_MODELS.map((model) => (
                                                    <motion.button
                                                        key={model.id}
                                                        whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}
                                                        onClick={async () => {
                                                            const formattedPrompt = formatPromptForModel(shot, model);
                                                            await navigator.clipboard.writeText(formattedPrompt);
                                                            
                                                            // Show temporary copied state
                                                            const originalText = model.name;
                                                            const button = document.getElementById(`model-btn-${index}-${model.id}`);
                                                            if (button) {
                                                                const originalHTML = button.innerHTML;
                                                                button.innerHTML = '<span class="text-green-400">✓ Copied!</span>';
                                                                setTimeout(() => {
                                                                    button.innerHTML = originalHTML;
                                                                }, 1500);
                                                            }
                                                            
                                                            // Close dropdown
                                                            const dropdown = document.getElementById(`dropdown-${index}`);
                                                            if (dropdown) {
                                                                dropdown.classList.add('hidden');
                                                            }
                                                        }}
                                                        id={`model-btn-${index}-${model.id}`}
                                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between group"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium text-white">{model.name}</span>
                                                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-300" />
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-1">{model.description}</p>
                                                            {model.website && (
                                                                <p className="text-xs text-blue-400 mt-1">{model.website}</p>
                                                            )}
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {storyboardStyle === 'explainer' && (
                                            <motion.button 
                                                whileHover={{ scale: 1.05 }} 
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleMakeCinematic(shot, index)}
                                                disabled={enhancingShotIndex === index}
                                                className="px-3 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 disabled:opacity-50 flex items-center space-x-2"
                                            >
                                                {enhancingShotIndex === index ? (
                                                    <>
                                                        <div className="w-3 h-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-400" />
                                                        <span>Enhancing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Film className="w-3 h-3" />
                                                        <span>Make Cinematic</span>
                                                    </>
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            ))}</div>
                            <div className="mt-6 flex justify-center">
                                <motion.button onClick={convertToTimeline} disabled={storyboard.length === 0 || isConverting} className="px-8 py-4 text-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center space-x-2">
                                     {isConverting ? ( <><div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white" /><span>Initializing Visuals...</span></> ) : ( 'Continue to Visual Editor' )}
                                </motion.button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Story Ideation Modal */}
            {showStoryIdeation && (
                <StoryIdeation
                    onComplete={handleStoryIdeationComplete}
                    onClose={() => setShowStoryIdeation(false)}
                />
            )}
        </div>
    );
};

interface VisualSequenceEditorProps {
    timelineItems: AnyTimelineItem[];
    setTimelineItems: React.Dispatch<React.SetStateAction<AnyTimelineItem[]>>;
    promptData: PromptData;
    setStage: (stage: Stage) => void;
    visualPresets: VisualPreset[];
    savePreset: (name: string, timelineItemId: string) => void;
    applyPresetToItem: (preset: VisualPreset, timelineItemId: string) => void;
    deletePreset: (id: string) => void;
    exportPreset: (preset: VisualPreset) => void;
    triggerPresetImport: () => void;
    handlePresetImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    presetFileInputRef: React.RefObject<HTMLInputElement>;
    compositions: Record<string, CompositionData>;
    lightingData: Record<string, LightingData>;
    colorGradingData: Record<string, ColorGradingData>;
    cameraMovement: Record<string, CameraMovementData>;
    showCollaboration: boolean;
    setShowCollaboration: React.Dispatch<React.SetStateAction<boolean>>;
    updateVisuals: <T>(
        id: string,
        dataType: 'compositions' | 'lightingData' | 'colorGradingData' | 'cameraMovement',
        data: T
    ) => void;
    updatePromptFromVisuals: (timelineItemId: string) => void;
    aspectRatios: Record<string, string>;
    setAspectRatios: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    styles: Record<string, 'cinematic' | 'explainer'>;
    setStyles: React.Dispatch<React.SetStateAction<Record<string, 'cinematic' | 'explainer'>>>;
    soundDesignData: Record<string, SoundDesignData>;
    setSoundDesignData: React.Dispatch<React.SetStateAction<Record<string, SoundDesignData>>>;
    castingData: Record<string, CastingData>;
    setCastingData: React.Dispatch<React.SetStateAction<Record<string, CastingData>>>;
    deleteTimelineItem: (id: string) => void;
}

// #############################################################################################
// COMPONENT: SelectedItemPanel (NEW FOR VISUAL SEQUENCE EDITOR)
// #############################################################################################
interface SelectedItemPanelProps {
    item: AnyTimelineItem;
    updateItem: (updatedItem: AnyTimelineItem) => void;
    onEnhance: (item: ShotItem) => void;
    onRevert: (item: ShotItem) => void;
    onGenerateImage: (item: ShotItem, type: 'photoreal' | 'stylized') => void;
    onGenerateVideoPrompt: (item: ShotItem) => void;
    generatedContent: {
        images: { photoreal?: string; stylized?: string };
        enhancedPrompt?: string;
        videoPrompt?: string;
        status: 'idle' | 'loading' | 'error';
    };
    // Visual Editor Props
    compositions: Record<string, CompositionData>;
    lightingData: Record<string, LightingData>
    colorGradingData: Record<string, ColorGradingData>;
    cameraMovement: Record<string, CameraMovementData>;
    updateVisuals: (id: string, dataType: 'compositions' | 'lightingData' | 'colorGradingData' | 'cameraMovement', data: any) => void;
    updatePromptFromVisuals: (id: string) => Promise<void>;
    aspectRatios: Record<string, string>;
    setAspectRatios: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    styles: Record<string, 'cinematic' | 'explainer'>;
    setStyles: React.Dispatch<React.SetStateAction<Record<string, 'cinematic' | 'explainer'>>>;
    // Sound Design & Casting Props
    soundDesignData: Record<string, SoundDesignData>;
    setSoundDesignData: React.Dispatch<React.SetStateAction<Record<string, SoundDesignData>>>;
    castingData: Record<string, CastingData>;
    setCastingData: React.Dispatch<React.SetStateAction<Record<string, CastingData>>>;
}


const SelectedItemPanel: React.FC<SelectedItemPanelProps> = ({
    item, updateItem, onEnhance, onRevert, onGenerateImage, onGenerateVideoPrompt, generatedContent,
    compositions, lightingData, colorGradingData, cameraMovement, updateVisuals, updatePromptFromVisuals,
    aspectRatios, setAspectRatios, styles, setStyles,
    soundDesignData, setSoundDesignData, castingData, setCastingData
}) => {
    const [activeVisualTab, setActiveVisualTab] = useState<'composition' | 'lighting' | 'color' | 'camera' | 'sound' | 'casting'>('composition');
    const [imageView, setImageView] = useState<'photoreal' | 'stylized'>('photoreal');
    const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);
    const [copiedModel, setCopiedModel] = useState<string | null>(null);
    const [showCopyMenu, setShowCopyMenu] = useState(false);

    const handleUpdatePromptFromVisuals = async () => {
        setIsUpdatingPrompt(true);
        try {
            await updatePromptFromVisuals(item.id);
        } finally {
            setIsUpdatingPrompt(false);
        }
    };

    const handleCopyPromptForModel = async (model: AIModel, shotItem: ShotItem) => {
        const formattedPrompt = formatPromptForModel(shotItem.data, model);
        try {
            await navigator.clipboard.writeText(formattedPrompt);
            setCopiedModel(model.id);
            setTimeout(() => setCopiedModel(null), 2000);
        } catch (error) {
            appLogger.error('Failed to copy prompt:', error);
        }
    };

    if (item.type !== 'shot') {
        return (
            <div className="flex-grow flex flex-col p-4 bg-gray-950 border border-gray-800 rounded-lg">
                 <h2 className="text-xl font-semibold text-amber-400 mb-2">
                    {item.type === 'b-roll' ? 'B-Roll Shot' : item.type === 'transition' ? 'Transition Note' : 'Title Card'}
                </h2>
                {item.type === 'b-roll' && <textarea value={item.prompt} onChange={e => updateItem({...item, prompt: e.target.value})} className="w-full flex-grow bg-gray-900 rounded p-2 text-gray-300"/>}
                {item.type === 'transition' && <textarea value={item.note} onChange={e => updateItem({...item, note: e.target.value})} className="w-full flex-grow bg-gray-900 rounded p-2 text-gray-300"/>}
                {item.type === 'text' && <textarea value={item.title} onChange={e => updateItem({...item, title: e.target.value})} className="w-full flex-grow bg-gray-900 rounded p-2 text-gray-300"/>}
            </div>
        );
    }

    const shotItem = item as ShotItem;
    const shotData = shotItem.data;
    const isModified = shotData.prompt !== shotData.originalPrompt;

    const currentStyle = styles[item.id] || 'cinematic';
    const setCurrentStyle = (style: 'cinematic' | 'explainer') => {
        setStyles(prev => ({ ...prev, [item.id]: style }));
    };

    // Visual Editor Handlers
    const onCompositionChange = (field: keyof CompositionData, value: any) => updateVisuals(item.id, 'compositions', { ...visualData.composition, [field]: value });
    const onLightingChange = (field: keyof LightingData, value: any) => updateVisuals(item.id, 'lightingData', { ...visualData.lighting, [field]: value });
    const onColorChange = (field: keyof ColorGradingData, value: any) => updateVisuals(item.id, 'colorGradingData', { ...visualData.color, [field]: value });
    const onCameraChange = (field: keyof CameraMovementData, value: any) => updateVisuals(item.id, 'cameraMovement', { ...visualData.camera, [field]: value });
    const onCameraPathChange = (key: 'startPos' | 'endPos', coord: 'x' | 'y', value: number) => {
        const current = visualData.camera[key];
        updateVisuals(item.id, 'cameraMovement', { ...visualData.camera, [key]: { ...current, [coord]: value } });
    };

    const visualData = {
        composition: compositions[item.id] || defaultComposition,
        lighting: lightingData[item.id] || defaultLighting,
        color: colorGradingData[item.id] || defaultColorGrading,
        camera: cameraMovement[item.id] || defaultCameraMovement,
    };

    return (
        <div className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 bg-gray-950/70 border border-gray-800 rounded-lg space-y-6 md:space-y-8 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-grow">
                    <span className="text-xs uppercase tracking-wider text-amber-500">Shot {shotData.shotNumber}</span>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-amber-400 mt-1">{shotData.role}</h2>
                    <p className="text-sm md:text-base text-gray-400 mt-2 leading-relaxed">{shotData.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                   {isModified && (
                        <motion.button title="Revert to Original Prompt" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onRevert(shotItem)} className="p-2.5 md:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"><RefreshCcw className="w-4 h-4 md:w-5 md:h-5 text-amber-400"/></motion.button>
                   )}
                   <motion.button title="Enhance with AI" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEnhance(shotItem)} className="p-2.5 md:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"><WandSparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-400"/></motion.button>
                </div>
            </div>

            {/* Prompt & Generated Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Prompt Text Area */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-semibold text-gray-300">Cinematic Prompt</h3>
                        {/* Copy Prompt Dropdown */}
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCopyMenu(!showCopyMenu)}
                                className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded-lg transition-colors text-sm"
                                title="Copy prompt for AI models"
                            >
                                <ClipboardCopy className="w-4 h-4" />
                                <span className="hidden sm:inline">Copy For AI</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showCopyMenu ? 'rotate-180' : ''}`} />
                            </motion.button>
                            <AnimatePresence>
                                {showCopyMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="p-2 border-b border-gray-800">
                                            <p className="text-xs text-gray-400 px-2 py-1">Copy prompt formatted for:</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {AI_MODELS.map(model => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        handleCopyPromptForModel(model, shotItem);
                                                        setShowCopyMenu(false);
                                                    }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-800 rounded-lg transition-colors group"
                                                >
                                                    <div className="flex-grow text-left">
                                                        <p className="text-sm font-medium text-white">{model.name}</p>
                                                        <p className="text-xs text-gray-400">{model.description}</p>
                                                    </div>
                                                    {copiedModel === model.id ? (
                                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                                                    ) : model.website ? (
                                                        <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-amber-400 flex-shrink-0 ml-2" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-600 group-hover:text-amber-400 flex-shrink-0 ml-2" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <textarea 
                        value={shotData.prompt}
                        onChange={e => updateItem({ ...item, data: { ...shotData, prompt: e.target.value }})}
                        className="w-full flex-grow min-h-[200px] md:min-h-[250px] bg-gray-900 border border-gray-700 rounded-lg p-4 md:p-5 text-sm md:text-base text-gray-200 resize-none focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all leading-relaxed"
                        placeholder="Enter your cinematic prompt here..."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={() => onGenerateImage(shotItem, 'photoreal')} className="py-3 md:py-3.5 text-sm md:text-base bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 flex items-center justify-center space-x-2 transition-colors font-medium"><ImageIcon className="w-4 h-4 md:w-5 md:h-5"/><span>Generate Photoreal</span></button>
                        <button onClick={() => onGenerateImage(shotItem, 'stylized')} className="py-3 md:py-3.5 text-sm md:text-base bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 flex items-center justify-center space-x-2 transition-colors font-medium"><Palette className="w-4 h-4 md:w-5 md:h-5"/><span>Generate Stylized</span></button>
                    </div>
                     <button onClick={() => onGenerateVideoPrompt(shotItem)} className="w-full py-3 md:py-3.5 text-sm md:text-base bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 flex items-center justify-center space-x-2 transition-colors font-medium"><Film className="w-4 h-4 md:w-5 md:h-5"/><span>Generate Video Prompt</span></button>
                </div>
                 {/* Generated Content Area */}
                 <div className="space-y-4 flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                         <h3 className="text-base md:text-lg font-semibold text-gray-300">Generated Content</h3>
                         <div className="flex flex-wrap items-center gap-2">
                            <div className="bg-gray-800 border border-gray-700 rounded p-0.5 flex text-xs">
                                <button onClick={() => setCurrentStyle('cinematic')} className={`px-3 py-1.5 rounded transition-colors ${currentStyle === 'cinematic' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-300 hover:bg-gray-700'}`}>
                                    Cinematic
                                </button>
                                <button onClick={() => setCurrentStyle('explainer')} className={`px-3 py-1.5 rounded transition-colors ${currentStyle === 'explainer' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-300 hover:bg-gray-700'}`}>
                                    Explainer
                                </button>
                            </div>
                            <select 
                                value={aspectRatios[item.id] || '16:9'} 
                                onChange={(e) => setAspectRatios(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                            >
                                <option value="16:9">16:9</option>
                                <option value="9:16">9:16</option>
                                <option value="1:1">1:1</option>
                                <option value="4:3">4:3</option>
                                <option value="3:4">3:4</option>
                            </select>
                         </div>
                    </div>
                    <div className="w-full flex-grow min-h-[250px] md:min-h-[300px] bg-gray-900 border border-gray-700 rounded-lg p-3 md:p-4 flex items-center justify-center relative group">
                        {generatedContent.status === 'loading' && (
                            <div className="flex flex-col items-center space-y-3">
                                <div className="w-8 h-8 animate-spin rounded-full border-3 border-gray-400 border-t-amber-400" />
                                <p className="text-sm text-gray-400">Generating image...</p>
                            </div>
                        )}
                        {generatedContent.status === 'error' && (
                            <div className="flex flex-col items-center space-y-2">
                                <p className="text-red-400 text-sm md:text-base font-medium">Generation Failed</p>
                                <p className="text-xs text-gray-500">Please try again or check console for details</p>
                            </div>
                        )}
                        {generatedContent.status === 'idle' && generatedContent.images[imageView] && (
                            <>
                                <img src={imageView === 'photoreal' ? `data:image/jpeg;base64,${generatedContent.images.photoreal}` : `data:image/png;base64,${generatedContent.images.stylized}`} className="max-w-full max-h-full object-contain rounded" alt="Generated scene"/>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        const base64Data = generatedContent.images[imageView]!;
                                        const mimeType = imageView === 'photoreal' ? 'image/jpeg' : 'image/png';
                                        const extension = imageView === 'photoreal' ? 'jpg' : 'png';
                                        const filename = `dreamer-shot-${shotData.shotNumber}-${imageView}.${extension}`;
                                        downloadBase64Image(base64Data, mimeType, filename);
                                    }}
                                    className="absolute top-3 right-3 p-2.5 md:p-3 bg-gray-900/80 hover:bg-gray-900/95 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                    title="Download Image"
                                >
                                    <Download className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </motion.button>
                            </>
                        )}
                         {generatedContent.status === 'idle' && !generatedContent.images[imageView] && (
                            <div className="text-center space-y-2">
                                <p className="text-gray-500 text-sm md:text-base">{imageView === 'photoreal' ? 'Photoreal' : 'Stylized'} image will appear here</p>
                                <p className="text-xs text-gray-600">Click generate button to create</p>
                            </div>
                        )}
                     </div>
                     <div className="flex justify-center gap-3">
                        {generatedContent.images.photoreal && <button onClick={() => setImageView('photoreal')} className={`px-4 py-2 text-sm rounded-lg transition-colors ${imageView === 'photoreal' ? 'bg-blue-500 text-white font-medium' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Photoreal</button>}
                        {generatedContent.images.stylized && <button onClick={() => setImageView('stylized')} className={`px-4 py-2 text-sm rounded-lg transition-colors ${imageView === 'stylized' ? 'bg-teal-500 text-white font-medium' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Stylized</button>}
                    </div>
                </div>
            </div>

            {/* Visual Editor */}
            <div>
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-amber-400">Visual Architecture</h3>
                    <button 
                        onClick={handleUpdatePromptFromVisuals} 
                        disabled={isUpdatingPrompt}
                        className="px-3 py-1 text-sm rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-60 flex items-center space-x-2"
                    >
                        {isUpdatingPrompt && <div className="w-4 h-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-500" />}
                        <span>{isUpdatingPrompt ? 'Updating...' : 'Update Prompt from Visuals'}</span>
                    </button>
                 </div>
                 <div className="flex items-center space-x-2 mb-2 border-b border-gray-800 overflow-x-auto">
                    {(['composition', 'lighting', 'color', 'camera', 'sound', 'casting'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveVisualTab(tab)} className={`px-4 py-2 text-sm capitalize rounded-t-lg transition-colors whitespace-nowrap ${activeVisualTab === tab ? 'bg-gray-800 text-amber-400' : 'text-gray-400 hover:bg-gray-900'}`}>
                            {tab}
                        </button>
                    ))}
                 </div>
                 <AnimatePresence mode="wait">
                    <motion.div key={activeVisualTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeVisualTab === 'composition' && <CompositionEditor 
                            composition={visualData.composition}
                            onAddCharacter={() => onCompositionChange('characters', [...visualData.composition.characters, {id: crypto.randomUUID(), name: `Character ${visualData.composition.characters.length + 1}`, x: STAGE_WIDTH/2, y: STAGE_HEIGHT/2}])}
                            onRemoveCharacter={(id) => onCompositionChange('characters', visualData.composition.characters.filter(c => c.id !== id))}
                            onDrag={() => {}} // Drag is handled internally by the component now
                            onPositionChange={(id, x, y) => onCompositionChange('characters', visualData.composition.characters.map(c => c.id === id ? {...c, x, y} : c))}
                            onNameChange={(id, name) => onCompositionChange('characters', visualData.composition.characters.map(c => c.id === id ? {...c, name} : c))}
                            onCameraAngleChange={(angle) => onCompositionChange('cameraAngle', angle)}
                            onCameraHeightChange={(height) => onCompositionChange('cameraHeight', height)}
                        />}
                        {activeVisualTab === 'lighting' && <LightingEditor lighting={visualData.lighting} onChange={onLightingChange} />}
                        {activeVisualTab === 'color' && <ColorGradingEditor color={visualData.color} onChange={onColorChange} />}
                        {activeVisualTab === 'camera' && <CameraMovementEditor camera={visualData.camera} onChange={onCameraChange} onPathChange={onCameraPathChange}/>}
                        {activeVisualTab === 'sound' && <SoundDesignModule
                            sceneDescription={shotData.description}
                            visualMood={visualData.lighting.mood}
                            characters={visualData.composition.characters.map(c => c.name)}
                            cameraMovement={visualData.camera.movementType}
                            lighting={visualData.lighting.mood}
                            onSoundDataUpdate={(data) => {
                                setSoundDesignData(prev => ({ ...prev, [item.id]: data }));
                            }}
                        />}
                        {activeVisualTab === 'casting' && <CastingAssistant
                            characters={visualData.composition.characters.map(c => c.name)}
                            sceneDescription={shotData.description}
                            onCastingDataUpdate={(data) => {
                                setCastingData(prev => ({ ...prev, [item.id]: data }));
                            }}
                        />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// THIS IS THE COMPLETE, NON-PLACEHOLDER IMPLEMENTATION
const VisualSequenceEditor: React.FC<VisualSequenceEditorProps> = (props) => {
    const {
        timelineItems,
        setTimelineItems,
        setStage,
        updateVisuals,
        updatePromptFromVisuals,
        compositions,
        lightingData,
        colorGradingData,
        cameraMovement,
        aspectRatios,
        setAspectRatios,
        styles,
        setStyles,
        soundDesignData,
        setSoundDesignData,
        castingData,
        setCastingData,
        deleteTimelineItem,
    } = props;
    
    const [activeTimelineItemId, setActiveTimelineItemId] = useState<string | null>(timelineItems.find(item => item.type === 'shot')?.id || null);
    const [sequenceStyle, setSequenceStyle] = useState<SequenceStyle | null>(null);
    const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
    const [addItemMenuOpen, setAddItemMenuOpen] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [showVideoPromptModal, setShowVideoPromptModal] = useState<ShotItem | null>(null);
    const [videoPromptInstructions, setVideoPromptInstructions] = useState("");
    const [videoPromptCopied, setVideoPromptCopied] = useState(false);
    
    // Auto-scroll functionality for timeline items
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const [previousTimelineLength, setPreviousTimelineLength] = useState(timelineItems.length);
    
    // Initialize previous timeline length on component mount
    useEffect(() => {
        setPreviousTimelineLength(timelineItems.length);
    }, []);
    
    // Scroll queue system to prevent race conditions
    const scrollQueueRef = useRef<{
        isScrolling: boolean;
        queue: Array<() => void>;
        timeoutId: NodeJS.Timeout | null;
    }>({ isScrolling: false, queue: [], timeoutId: null });
    
    // Manual scroll to bottom function with queue management
    const scrollToBottom = useCallback(() => {
        const scrollQueue = scrollQueueRef.current;
        
        if (scrollQueue.isScrolling) {
            // Queue the scroll if already scrolling
            scrollQueue.queue.push(() => {
                if (timelineContainerRef.current) {
                    const container = timelineContainerRef.current;
                    const scrollTop = container.scrollHeight - container.clientHeight;
                    appLogger.debug('Queued scroll to bottom:', { scrollTop, scrollHeight: container.scrollHeight, clientHeight: container.clientHeight });
                    container.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    });
                }
            });
            return;
        }
        
        scrollQueue.isScrolling = true;
        
        if (timelineContainerRef.current) {
            const container = timelineContainerRef.current;
            const scrollTop = container.scrollHeight - container.clientHeight;
            appLogger.debug('Direct scroll to bottom:', { scrollTop, scrollHeight: container.scrollHeight, clientHeight: container.clientHeight });
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }
        
        // Clear any existing timeout
        if (scrollQueue.timeoutId) {
            clearTimeout(scrollQueue.timeoutId);
        }
        
        // Set timeout to process queued scrolls
        scrollQueue.timeoutId = setTimeout(() => {
            scrollQueue.isScrolling = false;
            scrollQueue.timeoutId = null;
            
            // Process any queued scrolls
            while (scrollQueue.queue.length > 0) {
                const nextScroll = scrollQueue.queue.shift();
                if (nextScroll) {
                    nextScroll();
                }
            }
        }, 500); // Wait 500ms after scrolling completes
    }, []);
    
    // Expose scroll function for debugging
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).scrollTimelineToBottom = scrollToBottom;
        }
    }, [scrollToBottom]);
    
    // Cleanup scroll queue on unmount
    useEffect(() => {
        return () => {
            if (scrollQueueRef.current.timeoutId) {
                clearTimeout(scrollQueueRef.current.timeoutId);
            }
        };
    }, []);
    
    // State for generated content, keyed by timeline item ID
    const [generatedContent, setGeneratedContent] = useState<Record<string, {
        images: { photoreal?: string; stylized?: string };
        enhancedPrompt?: string;
        videoPrompt?: string;
        status: 'idle' | 'loading' | 'error';
    }>>({});

    const activeItem = useMemo(() => timelineItems.find(item => item.id === activeTimelineItemId), [timelineItems, activeTimelineItemId]);

    // Auto-scroll functionality for timeline items using queue system
    useEffect(() => {
        // Check if a new item was added (timeline length increased)
        if (timelineItems.length > previousTimelineLength && timelineContainerRef.current) {
            // Use the scroll queue system to prevent race conditions
            setTimeout(() => {
                scrollToBottom();
            }, 100); // Small delay to allow the DOM to update
        }
        setPreviousTimelineLength(timelineItems.length);
    }, [timelineItems.length, previousTimelineLength, scrollToBottom]);

    const MAX_TIMELINE_ITEMS = 100;
    const VIRTUALIZATION_THRESHOLD = 50;
    
    const handleSetTimelineItems = useCallback((newItems: AnyTimelineItem[]) => {
        // Performance optimization: Limit timeline items to prevent memory issues
        if (newItems.length > MAX_TIMELINE_ITEMS) {
            console.warn(`⚠️ Timeline items exceeded limit (${MAX_TIMELINE_ITEMS}). Keeping first ${MAX_TIMELINE_ITEMS} items.`);
            newItems = newItems.slice(0, MAX_TIMELINE_ITEMS);
        }
        
        // Renumber shots after reordering
        let shotCounter = 1;
        const renumberedItems = newItems.map(item => {
            if (item.type === 'shot') {
                const updatedShot = { ...item, data: { ...item.data, shotNumber: shotCounter } };
                shotCounter++;
                return updatedShot;
            }
            return item;
        });
        
        setTimelineItems(renumberedItems);
    }, [MAX_TIMELINE_ITEMS]);

    const handleAddItem = async (type: TimelineItemType) => {
        appLogger.debug('Adding new item:', type, 'Current timeline length:', timelineItems.length);
        setAddItemMenuOpen(false);
        const newItemId = crypto.randomUUID();
        let newItem: AnyTimelineItem;

        if (type === 'shot') {
            const newShotNumber = timelineItems.filter(i => i.type === 'shot').length + 1;
            const newShot: ShotPrompt = {
                shotNumber: newShotNumber,
                prompt: `New Shot ${newShotNumber}`,
                originalPrompt: `New Shot ${newShotNumber}`,
                description: 'A new scene',
                role: 'medium shot'
            };
            newItem = { id: newItemId, type: 'shot', data: newShot };
            updateVisuals(newItemId, 'compositions', clone(defaultComposition));
            updateVisuals(newItemId, 'lightingData', clone(defaultLighting));
            updateVisuals(newItemId, 'colorGradingData', clone(defaultColorGrading));
            updateVisuals(newItemId, 'cameraMovement', clone(defaultCameraMovement));
        } else if (type === 'b-roll') {
            const context = timelineItems.filter(i => i.type === 'shot').map(i => (i as ShotItem).data.prompt).join('\n');
            const brollPrompt = await generateBrollPrompt(context, sequenceStyle);
            newItem = { id: newItemId, type: 'b-roll', prompt: brollPrompt };
        } else if (type === 'transition') {
            newItem = { id: newItemId, type: 'transition', note: 'CUT TO:' };
        } else { // text
            newItem = { id: newItemId, type: 'text', title: 'TITLE CARD' };
        }
        
        const currentIndex = activeTimelineItemId ? timelineItems.findIndex(i => i.id === activeTimelineItemId) : -1;
        const newItems = [...timelineItems];
        newItems.splice(currentIndex + 1, 0, newItem);
        
        appLogger.debug('About to add item, new timeline length will be:', newItems.length);
        handleSetTimelineItems(newItems);
        
        // Use scroll queue system after adding item
        setTimeout(() => {
            scrollToBottom();
        }, 200);
        
        if(newItem.type === 'shot') {
             setActiveTimelineItemId(newItem.id);
        }
    };
    
    const handleAnalyzeStyle = async () => {
        setIsAnalyzingStyle(true);
        const prompts = timelineItems.filter(i => i.type === 'shot').map(i => (i as ShotItem).data.prompt);
        if (prompts.length > 0) {
            const style = await analyzeSequenceStyle(prompts);
            setSequenceStyle(style);
        }
        setIsAnalyzingStyle(false);
    };
    
    const handleGetSuggestion = async () => {
        if (!activeItem || activeItem.type !== 'shot') return;
        setIsLoadingSuggestion(true);
        setAiSuggestion(null);

        const currentIndex = timelineItems.findIndex(i => i.id === activeItem.id);
        const prevItem = timelineItems[currentIndex - 1];
        const nextItem = timelineItems[currentIndex + 1];

        let context = `CURRENT SHOT (${(activeItem as ShotItem).data.shotNumber}): ${(activeItem as ShotItem).data.prompt}`;
        if (prevItem?.type === 'shot') {
             context = `PREVIOUS SHOT (${(prevItem as ShotItem).data.shotNumber}): ${(prevItem as ShotItem).data.prompt}\n\n${context}`;
        }
        if (nextItem?.type === 'shot') {
            context = `${context}\n\nNEXT SHOT (${(nextItem as ShotItem).data.shotNumber}): ${(nextItem as ShotItem).data.prompt}`;
        }
        const suggestion = await getTimelineSuggestion(context);
        setAiSuggestion(suggestion);
        setIsLoadingSuggestion(false);
    }
    
    const updateItemState = (updatedItem: AnyTimelineItem) => {
        setTimelineItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    };

    const updateShotData = (id: string, updates: Partial<ShotPrompt>) => {
        setTimelineItems(prev => prev.map(item => {
            if (item.id === id && item.type === 'shot') {
                return { ...item, data: { ...item.data, ...updates }};
            }
            return item;
        }));
    };

    const handleEnhance = async (item: ShotItem) => {
        const id = item.id;
        setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'loading'}}));
        try {
            const context = timelineItems.map(i => i.type === 'shot' ? `Shot ${(i as ShotItem).data.shotNumber}: ${(i as ShotItem).data.description}` : '').join('\n');
            const enhanced = await enhanceShotPrompt(item.data.prompt, context);
            updateShotData(id, { prompt: enhanced });
            setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'idle', enhancedPrompt: enhanced}}));
        } catch (e) {
            setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'error'}}));
        }
    };

    const handleRevert = (item: ShotItem) => {
        updateShotData(item.id, { prompt: item.data.originalPrompt });
    };

    const handleGenerateImage = async (item: ShotItem, type: 'photoreal' | 'stylized') => {
        const id = item.id;
        const style = styles[id] || 'cinematic';
        setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'loading'}}));
        try {
            const promptForGeneration = style === 'explainer' ? item.data.description : item.data.prompt;
            const imageGenerator = type === 'photoreal' ? generateImage : generateNanoImage;
            const currentAspectRatio = aspectRatios[id] || '16:9';

            let b64: string;
            if (type === 'photoreal') {
              b64 = await generateImage(promptForGeneration, currentAspectRatio, style);
            } else {
              b64 = await generateNanoImage(promptForGeneration, style);
            }

            setGeneratedContent(prev => ({...prev, [id]: {
                ...(prev[id] || {images:{}}),
                status: 'idle',
                images: {...prev[id]?.images, [type]: b64}
            }}));
        } catch (e) {
            setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'error'}}));
        }
    };

    const handleGenerateVideoPrompt = async () => {
        if (!showVideoPromptModal) return;
        const item = showVideoPromptModal;
        const id = item.id;
        setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'loading'}}));
        setShowVideoPromptModal(null);
        try {
            const image = generatedContent[id]?.images?.photoreal ? { base64: generatedContent[id].images.photoreal!, mimeType: 'image/jpeg' } : undefined;
            const videoPrompt = await generateVideoPrompt(item.data.prompt, image, videoPromptInstructions);
            setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'idle', videoPrompt: videoPrompt}}));
            setVideoPromptInstructions("");
        } catch (e) {
            setGeneratedContent(prev => ({...prev, [id]: {...(prev[id] || {images:{}}), status: 'error'}}));
        }
    };

    const handleVideoPromptCopy = async () => {
        if (!showVideoPromptModal) return;
        const videoPrompt = generatedContent[showVideoPromptModal.id]?.videoPrompt;
        if (!videoPrompt) return;
        try {
            await navigator.clipboard.writeText(videoPrompt);
            setVideoPromptCopied(true);
            setTimeout(() => setVideoPromptCopied(false), 2000);
        } catch (error) {
            appLogger.error("Failed to copy video prompt:", error);
        }
    };

    const handleDeleteItem = (id: string) => {
        if (activeTimelineItemId === id) {
            setActiveTimelineItemId(null);
        }
        setGeneratedContent(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        deleteTimelineItem(id);
    };
    
    return (
        <div className="min-h-screen bg-black text-white p-3 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-1.5rem)] md:h-[calc(100vh-3rem)] space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Visual Sequence Editor</h1>
                     <div className="flex flex-wrap items-center gap-3">
                        <motion.button 
                          whileHover={{scale: 1.05}} 
                          whileTap={{scale: 0.95}} 
                          onClick={handleAnalyzeStyle} 
                          disabled={isAnalyzingStyle} 
                          className="px-4 py-2.5 md:py-3 text-sm rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center space-x-2 md:space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isAnalyzingStyle ? (
                              <><div className="w-4 h-4 md:w-5 md:h-5 animate-spin rounded-full border-2 border-gray-400 border-t-white"/><span>Analyzing...</span></>
                            ) : (
                              <><Palette className="w-4 h-4 md:w-5 md:h-5"/><span>Analyze Style</span></>
                            )}
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }} 
                          onClick={() => setStage('builder')} 
                          className="px-4 md:px-6 py-2.5 md:py-3 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                        >
                          Back to Builder
                        </motion.button>
                     </div>
                </div>
                
                {sequenceStyle && (
                    <motion.div 
                      initial={{opacity:0, y: -10}} 
                      animate={{opacity:1, y: 0}} 
                      className="flex-shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-5 space-y-2"
                    >
                        <p className="text-sm md:text-base leading-relaxed"><strong className="text-amber-400">Visual DNA:</strong> {sequenceStyle.visualDNA}</p>
                    </motion.div>
                )}

                {/* Main Content: Editor and Timeline */}
                <div className="flex-grow flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden">
                    {/* Left: Selected Item Panel & Visual Editor */}
                    <div className="w-full lg:w-3/5 xl:w-2/3 flex-shrink-0 flex flex-col overflow-y-auto pr-0 lg:pr-2 space-y-4 md:space-y-6">
                        {activeItem ? (
                           <SelectedItemPanel
                                key={activeItem.id}
                                item={activeItem}
                                updateItem={updateItemState}
                                onEnhance={handleEnhance}
                                onRevert={handleRevert}
                                onGenerateImage={handleGenerateImage}
                                onGenerateVideoPrompt={(item) => { setVideoPromptInstructions(''); setShowVideoPromptModal(item); }}
                                generatedContent={generatedContent[activeItem.id] || { images: {}, status: 'idle' }}
                                compositions={compositions}
                                lightingData={lightingData}
                                colorGradingData={colorGradingData}
                                cameraMovement={cameraMovement}
                                updateVisuals={updateVisuals}
                                updatePromptFromVisuals={props.updatePromptFromVisuals as (id: string) => Promise<void>}
                                aspectRatios={aspectRatios}
                                setAspectRatios={setAspectRatios}
                                styles={styles}
                                setStyles={setStyles}
                                soundDesignData={soundDesignData}
                                setSoundDesignData={setSoundDesignData}
                                castingData={castingData}
                                setCastingData={setCastingData}
                           />
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-gray-500 bg-gray-950/70 border border-gray-800 rounded-xl">
                                <p className="text-lg">Select an item on the timeline to begin.</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Timeline */}
                    <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6 space-y-4 md:space-y-6 min-h-[400px] lg:min-h-0">
                       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h3 className="text-lg md:text-xl font-semibold text-amber-400">Sequence Timeline</h3>
                            <motion.button 
                              onClick={handleGetSuggestion} 
                              disabled={isLoadingSuggestion} 
                              className="text-sm text-purple-300 hover:text-purple-200 flex items-center space-x-2 px-3 py-2 bg-purple-900/20 hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingSuggestion ? (
                                  <><div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-purple-400"/><span className="hidden sm:inline">Getting suggestion...</span></>
                                ) : (
                                  <><WandSparkles className="w-4 h-4"/><span>Dreamer Assist</span></>
                                )}
                            </motion.button>
                       </div>
                       {aiSuggestion && (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="p-4 md:p-5 bg-purple-900/50 border border-purple-800 rounded-lg"
                         >
                           <p className="text-sm text-purple-200 leading-relaxed">{aiSuggestion}</p>
                         </motion.div>
                       )}
                       <div className="flex-grow overflow-y-auto pr-2" ref={timelineContainerRef} style={{maxHeight: '60vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#374151 #1f2937'}}>
                         <Reorder.Group axis="y" values={timelineItems} onReorder={handleSetTimelineItems} className="space-y-3 md:space-y-4">
                            {timelineItems.map(item => (
                                <Reorder.Item 
                                  key={item.id} 
                                  value={item} 
                                  className={`bg-gray-800 rounded-xl border-2 shadow-lg cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                    activeTimelineItemId === item.id ? 'border-amber-500 shadow-amber-500/20 shadow-lg' : 'border-gray-800 hover:border-gray-700 hover:bg-gray-750'
                                  }`}
                                >
                                    <div className="p-4 md:p-5 flex items-start space-x-3 md:space-x-4">
                                        <GripVertical className="w-5 h-5 md:w-6 md:h-6 text-gray-600 flex-shrink-0 mt-1"/>
                                        <div className="flex-grow cursor-pointer min-w-0" onClick={() => setActiveTimelineItemId(item.id)}>
                                            <div className="flex items-center space-x-3 mb-2">
                                              {item.type === 'shot' && (
                                                <>
                                                  <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-amber-400 font-bold text-xs md:text-sm">{(item as ShotItem).data.shotNumber}</span>
                                                  </div>
                                                  <p className="font-bold text-sm md:text-base text-white truncate">Shot {(item as ShotItem).data.shotNumber}: {(item as ShotItem).data.role}</p>
                                                </>
                                              )}
                                              {item.type === 'b-roll' && (
                                                <>
                                                  <div className="w-7 h-7 md:w-8 md:h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <ImageIcon className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
                                                  </div>
                                                  <p className="font-bold text-sm md:text-base italic text-cyan-400">B-Roll</p>
                                                </>
                                              )}
                                              {item.type === 'transition' && (
                                                <>
                                                  <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Scissors className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                                                  </div>
                                                  <p className="font-bold text-sm md:text-base italic text-purple-400">Transition</p>
                                                </>
                                              )}
                                              {item.type === 'text' && (
                                                <>
                                                  <div className="w-7 h-7 md:w-8 md:h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <TypeIcon className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                                                  </div>
                                                  <p className="font-bold text-sm md:text-base italic text-green-400">Text</p>
                                                </>
                                              )}
                                            </div>
                                            <p className="text-xs md:text-sm text-gray-400 mt-2 leading-relaxed line-clamp-2">
                                                {item.type === 'shot' ? (item as ShotItem).data.description : 
                                                 item.type === 'b-roll' ? (item as BrollItem).prompt : 
                                                 item.type === 'transition' ? (item as TransitionItem).note : 
                                                 (item as TextItem).title}
                                            </p>
                                        </div>
                                        <motion.button 
                                          whileHover={{ scale: 1.1 }} 
                                          whileTap={{ scale: 0.9 }} 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} 
                                          className="ml-2 p-2 md:p-2.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-all flex-shrink-0" 
                                          title="Delete Item"
                                        >
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </motion.button>
                                    </div>
                                </Reorder.Item>
                            ))}
                         </Reorder.Group>
                       </div>
                       <div className="relative flex-shrink-0">
                           <motion.button 
                             whileHover={{scale: 1.02}} 
                             whileTap={{scale: 0.98}} 
                             onClick={() => {
                               setAddItemMenuOpen(prev => !prev);
                               // Use scroll queue system when menu opens
                               setTimeout(() => {
                                 scrollToBottom();
                               }, 50);
                             }} 
                             className="w-full py-4 px-6 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 flex items-center justify-center space-x-3 transition-all shadow-lg"
                           >
                               <Plus className="w-6 h-6"/><span className="text-base font-medium">Add to Timeline</span>
                           </motion.button>
                           <AnimatePresence>
                           {addItemMenuOpen && (
                               <motion.div 
                                 initial={{opacity:0, y: 10, scale: 0.95}} 
                                 animate={{opacity:1, y: 0, scale: 1}} 
                                 exit={{opacity:0, y: 10, scale: 0.95}}
                                 className="absolute bottom-full mb-3 w-full bg-gray-800 border border-gray-700 rounded-xl p-3 space-y-2 shadow-2xl z-10"
                               >
                                   <motion.button 
                                     whileHover={{ x: 4, backgroundColor: "rgb(55 65 81)" }}
                                     onClick={() => handleAddItem('shot')} 
                                     className="w-full text-left p-4 hover:bg-gray-700 rounded-lg flex items-center space-x-3 transition-all"
                                   >
                                     <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                       <Film className="w-5 h-5 text-amber-400" />
                                     </div>
                                     <div>
                                       <p className="font-medium text-white">New Shot</p>
                                       <p className="text-sm text-gray-400">Add a new cinematic shot</p>
                                     </div>
                                   </motion.button>
                                   <motion.button 
                                     whileHover={{ x: 4, backgroundColor: "rgb(55 65 81)" }}
                                     onClick={() => handleAddItem('b-roll')} 
                                     className="w-full text-left p-4 hover:bg-gray-700 rounded-lg flex items-center space-x-3 transition-all"
                                   >
                                     <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                       <ImageIcon className="w-5 h-5 text-cyan-400" />
                                     </div>
                                     <div>
                                       <p className="font-medium text-white">B-Roll</p>
                                       <p className="text-sm text-gray-400">Add supporting footage</p>
                                     </div>
                                   </motion.button>
                                   <motion.button 
                                     whileHover={{ x: 4, backgroundColor: "rgb(55 65 81)" }}
                                     onClick={() => handleAddItem('transition')} 
                                     className="w-full text-left p-4 hover:bg-gray-700 rounded-lg flex items-center space-x-3 transition-all"
                                   >
                                     <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                       <Scissors className="w-5 h-5 text-purple-400" />
                                     </div>
                                     <div>
                                       <p className="font-medium text-white">Transition Note</p>
                                       <p className="text-sm text-gray-400">Add a transition cue</p>
                                     </div>
                                   </motion.button>
                                   <motion.button 
                                     whileHover={{ x: 4, backgroundColor: "rgb(55 65 81)" }}
                                     onClick={() => handleAddItem('text')} 
                                     className="w-full text-left p-4 hover:bg-gray-700 rounded-lg flex items-center space-x-3 transition-all"
                                   >
                                     <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                       <TypeIcon className="w-5 h-5 text-green-400" />
                                     </div>
                                     <div>
                                       <p className="font-medium text-white">Title Card</p>
                                       <p className="text-sm text-gray-400">Add text overlay</p>
                                     </div>
                                   </motion.button>
                               </motion.div>
                           )}
                           </AnimatePresence>
                       </div>
                    </div>
                </div>
            </div>
             {showVideoPromptModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setShowVideoPromptModal(null)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold mb-4">Generate Video Prompt for Shot {showVideoPromptModal.data.shotNumber}</h3>
                        <textarea value={videoPromptInstructions} onChange={(e) => setVideoPromptInstructions(e.target.value)} placeholder="Optional: describe desired camera movement or action..." className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
                        <div className="flex space-x-2">
                             <motion.button onClick={() => setShowVideoPromptModal(null)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">Cancel</motion.button>
                             <motion.button onClick={handleGenerateVideoPrompt} className="flex-1 py-3 bg-amber-500 text-black rounded-lg">Generate</motion.button>
                        </div>
                        {generatedContent[showVideoPromptModal.id]?.videoPrompt && (
                            <div className="relative mt-4 bg-gray-800 p-3 rounded text-sm text-gray-200">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleVideoPromptCopy}
                                    className="absolute top-2 right-2 p-1 bg-gray-700 hover:bg-gray-600 rounded"
                                    title="Copy Video Prompt"
                                >
                                    {videoPromptCopied ? <Check className="w-4 h-4 text-green-400" /> : <ClipboardCopy className="w-4 h-4 text-gray-300" />}
                                </motion.button>
                                {generatedContent[showVideoPromptModal.id]?.videoPrompt}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
             )}
        </div>
    );
};

// #############################################################################################
// MAIN APP COMPONENT
// #############################################################################################

export default function App() {
    // #############################################################################################
    // STATE MANAGEMENT
    // #############################################################################################
    const [stage, setStage] = useState<Stage>('landing');
    const [promptData, setPromptData] = useState<PromptData>({
        scriptText: '', sceneCore: '', emotion: '', numberOfShots: '3', cameraType: 'Arri Alexa 65', shotTypes: '', focalLength: '35mm cinematic', depthOfField: 'f/2.8 cinematic shallow', framing: 'rule of thirds', mainCharacterBlocking: '', secondaryCharacterBlocking: '', antagonistBlocking: '', lightingStyle: 'chiaroscuro contrast', lightingDetails: '', atmosphere: '', filmStock: 'Kodak Vision3 500T 5219', filmEmulation: '', colorGrading: 'teal-orange tension', colorPalette: '', storyBeat: '', visualToneKeywords: '', continuityMode: 'tight continuity', seedLinking: 'use previous seeds', resolution: '4K render', outputType: 'cinematic frame', visualCompositionGuide: '', visualCameraSetup: '', visualLightingSetup: '', visualLightingMood: '', visualColorPalette: '', visualColorHarmony: '', visualCameraMovement: '', visualFocusMotion: ''
    });
    const [generatedPrompts, setGeneratedPrompts] = useState<ShotPrompt[]>([]);
    const [timelineItems, setTimelineItems] = useState<AnyTimelineItem[]>([]);
    const [savedConfigurations, setSavedConfigurations] = useState<SavedConfiguration[]>([]);
    const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
    const [isProcessingDoc, setIsProcessingDoc] = useState(false);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);

    // Visual State - keyed by TIMELINE ITEM ID for robustness
    const [visualPresets, setVisualPresets] = useState<VisualPreset[]>([]);
    const [compositions, setCompositions] = useState<Record<string, CompositionData>>({});
    const [lightingData, setLightingData] = useState<Record<string, LightingData>>({});
    const [colorGradingData, setColorGradingData] = useState<Record<string, ColorGradingData>>({});
    const [cameraMovement, setCameraMovement] = useState<Record<string, CameraMovementData>>({});
    const [aspectRatios, setAspectRatios] = useState<Record<string, string>>({});
    const [styles, setStyles] = useState<Record<string, 'cinematic' | 'explainer'>>({});
    
    // Sound Design & Casting State
    const [soundDesignData, setSoundDesignData] = useState<Record<string, SoundDesignData>>({});
    const [castingData, setCastingData] = useState<Record<string, CastingData>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);


    const presetFileInputRef = useRef<HTMLInputElement>(null);
    const saveInProgressRef = useRef<boolean>(false);

    // #############################################################################################
    // LIFECYCLE & PERSISTENCE
    // #############################################################################################

    // Load progress from Supabase on mount
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const progress = await loadUserProgress();
                if (progress) {
                    setCurrentQuestionIndex(progress.currentQuestionIndex);
                    setPromptData(progress.promptData);
                    setSavedConfigurations(progress.savedConfigurations);
                    setVisualPresets(progress.visualPresets);
                    
                    // Load knowledge docs (merge with preloaded)
                    const preloadedDocs: KnowledgeDocument[] = preloadedKnowledgeBase.map(doc => ({ ...doc, content: doc.content, uploadedAt: new Date('2025-01-01') }));
                    const userDocs = progress.knowledgeDocs.map((doc: any) => ({ ...doc, uploadedAt: new Date(doc.uploadedAt) }));
                    setKnowledgeDocs([...preloadedDocs, ...userDocs]);
                    
                    appLogger.info('Progress loaded from Supabase');
                } else {
                    // No saved progress, load from localStorage as fallback
                    loadFromLocalStorage();
                }
            } catch (error) {
                appLogger.error('Failed to load progress from Supabase:', error);
                // Fallback to localStorage
                loadFromLocalStorage();
            } finally {
                setIsLoadingProgress(false);
            }
        };
        
        loadProgress();
    }, []);

    // Helper function to load from localStorage with comprehensive error handling
    const loadFromLocalStorage = () => {
        appLogger.info('Loading data from localStorage...');
        try {
            // Load saved configurations
            try {
                const savedConfigs = localStorage.getItem('dreamerConfigs');
                if (savedConfigs) {
                    const parsedConfigs = JSON.parse(savedConfigs);
                    if (Array.isArray(parsedConfigs)) {
                        setSavedConfigurations(parsedConfigs);
                        appLogger.info('Loaded saved configurations:', parsedConfigs.length);
                    } else {
                        appLogger.warn('Invalid saved configurations format, using empty array');
                    }
                }
            } catch (configError) {
                appLogger.error('Failed to load saved configurations:', configError);
            }
            
            // Load knowledge documents
            try {
                const savedKnowledge = localStorage.getItem('dreamerKnowledge');
                let userDocs: KnowledgeDocument[] = [];
                if (savedKnowledge) {
                    const parsedKnowledge = JSON.parse(savedKnowledge);
                    if (Array.isArray(parsedKnowledge)) {
                        userDocs = parsedKnowledge.map((doc: any) => {
                            try {
                                return { 
                                    ...doc, 
                                    uploadedAt: new Date(doc.uploadedAt) 
                                };
                            } catch (docError) {
                                appLogger.warn('Failed to parse knowledge doc uploadedAt:', doc, docError);
                                return { ...doc, uploadedAt: new Date() };
                            }
                        });
                    }
                }
                const preloadedDocs: KnowledgeDocument[] = preloadedKnowledgeBase.map(doc => ({ ...doc, content: doc.content, uploadedAt: new Date('2025-01-01') }));
                setKnowledgeDocs([...preloadedDocs, ...userDocs]);
                appLogger.info('Loaded knowledge documents:', userDocs.length + preloadedDocs.length);
            } catch (knowledgeError) {
                appLogger.error('Failed to load knowledge documents:', knowledgeError);
            }
            
            // Load visual presets
            try {
                const savedPresets = localStorage.getItem('dreamerVisualPresets');
                if (savedPresets) {
                    const parsedPresets = JSON.parse(savedPresets);
                    if (Array.isArray(parsedPresets)) {
                        setVisualPresets(parsedPresets);
                        appLogger.info('Loaded visual presets:', parsedPresets.length);
                    } else {
                        appLogger.warn('Invalid visual presets format, using empty array');
                    }
                }
            } catch (presetError) {
                appLogger.error('Failed to load visual presets:', presetError);
            }
            
            // Load compositions
            try {
                const savedCompositions = localStorage.getItem('dreamerCompositions');
                if (savedCompositions) {
                    const parsedCompositions = JSON.parse(savedCompositions);
                    if (typeof parsedCompositions === 'object' && parsedCompositions !== null) {
                        setCompositions(parsedCompositions);
                        appLogger.info('Loaded compositions:', Object.keys(parsedCompositions).length);
                    } else {
                        appLogger.warn('Invalid compositions format, using empty object');
                    }
                }
            } catch (compositionError) {
                appLogger.error('Failed to load compositions:', compositionError);
            }
            
            // Load lighting data
            try {
                const savedLighting = localStorage.getItem('dreamerLighting');
                if (savedLighting) {
                    const parsedLighting = JSON.parse(savedLighting);
                    if (typeof parsedLighting === 'object' && parsedLighting !== null) {
                        setLightingData(parsedLighting);
                        appLogger.info('Loaded lighting data:', Object.keys(parsedLighting).length);
                    } else {
                        appLogger.warn('Invalid lighting data format, using empty object');
                    }
                }
            } catch (lightingError) {
                appLogger.error('Failed to load lighting data:', lightingError);
            }
            
            // Load color grading data
            try {
                const savedColor = localStorage.getItem('dreamerColor');
                if (savedColor) {
                    const parsedColor = JSON.parse(savedColor);
                    if (typeof parsedColor === 'object' && parsedColor !== null) {
                        setColorGradingData(parsedColor);
                        appLogger.info('Loaded color grading data:', Object.keys(parsedColor).length);
                    } else {
                        appLogger.warn('Invalid color grading data format, using empty object');
                    }
                }
            } catch (colorError) {
                appLogger.error('Failed to load color grading data:', colorError);
            }
            
            // Load camera movement data
            try {
                const savedMovement = localStorage.getItem('dreamerMovement');
                if (savedMovement) {
                    const parsedMovement = JSON.parse(savedMovement);
                    if (typeof parsedMovement === 'object' && parsedMovement !== null) {
                        setCameraMovement(parsedMovement);
                        appLogger.info('Loaded camera movement data:', Object.keys(parsedMovement).length);
                    } else {
                        appLogger.warn('Invalid camera movement data format, using empty object');
                    }
                }
            } catch (movementError) {
                appLogger.error('Failed to load camera movement data:', movementError);
            }
            
            // Load styles
            try {
                const savedStyles = localStorage.getItem('dreamerStyles');
                if (savedStyles) {
                    const parsedStyles = JSON.parse(savedStyles);
                    if (typeof parsedStyles === 'object' && parsedStyles !== null) {
                        setStyles(parsedStyles);
                        appLogger.info('Loaded styles:', Object.keys(parsedStyles).length);
                    } else {
                        appLogger.warn('Invalid styles format, using empty object');
                    }
                }
            } catch (styleError) {
                appLogger.error('Failed to load styles:', styleError);
            }
            
            appLogger.info('localStorage loading completed');
        } catch (error) { 
            appLogger.error("Critical error in loadFromLocalStorage:", error); 
        }
    };

    // Auto-save to Supabase when critical data changes with proper state locking
    useEffect(() => {
        if (!isLoadingProgress && stage === 'builder') {
            scheduleAutoSave(async () => {
                // Prevent concurrent saves using state locking
                if (saveInProgressRef.current) {
                    appLogger.debug('Auto-save skipped: save operation already in progress');
                    return;
                }
                
                saveInProgressRef.current = true;
                try {
                    await saveUserProgress({
                        currentQuestionIndex,
                        promptData,
                        knowledgeDocs: knowledgeDocs.filter(d => !d.id.startsWith('preloaded-')),
                        savedConfigurations,
                        visualPresets
                    });
                    appLogger.info('Auto-save completed successfully');
                } catch (error) {
                    appLogger.error('Auto-save failed:', error);
                } finally {
                    saveInProgressRef.current = false;
                }
            }, 3000); // Debounce 3 seconds
        }
    }, [currentQuestionIndex, promptData, savedConfigurations, visualPresets, isLoadingProgress, stage]);

    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.CONFIGS, JSON.stringify(savedConfigurations)); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Configurations' }); 
        } 
    }, [savedConfigurations]);
    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.KNOWLEDGE, JSON.stringify(knowledgeDocs.filter(d => !d.id.startsWith('preloaded-')))); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Knowledge' }); 
        } 
    }, [knowledgeDocs]);
    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.VISUAL_PRESETS, JSON.stringify(visualPresets)); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Visual Presets' }); 
        } 
    }, [visualPresets]);
    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.COMPOSITIONS, JSON.stringify(compositions)); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Compositions' }); 
        } 
    }, [compositions]);
    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.LIGHTING, JSON.stringify(lightingData)); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Lighting' }); 
        } 
    }, [lightingData]);
    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.COLOR, JSON.stringify(colorGradingData)); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Color Grading' }); 
        } 
    }, [colorGradingData]);
    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.MOVEMENT, JSON.stringify(cameraMovement)); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Camera Movement' }); 
        } 
    }, [cameraMovement]);
    useEffect(() => { 
        try { 
            localStorage.setItem(TIMING.STORAGE_PREFIXES.STYLES, JSON.stringify(styles)); 
        } catch (e) { 
            handleError(e, { showUserMessage: false, context: 'Save Styles' }); 
        } 
    }, [styles]);

    // #############################################################################################
    // HANDLERS
    // #############################################################################################

    const handleAnswer = <K extends keyof PromptData>(id: K, value: PromptData[K]) => {
        setPromptData(prev => ({ ...prev, [id]: value }));
    };

    const handleRandomAnswer = async (id: keyof PromptData, question: string) => {
        setIsGeneratingRandom(true);
        try {
            const inspiration = await getRandomInspiration(formatValue(promptData.sceneCore), question);
            handleAnswer(id, inspiration);
        } catch (error) {
            handleAIServiceError(error, 'Random Inspiration');
            // Provide a fallback inspiration
            const fallbackInspiration = "A cinematic moment filled with emotion and visual storytelling";
            handleAnswer(id, fallbackInspiration);
        } finally {
            setIsGeneratingRandom(false);
        }
    };
    
    const getValueForShot = (value: string | string[] | undefined, shotIndex: number): string => {
        if (!value) return '';
        if (Array.isArray(value)) {
          const validValues = value.filter(v => v && v.trim());
          if (validValues.length === 0) return '';
          return validValues[shotIndex % validValues.length] || '';
        }
        return value;
    };

    const analyzeScript = (script: string, totalShots: number): string[] => {
        if (!script || script.trim().length === 0) return [];
        const segments = script.split(/\n\n+/).map(segment => segment.trim()).filter(Boolean);
        if (segments.length === 0) return [];
        const scenesPerShot = Math.max(1, Math.ceil(segments.length / totalShots));
        const shotScenes: string[] = [];
        for (let i = 0; i < totalShots; i++) {
          const startIndex = i * scenesPerShot;
          const endIndex = Math.min(startIndex + scenesPerShot, segments.length);
          shotScenes.push(segments.slice(startIndex, endIndex).join(' ') || segments[i] || '');
        }
        return shotScenes;
    };

    const generatePrompt = async () => {
        try {
            const numberOfShots = parseInt(formatValue(promptData.numberOfShots)) || 3;
            const shotTypeArray = (formatValue(promptData.shotTypes) || 'medium shot, close up, wide shot').split(',').map(s => s.trim());
            const shotScenes = promptData.scriptText ? analyzeScript(promptData.scriptText, numberOfShots) : [];
            
            const newShotItems: ShotItem[] = [];
            for (let i = 0; i < numberOfShots; i++) {
                const newItemId = crypto.randomUUID();
                const shotPrompt: ShotPrompt = {
                    shotNumber: i + 1,
                    prompt: `Placeholder for Shot ${i+1}`,
                    originalPrompt: `Placeholder for Shot ${i+1}`,
                    description: shotScenes[i] || getValueForShot(promptData.sceneCore, i),
                    role: shotTypeArray[i % shotTypeArray.length]
                };
                newShotItems.push({ id: newItemId, type: 'shot', data: shotPrompt });
            }
            
            const updates: { comp: Record<string, CompositionData>, light: Record<string, LightingData>, color: Record<string, ColorGradingData>, move: Record<string, CameraMovementData> } = { comp: {}, light: {}, color: {}, move: {} };
            newShotItems.forEach(item => {
                updates.comp[item.id] = clone(defaultComposition);
                updates.light[item.id] = clone(defaultLighting);
                updates.color[item.id] = clone(defaultColorGrading);
                updates.move[item.id] = clone(defaultCameraMovement);
            });
            setCompositions(prev => ({ ...prev, ...updates.comp }));
            setLightingData(prev => ({ ...prev, ...updates.light }));
            setColorGradingData(prev => ({ ...prev, ...updates.color }));
            setCameraMovement(prev => ({ ...prev, ...updates.move }));

            try {
                const finalItems = await Promise.all(newShotItems.map(async (item) => {
                    try {
                        const smartDesc = await generateSmartVisualDescription({
                            composition: updates.comp[item.id],
                            lighting: updates.light[item.id],
                            color: updates.color[item.id],
                            camera: updates.move[item.id],
                        });
                        const prompt = `Cinematic shot ${item.data.shotNumber}: ${item.data.role}. Scene: ${item.data.description}. ${smartDesc}`;
                        return { ...item, data: { ...item.data, prompt, originalPrompt: prompt } };
                    } catch (itemError) {
                        appLogger.error(`Failed to generate smart description for shot ${item.data.shotNumber}:`, itemError);
                        // Provide fallback description
                        const fallbackPrompt = `Cinematic shot ${item.data.shotNumber}: ${item.data.role}. Scene: ${item.data.description}. A visually compelling scene with cinematic composition and lighting.`;
                        return { ...item, data: { ...item.data, prompt: fallbackPrompt, originalPrompt: fallbackPrompt } };
                    }
                }));

                setTimelineItems(finalItems);
                setStage('final');
            } catch (promiseError) {
                appLogger.error('Failed to generate visual descriptions:', promiseError);
                // Still proceed with basic shot items
                setTimelineItems(newShotItems);
                setStage('final');
            }
        } catch (error) {
            handleError(error, { showUserMessage: true, context: 'Prompt Generation' });
        }
    };

    const saveConfiguration = (name: string) => setSavedConfigurations(prev => [{ id: Date.now().toString(), name, data: promptData, savedAt: Date.now() }, ...prev]);
    const loadConfiguration = (config: SavedConfiguration) => { setPromptData(config.data); setStage('builder'); };
    const deleteConfiguration = (id: string) => setSavedConfigurations(prev => prev.filter(c => c.id !== id));
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        
        // Comprehensive file validation
        const allowedTypes = ['text/plain', 'text/markdown', 'application/json', 'application/pdf'];
        const allowedExtensions = ['.txt', '.md', '.json', '.pdf'];
        const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
        const newDocs: KnowledgeDocument[] = [];
        const errors: string[] = [];
        
        setIsProcessingDoc(true);
        
        try {
            for (const file of Array.from(event.target.files)) {
                // Validate file extension
                const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                if (!allowedExtensions.includes(fileExtension)) {
                    errors.push(`File "${file.name}": Unsupported file type. Allowed types: ${allowedExtensions.join(', ')}`);
                    continue;
                }
                
                // Validate file size
                if (file.size > maxFileSize) {
                    const validationError = validateFile(file, maxFileSize, allowedTypes);
                    if (validationError) {
                        errors.push(validationError.message);
                    }
                    continue;
                }
                
                // Validate MIME type
                if (!allowedTypes.includes(file.type) && file.type !== '') {
                    const validationError = validateFile(file, maxFileSize, allowedTypes);
                    if (validationError) {
                        errors.push(validationError.message);
                    }
                    continue;
                }
                
                try {
                    // Read file content
                    const content = await file.text();
                    
                    // Basic content sanitization
                    const sanitizedContent = content
                        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
                        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
                        .replace(/javascript:/gi, '') // Remove javascript: protocols
                        .substring(0, 500000); // Limit content length
                    
                    const knowledge = await extractKnowledge(sanitizedContent);
                    newDocs.push({ 
                        id: crypto.randomUUID(), 
                        name: file.name, 
                        content: sanitizedContent, 
                        uploadedAt: new Date(), 
                        extractedKnowledge: knowledge || undefined 
                    });
                } catch (contentError) {
                    errors.push(`File "${file.name}": Failed to read file content`);
                }
            }
            
            // Display errors if any
            if (errors.length > 0) {
                appLogger.warn('File upload validation errors:', errors);
                alert(`Some files could not be uploaded:\n${errors.join('\n')}`);
            }
            
            // Only add successfully processed documents
            if (newDocs.length > 0) {
                setKnowledgeDocs(prev => [...prev, ...newDocs]);
            }
        } finally {
            setIsProcessingDoc(false);
        }
    };
    const deleteKnowledgeDoc = (id: string) => setKnowledgeDocs(prev => prev.filter(doc => doc.id !== id));

    const savePreset = (name: string, timelineItemId: string) => {
        const newPreset: VisualPreset = {
            id: crypto.randomUUID(), name, createdAt: Date.now(),
            composition: compositions[timelineItemId] || defaultComposition,
            lighting: lightingData[timelineItemId] || defaultLighting,
            color: colorGradingData[timelineItemId] || defaultColorGrading,
            camera: cameraMovement[timelineItemId] || defaultCameraMovement,
        };
        setVisualPresets(prev => [newPreset, ...prev]);
    };
    // Runtime type validation for VisualPreset
    const validateVisualPreset = (preset: any): preset is VisualPreset => {
        if (!preset || typeof preset !== 'object') return false;
        
        // Check required properties exist
        if (!preset.composition || !preset.lighting || !preset.color || !preset.camera) return false;
        
        // Validate composition structure
        const composition = preset.composition;
        if (!Array.isArray(composition.characters) || 
            typeof composition.cameraAngle !== 'string' || 
            typeof composition.cameraHeight !== 'string') {
            return false;
        }
        
        // Validate lighting structure
        const lighting = preset.lighting;
        if (typeof lighting.keyLightIntensity !== 'number' ||
            typeof lighting.mood !== 'string' ||
            typeof lighting.colorTemperature !== 'number') {
            return false;
        }
        
        // Validate color grading structure
        const color = preset.color;
        if (typeof color.colorGrade !== 'string' ||
            typeof color.saturation !== 'number' ||
            !Array.isArray(color.colorPalette)) {
            return false;
        }
        
        // Validate camera movement structure
        const camera = preset.camera;
        if (typeof camera.movementType !== 'string' ||
            typeof camera.duration !== 'number' ||
            typeof camera.startPos !== 'object' ||
            typeof camera.endPos !== 'object') {
            return false;
        }
        
        return true;
    };
    
    const applyPresetToItem = (preset: VisualPreset, timelineItemId: string) => {
        // Runtime type validation before applying
        if (!validateVisualPreset(preset)) {
            appLogger.error('Invalid preset structure:', preset);
            alert('Error: Invalid preset data structure. Please check the preset file.');
            return;
        }
        
        try {
            setCompositions(prev => ({ ...prev, [timelineItemId]: clone(preset.composition) }));
            setLightingData(prev => ({ ...prev, [timelineItemId]: clone(preset.lighting) }));
            setColorGradingData(prev => ({ ...prev, [timelineItemId]: clone(preset.color) }));
            setCameraMovement(prev => ({ ...prev, [timelineItemId]: clone(preset.camera) }));
            appLogger.info('Preset applied successfully to timeline item:', timelineItemId);
        } catch (error) {
            appLogger.error('Failed to apply preset:', error);
            alert('Error: Failed to apply preset. Please try again.');
        }
    };
    const deletePreset = (id: string) => setVisualPresets(prev => prev.filter(p => p.id !== id));
    const exportPreset = (preset: VisualPreset) => { const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${preset.name.replace(/\s+/g, '-')}.json`; a.click(); URL.revokeObjectURL(url); };
    const triggerPresetImport = () => presetFileInputRef.current?.click();
    const handlePresetImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return;
        try { const text = await file.text(); const parsed = JSON.parse(text); if (!parsed.name || !parsed.composition) throw new Error("Invalid preset"); setVisualPresets(prev => [{...parsed, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev]); } catch (e) { alert("Failed to import preset."); }
    };
    
    const onStartBuilder = (idea: string) => { setPromptData(prev => ({...prev, sceneCore: idea || prev.sceneCore })); setCurrentQuestionIndex(0); setStage('builder'); };
    const onStartStoryboard = (script: string) => { setPromptData(prev => ({...prev, scriptText: script })); setStage('storyboard'); };
    const onGenerateStory = async (idea: string) => {
        if (!idea || idea.trim().length === 0) {
            alert('Please enter an idea to generate a story.');
            return;
        }

        setIsGeneratingStory(true);
        try {
            const scenes = await generateStoryFromIdea(idea);
            if (scenes && scenes.length > 0) {
                setPromptData(prev => ({
                    ...prev, 
                    scriptText: scenes.join('\n\n'), 
                    sceneCore: scenes[0]
                }));
                setCurrentQuestionIndex(0);
                setStage('builder');
            } else {
                appLogger.warn('No scenes generated from idea');
                alert('No story could be generated from the provided idea. Please try a different concept.');
            }
        } catch (error) {
            handleError(error, { showUserMessage: true, context: 'Story Generation' });
        } finally {
            setIsGeneratingStory(false);
        }
    };
    const onBackToHome = () => { setStage('landing'); };
    
    // Fix: Added a trailing comma to the generic type parameter <T> to resolve TSX parsing ambiguity.
    const updateVisuals = <T,>(id: string, dataType: 'compositions' | 'lightingData' | 'colorGradingData' | 'cameraMovement', data: T) => {
        if (dataType === 'compositions') setCompositions(prev => ({ ...prev, [id]: data as CompositionData }));
        else if (dataType === 'lightingData') setLightingData(prev => ({ ...prev, [id]: data as LightingData }));
        else if (dataType === 'colorGradingData') setColorGradingData(prev => ({ ...prev, [id]: data as ColorGradingData }));
        else if (dataType === 'cameraMovement') setCameraMovement(prev => ({ ...prev, [id]: data as CameraMovementData }));
    };

    const updatePromptFromVisualsLogic = async (timelineItemId: string) => {
        try {
            const item = timelineItems.find(i => i.id === timelineItemId);
            if (!item || item.type !== 'shot') return;

            const visualData = {
                composition: compositions[timelineItemId] || defaultComposition,
                lighting: lightingData[timelineItemId] || defaultLighting,
                color: colorGradingData[timelineItemId] || defaultColorGrading,
                camera: cameraMovement[timelineItemId] || defaultCameraMovement,
            };

            try {
                const smartDesc = await generateSmartVisualDescription(visualData);
                const newPrompt = `Cinematic shot ${item.data.shotNumber}: ${item.data.role}. Scene: ${item.data.description}. ${smartDesc}`;
                
                setTimelineItems(prev => prev.map(i => i.id === timelineItemId && i.type === 'shot' ? {...i, data: {...i.data, prompt: newPrompt }} : i));
            } catch (aiError) {
                appLogger.error('Failed to generate smart visual description:', aiError);
                // Provide fallback prompt without AI enhancement
                const fallbackPrompt = `Cinematic shot ${item.data.shotNumber}: ${item.data.role}. Scene: ${item.data.description}. A visually compelling scene with cinematic composition and professional lighting.`;
                setTimelineItems(prev => prev.map(i => i.id === timelineItemId && i.type === 'shot' ? {...i, data: {...i.data, prompt: fallbackPrompt }} : i));
            }
        } catch (error) {
            appLogger.error('Failed to update prompt from visuals:', error);
        }
    };
    
    const deleteTimelineItem = (id: string) => {
        setTimelineItems(prev => prev.filter(item => item.id !== id));
        const cleanup = (setter: React.Dispatch<React.SetStateAction<Record<string, any>>>) => {
            setter(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        };
        cleanup(setCompositions);
        cleanup(setLightingData);
        cleanup(setColorGradingData);
        cleanup(setCameraMovement);
        cleanup(setAspectRatios);
        cleanup(setStyles);
    };

    // #############################################################################################
    // RENDER LOGIC
    // #############################################################################################

    if (stage === 'landing') {
        return <ErrorBoundary><LandingPage onStartBuilder={onStartBuilder} onStartStoryboard={onStartStoryboard} onGenerateStory={onGenerateStory} isGenerating={isGeneratingStory} /></ErrorBoundary>;
    }
    if (stage === 'builder') {
        return <ErrorBoundary><BuilderPage 
            promptData={promptData}
            handleAnswer={handleAnswer}
            handleRandomAnswer={handleRandomAnswer}
            isGeneratingRandom={isGeneratingRandom}
            generatePrompt={generatePrompt}
            savedConfigurations={savedConfigurations}
            knowledgeDocs={knowledgeDocs}
            saveConfiguration={saveConfiguration}
            loadConfiguration={loadConfiguration}
            deleteConfiguration={deleteConfiguration}
            deleteKnowledgeDoc={deleteKnowledgeDoc}
            handleFileUpload={handleFileUpload}
            isProcessingDoc={isProcessingDoc}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            onBackToHome={onBackToHome}
        /></ErrorBoundary>;
    }
    if (stage === 'storyboard') {
        return <ErrorBoundary><StoryboardPage 
            setStage={setStage}
            setGeneratedPrompts={setGeneratedPrompts}
            scriptText={promptData.scriptText || ''}
            setTimelineItems={setTimelineItems}
            setCompositions={setCompositions}
            setLightingData={setLightingData}
            setColorGradingData={setColorGradingData}
            setCameraMovement={setCameraMovement}
        /></ErrorBoundary>;
    }
    if (stage === 'final') {
        return <ErrorBoundary><VisualSequenceEditor 
            timelineItems={timelineItems}
            setTimelineItems={setTimelineItems}
            promptData={promptData}
            setStage={setStage}
            visualPresets={visualPresets}
            savePreset={savePreset}
            applyPresetToItem={applyPresetToItem}
            deletePreset={deletePreset}
            exportPreset={exportPreset}
            triggerPresetImport={triggerPresetImport}
            handlePresetImport={handlePresetImport}
            presetFileInputRef={presetFileInputRef}
            compositions={compositions}
            lightingData={lightingData}
            colorGradingData={colorGradingData}
            cameraMovement={cameraMovement}
            updateVisuals={updateVisuals}
            updatePromptFromVisuals={updatePromptFromVisualsLogic}
            aspectRatios={aspectRatios}
            setAspectRatios={setAspectRatios}
            styles={styles}
            setStyles={setStyles}
            soundDesignData={soundDesignData}
            setSoundDesignData={setSoundDesignData}
            castingData={castingData}
            setCastingData={setCastingData}
            deleteTimelineItem={deleteTimelineItem}
            showCollaboration={false}
            setShowCollaboration={() => {}}
        />;
    }
    
    return null; // Fallback - should not reach here
}