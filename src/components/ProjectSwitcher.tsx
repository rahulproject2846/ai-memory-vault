'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Folder, Clock, FileText } from 'lucide-react';
import { useVaultStore } from '@/store/vaultStore';
import { vaultDB, type Project } from '@/lib/database';

export default function ProjectSwitcher() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const store = useVaultStore();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await vaultDB.getAllProjects();
      const activeProject = await vaultDB.getActiveProject();
      
      setProjects(allProjects);
      setActiveProjectId(activeProject?.projectId || null);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const switchToProject = async (projectId: string) => {
    try {
      // Set active project in database
      await vaultDB.setActiveProject(projectId);
      
      // Load project files
      const projectFiles = await vaultDB.getProjectFiles(projectId);
      const filesMap = new Map<string, string>();
      projectFiles.forEach(file => {
        filesMap.set(file.path, file.content);
      });

      // Load editor state for this project
      const editorState = await vaultDB.getEditorState(projectId);

      // Update store with project data
      const { buildFileTree } = await import('@/utils/fileHelpers');
      const fileTree = buildFileTree(projectFiles);
      
      store.setFilesMap(filesMap);
      store.setFileTree(fileTree);
      store.setSearchQuery(editorState?.searchQuery || '');
      store.setSidebarWidth(editorState?.sidebarWidth || 280);
      store.closeAllTabs(); // Close all tabs when switching projects
      
      setActiveProjectId(projectId);
    } catch (error) {
      console.error('Failed to switch to project:', error);
      store.setError('Failed to switch to project');
    }
  };

  const openNewWindow = () => {
    window.open(window.location.href, '_blank');
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getProjectIcon = (fileCount: number): string => {
    if (fileCount === 0) return '📁';
    if (fileCount < 10) return '📄';
    if (fileCount < 50) return '📚';
    return '🗂️';
  };

  return (
    <div className="h-20 bg-[#0a0a0a] border-t border-[#1f1f1f] flex items-center px-4 gap-4">
      {/* New Window Button */}
      <button
        onClick={openNewWindow}
        className="flex items-center gap-2 px-3 py-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] rounded-md transition-all duration-200 text-gray-300 hover:text-white"
      >
        <ExternalLink size={16} />
        <span className="text-sm font-medium">New Window</span>
      </button>

      {/* Project Cards Container */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 items-center min-w-max">
          {projects.slice(0, 10).map((project) => (
            <div
              key={project.projectId}
              onClick={() => switchToProject(project.projectId)}
              className={`
                relative group cursor-pointer rounded-lg border p-3 w-48 h-16 flex-shrink-0
                transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                ${activeProjectId === project.projectId
                  ? 'bg-[#1e3a8a] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-[#1c1c1c] border-[#333] hover:border-[#444] hover:bg-[#252525]'
                }
              `}
            >
              {/* Active Indicator */}
              {activeProjectId === project.projectId && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              )}

              {/* Project Content */}
              <div className="flex items-center gap-3 h-full">
                {/* Icon */}
                <div className="text-2xl">
                  {getProjectIcon(project.fileCount)}
                </div>

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText size={12} />
                    <span>{project.fileCount} files</span>
                    <span>•</span>
                    <Clock size={12} />
                    <span>{formatDate(project.lastAccessed)}</span>
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
          ))}

          {/* Add New Project Card */}
          <div
            onClick={() => {
              const projectName = prompt('Enter project name:');
              if (projectName) {
                vaultDB.createProject(projectName).then(() => loadProjects());
              }
            }}
            className="w-48 h-16 flex-shrink-0 border-2 border-dashed border-[#444] rounded-lg flex items-center justify-center cursor-pointer hover:border-[#666] hover:bg-[#1a1a1a] transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-300">
              <Plus size={16} />
              <span className="text-sm font-medium">New Project</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicators */}
      {projects.length > 3 && (
        <>
          <div className="text-xs text-gray-500">
            {projects.length} projects
          </div>
        </>
      )}
    </div>
  );
}
