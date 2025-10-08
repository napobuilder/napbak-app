import type { Sample, SampleCategory, TrackType } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const storageUrl = `${supabaseUrl}/storage/v1/object/public/samples`;

// 1 slot = 1 measure (4 beats)
export const SAMPLES: Record<SampleCategory, Sample[]> = {
  drums: [
    { id: 'd1', name: 'Sentiment', url: `${storageUrl}/drums/OS_GS4_90_drum_loop_sentiment.wav`, type: 'Drums', duration: 1, color: '#ffbe0b' },
    { id: 'd2', name: 'Swagger', url: `${storageUrl}/drums/OS_SS_90_drum_loop_swagger.wav`, type: 'Drums', duration: 1, color: '#ffbe0b' },
    { id: 'd3', name: 'Nola', url: `${storageUrl}/drums/SO_LF_90_drum_loop_straight_outta_nola.wav`, type: 'Drums', duration: 1, color: '#ffbe0b' },
    { id: 'd4', name: 'Crimelord', url: `${storageUrl}/drums/SO_SL_90_drum_loop_crimelord.wav`, type: 'Drums', duration: 1, color: '#fb5607' },
    { id: 'd5', name: 'Leyland', url: `${storageUrl}/drums/SO_SL_90_drum_loop_leyland.wav`, type: 'Drums', duration: 1, color: '#fb5607' },
    { id: 'd6', name: 'Pomeranian', url: `${storageUrl}/drums/SO_SL_90_top_loop_acoustic_pomeranian.wav`, type: 'Drums', duration: 1, color: '#fb5607' },
    { id: 'd7', name: 'Perc Tops', url: `${storageUrl}/drums/OS_LFC_90_Drum_Loop_13__Perc_Tops_.wav`, type: 'Drums', duration: 1, color: '#ffbe0b' },
    { id: 'd8', name: 'Cymbal Crash', url: `${storageUrl}/drums/SLK_cymbal_crash_long.wav`, type: 'Drums', duration: 1, color: '#fb5607' }
  ],
  bass: [
    { id: 'b3', name: 'Analog Sub', url: `${storageUrl}/bass/ULY_KIT7_90_bass_synth_analog_Asmin.wav`, type: 'Bass', duration: 4, color: '#3a86ff' },
  ],
  melody: [
    { id: 'm1', name: 'Piano Loop (8 measures)', url: `${storageUrl}/melodies/ORBIT_ERA_90_chord_piano_loop_vintage_creeper_F-sharp-min.wav`, type: 'Melody', duration: 4, color: '#ff006e' },
    { id: 'm3', name: 'Freedom Chord', url: `${storageUrl}/melodies/OS_VC2_90_songstarter_freedom_Fm.wav`, type: 'Melody', duration: 4, color: '#e01e5a' },
    { id: 'm4', name: 'Vintage Ochre', url: `${storageUrl}/melodies/AHA_LS_90_vintage_piano_loop_ochre.wav`, type: 'Melody', duration: 4, color: '#d90429' },
    { id: 'm5', name: 'Fading EP (Abm)', url: `${storageUrl}/melodies/DBM_SDRNB_FADING_electric_piano_90BPM_Ab-MINOR.wav`, type: 'Melody', duration: 4, color: '#ef233c' },
    { id: 'm6', name: 'Classy Piano (Cm)', url: `${storageUrl}/melodies/OS_SS_90_songstarter_piano_classy_Cm.wav`, type: 'Melody', duration: 4, color: '#d90429' },
    { id: 'm7', name: 'Piano Romance (Gmaj)', url: `${storageUrl}/melodies/TC_RB_90_piano_romance_Gmaj.wav`, type: 'Melody', duration: 4, color: '#ef233c' },
  ],
  fills: [
    { id: 'f1', name: 'Beatdown', url: `${storageUrl}/fills/BEATDOWNS_drum_fill_029_90.wav`, type: 'Fills', duration: 1, color: '#8338ec', offset: 0.445 },
  ],
  sfx: [
    { id: 's1', name: 'Scratch', url: `${storageUrl}/sfx/cd_fx90_scratchness.wav`, type: 'SFX', duration: 1, color: '#8338ec' },
    { id: 's2', name: 'Scratch Cuts', url: `${storageUrl}/sfx/RHH2_90_scratch_loop_cuts.wav`, type: 'SFX', duration: 1, color: '#8338ec' }
  ],

};