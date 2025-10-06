import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';

export const useGlobalMouseUp = () => {
  const { isPainting, isErasing, stopPainting, stopErasing } = useUIStore();

  useEffect(() => {
    const handleMouseUp = () => {
      // Only act if we are in a painting or erasing state
      if (isPainting || isErasing) {
        stopPainting();
        stopErasing();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPainting, isErasing, stopPainting, stopErasing]);
};