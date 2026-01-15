import React from 'react';
import { useTrackStore } from '../store/useTrackStore';
import { useAudioEngine } from '../store/useAudioEngine';

const BPM = 90;
const MEASURE_DURATION = (60 / BPM) * 4; // Duración de un compás/slot en segundos

export const SongOverview: React.FC = () => {
  const tracks = useTrackStore(state => state.tracks);
  const activeSlots = useTrackStore(state => state.activeSlots);
  const totalDuration = useTrackStore(state => state.totalDuration);

  const playbackTime = useAudioEngine(state => state.playbackTime);
  const seekPlayback = useAudioEngine(state => state.seekPlayback);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX;
    const relativeX = clickX - rect.left;
    const percentage = relativeX / rect.width;
    const newTime = percentage * totalDuration;
    seekPlayback(newTime);
  };

  // Usar activeSlots en lugar de numSlots para que coincida con totalDuration
  const numSlotsForDisplay = Math.max(1, activeSlots);
  const playheadPosition = totalDuration > 0 ? (playbackTime / totalDuration) * 100 : 0;

  return (
    <div 
      className="relative bg-[#181818] rounded-lg p-2 cursor-pointer h-16 sm:h-20 lg:h-24 touch-manipulation"
      onClick={handleSeek}
    >
      <div className="relative w-full h-full flex flex-col gap-1">
        {tracks.map(track => (
          <div key={track.id} className="relative w-full flex-1 bg-[#282828] rounded-sm overflow-hidden">
            {track.slots.map((sample, index) => {
              if (!sample) return null;
              const duration = sample.duration || 1;
              // Usar activeSlots para que los bloques coincidan con el playhead
              const left = (index / numSlotsForDisplay) * 100;
              const width = (duration / numSlotsForDisplay) * 100;
              return (
                <div
                  key={sample.instanceId}
                  className="absolute h-full"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: sample.color,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Playhead */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white opacity-75 pointer-events-none z-10"
        style={{ left: `${playheadPosition}%` }}
      />
    </div>
  );
};
