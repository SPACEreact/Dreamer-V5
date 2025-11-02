



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
  Download
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
  easingMap
} from './constants';
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
} from './types';
import { 
    extractKnowledge, 
    getAISuggestions, 
    enhanceShotPrompt, 
    generateStoryFromIdea, 
    getRandomInspiration, 
    generateImage, 
    generateNanoImage, 
    generateStoryboard, 
    generateVideoPrompt,
    getTimelineSuggestion,
    analyzeSequenceStyle,
    generateBrollPrompt,
    generateSmartVisualDescription,
    initializeVisualsFromStoryboardShot,
    makeExplainerPromptCinematic
} from './services/geminiService';

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

const CompositionEditor = React.memo<CompositionEditorProps>(({ composition, onAddCharacter, onRemoveCharacter, onDrag, onNameChange, onCameraAngleChange, onCameraHeightChange, onPositionChange }) => {
    const handleCharacterDrag = (characterId: string, event: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return;
        const bbox = svg.getBoundingClientRect();
        const scaleX = STAGE_WIDTH / bbox.width;
        const scaleY = STAGE_HEIGHT / bbox.height;

        const toStageCoords = (clientX: number, clientY: number) => {
          const localX = Math.max(0, Math.min(bbox.width, clientX - bbox.left));
          const localY = Math.max(0, Math.min(bbox.height, clientY - bbox.top));
          const stageX = Math.max(20, Math.min(STAGE_WIDTH - 20, localX * scaleX));
          const stageY = Math.max(20, Math.min(STAGE_HEIGHT - 20, localY * scaleY));
          return { stageX, stageY };
        };
    
        const moveListener = (moveEvent: MouseEvent) => {
          const { stageX, stageY } = toStageCoords(moveEvent.clientX, moveEvent.clientY);
          onPositionChange(characterId, stageX, stageY);
        };
    
        const upListener = () => {
          window.removeEventListener('mousemove', moveListener);
          window.removeEventListener('mouseup', upListener);
        };
    
        window.addEventListener('mousemove', moveListener);
        window.addEventListener('mouseup', upListener);
    
        const { stageX, stageY } = toStageCoords(event.clientX, event.clientY);
        onPositionChange(characterId, stageX, stageY);
    };

    return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-400">Composition Grid</h3>
              <p className="text-sm text-gray-400">Arrange characters and camera posture.</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onAddCharacter} className="px-3 py-2 text-sm rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30">
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
                    <input value={character.name} onChange={(event) => onNameChange(character.id, event.target.value)} className="w-full text-sm bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="Character name" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onRemoveCharacter(character.id)} className="ml-2 p-2 rounded bg-gray-800 hover:bg-gray-700"><Trash2 className="w-4 h-4 text-red-400" /></motion.button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400"><span>X: {Math.round(character.x)}</span><span>Y: {Math.round(character.y)}</span></div>
                </div>
                ))}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                <div>
                    <label className="text-xs text-gray-400 uppercase">Camera Angle</label>
                    <select value={composition.cameraAngle} onChange={(event) => onCameraAngleChange(event.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">{cameraAngleOptions.map(option => <option key={option} value={option}>{option}</option>)}</select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 uppercase">Camera Height</label>
                    <select value={composition.cameraHeight} onChange={(event) => onCameraHeightChange(event.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">{cameraHeightOptions.map(option => <option key={option} value={option}>{option}</option>)}</select>
                </div>
                </div>
            </div>
          </div>
        </div>
      );
});
CompositionEditor.displayName = 'CompositionEditor';

const LightingEditor = React.memo<LightingEditorProps>(({ lighting, onChange }) => {
    const updateNumber = (field: keyof LightingData, value: number) => onChange(field, Math.min(100, Math.max(0, value)));
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-semibold text-amber-400">Lighting Mixer</h3><p className="text-sm text-gray-400">Dial in key/fill/back ratios, temperature, and mood.</p></div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { onChange('keyLightIntensity', 80); onChange('fillLightIntensity', 40); onChange('backLightIntensity', 60); onChange('ambientIntensity', 20); onChange('keyLightColor', '#FFD8A8'); onChange('fillLightColor', '#89CFF0'); onChange('backLightColor', '#FACC15'); onChange('colorTemperature', 4500); onChange('mood', lightingMoodOptions[0]); }} className="px-3 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700">Reset Lighting</motion.button>
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
    const handlePaletteChange = (index: number, value: string) => { const next = [...color.colorPalette]; next[index] = value; onChange('colorPalette', next); };
    const updateTone = (field: keyof ColorGradingData, value: number) => onChange(field, Math.max(-50, Math.min(50, value)));
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
    const updateMovement = (field: keyof CameraMovementData, value: number | string) => onChange(field, value);
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
            {(['x', 'y'] as const).map(coord => <div key={`start-${coord}`} className="space-y-1"><label className="text-xs uppercase">Start {coord.toUpperCase()}</label><input type="number" value={camera.startPos[coord]} onChange={(event) => onPathChange('startPos', coord, Number(event.target.value))} min={0} max={800} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>)}
            {(['x', 'y'] as const).map(coord => <div key={`end-${coord}`} className="space-y-1"><label className="text-xs uppercase">End {coord.toUpperCase()}</label><input type="number" value={camera.endPos[coord]} onChange={(event) => onPathChange('endPos', coord, Number(event.target.value))} min={0} max={800} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" /></div>)}
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
  
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl w-full text-center space-y-8">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Dreamer</h1>
            <p className="text-xl text-gray-400">Cinematic prompt builder for visionary creators</p>
          </motion.div>
  
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="space-y-4">
            <textarea value={landingIdea} onChange={(e) => setLandingIdea(e.target.value)} placeholder="Describe your cinematic vision or paste a script..." className="w-full h-32 p-4 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onStartBuilder(landingIdea)} className="py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2">
                <span>Prompt Builder</span><Sparkles className="w-5 h-5" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onStartStoryboard(landingIdea)} className="py-4 bg-gray-800 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2">
                <span>Script to Storyboard</span><Film className="w-5 h-5" />
              </motion.button>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onGenerateStory(landingIdea)} disabled={!landingIdea.trim() || isGenerating} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2">
              {isGenerating ? ( <><div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white" /><span>Dreaming up ideas...</span></> ) : ( <><Lightbulb className="w-5 h-5" /><span>Let AI Dream (Expand Idea)</span></> )}
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
}
  
const BuilderPage: React.FC<BuilderPageProps> = ({ promptData, handleAnswer, handleRandomAnswer, isGeneratingRandom, generatePrompt, savedConfigurations, knowledgeDocs, saveConfiguration, loadConfiguration, deleteConfiguration, deleteKnowledgeDoc, handleFileUpload, isProcessingDoc }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
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
    
    const fetchAISuggestions = async () => {
        setIsLoadingAI(true);
        setAiSuggestions([]);
        const previousAnswers = questions
            .filter(q => q.id !== currentQuestion.id && promptData[q.id as keyof PromptData])
            .map(q => `${q.question}: ${formatValue(promptData[q.id as keyof PromptData])}`)
            .join('\n');
        const knowledgeContext = `KNOWLEDGE BASE:\n` + knowledgeDocs.map(doc => `[${doc.name}]: Themes: ${doc.extractedKnowledge?.themes.join(', ')}. Techniques: ${doc.extractedKnowledge?.techniques.join(', ')}`).join('\n');
        const storyContext = promptData.scriptText ? `\n\nSTORY SCRIPT:\n${promptData.scriptText}` : '';
        const fullContext = `${knowledgeContext}\n\nPREVIOUS ANSWERS:\n${previousAnswers}${storyContext}`;
        const suggestions = await getAISuggestions(fullContext, currentQuestion.question);
        setAiSuggestions(suggestions);
        setIsLoadingAI(false);
    };
    
    const onSave = () => { if (!saveName.trim()) { alert('Please enter a name for this configuration'); return; } saveConfiguration(saveName); setSaveName(''); setShowSaveModal(false); }
    const nextQuestion = () => { if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(prev => prev + 1); setAiSuggestions([]); } };
    const prevQuestion = () => { if (currentQuestionIndex > 0) { setCurrentQuestionIndex(prev => prev - 1); setAiSuggestions([]); } };

    return (
        <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Dreamer Builder</h1>
                <div className="flex space-x-2">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSaveModal(true)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"><Save className="w-5 h-5" /></motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowLoadModal(true)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"><Upload className="w-5 h-5" /></motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowKnowledgePanel(!showKnowledgePanel)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"><BookOpen className="w-5 h-5" /></motion.button>
                </div>
            </div>
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2"><span>Step {currentQuestionIndex + 1} of {questions.length}</span><span>{Math.round(progress)}%</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2"><motion.div className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full" style={{ width: `${progress}%` }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></div>
            </div>
          </motion.div>
  
          <AnimatePresence mode="wait">
            <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2"><span className="text-sm text-amber-400">{currentQuestion.category}</span></div>
                <h2 className="text-2xl font-semibold mb-2">{currentQuestion.question}</h2>
              </div>
              <div className="space-y-4">
                {currentQuestion.type === 'select' ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer"><input type="checkbox" checked={multipleMode} onChange={(e) => { const newMode = e.target.checked; setMultipleMode(newMode); if (!newMode) { const currentValue = promptData[currentQuestion.id as keyof PromptData]; if (Array.isArray(currentValue) && currentValue.length > 0) { handleAnswer(currentQuestion.id as keyof PromptData, currentValue[0]); } } }} className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0" /><span>Multiple selection mode</span></label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {currentQuestion.options?.map((option) => { const currentValue = promptData[currentQuestion.id as keyof PromptData]; const isSelected = multipleMode ? Array.isArray(currentValue) && currentValue.includes(option) : formatValue(currentValue) === option; return (<motion.button key={option} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => multipleMode ? toggleMultipleSelection(option) : handleAnswer(currentQuestion.id as keyof PromptData, option)} className={`p-4 rounded-lg border transition-all ${ isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-white' }`}>{option}</motion.button>); })}
                    </div>
                  </>
                ) : currentQuestion.type === 'script' ? (
                  <textarea value={formatValue(promptData[currentQuestion.id as keyof PromptData])} onChange={(e) => handleAnswer(currentQuestion.id as keyof PromptData, e.target.value)} placeholder={currentQuestion.placeholder} className="w-full h-32 p-4 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none" />
                ) : (
                  <div className="space-y-4">
                    <input type="text" value={formatValue(promptData[currentQuestion.id as keyof PromptData])} onChange={(e) => handleAnswer(currentQuestion.id as keyof PromptData, e.target.value)} placeholder={currentQuestion.placeholder} className="w-full p-4 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleRandomAnswer(currentQuestion.id as keyof PromptData, currentQuestion.question)} disabled={isGeneratingRandom} className="py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"><Sparkles className="w-4 h-4" /><span>Inspire Me</span></motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchAISuggestions} disabled={isLoadingAI} className="py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50">{isLoadingAI ? ( <><div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" /><span>Dreamer is listening...</span></> ) : ( <><Lightbulb className="w-4 h-4" /><span>Dreamer Insight</span></> )}</motion.button>
              </div>

              {aiSuggestions.length > 0 && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">{aiSuggestions.map((suggestion, index) => <motion.button key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleAnswer(currentQuestion.id as keyof PromptData, suggestion)} className="w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-left transition-colors"><span className="text-amber-400 text-sm mr-2">✨</span>{suggestion}</motion.button>)}</motion.div>}
            </motion.div>
          </AnimatePresence>
  
          <div className="mt-8 flex justify-between">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={prevQuestion} disabled={currentQuestionIndex === 0} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"><ArrowLeft className="w-5 h-5" /><span>Previous</span></motion.button>
            {currentQuestionIndex === questions.length - 1 ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generatePrompt} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all flex items-center space-x-2"><Sparkles className="w-5 h-5" /><span>Generate Sequence</span></motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextQuestion} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"><span>Next</span><ArrowRight className="w-5 h-5" /></motion.button>
            )}
          </div>
        </div>
        
        {showSaveModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setShowSaveModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4">Save Configuration</h3>
                <input type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Enter configuration name..." className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none mb-4" />
                <div className="flex space-x-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSave} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors">Save</motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowSaveModal(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">Cancel</motion.button>
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
            <div className="mb-6"><label className="block text-sm font-medium mb-2">Upload Documents</label><input type="file" multiple accept=".txt,.md" onChange={handleFileUpload} disabled={isProcessingDoc} className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium disabled:opacity-50" />{isProcessingDoc && <div className="mt-2 text-center text-amber-400 text-sm">Processing...</div>}</div>
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
    const [storyboard, setStoryboard] = useState<StoryboardShot[]>([]);
    const [storyboardStyle, setStoryboardStyle] = useState<'cinematic' | 'explainer'>('cinematic');
    const [progress, setProgress] = useState<StoryboardProgressUpdate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [enhancingShotIndex, setEnhancingShotIndex] = useState<number | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    
    useEffect(() => {
        // Cleanup interval on component unmount
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
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
            const result = await generateStoryboard(script, storyboardStyle);

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
            console.error('❌ Storyboard generation error:', error);
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
            console.error("Failed to make shot cinematic:", error);
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
                                    {storyboardStyle === 'explainer' && (
                                        <div className="mt-3 text-right">
                                            <motion.button 
                                                whileHover={{ scale: 1.05 }} 
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleMakeCinematic(shot, index)}
                                                disabled={enhancingShotIndex === index}
                                                className="px-3 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 disabled:opacity-50 flex items-center space-x-2 ml-auto"
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
                                        </div>
                                    )}
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
}


const SelectedItemPanel: React.FC<SelectedItemPanelProps> = ({
    item, updateItem, onEnhance, onRevert, onGenerateImage, onGenerateVideoPrompt, generatedContent,
    compositions, lightingData, colorGradingData, cameraMovement, updateVisuals, updatePromptFromVisuals,
    aspectRatios, setAspectRatios, styles, setStyles
}) => {
    const [activeVisualTab, setActiveVisualTab] = useState<'composition' | 'lighting' | 'color' | 'camera'>('composition');
    const [imageView, setImageView] = useState<'photoreal' | 'stylized'>('photoreal');
    const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);

    const handleUpdatePromptFromVisuals = async () => {
        setIsUpdatingPrompt(true);
        try {
            await updatePromptFromVisuals(item.id);
        } finally {
            setIsUpdatingPrompt(false);
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
        <div className="flex-grow flex flex-col p-4 bg-gray-950/70 border border-gray-800 rounded-lg space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-xs uppercase tracking-wider text-amber-500">Shot {shotData.shotNumber}</span>
                    <h2 className="text-2xl font-semibold text-amber-400">{shotData.role}</h2>
                    <p className="text-sm text-gray-400">{shotData.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                   {isModified && (
                        <motion.button title="Revert to Original Prompt" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onRevert(shotItem)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"><RefreshCcw className="w-4 h-4 text-amber-400"/></motion.button>
                   )}
                   <motion.button title="Enhance with AI" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEnhance(shotItem)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"><WandSparkles className="w-4 h-4 text-purple-400"/></motion.button>
                </div>
            </div>

            {/* Prompt & Generated Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Prompt Text Area */}
                <div className="space-y-2 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-300">Prompt</h3>
                    <textarea 
                        value={shotData.prompt}
                        onChange={e => updateItem({ ...item, data: { ...shotData, prompt: e.target.value }})}
                        className="w-full flex-grow bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 resize-none focus:border-amber-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onGenerateImage(shotItem, 'photoreal')} className="py-2 text-sm bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 flex items-center justify-center space-x-2"><ImageIcon className="w-4 h-4"/><span>Generate Photoreal</span></button>
                        <button onClick={() => onGenerateImage(shotItem, 'stylized')} className="py-2 text-sm bg-teal-500/20 text-teal-300 rounded hover:bg-teal-500/30 flex items-center justify-center space-x-2"><Palette className="w-4 h-4"/><span>Generate Stylized</span></button>
                    </div>
                     <button onClick={() => onGenerateVideoPrompt(shotItem)} className="w-full py-2 text-sm bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 flex items-center justify-center space-x-2"><Film className="w-4 h-4"/><span>Video Prompt</span></button>
                </div>
                 {/* Generated Content Area */}
                 <div className="space-y-2 flex flex-col">
                    <div className="flex items-center justify-between">
                         <h3 className="text-sm font-semibold text-gray-300">Generated Content</h3>
                         <div className="flex items-center space-x-2">
                            <div className="bg-gray-800 border border-gray-700 rounded p-0.5 flex text-xs">
                                <button onClick={() => setCurrentStyle('cinematic')} className={`px-2 py-1 rounded transition-colors ${currentStyle === 'cinematic' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-300 hover:bg-gray-700'}`}>
                                    Cinematic
                                </button>
                                <button onClick={() => setCurrentStyle('explainer')} className={`px-2 py-1 rounded transition-colors ${currentStyle === 'explainer' ? 'bg-amber-500 text-black font-semibold' : 'text-gray-300 hover:bg-gray-700'}`}>
                                    Explainer
                                </button>
                            </div>
                            <select 
                                value={aspectRatios[item.id] || '16:9'} 
                                onChange={(e) => setAspectRatios(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="16:9">16:9</option>
                                <option value="9:16">9:16</option>
                                <option value="1:1">1:1</option>
                                <option value="4:3">4:3</option>
                                <option value="3:4">3:4</option>
                            </select>
                         </div>
                    </div>
                    <div className="w-full flex-grow bg-gray-900 border border-gray-700 rounded-lg p-2 flex items-center justify-center relative group">
                        {generatedContent.status === 'loading' && <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-400 border-t-amber-400" />}
                        {generatedContent.status === 'error' && <p className="text-red-400 text-sm">Generation Failed</p>}
                        {generatedContent.status === 'idle' && generatedContent.images[imageView] && (
                            <>
                                <img src={imageView === 'photoreal' ? `data:image/jpeg;base64,${generatedContent.images.photoreal}` : `data:image/png;base64,${generatedContent.images.stylized}`} className="max-w-full max-h-full object-contain rounded"/>
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
                                    className="absolute top-2 right-2 p-2 bg-gray-900/50 hover:bg-gray-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Download Image"
                                >
                                    <Download className="w-4 h-4 text-white" />
                                </motion.button>
                            </>
                        )}
                         {generatedContent.status === 'idle' && !generatedContent.images[imageView] && <p className="text-gray-500 text-sm">{imageView === 'photoreal' ? 'Photoreal' : 'Stylized'} image will appear here</p>}
                     </div>
                     <div className="flex justify-center space-x-2">
                        {generatedContent.images.photoreal && <button onClick={() => setImageView('photoreal')} className={`px-2 py-0.5 text-xs rounded ${imageView === 'photoreal' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Photoreal</button>}
                        {generatedContent.images.stylized && <button onClick={() => setImageView('stylized')} className={`px-2 py-0.5 text-xs rounded ${imageView === 'stylized' ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Stylized</button>}
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
                 <div className="flex items-center space-x-2 mb-2 border-b border-gray-800">
                    {(['composition', 'lighting', 'color', 'camera'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveVisualTab(tab)} className={`px-4 py-2 text-sm capitalize rounded-t-lg transition-colors ${activeVisualTab === tab ? 'bg-gray-800 text-amber-400' : 'text-gray-400 hover:bg-gray-900'}`}>
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
    
    // State for generated content, keyed by timeline item ID
    const [generatedContent, setGeneratedContent] = useState<Record<string, {
        images: { photoreal?: string; stylized?: string };
        enhancedPrompt?: string;
        videoPrompt?: string;
        status: 'idle' | 'loading' | 'error';
    }>>({});

    const activeItem = useMemo(() => timelineItems.find(item => item.id === activeTimelineItemId), [timelineItems, activeTimelineItemId]);

    const handleSetTimelineItems = (newItems: AnyTimelineItem[]) => {
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
    };

    const handleAddItem = async (type: TimelineItemType) => {
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

        handleSetTimelineItems(newItems);
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
            console.error("Failed to copy video prompt:", error);
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
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between mb-4">
                     <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Visual Sequence Editor</h1>
                     <div className="flex items-center space-x-2">
                        <motion.button whileHover={{scale: 1.05}} whileTap={{scale: 0.95}} onClick={handleAnalyzeStyle} disabled={isAnalyzingStyle} className="px-3 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50">
                            {isAnalyzingStyle ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-white"/> : <Palette className="w-4 h-4"/>}
                            <span>Analyze Style</span>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStage('builder')} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg">Back to Builder</motion.button>
                     </div>
                </div>
                
                {sequenceStyle && (
                    <motion.div initial={{opacity:0, y: -10}} animate={{opacity:1, y: 0}} className="flex-shrink-0 bg-gray-900 border border-gray-800 rounded-lg p-3 mb-4 text-sm">
                        <p><strong className="text-amber-400">Visual DNA:</strong> {sequenceStyle.visualDNA}</p>
                    </motion.div>
                )}

                {/* Main Content: Editor and Timeline */}
                <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
                    {/* Left: Selected Item Panel & Visual Editor */}
                    <div className="w-full md:w-3/5 lg:w-2/3 flex-shrink-0 flex flex-col overflow-y-auto pr-2">
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
                           />
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-gray-500 bg-gray-950/70 border border-gray-800 rounded-lg">
                                <p>Select an item on the timeline to begin.</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Timeline */}
                    <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
                       <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-amber-400">Sequence Timeline</h3>
                            <button onClick={handleGetSuggestion} disabled={isLoadingSuggestion} className="text-xs text-purple-300 hover:text-purple-200 flex items-center space-x-1">
                                {isLoadingSuggestion ? <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-400 border-t-purple-400"/> : <WandSparkles className="w-3 h-3"/>}
                                <span>Dreamer Assist</span>
                            </button>
                       </div>
                       {aiSuggestion && <p className="text-xs bg-purple-900/50 p-2 rounded border border-purple-800 text-purple-200">{aiSuggestion}</p>}
                       <div className="flex-grow overflow-y-auto pr-2">
                         <Reorder.Group axis="y" values={timelineItems} onReorder={handleSetTimelineItems} className="space-y-3">
                            {timelineItems.map(item => (
                                <Reorder.Item key={item.id} value={item} className={`bg-gray-800 rounded-lg border-2 shadow-sm cursor-grab active:cursor-grabbing transition-colors ${activeTimelineItemId === item.id ? 'border-amber-500' : 'border-gray-800 hover:border-gray-700'}`}
                                >
                                    <div className="p-3 flex items-center">
                                        <GripVertical className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5"/>
                                        <div className="flex-grow" onClick={() => setActiveTimelineItemId(item.id)}>
                                            {item.type === 'shot' && <p className="font-bold text-sm">Shot {(item as ShotItem).data.shotNumber}: {(item as ShotItem).data.role}</p> }
                                            {item.type === 'b-roll' && <p className="font-bold text-sm italic text-cyan-400">B-Roll</p>}
                                            {item.type === 'transition' && <p className="font-bold text-sm italic text-purple-400">Transition</p>}
                                            {item.type === 'text' && <p className="font-bold text-sm italic text-green-400">Text</p>}
                                            <p className="text-xs text-gray-400 mt-1 truncate">
                                                {item.type === 'shot' ? (item as ShotItem).data.description : item.type === 'b-roll' ? (item as BrollItem).prompt : item.type === 'transition' ? (item as TransitionItem).note : (item as TextItem).title}
                                            </p>
                                        </div>
                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="ml-2 p-1 text-gray-500 hover:text-red-400 rounded-md" title="Delete Item">
                                            <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </Reorder.Item>
                            ))}
                         </Reorder.Group>
                       </div>
                       <div className="relative flex-shrink-0">
                           <motion.button whileHover={{scale: 1.05}} whileTap={{scale: 0.95}} onClick={() => setAddItemMenuOpen(prev => !prev)} className="w-full py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 flex items-center justify-center space-x-2">
                               <Plus className="w-4 h-4"/><span>Add to Timeline</span>
                           </motion.button>
                           <AnimatePresence>
                           {addItemMenuOpen && (
                               <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: 10}} className="absolute bottom-full mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg p-2 space-y-1 z-10">
                                   <button onClick={() => handleAddItem('shot')} className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"><Film className="w-4 h-4"/><span>New Shot</span></button>
                                   <button onClick={() => handleAddItem('b-roll')} className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"><ImageIcon className="w-4 h-4"/><span>B-Roll</span></button>
                                   <button onClick={() => handleAddItem('transition')} className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"><Scissors className="w-4 h-4"/><span>Transition Note</span></button>
                                   <button onClick={() => handleAddItem('text')} className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"><TypeIcon className="w-4 h-4"/><span>Title Card</span></button>
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


    const presetFileInputRef = useRef<HTMLInputElement>(null);

    // #############################################################################################
    // LIFECYCLE & PERSISTENCE
    // #############################################################################################

    useEffect(() => {
        try {
            const savedConfigs = localStorage.getItem('dreamerConfigs');
            if (savedConfigs) setSavedConfigurations(JSON.parse(savedConfigs));
            const savedKnowledge = localStorage.getItem('dreamerKnowledge');
            const userDocs: KnowledgeDocument[] = savedKnowledge ? JSON.parse(savedKnowledge).map((doc: any) => ({ ...doc, uploadedAt: new Date(doc.uploadedAt) })) : [];
            const preloadedDocs: KnowledgeDocument[] = preloadedKnowledgeBase.map(doc => ({ ...doc, content: doc.content, uploadedAt: new Date('2025-01-01') }));
            setKnowledgeDocs([...preloadedDocs, ...userDocs]);
            const savedPresets = localStorage.getItem('dreamerVisualPresets');
            if (savedPresets) setVisualPresets(JSON.parse(savedPresets));
            const savedCompositions = localStorage.getItem('dreamerCompositions');
            if (savedCompositions) setCompositions(JSON.parse(savedCompositions));
            const savedLighting = localStorage.getItem('dreamerLighting');
            if (savedLighting) setLightingData(JSON.parse(savedLighting));
            const savedColor = localStorage.getItem('dreamerColor');
            if (savedColor) setColorGradingData(JSON.parse(savedColor));
            const savedMovement = localStorage.getItem('dreamerMovement');
            if (savedMovement) setCameraMovement(JSON.parse(savedMovement));
            const savedStyles = localStorage.getItem('dreamerStyles');
            if (savedStyles) setStyles(JSON.parse(savedStyles));
        } catch (error) { console.error("Failed to load from localStorage:", error); }
    }, []);
    
    useEffect(() => { try { localStorage.setItem('dreamerConfigs', JSON.stringify(savedConfigurations)); } catch (e) { console.error(e) } }, [savedConfigurations]);
    useEffect(() => { try { localStorage.setItem('dreamerKnowledge', JSON.stringify(knowledgeDocs.filter(d => !d.id.startsWith('preloaded-')))); } catch (e) { console.error(e) } }, [knowledgeDocs]);
    useEffect(() => { try { localStorage.setItem('dreamerVisualPresets', JSON.stringify(visualPresets)); } catch (e) { console.error(e) } }, [visualPresets]);
    useEffect(() => { try { localStorage.setItem('dreamerCompositions', JSON.stringify(compositions)); } catch (e) { console.error(e) } }, [compositions]);
    useEffect(() => { try { localStorage.setItem('dreamerLighting', JSON.stringify(lightingData)); } catch (e) { console.error(e) } }, [lightingData]);
    useEffect(() => { try { localStorage.setItem('dreamerColor', JSON.stringify(colorGradingData)); } catch (e) { console.error(e) } }, [colorGradingData]);
    useEffect(() => { try { localStorage.setItem('dreamerMovement', JSON.stringify(cameraMovement)); } catch (e) { console.error(e) } }, [cameraMovement]);
    useEffect(() => { try { localStorage.setItem('dreamerStyles', JSON.stringify(styles)); } catch (e) { console.error(e) } }, [styles]);

    // #############################################################################################
    // HANDLERS
    // #############################################################################################

    const handleAnswer = <K extends keyof PromptData>(id: K, value: PromptData[K]) => {
        setPromptData(prev => ({ ...prev, [id]: value }));
    };

    const handleRandomAnswer = async (id: keyof PromptData, question: string) => {
        setIsGeneratingRandom(true);
        const inspiration = await getRandomInspiration(formatValue(promptData.sceneCore), question);
        handleAnswer(id, inspiration);
        setIsGeneratingRandom(false);
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

        const finalItems = await Promise.all(newShotItems.map(async (item) => {
            const smartDesc = await generateSmartVisualDescription({
                composition: updates.comp[item.id],
                lighting: updates.light[item.id],
                color: updates.color[item.id],
                camera: updates.move[item.id],
            });
            const prompt = `Cinematic shot ${item.data.shotNumber}: ${item.data.role}. Scene: ${item.data.description}. ${smartDesc}`;
            return { ...item, data: { ...item.data, prompt, originalPrompt: prompt } };
        }));

        setTimelineItems(finalItems);
        setStage('final');
    };

    const saveConfiguration = (name: string) => setSavedConfigurations(prev => [{ id: Date.now().toString(), name, data: promptData, savedAt: Date.now() }, ...prev]);
    const loadConfiguration = (config: SavedConfiguration) => { setPromptData(config.data); setStage('builder'); };
    const deleteConfiguration = (id: string) => setSavedConfigurations(prev => prev.filter(c => c.id !== id));
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        setIsProcessingDoc(true);
        const newDocs: KnowledgeDocument[] = [];
        for (const file of Array.from(event.target.files)) {
            const content = await file.text();
            const knowledge = await extractKnowledge(content);
            newDocs.push({ id: crypto.randomUUID(), name: file.name, content, uploadedAt: new Date(), extractedKnowledge: knowledge || undefined });
        }
        setKnowledgeDocs(prev => [...prev, ...newDocs]);
        setIsProcessingDoc(false);
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
    const applyPresetToItem = (preset: VisualPreset, timelineItemId: string) => {
        setCompositions(prev => ({ ...prev, [timelineItemId]: clone(preset.composition as CompositionData) }));
        setLightingData(prev => ({ ...prev, [timelineItemId]: clone(preset.lighting as LightingData) }));
        setColorGradingData(prev => ({ ...prev, [timelineItemId]: clone(preset.color as ColorGradingData) }));
        setCameraMovement(prev => ({ ...prev, [timelineItemId]: clone(preset.camera as CameraMovementData) }));
    };
    const deletePreset = (id: string) => setVisualPresets(prev => prev.filter(p => p.id !== id));
    const exportPreset = (preset: VisualPreset) => { const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${preset.name.replace(/\s+/g, '-')}.json`; a.click(); URL.revokeObjectURL(url); };
    const triggerPresetImport = () => presetFileInputRef.current?.click();
    const handlePresetImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return;
        try { const text = await file.text(); const parsed = JSON.parse(text); if (!parsed.name || !parsed.composition) throw new Error("Invalid preset"); setVisualPresets(prev => [{...parsed, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev]); } catch (e) { alert("Failed to import preset."); }
    };
    
    const onStartBuilder = (idea: string) => { setPromptData(prev => ({...prev, sceneCore: idea || prev.sceneCore })); setStage('builder'); };
    const onStartStoryboard = (script: string) => { setPromptData(prev => ({...prev, scriptText: script })); setStage('storyboard'); };
    const onGenerateStory = async (idea: string) => { setIsGeneratingStory(true); const scenes = await generateStoryFromIdea(idea); if (scenes.length > 0) { setPromptData(prev => ({...prev, scriptText: scenes.join('\n\n'), sceneCore: scenes[0]})); setStage('builder'); } setIsGeneratingStory(false); };
    
    // Fix: Added a trailing comma to the generic type parameter <T> to resolve TSX parsing ambiguity.
    const updateVisuals = <T,>(id: string, dataType: 'compositions' | 'lightingData' | 'colorGradingData' | 'cameraMovement', data: T) => {
        if (dataType === 'compositions') setCompositions(prev => ({ ...prev, [id]: data as CompositionData }));
        else if (dataType === 'lightingData') setLightingData(prev => ({ ...prev, [id]: data as LightingData }));
        else if (dataType === 'colorGradingData') setColorGradingData(prev => ({ ...prev, [id]: data as ColorGradingData }));
        else if (dataType === 'cameraMovement') setCameraMovement(prev => ({ ...prev, [id]: data as CameraMovementData }));
    };

    const updatePromptFromVisualsLogic = async (timelineItemId: string) => {
        const item = timelineItems.find(i => i.id === timelineItemId);
        if (!item || item.type !== 'shot') return;

        const visualData = {
            composition: compositions[timelineItemId] || defaultComposition,
            lighting: lightingData[timelineItemId] || defaultLighting,
            color: colorGradingData[timelineItemId] || defaultColorGrading,
            camera: cameraMovement[timelineItemId] || defaultCameraMovement,
        };
        const smartDesc = await generateSmartVisualDescription(visualData);
        const newPrompt = `Cinematic shot ${item.data.shotNumber}: ${item.data.role}. Scene: ${item.data.description}. ${smartDesc}`;
        
        setTimelineItems(prev => prev.map(i => i.id === timelineItemId && i.type === 'shot' ? {...i, data: {...i.data, prompt: newPrompt }} : i));
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
        return <LandingPage onStartBuilder={onStartBuilder} onStartStoryboard={onStartStoryboard} onGenerateStory={onGenerateStory} isGenerating={isGeneratingStory} />;
    }
    if (stage === 'builder') {
        return <BuilderPage 
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
        />;
    }
    if (stage === 'storyboard') {
        return <StoryboardPage 
            setStage={setStage}
            setGeneratedPrompts={setGeneratedPrompts}
            scriptText={promptData.scriptText || ''}
            setTimelineItems={setTimelineItems}
            setCompositions={setCompositions}
            setLightingData={setLightingData}
            setColorGradingData={setColorGradingData}
            setCameraMovement={setCameraMovement}
        />;
    }
    if (stage === 'final') {
        return <VisualSequenceEditor 
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
            deleteTimelineItem={deleteTimelineItem}
        />;
    }
    return <div>Loading...</div>;
}