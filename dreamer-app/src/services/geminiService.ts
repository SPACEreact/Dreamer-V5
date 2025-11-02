



import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ExtractedKnowledge, StoryboardShot, SequenceStyle, CompositionData, LightingData, ColorGradingData, CameraMovementData, CompositionCharacter, AudioMoodTag, AudioSuggestion, FoleySuggestion, CharacterAnalysis, CastingSuggestion } from "../types";
import { huggingFaceService } from "./huggingFaceService";
import { geminiLogger } from '../lib/logger';
import { handleAIServiceError, sanitizeErrorMessage } from '../lib/errorHandler';
import { API_CONFIG, NUMERIC } from '../constants';

// The GoogleGenAI instance is initialized with the API key from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhanced error handler specifically for Gemini AI service
 */
function handleGeminiError(error: unknown, operation: string): never {
  const appError = handleAIServiceError(error, `Gemini AI - ${operation}`);
  throw new Error(appError.message);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const defaultComposition: CompositionData = { characters: [{ id: 'char-1', name: 'Subject A', x: 400, y: 225 }], cameraAngle: 'true-eye, honest', cameraHeight: 'eye-level witness' };
const defaultLighting: LightingData = { keyLightIntensity: 80, keyLightColor: '#FFD8A8', fillLightIntensity: 40, fillLightColor: '#89CFF0', backLightIntensity: 60, backLightColor: '#FACC15', ambientIntensity: 20, colorTemperature: 4500, mood: 'chiaroscuro confession' };
const defaultColorGrading: ColorGradingData = { colorGrade: 'Dreamer Grade', saturation: 10, contrast: 5, highlights: 5, shadows: -5, colorPalette: ['#0F172A', '#1E293B', '#475569', '#F97316', '#FBBF24', '#FDE68A', '#38BDF8', '#A855F7'], colorHarmony: 'complementary pulse' };
const defaultCameraMovement: CameraMovementData = { movementType: 'static contemplation', startPos: { x: 100, y: 300 }, endPos: { x: 700, y: 150 }, duration: 5, easing: 'ease-in-out', focalLength: 35 };


export const extractKnowledge = async (content: string): Promise<ExtractedKnowledge | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Analyze this document and extract cinematographic knowledge. Focus on key themes, visual styles, common character archetypes, and specific filmmaking techniques mentioned or implied.\n\nDOCUMENT:\n${content.substring(0, 8000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key thematic elements." },
            visualStyles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Visual or stylistic approaches." },
            characters: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Character archetypes or roles." },
            techniques: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Filmmaking techniques or concepts." },
          },
          required: ["themes", "visualStyles", "characters", "techniques"],
        },
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as ExtractedKnowledge;
  } catch (error) {
    geminiLogger.error('Knowledge extraction failed:', sanitizeErrorMessage(error));
    return null;
  }
};

export const getAISuggestions = async (context: string, currentQuestion: string, knowledgeDocs: any[] = []): Promise<string[]> => {
    try {
        // Use HuggingFace for local analysis to enhance context
        await huggingFaceService.initialize();
        const narrativeAnalysis = await huggingFaceService.analyzeNarrative(context);
        
        // Enhance context with HuggingFace analysis
        const enhancedContext = `${context}\n\nNARRATIVE ANALYSIS (Local AI):\nGenre: ${narrativeAnalysis.genre}\nEmotional Tone: ${narrativeAnalysis.emotionalTone}\nVisual Cues: ${narrativeAnalysis.visualCues.join(', ')}\nNarrative Elements: ${narrativeAnalysis.narrativeElements.join(', ')}`;

        const response = await ai.models.generateContent({
            model: API_CONFIG.GEMINI_MODEL,
            contents: `You are Dreamer, a visionary cinematography AI. Your voice is poetic, insightful, and steeped in film theory.
            Your task is to provide 3-5 creative, professional suggestions for the current question.
            Critically analyze all the context provided (the user's script, their previous answers, the cinematic knowledge base, and the local AI narrative analysis).
            Synthesize these elements to generate suggestions that are not just creative, but are deeply relevant to the user's established world and themes.
            Each suggestion must be a concise, actionable answer that directly addresses the question.
            When possible, reference specific techniques from the knowledge base that would enhance this particular question/answer.

            CONTEXT:
            ${enhancedContext}

            CURRENT QUESTION:
            "${currentQuestion}"`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            }
        });

        const suggestionsText = response.text;
        return suggestionsText.split('\n').map(s => s.trim().replace(/^- /,'').replace(/^\* /,'').replace(/^\d+\. /,'')).filter(Boolean);
    } catch (error) {
        handleAIServiceError(error, 'Get AI Suggestions');
        return [];
    }
};

