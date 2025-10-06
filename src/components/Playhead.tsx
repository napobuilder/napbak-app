import React from 'react';
import { useAudioEngine } from '../store/useAudioEngine';
import { useTrackStore } from '../store/useTrackStore';

export const Playhead: React.FC = () => {
  const playbackTime = useAudioEngine(state => state.playbackTime);
  const totalDuration = useTrackStore(state => state.totalDuration);

  const progress = totalDuration > 0 ? (playbackTime / totalDuration) * 100 : 0;

  // No renderizar el playhead si no hay duración
  if (totalDuration <= 0) {
    return null;
  }

  return (
    <div 
      className="absolute top-0 h-full w-0.5 pointer-events-none z-20"
      style={{ left: `${progress}%` }}
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
