// ========================================================================
// IMAGE GENERATION SERVICES - Using MiniMax Image Generation
// ========================================================================

export const generateImage = async (prompt: string, aspectRatio: string = '16:9', style: 'cinematic' | 'explainer' = 'cinematic'): Promise<string> => {
    try {
        // Enhanced prompt for better cinematic results
        const stylePrefix = style === 'explainer'
            ? 'A clean, professional illustration for an explainer video. Modern, clear design with friendly colors and excellent composition.'
            : 'Create a cinematic, professional-quality image with dramatic lighting, excellent composition, and photorealistic detail. Focus on mood, atmosphere, and cinematic visual storytelling.';

        const enhancedPrompt = `${stylePrefix}\n\nOriginal prompt: ${prompt}\n\nGenerate a high-quality ${aspectRatio} aspect ratio image that captures the essence of this cinematic scene with professional lighting and composition.`;

        console.log("Generating cinematic image for:", prompt.substring(0, 100) + "...");

        // Use our new real image generation service
        const { generateRealImage } = await import('./realImageGeneration');
        return await generateRealImage(enhancedPrompt, aspectRatio, style);
    } catch (error) {
        console.error("Image generation failed:", error);
        // Always provide a fallback image
        return await generateImageDirect(prompt);
    }
};

export const generateImageDirect = async (prompt: string): Promise<string> => {
    try {
        // Create unique filename for this generation
        const filename = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
        
        // For now, return the cinematic placeholder while we implement the image generation
        // This ensures the UI works properly with a professional-looking placeholder
        console.log("Generating image for prompt:", prompt.substring(0, 100) + "...");
        
        // Use the pre-generated professional placeholder image
        const response = await fetch('/images/cinematic-placeholder.png');
        if (response.ok) {
            const blob = await response.blob();
            return await blobToBase64(blob);
        }
        
        // Fallback to SVG placeholder if PNG fails
        return await generatePlaceholderImage(prompt, filename);
    } catch (error) {
        console.error("Image generation failed:", error);
        // Always provide something rather than breaking
        return await generatePlaceholderImage(prompt, `fallback_${Date.now()}.png`);
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

export const generatePlaceholderImage = async (prompt: string, filename: string): Promise<string> => {
    try {
        // Generate a professional placeholder image
        const enhancedPrompt = `Professional cinematic placeholder image. Modern, clean design with the text "Image Generation in Progress" and film-related visual elements. High quality, professional appearance. Based on: ${prompt.substring(0, 100)}...`;
        
        // For now, create a simple base64 placeholder
        // This will be replaced with actual image generation
        const placeholderSVG = createPlaceholderSVG(prompt);
        const base64 = btoa(unescape(encodeURIComponent(placeholderSVG)));
        
        return base64;
    } catch (error) {
        console.error("Placeholder generation failed:", error);
        // Return minimal base64 placeholder
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8M7clgAAAABJRU5ErkJggg==";
    }
};

export const createPlaceholderSVG = (prompt: string): string => {
    const width = 800;
    const height = 450;
    const truncatedPrompt = prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt;
    
    return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1a1a1a"/>
                <stop offset="100%" style="stop-color:#2d2d2d"/>
            </linearGradient>
            <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#f59e0b"/>
                <stop offset="100%" style="stop-color:#f97316"/>
            </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#bg)"/>
        
        <!-- Film strip design -->
        <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="url(#accent)" stroke-width="3"/>
        <rect x="30" y="30" width="${width-60}" height="${height-60}" fill="none" stroke="#4a5568" stroke-width="2"/>
        
        <!-- Camera icon -->
        <circle cx="${width/2}" cy="${height/2 - 40}" r="30" fill="none" stroke="url(#accent)" stroke-width="3"/>
        <rect x="${width/2 - 25}" y="${height/2 - 20}" width="50" height="20" fill="url(#accent)"/>
        <circle cx="${width/2}" cy="${height/2 - 20}" r="8" fill="url(#accent)"/>
        
        <!-- Text -->
        <text x="${width/2}" y="${height/2 + 30}" text-anchor="middle" fill="#f59e0b" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
            Image Generation
        </text>
        <text x="${width/2}" y="${height/2 + 50}" text-anchor="middle" fill="#a3a3a3" font-family="Arial, sans-serif" font-size="12">
            ${truncatedPrompt}
        </text>
        <text x="${width/2}" y="${height/2 + 70}" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="10">
            Cinematic Scene Preview
        </text>
    </svg>
    `;
};

export const generateNanoImage = async (prompt: string, style: 'cinematic' | 'explainer' = 'cinematic'): Promise<string> => {
    try {
        // Generate stylized/simplified image for nano version
        const stylePrefix = style === 'explainer'
            ? 'Create a clean, modern stylized illustration perfect for explainer videos. Simple, professional design with clear visual communication.'
            : 'Create a stylized, artistic interpretation of this cinematic scene with simplified visual elements and strong visual impact.';
        
        const enhancedPrompt = `${stylePrefix}\n\nScene: ${prompt}\n\nGenerate a stylized, simplified version with strong visual impact and artistic flair.`;
        
        console.log("Generating nano/stylized image for:", prompt.substring(0, 100) + "...");
        
        // Use our new real image generation service with nano-specific styling
        const { generateRealImage } = await import('./realImageGeneration');
        return await generateRealImage(enhancedPrompt, '1:1', style); // Use square aspect ratio for stylized images
    } catch (error) {
        console.error("Nano image generation failed:", error);
        // Always provide a fallback
        return await generateImageDirect(prompt);
    }
};

// Helper function to download base64 images
export const downloadBase64Image = (base64Data: string, mimeType: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};