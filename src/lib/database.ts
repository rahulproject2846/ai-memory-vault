import Dexie, { Table } from 'dexie';

// Interface for stored files
export interface StoredFile {
  id?: number;
  path: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

// Interface for projects
export interface Project {
  id?: number;
  projectId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  isActive: boolean;
  fileCount: number;
}

// Interface for vault sessions
export interface VaultSession {
  id?: number;
  sessionId: string;
  passphrase: string;
  projectId?: string;
  createdAt: Date;
  lastAccessed: Date;
  isActive: boolean;
}

// Interface for editor state
export interface EditorState {
  id?: number;
  projectId?: string;
  selectedFilePath: string | null;
  sidebarWidth: number;
  searchQuery: string;
  openedFolders: string[];
  updatedAt: Date;
}

// Main database class
export class VaultDatabase extends Dexie {
  projects!: Table<Project>;
  files!: Table<StoredFile>;
  sessions!: Table<VaultSession>;
  editorStates!: Table<EditorState>;

  constructor() {
    super('VaultDatabase');
    
    // Define schema
    this.version(2).stores({
      projects: '++id, projectId, name, description, createdAt, updatedAt, lastAccessed, isActive, fileCount',
      files: '++id, path, content, createdAt, updatedAt, projectId',
      sessions: '++id, sessionId, passphrase, projectId, createdAt, lastAccessed, isActive',
      editorStates: '++id, projectId, selectedFilePath, sidebarWidth, searchQuery, openedFolders, updatedAt'
    });
  }

  // Project operations
  async createProject(name: string, description?: string): Promise<string> {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    await this.projects.add({
      projectId,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      isActive: true,
      fileCount: 0
    });
    
    return projectId;
  }

  async getAllProjects(): Promise<Project[]> {
    return await this.projects.orderBy('lastAccessed').reverse().toArray();
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    return await this.projects.where('projectId').equals(projectId).first();
  }

  async updateProject(projectId: string, updates: Partial<Project>) {
    const project = await this.getProject(projectId);
    if (project) {
      return await this.projects.update(project.id!, {
        ...updates,
        updatedAt: new Date(),
        lastAccessed: new Date()
      });
    }
  }

  async setActiveProject(projectId: string) {
    // Deactivate all projects
    await this.projects.toCollection().modify({ isActive: false });
    
    // Activate the selected project
    await this.projects.where('projectId').equals(projectId).modify({ 
      isActive: true,
      lastAccessed: new Date()
    });
  }

  async getActiveProject(): Promise<Project | undefined> {
    return await this.projects.where('isActive').equals(1).first();
  }

  async deleteProject(projectId: string) {
    const project = await this.getProject(projectId);
    if (project) {
      return await this.transaction('rw', this.projects, this.files, this.sessions, this.editorStates, async () => {
        await this.projects.delete(project.id!);
        await this.files.where('projectId').equals(projectId).delete();
        await this.sessions.where('projectId').equals(projectId).delete();
        await this.editorStates.where('projectId').equals(projectId).delete();
      });
    }
  }

  // File operations
  async saveFile(path: string, content: string, projectId?: string) {
    const now = new Date();
    const existingFile = await this.files.where('path').equals(path).and(item => item.projectId === projectId).first();
    
    if (existingFile) {
      return await this.files.update(existingFile.id!, {
        content,
        updatedAt: now
      });
    } else {
      const fileId = await this.files.add({
        path,
        content,
        createdAt: now,
        updatedAt: now,
        projectId
      });
      
      // Update project file count
      if (projectId) {
        await this.incrementFileCount(projectId);
      }
      
      return fileId;
    }
  }

  async getFile(path: string, projectId?: string): Promise<StoredFile | undefined> {
    return await this.files.where('path').equals(path).and(item => item.projectId === projectId).first();
  }

  async getProjectFiles(projectId: string): Promise<StoredFile[]> {
    return await this.files.where('projectId').equals(projectId).toArray();
  }

  async getAllFiles(): Promise<StoredFile[]> {
    return await this.files.orderBy('path').toArray();
  }

  async deleteFile(path: string, projectId?: string) {
    const file = await this.files.where('path').equals(path).and(item => item.projectId === projectId).first();
    if (file) {
      const result = await this.files.delete(file.id!);
      
      // Update project file count
      if (projectId) {
        await this.decrementFileCount(projectId);
      }
      
      return result;
    }
  }

