import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useAudioEngine } from '../store/useAudioEngine';
import { SAMPLES } from '../data';

export const usePreloadAudio = () => {
  const [isLoading, setIsLoading] = useState(true); // Empieza en true para mostrar pantalla de carga
  const [progress, setProgress] = useState(0);
  const hasStarted = useRef(false);
  const { loadAudioBuffer } = useAudioEngine.getState();

  useEffect(() => {
    // Solo ejecutar una vez
    if (hasStarted.current) return;
    hasStarted.current = true;

    const preloadAudio = async () => {
      const allSamples = Object.values(SAMPLES).flat();
      const uniqueUrls = Array.from(new Set(allSamples.map(sample => sample.url)));
      const totalSamples = uniqueUrls.length;

      if (totalSamples === 0) {
        setIsLoading(false);
        return;
      }

      // Iniciar Tone.js (requiere gesto de usuario, pero el clic en Dashboard ya lo hizo)
      try {
        await Tone.start();
      } catch (e) {
        console.warn('Tone.js start warning:', e);
      }
      
      console.log(`Pre-loading ${totalSamples} unique audio buffers...`);

      let loadedCount = 0;
      
      // Cargar samples en paralelo con actualización de progreso
      const loadPromises = uniqueUrls.map(async (url) => {
        try {
          await loadAudioBuffer(url);
        } catch (error) {
          console.error(`Failed to load sample: ${url}`, error);
        } finally {
          loadedCount++;
          const newProgress = (loadedCount / totalSamples) * 100;
          setProgress(newProgress);
        }
      });

      try {
        await Promise.all(loadPromises);
        console.log('All audio buffers pre-loaded successfully.');
      } catch (error) {
        console.error('Error during audio pre-loading:', error);
      } finally {
        // Pequeña pausa para que la animación de 100% sea visible
        setTimeout(() => {
          setIsLoading(false);
        }, 600);
      }
    };

    preloadAudio();
  }, [loadAudioBuffer]);

  return { isLoading, progress };
};