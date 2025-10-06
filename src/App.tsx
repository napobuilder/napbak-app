import React, { useEffect, useState } from 'react';
import { useTrackStore } from './store/useTrackStore';
import { useAudioEngine } from './store/useAudioEngine';
import { useUIStore } from './store/useUIStore'; // Importar UI Store
import type { Sample } from './types';

import { SampleLibrary } from './components/SampleLibrary';
import { Mixer } from './components/Mixer'; // Importar el nuevo Mixer
import { Track } from './components/Playlist';
import { PlaybackTracker } from './components/PlaybackTracker';
import { PlaybackControls } from './components/PlaybackControls';
import { FileNameModal } from './components/FileNameModal'; // Importar Modal
import { AddBarsButton } from './components/AddBarsButton'; // Importar nuevo botón
import { ZoomControls } from './components/ZoomControls';

const BASE_SLOT_WIDTH = 64; // Ancho base de un slot en píxeles
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

// --- Componente para la Zona de Drop de Nueva Pista ---
interface NewTrackDropZoneProps {
  onDrop: (sample: Sample) => void;
}

const NewTrackDropZone: React.FC<NewTrackDropZoneProps> = ({ onDrop }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const sampleData = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(sampleData);
    } catch (error) {
      console.error("Error parsing dropped sample data:", error);
    }
  };

  const baseClasses = "h-20 flex items-center justify-center rounded-lg transition-colors duration-200 ease-in-out";
  const inactiveClasses = "bg-[#181818] border-2 border-dashed border-[#333333]";
  const activeClasses = "bg-[#2a2a2a] border-2 border-dashed border-[#1DB954]";

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${baseClasses} ${isOver ? activeClasses : inactiveClasses}`}
    >
      <p className="text-[#b3b3b3]">Drag sample here to create a new track</p>
    </div>
  );
};


const App = () => {
  const {
    tracks,
    totalDuration,
    numSlots,
    addTrackWithSample,
    addSlots,
    toggleMute,
    toggleSolo,
    setVolume,
    handleDrop: handleDropInStore,
    handleClear,
    setTotalDuration,
  } = useTrackStore();

  const { init, isPlaying, playbackTime, isExporting, loadAudioBuffer, handlePlayPause, handleExport } = useAudioEngine();
  const { 
    isFileNameModalOpen, 
    closeFileNameModal, 
    onFileNameSubmit, 
    zoomLevel, 
    zoomIn, 
    zoomOut,
    isPainting,
    isErasing,
    stopPainting,
    stopErasing,
  } = useUIStore();

  useEffect(() => {
    init();
  }, [init]);

  // Global mouse up listener to stop painting/erasing modes
  useEffect(() => {
    const handleMouseUp = () => {
      // Only act if we are in a painting or erasing state
      if (isPainting || isErasing) {
        stopPainting();
        stopErasing();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPainting, isErasing, stopPainting, stopErasing]);

  useEffect(() => {
    // Pre-load audio for samples from persisted state on initial mount
    const allSamples = tracks.flatMap(track => track.slots).filter(Boolean) as Sample[];
    const uniqueUrls = new Set(allSamples.map(sample => sample.url));
    
    if (uniqueUrls.size > 0) {
      console.log(`Pre-loading ${uniqueUrls.size} unique audio buffers from saved project...`);
      uniqueUrls.forEach(url => {
        loadAudioBuffer(url);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // IMPORTANT: Runs only once after rehydration

  useEffect(() => {
    const measureDuration = (60 / BPM) * 4;
    let maxEndSlot = 0;

    for (const track of tracks) {
      for (let i = 0; i < track.slots.length; i++) {
        const sample = track.slots[i];
        if (sample) {
          const endSlot = i + (sample.duration || 1);
          if (endSlot > maxEndSlot) {
            maxEndSlot = endSlot;
          }
        }
      }
    }

    const newTotalDuration = (maxEndSlot > 0 ? maxEndSlot : numSlots) * measureDuration;
    setTotalDuration(newTotalDuration);
  }, [tracks, numSlots, setTotalDuration]);

  const handleDropOnExistingTrack = (trackId: string, slotIndex: number, sample: Sample) => {
    loadAudioBuffer(sample.url);
    handleDropInStore(trackId, slotIndex, sample);
  };

  const handleDropOnNewTrack = (sample: Sample) => {
    loadAudioBuffer(sample.url);
    addTrackWithSample(sample);
  };

  const slotWidth = BASE_SLOT_WIDTH * zoomLevel;
  const visibleDuration = numSlots * (60 / BPM) * 4;

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white p-6 flex flex-col">
      <header className="flex justify-between items-center border-b border-[#282828] pb-4 flex-shrink-0">
        <img src="/napbak app.png" alt="Napbak Logo" className="h-10 w-auto" />
        <p className="text-[#b3b3b3] text-lg m-0">BPM: {BPM}</p>
      </header>

      <div className="flex flex-row flex-1 gap-6 pt-6 min-h-0">
        <div className="w-80 flex-shrink-0">
          <SampleLibrary />
        </div>

        <div className="flex-shrink-0">
          <Mixer />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-1 items-start gap-4 overflow-x-auto">
            <main className="relative flex-1 flex flex-col gap-2.5">
              <Playhead 
                isPlaying={isPlaying}
                playbackTime={playbackTime}
                totalDuration={visibleDuration}
              />
              {tracks.map(track => (
                <Track
                  key={track.id}
                  track={track}
                  numSlots={numSlots}
                  slotWidth={slotWidth}
                  onDrop={handleDropOnExistingTrack}
                  onClear={handleClear}
                />
              ))}
              <NewTrackDropZone onDrop={handleDropOnNewTrack} />
            </main>
            <AddBarsButton onClick={() => addSlots(8)} />
          </div>

          <div className="border-t border-[#282828] pt-4">
            <PlaybackTracker currentTime={playbackTime} totalDuration={totalDuration} />
            <div className="flex justify-between items-center mt-4">
              <PlaybackControls
                isPlaying={isPlaying}
                isExporting={isExporting}
                onPlayPause={handlePlayPause}
                onExport={handleExport}
              />
              <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} />
            </div>
          </div>
        </div>
      </div>
      
      <FileNameModal 
        isOpen={isFileNameModalOpen}
        onClose={closeFileNameModal}
        onSubmit={(fileName) => {
          if (onFileNameSubmit) {
            onFileNameSubmit(fileName);
          }
          closeFileNameModal();
        }}
      />
    </div>
  );
};

export default App;
