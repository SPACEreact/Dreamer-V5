import { huggingFaceService } from './huggingFaceService';
import { genreIntelligenceService } from './genreIntelligenceService';
import { preloadedKnowledgeBase } from '../constants';

export interface StoryIdeationQuestion {
  id: string;
  title: string;
  question: string;
  placeholder: string;
  category: 'character' | 'plot' | 'theme' | 'setting' | 'conflict' | 'emotion';
  required: boolean;
  knowledgePrompts: string[];
}

export interface StoryContext {
  protagonist?: string;
  antagonist?: string;
  setting?: string;
  timePeriod?: string;
  age?: string;
  genre?: string;
  mainConflict?: string;
  centralTheme?: string;
  emotionalTone?: string;
  stakes?: string;
  storyType?: 'feature' | 'short' | 'commercial' | 'music_video' | 'documentary';
  coreWant?: string;
  centralConflict?: string;
  turningPoint?: string;
}

export const storyIdeationQuestions: StoryIdeationQuestion[] = [
  {
    id: 'protagonist',
    title: 'Protagonist',
    question: 'Who is your main character? Describe their age, occupation, and current situation.',
    placeholder: 'e.g., Maya, 28, struggling filmmaker living in Brooklyn...',
    category: 'character',
    required: true,
    knowledgePrompts: ['character development', 'protagonist', 'save the cat']
  },
  {
    id: 'coreWant',
    title: 'Core Desire',
    question: 'What does your protagonist desperately want? What drives them?',
    placeholder: 'e.g., She wants to make a film that changes her father\'s mind about her career choice.',
    category: 'character',
    required: true,
    knowledgePrompts: ['character motivation', 'desire', 'stakes']
  },
  {
    id: 'centralConflict',
    title: 'Central Conflict',
    question: 'What stands in their way? What is the main obstacle or opposition?',
    placeholder: 'e.g., Her father is a traditional banker who disapproves of the film industry...',
    category: 'conflict',
    required: true,
    knowledgePrompts: ['conflict', 'obstacles', 'unity of opposites']
  },
  {
    id: 'setting',
    title: 'Setting & World',
    question: 'Where and when does your story take place? What makes this setting significant?',
    placeholder: 'e.g., Brooklyn in 2024, where gentrification is forcing out the creative community...',
    category: 'setting',
    required: false,
    knowledgePrompts: ['world building', 'setting', 'location']
  },
  {
    id: 'emotionalTone',
    title: 'Emotional Journey',
    question: 'What emotional journey does your audience experience? How should they feel?',
    placeholder: 'e.g., Hopeful yet anxious, with moments of triumph and vulnerability...',
    category: 'emotion',
    required: false,
    knowledgePrompts: ['emotion', 'tone', 'audience connection']
  },
  {
    id: 'stakes',
    title: 'Stakes',
    question: 'What happens if your protagonist fails? What makes this story urgent?',
    placeholder: 'e.g., If she fails, she\'ll have to give up her dreams and take a corporate job...',
    category: 'conflict',
    required: true,
    knowledgePrompts: ['stakes', 'urgency', 'consequences']
  },
  {
    id: 'storyType',
    title: 'Story Format',
    question: 'What type of story are you telling? This helps Dreamer understand the pacing and style.',
    placeholder: 'e.g., Character drama with comedic moments...',
    category: 'plot',
    required: false,
    knowledgePrompts: ['genre', 'story structure', 'format']
  },
  {
    id: 'turningPoint',
    title: 'Key Moment',
    question: 'What is the pivotal moment that changes everything for your protagonist?',
    placeholder: 'e.g., She discovers her father secretly supports her, but he\'s dying...',
    category: 'plot',
    required: false,
    knowledgePrompts: ['turning point', 'climax', 'story arc']
  }
];

export class StoryIdeationService {
  static ageContextMap: Record<string, string> = {
    'child': 'Innocence, wonder, vulnerability to adult world, formation of identity',
    'teenager': 'Identity crisis, rebellion vs conformity, first love, peer pressure, finding independence',
    'young_adult': 'Career building, relationship exploration, leaving home, financial independence, purpose finding',
    'adult': 'Career stability, family building, midlife reflection, responsibility balance, achievement',
    'middle_aged': 'Empty nest, marriage changes, career peak or crisis, health awareness, legacy thinking',
    'elder': 'Wisdom sharing, life reflection, health challenges, legacy, mortality acceptance'
  };

  static getRelevantKnowledge(questionId: string): string[] {
    const question = storyIdeationQuestions.find(q => q.id === questionId);
    if (!question) return [];

    return question.knowledgePrompts.flatMap(prompt => 
      preloadedKnowledgeBase
        .filter(doc => 
          doc.extractedKnowledge?.themes?.some(theme => theme.includes(prompt)) ||
          doc.extractedKnowledge?.techniques?.some(technique => technique.includes(prompt)) ||
          doc.name.toLowerCase().includes(prompt.toLowerCase())
        )
        .map(doc => `📚 ${doc.name}: ${doc.extractedKnowledge?.themes?.slice(0, 2).join(', ') || 'Key insights'}...`)
    );
  }

