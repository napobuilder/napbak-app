import React from 'react';
import { useTrackStore } from '../store/useTrackStore';
import type { TrackType } from '../types';
import { ChannelStrip } from './ChannelStrip';

const TRACK_TYPES: TrackType[] = ['Drums', 'Bass', 'Melody', 'Fills', 'SFX'];

export const Mixer: React.FC = () => {
  const {
    volumes,
    mutedTracks,
    soloedTrack,
    setVolume,
    toggleMute,
    toggleSolo,
  } = useTrackStore();

  return (
    <div className="flex flex-col gap-2.5">
      {TRACK_TYPES.map(type => (
        <ChannelStrip
          key={type}
          type={type}
          volume={volumes[type]}
          isMuted={mutedTracks.includes(type)}
          isSoloed={soloedTrack === type}
          setVolume={(volume) => setVolume(type, volume)}
          onToggleMute={() => toggleMute(type)}
          onToggleSolo={() => toggleSolo(type)}
        />
      ))}
    </div>
  );
};
