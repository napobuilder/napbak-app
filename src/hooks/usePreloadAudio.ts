import { useEffect } from 'react';
import { useTrackStore } from '../store/useTrackStore';
import { useAudioEngine } from '../store/useAudioEngine';
import type { Sample } from '../types';

export const usePreloadAudio = () => {
  const { tracks } = useTrackStore();
  const { loadAudioBuffer } = useAudioEngine();

  useEffect(() => {
    // Pre-load audio for samples from persisted state on initial mount
    const allSamples = tracks.flatMap(track => track.slots).filter(Boolean) as Sample[];
    const uniqueUrls = new Set(allSamples.map(sample => sample.url));
    
    if (uniqueUrls.size > 0) {
      console.log(`Pre-loading ${uniqueUrls.size} unique audio buffers from saved project...`);
      uniqueUrls.forEach(url => {
        loadAudioBuffer(url);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // IMPORTANT: Runs only once after rehydration
};