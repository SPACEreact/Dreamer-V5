/**
 * HuggingFace Transformers.js Integration Service
 * Provides browser-based AI capabilities without API keys
 */

export interface HuggingFaceResult {
  text?: string;
  summaries?: string[];
  keywords?: string[];
  sentiment?: string;
  entities?: string[];
  concepts?: string[];
}

// Dynamic import to avoid SSR issues
let transformers: any = null;

const initializeTransformers = async () => {
  if (!transformers) {
    try {
      // Try to dynamically import transformers
      // @ts-ignore
      transformers = await import('@huggingface/transformers');
    } catch (error) {
      console.warn('HuggingFace Transformers.js not available. Using fallback implementations.');
      return null;
    }
  }
  return transformers;
};

// Fallback implementations for when transformers.js is not available
const fallbackTextAnalysis = (text: string): HuggingFaceResult => {
  const words = text.toLowerCase().split(/\s+/);
  const keywords: string[] = [];
  const sentiment = words.some(word => ['love', 'beautiful', 'wonderful', 'amazing', 'perfect', 'brilliant'].includes(word)) ? 'positive' :
                    words.some(word => ['hate', 'terrible', 'awful', 'horrible', 'disappointing', 'bad'].includes(word)) ? 'negative' : 'neutral';
  
  // Extract potential keywords (words longer than 4 characters)
  words.filter(word => word.length > 4 && !['there', 'where', 'which', 'would', 'could', 'should'].includes(word))
        .slice(0, 5).forEach(word => keywords.push(word));
  
  return { sentiment, keywords };
};

const fallbackSummarization = (text: string): string => {
  // Simple extractive summarization
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length <= 2) return text;
  
  // Take first and last sentence, or first two if only 3 sentences
  const summarySentences = sentences.length === 3 ? sentences.slice(0, 2) : [sentences[0], sentences[sentences.length - 1]];
  return summarySentences.join('. ').trim() + '.';
};

export class HuggingFaceService {
  private static instance: HuggingFaceService;
  private textClassifier: any = null;
  private textSummarizer: any = null;
  private isInitialized = false;

  static getInstance(): HuggingFaceService {
    if (!HuggingFaceService.instance) {
      HuggingFaceService.instance = new HuggingFaceService();
    }
    return HuggingFaceService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const tf = await initializeTransformers();
      if (!tf) {
        console.info('Using fallback implementations for HuggingFace service');
        this.isInitialized = true;
        return;
      }

      // Initialize models
      // Using lightweight models that work well in browser
      try {
        this.textClassifier = await tf.pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        this.textSummarizer = await tf.pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        console.log('HuggingFace models initialized successfully');
      } catch (modelError) {
        console.warn('Failed to load specific models, using fallbacks:', modelError);
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('HuggingFace initialization failed, using fallback implementations:', error);
      this.isInitialized = true; // Still allow service to work with fallbacks
    }
  }

  async analyzeSentiment(text: string): Promise<string> {
    try {
      if (this.textClassifier && transformers) {
        const result = await this.textClassifier(text);
        return result[0].label === 'POSITIVE' ? 'positive' : 'negative';
      }
    } catch (error) {
      console.warn('Sentiment analysis failed, using fallback:', error);
    }
    return fallbackTextAnalysis(text).sentiment || 'neutral';
  }

  async extractKeywords(text: string, maxKeywords: number = 10): Promise<string[]> {
    try {
      if (this.textClassifier && transformers) {
        // For keyword extraction, we'll use a simple approach with the classifier
        const words = text.toLowerCase().split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could']);
        
        const keywords = words
          .filter(word => word.length > 3 && !stopWords.has(word))
          .slice(0, maxKeywords);
        
        return keywords;
      }
    } catch (error) {
      console.warn('Keyword extraction failed, using fallback:', error);
    }
    return fallbackTextAnalysis(text).keywords || [];
  }

