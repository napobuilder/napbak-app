import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import type { Project } from '../types';

interface LoadProjectViewProps {
  onLoadProject: (project: Project) => void;
}

export const LoadProjectView: React.FC<LoadProjectViewProps> = ({ onLoadProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthStore();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!session) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, updated_at, project_data')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        setProjects(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [session]);

  if (isLoading) {
    return <div className="text-center text-gray-400">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-3">
      {projects.length === 0 ? (
        <p className="text-center text-gray-500">No projects found.</p>
      ) : (
        projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onLoadProject(project)}
            className="w-full text-left p-3 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors duration-150"
          >
            <p className="font-bold text-white">{project.name}</p>
            <p className="text-xs text-gray-400">
              Last updated: {new Date(project.updated_at).toLocaleString()}
            </p>
          </button>
        ))
      )}
    </div>
  );
};