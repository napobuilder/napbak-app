import React, { useState, useRef } from 'react';
import { useTrackStore } from '../store/useTrackStore';
import { useUIStore } from '../store/useUIStore';
import { useAudioEngine } from '../store/useAudioEngine';

const BASE_SLOT_WIDTH = 64;
const GAP_SIZE_PIXELS = 10; // Corresponde a `gap-2.5` de Tailwind
const BPM = 90;
const MEASURE_DURATION = (60 / BPM) * 4; // Duración de un compás/slot en segundos

export const TimelineRuler: React.FC = () => {
  const numSlots = useTrackStore(state => state.numSlots);
  const zoomLevel = useUIStore(state => state.zoomLevel);
  const seekPlayback = useAudioEngine(state => state.seekPlayback);
  const slotWidth = BASE_SLOT_WIDTH * zoomLevel;

  const [isSeeking, setIsSeeking] = useState(false);
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;

    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Lógica para convertir píxeles a tiempo, considerando los gaps
    const blockWidth = slotWidth + GAP_SIZE_PIXELS;
    const numBlocks = Math.floor(x / blockWidth);
    const remainderPixels = x % blockWidth;

    const slotsInRemainder = Math.min(remainderPixels / slotWidth, 1);
    const totalSlots = numBlocks + slotsInRemainder;
    
    const newTime = totalSlots * MEASURE_DURATION;

    // Asegurarse de que el tiempo no sea negativo o exceda la duración total
    const { totalDuration } = useTrackStore.getState();
    const clampedTime = Math.max(0, Math.min(newTime, totalDuration));

    seekPlayback(clampedTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    handleSeek(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSeeking) {
      handleSeek(e);
    }
  };

  const handleMouseUp = () => {
    setIsSeeking(false);
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${numSlots}, ${slotWidth}px)`,
  };

  const renderMarkers = () => {
    return Array.from({ length: numSlots }).map((_, i) => (
      <div 
        key={i} 
        className="h-full flex items-end justify-start pt-1 pl-1 pr-2 border-r border-transparent cursor-pointer"
      >
        <span className="text-xs text-gray-400 select-none">{i + 1}</span>
      </div>
    ));
  };

  return (
    <div 
      ref={rulerRef}
      className="h-6 bg-gray-800 grid gap-2.5 items-stretch cursor-pointer"
      style={gridStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Termina el seek si el ratón sale del componente
    >
      {renderMarkers()}
    </div>
  );
};
