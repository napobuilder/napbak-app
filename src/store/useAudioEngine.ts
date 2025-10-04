import { create } from 'zustand';
import { useTrackStore } from './useTrackStore';
import { useUIStore } from './useUIStore';
import type { Sample, TrackType } from '../types';

const TRACK_TYPES: TrackType[] = ['Drums', 'Bass', 'Melody', 'Fills', 'SFX'];

const BPM = 90;

let audioContext: AudioContext;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

interface AudioEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  playbackTime: number;
  isExporting: boolean;
  previewSource: AudioBufferSourceNode | null;
  previewUrl: string | null;
  trackGainNodes: { [key: string]: GainNode | null };
  init: () => void;
  setTrackVolume: (trackType: TrackType, volume: number) => void;
  loadAudioBuffer: (url: string) => Promise<AudioBuffer | null>;
  previewSample: (url: string) => Promise<void>;
  handlePlayPause: () => Promise<void>;
  handleExport: () => void;
}

const audioBuffers: { [key: string]: AudioBuffer } = {};
let playingSources: AudioBufferSourceNode[] = [];
let animationFrameId: number | null = null;
let playbackStartTime = 0;

export const useAudioEngine = create<AudioEngineState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  playbackTime: 0,
  isExporting: false,
  previewSource: null,
  previewUrl: null,
  trackGainNodes: {},

  init: () => {
    if (get().isInitialized) return;
    const audioContext = getAudioContext();
    const gainNodes: { [key: string]: GainNode } = {};
    const initialVolumes = useTrackStore.getState().volumes;
    for (const type of TRACK_TYPES) {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = initialVolumes[type];
      gainNode.connect(audioContext.destination);
      gainNodes[type] = gainNode;
    }
    set({ trackGainNodes: gainNodes, isInitialized: true });
  },

  setTrackVolume: (trackType, volume) => {
    const gainNode = get().trackGainNodes[trackType];
    if (gainNode) {
      gainNode.gain.setTargetAtTime(volume, getAudioContext().currentTime, 0.01);
    }
  },

  loadAudioBuffer: async (url) => {
    if (audioBuffers[url]) return audioBuffers[url];
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffers[url] = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error(`Error loading audio from ${url}:`, error);
      return null;
    }
  },

  previewSample: async (url) => {
    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    if (get().previewUrl === url) {
      get().previewSource?.stop();
      set({ previewSource: null, previewUrl: null });
      return;
    }

    if (get().previewSource) get().previewSource?.stop();
    set({ previewSource: null, previewUrl: null });

    const audioBuffer = await get().loadAudioBuffer(url);
    if (audioBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      set({ previewSource: source, previewUrl: url });
      source.onended = () => {
        if (get().previewSource === source) {
          set({ previewSource: null, previewUrl: null });
        }
      };
    }
  },

  handlePlayPause: async () => {
    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    const { trackSlots, totalDuration, numSlots } = useTrackStore.getState();

    const stopPlayback = () => {
      playingSources.forEach(source => { try { source.stop(); } catch {} });
      playingSources = [];
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      set({ isPlaying: false, playbackTime: 0 });
    };

    if (get().isPlaying) {
      stopPlayback();
      return;
    }

    set({ isPlaying: true });
    playbackStartTime = audioContext.currentTime;
    const sourcesToPlay: AudioBufferSourceNode[] = [];
    const measureDuration = (60 / BPM) * 4;

    for (const trackType of TRACK_TYPES) {
      const trackGainNode = get().trackGainNodes[trackType];
      if (!trackGainNode) continue;

      let i = 0;
      while (i < numSlots) {
        const sample = trackSlots[trackType as TrackType][i];
        if (sample) {
          const audioBuffer = await get().loadAudioBuffer(sample.url);
          if (audioBuffer) {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(trackGainNode);
            const scheduledTime = playbackStartTime + (i + (sample.offset || 0)) * measureDuration;
            const samplePlayDuration = (sample.duration || 1) * measureDuration;
            source.start(scheduledTime, 0, samplePlayDuration);
            sourcesToPlay.push(source);
          }
          i += sample.duration || 1;
        } else {
          i++;
        }
      }
    }
    playingSources = sourcesToPlay;

    const updateProgress = () => {
      const elapsedTime = audioContext.currentTime - playbackStartTime;
      if (elapsedTime >= totalDuration) {
        stopPlayback();
      } else {
        set({ playbackTime: elapsedTime });
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };
    animationFrameId = requestAnimationFrame(updateProgress);
  },

  handleExport: () => {
    const { showFileNameModal } = useUIStore.getState();
    showFileNameModal(async (fileName) => {
      set({ isExporting: true });
      try {
        const { trackSlots, totalDuration, volumes, numSlots } = useTrackStore.getState();
        const audioContext = getAudioContext();
        let finalFileName = fileName;
        if (!finalFileName) finalFileName = "napbak-beat.wav";
        if (!finalFileName.toLowerCase().endsWith('.wav')) finalFileName += '.wav';

        const offlineCtx = new OfflineAudioContext(2, audioContext.sampleRate * totalDuration, audioContext.sampleRate);
        const measureDuration = (60 / BPM) * 4;

        for (const trackType of TRACK_TYPES) {
          let i = 0;
          while (i < numSlots) {
            const sample = trackSlots[trackType as TrackType][i];
            if (sample) {
              const audioBuffer = await get().loadAudioBuffer(sample.url);
              if (audioBuffer) {
                const source = offlineCtx.createBufferSource();
                source.buffer = audioBuffer;
                const gainNode = offlineCtx.createGain();
                gainNode.gain.value = volumes[trackType as TrackType];
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
        const blob = new Blob([wav], { type: 'audio/wav' });

        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: finalFileName,
              types: [{ description: 'WAV file', accept: { 'audio/wav': ['.wav'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (err) {
            console.log("Guardado cancelado por el usuario.", err);
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
        console.error("Error durante la exportación:", error);
      } finally {
        set({ isExporting: false });
      }
    });
  },
}));

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