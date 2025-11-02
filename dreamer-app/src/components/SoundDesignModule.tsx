import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Music,
  Wind,
  Zap,
  Heart,
  Shield,
  Search,
  Sparkles,
  Play,
  Pause,
  X
} from 'lucide-react';
import { AudioMoodTag, AudioSuggestion, FoleySuggestion, SoundDesignData } from '../types';
import { analyzeSoundMood, generateSoundSuggestions, generateFoleySuggestions } from '../services/geminiService';

interface SoundDesignModuleProps {
  sceneDescription: string;
  visualMood: string;
  characters: string[];
  cameraMovement: string;
  lighting: string;
  onSoundDataUpdate: (data: SoundDesignData) => void;
}

const moodIcons: Record<AudioMoodTag, React.ReactNode> = {
  ambient: <Wind className="w-5 h-5" />,
  tense: <Zap className="w-5 h-5" />,
  romantic: <Heart className="w-5 h-5" />,
  epic: <Shield className="w-5 h-5" />,
  mysterious: <Search className="w-5 h-5" />,
  action: <Zap className="w-5 h-5" />,
  suspense: <Sparkles className="w-5 h-5" />
};

const moodColors: Record<AudioMoodTag, string> = {
  ambient: 'from-blue-500 to-cyan-500',
  tense: 'from-red-500 to-orange-500',
  romantic: 'from-pink-500 to-rose-500',
  epic: 'from-purple-500 to-indigo-500',
  mysterious: 'from-violet-500 to-purple-500',
  action: 'from-orange-500 to-red-600',
  suspense: 'from-yellow-500 to-amber-500'
};

export const SoundDesignModule: React.FC<SoundDesignModuleProps> = ({
  sceneDescription,
  visualMood,
  characters,
  cameraMovement,
  lighting,
  onSoundDataUpdate
}) => {
  const [soundData, setSoundData] = useState<SoundDesignData>({
    mood: [],
    categories: [],
    suggestions: [],
    foley: []
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isGeneratingFoley, setIsGeneratingFoley] = useState(false);
  const [selectedMood, setSelectedMood] = useState<AudioMoodTag[]>([]);
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const handleAnalyzeMood = async () => {
    setIsAnalyzing(true);
    try {
      const moods = await analyzeSoundMood(sceneDescription, visualMood);
      setSelectedMood(moods);
      const updated = { ...soundData, mood: moods };
      setSoundData(updated);
      onSoundDataUpdate(updated);
    } catch (error) {
      console.error('Mood analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (selectedMood.length === 0) {
      alert('Please analyze mood first');
      return;
    }
    
    setIsGeneratingSuggestions(true);
    try {
      const suggestions = await generateSoundSuggestions(
        sceneDescription,
        selectedMood,
        cameraMovement,
        lighting
      );
      const updated = { ...soundData, suggestions };
      setSoundData(updated);
      onSoundDataUpdate(updated);
    } catch (error) {
      console.error('Sound suggestions failed:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleGenerateFoley = async () => {
    if (characters.length === 0) {
      alert('No characters found in the scene');
      return;
    }
    
    setIsGeneratingFoley(true);
    try {
      const foley = await generateFoleySuggestions(
        characters,
        sceneDescription,
        cameraMovement
      );
      const updated = { ...soundData, foley };
      setSoundData(updated);
      onSoundDataUpdate(updated);
    } catch (error) {
      console.error('Foley generation failed:', error);
    } finally {
      setIsGeneratingFoley(false);
    }
  };

  const toggleMood = (mood: AudioMoodTag) => {
    const newMood = selectedMood.includes(mood)
      ? selectedMood.filter(m => m !== mood)
      : [...selectedMood, mood];
    setSelectedMood(newMood);
    const updated = { ...soundData, mood: newMood };
    setSoundData(updated);
    onSoundDataUpdate(updated);
  };

  const removeSuggestion = (id: string) => {
    const updated = {
      ...soundData,
      suggestions: soundData.suggestions.filter(s => s.id !== id)
    };
    setSoundData(updated);
    onSoundDataUpdate(updated);
  };

  const removeFoley = (id: string) => {
    const updated = {
      ...soundData,
      foley: soundData.foley.filter(f => f.id !== id)
    };
    setSoundData(updated);
    onSoundDataUpdate(updated);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-950/50 border border-gray-800 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Volume2 className="w-7 h-7" />
            Sound Design Module
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Create immersive audio landscapes for your cinematic vision
          </p>
        </div>
      </div>

      {/* Audio Mood Analysis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-300">Audio Mood Tags</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyzeMood}
            disabled={isAnalyzing || !sceneDescription}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-800 border-t-white" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Mood</span>
              </>
            )}
          </motion.button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(moodIcons) as AudioMoodTag[]).map((mood) => (
            <motion.button
              key={mood}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMood(mood)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMood.includes(mood)
                  ? `bg-gradient-to-br ${moodColors[mood]} border-transparent text-white shadow-lg`
                  : 'bg-gray-900 border-gray-700 hover:border-gray-600 text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {moodIcons[mood]}
              </div>
              <p className="text-sm font-medium capitalize">{mood}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sound Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-300">Sound Suggestions</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateSuggestions}
            disabled={isGeneratingSuggestions || selectedMood.length === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingSuggestions ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Music className="w-4 h-4" />
                <span>Generate Suggestions</span>
              </>
            )}
          </motion.button>
        </div>

        <div className="grid gap-3">
          <AnimatePresence>
            {soundData.suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r ${
                        moodColors[suggestion.mood as AudioMoodTag]
                      } text-white`}>
                        {suggestion.category.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {suggestion.duration}s
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{suggestion.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPlayingSound(playingSound === suggestion.id ? null : suggestion.id)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    >
                      {playingSound === suggestion.id ? (
                        <Pause className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Play className="w-4 h-4 text-amber-400" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeSuggestion(suggestion.id)}
                      className="p-2 bg-gray-800 hover:bg-red-900/50 rounded-lg"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {soundData.suggestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Generate sound suggestions to see them here
            </div>
          )}
        </div>
      </div>

      {/* Foley Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-300">Foley Effects</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateFoley}
            disabled={isGeneratingFoley || characters.length === 0}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingFoley ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Foley</span>
              </>
            )}
          </motion.button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {soundData.foley.map((foley, index) => (
              <motion.div
                key={foley.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-teal-400">
                        {foley.characterName}
                      </span>
                      <span className="text-xs text-gray-500">{foley.timing}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-300">{foley.soundEffect}</p>
                    <p className="text-xs text-gray-500 mt-1">{foley.description}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFoley(foley.id)}
                    className="p-2 bg-gray-800 hover:bg-red-900/50 rounded-lg ml-3"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {soundData.foley.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Generate foley suggestions to see them here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
