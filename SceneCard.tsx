
import React from 'react';
import { Scene } from './types.ts';
import { RefreshCw, Clock, Play, AlertCircle } from 'lucide-react';

interface SceneCardProps {
  scene: Scene;
  onRegenerate: () => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onRegenerate }) => {
  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-all shadow-lg hover:shadow-indigo-500/5">
      {/* Visual Header */}
      <div className="aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center">
        {scene.status === 'completed' && scene.mediaUrl ? (
          scene.mediaType === 'image' ? (
            <img 
              src={scene.mediaUrl} 
              alt={scene.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
            />
          ) : (
            <video 
              src={scene.mediaUrl} 
              controls 
              className="w-full h-full object-cover"
            />
          )
        ) : scene.status === 'generating' ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Generating Visual...</span>
          </div>
        ) : scene.status === 'failed' ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <span className="text-xs font-medium text-red-400 uppercase tracking-widest">Generation Failed</span>
            <button 
              onClick={onRegenerate}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-md transition-colors mt-2"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
              <Play className="w-4 h-4 text-zinc-700" />
            </div>
            <span className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Waiting in Queue</span>
          </div>
        )}

        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span className="text-[10px] font-bold text-white tracking-wider uppercase">{scene.timecode}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div>
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">Scene: {scene.title}</h3>
          <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">{scene.action}</p>
        </div>

        {scene.dialogue && (
          <div className="bg-zinc-950/50 p-3 rounded-lg border-l-2 border-indigo-600 italic">
            <p className="text-xs text-zinc-400 font-serif">"{scene.dialogue}"</p>
          </div>
        )}

        <div className="pt-4 mt-auto border-t border-zinc-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Duration</span>
            <span className="text-xs text-zinc-300">10 Seconds</span>
          </div>
          
          {scene.status === 'completed' && (
             <button 
              onClick={onRegenerate}
              title="Regenerate Visual"
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-indigo-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
