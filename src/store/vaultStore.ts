import { create } from 'zustand';
import { FileNode } from '@/utils/fileHelpers';

interface VaultState {
  // Data
  fileTree: FileNode[];
  filesMap: Map<string, string>;
  selectedFile: { path: string; content: string } | null;
  session: { sessionId: string; passphrase: string } | null;

  // UI State
  isUploading: boolean;
  sidebarWidth: number;
  searchQuery: string;
  error: string | null;
  isSharing: boolean;
  shareUrl: string | null;
  shareType: 'full' | 'single' | null;
  aiContextTemplate: string | null;

  // Actions
  setFileTree: (tree: FileNode[]) => void;
  setFilesMap: (map: Map<string, string>) => void;
  selectFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  setSession: (session: { sessionId: string; passphrase: string } | null) => void;
  setIsUploading: (isUploading: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;
  setIsSharing: (isSharing: boolean) => void;
  setShareUrl: (url: string | null) => void;
  setShareType: (type: 'full' | 'single' | null) => void;
  setAiContextTemplate: (template: string | null) => void;
  reset: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  // Initial State
  fileTree: [],
  filesMap: new Map(),
  selectedFile: null,
  session: null,
  isUploading: false,
  sidebarWidth: 280,
  searchQuery: '',
  error: null,
  isSharing: false,
  shareUrl: null,
  shareType: null,
  aiContextTemplate: null,

  // Actions
  setFileTree: (tree) => set({ fileTree: tree }),
  setFilesMap: (map) => set({ filesMap: map }),
  
  selectFile: (path) => {
    const content = get().filesMap.get(path);
    if (content !== undefined) {
      set({ selectedFile: { path, content } });
    }
  },

  toggleFolder: (path) => {
    const toggle = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((n) => {
        if (n.path === path) {
          return { ...n, isOpen: !n.isOpen };
        }
        if (n.children) {
          return { ...n, children: toggle(n.children) };
        }
        return n;
      });
    };
    set({ fileTree: toggle(get().fileTree) });
  },

  setSession: (session) => set({ session }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setError: (error) => set({ error }),
  setIsSharing: (isSharing) => set({ isSharing }),
  setShareUrl: (shareUrl) => set({ shareUrl }),
  setShareType: (shareType) => set({ shareType }),
  setAiContextTemplate: (aiContextTemplate) => set({ aiContextTemplate }),
  
  reset: () => set({
    fileTree: [],
    filesMap: new Map(),
    selectedFile: null,
    isUploading: false,
    searchQuery: '',
    error: null,
    isSharing: false,
    shareUrl: null,
    shareType: null,
    aiContextTemplate: null
  })
}));
