'use client';

import { X } from 'lucide-react';
import { useVaultStore } from '@/store/vaultStore';

export default function TabBar() {
  const { openTabs, activeTabPath, closeTab, setActiveTab } = useVaultStore();

  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  const getFileExtension = (path: string): string => {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  };

  const getLanguageColor = (extension: string): string => {
    const colors: { [key: string]: string } = {
      'ts': '#3178c6',
      'tsx': '#3178c6',
      'js': '#f7df1e',
      'jsx': '#f7df1e',
      'json': '#cbcb41',
      'css': '#563d7c',
      'html': '#e34c26',
      'htm': '#e34c26',
      'md': '#083fa1',
      'xml': '#f16436',
      'yaml': '#cb171e',
      'yml': '#cb171e',
      'py': '#3572A5',
      'java': '#b07219',
      'cpp': '#f34b7d',
      'c': '#555555',
      'h': '#555555',
      'php': '#777bb4',
      'rb': '#701516',
      'go': '#00ADD8',
      'rs': '#dea584',
      'sh': '#4EAA25',
      'bash': '#4EAA25',
    };
    return colors[extension] || '#666';
  };

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-[#1e1e1e] border-b border-[#333] overflow-x-auto">
      <div className="flex items-center">
        {openTabs.map((tab) => {
          const fileName = getFileName(tab.path);
          const extension = getFileExtension(tab.path);
          const isActive = tab.path === activeTabPath;
          const color = getLanguageColor(extension);

          return (
            <div
              key={tab.path}
              className={`
                group relative flex items-center gap-2 px-3 py-2 border-r border-[#333] 
                cursor-pointer transition-all duration-150 min-w-0
                ${isActive 
                  ? 'bg-[#2d2d30] text-white' 
                  : 'text-gray-400 hover:bg-[#252526] hover:text-white'
                }
              `}
              onClick={() => setActiveTab(tab.path)}
            >
              {/* File icon with language color */}
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: color }}
              />
              
              {/* File name */}
              <span className="text-[13px] font-medium truncate">
                {fileName}
              </span>
              
              {/* Dirty indicator */}
              {tab.isDirty && (
                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
              )}
              
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.path);
                }}
                className={`
                  opacity-0 group-hover:opacity-100 transition-opacity duration-150
                  p-0.5 rounded hover:bg-[#404040] flex-shrink-0
                  ${isActive ? 'text-white hover:text-white' : 'text-gray-500 hover:text-white'}
                `}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Empty space for scrolling */}
      <div className="flex-1 min-w-[100px]" />
    </div>
  );
}
