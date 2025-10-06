import React from 'react';
import { useAudioEngine } from '../store/useAudioEngine';
import { useTrackStore } from '../store/useTrackStore';

export const TimelineRuler: React.FC = () => {
  const totalDuration = useTrackStore(state => state.totalDuration);
  const seekPlayback = useAudioEngine(state => state.seekPlayback);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalDuration <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercentage = clickX / width;
    const newTime = clickPercentage * totalDuration;

    seekPlayback(newTime);
  };

  return (
    <div 
      className="w-full h-6 bg-[#282828] cursor-pointer rounded-t-lg"
      onClick={handleSeek}
      title="Click to seek playback position"
    >
      {/* En el futuro, aquí podríamos renderizar los números de los compases */}
    </div>
  );
};
