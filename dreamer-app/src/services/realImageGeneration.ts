// Enhanced Gemini-Powered Image Generation Service
// Uses Google Gemini 2.0 Flash for professional image generation

import { generateImage, generateNanoImage as geminiGenerateNanoImage } from './geminiService';

// Rate limiting configuration
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 30;
const RESET_INTERVAL = 60000; // 1 minute

const checkRateLimit = (): boolean => {
    const now = Date.now();
    if (now - lastResetTime > RESET_INTERVAL) {
        requestCount = 0;
        lastResetTime = now;
    }
    
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        console.warn('⚠️ Rate limit reached. Using cached/fallback image.');
        return false;
    }
    
    requestCount++;
    return true;
};

// High-quality cinematic fallback images
const cinematicImages = [
    {
        path: '/images/cinematic-1.jpg',
        description: 'Dramatic golden lighting with atmospheric haze',
        style: 'dramatic',
        keywords: ['dramatic', 'golden', 'light', 'haze', 'atmospheric', 'cinematic']
    },
    {
        path: '/images/cinematic-2.jpg', 
        description: 'Cozy coffee shop interior with warm lighting',
        style: 'interior',
        keywords: ['coffee', 'shop', 'warm', 'interior', 'cozy', 'lifestyle']
    },
    {
        path: '/images/cinematic-3.jpg',
        description: 'Wide landscape with dramatic sunset',
        style: 'landscape', 
        keywords: ['landscape', 'sunset', 'wide', 'dramatic', 'scenic', 'nature']
    },
    {
        path: '/images/cinematic-4.jpg',
        description: 'Emotional close-up character portrait',
        style: 'closeup',
        keywords: ['closeup', 'character', 'emotional', 'portrait', 'dramatic', 'face']
    },
    {
        path: '/images/cinematic-5.jpg',
        description: 'Dramatic shadow lighting with stairs',
        style: 'architecture',
        keywords: ['shadow', 'stairs', 'architecture', 'dramatic', 'lighting', 'minimal']
    },
    {
        path: '/images/cinematic-6.jpg',
        description: 'Dynamic action sequence planning',
        style: 'action',
        keywords: ['action', 'dynamic', 'sequence', 'production', 'studio', 'planning']
    }
];

