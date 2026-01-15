import React, { useState, useEffect } from 'react';
import type { Track } from '../types';
import VolumeKnob from './VolumeKnob';
import { TrackControls } from './TrackControls';

interface ChannelStripProps {
  track: Track;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  setVolume: (volume: number) => void;
  onRename: (newName: string) => void;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({ 
  track, 
  onToggleMute, 
  onToggleSolo, 
  setVolume,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(track.name);

  useEffect(() => {
    setName(track.name);
  }, [track.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    onRename(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 lg:gap-3 p-2 bg-[#121212] rounded-lg w-20 lg:w-24 flex-shrink-0">
      {isEditing ? (
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="bg-[#282828] text-white text-center w-full border-none rounded-sm text-xs lg:text-sm"
        />
      ) : (
        <p 
          className="text-white font-bold m-0 text-xs lg:text-sm truncate w-full text-center cursor-pointer"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to rename"
        >
          {track.name}
        </p>
      )}
      <div className="flex flex-row items-center justify-around w-full">
        <VolumeKnob 
          volume={track.volume} 
          onChange={setVolume} 
        />
        <TrackControls 
          isMuted={track.isMuted}
          isSoloed={track.isSoloed}
          onToggleMute={onToggleMute}
          onToggleSolo={onToggleSolo}
        />
      </div>
    </div>
  );
};