export const getRandomInspiration = async (context: string, currentQuestion: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `You are a creative assistant. Based on the core idea of the scene, provide one, single, concise, and inspiring suggestion for the following question. The suggestion should be a fresh take but still relevant to the scene's context. Return only the suggestion text itself.

            SCENE CONTEXT:
            "${context}"

            CURRENT QUESTION:
            "${currentQuestion}"`,
        });
        return response.text.trim();
    } catch (error) {
        handleAIServiceError(error, 'Get Random Inspiration');
        return "A lone figure against a vast, empty landscape.";
    }
};

// Enhanced function for knowledge-based suggestions
export const getKnowledgeBasedSuggestions = async (
    context: string, 
    currentQuestion: string, 
    knowledgeDocs: any[] = []
): Promise<{
    suggestions: string[];
    relevantKnowledge: string[];
}> => {
    try {
        // Use HuggingFace for local analysis
        await huggingFaceService.initialize();
        const narrativeAnalysis = await huggingFaceService.analyzeNarrative(context);
        
        // Find most relevant knowledge documents based on narrative analysis
        const relevantKnowledge: string[] = [];
        const knowledgeSuggestions: string[] = [];

        knowledgeDocs.forEach(doc => {
            const themes = doc.extractedKnowledge?.themes || [];
            const techniques = doc.extractedKnowledge?.techniques || [];
            const visualStyles = doc.extractedKnowledge?.visualStyles || [];
            
            // Check for relevance based on narrative analysis
            const isRelevant = 
                themes.some(theme => narrativeAnalysis.narrativeElements.some(el => el.toLowerCase().includes(theme.toLowerCase()))) ||
                visualStyles.some(style => narrativeAnalysis.visualCues.some(cue => cue.toLowerCase().includes(style.toLowerCase())));
            
            if (isRelevant && techniques.length > 0) {
                relevantKnowledge.push(`${doc.name}: ${techniques.slice(0, 2).join(', ')}`);
                
                // Generate knowledge-based suggestions
                techniques.slice(0, 2).forEach(technique => {
                    const suggestion = `Apply ${technique.toLowerCase()} for enhanced visual impact`;
                    if (!knowledgeSuggestions.includes(suggestion)) {
                        knowledgeSuggestions.push(suggestion);
                    }
                });
            }
        });

        // Get AI-generated suggestions with enhanced context
        const enhancedContext = `${context}\n\nRELEVANT KNOWLEDGE: ${relevantKnowledge.join(' | ')}\nNARRATIVE TYPE: ${narrativeAnalysis.genre} (${narrativeAnalysis.emotionalTone})`;
        
        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: `Based on this narrative context and relevant cinematic knowledge, provide 2-3 specific suggestions for: "${currentQuestion}"

                Context: ${enhancedContext}
                
                Focus on actionable, technical suggestions that directly apply the relevant knowledge. Be concise and specific.`,
        });

        const aiSuggestions = aiResponse.text.split('\n').map(s => s.trim().replace(/^- /,'').replace(/^\* /,'')).filter(Boolean);
        
        // Combine knowledge-based and AI suggestions
        const allSuggestions = [...knowledgeSuggestions, ...aiSuggestions].slice(0, 5);
        
        return {
            suggestions: allSuggestions,
            relevantKnowledge
        };
    } catch (error) {
        handleAIServiceError(error, 'Knowledge-Based Suggestions');
        return { suggestions: [], relevantKnowledge: [] };
    }
};


