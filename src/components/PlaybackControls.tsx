
import React from 'react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    isExporting: boolean;
    onPlayPause: () => void;
    onExport: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, onPlayPause, onExport, isExporting }) => (
  <div className="flex justify-center items-center pb-4">
    <button className="bg-[#1DB954] py-4 px-9 rounded-3xl m-2.5 border-none cursor-pointer transition-colors" onClick={onPlayPause} disabled={isExporting}>
      <span className="text-white text-base font-bold">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
    </button>
    <button 
        className={`bg-[#509BF5] py-4 px-9 rounded-3xl m-2.5 border-none cursor-pointer transition-colors ${isExporting ? 'bg-[#555] cursor-not-allowed' : ''}`} 
        onClick={onExport}
        disabled={isExporting}
    >
      <span className="text-white text-base font-bold">{isExporting ? 'EXPORTANDO...' : 'EXPORTAR'}</span>
    </button>
  </div>
);
