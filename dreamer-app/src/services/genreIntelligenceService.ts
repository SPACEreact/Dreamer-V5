/**
 * Genre Intelligence Service
 * Automatically detects story genre and provides relevant cinematic suggestions
 */

export interface GenreProfile {
  genre: string;
  confidence: number;
  subgenres: string[];
  characteristics: {
    visualStyle: string[];
    lighting: string[];
    cameraMovement: string[];
    colorPalette: string[];
    narrativeElements: string[];
  };
  suggestions: {
    camera: string[];
    lighting: string[];
    color: string[];
    narrative: string[];
  };
}

export class GenreIntelligenceService {
  private static instance: GenreIntelligenceService;
  
  // Genre detection patterns and characteristics
  private genrePatterns = {
    thriller: {
      keywords: ['suspense', 'danger', 'mystery', 'threat', 'chase', 'escape', 'stalker', 'investigation', 'conspiracy', 'secret'],
      visualStyle: ['Dutch angles', 'close-ups', 'tight framing', 'shadows', 'high contrast'],
      lighting: ['low-key lighting', 'dramatic shadows', 'harsh lighting', 'mysterious darkness'],
      cameraMovement: ['handheld', 'quick cuts', 'slow zoom', 'rack focus'],
      colorPalette: ['desaturated blues', 'cool tones', 'high contrast', 'monochrome'],
      narrativeElements: ['tension building', 'red herrings', 'cliffhangers', 'psychological']
    },
    horror: {
      keywords: ['fear', 'dark', 'scary', 'monster', 'death', 'blood', 'nightmare', 'ghost', 'demon', 'creepy'],
      visualStyle: ['extreme close-ups', 'low angle shots', 'POV shots', 'Dutch angles'],
      lighting: ['chiaroscuro', 'extreme shadows', 'single light source', 'flickering'],
      cameraMovement: ['static contemplation', 'slow creep', 'sudden movement', 'handheld tremor'],
      colorPalette: ['deep reds', 'sickly greens', 'blacks and whites', 'pale blues'],
      narrativeElements: ['build-up', 'sudden scares', 'psychological tension', 'supernatural']
    },
    action: {
      keywords: ['fight', 'battle', 'chase', 'explosion', 'gun', 'karate', 'mission', 'explosive', 'fast', 'intense'],
      visualStyle: ['wide shots', 'dynamic angles', 'fast cuts', 'close combat'],
      lighting: ['high-key lighting', 'natural daylight', 'explosive lighting'],
      cameraMovement: ['orbital pan', 'crane ascent', 'handheld tremor', 'tracking'],
      colorPalette: ['vibrant colors', 'high saturation', 'bold contrasts'],
      narrativeElements: ['physical conflict', 'time pressure', 'heroic moments', 'chase sequences']
    },
    romance: {
      keywords: ['love', 'kiss', 'heart', 'romantic', 'relationship', 'wedding', 'date', 'couple', 'intimate', 'tender'],
      visualStyle: ['soft focus', 'romantic framing', 'close-ups', 'two-shots'],
      lighting: ['soft volumetric prayer', 'golden hour glow', 'warm tungsten'],
      cameraMovement: ['slow dolly-in', 'steadicam drift', 'static contemplation'],
      colorPalette: ['warm pinks', 'golden yellows', 'soft pastels', 'romantic tones'],
      narrativeElements: ['emotional connection', 'intimate moments', 'relationship development', 'romantic tension']
    },
    drama: {
      keywords: ['character', 'emotion', 'life', 'family', 'struggle', 'conflict', 'human', 'personal', 'story', 'life'],
      visualStyle: ['natural framing', 'medium shots', 'realistic angles'],
      lighting: ['natural lighting', 'three-point lighting', 'motivated lighting'],
      cameraMovement: ['eye-level witness', 'minimal movement', 'character-focused'],
      colorPalette: ['natural colors', 'muted tones', 'realistic palette'],
      narrativeElements: ['character development', 'emotional depth', 'relatable situations', 'human conflict']
    },
    scifi: {
      keywords: ['future', 'technology', 'space', 'alien', 'robot', 'cyber', 'digital', 'futuristic', 'science', 'experiment'],
      visualStyle: ['wide futuristic shots', ' technological elements', 'sterile environments'],
      lighting: ['neon fever dream', 'blue lighting', 'artificial light sources'],
      cameraMovement: ['smooth tracking', 'floating movement', 'mechanical precision'],
      colorPalette: ['neon blues', 'electric purples', 'metallic silvers', 'futuristic colors'],
      narrativeElements: ['speculative concepts', 'technology integration', 'future implications', 'scientific advancement']
    },
    noir: {
      keywords: ['crime', 'detective', 'murder', 'shadow', 'dark', 'mystery', 'investigation', 'criminal', 'police', 'corrupt'],
      visualStyle: ['low angle shots', 'high contrast', 'shadow play', 'dramatic angles'],
      lighting: ['chiaroscuro contrast', 'silhouette lighting', 'single practical'],
      cameraMovement: ['static contemplation', 'slow movement', 'contemplative'],
      colorPalette: ['high contrast blacks and whites', 'deep shadows', 'dramatic lighting'],
      narrativeElements: ['moral ambiguity', 'crime investigation', 'character flaws', 'atmospheric tension']
    },
    comedy: {
      keywords: ['funny', 'laugh', 'humor', 'comic', 'silly', 'joke', 'amusing', 'hilarious', 'entertaining', 'light'],
      visualStyle: ['wide shots', 'exaggerated framing', 'playful angles'],
      lighting: ['bright lighting', 'high-key', 'cheerful atmosphere'],
      cameraMovement: ['dynamic movement', 'quick cuts', 'playful'],
      colorPalette: ['bright colors', 'warm tones', 'vibrant palette'],
      narrativeElements: ['timing', 'physical comedy', 'character quirks', 'situational humor']
    }
  };