export const enhanceShotPrompt = async (basePrompt: string, context: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `You are a world-class cinematographer AI with a deep understanding of film theory and practice.
            Your task is to refine the following cinematic shot prompt.
            1.  Preserve all mission-critical technical settings from the base prompt (camera, lens, etc.).
            2.  Elevate the language to be more evocative, clear, and director-ready.
            3.  Weave in continuity cues from the provided context (previous shots, overall script).
            4.  Leverage advanced cinematic terminology from your knowledge base where appropriate to add professional depth.
            Return only the single, enhanced prompt, without any introductory text.

            CONTEXT:
            ${context}

            BASE PROMPT:
            ${basePrompt}`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return response.text;
    } catch (error) {
        handleAIServiceError(error, 'Shot Enhancement');
        throw new Error("Failed to enhance prompt.");
    }
};

export const generateStoryFromIdea = async (idea: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Based on this cinematic concept: "${idea}"\n\nGenerate 3-5 creative scene descriptions that expand this idea into vivid, director-level prompts. Each should be 1-2 sentences and capture mood, character, and visual atmosphere. Format them as separate paragraphs, separated by a double newline.`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const content = response.text;
        return content.split(/\n\n+/).map(scene => scene.trim()).filter(Boolean);
    } catch (error) {
        handleAIServiceError(error, 'Story Generation');
        return [];
    }
};

export const generateImage = async (prompt: string, aspectRatio: string = '16:9', style: 'cinematic' | 'explainer' = 'cinematic'): Promise<string> => {
    try {
      const stylePrefix = style === 'explainer'
        ? 'A clean, simple, engaging illustration for an explainer video. The style should be modern, with clear lines and friendly colors. Focus on communicating the core idea of the prompt clearly.'
        : 'Create a cinematic, photorealistic image based on the following detailed prompt. Emphasize mood, lighting, and composition.';

      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${stylePrefix} ${prompt}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });
  
      if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
      } else {
        throw new Error("No image was generated.");
      }
    } catch (error) {
      handleAIServiceError(error, 'Image Generation');
      throw new Error("Failed to generate image.");
    }
};

export const generateNanoImage = async (prompt: string, style: 'cinematic' | 'explainer' = 'cinematic'): Promise<string> => {
    try {
        const stylePrefix = style === 'explainer'
            ? 'A stylized, modern, and simple illustration for an explainer video. Focus on clarity, visual appeal, and effective communication of the core concept.'
            : 'A cinematic, stylized image based on the following detailed prompt. Emphasize mood, lighting, and composition.';
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: `${stylePrefix} ${prompt}` }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        // Sanitize response before processing
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("No candidates returned from API");
        }

        const firstCandidate = response.candidates[0];
        if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
            throw new Error("No content parts in response candidate");
        }

        for (const part of firstCandidate.content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image data found in response.");

    } catch (error) {
        handleAIServiceError(error, 'Nano Image Generation');
        throw new Error("Failed to generate nano image.");
    }
};

export const generateStoryboard = async (script: string, style: 'cinematic' | 'explainer' = 'cinematic', customInstructions: string = ''): Promise<StoryboardShot[]> => {
    try {
        const instructionsSection = customInstructions.trim() 
            ? `\n\nCUSTOM INSTRUCTIONS:\n${customInstructions}\n\nPlease incorporate these specific instructions into your storyboard generation, adjusting the visual style, composition, lighting, and overall approach accordingly while maintaining the core narrative.`
            : '';

        const cinematicPrompt = `Act as a 'Professional Storyboard Maker'. Convert the following script into a visual storyboard. For each screenplay line, generate a detailed shot prompt representing 2.5-3 seconds of screen time. Break down long lines into multiple impactful shots. Suggest keyframes, advanced camera movements, framing, composition, and lighting mood. Maintain a professional, industry-standard tone.${instructionsSection}\n\nSCRIPT:\n${script}`;
        
        const explainerPrompt = `Act as an 'Explainer Video Storyboard Artist'. Your task is to break down the provided script into a sequence of shots for an engaging explainer video. Each shot should correspond to roughly 3-3.5 seconds of narration. Assuming an average speaking rate of 150 words per minute (2.5 words per second), each shot should visualize a segment of about 8-9 words from the script. For each segment, create a clear shot description focusing on simple, effective visuals that illustrate the narration. The shot details should be geared towards clean, modern illustrations, not photorealism. Avoid complex cinematic jargon. The goal is clarity and communication.${instructionsSection}\n\nSCRIPT:\n${script}`;

        const prompt = style === 'explainer' ? explainerPrompt : cinematicPrompt;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            screenplayLine: { type: Type.STRING, description: "The formatted screenplay line (e.g., INT. ROOM - DAY, ACTION, CHARACTER, DIALOGUE)." },
                            shotDetails: {
                                type: Type.OBJECT,
                                properties: {
                                    shotType: { type: Type.STRING, description: "Shot Type/Size (e.g., Close-Up, Wide Shot)." },
                                    cameraAngle: { type: Type.STRING, description: "Camera Angle (e.g., Low Angle, Dutch Tilt)." },
                                    description: { type: Type.STRING, description: "Action/Subject Description." },
                                    lightingMood: { type: Type.STRING, description: "Key Lighting/Mood." },
                                    cameraMovement: { type: Type.STRING, description: "Camera movement (e.g., Dolly In, Pan Left, Steadicam Follow)." },
                                }
                            }
                        }
                    }
                },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        
        let jsonString = response.text.trim();

        // The API can sometimes wrap the JSON in markdown or other text. This robustly extracts the core JSON object or array.
        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        } else {
            const firstBracket = jsonString.indexOf('[');
            const firstBrace = jsonString.indexOf('{');
            let start = -1;
            if (firstBracket === -1) {
                start = firstBrace;
            } else if (firstBrace === -1) {
                start = firstBracket;
            } else {
                start = Math.min(firstBracket, firstBrace);
            }

            if (start !== -1) {
                const lastBracket = jsonString.lastIndexOf(']');
                const lastBrace = jsonString.lastIndexOf('}');
                const end = Math.max(lastBracket, lastBrace);
                if (end > start) {
                    jsonString = jsonString.substring(start, end + 1);
                }
            }
        }
        
        const parsedData = JSON.parse(jsonString);

        // Ensure the output is always an array, as the model sometimes returns a single object for a single shot.
        if (Array.isArray(parsedData)) {
            return parsedData;
        } else if (typeof parsedData === 'object' && parsedData !== null) {
            return [parsedData];
        }

        throw new Error("Failed to parse storyboard: result was not an array or object.");

    } catch (error) {
        handleAIServiceError(error, 'Storyboard Generation');
        throw new Error("Failed to generate or parse storyboard JSON from API response.");
    }
};

export const makeExplainerPromptCinematic = async (shot: StoryboardShot, knowledgeContext: string): Promise<StoryboardShot> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `You are a world-class Director of Photography, transforming a simple explainer video concept into a full-fledged cinematic shot.
            
            Analyze the provided simple shot description and the cinematic knowledge base. Your task is to completely rewrite the 'shotDetails' to be evocative, professional, and visually rich.
            
            - **Elevate the Language:** Use strong, descriptive verbs and professional cinematography terms.
            - **Incorporate Theory:** Weave in concepts from the knowledge base regarding lighting, composition, and camera movement.
            - **Add Specificity:** Suggest a specific lens, f-stop, or lighting setup if it serves the mood.
            - **Maintain Core Idea:** The cinematic shot must still convey the core subject of the original explainer shot.
            
            **CINEMATIC KNOWLEDGE BASE:**
            ---
            ${knowledgeContext.substring(0, 10000)} 
            ---
            
            **ORIGINAL EXPLAINER SHOT:**
            ${JSON.stringify(shot, null, 2)}
            
            Return ONLY the rewritten JSON for the entire StoryboardShot object, with the updated shotDetails. Do not include any other text or markdown formatting. The output must be a single, valid JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        screenplayLine: { type: Type.STRING, description: "The original, unchanged screenplay line." },
                        shotDetails: {
                            type: Type.OBJECT,
                            properties: {
                                shotType: { type: Type.STRING, description: "A more cinematic Shot Type/Size (e.g., 'Intimate Close-Up', 'Sweeping Wide Shot')." },
                                cameraAngle: { type: Type.STRING, description: "A more cinematic Camera Angle (e.g., 'Low Angle Reverence', 'Dutch Tilt for unease')." },
                                description: { type: Type.STRING, description: "A rewritten, evocative Action/Subject Description with more detail." },
                                lightingMood: { type: Type.STRING, description: "A specific and moody Key Lighting/Mood (e.g., 'Chiaroscuro with volumetric dust motes')." },
                                cameraMovement: { type: Type.STRING, description: "A more descriptive camera movement (e.g., 'Slow Dolly In to heighten tension', 'Steadicam Follow with a slight tremor')." },
                            },
                            required: ["shotType", "cameraAngle", "description", "lightingMood", "cameraMovement"]
                        }
                    },
                    required: ["screenplayLine", "shotDetails"]
                },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        handleAIServiceError(error, 'Make Prompt Cinematic');
        throw new Error("Failed to enhance explainer prompt into a cinematic one.");
    }
};

