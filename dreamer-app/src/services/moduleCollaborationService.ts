/**
 * AI Module Collaboration Service
 * Enables communication and collaboration between sound design, casting, and visual modules
 */

export interface ModuleInsight {
  module: 'sound' | 'casting' | 'visual';
  insight: string;
  relevance: 'high' | 'medium' | 'low';
  actionable: boolean;
  sharedData?: any;
}

export interface CrossModuleSuggestion {
  type: 'sync' | 'contrast' | 'enhance' | 'balance';
  modules: string[];
  suggestion: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export class ModuleCollaborationService {
  private static instance: ModuleCollaborationService;
  private insights: Map<string, ModuleInsight[]> = new Map();
  private crossModuleSuggestions: CrossModuleSuggestion[] = [];

  static getInstance(): ModuleCollaborationService {
    if (!ModuleCollaborationService.instance) {
      ModuleCollaborationService.instance = new ModuleCollaborationService();
    }
    return ModuleCollaborationService.instance;
  }

  // Store insights from individual modules
  addModuleInsight(module: 'sound' | 'casting' | 'visual', insight: string, relevance: 'high' | 'medium' | 'low' = 'medium', sharedData?: any): void {
    const newInsight: ModuleInsight = {
      module,
      insight,
      relevance,
      actionable: true,
      sharedData
    };

    const moduleInsights = this.insights.get(module) || [];
    moduleInsights.push(newInsight);
    this.insights.set(module, moduleInsights);

    // Trigger cross-module analysis
    this.analyzeCrossModuleSynergies();
  }

  // Generate cross-module suggestions
  private analyzeCrossModuleSynergies(): void {
    const soundInsights = this.insights.get('sound') || [];
    const castingInsights = this.insights.get('casting') || [];
    const visualInsights = this.insights.get('visual') || [];

    this.crossModuleSuggestions = [];

    // Sound-Visual Synergies
    const soundVisualSync = this.findSoundVisualSync(soundInsights, visualInsights);
    if (soundVisualSync) {
      this.crossModuleSuggestions.push({
        type: 'sync',
        modules: ['sound', 'visual'],
        ...soundVisualSync
      });
    }

    // Sound-Casting Contrasts
    const soundCastingContrast = this.findSoundCastingContrast(soundInsights, castingInsights);
    if (soundCastingContrast) {
      this.crossModuleSuggestions.push({
        type: 'contrast',
        modules: ['sound', 'casting'],
        ...soundCastingContrast
      });
    }

    // Visual-Casting Balance
    const visualCastingBalance = this.findVisualCastingBalance(visualInsights, castingInsights);
    if (visualCastingBalance) {
      this.crossModuleSuggestions.push({
        type: 'balance',
        modules: ['visual', 'casting'],
        ...visualCastingBalance
      });
    }

    // All three modules enhancement
    const allModuleEnhancement = this.findAllModuleEnhancement(soundInsights, castingInsights, visualInsights);
    if (allModuleEnhancement) {
      this.crossModuleSuggestions.push({
        type: 'enhance',
        modules: ['sound', 'casting', 'visual'],
        ...allModuleEnhancement
      });
    }
  }

  private findSoundVisualSync(soundInsights: ModuleInsight[], visualInsights: ModuleInsight[]) {
    // Look for mood/tone matches between sound and visual
    const soundMood = soundInsights.find(i => i.insight.includes('mood') || i.insight.includes('atmosphere'));
    const visualMood = visualInsights.find(i => i.insight.includes('lighting') || i.insight.includes('color'));

    if (soundMood && visualMood) {
      return {
        suggestion: 'Align sound atmosphere with visual mood for cohesive storytelling',
        rationale: 'Both sound and visual elements suggest similar atmospheric qualities',
        priority: 'high' as const
      };
    }

    // Look for energy level matches
    const soundEnergy = soundInsights.find(i => i.insight.includes('energy') || i.insight.includes('intensity'));
    const visualEnergy = visualInsights.find(i => i.insight.includes('movement') || i.insight.includes('camera'));

    if (soundEnergy && visualEnergy) {
      return {
        suggestion: 'Synchronize audio intensity with visual camera movement',
        rationale: 'Both elements indicate matching energy levels for dynamic sequences',
        priority: 'high' as const
      };
    }

    return null;
  }

  private findSoundCastingContrast(soundInsights: ModuleInsight[], castingInsights: ModuleInsight[]) {
    // Look for character type vs sound personality contrasts
    const strongCharacter = castingInsights.find(i => i.insight.includes('strong') || i.insight.includes('confident'));
    const gentleSound = soundInsights.find(i => i.insight.includes('soft') || i.insight.includes('gentle'));

    if (strongCharacter && gentleSound) {
      return {
        suggestion: 'Use gentle sound design to contrast with strong character presence',
        rationale: 'Creates interesting juxtaposition between visual character strength and audio subtlety',
        priority: 'medium' as const
      };
    }

    return null;
  }

  private findVisualCastingBalance(visualInsights: ModuleInsight[], castingInsights: ModuleInsight[]) {
    // Look for color schemes that complement character types
    const warmVisual = visualInsights.find(i => i.insight.includes('warm') || i.insight.includes('golden'));
    const seriousCharacter = castingInsights.find(i => i.insight.includes('serious') || i.insight.includes('professional'));

    if (warmVisual && seriousCharacter) {
      return {
        suggestion: 'Balance serious character presence with warm visual color grading',
        rationale: 'Warm colors can soften serious characters and create emotional depth',
        priority: 'medium' as const
      };
    }

    return null;
  }

  private findAllModuleEnhancement(soundInsights: ModuleInsight[], castingInsights: ModuleInsight[], visualInsights: ModuleInsight[]) {
    // Look for overall theme coherence
    const themes = [
      ...soundInsights.filter(i => i.insight.includes('theme') || i.insight.includes('emotion')),
      ...castingInsights.filter(i => i.insight.includes('theme') || i.insight.includes('emotion')),
      ...visualInsights.filter(i => i.insight.includes('theme') || i.insight.includes('emotion'))
    ];

    if (themes.length >= 2) {
      return {
        suggestion: 'Strengthen thematic coherence across all three modules',
        rationale: 'Multiple modules suggest consistent thematic elements - reinforce this connection',
        priority: 'high' as const
      };
    }

    return null;
  }

  // Get all cross-module suggestions
  getCrossModuleSuggestions(): CrossModuleSuggestion[] {
    return this.crossModuleSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Get insights from specific module
  getModuleInsights(module: 'sound' | 'casting' | 'visual'): ModuleInsight[] {
    return this.insights.get(module) || [];
  }

  // Get combined insights from all modules
  getAllInsights(): ModuleInsight[] {
    return Array.from(this.insights.values()).flat();
  }

  // Clear insights (useful when starting new projects)
  clearInsights(): void {
    this.insights.clear();
    this.crossModuleSuggestions = [];
  }

  // Generate module-specific collaboration tips
  generateCollaborationTips(module: 'sound' | 'casting' | 'visual'): string[] {
    const tips: string[] = [];
    
    switch (module) {
      case 'sound':
        tips.push('Consider how your sound design will complement or contrast with visual lighting choices');
        tips.push('Match character emotional states through both sound and casting decisions');
        tips.push('Use sound to enhance character presence established through casting');
        break;
        
      case 'casting':
        tips.push('Consider visual style when selecting actors that fit the aesthetic mood');
        tips.push('Match character energy levels to match intended sound atmosphere');
        tips.push('Think about how casting choices will influence both sound and visual decisions');
        break;
        
      case 'visual':
        tips.push('Coordinate visual mood with sound design for cohesive storytelling');
        tips.push('Consider casting choices when developing visual character presentation');
        tips.push('Use visual elements to support the narrative suggested by sound design');
        break;
    }
    
    return tips;
  }

  // Analyze overall project coherence
  analyzeProjectCoherence(): {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const allInsights = this.getAllInsights();
    const suggestions = this.getCrossModuleSuggestions();
    
    let coherenceScore = 50; // Base score
    
    // Boost score based on high-relevance insights
    const highRelevanceInsights = allInsights.filter(i => i.relevance === 'high').length;
    coherenceScore += highRelevanceInsights * 10;
    
    // Adjust based on cross-module suggestions
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high').length;
    const lowPrioritySuggestions = suggestions.filter(s => s.priority === 'low').length;
    
    coherenceScore += highPrioritySuggestions * 5;
    coherenceScore -= lowPrioritySuggestions * 3;
    
    coherenceScore = Math.max(0, Math.min(100, coherenceScore));
    
    const strengths = [
      'Multiple AI modules providing insights',
      'Cross-module collaboration active',
      'Diverse perspectives enhancing storytelling'
    ];
    
    const weaknesses = [];
    if (suggestions.length === 0) {
      weaknesses.push('Limited cross-module interaction detected');
    }
    if (highPrioritySuggestions > 2) {
      weaknesses.push('Multiple high-priority improvements suggested');
    }
    
    const recommendations = suggestions.slice(0, 3).map(s => s.suggestion);
    
    return {
      score: coherenceScore,
      strengths,
      weaknesses,
      recommendations
    };
  }
}

// Export singleton instance
export const moduleCollaborationService = ModuleCollaborationService.getInstance();