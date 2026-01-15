import React, { useState } from 'react';
import { useTrackStore } from '../store/useTrackStore';
import { ChannelStrip } from './ChannelStrip';

const ChevronUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const SlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export const MobileMixerPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { tracks, setVolume, toggleMute, toggleSolo, renameTrack } = useTrackStore();

  return (
    <div className="lg:hidden bg-[#181818] rounded-xl overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-white hover:bg-[#282828] transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersIcon />
          <span className="font-semibold">Mixer</span>
          <span className="text-gray-400 text-sm">({tracks.length} tracks)</span>
        </div>
        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      
      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-out ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="p-3 pt-0">
          {/* Horizontal scrollable mixer for mobile */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-min">
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
          </div>
        </div>
      </div>
    </div>
  );
};
