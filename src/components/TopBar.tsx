import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TimeDisplay } from './TimeDisplay';

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
    onToggleSampleLibrary?: () => void;
    isSampleLibraryOpen?: boolean;
}

// --- Iconos SVG ---
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

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const SamplesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
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
    onLogout,
    onToggleSampleLibrary,
    isSampleLibraryOpen
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cerrar menú al cambiar de tamaño a desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="bg-gray-900 text-white p-2 sm:p-3 flex justify-between items-center shadow-lg border-b border-gray-700 relative">
            {/* Left Side: Logo + Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Mobile: Hamburger Menu */}
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Menu"
                >
                    {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
                
                <img src="/napbak app.png" alt="napbak Logo" className="h-7 sm:h-9 w-auto" />
                
                {/* Desktop: Project Actions */}
                <div className="hidden lg:flex items-center gap-4">
                    <div className="h-6 border-l border-gray-600"></div>
                    <button onClick={onNew} className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-2 px-3 rounded-md transition-colors">New</button>
                    <button onClick={onSave} className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-2 px-3 rounded-md transition-colors">Save</button>
                    <button onClick={onLoad} className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-2 px-3 rounded-md transition-colors">Load</button>
                    <p className="text-gray-400 truncate max-w-[200px]">{projectName || 'Untitled Project'}</p>
                </div>
            </div>

            {/* Center: Transport Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button 
                    className="bg-gray-700 p-2 sm:p-3 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
                    onClick={onStop}
                    disabled={isExporting}
                    aria-label="Stop"
                >
                    <StopIcon />
                </button>
                <button 
                    className="bg-green-600 p-3 sm:p-4 rounded-full hover:bg-green-500 transition-colors disabled:opacity-50 text-white"
                    onClick={onPlayPause}
                    disabled={isExporting}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <div className="hidden sm:block">
                    <TimeDisplay currentTime={playbackTime} />
                </div>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile: Sample Library Toggle */}
                {onToggleSampleLibrary && (
                    <button 
                        onClick={onToggleSampleLibrary}
                        className={`lg:hidden p-2 rounded-lg transition-colors ${
                            isSampleLibraryOpen 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        aria-label="Toggle Samples"
                    >
                        <SamplesIcon />
                    </button>
                )}
                
                {/* Desktop: Full Actions */}
                <Link to="/founder" className="hidden md:block bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-3 lg:px-4 rounded-lg transition-colors text-xs lg:text-sm whitespace-nowrap">
                    Founder
                </Link>
                <button 
                    className={`bg-blue-500 py-2 px-3 sm:px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm ${isExporting ? 'bg-gray-500 cursor-not-allowed' : ''}`}
                    onClick={onExport}
                    disabled={isExporting}
                >
                    {isExporting ? '...' : 'Export'}
                </button>
                <button 
                    onClick={onLogout}
                    className="hidden lg:block bg-gray-700 hover:bg-red-600 text-sm font-bold py-2 px-3 rounded-md transition-colors"
                >
                    Logout
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div 
                    ref={menuRef}
                    className="absolute top-full left-0 right-0 bg-gray-800 border-b border-gray-700 shadow-xl z-50 lg:hidden"
                >
                    <div className="p-4 space-y-3">
                        {/* Project Name */}
                        <p className="text-gray-400 text-sm truncate pb-2 border-b border-gray-700">
                            {projectName || 'Untitled Project'}
                        </p>
                        
                        {/* Project Actions */}
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => { onNew(); setIsMobileMenuOpen(false); }} 
                                className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-3 px-3 rounded-md transition-colors"
                            >
                                New
                            </button>
                            <button 
                                onClick={() => { onSave(); setIsMobileMenuOpen(false); }} 
                                className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-3 px-3 rounded-md transition-colors"
                            >
                                Save
                            </button>
                            <button 
                                onClick={() => { onLoad(); setIsMobileMenuOpen(false); }} 
                                className="bg-gray-700 hover:bg-gray-600 text-sm font-bold py-3 px-3 rounded-md transition-colors"
                            >
                                Load
                            </button>
                        </div>

                        {/* Time Display for Mobile */}
                        <div className="sm:hidden flex justify-center py-2">
                            <TimeDisplay currentTime={playbackTime} />
                        </div>
                        
                        {/* Additional Actions */}
                        <div className="space-y-2 pt-2 border-t border-gray-700">
                            <Link 
                                to="/founder" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="md:hidden block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors text-sm"
                            >
                                Become a Founder
                            </Link>
                            <button 
                                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                                className="w-full bg-gray-700 hover:bg-red-600 text-sm font-bold py-3 px-3 rounded-md transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};