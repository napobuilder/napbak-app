import React from 'react';
import { useAudioEngine } from '../store/useAudioEngine';
import { useUIStore } from '../store/useUIStore';

const BASE_SLOT_WIDTH = 64; // Ancho base de un slot en píxeles
const GAP_SIZE_PIXELS = 10; // Corresponde a `gap-2.5` de Tailwind (0.625rem * 16px)
const BPM = 90;
const MEASURE_DURATION = (60 / BPM) * 4; // Duración de un compás/slot en segundos

export const Playhead: React.FC = () => {
  const playbackTime = useAudioEngine(state => state.playbackTime);
  const zoomLevel = useUIStore(state => state.zoomLevel);

  // 1. Calcular el ancho actual de un slot basado en el zoom
  const slotWidth = BASE_SLOT_WIDTH * zoomLevel;

  // 2. Convertir el tiempo de reproducción (en segundos) a una posición en slots (flotante)
  const positionInSlots = playbackTime / MEASURE_DURATION;

  // 3. Calcular el número de gaps que el playhead ya ha cruzado
  const gapsCrossed = Math.floor(positionInSlots);

  // 4. Convertir la posición en slots a una posición en píxeles, añadiendo el ancho de los gaps
  const positionInPixels = (positionInSlots * slotWidth) + (gapsCrossed * GAP_SIZE_PIXELS);

  return (
    <div 
      className="absolute top-0 h-full w-0.5 pointer-events-none z-20"
      style={{ 
        transform: `translateX(${positionInPixels}px)`,
        willChange: 'transform', // Optimización para el navegador
      }}
    >
      {/* La flecha superior */}
      <div 
        className="absolute -top-2.5 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid #1DB954', // Color verde brillante
        }}
      />
      {/* La línea vertical */}
      <div className="w-full h-full bg-green-500" />
    </div>
  );
};
