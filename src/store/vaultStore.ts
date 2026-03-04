import { create } from 'zustand';
import { FileNode } from '@/utils/fileHelpers';
import { vaultDB, type StoredFile, type VaultSession, type EditorState, type Project } from '@/lib/database';

interface VaultState {
  // Data
  fileTree: FileNode[];
  filesMap: Map<string, string>;
  selectedFile: { path: string; content: string } | null;
  session: { sessionId: string; passphrase: string } | null;
  currentProject: Project | null;
  projects: Project[];

  // Tab System
  openTabs: { path: string; content: string; isDirty: boolean }[];
  activeTabPath: string | null;

  // UI State
  isUploading: boolean;
  sidebarWidth: number;
  searchQuery: string;
  error: string | null;
  isSharing: boolean;
  shareUrl: string | null;
  shareType: 'full' | 'single' | null;
  aiContextTemplate: string | null;

  // Persistence State
  isHydrated: boolean;
  isSaving: boolean;

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
  
  // Project Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  switchToProject: (projectId: string) => Promise<void>;
  createNewProject: (name: string, description?: string) => Promise<string>;
  
  // Tab Actions
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  updateTabContent: (path: string, content: string) => void;
  markTabDirty: (path: string, isDirty: boolean) => void;
  closeAllTabs: () => void;
  
  // Persistence Actions
  hydrateFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
  saveFileToDB: (path: string, content: string) => Promise<void>;
  clearDB: () => Promise<void>;
  
  reset: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  // Initial State
  fileTree: [],
  filesMap: new Map(),
  selectedFile: null,
  session: null,
  currentProject: null,
  projects: [],
  openTabs: [],
  activeTabPath: null,
  isUploading: false,
  sidebarWidth: 280,
  searchQuery: '',
  error: null,
  isSharing: false,
  shareUrl: null,
  shareType: null,
  aiContextTemplate: null,
  isHydrated: false,
  isSaving: false,

  // Actions
  setFileTree: (tree) => set({ fileTree: tree }),
  setFilesMap: (map) => set({ filesMap: map }),
  
  selectFile: (path) => {
    const content = get().filesMap.get(path);
    if (content !== undefined) {
      // Open file in tab system instead of direct selection
      get().openTab(path);
      
      // Auto-save selected file to DB
      const state = get();
      if (state.isHydrated && state.currentProject) {
        vaultDB.saveEditorState({ selectedFilePath: path }, state.currentProject.projectId);
      }
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

  setSession: (session) => {
    set({ session });
    // Auto-save session to DB
    if (session) {
      const state = get();
      vaultDB.saveSession(session, state.currentProject?.projectId);
    }
  },
  setIsUploading: (isUploading) => set({ isUploading }),
  setSidebarWidth: (sidebarWidth) => {
    set({ sidebarWidth });
    // Auto-save sidebar width to DB
    const state = get();
    if (state.isHydrated && state.currentProject) {
      vaultDB.saveEditorState({ sidebarWidth }, state.currentProject.projectId);
    }
  },
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    // Auto-save search query to DB
    const state = get();
    if (state.isHydrated && state.currentProject) {
      vaultDB.saveEditorState({ searchQuery }, state.currentProject.projectId);
    }
  },
  setError: (error) => set({ error }),
  setIsSharing: (isSharing) => set({ isSharing }),
  setShareUrl: (shareUrl) => set({ shareUrl }),
  setShareType: (shareType) => set({ shareType }),
  setAiContextTemplate: (aiContextTemplate) => set({ aiContextTemplate }),
  
  // Project Actions
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  
  switchToProject: async (projectId: string) => {
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
      const project = await vaultDB.getProject(projectId);

      // Update store with project data
      const { buildFileTree } = await import('@/utils/fileHelpers');
      const fileTree = buildFileTree(projectFiles);
      
      set({
        filesMap,
        fileTree,
        searchQuery: editorState?.searchQuery || '',
        sidebarWidth: editorState?.sidebarWidth || 280,
        currentProject: project || null,
        openTabs: [],
        activeTabPath: null,
        selectedFile: null
      });
    } catch (error) {
      console.error('Failed to switch to project:', error);
      set({ error: 'Failed to switch to project' });
    }
  },

  createNewProject: async (name: string, description?: string) => {
    try {
      const projectId = await vaultDB.createProject(name, description);
      
      // Switch to the new project
      await get().switchToProject(projectId);
      
      // Reload projects list
      const allProjects = await vaultDB.getAllProjects();
      set({ projects: allProjects });
      
      return projectId;
    } catch (error) {
      console.error('Failed to create project:', error);
      set({ error: 'Failed to create project' });
      throw error;
    }
  },
  
  // Tab Actions
  openTab: (path) => {
    const content = get().filesMap.get(path);
    if (content === undefined) return;
    
    const { openTabs } = get();
    const existingTab = openTabs.find(tab => tab.path === path);
    
    if (!existingTab) {
      // Add new tab
      const newTab = { path, content, isDirty: false };
      set({ 
        openTabs: [...openTabs, newTab],
        activeTabPath: path,
        selectedFile: { path, content }
      });
    } else {
      // Activate existing tab
      set({ 
        activeTabPath: path,
        selectedFile: { path, content: existingTab.content }
      });
    }
  },

