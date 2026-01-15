import { create } from 'zustand';
import * as Tone from 'tone';
import { useAudioEngine } from './useAudioEngine';
import { SAMPLES } from '../data';

interface LoaderState {
  isLoading: boolean;
  isFinished: boolean;
  progress: number;
  startPreload: () => Promise<void>;
}

export const useLoaderStore = create<LoaderState>((set, get) => ({
  isLoading: false,
  isFinished: false,
  progress: 0,

  startPreload: async () => {
    if (get().isLoading || get().isFinished) return;

    set({ isLoading: true, progress: 0 });

    const { loadAudioBuffer } = useAudioEngine.getState();
    const allSamples = Object.values(SAMPLES).flat();
    const uniqueUrls = Array.from(new Set(allSamples.map(sample => sample.url)));
    const totalSamples = uniqueUrls.length;

    if (totalSamples === 0) {
      set({ isLoading: false, isFinished: true });
      return;
    }

    await Tone.start();
    console.log(`Pre-loading ${totalSamples} unique audio buffers...`);

    let loadedCount = 0;
    const loadPromises = uniqueUrls.map(async (url) => {
      try {
        await loadAudioBuffer(url);
      } catch (error) {
        console.error(`Failed to load sample: ${url}`, error);
      } finally {
        loadedCount++;
        const newProgress = (loadedCount / totalSamples) * 100;
        set({ progress: newProgress });
      }
    });

    try {
      await Promise.all(loadPromises);
      console.log('All unique audio buffers pre-loaded successfully.');
    } catch (error) {
      console.error('An error occurred during audio pre-loading:', error);
    } finally {
      setTimeout(() => {
        set({ isLoading: false, isFinished: true });
      }, 500); // Give time for the progress bar to animate to 100%
    }
  },
}));