  async clearProjectFiles(projectId: string) {
    return await this.transaction('rw', this.files, this.projects, async () => {
      await this.files.where('projectId').equals(projectId).delete();
      await this.projects.where('projectId').equals(projectId).modify({ fileCount: 0 });
    });
  }

  private async incrementFileCount(projectId: string) {
    const project = await this.getProject(projectId);
    if (project) {
      await this.projects.update(project.id!, {
        fileCount: project.fileCount + 1,
        updatedAt: new Date()
      });
    }
  }

  private async decrementFileCount(projectId: string) {
    const project = await this.getProject(projectId);
    if (project) {
      await this.projects.update(project.id!, {
        fileCount: Math.max(0, project.fileCount - 1),
        updatedAt: new Date()
      });
    }
  }

  // Session operations
  async saveSession(session: { sessionId: string; passphrase: string }, projectId?: string) {
    const now = new Date();
    const existingSession = await this.sessions.where('sessionId').equals(session.sessionId).first();
    
    if (existingSession) {
      return await this.sessions.update(existingSession.id!, {
        lastAccessed: now,
        isActive: true
      });
    } else {
      return await this.sessions.add({
        ...session,
        projectId,
        createdAt: now,
        lastAccessed: now,
        isActive: true
      });
    }
  }

  async getActiveSession(): Promise<VaultSession | undefined> {
    return await this.sessions.where('isActive').equals(1).first();
  }

  async deactivateAllSessions() {
    return await this.sessions.toCollection().modify({ isActive: false });
  }

  // Editor state operations
  async saveEditorState(state: Partial<EditorState>, projectId?: string) {
    const now = new Date();
    if (projectId) {
      const existingState = await this.editorStates.where('projectId').equals(projectId).limit(1).first();
      
      if (existingState) {
        return await this.editorStates.update(existingState.id!, {
          ...state,
          updatedAt: now
        });
      } else {
        return await this.editorStates.add({
          projectId,
          selectedFilePath: state.selectedFilePath || null,
          sidebarWidth: state.sidebarWidth || 280,
          searchQuery: state.searchQuery || '',
          openedFolders: state.openedFolders || [],
          updatedAt: now
        });
      }
    } else {
      const existingState = await this.editorStates.limit(1).first();
      
      if (existingState) {
        return await this.editorStates.update(existingState.id!, {
          ...state,
          updatedAt: now
        });
      } else {
        return await this.editorStates.add({
          selectedFilePath: state.selectedFilePath || null,
          sidebarWidth: state.sidebarWidth || 280,
          searchQuery: state.searchQuery || '',
          openedFolders: state.openedFolders || [],
          updatedAt: now
        });
      }
    }
  }

  async getEditorState(projectId?: string): Promise<EditorState | undefined> {
    if (projectId) {
      return await this.editorStates.where('projectId').equals(projectId).limit(1).first();
    } else {
      return await this.editorStates.limit(1).first();
    }
  }

  // Bulk operations
  async saveFiles(files: { path: string; content: string }[], projectId?: string) {
    const now = new Date();
    const storedFiles: StoredFile[] = files.map(file => ({
      path: file.path,
      content: file.content,
      createdAt: now,
      updatedAt: now,
      projectId
    }));
    
    const result = await this.files.bulkPut(storedFiles);
    
    // Update project file count
    if (projectId) {
      await this.projects.where('projectId').equals(projectId).modify({
        fileCount: files.length,
        updatedAt: now
      });
    }
    
    return result;
  }

  async exportProjectData(projectId: string) {
    const files = await this.getProjectFiles(projectId);
    const session = await this.getActiveSession();
    const editorState = await this.getEditorState(projectId);
    const project = await this.getProject(projectId);
    
    return {
      project,
      files,
      session,
      editorState,
      exportedAt: new Date()
    };
  }

  async importProjectData(data: { project: Project; files: StoredFile[]; session?: VaultSession; editorState?: EditorState }) {
    return await this.transaction('rw', this.projects, this.files, this.sessions, this.editorStates, async () => {
      // Import project
      if (data.project) {
        await this.projects.add(data.project);
      }
      
      // Import files
      if (data.files.length > 0) {
        await this.files.bulkPut(data.files);
      }
      
      // Import session
      if (data.session) {
        await this.sessions.add(data.session);
      }
      
      // Import editor state
      if (data.editorState) {
        await this.editorStates.add(data.editorState);
      }
    });
  }
}

// Export singleton instance
export const vaultDB = new VaultDatabase();
