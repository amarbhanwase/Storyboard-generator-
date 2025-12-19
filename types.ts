
export interface Scene {
  id: string;
  timecode: string;
  title: string;
  action: string;
  dialogue?: string;
  visualPrompt: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface Storyboard {
  title: string;
  scenes: Scene[];
}

export type GenerationMode = 'image' | 'video';

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  STORYBOARDING = 'STORYBOARDING',
  VIEWING = 'VIEWING'
}
