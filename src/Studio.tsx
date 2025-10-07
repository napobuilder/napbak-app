import React, { useEffect, useState } from 'react';
import { useTrackStore } from './store/useTrackStore';
import { useAudioEngine } from './store/useAudioEngine';
import { useUIStore } from './store/useUIStore'; // Importar UI Store
import type { Sample } from './types';

import { SampleLibrary } from './components/SampleLibrary';
import { Mixer } from './components/Mixer'; // Importar el nuevo Mixer
import { Track } from './components/Playlist';
import { PlaybackControls } from './components/PlaybackControls';
import { FileNameModal } from './components/FileNameModal'; // Importar Modal
import { AddBarsButton } from './components/AddBarsButton'; // Importar nuevo botón
import { ZoomControls } from './components/ZoomControls';
import { TimelineRuler } from './components/TimelineRuler';
import { Playhead } from './components/Playhead';
import { TimeDisplay } from './components/TimeDisplay';
import { SongOverview } from './components/SongOverview';
import { usePreloadAudio } from './hooks/usePreloadAudio';
import { useGlobalMouseUp } from './hooks/useGlobalMouseUp';


const BASE_SLOT_WIDTH = 64; // Ancho base de un slot en píxeles
const BPM = 90;

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


const Studio = () => {
  const {
    tracks,
    addTrackWithSample,
    handleDrop: handleDropInStore,
    handleClear,
  } = useTrackStore();

  const { init, isPlaying, playbackTime, isExporting, loadAudioBuffer, handlePlayPause, handleExport } = useAudioEngine();
  const { 
    isFileNameModalOpen, 
    closeFileNameModal, 
    onFileNameSubmit, 
    zoomIn, 
    zoomOut,
  } = useUIStore();

  usePreloadAudio();
  useGlobalMouseUp();

  // Disable global context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Global spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause]);

  useEffect(() => {
    init();
  }, [init]);

  const handleDropOnExistingTrack = (trackId: string, slotIndex: number, sample: Sample) => {
    loadAudioBuffer(sample.url);
    handleDropInStore(trackId, slotIndex, sample);
  };

  const handleDropOnNewTrack = (sample: Sample) => {
    loadAudioBuffer(sample.url);
    addTrackWithSample(sample);
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white p-6 flex flex-col">
      <header className="flex justify-between items-center border-b border-[#282828] pb-4 flex-shrink-0">
        <img src="/napbak app.png" alt="Napbak Logo" className="h-10 w-auto" />
        <p className="text-[#b3b3b3] text-lg m-0">BPM: {BPM}</p>
      </header>

      <div className="pt-4 pb-2">
        <SongOverview />
      </div>

      <div className="flex flex-row flex-1 gap-6 pt-6 min-h-0">
        <div className="w-80 flex-shrink-0">
          <SampleLibrary />
        </div>

        <div className="flex-shrink-0 flex flex-col gap-2.5">
          <div className="h-6" /> {/* Espaciador para alinear con TimelineRuler */}
          <Mixer />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative flex-1 overflow-x-auto">
            <Playhead />
            <div className="flex flex-col gap-2.5">
              <TimelineRuler />
              {tracks.map(track => (
                <Track
                  key={track.id}
                  track={track}
                  onDrop={handleDropOnExistingTrack}
                  onClear={handleClear}
                />
              ))}
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <NewTrackDropZone onDrop={handleDropOnNewTrack} />
                </div>
                <AddBarsButton />
              </div>
            </div>
          </div>

          <div className="border-t border-[#282828] pt-4">
            <div className="flex justify-between items-center mt-4">
              <PlaybackControls
                isPlaying={isPlaying}
                isExporting={isExporting}
                onPlayPause={handlePlayPause}
                onExport={handleExport}
              />
              <TimeDisplay currentTime={playbackTime} />
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

export default Studio;
