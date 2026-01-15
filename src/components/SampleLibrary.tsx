import React from 'react';
import type { Sample, SampleCategory } from '../types';
import { SAMPLES } from '../data';
import { useAudioEngine } from '../store/useAudioEngine';
import { useUIStore } from '../store/useUIStore';

const CATEGORY_ORDER: SampleCategory[] = ['drums', 'bass', 'melody', 'fills', 'sfx'];

// Iconos para categorías
const CategoryIcons: Record<SampleCategory, React.FC<{ className?: string }>> = {
  drums: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  bass: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v18M6 8c0-3 2-5 6-5s6 2 6 5M6 16c0 3 2 5 6 5s6-2 6-5"/>
    </svg>
  ),
  melody: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  fills: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h4v4H4zM4 10h4v4H4zM4 16h4v4H4zM10 4h4v4h-4zM10 16h4v4h-4zM16 4h4v4h-4zM16 10h4v4h-4zM16 16h4v4h-4z"/>
    </svg>
  ),
  sfx: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
};

interface SampleItemProps {
  sample: Sample;
  category: SampleCategory;
  compact?: boolean;
}

const SampleItem: React.FC<SampleItemProps> = ({ sample, category, compact = false }) => {
  const { previewSample, previewUrl } = useAudioEngine();
  const { activeSampleBrush, setActiveSampleBrush } = useUIStore();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const sampleData = JSON.stringify({ ...sample, category });
    e.dataTransfer.setData('application/json', sampleData);
    setActiveSampleBrush(sample);
  };

  // Para móvil: tap para seleccionar como brush
  const handleTap = () => {
    previewSample(sample.url);
    setActiveSampleBrush(sample);
  };

  const isPlaying = previewUrl === sample.url;
  const isSelected = activeSampleBrush?.id === sample.id;

  const borderClasses = isSelected
    ? 'border-blue-500 ring-2 ring-blue-500/30'
    : isPlaying
    ? 'border-green-500'
    : 'border-transparent';

  return (
    <div 
      className={`
        ${compact ? 'p-1.5 min-w-[100px]' : 'p-2 w-full sm:w-32'}
        rounded-md cursor-grab border-2 ${borderClasses}
        transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
        touch-manipulation
      `}
      style={{backgroundColor: sample.color || '#282828'}} 
      draggable 
      onDragStart={handleDragStart}
      onClick={handleTap}
      title={`Tap to select • Drag to place`}
    >
      <p className={`text-white m-0 whitespace-nowrap overflow-hidden text-ellipsis select-none ${compact ? 'text-xs' : 'text-sm'}`}>
        {sample.name}
      </p>
      {isSelected && (
        <span className="text-[10px] text-blue-300 opacity-80">Selected</span>
      )}
    </div>
  );
};

interface SampleLibraryProps {
  variant?: 'default' | 'drawer';
}

export const SampleLibrary: React.FC<SampleLibraryProps> = ({ variant = 'default' }) => {
  const isDrawer = variant === 'drawer';
  
  return (
    <div className={`h-full flex flex-col ${isDrawer ? 'bg-transparent' : 'bg-[#181818] rounded-2xl'} p-4 box-border`}>
      {!isDrawer && (
        <p className="text-white text-lg font-bold mb-4 flex-shrink-0">Sample Library</p>
      )}
      <div className="overflow-y-auto w-full flex-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="flex flex-col gap-4">
          {CATEGORY_ORDER.map((category) => {
            const Icon = CategoryIcons[category];
            return (
              <div key={category} className="mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-[#b3b3b3]" />
                  <p className="text-[#b3b3b3] font-bold text-sm uppercase tracking-wide">{category}</p>
                  <span className="text-[#666] text-xs">({SAMPLES[category].length})</span>
                </div>
                <div className={`flex flex-wrap gap-2 ${isDrawer ? 'flex-col sm:flex-row' : ''}`}>
                  {SAMPLES[category].map((sample) => (
                    <SampleItem 
                      key={sample.id} 
                      sample={sample} 
                      category={category}
                      compact={isDrawer}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Instrucciones de uso para móvil */}
        <div className="mt-6 p-3 bg-[#282828] rounded-lg lg:hidden">
          <p className="text-gray-400 text-xs text-center">
            👆 Tap para seleccionar • Toca un slot vacío para colocar
          </p>
        </div>
      </div>
    </div>
  );
};