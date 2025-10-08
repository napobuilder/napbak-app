import React, { useState } from 'react';

interface SaveProjectViewProps {
  onSave: (projectName: string) => Promise<void>;
  isLoading: boolean;
}

export const SaveProjectView: React.FC<SaveProjectViewProps> = ({ onSave, isLoading }) => {
  const [projectName, setProjectName] = useState('');

  const handleSave = () => {
    if (projectName.trim()) {
      onSave(projectName.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="project-name" className="text-sm font-medium text-gray-300">
          Project Name
        </label>
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder='My Awesome Beat'
          className="mt-1 w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <button 
        onClick={handleSave} 
        className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !projectName.trim()}
      >
        {isLoading ? 'Saving...' : 'Save Project'}
      </button>
    </div>
  );
};
