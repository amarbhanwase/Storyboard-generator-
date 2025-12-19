
import React, { useState } from 'react';
import { analyzeStory, generateSceneImage, generateSceneVideo } from './geminiService.ts';
import { Scene, Storyboard, AppState, GenerationMode } from './types.ts';
import SceneCard from './SceneCard.tsx';
import { Camera, Film, Send, RefreshCw, Layers, Layout, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [storyText, setStoryText] = useState('');
  const [mode, setMode] = useState<GenerationMode>('image');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartGeneration = async () => {
    if (!storyText.trim()) return;
    
    setError(null);
    setAppState(AppState.ANALYZING);
    
    try {
      const result = await analyzeStory(storyText, mode);
      setStoryboard(result);
      setAppState(AppState.STORYBOARDING);
      
      // Process scenes one by one to avoid race conditions and provide feedback
      for (let i = 0; i < result.scenes.length; i++) {
        await triggerSceneGeneration(i, result, mode);
      }
      setAppState(AppState.VIEWING);
    } catch (err: any) {
      console.error(err);
      setError('Failed to analyze the story. Please try again.');
      setAppState(AppState.IDLE);
    }
  };

  const triggerSceneGeneration = async (index: number, currentStoryboard: Storyboard, currentMode: GenerationMode) => {
    // 1. Set status to generating
    setStoryboard(prev => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[index] = { ...newScenes[index], status: 'generating' };
      return { ...prev, scenes: newScenes };
    });

    try {
      const scene = currentStoryboard.scenes[index];
      const mediaUrl = currentMode === 'image' 
        ? await generateSceneImage(scene.visualPrompt)
        : await generateSceneVideo(scene.visualPrompt);

      // 2. Set status to completed with the resulting URL
      setStoryboard(prev => {
        if (!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[index] = {
          ...newScenes[index],
          mediaUrl,
          status: 'completed'
        };
        return { ...prev, scenes: newScenes };
      });
    } catch (err) {
      console.error('Generation failed for scene', index, err);
      // 3. Set status to failed so user can retry
      setStoryboard(prev => {
        if (!prev) return null;
        const newScenes = [...prev.scenes];
        newScenes[index] = { ...newScenes[index], status: 'failed' };
        return { ...prev, scenes: newScenes };
      });
    }
  };

  const handleRegenerateScene = async (index: number) => {
    if (!storyboard) return;
    await triggerSceneGeneration(index, storyboard, mode);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setStoryboard(null);
    setStoryText('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">CineBoard</h1>
          </div>
          
          {appState !== AppState.IDLE && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {appState === AppState.IDLE && (
          <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-serif">Visualize Your Imagination</h2>
              <p className="text-zinc-400 text-lg">Input your story and our AI will architect a 10-second-per-scene storyboard with high-fidelity visuals.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Once upon a time in a cyberpunk metropolis, a lone detective discovers a forgotten memory chip..."
                className="w-full h-48 bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-zinc-600 outline-none"
              />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800 mt-4">
                <div className="flex bg-zinc-800/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setMode('image')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${mode === 'image' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Storyboard Sketches</span>
                  </button>
                  <button 
                    onClick={() => setMode('video')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${mode === 'video' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Cinematic Vibe</span>
                  </button>
                </div>

                <button
                  onClick={handleStartGeneration}
                  disabled={!storyText.trim() || appState !== AppState.IDLE}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Send className="w-4 h-4" />
                  Generate Storyboard
                </button>
              </div>
              {error && <p className="mt-4 text-red-500 text-sm text-center font-medium">{error}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <FeatureCard icon={<Layers className="w-6 h-6 text-indigo-400" />} title="Perfect Pacing" description="Every scene is precisely 10 seconds, helping you pre-visualize tempo." />
              <FeatureCard icon={<Layout className="w-6 h-6 text-indigo-400" />} title="Pro Prompting" description="Gemini Pro generates cinematographic prompts automatically." />
              <FeatureCard icon={<RefreshCw className="w-6 h-6 text-indigo-400" />} title="Visual Power" description="Powered by Gemini Flash Image and Veo Video for stunning frames." />
            </div>
          </div>
        )}

        {(appState === AppState.ANALYZING || appState === AppState.STORYBOARDING || appState === AppState.VIEWING) && storyboard && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-8">
              <div>
                <p className="text-indigo-400 font-medium uppercase tracking-widest text-xs mb-2">Storyboard Output</p>
                <h2 className="text-4xl font-serif">{storyboard.title}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${appState === AppState.VIEWING ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'}`}>
                  {appState === AppState.ANALYZING ? 'Analyzing Story...' : appState === AppState.STORYBOARDING ? 'Generating Visuals...' : 'Generation Complete'}
                </span>
                <span className="text-zinc-500 text-sm">{storyboard.scenes.length} Scenes ({(storyboard.scenes.length * 10 / 60).toFixed(1)}m total)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {storyboard.scenes.map((scene, idx) => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  onRegenerate={() => handleRegenerateScene(idx)} 
                />
              ))}
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
        <p>© 2024 CineBoard AI. Built for filmmakers and storytellers.</p>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center text-center space-y-3">
    <div className="mb-2">{icon}</div>
    <h3 className="font-semibold text-zinc-200">{title}</h3>
    <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
  </div>
);

export default App;
