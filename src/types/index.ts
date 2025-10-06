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

export type SampleCategory = 'drums' | 'bass' | 'melody' | 'fills' | 'sfx';

export type TrackType = 'Drums' | 'Bass' | 'Melody' | 'Fills' | 'SFX';
