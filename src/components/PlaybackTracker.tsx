
import React from 'react';

interface PlaybackTrackerProps {
    currentTime: number;
    totalDuration: number;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const PlaybackTracker: React.FC<PlaybackTrackerProps> = ({ currentTime, totalDuration }) => {
    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
    return (
        <div className="flex items-center gap-2.5 py-2.5">
            <div className="text-[#b3b3b3] text-xs min-w-[40px] text-center">{formatTime(currentTime)}</div>
            <div className="flex-1 h-1 bg-[#404040] rounded-sm overflow-hidden">
                <div className="h-full bg-[#1DB954] rounded-sm" style={{width: `${progress}%`}}></div>
            </div>
            <div className="text-[#b3b3b3] text-xs min-w-[40px] text-center">{formatTime(totalDuration)}</div>
        </div>
    );
};
