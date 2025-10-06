import React from 'react';

interface TrackControlsProps {
  isMuted: boolean;
  isSoloed: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}

export const TrackControls: React.FC<TrackControlsProps> = ({ 
  isMuted, 
  isSoloed, 
  onToggleMute, 
  onToggleSolo 
}) => {

  const soloClasses = isSoloed
    ? 'bg-yellow-500 text-black'
    : 'bg-gray-600 text-white hover:bg-gray-500';

  const muteClasses = isMuted
    ? 'bg-blue-500 text-white'
    : 'bg-gray-600 text-white hover:bg-gray-500';

  return (
    <div className="flex flex-row items-center gap-1">
      <button 
        onClick={onToggleMute}
        className={`w-7 h-7 rounded-md font-bold text-xs transition-colors duration-150 ${muteClasses}`}
        aria-label={isMuted ? 'Unmute track' : 'Mute track'}
      >
        M
      </button>
      <button 
        onClick={onToggleSolo}
        className={`w-7 h-7 rounded-md font-bold text-xs transition-colors duration-150 ${soloClasses}`}
        aria-label={isSoloed ? 'Unsolo track' : 'Solo track'}
      >
        S
      </button>
    </div>
  );
};
