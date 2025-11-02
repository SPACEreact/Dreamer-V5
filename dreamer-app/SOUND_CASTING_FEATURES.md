# Sound Design Module & Casting Assistant - Feature Documentation

## Overview
This document describes the newly implemented Sound Design Module and Casting Assistant features for the Dreamer Cinematic Prompt Builder application.

## Sound Design Module

### Location
Accessible via the "Sound" tab in the Visual Sequence Editor when editing a shot.

### Features

#### 1. Audio Mood Analysis
- **Automatic Mood Detection**: AI analyzes the scene description and visual mood to suggest appropriate audio moods
- **Available Moods**:
  - Ambient (calm, atmospheric)
  - Tense (suspenseful, urgent)
  - Romantic (intimate, emotional)
  - Epic (grand, powerful)
  - Mysterious (enigmatic, unknown)
  - Action (energetic, fast-paced)
  - Suspense (anticipatory, dramatic)
- **Visual Indicators**: Each mood has a unique color gradient and icon for easy identification

#### 2. Sound Suggestions
- **AI-Generated Recommendations**: Based on scene description, selected moods, camera movement, and lighting
- **Categories**:
  - Environmental (wind, rain, urban ambience, nature)
  - Musical (orchestral, electronic, acoustic, jazz)
  - Sound Effects (footsteps, doors, technology, vehicles)
  - Atmospheric (soundscapes, background ambience)
- **Details**: Each suggestion includes duration, category type, and detailed description
- **Playback Controls**: Preview button for each sound (visual only - actual audio playback would require integration with audio generation service)

#### 3. Foley Suggestions
- **Character-Specific Effects**: AI generates foley recommendations based on characters in the scene
- **Timing Information**: Precise timing for when each effect should occur
- **Types**: Footsteps, clothing rustle, object interactions, breathing, movement sounds
- **Integration**: Automatically uses character names from the composition editor

### Usage Workflow
1. Navigate to Visual Sequence Editor
2. Select a shot from the timeline
3. Click the "Sound" tab
4. Click "Analyze Mood" to get AI-suggested audio moods
5. Select or adjust mood tags as desired
6. Click "Generate Suggestions" to get sound recommendations
7. Click "Generate Foley" to get character-specific sound effects
8. Remove unwanted suggestions using the X button
9. Use suggestions to inform your audio production workflow

### Technical Implementation
- **AI Service**: Uses Gemini 2.5 Pro for comprehensive sound analysis
- **State Management**: Sound data stored per timeline item ID
- **Type Safety**: Full TypeScript support with defined interfaces
- **Real-time Updates**: Changes immediately reflected in the UI

---

## Casting Assistant

### Location
Accessible via the "Casting" tab in the Visual Sequence Editor when editing a shot.

### Features

#### 1. Character Analysis
- **AI-Powered Profiling**: Analyzes character descriptions to extract casting specifications
- **Analysis Includes**:
  - Age range (18-25, 26-35, 36-45, 46-55, 56-65, 65+)
  - Gender (male, female, non-binary, any)
  - Ethnicity options (multiple selections supported)
  - Physical traits (height, build, distinctive features)
  - Personality traits
  - Acting style requirements

#### 2. Diverse Casting Suggestions
- **Inclusive by Default**: Prioritizes diverse casting options across ethnicities, body types, and backgrounds
- **Diversity Focus Toggle**: Option to emphasize or de-emphasize diversity in suggestions
- **Detailed Profiles**: Each suggestion includes:
  - Actor archetype description (no real actor names - focuses on characteristics)
  - Age range
  - Physical description emphasizing diversity
  - Acting notes and approach recommendations
  - Specific diversity consideration explaining representation value

#### 3. Character Management
- **Auto-Detection**: Automatically detects characters from composition editor
- **Custom Characters**: Add additional characters with custom descriptions
- **Flexible Analysis**: Can analyze based on scene description or custom character notes

### Usage Workflow
1. Navigate to Visual Sequence Editor
2. Select a shot from the timeline
3. Click the "Casting" tab
4. Characters from the composition editor appear automatically
5. Click on a character to analyze their profile
6. Optionally add custom characters with specific descriptions
7. Review the AI-generated character analysis
8. Click "Generate Diverse Casting Suggestions"
9. Review 5-6 diverse casting options with detailed profiles
10. Use suggestions to inform your casting decisions

### Diversity & Inclusion Features
- **Multiple Ethnicity Options**: Each character analysis suggests multiple appropriate ethnicities
- **Body Type Diversity**: Includes various builds (slim, athletic, average, muscular, plus-size)
- **Gender Inclusivity**: Supports non-binary and gender-flexible casting
- **Accessibility Considerations**: Character analysis can include accessibility requirements
- **Representation Rationale**: Each suggestion explains how it enhances representation

### Technical Implementation
- **AI Service**: Uses Gemini 2.5 Pro for nuanced character analysis and casting suggestions
- **State Management**: Casting data stored per timeline item ID
- **Type Safety**: Comprehensive TypeScript interfaces for all casting data
- **Context-Aware**: Uses scene description and visual elements to inform suggestions

---

## Integration with Existing Workflow

Both features integrate seamlessly into the existing Visual Sequence Editor:

1. **Tab-Based Access**: Added as new tabs alongside Composition, Lighting, Color, and Camera
2. **Per-Shot Data**: Each shot can have unique sound design and casting data
3. **State Persistence**: Data is maintained as users navigate between shots
4. **Non-Destructive**: Adding sound or casting data doesn't affect existing visual settings

## Data Flow

### Sound Design
```
Scene Description + Visual Mood → AI Analysis → Audio Mood Tags
Selected Moods + Scene Context → AI Generation → Sound Suggestions
Characters + Actions → AI Generation → Foley Suggestions
```

### Casting Assistant
```
Character Name + Scene Description → AI Analysis → Character Profile
Character Profile + Scene Context → AI Generation → Casting Suggestions (with diversity focus)
```

## Future Enhancements

### Sound Design
- Integration with audio generation APIs for actual sound previews
- Audio timeline visualization
- Sound mixing controls
- Export to audio production software

### Casting Assistant
- Integration with casting databases
- Photo reference generation
- Casting budget estimation
- Availability tracking

---

## Technical Notes

### Dependencies
- All features use existing project dependencies (no new packages required)
- Google Gemini API for AI-powered analysis
- Framer Motion for animations
- Lucide React for icons

### Performance
- AI requests are optimized for speed (using appropriate model tiers)
- State updates are batched to prevent unnecessary re-renders
- Components use React.memo where appropriate

### Type Safety
All new features include comprehensive TypeScript definitions:
- `AudioMoodTag`, `SoundDesignData`, `SoundCategory`, `AudioSuggestion`, `FoleySuggestion`
- `CharacterAnalysis`, `CastingSuggestion`, `CastingData`, `AgeRange`, `Gender`, `Ethnicity`, `PhysicalBuild`

---

## Support

For questions or issues with these features, refer to:
- Type definitions: `/src/types.ts`
- Component implementations: `/src/components/SoundDesignModule.tsx`, `/src/components/CastingAssistant.tsx`
- AI services: `/src/services/geminiService.ts`

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-01  
**Author**: MiniMax Agent
