
import React, { useState } from 'react';
import type { Sample, Track as TrackType } from '../types';
import { useUIStore } from '../store/useUIStore';
import { useTrackStore } from '../store/useTrackStore';

const BASE_SLOT_WIDTH = 64; // Mover constante aquí para que sea accesible

// --- Componentes de la UI ---

interface SampleBlockProps {
  sample: Sample;
  onClear: (instanceId: string) => void;
  style: React.CSSProperties;
}

const SampleBlock: React.FC<SampleBlockProps> = ({ sample, onClear, style }) => {
    const { setActiveSampleBrush, isErasing, startErasing } = useUIStore();

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Left click: Set active brush
        if (e.button === 0) {
            setActiveSampleBrush(sample);
        }
        // Right click: Start erasing
        if (e.button === 2) {
            e.preventDefault(); // Prevenir el menú contextual aquí también
            startErasing();
            if (sample.instanceId) onClear(sample.instanceId);
        }
    };

    const handleMouseEnter = () => {
        if (isErasing && sample.instanceId) {
            onClear(sample.instanceId);
        }
    };

    const handleClearClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (sample.instanceId) onClear(sample.instanceId);
    };

    return (
        <div 
            className={`p-1 rounded-md flex justify-between items-center relative text-white min-w-0 h-full cursor-pointer`}
            style={style}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => e.preventDefault()} // Solo prevenir el menú
            onMouseEnter={handleMouseEnter}
            title={`Left-click to set as brush. Right-click to delete.`}
        >
            <p className="m-1 text-xs overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none">{sample.name}</p>
            <div onClick={handleClearClick} className="bg-black bg-opacity-40 text-white border-none rounded-full w-5 h-5 cursor-pointer flex items-center justify-center p-0 absolute top-1 right-1 pointer-events-auto z-10">X</div>
        </div>
    );
}

interface EmptySlotProps {
  onDrop: (sample: Sample) => void;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ onDrop }) => {
    const [isOver, setIsOver] = useState(false);
    const { activeSampleBrush, isPainting, startPainting } = useUIStore();

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsOver(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const sampleData = JSON.parse(e.dataTransfer.getData('application/json'));
        onDrop(sampleData);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Solo pintar con clic izquierdo
        if (e.button === 0 && activeSampleBrush) {
            startPainting();
            onDrop(activeSampleBrush);
        }
    };

    const handleMouseEnter = () => {
        if (isPainting && activeSampleBrush) {
            onDrop(activeSampleBrush);
        }
    };
    
    const dropAreaClasses = isOver 
        ? "border-2 border-dashed border-[#1DB954] rounded-md h-full w-full flex justify-center items-center transition-colors duration-200 ease-in-out bg-[#2a2a2a]"
        : "border-2 border-dashed border-[#333333] rounded-md h-full w-full flex justify-center items-center transition-colors duration-200 ease-in-out";

    const cursorClass = activeSampleBrush ? 'cursor-copy' : '';

    return (
        <div 
            className={`${dropAreaClasses} ${cursorClass}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onContextMenu={(e) => e.preventDefault()} // Prevenir menú aquí también
        >
            <p className="text-[#555555] m-0 text-2xl select-none">+</p>
        </div>
    );
};

interface TrackProps {
    track: TrackType;
    onDrop: (trackId: string, slotIndex: number, sample: Sample) => void;
    onClear: (trackId: string, instanceId: string) => void;
}

export const Track: React.FC<TrackProps> = ({
    track,
    onDrop,
    onClear
}) => {
    const numSlots = useTrackStore(state => state.numSlots);
    const zoomLevel = useUIStore(state => state.zoomLevel);
    const slotWidth = BASE_SLOT_WIDTH * zoomLevel;

    // Renderiza los samples que existen en los slots
    const renderedSamples = [];
    let i = 0;
    while (i < numSlots) {
        const sample = track.slots[i];
        if (sample) {
            const duration = sample.duration || 1;
            renderedSamples.push(
                <SampleBlock 
                    key={sample.instanceId || i} 
                    sample={sample} 
                    onClear={(instanceId) => onClear(track.id, instanceId)}
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
            onDrop={(droppedSample) => onDrop(track.id, index, droppedSample)} 
        />
    ));
    
    const gridStyle = { gridTemplateColumns: `repeat(${numSlots}, ${slotWidth}px)` };

    return (
        <div className="bg-[#1E1E1E] rounded-lg p-1.5 sm:p-2.5 flex items-center h-[60px] sm:h-[70px] lg:h-[80px] touch-manipulation">
            {/* Línea de Tiempo de Samples */}
            <div className="grid gap-1.5 sm:gap-2.5 w-full h-full relative" style={gridStyle}>
                {/* Capa de fondo para dropear */}
                <div className="absolute inset-0 grid gap-1.5 sm:gap-2.5 w-full h-full" style={gridStyle}>
                    {dropGrid}
                </div>
                {/* Capa de encima con los samples */}
                <div className="absolute inset-0 grid gap-1.5 sm:gap-2.5 w-full h-full pointer-events-none" style={gridStyle}>
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
