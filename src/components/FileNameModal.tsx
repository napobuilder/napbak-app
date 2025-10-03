import React, { useState, useEffect } from 'react';

interface FileNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fileName: string) => void;
}

export const FileNameModal: React.FC<FileNameModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [fileName, setFileName] = useState('napbak-beat.wav');

  useEffect(() => {
    if (isOpen) {
      // Resetear el nombre cada vez que se abre
      setFileName('napbak-beat.wav');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(fileName);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center"
      onClick={onClose} // Cierra el modal si se hace clic en el fondo
    >
      <div 
        className="bg-[#1E1E1E] rounded-lg shadow-xl p-6 w-full max-w-md border border-[#282828]"
        onClick={(e) => e.stopPropagation()} // Evita que el clic en el modal se propague al fondo
      >
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold text-white mb-4">Nombrar tu Beat</h2>
          <p className="text-gray-400 mb-6">Elige un nombre para tu archivo .wav.</p>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full bg-[#282828] text-white border border-gray-600 rounded-md p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
            autoFocus
          />
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-[#1DB954] text-white font-bold rounded-md hover:bg-green-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
