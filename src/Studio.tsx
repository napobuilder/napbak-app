import React, { useEffect, useState } from 'react';
import { useTrackStore, type TrackState } from './store/useTrackStore';
import { useAudioEngine } from './store/useAudioEngine';
import { useUIStore } from './store/useUIStore';
import { useAuthStore } from './store/useAuthStore';
import { supabase } from './lib/supabaseClient';
import { Toaster, toast } from 'sonner';
import type { Sample, Project } from './types';

import { Auth } from './components/Auth';
import { SampleLibrary } from './components/SampleLibrary';
import { Mixer } from './components/Mixer';
import { Track } from './components/Playlist';
import { PlaybackControls } from './components/PlaybackControls';
import { FileNameModal } from './components/FileNameModal';
import { AddBarsButton } from './components/AddBarsButton';
import { ZoomControls } from './components/ZoomControls';
import { TimelineRuler } from './components/TimelineRuler';
import { Playhead } from './components/Playhead';
import { TimeDisplay } from './components/TimeDisplay';
import { SongOverview } from './components/SongOverview';
import { ProjectPanel } from './components/ProjectPanel';
import { SaveProjectView } from './components/SaveProjectView';
import { LoadProjectView } from './components/LoadProjectView';
import { usePreloadAudio } from './hooks/usePreloadAudio';
import { useGlobalMouseUp } from './hooks/useGlobalMouseUp';

const BASE_SLOT_WIDTH = 64;
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
  const { session } = useAuthStore();
  const { tracks, numSlots, loadProject, resetProject } = useTrackStore();
  const { init, isPlaying, playbackTime, isExporting, loadAudioBuffer, handlePlayPause, handleExport } = useAudioEngine();
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
    zoomIn, 
    zoomOut,
  } = useUIStore();
  
  const [isSaving, setIsSaving] = useState(false);

  usePreloadAudio();
  useGlobalMouseUp();

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
    } finally {
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
    if (window.confirm('Are you sure you want to start a new project? All unsaved changes will be lost.')) {
      resetProject();
      setProjectName(null);
      toast.success('New project started.');
    }
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

  if (!session) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white p-6 flex flex-col">
      <Toaster richColors />
      <header className="flex justify-between items-center border-b border-[#282828] pb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <img src="/napbak app.png" alt="Napbak Logo" className="h-10 w-auto" />
          <button 
            onClick={handleNewProject}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            New Project
          </button>
          <button 
            onClick={handleSaveClick}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Save Project
          </button>
          <button 
            onClick={() => openProjectPanel('save')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Save As...
          </button>
          <button 
            onClick={() => openProjectPanel('load')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Load Projects
          </button>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold truncate">{projectName || 'Untitled Project'}</h1>
          <p className="text-[#b3b3b3] text-lg m-0">BPM: {BPM}</p>
        </div>
      </header>

      <div className="pt-4 pb-2">
        <SongOverview />
      </div>

      <div className="flex flex-row flex-1 gap-6 pt-6 min-h-0">
        <div className="w-80 flex-shrink-0">
          <SampleLibrary />
        </div>

        <div className="flex-shrink-0 flex flex-col gap-2.5">
          <div className="h-6" />
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
                  onClear={useTrackStore.getState().handleClear}
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