export interface Sample {
  id: string;
  name: string;
  url: string;
  type: TrackType; // <-- Added this property
  duration: number;
  color: string;
  offset?: number;
  instanceId?: string;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  volume: number;
  isMuted: boolean;
  isSoloed: boolean;
  slots: (Sample | null)[];
}

export interface Project {
  id: string;
  name: string;
  updated_at: string;
  project_data: any; // Can be refined later to match TrackStore state
}

export type SampleCategory = 'drums' | 'bass' | 'melody' | 'fills' | 'sfx';

export type TrackType = 'Drums' | 'Bass' | 'Melody' | 'Fills' | 'SFX';