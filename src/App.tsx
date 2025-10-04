import React, { useEffect } from 'react';
import { useTrackStore } from './store/useTrackStore';
import { useAudioEngine } from './store/useAudioEngine';
import { useUIStore } from './store/useUIStore'; // Importar UI Store
import type { Sample, TrackType } from './types';

import { SampleLibrary } from './components/SampleLibrary';
import { Track } from './components/Playlist';
import { PlaybackTracker } from './components/PlaybackTracker';
import { PlaybackControls } from './components/PlaybackControls';
import { FileNameModal } from './components/FileNameModal'; // Importar Modal
import { AddBarsButton } from './components/AddBarsButton'; // Importar nuevo botón
import { ZoomControls } from './components/ZoomControls';

const TRACK_TYPES: TrackType[] = ['Drums', 'Bass', 'Melody', 'Fills', 'SFX'];
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

const App = () => {
  const {
    trackSlots,
    totalDuration,
    volumes,
    numSlots, // Leer numSlots desde el store
    mutedTracks, // Estado de Mute
    soloedTrack, // Estado de Solo
    addSlots, // Obtener la acción addSlots
    toggleMute, // Acción de Mute
    toggleSolo, // Acción de Solo
    setVolume,
    handleDrop: handleDropInStore,
    handleClear,
    setTotalDuration,
  } = useTrackStore();

  const { init, isPlaying, playbackTime, isExporting, loadAudioBuffer, handlePlayPause, handleExport } = useAudioEngine();
  const { isFileNameModalOpen, closeFileNameModal, onFileNameSubmit, zoomLevel, zoomIn, zoomOut } = useUIStore();

  useEffect(() => {
    init();
  }, [init]);

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

    const newTotalDuration = (maxEndSlot > 0 ? maxEndSlot : numSlots) * measureDuration;
    setTotalDuration(newTotalDuration);
  }, [trackSlots, numSlots, setTotalDuration]);

  const handleDrop = (trackType: TrackType, slotIndex: number, sample: Sample) => {
    loadAudioBuffer(sample.url);
    handleDropInStore(trackType, slotIndex, sample);
  };

  const slotWidth = BASE_SLOT_WIDTH * zoomLevel;
  // La duración de la vista actual de la playlist
  const visibleDuration = numSlots * (60 / BPM) * 4;

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white p-6 flex flex-col">
      <header className="flex justify-between items-center border-b border-[#282828] pb-4 flex-shrink-0">
        <img src="/napbak app.png" alt="Napbak Logo" className="h-10 w-auto" />
        <p className="text-[#b3b3b3] text-lg m-0">BPM: {BPM}</p>
      </header>

      <div className="flex flex-row flex-1 gap-6 pt-6 min-h-0">
        {/* Left Panel: Sample Library */}
        <div className="w-80 flex-shrink-0">
          <SampleLibrary />
        </div>

        {/* Right Panel: Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-1 items-center gap-4 overflow-x-auto">
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
                  setVolume={setVolume}
                  slots={trackSlots[type as TrackType]}
                  numSlots={numSlots}
                  slotWidth={slotWidth} // Pasar el ancho del slot
                  isMuted={mutedTracks.includes(type)}
                  isSoloed={soloedTrack === type}
                  onToggleMute={() => toggleMute(type)}
                  onToggleSolo={() => toggleSolo(type)}
                  onDrop={handleDrop}
                  onClear={handleClear}
                />
              ))}
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
