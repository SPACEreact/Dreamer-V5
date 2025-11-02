import React from 'react';
import { motion } from 'framer-motion';
import { Users, Music, Palette, Camera, TrendingUp, AlertCircle } from 'lucide-react';
import { moduleCollaborationService } from '../services/moduleCollaborationService';

interface CollaborationDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  const insights = moduleCollaborationService.getAllInsights();
  const suggestions = moduleCollaborationService.getCrossModuleSuggestions();
  const coherence = moduleCollaborationService.analyzeProjectCoherence();

  const moduleIcons = {
    sound: Music,
    casting: Users,
    visual: Camera
  };

  const typeColors = {
    sync: 'bg-green-900/20 border-green-700/30 text-green-400',
    contrast: 'bg-yellow-900/20 border-yellow-700/30 text-yellow-400',
    enhance: 'bg-blue-900/20 border-blue-700/30 text-blue-400',
    balance: 'bg-purple-900/20 border-purple-700/30 text-purple-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>AI Module Collaboration</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Coherence Score */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">Project Coherence</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${coherence.score >= 70 ? 'bg-green-500' : coherence.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-2xl font-bold text-white">{coherence.score}%</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <motion.div
                className={`h-2 rounded-full ${coherence.score >= 70 ? 'bg-green-500' : coherence.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${coherence.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="text-green-400 font-medium mb-1">Strengths</h4>
                <ul className="text-gray-300 space-y-1">
                  {coherence.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-red-400 font-medium mb-1">Areas to Improve</h4>
                <ul className="text-gray-300 space-y-1">
                  {coherence.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-blue-400 font-medium mb-1">Recommendations</h4>
                <ul className="text-gray-300 space-y-1">
                  {coherence.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Cross-Module Suggestions */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span>Cross-Module Suggestions</span>
            </h3>
            
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const TypeIcon = suggestion.type === 'sync' ? TrendingUp : 
                                 suggestion.type === 'contrast' ? AlertCircle :
                                 suggestion.type === 'balance' ? Users : Palette;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${typeColors[suggestion.type]}`}
                    >
                      <div className="flex items-start space-x-3">
                        <TypeIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium capitalize">{suggestion.type}</span>
                            <span className="text-xs px-2 py-1 bg-black/20 rounded-full">
                              {suggestion.modules.join(' + ')}
                            </span>
                            <span className={`text-xs px-2 py-1 bg-black/20 rounded-full ${
                              suggestion.priority === 'high' ? 'text-red-300' :
                              suggestion.priority === 'medium' ? 'text-yellow-300' : 'text-gray-300'
                            }`}>
                              {suggestion.priority}
                            </span>
                          </div>
                          <p className="text-sm mb-1">{suggestion.suggestion}</p>
                          <p className="text-xs opacity-80">{suggestion.rationale}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No cross-module suggestions yet. Complete more modules to see collaboration opportunities.</p>
            )}
          </div>

          {/* Module Insights */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              <Palette className="w-5 h-5 text-blue-500" />
              <span>Module Insights</span>
            </h3>
            
            {insights.length > 0 ? (
              <div className="space-y-4">
                {['sound', 'casting', 'visual'].map(module => {
                  const moduleInsights = insights.filter(i => i.module === module);
                  if (moduleInsights.length === 0) return null;
                  
                  const ModuleIcon = moduleIcons[module as keyof typeof moduleIcons];
                  
                  return (
                    <div key={module} className="border border-gray-700 rounded-lg p-3">
                      <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                        <ModuleIcon className="w-4 h-4" />
                        <span className="capitalize">{module} Module</span>
                      </h4>
                      <div className="space-y-2">
                        {moduleInsights.map((insight, index) => (
                          <div key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                            <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              insight.relevance === 'high' ? 'bg-green-400' :
                              insight.relevance === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                            }`}></span>
                            <span>{insight.insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No module insights available yet. Complete more project steps to see collaborative suggestions.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};