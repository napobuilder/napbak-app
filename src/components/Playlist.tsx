
import React, { useState } from 'react';
import type { Sample, TrackType } from '../types';
import VolumeKnob from './VolumeKnob'; // Importamos el Knob

 

// --- Componentes de la UI ---

interface SampleBlockProps {
  sample: Sample;
  onClear: (instanceId: string) => void;
  style: React.CSSProperties;
}

const SampleBlock: React.FC<SampleBlockProps> = ({ sample, onClear, style }) => (
    <div 
        className={`p-1 rounded-md flex justify-between items-center relative text-white min-w-0`}
        style={style}
    >
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
    
    const dropAreaClasses = isOver 
        ? "border-2 border-dashed border-[#1DB954] rounded-md h-full w-full flex justify-center items-center transition-colors duration-200 ease-in-out bg-[#2a2a2a]"
        : "border-2 border-dashed border-[#333333] rounded-md h-full w-full flex justify-center items-center transition-colors duration-200 ease-in-out";

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
    numSlots: number;
    setVolume: (trackType: TrackType, volume: number) => void;
    onDrop: (trackType: TrackType, slotIndex: number, sample: Sample) => void;
    onClear: (trackType: TrackType, instanceId: string) => void;
}

export const Track: React.FC<TrackProps> = ({ type, volume, slots, numSlots, setVolume, onDrop, onClear }) => {
    // Renderiza los samples que existen en los slots
    const renderedSamples = [];
    let i = 0;
    while (i < numSlots) {
        const sample = slots[i];
        if (sample) {
            const duration = sample.duration || 1;
            renderedSamples.push(
                <SampleBlock 
                    key={sample.instanceId || i} 
                    sample={sample} 
                    onClear={(instanceId) => onClear(type, instanceId)}
                    style={{
                        gridColumn: `${i + 1} / span ${duration}`,
                        backgroundColor: sample.color,
                    }}
                />
            );
            i += duration;
        } else {
            i++;
        }
    }

    // Renderiza una rejilla de fondo con zonas para dropear
    const dropGrid = Array.from({ length: numSlots }).map((_, index) => (
        <EmptySlot 
            key={index} 
            onDrop={(droppedSample) => onDrop(type, index, droppedSample)} 
        />
    ));
    
    const gridStyle = { gridTemplateColumns: `repeat(${numSlots}, 1fr)` };

    return (
        <div className="bg-[#1E1E1E] mb-2.5 rounded-lg p-2.5 flex flex-col">
            <div className="flex justify-between items-center mb-2.5">
                <p className="text-white font-bold m-0 w-1/4">{type}</p>
                <div className="flex items-center justify-end w-3/4 gap-4">
                    <VolumeKnob 
                        volume={volume} 
                        onChange={(newVolume) => setVolume(type, newVolume)} 
                    />
                    <span className="text-sm text-gray-400 w-12 text-center">{`${Math.round(volume * 100)}%`}</span>
                </div>
            </div>
            <div className="grid gap-2.5 w-full min-h-[60px] relative" style={gridStyle}>
                {/* Capa de fondo para dropear */}
                <div className="absolute inset-0 grid gap-2.5 w-full h-full" style={gridStyle}>
                    {dropGrid}
                </div>
                {/* Capa de encima con los samples */}
                <div className="absolute inset-0 grid gap-2.5 w-full h-full pointer-events-none" style={gridStyle}>
                    {renderedSamples.map(sampleElement => 
                        React.cloneElement(sampleElement, { 
                            ...sampleElement.props,
                            style: { ...sampleElement.props.style, pointerEvents: 'auto' } 
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
