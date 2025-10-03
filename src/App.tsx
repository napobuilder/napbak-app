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

  return (
    <div className="flex flex-col h-screen bg-[#121212] font-sans">
      <header className="p-3.75 flex justify-between items-center border-b border-[#282828]">
        <h1 className="text-white text-2xl font-bold m-0">BeatMaker MVP</h1>
        <p className="text-[#b3b3b3] text-lg m-0">BPM: {BPM}</p>
      </header>

      <main className="flex-2 p-2.5 flex flex-col justify-around">
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

      <div className="border-t border-[#282828] px-3.75">
        <PlaybackTracker currentTime={playbackTime} totalDuration={totalDuration} />
        <PlaybackControls
          isPlaying={isPlaying}
          isExporting={isExporting}
          onPlayPause={handlePlayPause}
          onExport={handleExport}
        />
      </div>

      <footer className="flex-grow min-h-[150px]">
        <SampleLibrary />
      </footer>
    </div>
  );
};

export default App;