export const generateVideoPrompt = async (
    basePrompt: string,
    image?: { base64: string; mimeType: string; },
    userInstructions?: string
): Promise<string> => {
    try {
        let userPrompt: string;
        const contents: { parts: any[] } = { parts: [] };

        if (image) {
            userPrompt = `As a master cinematographer, analyze the provided still image and its original prompt. Your task is to generate a concise, powerful video prompt for a text-to-video AI (like Sora or Veo) that brings this static scene to life.

            ORIGINAL PROMPT:
            "${basePrompt}"

            USER INSTRUCTIONS FOR MOTION (if any):
            "${userInstructions || 'None provided. Use your creative expertise to suggest a compelling camera movement that enhances the scene\'s emotional core.'}"

            Based on the image's composition, mood, and the provided context, describe the initial action or subtle movement. Suggest a camera motion (e.g., slow dolly in, gentle pan left, static shot with atmospheric changes). Describe how the scene should evolve over a short clip.

            Return only the final video prompt, ready to be used.`;

            const imagePart = { inlineData: { mimeType: image.mimeType, data: image.base64 } };
            contents.parts.push(imagePart);
        } else {
            userPrompt = `As a master cinematographer, analyze the provided cinematic prompt. Your task is to generate a concise, powerful video prompt for a text-to-video AI (like Sora or Veo) that imagines this scene in motion.

            ORIGINAL PROMPT:
            "${basePrompt}"

            USER INSTRUCTIONS FOR MOTION (if any):
            "${userInstructions || 'None provided. Use your creative expertise to suggest a compelling camera movement that enhances the scene\'s emotional core.'}"

            Based on the prompt's description, mood, and technical details, describe a compelling camera motion (e.g., slow dolly in, gentle pan left, static shot with atmospheric changes) and any initial character or environmental action. Describe how the scene should evolve over a short clip.

            Return only the final video prompt, ready to be used.`;
        }
        
        contents.parts.push({ text: userPrompt });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: contents,
            config: { thinkingConfig: { thinkingBudget: 32768 } },
        });

        return response.text.trim();
    } catch (error) {
        handleAIServiceError(error, 'Video Prompt Generation');
        throw new Error("Failed to generate video prompt.");
    }
};