  async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    try {
      if (this.textSummarizer && transformers) {
        const result = await this.textSummarizer(text, { 
          max_length: maxLength,
          min_length: 30
        });
        return result[0].summary_text;
      }
    } catch (error) {
      console.warn('Text summarization failed, using fallback:', error);
    }
    return fallbackSummarization(text);
  }

  async analyzeNarrative(text: string): Promise<{
    emotionalTone: string;
    narrativeElements: string[];
    visualCues: string[];
    genre: string;
  }> {
    try {
      const sentiment = await this.analyzeSentiment(text);
      const keywords = await this.extractKeywords(text, 8);
      
      // Simple genre detection based on keywords and sentiment
      let genre = 'drama'; // default
      const visualCues: string[] = [];
      const narrativeElements: string[] = [];

      // Analyze text for genre indicators
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('fight') || lowerText.includes('battle') || lowerText.includes('action')) {
        genre = 'action';
        visualCues.push('dynamic movement', 'intense lighting');
      } else if (lowerText.includes('love') || lowerText.includes('romance') || lowerText.includes('relationship')) {
        genre = 'romance';
        visualCues.push('soft lighting', 'close-up shots');
      } else if (lowerText.includes('fear') || lowerText.includes('dark') || lowerText.includes('scary')) {
        genre = 'horror';
        visualCues.push('shadow play', 'low-key lighting');
      } else if (lowerText.includes('laugh') || lowerText.includes('funny') || lowerText.includes('comedy')) {
        genre = 'comedy';
        visualCues.push('bright colors', 'wide shots');
      }

      // Extract narrative elements
      if (lowerText.includes('character') || lowerText.includes('person')) narrativeElements.push('character development');
      if (lowerText.includes('scene') || lowerText.includes('location')) narrativeElements.push('setting');
      if (lowerText.includes('conflict') || lowerText.includes('problem')) narrativeElements.push('conflict');
      if (lowerText.includes('emotion') || lowerText.includes('feel')) narrativeElements.push('emotional arc');

      return {
        emotionalTone: sentiment,
        narrativeElements: narrativeElements.length > 0 ? narrativeElements : ['storytelling'],
        visualCues: visualCues.length > 0 ? visualCues : ['composition', 'lighting'],
        genre
      };
    } catch (error) {
      console.error('Narrative analysis failed:', error);
      return {
        emotionalTone: 'neutral',
        narrativeElements: ['storytelling'],
        visualCues: ['composition', 'lighting'],
        genre: 'drama'
      };
    }
  }

  async enhancePrompt(originalPrompt: string, context: string): Promise<string> {
    try {
      const analysis = await this.analyzeNarrative(originalPrompt + ' ' + context);
      let enhancedPrompt = originalPrompt;

      // Add contextual enhancements based on analysis
      if (analysis.emotionalTone === 'negative') {
        enhancedPrompt += ' with darker undertones';
      } else if (analysis.emotionalTone === 'positive') {
        enhancedPrompt += ' with uplifting elements';
      }

      // Add visual cues based on genre
      if (analysis.visualCues.length > 0) {
        enhancedPrompt += ', featuring ' + analysis.visualCues.join(', ');
      }

      return enhancedPrompt;
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
      return originalPrompt;
    }
  }

  async getContentSuggestions(content: string, contentType: 'character' | 'scene' | 'visual' = 'scene'): Promise<string[]> {
    try {
      const analysis = await this.analyzeNarrative(content);
      const suggestions: string[] = [];

      // Generate suggestions based on analysis
      if (contentType === 'character' && analysis.narrativeElements.includes('character development')) {
        suggestions.push('Focus on character motivation', 'Explore internal conflict', 'Develop character arc');
      }
      
      if (contentType === 'scene' && analysis.narrativeElements.includes('setting')) {
        suggestions.push('Enhance environmental details', 'Use setting to reflect mood', 'Create atmospheric depth');
      }
      
      if (contentType === 'visual') {
        suggestions.push(`Apply ${analysis.genre} visual style`, 'Consider lighting mood', 'Think about camera movement');
      }

      return suggestions.length > 0 ? suggestions : ['Focus on storytelling', 'Enhance visual elements', 'Consider pacing'];
    } catch (error) {
      console.error('Content suggestions failed:', error);
      return ['Focus on storytelling', 'Enhance visual elements', 'Consider pacing'];
    }
  }

  async generateSuggestions(context: string, questionType: string): Promise<string[]> {
    try {
      const analysis = await this.analyzeNarrative(context);
      const suggestions: string[] = [];

      // Generate intelligent suggestions based on question type and context
      switch (questionType) {
        case 'protagonist':
          suggestions.push('Consider their background and formative experiences');
          suggestions.push('Think about what makes them unique');
          suggestions.push('Explore their internal contradictions');
          if (analysis.narrativeElements.includes('character development')) {
            suggestions.push('Focus on their character arc potential');
          }
          break;

        case 'coreWant':
          suggestions.push('Make it urgent and specific');
          suggestions.push('Connect it to their deeper needs');
          suggestions.push('Consider what they think they want vs what they need');
          if (analysis.genre === 'romance') {
            suggestions.push('Think about love as both want and need');
          }
          break;

        case 'centralConflict':
          suggestions.push('Make the opposition personal');
          suggestions.push('Ensure compromise is impossible');
          suggestions.push('Create moral complexity');
          if (analysis.visualCues.includes('intense lighting')) {
            suggestions.push('Consider external obstacles that mirror internal ones');
          }
          break;

        case 'setting':
          suggestions.push('Let the setting reflect the theme');
          suggestions.push('Use location to create conflict');
          suggestions.push('Consider how time period affects the story');
          break;

        case 'emotionalTone':
          suggestions.push('Balance contrasts for depth');
          suggestions.push('Consider the audience\'s emotional journey');
          suggestions.push('Use mood to support the story');
          if (analysis.genre === 'horror') {
            suggestions.push('Build tension through atmosphere');
          }
          break;

        case 'stakes':
          suggestions.push('Make failure personally devastating');
          suggestions.push('Consider both external and internal consequences');
          suggestions.push('Make the cost of inaction clear');
          break;

        case 'turningPoint':
          suggestions.push('Change everything the character believes');
          suggestions.push('Force an impossible choice');
          suggestions.push('Create irreversible consequences');
          break;

        default:
          suggestions.push('Focus on clarity and specificity');
          suggestions.push('Consider the story\'s central theme');
          suggestions.push('Think about visual storytelling opportunities');
      }

      return suggestions;
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      return ['Focus on clear storytelling', 'Consider character motivation', 'Think about visual elements'];
    }
  }

  // Check if the service is ready to use
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const huggingFaceService = HuggingFaceService.getInstance();