  static enhanceAnswerWithContext(questionId: string, answer: string, context: Partial<StoryContext>): string {
    if (questionId === 'protagonist' && context.age) {
      const ageGroup = this.getAgeGroup(context.age);
      const ageInsights = this.ageContextMap[ageGroup];
      if (ageInsights) {
        return `${answer}

💭 Age Context: ${ageInsights}`;
      }
    }

    if (questionId === 'emotionalTone' && context.genre) {
      return `${answer}

🎭 Genre Insight: For ${context.genre} stories, focus on ${this.getGenreEmotionalFocus(context.genre)}`;
    }

    return answer;
  }

  static getAgeGroup(ageInput: string): string {
    const age = parseInt(ageInput);
    if (isNaN(age)) {
      const input = ageInput.toLowerCase();
      if (input.includes('child') || input.includes('kid')) return 'child';
      if (input.includes('teen') || input.includes('adolescent')) return 'teenager';
      if (input.includes('young') || (age >= 18 && age <= 25)) return 'young_adult';
      if (age >= 26 && age <= 40) return 'adult';
      if (age >= 41 && age <= 55) return 'middle_aged';
      if (age >= 56) return 'elder';
      return 'adult';
    }

    if (age < 13) return 'child';
    if (age < 18) return 'teenager';
    if (age < 26) return 'young_adult';
    if (age < 41) return 'adult';
    if (age < 56) return 'middle_aged';
    return 'elder';
  }

  static getGenreEmotionalFocus(genre: string): string {
    const focusMap: Record<string, string> = {
      'drama': 'authentic emotions and character development',
      'comedy': 'uplifting moments and character flaws',
      'thriller': 'suspense and tension building',
      'romance': 'intimacy and emotional connection',
      'horror': 'fear and psychological tension',
      'action': 'adrenaline and visual spectacle',
      'sci-fi': 'wonder and philosophical questions',
      'fantasy': 'magic and moral choices',
      'documentary': 'truth and social insight'
    };

    return focusMap[genre.toLowerCase()] || 'engaging storytelling';
  }

  static async analyzeStoryForGenre(context: Partial<StoryContext>): Promise<string | null> {
    try {
      const storyText = [
        context.protagonist,
        context.coreWant,
        context.centralConflict,
        context.emotionalTone
      ].filter(Boolean).join(' ');

      if (!storyText.trim()) return null;

      const genre = await genreIntelligenceService.detectGenre(storyText, context as any);
      return genre.genre;
    } catch (error) {
      console.warn('Genre analysis failed:', error);
      return null;
    }
  }

  static async generateSmartSuggestions(questionId: string, context: Partial<StoryContext>, allAnswers: Record<string, string>): Promise<string[]> {
    try {
      // Build context from all answered questions
      const contextText = Object.entries(allAnswers)
        .filter(([key, value]) => value.trim().length > 0)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      const knowledgeContext = this.getRelevantKnowledge(questionId)
        .join('\n');

      const fullContext = `${knowledgeContext}\n\nStory Context:\n${contextText}`;

      // Use HuggingFace for local analysis if available
      const suggestions = await huggingFaceService.generateSuggestions(fullContext, questionId);
      
      if (suggestions && suggestions.length > 0) {
        return suggestions.slice(0, 3); // Return top 3 suggestions
      }

      // Fallback to knowledge-based suggestions
      return this.getRelevantKnowledge(questionId).slice(0, 2);
    } catch (error) {
      console.warn('Smart suggestions failed:', error);
      return this.getRelevantKnowledge(questionId).slice(0, 2);
    }
  }

  static buildScriptFromContext(context: Partial<StoryContext>): string {
    const parts: string[] = [];

    if (context.protagonist) {
      parts.push(`PROTAGONIST: ${context.protagonist}`);
    }

    if (context.setting) {
      parts.push(`SETTING: ${context.setting}`);
    }

    if (context.timePeriod) {
      parts.push(`TIME PERIOD: ${context.timePeriod}`);
    }

    if (context.coreWant) {
      parts.push(`CORE DESIRE: ${context.coreWant}`);
    }

    if (context.centralConflict) {
      parts.push(`CENTRAL CONFLICT: ${context.centralConflict}`);
    }

    if (context.stakes) {
      parts.push(`STAKES: ${context.stakes}`);
    }

    if (context.emotionalTone) {
      parts.push(`EMOTIONAL TONE: ${context.emotionalTone}`);
    }

    if (context.turningPoint) {
      parts.push(`KEY MOMENT: ${context.turningPoint}`);
    }

    return parts.join('\n\n');
  }

  static shouldShowQuestion(questionId: string, context: Partial<StoryContext>): boolean {
    // Logic for conditional questions based on previous answers
    switch (questionId) {
      case 'stakes':
        return !!context.coreWant; // Only show if we know what they want
      case 'turningPoint':
        return !!(context.coreWant && context.centralConflict); // Only show if we have conflict setup
      case 'emotionalTone':
        return !!context.genre || !!context.storyType; // Show if genre is determined
      default:
        return true;
    }
  }
}