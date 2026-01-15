import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useAudioEngine } from '../store/useAudioEngine';
import { SAMPLES } from '../data';

const MAX_LOAD_TIME = 15000; // Timeout de 15 segundos máximo

export const usePreloadAudio = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Timeout de seguridad - si tarda más de 15s, continuar de todos modos
    const safetyTimeout = setTimeout(() => {
      console.warn('Loading timeout reached, continuing anyway...');
      setIsLoading(false);
    }, MAX_LOAD_TIME);

    const preloadAudio = async () => {
      try {
        const allSamples = Object.values(SAMPLES).flat();
        const uniqueUrls = Array.from(new Set(allSamples.map(sample => sample.url)));
        const totalSamples = uniqueUrls.length;

        if (totalSamples === 0) {
          clearTimeout(safetyTimeout);
          setIsLoading(false);
          return;
        }

        // Intentar iniciar Tone.js (no bloquear si falla)
        try {
          await Tone.start();
        } catch (e) {
          console.warn('Tone.js start warning:', e);
        }

        console.log(`Pre-loading ${totalSamples} unique audio buffers...`);
        const { loadAudioBuffer } = useAudioEngine.getState();

        let loadedCount = 0;

        // Cargar samples con timeout individual
        const loadWithTimeout = async (url: string) => {
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 8000)
            );
            await Promise.race([loadAudioBuffer(url), timeoutPromise]);
          } catch (error) {
            console.warn(`Failed to load: ${url}`, error);
          } finally {
            loadedCount++;
            setProgress((loadedCount / totalSamples) * 100);
          }
        };

        await Promise.all(uniqueUrls.map(loadWithTimeout));
        console.log('Audio pre-loading complete.');

      } catch (error) {
        console.error('Error during pre-loading:', error);
      } finally {
        clearTimeout(safetyTimeout);
        // Pequeña pausa para mostrar 100%
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    preloadAudio();
  }, []);

  return { isLoading, progress };
};