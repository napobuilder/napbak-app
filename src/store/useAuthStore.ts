import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  initializeAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  initializeAuthListener: () => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });

    // Cargar la sesión inicial por si ya existe una
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session });
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  },
}));

// Inicializar el listener cuando se carga la app
useAuthStore.getState().initializeAuthListener();
