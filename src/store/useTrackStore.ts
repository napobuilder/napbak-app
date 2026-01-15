import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sample, Track } from '../types';
import { useAudioEngine } from './useAudioEngine';

const BPM = 90;
const MIN_LOOP_SLOTS = 1; // Mínimo de compases para el loop
const MEASURE_DURATION = (60 / BPM) * 4; // Duración de un compás en segundos

// --- Funciones de Lógica de Duración ---

const calculateDurationInSeconds = (numSlots: number) => {
  return numSlots * MEASURE_DURATION;
};

const calculateActiveSlots = (tracks: Track[]): number => {
  let lastSlot = 0;
  for (const track of tracks) {
    for (let i = 0; i < track.slots.length; i++) {
      const sample = track.slots[i];
      if (sample) {
        const endSlot = i + (sample.duration || 1);
        if (endSlot > lastSlot) {
          lastSlot = endSlot;
        }
      }
    }
  }
  return Math.max(MIN_LOOP_SLOTS, lastSlot);
};

// --- Estado Inicial ---

const initialNumSlots = 32;

// Canvas vacío - el usuario crea pistas arrastrando samples
const initialTracks: Track[] = [];

const initialState = {
  tracks: initialTracks,
  soloedTrackId: null,
  numSlots: initialNumSlots,
  activeSlots: MIN_LOOP_SLOTS,
  totalDuration: calculateDurationInSeconds(MIN_LOOP_SLOTS),
  projectKey: null,
};

// --- Definición del Store ---

export interface TrackState {
  tracks: Track[];
  soloedTrackId: string | null;
  totalDuration: number;
  numSlots: number;
  activeSlots: number;
  projectKey: string | null;
  setProjectKey: (key: string) => void;
  addTrack: () => void;
  addTrackWithSample: (sample: Sample) => void;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, newName: string) => void;
  addSlots: (amount: number) => void;
  toggleSolo: (trackId: string) => void;
  toggleMute: (trackId: string) => void;
  handleDrop: (trackId: string, slotIndex: number, sample: Sample) => void;
  handleClear: (trackId: string, instanceId: string) => void;
  setVolume: (trackId: string, volume: number) => void;
  resetProject: () => void;
  updateTotalDuration: () => void;
  loadProject: (projectData: Partial<TrackState>) => void;
}

export const useTrackStore = create<TrackState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProjectKey: (key) => {
        if (get().projectKey === null) {
          set({ projectKey: key });
        }
      },

      loadProject: (projectData) => {
        set(projectData);
        get().updateTotalDuration();
      },

      updateTotalDuration: () => {
        const newActiveSlots = calculateActiveSlots(get().tracks);
        const newDuration = calculateDurationInSeconds(newActiveSlots);
        if (get().totalDuration !== newDuration) {
          set({ totalDuration: newDuration, activeSlots: newActiveSlots });
        }
      },

      addTrack: () => {
        const newTrack: Track = {
          id: crypto.randomUUID(),
          name: `Track ${get().tracks.length + 1}`,
          type: 'Melody',
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

        // Usar el nombre del sample como nombre de la pista
        const newTrack: Track = {
          id: crypto.randomUUID(),
          name: sample.name, // Auto-nombrar con el nombre del sample
          type: sample.type,
          volume: 1.0,
          isMuted: false,
          isSoloed: false,
          slots: newSlots,
        };
        set(state => ({ tracks: [...state.tracks, newTrack] }));
        get().updateTotalDuration();
      },

      removeTrack: (trackId) => {
        set(state => ({ tracks: state.tracks.filter(t => t.id !== trackId) }));
        get().updateTotalDuration();
      },

      renameTrack: (trackId, newName) => {
        set(state => ({
          tracks: state.tracks.map(t => t.id === trackId ? { ...t, name: newName } : t),
        }));
      },

      addSlots: (amount) => {
        const newNumSlots = get().numSlots + amount;
        set(state => ({
          tracks: state.tracks.map(track => ({
            ...track,
            slots: [...track.slots, ...Array(amount).fill(null)],
          })),
          numSlots: newNumSlots,
        }));
        get().updateTotalDuration();
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
              const newSoloedId = t.isSoloed ? null : state.soloedTrackId;
              if (newSoloedId !== state.soloedTrackId) {
                (state as any).soloedTrackId = newSoloedId;
              }
              return { ...t, isMuted: !t.isMuted, isSoloed: t.isSoloed ? false : t.isSoloed };
            }
            return t;
          }),
        }));
      },

      setVolume: (trackId, volume) => {
        set(state => ({
          tracks: state.tracks.map(t => t.id === trackId ? { ...t, volume } : t),
        }));
        useAudioEngine.getState().setTrackVolume(trackId, volume);
      },

      resetProject: () => {
        set({...initialState, projectKey: null });
        get().updateTotalDuration();
      },

      handleDrop: (trackId, slotIndex, sample) => {
        const { addSlots, updateTotalDuration, setProjectKey } = get();
        
        if (sample.type === 'Melody' && sample.key) {
          setProjectKey(sample.key);
        }

        const initialNumSlots = get().numSlots;
        const duration = sample.duration || 1;
        const endPosition = slotIndex + duration;

        if (endPosition >= initialNumSlots) {
          const SLOTS_TO_ADD = 16;
          const neededSlots = endPosition - initialNumSlots;
          addSlots(neededSlots + SLOTS_TO_ADD);
        }

        const { tracks } = get();
        const targetTrack = tracks.find(t => t.id === trackId);
        if (!targetTrack) return;

        for (let i = 0; i < duration; i++) {
          if (targetTrack.slots[slotIndex + i]) {
            console.warn("No se puede colocar el sample aquí, hay un solapamiento.");
            return;
          }
        }

        set({
          tracks: tracks.map(t => {
            if (t.id === trackId) {
              const newSlots = [...t.slots];
              newSlots[slotIndex] = { ...sample, instanceId: crypto.randomUUID() };
              return { ...t, slots: newSlots };
            }
            return t;
          }),
        });
        
        updateTotalDuration();
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
        get().updateTotalDuration();
      },
    }),
    {
      name: 'napbak-project-v4', // v4: Canvas vacío + auto-nombre de pistas
    }
  )
);