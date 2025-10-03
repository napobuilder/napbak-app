import { create } from 'zustand';
import type { Sample, TrackType } from '../types';
import { useAudioEngine } from './useAudioEngine'; // Importar el motor de audio

const TRACK_TYPES: TrackType[] = ['Drums', 'Bass', 'Melody', 'Fills', 'SFX'];
const NUM_SLOTS = 8;

interface TrackState {
  trackSlots: Record<TrackType, (Sample | null)[]>;
  volumes: Record<TrackType, number>;
  totalDuration: number;
  handleDrop: (trackType: TrackType, slotIndex: number, sample: Sample) => void;
  handleClear: (trackType: TrackType, instanceId: string) => void;
  setTotalDuration: (duration: number) => void;
  setVolume: (trackType: TrackType, volume: number) => void;
}

export const useTrackStore = create<TrackState>((set, get) => ({
  trackSlots: Object.fromEntries(TRACK_TYPES.map(type => [type, Array(NUM_SLOTS).fill(null)])) as Record<TrackType, (Sample | null)[]>,
  volumes: {
    Drums: 1.0,
    Bass: 1.0,
    Melody: 1.0,
    Fills: 1.0,
    SFX: 1.0,
  },
  totalDuration: 0,

  setTotalDuration: (duration) => set({ totalDuration: duration }),

  setVolume: (trackType, volume) => {
    // Actualizar el estado local para la UI y persistencia
    set(state => ({
      volumes: {
        ...state.volumes,
        [trackType]: volume,
      },
    }));
    // Llamar al motor de audio para el cambio en tiempo real
    useAudioEngine.getState().setTrackVolume(trackType, volume);
  },

  handleDrop: (trackType, slotIndex, sample) => {
    const duration = sample.duration || 1;
    if (slotIndex + duration > NUM_SLOTS) {
      console.warn("No hay suficiente espacio para este sample.");
      return;
    }

    const currentSlots = get().trackSlots[trackType];
    let currentPos = 0;
    while (currentPos < NUM_SLOTS) {
      const currentSample = currentSlots[currentPos];
      if (currentSample) {
        const sampleEnd = currentPos + (currentSample.duration || 1);
        const dropEnd = slotIndex + duration;
        if (Math.max(currentPos, slotIndex) < Math.min(sampleEnd, dropEnd)) {
          console.warn("No se puede colocar el sample aquí, hay un solapamiento.");
          return;
        }
        currentPos += (currentSample.duration || 1);
      } else {
        currentPos++;
      }
    }

    set(state => {
      const newSlots = [...state.trackSlots[trackType]];
      newSlots[slotIndex] = { ...sample, instanceId: crypto.randomUUID() };
      return {
        trackSlots: {
          ...state.trackSlots,
          [trackType]: newSlots,
        },
      };
    });
  },

  handleClear: (trackType, instanceId) => {
    set(state => {
      const newSlots = [...state.trackSlots[trackType]];
      const sampleIndex = newSlots.findIndex(s => s?.instanceId === instanceId);

      if (sampleIndex !== -1) {
        const sample = newSlots[sampleIndex];
        const duration = sample?.duration || 1;
        for (let i = 0; i < duration; i++) {
          newSlots[sampleIndex + i] = null;
        }
      }

      return {
        trackSlots: {
          ...state.trackSlots,
          [trackType]: newSlots,
        },
      };
    });
  },
}));
