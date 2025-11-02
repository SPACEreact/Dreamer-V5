import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  User,
  Heart,
  TrendingUp,
  Globe,
  X,
  Plus,
  Search
} from 'lucide-react';
import {
  CharacterAnalysis,
  CastingSuggestion,
  CastingData,
  AgeRange,
  Gender,
  Ethnicity,
  PhysicalBuild
} from '../types';
import { analyzeCharacter, generateCastingSuggestions } from '../services/geminiService';

interface CastingAssistantProps {
  characters: string[];
  sceneDescription: string;
  onCastingDataUpdate: (data: CastingData) => void;
}

const ageRanges: AgeRange[] = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
const genders: Gender[] = ['male', 'female', 'non-binary', 'any'];
const ethnicities: Ethnicity[] = ['any', 'caucasian', 'african', 'asian', 'hispanic', 'middle-eastern', 'mixed'];
const builds: PhysicalBuild[] = ['slim', 'athletic', 'average', 'muscular', 'plus-size'];

export const CastingAssistant: React.FC<CastingAssistantProps> = ({
  characters,
  sceneDescription,
  onCastingDataUpdate
}) => {
  const [castingData, setCastingData] = useState<CastingData>({
    characters: [],
    suggestions: []
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [diversityFocus, setDiversityFocus] = useState(true);
  const [customCharacterName, setCustomCharacterName] = useState('');
  const [customCharacterDescription, setCustomCharacterDescription] = useState('');
  const [showAddCharacter, setShowAddCharacter] = useState(false);

  const handleAnalyzeCharacter = async (characterName: string, description: string = '') => {
    setIsAnalyzing(true);
    try {
      const fullDescription = description || sceneDescription;
      const analysis = await analyzeCharacter(characterName, fullDescription);
      
      const updatedCharacters = [
        ...castingData.characters.filter(c => c.name !== characterName),
        analysis
      ];
      
      const updated = { ...castingData, characters: updatedCharacters };
      setCastingData(updated);
      onCastingDataUpdate(updated);
      setSelectedCharacter(characterName);
    } catch (error) {
      console.error('Character analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCastingSuggestions = async () => {
    if (!selectedCharacter) {
      alert('Please select a character first');
      return;
    }

    const character = castingData.characters.find(c => c.name === selectedCharacter);
    if (!character) return;

    setIsGeneratingSuggestions(true);
    try {
      const suggestions = await generateCastingSuggestions(
        character,
        sceneDescription,
        diversityFocus
      );
      
      const updatedSuggestions = [
        ...castingData.suggestions.filter(s => s.characterName !== selectedCharacter),
        suggestions
      ];
      
      const updated = { ...castingData, suggestions: updatedSuggestions };
      setCastingData(updated);
      onCastingDataUpdate(updated);
    } catch (error) {
      console.error('Casting suggestions failed:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleAddCustomCharacter = () => {
    if (!customCharacterName.trim()) return;
    handleAnalyzeCharacter(customCharacterName, customCharacterDescription);
    setCustomCharacterName('');
    setCustomCharacterDescription('');
    setShowAddCharacter(false);
  };

  const removeCharacter = (name: string) => {
    const updated = {
      characters: castingData.characters.filter(c => c.name !== name),
      suggestions: castingData.suggestions.filter(s => s.characterName !== name)
    };
    setCastingData(updated);
    onCastingDataUpdate(updated);
    if (selectedCharacter === name) {
      setSelectedCharacter(null);
    }
  };

  const currentAnalysis = selectedCharacter
    ? castingData.characters.find(c => c.name === selectedCharacter)
    : null;

  const currentSuggestions = selectedCharacter
    ? castingData.suggestions.find(s => s.characterName === selectedCharacter)
    : null;

  return (
    <div className="space-y-6 p-6 bg-gray-950/50 border border-gray-800 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Users className="w-7 h-7" />
            Casting Assistant
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered diverse casting suggestions for your characters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={diversityFocus}
              onChange={(e) => setDiversityFocus(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-amber-500 focus:ring-amber-500"
            />
            <Globe className="w-4 h-4" />
            <span>Diversity Focus</span>
          </label>
        </div>
      </div>

      {/* Character List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-300">Characters</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddCharacter(!showAddCharacter)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Character</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {showAddCharacter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"
            >
              <input
                type="text"
                value={customCharacterName}
                onChange={(e) => setCustomCharacterName(e.target.value)}
                placeholder="Character name..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              />
              <textarea
                value={customCharacterDescription}
                onChange={(e) => setCustomCharacterDescription(e.target.value)}
                placeholder="Character description (optional - will use scene description)..."
                className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddCustomCharacter}
                  disabled={!customCharacterName.trim()}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add & Analyze
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddCharacter(false)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {characters.map((char) => (
            <motion.button
              key={char}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnalyzeCharacter(char)}
              disabled={isAnalyzing}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedCharacter === char
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-white">{char}</span>
                </div>
                {castingData.characters.some(c => c.name === char) && (
                  <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded-full">
                    Analyzed
                  </span>
                )}
              </div>
            </motion.button>
          ))}
          
          {castingData.characters
            .filter(c => !characters.includes(c.name))
            .map((char) => (
              <motion.div
                key={char.name}
                className={`p-4 rounded-lg border-2 ${
                  selectedCharacter === char.name
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500'
                    : 'bg-gray-900 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCharacter(char.name)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <User className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-white">{char.name}</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeCharacter(char.name)}
                    className="p-1 hover:bg-red-900/50 rounded"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
        </div>

        {isAnalyzing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              <span>Analyzing character...</span>
            </div>
          </div>
        )}
      </div>

      {/* Character Analysis */}
      {currentAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Character Profile: {currentAnalysis.name}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase">Age Range</p>
                <p className="text-sm font-semibold text-white">{currentAnalysis.ageRange}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Gender</p>
                <p className="text-sm font-semibold text-white capitalize">{currentAnalysis.gender}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Physical Build</p>
                <p className="text-sm font-semibold text-white capitalize">{currentAnalysis.physicalTraits.build}</p>
              </div>
              {currentAnalysis.physicalTraits.height && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Height</p>
                  <p className="text-sm font-semibold text-white">{currentAnalysis.physicalTraits.height}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Ethnicity Options</p>
                <div className="flex flex-wrap gap-2">
                  {currentAnalysis.ethnicity.map((eth) => (
                    <span
                      key={eth}
                      className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs font-medium capitalize"
                    >
                      {eth}
                    </span>
                  ))}
                </div>
              </div>
              {currentAnalysis.physicalTraits.distinctiveFeatures.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Distinctive Features</p>
                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis.physicalTraits.distinctiveFeatures.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {currentAnalysis.personalityTraits.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Personality Traits</p>
                <div className="flex flex-wrap gap-2">
                  {currentAnalysis.personalityTraits.map((trait, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-amber-900/30 text-amber-300 rounded text-xs"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentAnalysis.actingStyle.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Acting Style</p>
                <div className="flex flex-wrap gap-2">
                  {currentAnalysis.actingStyle.map((style, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-teal-900/30 text-teal-300 rounded text-xs"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateCastingSuggestions}
            disabled={isGeneratingSuggestions}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingSuggestions ? (
              <>
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                <span>Generating Casting Suggestions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Diverse Casting Suggestions</span>
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Casting Suggestions */}
      {currentSuggestions && currentSuggestions.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Casting Suggestions for {currentSuggestions.characterName}
          </h3>

          <div className="grid gap-4">
            {currentSuggestions.suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-2">
                      {suggestion.description}
                    </p>
                    <div className="grid md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Age: </span>
                        <span className="text-gray-300">{suggestion.ageRange}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Physical: </span>
                        <span className="text-gray-300">{suggestion.physicalDescription}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-950/50 rounded p-3 space-y-2">
                  <div>
                    <p className="text-xs text-amber-400 font-semibold uppercase mb-1">
                      Acting Notes
                    </p>
                    <p className="text-xs text-gray-300">{suggestion.actingNotes}</p>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-gray-800">
                    <Heart className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-pink-400 font-semibold uppercase">
                        Diversity Consideration
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {suggestion.diversityConsideration}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
