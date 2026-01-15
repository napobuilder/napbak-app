import { useEffect, useState } from 'react';
import { useTrackStore } from './store/useTrackStore';
import { useAudioEngine } from './store/useAudioEngine';
import { useUIStore } from './store/useUIStore';
import { supabase } from './lib/supabaseClient';
import { Toaster, toast } from 'sonner';
import type { Sample, Project } from './types';

import { SampleLibrary } from './components/SampleLibrary';
import { Mixer } from './components/Mixer';
import { MobileMixerPanel } from './components/MobileMixerPanel';
import { MobileDrawer } from './components/MobileDrawer';
import { Track } from './components/Playlist';
import { FileNameModal } from './components/FileNameModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AddBarsButton } from './components/AddBarsButton';
import { ZoomControls } from './components/ZoomControls';
import { TimelineRuler } from './components/TimelineRuler';
import { Playhead } from './components/Playhead';
import { SongOverview } from './components/SongOverview';
import { ProjectPanel } from './components/ProjectPanel';
import { SaveProjectView } from './components/SaveProjectView';
import { LoadProjectView } from './components/LoadProjectView';
import { TopBar } from './components/TopBar';
import { usePreloadAudio } from './hooks/usePreloadAudio';
import { useGlobalMouseUp } from './hooks/useGlobalMouseUp';
import { useAuth } from './hooks/useAuth';
import LoadingScreen from './components/LoadingScreen';

// --- Componente para la Zona de Drop de Nueva Pista ---
interface NewTrackDropZoneProps {
  onDrop: (sample: Sample) => void;
  isEmpty?: boolean; // Si es la primera pista (canvas vacío)
}

const NewTrackDropZone: React.FC<NewTrackDropZoneProps> = ({ onDrop, isEmpty = false }) => {
  const [isOver, setIsOver] = useState(false);
  const { activeSampleBrush } = useUIStore();

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

  // Mobile: tap to add with active brush
  const handleTap = () => {
    if (activeSampleBrush) {
      onDrop(activeSampleBrush);
    }
  };

  // Estilos diferentes para canvas vacío vs agregar más pistas
  if (isEmpty) {
    const emptyBaseClasses = "min-h-[200px] flex flex-col items-center justify-center rounded-xl transition-all duration-300 ease-in-out touch-manipulation";
    const emptyInactiveClasses = "bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-2 border-dashed border-[#333333]";
    const emptyActiveClasses = "bg-gradient-to-br from-[#1a2f1a] to-[#0f1f0f] border-2 border-dashed border-[#1DB954] scale-[1.02]";

    return (
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleTap}
        className={`${emptyBaseClasses} ${isOver ? emptyActiveClasses : emptyInactiveClasses}`}
      >
        <div className="text-4xl mb-4 opacity-30">🎵</div>
        <p className="text-white text-lg font-medium mb-2">
          {isOver ? "¡Suéltalo aquí!" : "Empieza tu beat"}
        </p>
        <p className="text-[#888] text-sm text-center px-4">
          <span className="hidden lg:inline">Arrastra un sample desde la librería</span>
          <span className="lg:hidden">
            {activeSampleBrush ? "Toca para agregar" : "Selecciona un sample primero"}
          </span>
        </p>
        {!activeSampleBrush && (
          <div className="mt-4 flex items-center gap-2 text-[#666] text-xs">
            <span className="hidden lg:inline">←</span>
            <span>Elige de la librería</span>
          </div>
        )}
      </div>
    );
  }

  // Versión compacta para agregar más pistas
  const baseClasses = "h-16 sm:h-20 flex items-center justify-center rounded-lg transition-colors duration-200 ease-in-out touch-manipulation";
  const inactiveClasses = "bg-[#181818] border-2 border-dashed border-[#333333]";
  const activeClasses = "bg-[#2a2a2a] border-2 border-dashed border-[#1DB954]";
  const hasBrushClasses = activeSampleBrush ? "cursor-copy hover:border-blue-500" : "";

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleTap}
      className={`${baseClasses} ${isOver ? activeClasses : inactiveClasses} ${hasBrushClasses}`}
    >
      <p className="text-[#b3b3b3] text-xs sm:text-sm text-center px-2">
        {activeSampleBrush 
          ? <span className="lg:hidden">Tap para nueva pista</span>
          : <span className="lg:hidden">Selecciona un sample</span>
        }
        <span className="hidden lg:inline">+ Arrastra para nueva pista</span>
      </p>
    </div>
  );
};

