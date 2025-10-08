import { create } from 'zustand';
import { useTrackStore } from './useTrackStore';
import { useUIStore } from './useUIStore';
import type { Track } from '../types';

const BPM = 90;

const getAudioContext = (() => {
  let audioContext: AudioContext | null = null;
  return () => {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
        return null;
      }
    }
    return audioContext;
  };
})();

interface AudioEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  playbackTime: number;
  isExporting: boolean;
  previewSource: AudioBufferSourceNode | null;
  previewUrl: string | null;
  loadingPreviewUrl: string | null; // Lock to prevent race conditions
  trackGainNodes: { [key: string]: GainNode | null };
  init: () => void;
  initializeTrackGainNodes: () => void;
  subscribeToTrackStore: () => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  loadAudioBuffer: (url: string) => Promise<AudioBuffer | null>;
  previewSample: (url: string) => Promise<void>;
  handlePlayPause: () => Promise<void>;
  handleStop: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  seekPlayback: (time: number) => void;
  handleExport: () => void;
}

const audioBuffers: { [key: string]: AudioBuffer } = {};
let playingSources: AudioBufferSourceNode[] = [];
let animationFrameId: number | null = null;
let playbackStartTime = 0;

const scheduleTrack = (
  track: Track,
  currentTime: number,
  elapsedTime: number,
  measureDuration: number,
  numSlots: number,
  trackGainNode: GainNode,
  totalDuration: number
) => {
  const newSources: AudioBufferSourceNode[] = [];
  const loopedElapsedTime = totalDuration > 0 ? elapsedTime % totalDuration : elapsedTime;

  let i = 0;
  while (i < numSlots) {
    const sample = track.slots[i];
    if (sample) {
      const audioBuffer = audioBuffers[sample.url];
      if (audioBuffer) {
        const sampleDurationInSeconds = (sample.duration || 1) * measureDuration;
        const sampleStartTimeInSeconds = (i + (sample.offset || 0)) * measureDuration;
        const sampleEndTimeInSeconds = sampleStartTimeInSeconds + sampleDurationInSeconds;
        const audioContext = getAudioContext();
        if (!audioContext) return [];

        // Case 1: The sample is completely in the future (relative to the looped time)
        if (sampleStartTimeInSeconds >= loopedElapsedTime) {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(trackGainNode);
          const startOffset = sampleStartTimeInSeconds - loopedElapsedTime;
          source.start(currentTime + startOffset, 0, sampleDurationInSeconds);
          newSources.push(source);
        } 
        // Case 2: The sample should be playing right now
        else if (sampleEndTimeInSeconds > loopedElapsedTime) {
          const offset = loopedElapsedTime - sampleStartTimeInSeconds;
          const remainingDuration = sampleDurationInSeconds - offset;
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(trackGainNode);
          // Start immediately from the calculated offset and for the remaining duration
          source.start(currentTime, offset, remainingDuration);
          newSources.push(source);
        }
        // Case 3: The sample is completely in the past (do nothing)
      }
      i += sample.duration || 1;
    } else {
      i++;
    }
  }
  return newSources;
};

