import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Film, Camera, Lightbulb, Palette, Users, Volume2 } from 'lucide-react';

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  promptData: any;
  questions: any[];
}

const milestones = [
  {
    id: 'script',
    step: 0,
    title: 'Script & Core',
    icon: Film,
    description: 'Scene foundation',
    color: 'bg-blue-500'
  },
  {
    id: 'technical',
    step: 2,
    title: 'Technical Setup',
    icon: Camera,
    description: 'Camera & shots',
    color: 'bg-purple-500'
  },
  {
    id: 'framing',
    step: 3,
    title: 'Framing',
    icon: Palette,
    description: 'Visual psychology',
    color: 'bg-green-500'
  },
  {
    id: 'characters',
    step: 4,
    title: 'Characters',
    icon: Users,
    description: 'Character blocking',
    color: 'bg-orange-500'
  },
  {
    id: 'lighting',
    step: 5,
    title: 'Lighting',
    icon: Lightbulb,
    description: 'Atmosphere',
    color: 'bg-yellow-500'
  },
  {
    id: 'color',
    step: 6,
    title: 'Color & Film',
    icon: Palette,
    description: 'Visual style',
    color: 'bg-pink-500'
  },
  {
    id: 'voice',
    step: 7,
    title: 'Story Voice',
    icon: Volume2,
    description: 'Poetic narrative',
    color: 'bg-indigo-500'
  },
  {
    id: 'output',
    step: 8,
    title: 'Output',
    icon: CheckCircle,
    description: 'Final settings',
    color: 'bg-emerald-500'
  }
];

export const VisualProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStep,
  totalSteps,
  promptData,
  questions
}) => {
  // Calculate completion percentage for each milestone
  const getMilestoneProgress = (milestone: any) => {
    const questionsInRange = questions.filter(q => 
      q.step >= milestone.step && q.step < (milestones[milestones.indexOf(milestone) + 1]?.step || totalSteps)
    );
    
    if (questionsInRange.length === 0) return 0;
    
    const answeredInRange = questionsInRange.filter(q => {
      const value = promptData[q.id as keyof typeof promptData];
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0);
    });
    
    return (answeredInRange.length / questionsInRange.length) * 100;
  };

  // Get overall completion percentage
  const getOverallProgress = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(q => {
      const value = promptData[q.id as keyof typeof promptData];
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0);
    }).length;
    
    return (answeredQuestions / totalQuestions) * 100;
  };

  const overallProgress = getOverallProgress();

  return (
    <div className="mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Film className="w-5 h-5 text-amber-500" />
          <span>Project Progress</span>
        </h3>
        <div className="text-sm text-gray-400">
          {Math.round(overallProgress)}% Complete
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Milestone tracker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {milestones.map((milestone, index) => {
          const progress = getMilestoneProgress(milestone);
          const isCompleted = progress >= 100;
          const isCurrent = currentStep >= milestone.step && currentStep < (milestones[index + 1]?.step || totalSteps);
          const isPast = currentStep > milestone.step;
          
          const IconComponent = milestone.icon;
          
          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-3 rounded-lg border transition-all ${
                isCurrent 
                  ? 'bg-gray-800 border-amber-500 shadow-lg shadow-amber-500/20' 
                  : isCompleted
                  ? 'bg-gray-800/50 border-green-500/50'
                  : 'bg-gray-800/30 border-gray-700'
              }`}
            >
              {/* Progress indicator */}
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isCurrent 
                    ? milestone.color 
                    : 'bg-gray-700'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <IconComponent className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </div>
                <div className={`text-xs font-medium ${
                  isCurrent ? 'text-amber-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {Math.round(progress)}%
                </div>
              </div>
              
              <div className="text-sm font-medium text-white mb-1">{milestone.title}</div>
              <div className="text-xs text-gray-500">{milestone.description}</div>
              
              {/* Mini progress bar */}
              <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                <motion.div 
                  className={`h-1 rounded-full ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                />
              </div>
              
              {/* Current step indicator */}
              {isCurrent && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-gray-900"
                >
                  <div className="w-full h-full bg-amber-400 rounded-full animate-pulse"></div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Current milestone info */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">
              Current: {milestones.find(m => currentStep >= m.step && currentStep < (milestones[milestones.indexOf(m) + 1]?.step || totalSteps))?.title || 'Final Setup'}
            </div>
            <div className="text-xs text-gray-400">
              Step {currentStep + 1} of {totalSteps}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-amber-400">
              {milestones.find(m => currentStep >= m.step && currentStep < (milestones[milestones.indexOf(m) + 1]?.step || totalSteps))?.description || 'Final configuration'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};