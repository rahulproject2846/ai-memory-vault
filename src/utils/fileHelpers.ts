export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export function buildFileTree(files: { path: string; content?: string }[]): FileNode[] {
  const rootNodes: FileNode[] = [];
  const nodeMap: { [key: string]: FileNode } = {};

  files.forEach(file => {
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
