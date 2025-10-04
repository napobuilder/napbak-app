import { create } from 'zustand';

const MAX_ZOOM = 5;
const MIN_ZOOM = 0.5;
const ZOOM_STEP = 0.5;

interface UIState {
  isFileNameModalOpen: boolean;
  onFileNameSubmit: ((fileName: string) => void) | null;
  zoomLevel: number;
  showFileNameModal: (onSubmit: (fileName: string) => void) => void;
  closeFileNameModal: () => void;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isFileNameModalOpen: false,
  onFileNameSubmit: null,
  zoomLevel: 1,

  showFileNameModal: (onSubmit) => set({
    isFileNameModalOpen: true,
    onFileNameSubmit: onSubmit,
  }),

  closeFileNameModal: () => set({
    isFileNameModalOpen: false,
    onFileNameSubmit: null,
  }),

  setZoomLevel: (level) => set({
    zoomLevel: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level)),
  }),

  zoomIn: () => set((state) => ({
    zoomLevel: Math.min(MAX_ZOOM, state.zoomLevel + ZOOM_STEP),
  })),

  zoomOut: () => set((state) => ({
    zoomLevel: Math.max(MIN_ZOOM, state.zoomLevel - ZOOM_STEP),
  })),
}));
