import { create } from 'zustand';
import { useTrackStore } from './useTrackStore';
import type { TrackType } from '../types';

const TRACK_TYPES: TrackType[] = ['Drums', 'Bass', 'Melody', 'Fills', 'SFX'];
const NUM_SLOTS = 8;
const BPM = 90;

let audioContext: AudioContext;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

interface AudioEngineState {
  isPlaying: boolean;
  playbackTime: number;
  isExporting: boolean;
  loadAudioBuffer: (url: string) => Promise<AudioBuffer | null>;
  handlePlayPause: () => Promise<void>;
  handleExport: () => Promise<void>;
}

const audioBuffers: { [key: string]: AudioBuffer } = {};
let playingSources: AudioBufferSourceNode[] = [];
let animationFrameId: number | null = null;
let playbackStartTime = 0;

export const useAudioEngine = create<AudioEngineState>((set, get) => ({
  isPlaying: false,
  playbackTime: 0,
  isExporting: false,

  loadAudioBuffer: async (url: string) => {
    if (audioBuffers[url]) {
      return audioBuffers[url];
    }
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

  handlePlayPause: async () => {
    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const { trackSlots, totalDuration } = useTrackStore.getState();

    const stopPlayback = () => {
      playingSources.forEach(source => {
        try {
          source.stop();
        } catch {}
      });
      playingSources = [];
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
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
      let i = 0;
      while (i < NUM_SLOTS) {
        const sample = trackSlots[trackType as TrackType][i];
        if (sample) {
          const audioBuffer = await get().loadAudioBuffer(sample.url);
          if (audioBuffer) {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            const scheduledTime = playbackStartTime + i * measureDuration;
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

  handleExport: async () => {
    set({ isExporting: true });
    const { trackSlots, totalDuration } = useTrackStore.getState();
    const audioContext = getAudioContext();

    const offlineCtx = new OfflineAudioContext(2, audioContext.sampleRate * totalDuration, audioContext.sampleRate);
    const measureDuration = (60 / BPM) * 4;

    for (const trackType of TRACK_TYPES) {
      let i = 0;
      while (i < NUM_SLOTS) {
        const sample = trackSlots[trackType as TrackType][i];
        if (sample) {
          const audioBuffer = await get().loadAudioBuffer(sample.url);
          if (audioBuffer) {
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);
            const scheduledTime = i * measureDuration;
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = 'mi-beat.wav';
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    set({ isExporting: false });
  },
}));

// Función para convertir AudioBuffer a WAV
const bufferToWav = (buffer: AudioBuffer): DataView => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferWav = new ArrayBuffer(length);
    const view = new DataView(bufferWav);
    const channels: Float32Array[] = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

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