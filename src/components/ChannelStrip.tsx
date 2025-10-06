import React from 'react';
import type { TrackType } from '../types';
import VolumeKnob from './VolumeKnob';
import { TrackControls } from './TrackControls';

interface ChannelStripProps {
  type: TrackType;
  volume: number;
  isMuted: boolean;
  isSoloed: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  setVolume: (volume: number) => void;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({ 
  type, 
  volume, 
  isMuted, 
  isSoloed, 
  onToggleMute, 
  onToggleSolo, 
  setVolume 
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-2 bg-[#121212] rounded-lg w-24">
      <p className="text-white font-bold m-0 text-sm truncate w-full text-center">{type}</p>
      <div className="flex flex-row items-center justify-around w-full">
        <VolumeKnob 
          volume={volume} 
          onChange={setVolume} 
        />
        <TrackControls 
          isMuted={isMuted}
          isSoloed={isSoloed}
          onToggleMute={onToggleMute}
          onToggleSolo={onToggleSolo}
        />
      </div>
    </div>
  );
};
