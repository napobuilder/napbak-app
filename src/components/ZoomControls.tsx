import React from 'react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onZoomOut}
        className="bg-[#2a2a2a] hover:bg-[#333333] text-white font-bold w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-colors duration-200 ease-in-out"
        aria-label="Zoom out"
      >
        -
      </button>
      <span className="text-gray-400 text-sm">Zoom</span>
      <button 
        onClick={onZoomIn}
        className="bg-[#2a2a2a] hover:bg-[#333333] text-white font-bold w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-colors duration-200 ease-in-out"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
};
