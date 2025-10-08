import { create } from 'zustand';
import type { Sample } from '../types';

const MAX_ZOOM = 5;
const MIN_ZOOM = 0.5;
const ZOOM_STEP = 0.5;

// Utility function for throttling
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};


type ProjectPanelContent = 'save' | 'load';

interface ConfirmationModalContent {
  title: string;
  message: string;
}

interface UIState {
  isFileNameModalOpen: boolean;
  onFileNameSubmit: ((fileName: string) => void) | null;
  isProjectPanelOpen: boolean;
  projectPanelContent: ProjectPanelContent | null;
  isConfirmationModalOpen: boolean;
  confirmationModalContent: ConfirmationModalContent;
  onConfirmationSubmit: (() => void) | null;
  projectName: string | null;
  zoomLevel: number;
  activeSampleBrush: Sample | null;
  isPainting: boolean;
  isErasing: boolean;
  showFileNameModal: (onSubmit: (fileName: string) => void) => void;
  closeFileNameModal: () => void;
  showConfirmationModal: (content: ConfirmationModalContent, onConfirm: () => void) => void;
  closeConfirmationModal: () => void;
  openProjectPanel: (content: ProjectPanelContent) => void;
  closeProjectPanel: () => void;
  setProjectName: (name: string | null) => void;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setActiveSampleBrush: (sample: Sample | null) => void;
  startPainting: () => void;
  stopPainting: () => void;
  startErasing: () => void;
  stopErasing: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isFileNameModalOpen: false,
  onFileNameSubmit: null,
  isProjectPanelOpen: false,
  projectPanelContent: null,
  isConfirmationModalOpen: false,
  confirmationModalContent: { title: '', message: '' },
  onConfirmationSubmit: null,
  projectName: null,
  zoomLevel: 1,
  activeSampleBrush: null,
  isPainting: false,
  isErasing: false,

  showFileNameModal: (onSubmit) => set({
    isFileNameModalOpen: true,
    onFileNameSubmit: onSubmit,
  }),

  closeFileNameModal: () => set({
    isFileNameModalOpen: false,
    onFileNameSubmit: null,
  }),

  showConfirmationModal: (content, onConfirm) => set({
    isConfirmationModalOpen: true,
    confirmationModalContent: content,
    onConfirmationSubmit: onConfirm,
  }),

  closeConfirmationModal: () => set({
    isConfirmationModalOpen: false,
    onConfirmationSubmit: null,
  }),

  openProjectPanel: (content) => set({ 
    isProjectPanelOpen: true, 
    projectPanelContent: content 
  }),

  closeProjectPanel: () => set({ 
    isProjectPanelOpen: false, 
    projectPanelContent: null 
  }),

  setProjectName: (name) => set({ projectName: name }),

  setZoomLevel: (level) => set({
    zoomLevel: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level)),
  }),

  zoomIn: () => set((state) => ({
    zoomLevel: Math.min(MAX_ZOOM, state.zoomLevel + ZOOM_STEP),
  })),

  zoomOut: () => set((state) => ({
    zoomLevel: Math.max(MIN_ZOOM, state.zoomLevel - ZOOM_STEP),
  })),

  setActiveSampleBrush: (sample) => set({ activeSampleBrush: sample }),

  startPainting: () => set({ isPainting: true, isErasing: false }),
  stopPainting: () => set({ isPainting: false }),
  startErasing: () => set({ isErasing: true, isPainting: false }),
  stopErasing: () => set({ isErasing: false }),
}));