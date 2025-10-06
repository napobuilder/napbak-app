import React from 'react';
import type { Sample, SampleCategory } from '../types';
import { SAMPLES } from '../data';
import { useAudioEngine } from '../store/useAudioEngine';
import { useUIStore } from '../store/useUIStore';

const CATEGORY_ORDER: SampleCategory[] = ['drums', 'bass', 'melody', 'fills', 'sfx'];

interface SampleItemProps {
  sample: Sample;
  category: SampleCategory;
}

const SampleItem: React.FC<SampleItemProps> = ({ sample, category }) => {
  const { previewSample, previewUrl } = useAudioEngine();
  const { activeSampleBrush, setActiveSampleBrush } = useUIStore();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const sampleData = JSON.stringify({ ...sample, category });
    e.dataTransfer.setData('application/json', sampleData);
    setActiveSampleBrush(sample); // Set brush on drag start
  };

  const isPlaying = previewUrl === sample.url;
  const isSelected = activeSampleBrush?.id === sample.id;

  const borderClasses = isSelected
    ? 'border-blue-500' // Brush selected
    : isPlaying
    ? 'border-green-500' // Is previewing
    : 'border-transparent'; // Default

  return (
    <div 
      className={`p-2 rounded-md w-32 cursor-grab border-2 ${borderClasses}`}
      style={{backgroundColor: sample.color || '#282828'}} 
      draggable 
      onDragStart={handleDragStart}
      onClick={() => previewSample(sample.url)} // Click now only previews
      title={`Click to preview. Drag to use.`}
    >
      <p className="text-white m-0 whitespace-nowrap overflow-hidden text-ellipsis select-none text-sm">{sample.name}</p>
    </div>
  );
};

export const SampleLibrary: React.FC = () => (
  <div className="h-full flex flex-col bg-[#181818] rounded-2xl p-4 box-border">
    <p className="text-white text-lg font-bold mb-4 flex-shrink-0">Sample Library</p>
    <div className="overflow-y-auto w-full flex-1">
      <div className="flex flex-col">
        {CATEGORY_ORDER.map((category) => (
          <div key={category} className="mb-4">
            <p className="text-[#b3b3b3] font-bold mb-2 text-sm">{category.toUpperCase()}</p>
            <div className="flex flex-row flex-wrap gap-2">
              {SAMPLES[category].map((sample) => (
                <SampleItem key={sample.id} sample={sample} category={category} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);