  static getInstance(): GenreIntelligenceService {
    if (!GenreIntelligenceService.instance) {
      GenreIntelligenceService.instance = new GenreIntelligenceService();
    }
    return GenreIntelligenceService.instance;
  }

  async detectGenre(storyText: string, userAnswers: Record<string, any> = {}): Promise<GenreProfile> {
    const combinedText = `${storyText} ${Object.values(userAnswers).join(' ')}`.toLowerCase();
    
    // Score each genre based on keyword matches
    const genreScores: Record<string, number> = {};
    
    Object.entries(this.genrePatterns).forEach(([genre, patterns]) => {
      let score = 0;
      
      // Score based on keyword matches
      patterns.keywords.forEach(keyword => {
        const matches = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 2; // Weight keyword matches heavily
      });
      
      // Score based on user's previous answers (if they mention genre preferences)
      const userText = Object.values(userAnswers).join(' ').toLowerCase();
      if (userText.includes(genre)) {
        score += 5; // Direct genre mention
      }
      
      genreScores[genre] = score;
    });

    // Find the highest scoring genre
    const topGenre = Object.entries(genreScores).reduce((a, b) => 
      genreScores[a[0]] > genreScores[b[0]] ? a : b
    );

    const [primaryGenre, score] = topGenre;
    const confidence = Math.min(score / 10, 1); // Normalize to 0-1
    
    const genreData = this.genrePatterns[primaryGenre as keyof typeof this.genrePatterns];
    
    // Generate contextual suggestions based on detected genre
    const suggestions = this.generateGenreSuggestions(primaryGenre, genreData, userAnswers);
    
    // Detect subgenres based on secondary scores
    const sortedGenres = Object.entries(genreScores)
      .sort(([,a], [,b]) => b - a)
      .slice(1, 3)
      .map(([genre]) => genre);

    return {
      genre: primaryGenre,
      confidence,
      subgenres: sortedGenres,
      characteristics: {
        visualStyle: genreData.visualStyle,
        lighting: genreData.lighting,
        cameraMovement: genreData.cameraMovement,
        colorPalette: genreData.colorPalette,
        narrativeElements: genreData.narrativeElements
      },
      suggestions
    };
  }

  private generateGenreSuggestions(
    genre: string, 
    genreData: any, 
    userAnswers: Record<string, any>
  ) {
    const baseSuggestions = {
      camera: [],
      lighting: [],
      color: [],
      narrative: []
    };

    // Camera suggestions
    baseSuggestions.camera = genreData.cameraMovement.slice(0, 2);
    
    // Lighting suggestions
    baseSuggestions.lighting = genreData.lighting.slice(0, 2);
    
    // Color suggestions
    baseSuggestions.color = genreData.colorPalette.slice(0, 2);
    
    // Narrative suggestions
    baseSuggestions.narrative = genreData.narrativeElements.slice(0, 2);

    // Genre-specific contextual suggestions
    switch (genre) {
      case 'thriller':
        baseSuggestions.camera.push('tight close-ups for psychological intensity');
        baseSuggestions.lighting.push('dramatic shadows to create suspense');
        break;
        
      case 'horror':
        baseSuggestions.camera.push('low angles to create unease');
        baseSuggestions.lighting.push('extreme chiaroscuro for fear');
        break;
        
      case 'action':
        baseSuggestions.camera.push('wide dynamic shots for energy');
        baseSuggestions.lighting.push('high contrast for intensity');
        break;
        
      case 'romance':
        baseSuggestions.camera.push('soft focus for intimacy');
        baseSuggestions.lighting.push('warm golden tones');
        break;
        
      case 'drama':
        baseSuggestions.camera.push('natural eye-level framing');
        baseSuggestions.lighting.push('motivated practical lighting');
        break;
        
      case 'scifi':
        baseSuggestions.camera.push('sleek futuristic angles');
        baseSuggestions.lighting.push('neon accent lighting');
        break;
        
      case 'noir':
        baseSuggestions.camera.push('high contrast compositions');
        baseSuggestions.lighting.push('dramatic single-source lighting');
        break;
        
      case 'comedy':
        baseSuggestions.camera.push('wide shots for physical comedy');
        baseSuggestions.lighting.push('bright cheerful lighting');
        break;
    }

    return baseSuggestions;
  }

