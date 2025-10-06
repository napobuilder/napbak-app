import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sample, Track, TrackType } from '../types';
import { useAudioEngine } from './useAudioEngine';

const BPM = 90;
const calculateTotalDuration = (numSlots: number) => {
  const measureDuration = (60 / BPM) * 4; // Duration of one measure (4 beats)
  return numSlots * measureDuration;
};

const initialTracks: Track[] = [
  { id: crypto.randomUUID(), name: 'Drums', type: 'Drums', volume: 1.0, isMuted: false, isSoloed: false, slots: Array(16).fill(null) },
  { id: crypto.randomUUID(), name: 'Bass', type: 'Bass', volume: 1.0, isMuted: false, isSoloed: false, slots: Array(16).fill(null) },
  { id: crypto.randomUUID(), name: 'Melody', type: 'Melody', volume: 1.0, isMuted: false, isSoloed: false, slots: Array(16).fill(null) },
  { id: crypto.randomUUID(), name: 'Fills', type: 'Fills', volume: 1.0, isMuted: false, isSoloed: false, slots: Array(16).fill(null) },
  { id: crypto.randomUUID(), name: 'SFX', type: 'SFX', volume: 1.0, isMuted: false, isSoloed: false, slots: Array(16).fill(null) },
];

const initialNumSlots = 16;
const initialState = {
  tracks: initialTracks,
  soloedTrackId: null,
  numSlots: initialNumSlots,
  totalDuration: calculateTotalDuration(initialNumSlots),
};

interface TrackState {
  tracks: Track[];
  soloedTrackId: string | null;
  totalDuration: number;
  numSlots: number;
  addTrack: () => void;
  addTrackWithSample: (sample: Sample) => void;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, newName: string) => void;
  addSlots: (amount: number) => void;
  toggleSolo: (trackId: string) => void;
  toggleMute: (trackId: string) => void;
  handleDrop: (trackId: string, slotIndex: number, sample: Sample) => void;
  handleClear: (trackId: string, instanceId: string) => void;
  setTotalDuration: (duration: number) => void;
  setVolume: (trackId: string, volume: number) => void;
  resetProject: () => void;
}

export const useTrackStore = create<TrackState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addTrack: () => {
        const newTrack: Track = {
          id: crypto.randomUUID(),
          name: `Track ${get().tracks.length + 1}`,
          type: 'Melody', // Default type, can be changed later
          volume: 1.0,
          isMuted: false,
          isSoloed: false,
          slots: Array(get().numSlots).fill(null),
        };
        set(state => ({ tracks: [...state.tracks, newTrack] }));
      },

      addTrackWithSample: (sample) => {
        const newSlots = Array(get().numSlots).fill(null);
        newSlots[0] = { ...sample, instanceId: crypto.randomUUID() };

        const newTrack: Track = {
          id: crypto.randomUUID(),
          name: sample.type, // Smart naming!
          type: sample.type,
          volume: 1.0,
          isMuted: false,
          isSoloed: false,
          slots: newSlots,
        };
        set(state => ({ tracks: [...state.tracks, newTrack] }));
      },

      removeTrack: (trackId) => {
        set(state => ({ tracks: state.tracks.filter(t => t.id !== trackId) }));
      },

      renameTrack: (trackId, newName) => {
        set(state => ({
          tracks: state.tracks.map(t => t.id === trackId ? { ...t, name: newName } : t),
        }));
      },

      addSlots: (amount) => {
        const newNumSlots = get().numSlots + amount;
        const newTotalDuration = calculateTotalDuration(newNumSlots);
        set(state => ({
          tracks: state.tracks.map(track => ({
            ...track,
            slots: [...track.slots, ...Array(amount).fill(null)],
          })),
          numSlots: newNumSlots,
          totalDuration: newTotalDuration,
        }));
      },

      toggleSolo: (trackId) => {
        set(state => {
          const isAlreadySoloed = state.soloedTrackId === trackId;
          const newSoloedTrackId = isAlreadySoloed ? null : trackId;
          return {
            tracks: state.tracks.map(t =>
              t.id === trackId
                ? { ...t, isSoloed: !isAlreadySoloed, isMuted: false }
                : { ...t, isSoloed: false }
            ),
            soloedTrackId: newSoloedTrackId,
          };
        });
      },

      toggleMute: (trackId) => {
        set(state => ({
          tracks: state.tracks.map(t => {
            if (t.id === trackId) {
              // If muting a soloed track, deactivate solo
              const newSoloedId = t.isSoloed ? null : state.soloedTrackId;
              if (newSoloedId !== state.soloedTrackId) {
                (state as any).soloedTrackId = newSoloedId; // Not ideal, but for the sake of atomicity
              }
              return { ...t, isMuted: !t.isMuted, isSoloed: t.isSoloed ? false : t.isSoloed };
            }
            return t;
          }),
        }));
      },

      setTotalDuration: (duration) => set({ totalDuration: duration }),

      setVolume: (trackId, volume) => {
        set(state => ({
          tracks: state.tracks.map(t => t.id === trackId ? { ...t, volume } : t),
        }));
        useAudioEngine.getState().setTrackVolume(trackId, volume);
      },

      resetProject: () => {
        set(initialState);
      },

      handleDrop: (trackId, slotIndex, sample) => {
        const { tracks, numSlots } = get();
        const targetTrack = tracks.find(t => t.id === trackId);
        if (!targetTrack) return;

        const duration = sample.duration || 1;
        if (slotIndex + duration > numSlots) {
          console.warn("No hay suficiente espacio para este sample.");
          return;
        }

        // Overlap check
        for (let i = 0; i < duration; i++) {
          if (targetTrack.slots[slotIndex + i]) {
            console.warn("No se puede colocar el sample aquí, hay un solapamiento.");
            return;
          }
        }

        set(state => ({
          tracks: state.tracks.map(t => {
            if (t.id === trackId) {
              const newSlots = [...t.slots];
              newSlots[slotIndex] = { ...sample, instanceId: crypto.randomUUID() };
              return { ...t, slots: newSlots };
            }
            return t;
          }),
        }));
      },

      handleClear: (trackId, instanceId) => {
        set(state => ({
          tracks: state.tracks.map(t => {
            if (t.id === trackId) {
              const newSlots = [...t.slots];
              const sampleIndex = newSlots.findIndex(s => s?.instanceId === instanceId);
              if (sampleIndex !== -1) {
                newSlots[sampleIndex] = null;
              }
              return { ...t, slots: newSlots };
            }
            return t;
          }),
        }));
      },
    }),
    {
      name: 'napbak-project-v3', // Use a new name to avoid conflicts with old structure
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['totalDuration'].includes(key))
        ),
    }
  )
);
