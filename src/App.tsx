import React, { useState, useEffect } from 'react';
import { useTrackStore } from './store/useTrackStore';
import { useAudioEngine } from './store/useAudioEngine';
import type { Sample, TrackType } from './types';

import { SampleLibrary } from './components/SampleLibrary';
import { Track } from './components/Playlist';
import { PlaybackTracker } from './components/PlaybackTracker';
import { PlaybackControls } from './components/PlaybackControls';

const TRACK_TYPES: TrackType[] = ['Drums', 'Bass', 'Melody', 'Fills', 'SFX'];
const NUM_SLOTS = 8;
const BPM = 90;

// --- Componente del Cabezal de Reproducción ---
interface PlayheadProps {
  isPlaying: boolean;
  playbackTime: number;
  totalDuration: number;
}

const Playhead: React.FC<PlayheadProps> = ({ isPlaying, playbackTime, totalDuration }) => {
  if (!isPlaying || totalDuration === 0) {
    return null;
  }

  const progress = (playbackTime / totalDuration) * 100;

  return (
    <div 
      className="absolute top-0 w-0.5 h-full bg-[#1DB954] z-20"
      style={{ left: `${progress}%` }}
    />
  );
};

const App = () => {
  const {
    trackSlots,
    totalDuration,
    handleDrop: handleDropInStore,
    handleClear,
    setTotalDuration,
  } = useTrackStore();

  const { isPlaying, playbackTime, isExporting, loadAudioBuffer, handlePlayPause, handleExport } = useAudioEngine();
  const [volumes, ] = useState({ Drums: 1.0, Bass: 1.0, Melody: 1.0, Fills: 1.0, SFX: 1.0 })

  useEffect(() => {
    const measureDuration = (60 / BPM) * 4;
    let maxEndSlot = 0;

    for (const trackType in trackSlots) {
      const slots = trackSlots[trackType as TrackType];
      for (let i = 0; i < slots.length; i++) {
        const sample = slots[i];
        if (sample) {
          const endSlot = i + (sample.duration || 1);
          if (endSlot > maxEndSlot) {
            maxEndSlot = endSlot;
          }
        }
      }
    }

    const newTotalDuration = (maxEndSlot > 0 ? maxEndSlot : NUM_SLOTS) * measureDuration;
    setTotalDuration(newTotalDuration);
  }, [trackSlots, setTotalDuration]);

  const handleDrop = (trackType: TrackType, slotIndex: number, sample: Sample) => {
    loadAudioBuffer(sample.url);
    handleDropInStore(trackType, slotIndex, sample);
  };

  // La duración de la vista actual de la playlist (siempre 8 slots)
  const visibleDuration = NUM_SLOTS * (60 / BPM) * 4;

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white p-6 flex flex-col">
      <header className="flex justify-between items-center border-b border-[#282828] pb-4 flex-shrink-0">
        <img src="/napbak app.png" alt="Napbak Logo" className="h-10 w-auto" />
        <p className="text-[#b3b3b3] text-lg m-0">BPM: {BPM}</p>
      </header>

      <div className="flex flex-row flex-1 gap-6 pt-6">
        {/* Left Panel: Sample Library */}
        <div className="w-1/4 flex-shrink-0">
          <SampleLibrary />
        </div>

        {/* Right Panel: Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="relative flex-1 flex flex-col justify-around">
            <Playhead 
              isPlaying={isPlaying}
              playbackTime={playbackTime}
              totalDuration={visibleDuration} // Usamos la duración visible, no la total de la canción
            />
            {TRACK_TYPES.map(type => (
              <Track
                key={type}
                type={type}
                volume={volumes[type as TrackType]}
                slots={trackSlots[type as TrackType]}
                onDrop={handleDrop}
                onClear={handleClear}
              />
            ))}
          </main>

          <div className="border-t border-[#282828] pt-4">
            <PlaybackTracker currentTime={playbackTime} totalDuration={totalDuration} />
            <PlaybackControls
              isPlaying={isPlaying}
              isExporting={isExporting}
              onPlayPause={handlePlayPause}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;