export const getTimelineSuggestion = async (context: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `You are Dreamer, an expert film editor AI grounded in cinematic theory (Walter Murch's Rule of Six, etc.). Analyze the provided storyboard context and suggest a professional, creative edit or transition.
            
            CONTEXT:
            ${context}
            
            Based on this, provide a single, actionable suggestion. For example: "Suggest a match cut from the character's hand to a similar shape in the next shot to create a strong visual link." or "A J-cut here would build anticipation before the reveal."
            
            Return only the suggestion.`,
            config: { thinkingConfig: { thinkingBudget: 32768 } },
        });
        return response.text.trim();
    } catch (error) {
        handleAIServiceError(error, 'Timeline Suggestion');
        return "Suggestion failed.";
    }
};

export const analyzeSequenceStyle = async (prompts: string[]): Promise<SequenceStyle> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Analyze the following cinematic shot prompts to determine the sequence's overall "Visual DNA".
            
            PROMPTS:
            ${prompts.join('\n\n')}
            
            Based on the prompts, provide a summary of the visual style, a likely color palette, and the dominant mood.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        visualDNA: { type: Type.STRING, description: "A summary of the core visual style (e.g., 'Handheld emotional realism with shallow depth of field')." },
                        colorPalette: { type: Type.STRING, description: "The likely color palette (e.g., 'Desaturated blues and cold tungsten highlights')." },
                        mood: { type: Type.STRING, description: "The dominant mood of the sequence (e.g., 'Melancholic and introspective')." },
                    },
                    required: ["visualDNA", "colorPalette", "mood"],
                },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        handleAIServiceError(error, 'Sequence Style Analysis');
        return { visualDNA: 'Analysis failed.', colorPalette: 'N/A', mood: 'N/A' };
    }
};

