import type { Sample, SampleCategory } from './types';

// 1 slot = 1 measure (4 beats)
export const SAMPLES: Record<SampleCategory, Sample[]> = {
  drums: [
    { id: 'd1', name: 'Sentiment', url: '/drums/OS_GS4_90_drum_loop_sentiment.wav', duration: 1, color: '#ffbe0b' },
    { id: 'd2', name: 'Swagger', url: '/drums/OS_SS_90_drum_loop_swagger.wav', duration: 1, color: '#ffbe0b' },
    { id: 'd3', name: 'Nola', url: '/drums/SO_LF_90_drum_loop_straight_outta_nola.wav', duration: 1, color: '#ffbe0b' },
    { id: 'd4', name: 'Crimelord', url: '/drums/SO_SL_90_drum_loop_crimelord.wav', duration: 1, color: '#fb5607' },
    { id: 'd5', name: 'Leyland', url: '/drums/SO_SL_90_drum_loop_leyland.wav', duration: 1, color: '#fb5607' },
    { id: 'd6', name: 'Pomeranian', url: '/drums/SO_SL_90_top_loop_acoustic_pomeranian.wav', duration: 1, color: '#fb5607' },
  ],
  bass: [
    { id: 'b1', name: 'Sub Bass', url: 'https://files.catbox.moe/s4i18l.wav', duration: 1, color: '#3a86ff' },
    { id: 'b2', name: 'Reese Bass', url: 'https://files.catbox.moe/9v22ou.wav', duration: 1, color: '#3a86ff' },
    { id: 'b3', name: 'Analog Sub', url: 'https://files.catbox.moe/xc7446.wav', duration: 1, color: '#3a86ff' },
  ],
  melody: [
    { id: 'm1', name: 'Piano Loop (8 measures)', url: 'https://files.catbox.moe/k5k03s.wav', duration: 4, color: '#ff006e' },
    { id: 'm2', name: 'Synth Arp', url: 'https://files.catbox.moe/19w4wv.wav', duration: 1, color: '#f72585' },
    { id: 'm3', name: 'Freedom Chord', url: '/OS_VC2_90_songstarter_freedom_Fm.wav', duration: 4, color: '#e01e5a' },
  ],
  fills: [
    { id: 'f1', name: 'Beatdown', url: '/fills/BEATDOWNS_drum_fill_029_90.wav', duration: 1, color: '#8338ec' },
  ],
  sfx: [
    { id: 's1', name: 'Scratch', url: '/sfx/cd_fx90_scratchness.wav', duration: 1, color: '#8338ec' },
  ],

};