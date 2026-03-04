export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

// File blacklist for optimization - Master Architect's directive
const FILE_BLACKLIST = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.DS_Store',
  'Thumbs.db',
  '.vscode',
  '.idea',
  'coverage',
  '.nyc_output',
  '.cache',
  'tmp',
  'temp'
];

// Function to check if a file/folder should be blacklisted
export function isBlacklisted(path: string): boolean {
  const pathParts = path.split('/');
  return FILE_BLACKLIST.some(blacklistedItem => 
    pathParts.some(part => part === blacklistedItem || part.startsWith(blacklistedItem))
  );
}

// Function to filter files based on blacklist
export function filterBlacklistedFiles(files: { path: string; content?: string }[]): { path: string; content?: string }[] {
  return files.filter(file => !isBlacklisted(file.path));
}

export function buildFileTree(files: { path: string; content?: string }[]): FileNode[] {
  // Filter out blacklisted files before building tree
  const filteredFiles = filterBlacklistedFiles(files);
  
  const rootNodes: FileNode[] = [];
  const nodeMap: { [key: string]: FileNode } = {};

  filteredFiles.forEach(file => {
    const parts = file.path.split('/');
    let currentPath = '';
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (!nodeMap[currentPath]) {
        const node: FileNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          isOpen: false,
          content: isFile ? file.content : undefined
        };
        nodeMap[currentPath] = node;
        
        if (index === 0) {
          rootNodes.push(node);
        } else {
          const parent = nodeMap[parentPath];
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }
    });
  });

  return rootNodes;
}

export function filterTree(nodes: FileNode[], query: string): FileNode[] {
  return nodes
    .map(node => {
      if (node.type === 'folder' && node.children) {
        const filteredChildren = filterTree(node.children, query);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(query.toLowerCase())) {
          return { ...node, children: filteredChildren, isOpen: true }; // Auto-expand matches
        }
      } else if (node.name.toLowerCase().includes(query.toLowerCase())) {
        return node;
      }
      return null;
    })
    .filter((node): node is FileNode => node !== null);
}