export const generateBrollPrompt = async (context: string, style: SequenceStyle | null): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Generate a concise, cinematic B-roll or establishing shot prompt. It should be atmospheric and relevant to the surrounding scene context.
            
            CONTEXT OF SURROUNDING SHOTS:
            ${context}
            
            ${style ? `Adhere to the established sequence style:
            - Visual DNA: ${style.visualDNA}
            - Color Palette: ${style.colorPalette}
            - Mood: ${style.mood}` : 'Establish a compelling visual mood.'}
            
            Return only the prompt text.`,
        });
        return response.text.trim();
    } catch (error) {
        handleAIServiceError(error, 'B-roll Generation');
        return "An atmospheric shot of rain on a window pane.";
    }
};

export const generateSmartVisualDescription = async (visuals: {
    composition: CompositionData,
    lighting: LightingData,
    color: ColorGradingData,
    camera: CameraMovementData,
}): Promise<string> => {
    try {
        const compositionDetails = visuals.composition.characters.length > 0
            ? `Characters are positioned as follows: ${visuals.composition.characters.map(c => `${c.name} at coordinates (X: ${Math.round(c.x)}, Y: ${Math.round(c.y)})`).join(', ')}.`
            : "There are no characters in the frame.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a master cinematographer. Based on the following structured visual data, write a single, evocative, cinematic paragraph describing the scene. Focus on composition, character placement, lighting mood, color theory, and camera work. Do not list the data; interpret it into a holistic description.

            DATA:
            - Composition: ${compositionDetails} The camera is at ${visuals.composition.cameraHeight} with a ${visuals.composition.cameraAngle} angle.
            - Lighting: The mood is ${visuals.lighting.mood}. Key light is at ${visuals.lighting.keyLightIntensity}% intensity with a color of ${visuals.lighting.keyLightColor}. The scene has a color temperature of ${visuals.lighting.colorTemperature}K.
            - Color: The grade is named "${visuals.color.colorGrade}" with a ${visuals.color.colorHarmony} harmony. Saturation is at ${visuals.color.saturation} and contrast is ${visuals.color.contrast}.
            - Camera Movement: The camera performs a ${visuals.camera.movementType} over ${visuals.camera.duration} seconds with ${visuals.camera.easing} easing, moving from (${visuals.camera.startPos.x}, ${visuals.camera.startPos.y}) to (${visuals.camera.endPos.x}, ${visuals.camera.endPos.y}). The focal length is ${visuals.camera.focalLength}mm.`,
        });
        return response.text.trim();
    } catch (error) {
        handleAIServiceError(error, 'Smart Visual Description');
        return "A visually compelling scene with detailed cinematography.";
    }
};

