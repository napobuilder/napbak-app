import React from 'react';
import { useTrackStore } from '../store/useTrackStore';

export const AddBarsButton: React.FC = () => {
  const addSlots = useTrackStore(state => state.addSlots);

  const handleClick = () => {
    addSlots(16);
  };

  return (
    <button
      onClick={handleClick}
      className="h-20 w-20 flex items-center justify-center bg-transparent border-2 border-dashed border-gray-600 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-400 transition-colors duration-200 ease-in-out"
      aria-label="Add 16 bars to the timeline"
    >
      <span className="text-4xl font-thin">+</span>
    </button>
  );
};
