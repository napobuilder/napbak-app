import { useEffect } from 'react';
import { useTrackStore } from '../store/useTrackStore';

const BPM = 90;

export const useTotalDuration = () => {
  const { tracks, setTotalDuration } = useTrackStore();

  useEffect(() => {
    const measureDuration = (60 / BPM) * 4;
    let maxEndSlot = 0;

    for (const track of tracks) {
      for (let i = 0; i < track.slots.length; i++) {
        const sample = track.slots[i];
        if (sample) {
          const endSlot = i + (sample.duration || 1);
          if (endSlot > maxEndSlot) {
            maxEndSlot = endSlot;
          }
        }
      }
    }

    const newTotalDuration = maxEndSlot * measureDuration;
    setTotalDuration(newTotalDuration);
  }, [tracks, setTotalDuration]);
};