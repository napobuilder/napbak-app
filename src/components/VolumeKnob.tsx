import React, { useState, useEffect, useRef } from 'react';

interface VolumeKnobProps {
  volume: number;
  onChange: (volume: number) => void;
}

const VolumeKnob: React.FC<VolumeKnobProps> = ({ volume, onChange }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Display volume is for the UI, to make it feel smooth and decoupled.
  const [displayVolume, setDisplayVolume] = useState(volume);
  // We store the drag start information in a ref to avoid re-renders.
  const dragStartRef = useRef({ y: 0, volume: 0 });

  // Sync display volume with the external prop only when not dragging.
  useEffect(() => {
    if (!isDragging) {
      setDisplayVolume(volume);
    }
  }, [volume, isDragging]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      y: e.clientY,
      volume: displayVolume, // Start dragging from the current display value
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const { y: startY, volume: startVolume } = dragStartRef.current;
      const deltaY = startY - e.clientY;
      const sensitivity = 100; // Pixels per full volume range
      const newVolume = startVolume + deltaY / sensitivity;
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      
      // Only update the local display volume during the drag
      setDisplayVolume(clampedVolume);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      setIsDragging(false);

      // On mouse up, we calculate the final volume one last time
      // and then call the main onChange handler to update the global state.
      const { y: startY, volume: startVolume } = dragStartRef.current;
      const deltaY = startY - e.clientY;
      const sensitivity = 100;
      const newVolume = startVolume + deltaY / sensitivity;
      const finalVolume = Math.max(0, Math.min(1, newVolume));
      
      onChange(finalVolume);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange]);

  const rotation = displayVolume * 270 - 135;

  return (
    <div
      ref={knobRef}
      onMouseDown={handleMouseDown}
      className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center cursor-ns-resize select-none relative border-2 border-gray-900"
      title={`Volume: ${Math.round(displayVolume * 100)}%`}
    >
      {isDragging && (
        <div className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 bg-gray-900 bg-opacity-80 text-white text-xs rounded px-2 py-1 shadow-lg pointer-events-none">
          {`${Math.round(displayVolume * 100)}%`}
        </div>
      )}
      <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
        <div
          className="w-1 h-2 bg-green-500 rounded-full absolute top-1"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'bottom center' }}
        />
      </div>
    </div>
  );
};

export default VolumeKnob;