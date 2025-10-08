import React from 'react';
import { TimeDisplay } from './TimeDisplay'; // Importar TimeDisplay

interface TopBarProps {
    isPlaying: boolean;
    isExporting: boolean;
    projectName: string | null;
    playbackTime: number;
    onPlayPause: () => void;
    onStop: () => void;
    onExport: () => void;
    onNew: () => void;
    onSave: () => void;
    onLoad: () => void;
    onLogout: () => void;
}

// --- Iconos SVG (sin cambios) ---
const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5V19L19 12L8 5Z" />
    </svg>
);

const PauseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" />
    </svg>
);

const StopIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6H18V18H6V6Z" />
    </svg>
);

export const TopBar: React.FC<TopBarProps> = ({ 
    isPlaying, 
    onPlayPause, 
    onStop, 
    onExport, 
    isExporting, 
    projectName,
    playbackTime,
    onNew,
    onSave,
    onLoad,
    onLogout
}) => {
    return (
        <div className="bg-gray-900 text-white p-3 flex justify-between items-center shadow-lg border-b border-gray-700">
            {/* Left Side: Branding & Project Actions */}
            <div className="flex-1 flex items-center gap-4">
                <img src="/napbak app.png" alt="napbak Logo" className="h-9 w-auto" />
                <div className="h-6 border-l border-gray-600"></div>
                <button onClick={onNew} className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-2 px-3 rounded-md transition-colors">New</button>
                <button onClick={onSave} className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-2 px-3 rounded-md transition-colors">Save</button>
                <button onClick={onLoad} className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-2 px-3 rounded-md transition-colors">Load</button>
                <p className="text-gray-400 truncate">{projectName || 'Untitled Project'}</p>
            </div>

            {/* Center: Transport Controls & Time Display */}
            <div className="flex-1 flex justify-center items-center space-x-4">
                <button 
                    className="bg-gray-700 p-3 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
                    onClick={onStop}
                    disabled={isExporting}
                    aria-label="Stop"
                >
                    <StopIcon />
                </button>
                <button 
                    className="bg-green-600 p-4 rounded-full hover:bg-green-500 transition-colors disabled:opacity-50 text-white"
                    onClick={onPlayPause}
                    disabled={isExporting}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <TimeDisplay currentTime={playbackTime} />
            </div>

            {/* Right Side: Export & Logout Actions */}
            <div className="flex-1 flex justify-end items-center gap-4">
                <button 
                    className={`bg-blue-500 py-2 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors ${isExporting ? 'bg-gray-500 cursor-not-allowed' : ''}`}
                    onClick={onExport}
                    disabled={isExporting}
                >
                    {isExporting ? 'Exporting...' : 'Export'}
                </button>
                <button 
                    onClick={onLogout}
                    className="bg-gray-700 hover:bg-red-600 text-sm font-bold py-2 px-3 rounded-md transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};