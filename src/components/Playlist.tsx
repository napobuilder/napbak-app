
import React, { useState } from 'react';
import type { Sample, TrackType } from '../types';

const NUM_SLOTS = 8; 

// --- Componentes de la UI ---

interface SampleBlockProps {
  sample: Sample;
  onClear: (instanceId: string) => void;
}

const SampleBlock: React.FC<SampleBlockProps> = ({ sample, onClear }) => (
    <div className={`p-1 rounded-md flex justify-between items-center relative text-white mx-px min-w-0`} style={{ flex: `${sample.duration || 1}`, backgroundColor: sample.color }}>
        <p className="m-1 text-xs overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none">{sample.name}</p>
        <div onClick={() => sample.instanceId && onClear(sample.instanceId)} className="bg-black bg-opacity-40 text-white border-none rounded-full w-5 h-5 cursor-pointer flex items-center justify-center p-0 absolute top-1 right-1 pointer-events-auto z-10">X</div>
    </div>
);

interface EmptySlotProps {
  onDrop: (sample: Sample) => void;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ onDrop }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsOver(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const sampleData = JSON.parse(e.dataTransfer.getData('application/json'));
        onDrop(sampleData);
    };
    
    const dropAreaClasses = isOver ? "flex-1 border-2 border-dashed border-[#1DB954] rounded-md flex justify-center items-center transition-colors duration-200 ease-in-out min-h-[60px] bg-[#2a2a2a]" : "flex-1 border-2 border-dashed border-[#333333] rounded-md flex justify-center items-center transition-colors duration-200 ease-in-out min-h-[60px]";

    return (
        <div 
            className={dropAreaClasses}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <p className="text-[#555555] m-0 text-2xl select-none">+</p>
        </div>
    );
};

interface TrackProps {
    type: TrackType;
    volume: number;
    slots: (Sample | null)[];
    onDrop: (trackType: TrackType, slotIndex: number, sample: Sample) => void;
    onClear: (trackType: TrackType, instanceId: string) => void;
}

export const Track: React.FC<TrackProps> = ({ type, volume, slots, onDrop, onClear }) => {
    const renderedElements = [];
    let i = 0;
    while (i < NUM_SLOTS) {
        const sample = slots[i];
        if (sample) {
            const duration = sample.duration || 1;
            renderedElements.push(
                <SampleBlock 
                    key={sample.instanceId || i} 
                    sample={sample} 
                    onClear={(instanceId) => onClear(type, instanceId)} 
                />
            );
            i += duration;
        } else {
            const currentIndex = i;
            renderedElements.push(
                <EmptySlot 
                    key={i} 
                    onDrop={(droppedSample) => onDrop(type, currentIndex, droppedSample)} 
                />
            );
            i++;
        }
    }
    
    return (
        <div className="bg-[#1E1E1E] mb-2.5 rounded-lg p-2.5 flex flex-col">
            <div className="flex justify-between mb-2.5">
                <p className="text-white font-bold m-0">{type}</p>
                <p className="text-white font-bold m-0">Vol: {Math.round(volume * 100)}%</p>
            </div>
            <div className="flex flex-1 gap-2.5 w-full">
                {renderedElements}
            </div>
        </div>
    );
};
