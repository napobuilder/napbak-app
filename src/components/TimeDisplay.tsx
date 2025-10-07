import React from 'react';

interface TimeDisplayProps {
  currentTime: number;
}

const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) {
    return '00:00:00';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const centiseconds = Math.floor((timeInSeconds * 100) % 100);

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  const paddedCentiseconds = String(centiseconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}:${paddedCentiseconds}`;
};

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ currentTime }) => {
  return (
    <div className="bg-[#282828] rounded-md p-2 flex items-center justify-center">
      <p className="font-mono text-2xl text-white tracking-wider">
        {formatTime(currentTime)}
      </p>
    </div>
  );
};
