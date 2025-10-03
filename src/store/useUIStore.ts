import { create } from 'zustand';

interface UIState {
  isFileNameModalOpen: boolean;
  onFileNameSubmit: ((fileName: string) => void) | null;
  showFileNameModal: (onSubmit: (fileName: string) => void) => void;
  closeFileNameModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isFileNameModalOpen: false,
  onFileNameSubmit: null,
  showFileNameModal: (onSubmit) => set({
    isFileNameModalOpen: true,
    onFileNameSubmit: onSubmit,
  }),
  closeFileNameModal: () => set({
    isFileNameModalOpen: false,
    onFileNameSubmit: null,
  }),
}));