export const initializeVisualsFromStoryboardShot = async (shot: StoryboardShot): Promise<{
    composition: CompositionData,
    lighting: LightingData,
    color: ColorGradingData,
    camera: CameraMovementData,
}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a cinematic pre-visualization expert. Based on the following storyboard shot description, generate a complete set of initial visual parameters. Provide reasonable, professional starting points for a visual editor.

            SHOT DETAILS:
            - Shot Type: ${shot.shotDetails.shotType}
            - Camera Angle: ${shot.shotDetails.cameraAngle}
            - Description: ${shot.shotDetails.description}
            - Lighting Mood: ${shot.shotDetails.lightingMood}
            - Camera Movement: ${shot.shotDetails.cameraMovement}

            Return a JSON object with the exact structure specified below. Do not include any other text or markdown formatting. The output must be a single, valid JSON object.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        composition: {
                            type: Type.OBJECT,
                            properties: {
                                characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } }, description: "One or two default characters placed according to the description." },
                                cameraAngle: { type: Type.STRING, description: "One of the following: 'true-eye, honest', 'steep reverence', 'whispered low', 'Dutch slip'. Choose the most fitting." },
                                cameraHeight: { type: Type.STRING, description: "One of the following: 'ground-level soul gaze', 'eye-level witness', 'elevated guardian', 'angelic drift'. Choose the most fitting." },
                            },
                        },
                        lighting: {
                            type: Type.OBJECT,
                            properties: {
                                keyLightIntensity: { type: Type.NUMBER, description: "Value from 0-100." },
                                keyLightColor: { type: Type.STRING, description: "Hex color code." },
                                fillLightIntensity: { type: Type.NUMBER, description: "Value from 0-100." },
                                fillLightColor: { type: Type.STRING, description: "Hex color code." },
                                backLightIntensity: { type: Type.NUMBER, description: "Value from 0-100." },
                                backLightColor: { type: Type.STRING, description: "Hex color code." },
                                ambientIntensity: { type: Type.NUMBER, description: "Value from 0-100." },
                                colorTemperature: { type: Type.NUMBER, description: "Value from 2000-8000." },
                                mood: { type: Type.STRING, description: "The provided lighting mood string." },
                            },
                        },
                        color: {
                            type: Type.OBJECT,
                            properties: {
                                colorGrade: { type: Type.STRING, description: "A creative name for the color grade." },
                                saturation: { type: Type.NUMBER, description: "Value from -50 to 50." },
                                contrast: { type: Type.NUMBER, description: "Value from -50 to 50." },
                                highlights: { type: Type.NUMBER, description: "Value from -50 to 50." },
                                shadows: { type: Type.NUMBER, description: "Value from -50 to 50." },
                                colorPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 8 hex color codes." },
                                colorHarmony: { type: Type.STRING, description: "One of the predefined harmony options." },
                            },
                        },
                        camera: {
                            type: Type.OBJECT,
                            properties: {
                                movementType: { type: Type.STRING, description: "One of the predefined movement types." },
                                startPos: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                                endPos: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                                duration: { type: Type.NUMBER },
                                easing: { type: Type.STRING, description: "One of 'linear', 'ease-in', 'ease-out', 'ease-in-out'." },
                                focalLength: { type: Type.NUMBER, description: "A common focal length like 24, 35, 50, 85." },
                            },
                        },
                    },
                },
            },
        });
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);

        if (!parsed.composition.characters || parsed.composition.characters.length === 0) {
            parsed.composition.characters = [{ id: 'char-1', name: 'Subject A', x: 400, y: 225 }];
        }
        parsed.composition.characters.forEach((c: CompositionCharacter) => {
            if (!c.id) c.id = `char-${Math.random()}`;
        });

        return parsed;
    } catch (error) {
        handleAIServiceError(error, 'Visual Initialization');
        return {
            composition: clone(defaultComposition),
            lighting: clone(defaultLighting),
            color: clone(defaultColorGrading),
            camera: clone(defaultCameraMovement),
        };
    }
};

// ========================================================================
// SOUND DESIGN MODULE SERVICES
// ========================================================================

export const analyzeSoundMood = async (sceneDescription: string, visualMood: string): Promise<AudioMoodTag[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As a professional sound designer, analyze this scene and suggest appropriate audio mood tags.

SCENE DESCRIPTION:
${sceneDescription}

VISUAL MOOD:
${visualMood}

Choose 2-3 most fitting audio moods from: ambient, tense, romantic, epic, mysterious, action, suspense.
Return only the mood tags as a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        handleAIServiceError(error, 'Sound Mood Analysis');
        return ['ambient'];
    }
};

