export interface Sample {
  id: string;
  name: string;
  url: string;
  duration: number;
  color: string;
  instanceId?: string;
}

export type SampleCategory = 'drums' | 'bass' | 'melody' | 'fills' | 'sfx';

export type TrackType = 'Drums' | 'Bass' | 'Melody' | 'Fills' | 'SFX';
