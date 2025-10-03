import React, { useState, useEffect, useRef } from 'react';

interface VolumeKnobProps {
  volume: number;
  onChange: (volume: number) => void;
}

const VolumeKnob: React.FC<VolumeKnobProps> = ({ volume, onChange }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0, volume: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      y: e.clientY,
      volume: volume,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = dragStart.y - e.clientY;
      const sensitivity = 100; // Pixels per full volume range
      const newVolume = dragStart.volume + deltaY / sensitivity;
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      onChange(clampedVolume);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
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
  }, [isDragging, dragStart, onChange]);

  const rotation = volume * 270 - 135;

  return (
    <div
      ref={knobRef}
      onMouseDown={handleMouseDown}
      className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-ns-resize select-none relative border-2 border-gray-900"
      title={`Volume: ${Math.round(volume * 100)}%`}
    >
      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
        <div
          className="w-1 h-3 bg-green-500 rounded-full absolute top-1"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'bottom center' }}
        />
      </div>
    </div>
  );
};

export default VolumeKnob;