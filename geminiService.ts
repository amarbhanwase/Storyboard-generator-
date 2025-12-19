
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Scene, GenerationMode } from './types';

export const analyzeStory = async (storyText: string, mode: GenerationMode): Promise<{ title: string; scenes: Scene[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a world-class Cinematographer and Storyboard Artist.
    Analyze the provided story and break it down into professional storyboard scenes.
    
    Constraint: Each scene represents exactly 10 seconds of screen time.
    Provide a title for the project.
    For each scene, provide:
    1. A short title for the scene.
    2. A detailed description of the action.
    3. Any dialogue or sound effects.
    4. A HIGHLY DETAILED visual prompt for an image/video generation model. 
       The visual prompt should describe camera angle (e.g., low angle, medium shot), lighting (e.g., moody, golden hour), and specific visual elements.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Story: ${storyText}`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                action: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
              },
              required: ['title', 'action', 'visualPrompt'],
            },
          },
        },
        required: ['title', 'scenes'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  
  return {
    title: parsed.title || 'Untitled Project',
    scenes: (parsed.scenes || []).map((s: any, index: number) => ({
      id: `scene-${index}`,
      timecode: `${Math.floor(index * 10 / 60).toString().padStart(2, '0')}:${(index * 10 % 60).toString().padStart(2, '0')}`,
      title: s.title,
      action: s.action,
      dialogue: s.dialogue,
      visualPrompt: s.visualPrompt,
      mediaType: mode,
      status: 'pending',
    })),
  };
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Cinematic storyboard frame: ${prompt}. High quality, detailed lighting.` }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data received");
};

export const generateSceneVideo = async (prompt: string): Promise<string> => {
  // Check for selected API key (mandatory for Veo)
  const hasKey = await (window as any).aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await (window as any).aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic storyboard sequence (10 seconds): ${prompt}`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");
  
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};
