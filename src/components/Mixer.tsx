import React from 'react';
import { useTrackStore } from '../store/useTrackStore';
import { ChannelStrip } from './ChannelStrip';

export const Mixer: React.FC = () => {
  const { tracks, setVolume, toggleMute, toggleSolo, renameTrack } = useTrackStore();

  return (
    <div className="flex flex-col gap-2.5">
      {tracks.map(track => (
        <ChannelStrip
          key={track.id}
          track={track}
          setVolume={(volume) => setVolume(track.id, volume)}
          onToggleMute={() => toggleMute(track.id)}
          onToggleSolo={() => toggleSolo(track.id)}
          onRename={(newName) => renameTrack(track.id, newName)}
        />
      ))}
    </div>
  );
};
