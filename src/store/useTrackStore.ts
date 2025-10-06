import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sample, TrackType } from '../types';
import { useAudioEngine } from './useAudioEngine'; // Importar el motor de audio

const TRACK_TYPES: TrackType[] = ['Drums', 'Bass', 'Melody', 'Fills', 'SFX'];

interface TrackState {
  trackSlots: Record<TrackType, (Sample | null)[]>;
  volumes: Record<TrackType, number>;
  soloedTrack: TrackType | null;
  mutedTracks: TrackType[];
  totalDuration: number;
  numSlots: number;
  addSlots: (amount: number) => void;
  toggleSolo: (trackType: TrackType) => void;
  toggleMute: (trackType: TrackType) => void;
  handleDrop: (trackType: TrackType, slotIndex: number, sample: Sample) => void;
  handleClear: (trackType: TrackType, instanceId: string) => void;
  setTotalDuration: (duration: number) => void;
  setVolume: (trackType: TrackType, volume: number) => void;
}

export const useTrackStore = create<TrackState>()(
  persist(
    (set, get) => ({
      numSlots: 16, // Empezamos con 16 slots
      trackSlots: Object.fromEntries(
        TRACK_TYPES.map(type => [type, Array(16).fill(null)])
      ) as Record<TrackType, (Sample | null)[]>,
      volumes: {
        Drums: 1.0,
        Bass: 1.0,
        Melody: 1.0,
        Fills: 1.0,
        SFX: 1.0,
      },
      soloedTrack: null,
      mutedTracks: [],
      totalDuration: 0,

      addSlots: (amount) => {
        const currentSlots = get().trackSlots;
        const newNumSlots = get().numSlots + amount;
        const newTrackSlots = { ...currentSlots };

        for (const type of TRACK_TYPES) {
          const track = newTrackSlots[type];
          const newSlots = Array(amount).fill(null);
          newTrackSlots[type] = [...track, ...newSlots];
        }

        set({ trackSlots: newTrackSlots, numSlots: newNumSlots });
      },

      toggleSolo: (trackType) => {
        set(state => {
          const isAlreadySoloed = state.soloedTrack === trackType;
          // Si al activar solo, la pista estaba muteada, la desmuteamos
          const newMutedTracks = state.mutedTracks.filter(t => t !== trackType);
          return {
            soloedTrack: isAlreadySoloed ? null : trackType,
            mutedTracks: newMutedTracks,
          };
        });
      },

      toggleMute: (trackType) => {
        set(state => {
          const isMuted = state.mutedTracks.includes(trackType);
          const newMutedTracks = isMuted
            ? state.mutedTracks.filter(t => t !== trackType)
            : [...state.mutedTracks, trackType];
          // Si se mutea una pista que está en solo, se desactiva el solo
          const newSoloedTrack = state.soloedTrack === trackType ? null : state.soloedTrack;
          return {
            mutedTracks: newMutedTracks,
            soloedTrack: newSoloedTrack,
          };
        });
      },

      setTotalDuration: (duration) => set({ totalDuration: duration }),

      setVolume: (trackType, volume) => {
        set(state => ({
          volumes: {
            ...state.volumes,
            [trackType]: volume,
          },
        }));
        useAudioEngine.getState().setTrackVolume(trackType, volume);
      },

      handleDrop: (trackType, slotIndex, sample) => {
        const { numSlots, trackSlots } = get();
        const duration = sample.duration || 1;
        if (slotIndex + duration > numSlots) {
          console.warn("No hay suficiente espacio para este sample.");
          return;
        }

        const currentSlots = trackSlots[trackType];
        let currentPos = 0;
        while (currentPos < numSlots) {
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
    }),
    {
      name: 'napbak-project', // Nombre para el almacenamiento en localStorage
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['totalDuration'].includes(key))
        ),
    }
  )
);