const Studio = () => {
  const { session } = useAuth();
  const { tracks, numSlots, loadProject, resetProject } = useTrackStore();
  const { 
    init, 
    isPlaying, 
    playbackTime, 
    isExporting, 
    loadAudioBuffer, 
    handlePlayPause, 
    handleStop, 
    handleExport 
  } = useAudioEngine();
  const { 
    isFileNameModalOpen, 
    closeFileNameModal, 
    onFileNameSubmit, 
    isProjectPanelOpen,
    projectPanelContent,
    projectName,
    setProjectName,
    openProjectPanel,
    closeProjectPanel,
    isConfirmationModalOpen,
    confirmationModalContent,
    onConfirmationSubmit,
    showConfirmationModal,
    closeConfirmationModal,
    zoomIn, 
    zoomOut,
  } = useUIStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSampleLibraryOpen, setIsSampleLibraryOpen] = useState(false);
  const { isLoading: isPreloading, progress } = usePreloadAudio();

  useGlobalMouseUp();

  const handleLogout = async () => {
    handleStop(); // Stop audio playback before signing out
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Logout failed: ${error.message}`);
    }
    // The onAuthStateChange listener in useAuth will handle the redirect
  };

  const handleSaveProject = async (projectName: string) => {
    if (!session) {
      toast.error('You must be logged in to save a project.');
      return;
    }
    
    setIsSaving(true);
    const projectData = { tracks, numSlots };

    try {
      const { error } = await supabase
        .from('projects')
        .upsert({ 
          user_id: session.user.id,
          name: projectName,
          project_data: projectData
        }, { onConflict: 'user_id, name' });

      if (error) throw error;

      setProjectName(projectName);
      toast.success(`Project '${projectName}' saved successfully!`);
      closeProjectPanel();
    } catch (error: any) {
      toast.error(`Error saving project: ${error.message}`);
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleLoadProject = (project: Project) => {
    loadProject(project.project_data);
    setProjectName(project.name);

    // Preload all audio buffers for the newly loaded tracks
    const urlsToLoad = new Set<string>();
    if (project.project_data && project.project_data.tracks) {
      for (const track of project.project_data.tracks) {
        for (const sample of track.slots) {
          if (sample) {
            urlsToLoad.add(sample.url);
          }
        }
      }
    }
    urlsToLoad.forEach(url => loadAudioBuffer(url));

    closeProjectPanel();
    toast.success(`Project '${project.name}' loaded successfully!`);
  };

  const handleNewProject = () => {
    showConfirmationModal(
      {
        title: 'Start New Project',
        message: 'Are you sure you want to start a new project? All unsaved changes will be lost.',
      },
      () => {
        resetProject();
        setProjectName(null);
        toast.success('New project started.');
      }
    );
  };

  const handleSaveClick = () => {
    if (projectName) {
      handleSaveProject(projectName);
    } else {
      openProjectPanel('save');
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        handlePlayPause();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause]);

  useEffect(() => {
    init();
  }, [init]);

  const handleDropOnExistingTrack = (trackId: string, slotIndex: number, sample: Sample) => {
    loadAudioBuffer(sample.url);
    useTrackStore.getState().handleDrop(trackId, slotIndex, sample);
  };

  const handleDropOnNewTrack = (sample: Sample) => {
    loadAudioBuffer(sample.url);
    useTrackStore.getState().addTrackWithSample(sample);
  };

  if (isPreloading) {
    return <LoadingScreen progress={progress} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white flex flex-col">
      <Toaster richColors />
      
      <TopBar 
        isPlaying={isPlaying}
        isExporting={isExporting}
        projectName={projectName}
        playbackTime={playbackTime}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onExport={handleExport}
        onNew={handleNewProject}
        onSave={handleSaveClick}
        onLoad={() => openProjectPanel('load')}
        onLogout={handleLogout}
        onToggleSampleLibrary={() => setIsSampleLibraryOpen(!isSampleLibraryOpen)}
        isSampleLibraryOpen={isSampleLibraryOpen}
      />

      {/* Mobile Sample Library Drawer */}
      <MobileDrawer 
        isOpen={isSampleLibraryOpen}
        onClose={() => setIsSampleLibraryOpen(false)}
        title="Sample Library"
        side="left"
      >
        <SampleLibrary variant="drawer" />
      </MobileDrawer>

      <main className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-6 min-h-0 overflow-hidden">
        {/* Song Overview - más compacto en móvil */}
        <div className="pb-1 lg:pb-2">
          <SongOverview />
        </div>

        {/* Mobile Mixer Panel - colapsable */}
        <MobileMixerPanel />

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row flex-1 gap-3 sm:gap-4 lg:gap-6 min-h-0">
          {/* Desktop Sample Library - hidden on mobile */}
          <div className="hidden lg:block w-80 flex-shrink-0 h-full">
            <SampleLibrary />
          </div>

          {/* Desktop Mixer - hidden on mobile */}
          <div className="hidden lg:flex flex-shrink-0 flex-col gap-2.5">
            <div className="h-6" />
            <Mixer />
          </div>

          {/* Timeline/Tracks Area - main focus on mobile */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Scrollable timeline container */}
            <div className="relative flex-1 overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <Playhead />
              <div className="flex flex-col gap-2 lg:gap-2.5 min-w-max">
                <TimelineRuler />
                {tracks.map(track => (
                  <Track
                    key={track.id}
                    track={track}
                    onDrop={handleDropOnExistingTrack}
                    onClear={useTrackStore.getState().handleClear}
                  />
                ))}
                <div className="flex gap-2 lg:gap-2.5">
                  <div className="flex-1">
                    <NewTrackDropZone onDrop={handleDropOnNewTrack} isEmpty={tracks.length === 0} />
                  </div>
                  {tracks.length > 0 && <AddBarsButton />}
                </div>
              </div>
            </div>

            {/* Zoom Controls Footer */}
            <div className="border-t border-[#282828] pt-2 lg:pt-4 mt-2">
              <div className="flex justify-between sm:justify-end items-center gap-4">
                {/* Mobile: hint text */}
                <p className="text-gray-500 text-xs sm:hidden">
                  ← Desliza para ver más →
                </p>
                <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} />
              </div>
            </div>
          </div>
        </div>
      </main>
      
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

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title={confirmationModalContent.title}
        message={confirmationModalContent.message}
        onConfirm={onConfirmationSubmit!}
        onClose={closeConfirmationModal}
      />

      <ProjectPanel 
        title={projectPanelContent === 'load' ? 'Load Project' : 'Save Project'}
        isOpen={isProjectPanelOpen}
        onClose={closeProjectPanel}
      >
        {projectPanelContent === 'load' ? (
          <LoadProjectView onLoadProject={handleLoadProject} />
        ) : (
          <SaveProjectView onSave={handleSaveProject} isLoading={isSaving} />
        )}
      </ProjectPanel>
    </div>
  );
};

export default Studio;