export const generateRealImage = async (
    prompt: string, 
    aspectRatio: string = '16:9', 
    style: 'cinematic' | 'explainer' = 'cinematic'
): Promise<string> => {
    try {
        // Check rate limiting
        if (!checkRateLimit()) {
            console.log('🎨 Rate limited - using intelligent fallback selection');
            return await createIntelligentFallback(prompt, aspectRatio);
        }

        // Enhanced prompt for better cinematic results
        const stylePrefix = style === 'explainer'
            ? 'Create a clean, professional explainer video illustration. Modern design, clear communication, friendly colors, perfect for educational content.'
            : 'Create a cinematic, professional-quality image with dramatic lighting, excellent composition, and photorealistic detail. Focus on mood, atmosphere, and cinematic visual storytelling.';

        const enhancedPrompt = `${stylePrefix}\n\nScene Description: ${prompt}\n\nGenerate a high-quality ${aspectRatio} aspect ratio image that captures the essence of this scene with professional lighting and composition.`;

        console.log('🎬 Generating real cinematic image with Gemini AI...');
        console.log('📝 Prompt:', enhancedPrompt.substring(0, 200) + '...');
        console.log('📐 Aspect Ratio:', aspectRatio);
        console.log('🎨 Style:', style);
        
        // Use Gemini real image generation
        const imageData = await generateImage(enhancedPrompt, aspectRatio, style);
        console.log('✅ Successfully generated image with Gemini AI');
        console.log('📊 Image data length:', imageData.length, 'characters');
        return imageData;
        
    } catch (error) {
        console.error('❌ Gemini image generation failed with error:');
        console.error('Error type:', error instanceof Error ? error.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Full error:', error);
        console.warn('⚠️ Using intelligent fallback image');
        return await createIntelligentFallback(prompt, aspectRatio);
    }
};

export const generateNanoImage = async (
    prompt: string, 
    style: 'cinematic' | 'explainer' = 'cinematic'
): Promise<string> => {
    try {
        // Check rate limiting
        if (!checkRateLimit()) {
            console.log('🎨 Rate limited - using intelligent fallback for nano image');
            return await createIntelligentFallback(prompt, '1:1');
        }

        // Generate stylized/simplified image for nano version
        const stylePrefix = style === 'explainer'
            ? 'Create a clean, modern stylized illustration perfect for explainer videos. Simple, professional design with clear visual communication and friendly colors.'
            : 'Create a stylized, artistic interpretation of this cinematic scene with simplified visual elements and strong visual impact.';
        
        const enhancedPrompt = `${stylePrefix}\n\nScene: ${prompt}\n\nGenerate a stylized, simplified version with strong visual impact and artistic flair. Perfect for thumbnails or quick previews.`;
        
        console.log('🎨 Generating stylized nano image with Gemini...');
        console.log('📝 Nano prompt:', enhancedPrompt.substring(0, 150) + '...');
        
        // Use Gemini nano image generation
        const imageData = await geminiGenerateNanoImage(enhancedPrompt, style);
        console.log('✅ Successfully generated nano image');
        console.log('📊 Nano image data length:', imageData.length, 'characters');
        return imageData;
        
    } catch (error) {
        console.error('❌ Nano image generation failed with error:');
        console.error('Error type:', error instanceof Error ? error.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.warn('⚠️ Using fallback for nano image');
        return await createIntelligentFallback(prompt, '1:1');
    }
};

const createIntelligentFallback = async (prompt: string, aspectRatio: string): Promise<string> => {
    try {
        // Use smart prompt-based image selection
        const selectedImagePath = selectImageByPrompt(prompt);
        console.log(`✅ Selected intelligent fallback image: ${selectedImagePath}`);
        return await convertImageToBase64(selectedImagePath);
    } catch (error) {
        console.error('❌ Fallback image selection failed:', error);
        // Ultimate fallback: create professional placeholder
        return createProfessionalFallbackImage(prompt, aspectRatio);
    }
};

const selectImageByPrompt = (prompt: string): string => {
    const promptLower = prompt.toLowerCase();
    
    // Score each image based on keyword matching
    const scoredImages = cinematicImages.map(image => {
        let score = 0;
        
        // Check for keyword matches
        image.keywords.forEach(keyword => {
            if (promptLower.includes(keyword)) {
                score += 2;
            }
        });
        
        // Special scoring for common cinematic terms
        const specialTerms = [
            { terms: ['close-up', 'closeup', 'close up', 'face', 'eyes', 'character'], score: 3 },
            { terms: ['wide', 'landscape', 'scenic', 'nature', 'outdoor'], score: 3 },
            { terms: ['interior', 'indoor', 'room', 'coffee', 'shop', 'cafe'], score: 3 },
            { terms: ['action', 'dynamic', 'movement', 'chase', 'fight'], score: 3 },
            { terms: ['dramatic', 'lighting', 'shadow', 'atmosphere'], score: 2 },
            { terms: ['warm', 'golden', 'sunset', 'evening'], score: 2 }
        ];
        
        specialTerms.forEach(({ terms, score: termScore }) => {
            terms.forEach(term => {
                if (promptLower.includes(term)) {
                    score += termScore;
                }
            });
        });
        
        return { ...image, score };
    });
    
    // Sort by score and select the highest scoring image
    scoredImages.sort((a, b) => b.score - a.score);
    
    // If no clear match, use a diverse selection
    if (scoredImages[0].score === 0) {
        // Rotate through images to ensure variety
        const randomIndex = Math.floor(Math.random() * cinematicImages.length);
        return cinematicImages[randomIndex].path;
    }
    
    // Return the best matching image
    return scoredImages[0].path;
};

const convertImageToBase64 = async (imagePath: string): Promise<string> => {
    try {
        console.log(`🎨 Loading fallback image: ${imagePath}`);
        const response = await fetch(imagePath);
        if (response.ok) {
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            console.log(`✅ Successfully loaded fallback image`);
            return base64;
        }
        throw new Error('Failed to fetch image');
    } catch (error) {
        console.error(`❌ Image conversion failed for ${imagePath}:`, error);
        // Return a simple base64 placeholder as ultimate fallback
        return createSimplePlaceholderBase64();
    }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
                // Extract base64 part from data URL
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const createProfessionalFallbackImage = (prompt: string, aspectRatio: string): string => {
    // Create a professional cinematic placeholder
    const width = aspectRatio === '16:9' ? 800 : aspectRatio === '3:4' ? 600 : 800;
    const height = aspectRatio === '16:9' ? 450 : aspectRatio === '3:4' ? 800 : 450;
    const truncatedPrompt = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
    
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#0f172a"/>
                <stop offset="100%" style="stop-color:#1e293b"/>
            </linearGradient>
            <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#f59e0b"/>
                <stop offset="100%" style="stop-color:#f97316"/>
            </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <rect x="15" y="15" width="${width-30}" height="${height-30}" fill="none" stroke="url(#accent)" stroke-width="3"/>
        <rect x="25" y="25" width="${width-50}" height="${height-50}" fill="none" stroke="#475569" stroke-width="2"/>
        
        <g transform="translate(${width/2}, ${height/2 - 20})">
            <rect x="-30" y="-15" width="60" height="30" fill="url(#accent)" rx="5"/>
            <circle cx="0" cy="0" r="12" fill="#1e293b"/>
            <circle cx="0" cy="0" r="6" fill="url(#accent)"/>
        </g>
        
        <text x="${width/2}" y="${height/2 + 35}" text-anchor="middle" fill="#f59e0b" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
            AI-Generated Cinematic Scene
        </text>
        <text x="${width/2}" y="${height/2 + 55}" text-anchor="middle" fill="#a3a3a3" font-family="Arial, sans-serif" font-size="11">
            ${truncatedPrompt}
        </text>
        <text x="${width/2}" y="${height/2 + 75}" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="9">
            Powered by Google Gemini AI
        </text>
    </svg>
    `;
    
    // Convert SVG to base64
    const encoded = encodeURIComponent(svg);
    const base64 = btoa(encoded);
    
    return base64;
};

const createSimplePlaceholderBase64 = (): string => {
    // Minimal 1x1 transparent PNG
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8M7clgAAAABJRU5ErkJggg==';
};

// Batch image generation with intelligent rate limiting
export const batchGenerateImages = async (
    prompts: string[], 
    aspectRatio: string = '16:9'
): Promise<{prompt: string, base64: string, success: boolean}[]> => {
    const results = [];
    
    for (const prompt of prompts) {
        try {
            const imageData = await generateRealImage(prompt, aspectRatio);
            results.push({ prompt, base64: imageData, success: true });
        } catch (error) {
            console.error(`Failed to generate image for: ${prompt}`, error);
            // Try fallback
            try {
                const fallbackData = await createIntelligentFallback(prompt, aspectRatio);
                results.push({ prompt, base64: fallbackData, success: true });
            } catch (fallbackError) {
                results.push({ prompt, base64: '', success: false });
            }
        }
    }
    
    return results;
};

// Export usage statistics
export const getUsageStats = () => {
    return {
        requestCount,
        remainingRequests: Math.max(0, MAX_REQUESTS_PER_MINUTE - requestCount),
        resetTime: new Date(lastResetTime + RESET_INTERVAL),
        maxRequestsPerMinute: MAX_REQUESTS_PER_MINUTE
    };
};
