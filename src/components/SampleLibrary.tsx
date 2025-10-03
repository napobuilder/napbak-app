import React from 'react';
import type { Sample, SampleCategory } from '../types';
import { SAMPLES } from '../data';

interface SampleItemProps {
  sample: Sample;
  category: SampleCategory;
}

const SampleItem: React.FC<SampleItemProps> = ({ sample, category }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const sampleData = JSON.stringify({ ...sample, category });
    e.dataTransfer.setData('application/json', sampleData);
  };

  return (
    <div 
      className="p-3 rounded-md mb-2 w-32 cursor-grab"
      style={{backgroundColor: sample.color || '#282828'}} 
      draggable 
      onDragStart={handleDragStart}
    >
      <p className="text-white m-0 whitespace-nowrap overflow-hidden text-ellipsis select-none">{sample.name}</p>
    </div>
  );
};

export const SampleLibrary: React.FC = () => (
  <div className="h-full flex flex-col bg-[#181818] rounded-t-2xl p-4 box-border">
    <p className="text-white text-lg font-bold mb-2">Sample Library</p>
    <div className="overflow-x-auto w-full flex-1">
      <div className="flex flex-row">
        {(Object.keys(SAMPLES) as SampleCategory[]).map((category) => (
          <div key={category} className="mr-4">
            <p className="text-[#b3b3b3] font-bold mb-2">{category.toUpperCase()}</p>
            {SAMPLES[category].map((sample) => (
              <SampleItem key={sample.id} sample={sample} category={category} />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);