export const useAudioEngine = create<AudioEngineState>((set, get) => {
  const schedulePlayback = () => {
    // Detener todas las fuentes previamente programadas para limpiar la línea de tiempo
    playingSources.forEach(source => { try { source.stop(); } catch {} });

    const { tracks, numSlots, soloedTrackId, totalDuration } = useTrackStore.getState();
    let newSources: AudioBufferSourceNode[] = [];
    const measureDuration = (60 / BPM) * 4;
    const audioContext = getAudioContext();
    if (!audioContext) return;
    const currentTime = audioContext.currentTime;
    const elapsedTime = currentTime - playbackStartTime;

    for (const track of tracks) {
      const trackGainNode = get().trackGainNodes[track.id];
      if (!trackGainNode) continue;

      // Lógica de Solo/Mute
      const isMuted = track.isMuted;
      const anotherTrackIsSoloed = soloedTrackId !== null && soloedTrackId !== track.id;
      if (isMuted || anotherTrackIsSoloed) {
        continue; // Saltar la programación de esta pista
      }

      const trackSources = scheduleTrack(
        track,
        currentTime,
        elapsedTime,
        measureDuration,
        numSlots,
        trackGainNode,
        totalDuration
      );
      newSources = newSources.concat(trackSources);
    }
    playingSources = newSources;
  };

  const store = {
    isInitialized: false,
    isPlaying: false,
    playbackTime: 0,
    isExporting: false,
    previewSource: null,
    previewUrl: null,
    loadingPreviewUrl: null,
    trackGainNodes: {},

    init: () => {
      if (get().isInitialized) return;
      const audioContext = getAudioContext();
      if (!audioContext) return;

      get().initializeTrackGainNodes();
      get().subscribeToTrackStore();

      set({ isInitialized: true });
    },


    initializeTrackGainNodes: () => {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      const initialGainNodes: { [key: string]: GainNode } = {};
      const { tracks } = useTrackStore.getState();
      for (const track of tracks) {
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(track.volume, audioContext.currentTime);
        gainNode.connect(audioContext.destination);
        initialGainNodes[track.id] = gainNode;
      }
      set({ trackGainNodes: initialGainNodes });
    },

    subscribeToTrackStore: () => {
      // This subscription ensures gain nodes are always in sync with the tracks state.
      useTrackStore.subscribe((state, prevState) => {
        const audioContext = getAudioContext();
        if (!audioContext) return;

        const currentTrackIds = new Set(state.tracks.map(t => t.id));
        const newGainNodes = { ...get().trackGainNodes };
        let gainNodesChanged = false;

        // Create gain nodes for new tracks (including on initial hydration)
        for (const track of state.tracks) {
          if (!newGainNodes[track.id]) {
            console.log(`Audio engine: Creating and connecting gain node for track ${track.id}`);
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(track.volume, audioContext.currentTime);
            gainNode.connect(audioContext.destination);
            newGainNodes[track.id] = gainNode;
            gainNodesChanged = true;
          }
        }

        // Disconnect and remove gain nodes for deleted tracks
        for (const trackId in newGainNodes) {
          if (!currentTrackIds.has(trackId)) {
            console.log(`Audio engine: Disconnecting and removing gain node for track ${trackId}`);
            newGainNodes[trackId]?.disconnect();
            delete newGainNodes[trackId];
            gainNodesChanged = true;
          }
        }

        if (gainNodesChanged) {
          set({ trackGainNodes: newGainNodes });
        }

        // If playback is active and tracks/slots have changed, reschedule audio
        if (get().isPlaying && state.tracks !== prevState.tracks) {
          schedulePlayback();
        }
      });
    },

    setTrackVolume: (trackId: string, volume: number) => {
      const gainNode = get().trackGainNodes[trackId];
      const audioContext = getAudioContext();
      if (gainNode && audioContext) {
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(volume, now, 0.015);
      }
    },

    loadAudioBuffer: async (url: string) => {
      if (audioBuffers[url]) return audioBuffers[url];
      const audioContext = getAudioContext();
      if (!audioContext) return null;

      // Ensure the audio context is active before decoding
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers[url] = audioBuffer;
        return audioBuffer;
      } catch (error) {
        console.error(`Error loading audio from ${url}:`, error);
        return null;
      }
    },

    previewSample: async (url: string) => {
      const audioContext = getAudioContext();
      if (!audioContext) return;
      if (audioContext.state === 'suspended') await audioContext.resume();

      const { previewSource, previewUrl, loadingPreviewUrl } = get();

      // If we are already loading a sample, ignore subsequent clicks.
      if (loadingPreviewUrl) {
        return;
      }

      // Stop any currently playing sample.
      if (previewSource) {
        previewSource.onended = null; // Avoid race conditions with the onended handler
        previewSource.stop();
      }

      // If the click is on the currently playing sample, just stop it (toggle off).
      if (previewUrl === url) {
        set({ previewSource: null, previewUrl: null });
        return;
      }

      try {
        // Set the lock
        set({ loadingPreviewUrl: url });

        const audioBuffer = await get().loadAudioBuffer(url);

        if (audioBuffer) {
          const newSource = audioContext.createBufferSource();
          newSource.buffer = audioBuffer;
          newSource.connect(audioContext.destination);
          newSource.start(0);

          set({ previewSource: newSource, previewUrl: url });

          newSource.onended = () => {
            if (get().previewSource === newSource) {
              set({ previewSource: null, previewUrl: null });
            }
          };
        } else {
          // If buffer is null, clear the preview state
          set({ previewSource: null, previewUrl: null });
        }
      } catch (error) {
        console.error(`Error previewing sample ${url}:`, error);
        set({ previewSource: null, previewUrl: null });
      } finally {
        // Release the lock
        set({ loadingPreviewUrl: null });
      }
    },

    handlePlayPause: async () => {
      const audioContext = getAudioContext();
      if (!audioContext) return;
      if (audioContext.state === 'suspended') await audioContext.resume();

      if (get().isPlaying) {
        get().stopPlayback();
      }
      else {
        get().startPlayback();
      }
    },

    handleStop: () => {
      get().stopPlayback();
      get().seekPlayback(0);
    },

    startPlayback: () => {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      set({ isPlaying: true });
      playbackStartTime = audioContext.currentTime - get().playbackTime;
      
      schedulePlayback();

      const updateProgress = () => {
        const { totalDuration } = useTrackStore.getState(); // Obtener el valor más reciente en cada frame
        const now = audioContext.currentTime;
        let elapsedTime = now - playbackStartTime;

        // Detect loop and reschedule audio
        if (totalDuration > 0 && elapsedTime >= totalDuration) {
          const overshoot = elapsedTime - totalDuration;
          playbackStartTime = now - overshoot; // Reset time base for next loop
          elapsedTime = overshoot; // The new elapsed time is the overshoot
          schedulePlayback();
        }
        
        // Always set a looped time for the UI
        const loopedTime = totalDuration > 0 ? elapsedTime % totalDuration : 0;
        set({ playbackTime: loopedTime });

        animationFrameId = requestAnimationFrame(updateProgress);
      };
      animationFrameId = requestAnimationFrame(updateProgress);
    },

    stopPlayback: () => {
      playingSources.forEach(source => { try { source.stop(); } catch {} });
      playingSources = [];
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      set({ isPlaying: false });
    },

    seekPlayback: (time: number) => {
      const { isPlaying } = get();
      const audioContext = getAudioContext();
      if (!audioContext) return;
      const now = audioContext.currentTime;
      
      playbackStartTime = now - time;
      set({ playbackTime: time });

      if (isPlaying) {
        schedulePlayback();
      }
    },

    handleExport: () => {
      const { showFileNameModal } = useUIStore.getState();
      showFileNameModal(async (fileName) => {
        console.log("--- INICIANDO EXPORTACIÓN ---");
        set({ isExporting: true });
        try {
          const { tracks, totalDuration, numSlots } = useTrackStore.getState();
          const audioContext = getAudioContext();

          console.log(`Duración total del beat: ${totalDuration} segundos.`);

          if (!audioContext) {
            console.error("Error: AudioContext no disponible para exportar.");
            set({ isExporting: false });
            return;
          }
          if (totalDuration <= 0) {
            console.error("Error: La duración total es 0. No se puede exportar un beat vacío.");
            set({ isExporting: false });
            // Aquí podrías mostrar una notificación al usuario.
            return;
          }

          let finalFileName = fileName;
          if (!finalFileName) finalFileName = "napbak-beat.wav";
          if (!finalFileName.toLowerCase().endsWith('.wav')) finalFileName += '.wav';
          
          console.log("Creando OfflineAudioContext...");
          const offlineCtx = new OfflineAudioContext(2, Math.ceil(audioContext.sampleRate * totalDuration), audioContext.sampleRate);
          const measureDuration = (60 / BPM) * 4;

          console.log("Programando samples en el contexto offline...");
          for (const track of tracks) {
            let i = 0;
            while (i < numSlots) {
              const sample = track.slots[i];
              if (sample) {
                const audioBuffer = await get().loadAudioBuffer(sample.url);
                if (audioBuffer) {
                  const source = offlineCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  const gainNode = offlineCtx.createGain();
                  gainNode.gain.value = track.volume;
                  source.connect(gainNode).connect(offlineCtx.destination);
                  const scheduledTime = (i + (sample.offset || 0)) * measureDuration;
                  const samplePlayDuration = (sample.duration || 1) * measureDuration;
                  source.start(scheduledTime, 0, samplePlayDuration);
                }
                i += sample.duration || 1;
              } else {
                i++;
              }
            }
          }

          console.log("Iniciando renderizado de audio...");
          const renderedBuffer = await offlineCtx.startRendering();
          console.log("Renderizado completado.");

          console.log("Convirtiendo buffer a formato WAV...");
          const wav = bufferToWav(renderedBuffer);
          const blob = new Blob([wav.buffer as ArrayBuffer], { type: 'audio/wav' });
          console.log(`Blob WAV creado. Tamaño: ${blob.size} bytes.`);

          if (blob.size <= 44) {
             console.error("Error: El blob generado está vacío o solo contiene el encabezado WAV. La exportación ha fallado.");
             set({ isExporting: false });
             return;
          }

          if ('showSaveFilePicker' in window) {
            console.log("Usando API 'showSaveFilePicker' para guardar...");
            try {
              const handle = await (window as any).showSaveFilePicker({
                suggestedName: finalFileName,
                types: [{ description: 'WAV file', accept: { 'audio/wav': ['.wav'] } }],
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              console.log("Archivo guardado exitosamente con showSaveFilePicker.");
            } catch (err) {
              console.log("Guardado cancelado por el usuario o fallido.", err);
            }
          } else {
            console.log("Usando método de fallback (<a> tag) para descargar...");
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = url;
            a.download = finalFileName;
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            console.log("Descarga iniciada con el método de fallback.");
          }
        } catch (error) {
          console.error("Error catastrófico durante la exportación:", error);
        } finally {
          console.log("--- FINALIZANDO EXPORTACIÓN ---");
          set({ isExporting: false });
        }
      });
    },
  };

  return store;
});

const bufferToWav = (buffer: AudioBuffer): DataView => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferWav = new ArrayBuffer(length);
    const view = new DataView(bufferWav);
    const channels: Float32Array[] = [];
    let i, sample, offset = 0, pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return view;
};