import React, { useEffect } from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  side = 'left'
}) => {
  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const translateClass = side === 'left' 
    ? isOpen ? 'translate-x-0' : '-translate-x-full'
    : isOpen ? 'translate-x-0' : 'translate-x-full';

  const positionClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 ${positionClass} h-full w-80 max-w-[85vw] bg-[#121212] z-50 
          transform transition-transform duration-300 ease-out lg:hidden
          flex flex-col shadow-2xl ${translateClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282828]">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#282828]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
};