  closeTab: (path) => {
    const { openTabs, activeTabPath } = get();
    const newTabs = openTabs.filter(tab => tab.path !== path);
    
    if (activeTabPath === path && newTabs.length > 0) {
      // Find the tab to the right or left to activate
      const closedIndex = openTabs.findIndex(tab => tab.path === path);
      const nextTab = newTabs[closedIndex] || newTabs[newTabs.length - 1];
      
      set({
        openTabs: newTabs,
        activeTabPath: nextTab.path,
        selectedFile: { path: nextTab.path, content: nextTab.content }
      });
    } else {
      set({
        openTabs: newTabs,
        activeTabPath: newTabs.length > 0 ? activeTabPath : null,
        selectedFile: newTabs.length > 0 ? get().selectedFile : null
      });
    }
  },

  setActiveTab: (path) => {
    const { openTabs } = get();
    const tab = openTabs.find(t => t.path === path);
    if (tab) {
      set({
        activeTabPath: path,
        selectedFile: { path, content: tab.content }
      });
    }
  },

  updateTabContent: (path, content) => {
    const { openTabs } = get();
    const updatedTabs = openTabs.map(tab => 
      tab.path === path ? { ...tab, content, isDirty: true } : tab
    );
    
    set({ 
      openTabs: updatedTabs,
      selectedFile: get().activeTabPath === path ? { path, content } : get().selectedFile
    });
    
    // Update filesMap and save to DB
    const state = get();
    state.setFilesMap(new Map(state.filesMap.set(path, content)));
    if (state.isHydrated && state.currentProject) {
      state.saveFileToDB(path, content);
    }
  },

  markTabDirty: (path, isDirty) => {
    const { openTabs } = get();
    const updatedTabs = openTabs.map(tab => 
      tab.path === path ? { ...tab, isDirty } : tab
    );
    set({ openTabs: updatedTabs });
  },

  closeAllTabs: () => {
    set({
      openTabs: [],
      activeTabPath: null,
      selectedFile: null
    });
  },
  
  // Persistence Actions
  hydrateFromDB: async () => {
    set({ isHydrated: false });
    try {
      // Load projects
      const allProjects = await vaultDB.getAllProjects();
      const activeProject = await vaultDB.getActiveProject();
      
      // Load files for active project
      let filesMap = new Map<string, string>();
      let fileTree: FileNode[] = [];
      
      if (activeProject) {
        const projectFiles = await vaultDB.getProjectFiles(activeProject.projectId);
        projectFiles.forEach(file => {
          filesMap.set(file.path, file.content);
        });

        // Build file tree from stored files
        const { buildFileTree } = await import('@/utils/fileHelpers');
        fileTree = buildFileTree(projectFiles);
      }

      // Load session from DB
      const activeSession = await vaultDB.getActiveSession();
      
      // Load editor state from DB
      const editorState = await vaultDB.getEditorState(activeProject?.projectId);

      // Update store with loaded data
      set({
        filesMap,
        fileTree,
        projects: allProjects,
        currentProject: activeProject,
        session: activeSession ? {
          sessionId: activeSession.sessionId,
          passphrase: activeSession.passphrase
        } : null,
        selectedFile: editorState?.selectedFilePath && filesMap.has(editorState.selectedFilePath)
          ? { path: editorState.selectedFilePath, content: filesMap.get(editorState.selectedFilePath)! }
          : null,
        sidebarWidth: editorState?.sidebarWidth || 280,
        searchQuery: editorState?.searchQuery || '',
        isHydrated: true
      });
    } catch (error) {
      console.error('Failed to hydrate from DB:', error);
      set({ error: 'Failed to load saved data', isHydrated: true });
    }
  },

  saveToDB: async () => {
    set({ isSaving: true });
    try {
      const { filesMap, currentProject } = get();
      
      if (!currentProject) {
        set({ isSaving: false });
        return;
      }
      
      // Convert filesMap to array for bulk save
      const files: { path: string; content: string }[] = [];
      filesMap.forEach((content, path) => {
        files.push({ path, content });
      });

      // Save all files to DB
      await vaultDB.saveFiles(files, currentProject.projectId);

      set({ isSaving: false });
    } catch (error) {
      console.error('Failed to save to DB:', error);
      set({ error: 'Failed to save data', isSaving: false });
    }
  },

  saveFileToDB: async (path: string, content: string) => {
    try {
      const state = get();
      await vaultDB.saveFile(path, content, state.currentProject?.projectId);
    } catch (error) {
      console.error('Failed to save file to DB:', error);
      set({ error: 'Failed to save file' });
    }
  },

  clearDB: async () => {
    try {
      const state = get();
      if (state.currentProject) {
        await vaultDB.clearProjectFiles(state.currentProject.projectId);
      }
      set({
        filesMap: new Map(),
        fileTree: [],
        selectedFile: null
      });
    } catch (error) {
      console.error('Failed to clear DB:', error);
      set({ error: 'Failed to clear data' });
    }
  },
  
  reset: () => set({
    fileTree: [],
    filesMap: new Map(),
    selectedFile: null,
    currentProject: null,
    projects: [],
    openTabs: [],
    activeTabPath: null,
    isUploading: false,
    searchQuery: '',
    error: null,
    isSharing: false,
    shareUrl: null,
    shareType: null,
    aiContextTemplate: null,
    isHydrated: false,
    isSaving: false
  })
}));