export const generateSoundSuggestions = async (
    sceneDescription: string,
    mood: AudioMoodTag[],
    cameraMovement: string,
    lighting: string
): Promise<AudioSuggestion[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `As a professional sound designer, suggest 5-7 specific sound elements for this cinematic scene.

SCENE DESCRIPTION: ${sceneDescription}
AUDIO MOOD: ${mood.join(', ')}
CAMERA MOVEMENT: ${cameraMovement}
LIGHTING: ${lighting}

For each sound suggestion, provide:
- A unique ID (use timestamp-based)
- Category (environmental, musical, sfx, atmospheric)
- Detailed description of the sound
- Duration in seconds
- Primary mood tag

Return as a JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            category: { type: Type.OBJECT, properties: {
                                name: { type: Type.STRING },
                                type: { type: Type.STRING }
                            }},
                            description: { type: Type.STRING },
                            duration: { type: Type.NUMBER },
                            mood: { type: Type.STRING }
                        }
                    }
                },
                thinkingConfig: { thinkingBudget: 16384 }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        handleAIServiceError(error, 'Sound Suggestions Generation');
        return [];
    }
};

export const generateFoleySuggestions = async (
    characters: string[],
    sceneDescription: string,
    actions: string
): Promise<FoleySuggestion[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `As a professional foley artist, suggest specific sound effects for this scene.

CHARACTERS: ${characters.join(', ')}
SCENE: ${sceneDescription}
ACTIONS: ${actions}

For each foley suggestion, provide:
- ID (timestamp-based)
- Character name
- Sound effect description
- Timing (e.g., "continuous", "at 2.5s", "during movement")
- Detailed description

Focus on character-specific sounds: footsteps, clothing rustle, object interactions, breathing, etc.

Return as a JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            characterName: { type: Type.STRING },
                            soundEffect: { type: Type.STRING },
                            timing: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                },
                thinkingConfig: { thinkingBudget: 16384 }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        handleAIServiceError(error, 'Foley Suggestions Generation');
        return [];
    }
};

// ========================================================================
// CASTING ASSISTANT SERVICES
// ========================================================================

export const analyzeCharacter = async (
    characterName: string,
    description: string,
    dialogueSamples?: string
): Promise<CharacterAnalysis> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `As a professional casting director, analyze this character and provide detailed casting specifications.

CHARACTER NAME: ${characterName}
DESCRIPTION: ${description}
${dialogueSamples ? `DIALOGUE SAMPLES:\n${dialogueSamples}` : ''}

Provide comprehensive character analysis including:
- Age range (18-25, 26-35, 36-45, 46-55, 56-65, 65+)
- Gender (male, female, non-binary, any)
- Ethnicity options (provide array: caucasian, african, asian, hispanic, middle-eastern, mixed, any)
- Physical traits (height description, build: slim/athletic/average/muscular/plus-size, distinctive features)
- Personality traits (array of traits)
- Acting style requirements (array of styles)

Return as structured JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        ageRange: { type: Type.STRING },
                        gender: { type: Type.STRING },
                        ethnicity: { type: Type.ARRAY, items: { type: Type.STRING } },
                        physicalTraits: {
                            type: Type.OBJECT,
                            properties: {
                                height: { type: Type.STRING },
                                build: { type: Type.STRING },
                                distinctiveFeatures: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        },
                        personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actingStyle: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                },
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        handleAIServiceError(error, 'Character Analysis');
        return {
            name: characterName,
            ageRange: '26-35',
            gender: 'any',
            ethnicity: ['any'],
            physicalTraits: {
                build: 'average',
                distinctiveFeatures: []
            },
            personalityTraits: [],
            actingStyle: []
        };
    }
};

export const generateCastingSuggestions = async (
    character: CharacterAnalysis,
    sceneContext: string,
    diversityFocus: boolean = true
): Promise<CastingSuggestion> => {
    try {
        const diversityPrompt = diversityFocus 
            ? "IMPORTANT: Prioritize diverse casting options across different ethnicities, body types, and backgrounds. Include at least 3-4 different ethnicity options."
            : "";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `As a professional casting director committed to inclusive casting, provide 5-6 diverse casting suggestions for this character.

CHARACTER ANALYSIS:
${JSON.stringify(character, null, 2)}

SCENE CONTEXT:
${sceneContext}

${diversityPrompt}

For each casting suggestion, provide:
- A detailed actor description (do NOT name real actors, describe archetype)
- Age range
- Physical description emphasizing diversity
- Acting notes and approach
- Specific diversity consideration (explain how this choice enhances representation)

Return as structured JSON with an array of suggestions.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        characterName: { type: Type.STRING },
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    ageRange: { type: Type.STRING },
                                    physicalDescription: { type: Type.STRING },
                                    actingNotes: { type: Type.STRING },
                                    diversityConsideration: { type: Type.STRING }
                                }
                            }
                        }
                    }
                },
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        const result = JSON.parse(response.text.trim());
        return {
            id: crypto.randomUUID(),
            ...result
        };
    } catch (error) {
        handleAIServiceError(error, 'Casting Suggestions Generation');
        return {
            id: crypto.randomUUID(),
            characterName: character.name,
            suggestions: []
        };
    }
};
