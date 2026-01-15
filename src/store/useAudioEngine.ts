import { create } from 'zustand';
import * as Tone from 'tone';
import { useTrackStore } from './useTrackStore';
import { useUIStore } from './useUIStore';
import type { Track } from '../types';
import { getPitchShiftInSemitones } from '../lib/tonal';

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
  previewSource: Tone.Player | null;
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
let playingSources: (Tone.Player | AudioBufferSourceNode)[] = [];
let animationFrameId: number | null = null;
let playbackStartTime = 0;

// --- SCHEDULING LOGIC (OLD vs NEW) ---

// V1: Simple detune (changes BPM)
const scheduleTrack = (
  track: Track,
  currentTime: number,
  elapsedTime: number,
  measureDuration: number,
  numSlots: number,
  trackGainNode: GainNode,
  totalDuration: number,
  projectKey: string | null // <-- NEW: Project key for tuning
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

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        // --- PITCH SHIFTING LOGIC ---
        if (sample.type === 'Melody' && sample.key && projectKey) {
          const semitones = getPitchShiftInSemitones(sample.key, projectKey);
          if (source.detune) {
            source.detune.value = semitones * 100; // detune is in cents
          }
        }
        // --- END PITCH SHIFTING ---

        source.connect(trackGainNode);

        // Case 1: The sample is completely in the future (relative to the looped time)
        if (sampleStartTimeInSeconds >= loopedElapsedTime) {
          const startOffset = sampleStartTimeInSeconds - loopedElapsedTime;
          source.start(currentTime + startOffset, 0, sampleDurationInSeconds);
          newSources.push(source);
        } 
        // Case 2: The sample should be playing right now
        else if (sampleEndTimeInSeconds > loopedElapsedTime) {
          const offset = loopedElapsedTime - sampleStartTimeInSeconds;
          const remainingDuration = sampleDurationInSeconds - offset;
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

// V2: Tone.js PitchShift (preserves BPM)
const scheduleTrackWithPitchShift = async (
  track: Track,
  currentTime: number,
  elapsedTime: number,
  measureDuration: number,
  numSlots: number,
  trackGainNode: GainNode,
  totalDuration: number,
  projectKey: string | null
) => {
  const newSources: Tone.Player[] = [];
  const loopedElapsedTime = totalDuration > 0 ? elapsedTime % totalDuration : elapsedTime;

  for (let i = 0; i < numSlots; ) {
    const sample = track.slots[i];
    if (sample && audioBuffers[sample.url]) {
      const audioBuffer = audioBuffers[sample.url];
      const sampleDurationInSeconds = (sample.duration || 1) * measureDuration;
      const sampleStartTimeInSeconds = (i + (sample.offset || 0)) * measureDuration;
      const sampleEndTimeInSeconds = sampleStartTimeInSeconds + sampleDurationInSeconds;

      let semitones = 0;
      if (sample.type === 'Melody' && sample.key && projectKey) {
        semitones = getPitchShiftInSemitones(sample.key, projectKey);
      }

      const player = new Tone.Player(audioBuffer);
      const pitchShift = new Tone.PitchShift({ pitch: semitones }).connect(trackGainNode);
      player.connect(pitchShift);

      if (sampleStartTimeInSeconds >= loopedElapsedTime) {
        const startOffset = sampleStartTimeInSeconds - loopedElapsedTime;
        player.start(currentTime + startOffset, 0, sampleDurationInSeconds);
        newSources.push(player);
      } else if (sampleEndTimeInSeconds > loopedElapsedTime) {
        const offset = loopedElapsedTime - sampleStartTimeInSeconds;
        const remainingDuration = sampleDurationInSeconds - offset;
        player.start(currentTime, offset, remainingDuration);
        newSources.push(player);
      }
      i += sample.duration || 1;
    } else {
      i++;
    }
  }
  return newSources;
};

export const useAudioEngine = create<AudioEngineState>((set, get) => {
  const schedulePlayback = async () => {
    playingSources.forEach(source => { 
      try { 
        source.stop(); 
        (source as any).dispose?.(); 
      } catch {} 
    });

    const { tracks, numSlots, soloedTrackId, totalDuration, projectKey } = useTrackStore.getState();
    const PITCH_SHIFT_ENABLED = false; // <-- SAFETY SWITCH

    let newSources: (AudioBufferSourceNode | Tone.Player)[] = [];
    const measureDuration = (60 / BPM) * 4;
    const audioContext = getAudioContext();
    if (!audioContext) return;
    const currentTime = audioContext.currentTime;
    const elapsedTime = currentTime - playbackStartTime;

    for (const track of tracks) {
      const trackGainNode = get().trackGainNodes[track.id];
      if (!trackGainNode) continue;

      const isMuted = track.isMuted;
      const anotherTrackIsSoloed = soloedTrackId !== null && soloedTrackId !== track.id;
      if (isMuted || anotherTrackIsSoloed) continue;

      let trackSources: (AudioBufferSourceNode | Tone.Player)[] = [];
      if (PITCH_SHIFT_ENABLED && track.type === 'Melody') {
        trackSources = await scheduleTrackWithPitchShift(track, currentTime, elapsedTime, measureDuration, numSlots, trackGainNode, totalDuration, projectKey);
      } else {
        trackSources = scheduleTrack(track, currentTime, elapsedTime, measureDuration, numSlots, trackGainNode, totalDuration, projectKey);
      }
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
      useTrackStore.subscribe((state, prevState) => {
        const audioContext = getAudioContext();
        if (!audioContext) return;

        const currentTrackIds = new Set(state.tracks.map(t => t.id));
        const newGainNodes = { ...get().trackGainNodes };
        let gainNodesChanged = false;

        for (const track of state.tracks) {
          if (!newGainNodes[track.id]) {
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(track.volume, audioContext.currentTime);
            gainNode.connect(audioContext.destination);
            newGainNodes[track.id] = gainNode;
            gainNodesChanged = true;
          }
        }

        for (const trackId in newGainNodes) {
          if (!currentTrackIds.has(trackId)) {
            newGainNodes[trackId]?.disconnect();
            delete newGainNodes[trackId];
            gainNodesChanged = true;
          }
        }

        if (gainNodesChanged) {
          set({ trackGainNodes: newGainNodes });
        }

        if (get().isPlaying && (state.tracks !== prevState.tracks || state.projectKey !== prevState.projectKey)) {
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

      if (loadingPreviewUrl) {
        return;
      }

      if (previewSource) {
        previewSource.stop();
        previewSource.dispose();
      }

      if (previewUrl === url) {
        set({ previewSource: null, previewUrl: null });
        return;
      }

      try {
        set({ loadingPreviewUrl: url });
        await Tone.start(); // Ensure Tone.js is ready
        const audioBuffer = await get().loadAudioBuffer(url);

        if (audioBuffer) {
          const player = new Tone.Player(audioBuffer).toDestination();
          player.start();

          set({ previewSource: player, previewUrl: url });

          player.onstop = () => {
            if (get().previewSource === player) {
              set({ previewSource: null, previewUrl: null });
            }
          };
        } else {
          set({ previewSource: null, previewUrl: null });
        }
      } catch (error) {
        console.error(`Error previewing sample ${url}:`, error);
        set({ previewSource: null, previewUrl: null });
      } finally {
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
        const { totalDuration } = useTrackStore.getState();
        const now = audioContext.currentTime;
        let elapsedTime = now - playbackStartTime;

        if (totalDuration > 0 && elapsedTime >= totalDuration) {
          const overshoot = elapsedTime - totalDuration;
          playbackStartTime = now - overshoot;
          elapsedTime = overshoot;
          schedulePlayback();
        }
        
        const loopedTime = totalDuration > 0 ? elapsedTime % totalDuration : 0;
        set({ playbackTime: loopedTime });

        animationFrameId = requestAnimationFrame(updateProgress);
      };
      animationFrameId = requestAnimationFrame(updateProgress);
    },

    stopPlayback: () => {
      playingSources.forEach(source => { 
        try { 
          source.stop(); 
          (source as any).dispose?.(); 
        } catch {} 
      });
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
        set({ isExporting: true });
        try {
          const { tracks, totalDuration, numSlots, projectKey } = useTrackStore.getState();
          const audioContext = getAudioContext();

          if (!audioContext || totalDuration <= 0) {
            console.error("AudioContext not ready or nothing to export.");
            set({ isExporting: false });
            return;
          }

          let finalFileName = fileName || "napbak-beat.wav";
          if (!finalFileName.toLowerCase().endsWith('.wav')) finalFileName += '.wav';
          
          const offlineCtx = new OfflineAudioContext(2, Math.ceil(audioContext.sampleRate * totalDuration), audioContext.sampleRate);
          const measureDuration = (60 / BPM) * 4;

          for (const track of tracks) {
            let i = 0;
            while (i < numSlots) {
              const sample = track.slots[i];
              if (sample) {
                const audioBuffer = await get().loadAudioBuffer(sample.url);
                if (audioBuffer) {
                  const source = offlineCtx.createBufferSource();
                  source.buffer = audioBuffer;

                  // --- EXPORT PITCH SHIFTING ---
                  if (sample.type === 'Melody' && sample.key && projectKey) {
                    const semitones = getPitchShiftInSemitones(sample.key, projectKey);
                    if (source.detune) {
                      source.detune.value = semitones * 100;
                    }
                  }
                  // --- END PITCH SHIFTING ---

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

          const renderedBuffer = await offlineCtx.startRendering();
          const wav = bufferToWav(renderedBuffer);
          const blob = new Blob([wav.buffer as ArrayBuffer], { type: 'audio/wav' });

          if (blob.size <= 44) {
             console.error("Export failed: resulting file is empty.");
             set({ isExporting: false });
             return;
          }

          if ('showSaveFilePicker' in window) {
            try {
              const handle = await (window as any).showSaveFilePicker({
                suggestedName: finalFileName,
                types: [{ description: 'WAV file', accept: { 'audio/wav': ['.wav'] } }],
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
            } catch (err) {
              console.log("Save dialog cancelled by user.", err);
            }
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = url;
            a.download = finalFileName;
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } catch (error) {
          console.error("Catastrophic error during export:", error);
        } finally {
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