  async getContextualQuestionHelp(
    currentQuestion: string, 
    genreProfile: GenreProfile
  ): Promise<string[]> {
    const questionType = this.categorizeQuestion(currentQuestion);
    const suggestions: string[] = [];

    // Generate suggestions based on question type and detected genre
    switch (questionType) {
      case 'lighting':
        suggestions.push(...genreProfile.characteristics.lighting.slice(0, 2));
        suggestions.push(`Consider ${genreProfile.genre} lighting conventions`);
        break;
        
      case 'camera':
        suggestions.push(...genreProfile.characteristics.cameraMovement.slice(0, 2));
        suggestions.push(`${genreProfile.genre} camera work often uses ${genreProfile.characteristics.cameraMovement[0]}`);
        break;
        
      case 'color':
        suggestions.push(...genreProfile.characteristics.colorPalette.slice(0, 2));
        suggestions.push(`${genreProfile.genre} typically uses ${genreProfile.characteristics.colorPalette[0]}`);
        break;
        
      case 'emotion':
        suggestions.push(`For ${genreProfile.genre}, focus on ${genreProfile.characteristics.narrativeElements[0]}`);
        suggestions.push(`Emphasize ${genreProfile.characteristics.visualStyle[0]} techniques`);
        break;
        
      case 'composition':
        suggestions.push(...genreProfile.characteristics.visualStyle.slice(0, 2));
        suggestions.push(`${genreProfile.genre} composition should reflect ${genreProfile.characteristics.narrativeElements[0]}`);
        break;
        
      default:
        suggestions.push(`Consider ${genreProfile.genre} narrative conventions`);
        suggestions.push(`Apply ${genreProfile.genre} visual storytelling techniques`);
    }

    return suggestions;
  }

  private categorizeQuestion(question: string): string {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('lighting') || questionLower.includes('light')) return 'lighting';
    if (questionLower.includes('camera') || questionLower.includes('shot') || questionLower.includes('angle')) return 'camera';
    if (questionLower.includes('color') || questionLower.includes('palette') || questionLower.includes('grading')) return 'color';
    if (questionLower.includes('emotion') || questionLower.includes('mood') || questionLower.includes('feeling')) return 'emotion';
    if (questionLower.includes('composition') || questionLower.includes('framing') || questionLower.includes('blocking')) return 'composition';
    
    return 'general';
  }

  async enhancePromptWithGenre(
    basePrompt: string, 
    genreProfile: GenreProfile
  ): Promise<string> {
    let enhancedPrompt = basePrompt;
    
    // Add genre-specific enhancements
    const genreModifier = this.getGenreModifier(genreProfile.genre);
    if (genreModifier) {
      enhancedPrompt += ` in the style of ${genreModifier}`;
    }
    
    // Add visual style references
    if (genreProfile.characteristics.visualStyle.length > 0) {
      enhancedPrompt += ` using ${genreProfile.characteristics.visualStyle[0]} techniques`;
    }
    
    return enhancedPrompt;
  }

  private getGenreModifier(genre: string): string {
    const modifiers: Record<string, string> = {
      thriller: 'psychological thriller cinematography',
      horror: 'atmospheric horror visual style',
      action: 'dynamic action movie aesthetics',
      romance: 'romantic drama cinematography',
      drama: 'naturalistic drama visual approach',
      scifi: 'futuristic sci-fi visual language',
      noir: 'classic film noir aesthetic',
      comedy: 'lighthearted comedy visual style'
    };
    
    return modifiers[genre] || '';
  }
}

// Export singleton instance
export const genreIntelligenceService = GenreIntelligenceService.getInstance();