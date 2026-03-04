import { getSharedVault } from '@/lib/vault';
import { buildFileTree } from '@/utils/fileHelpers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SharedFile {
  path: string;
  content: string;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'sql': 'sql',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'bash',
    'dockerfile': 'dockerfile',
    'gitignore': 'gitignore',
    'env': 'bash',
    'txt': 'text'
  };
  return langMap[ext || ''] || 'text';
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  const vault = await getSharedVault(shareId);
  
  if (!vault) {
    return {
      title: 'Shared Vault - Not Found',
      description: 'The requested shared vault could not be found.',
    };
  }

  const files = vault.files as SharedFile[];
  const fileCount = files.length;
  const fileNames = files.slice(0, 5).map(f => f.path.split('/').pop()).join(', ');
  
  return {
    title: `Shared Vault - ${fileCount} files`,
    description: `View ${fileCount} shared files${fileNames ? `: ${fileNames}${fileCount > 5 ? '...' : ''}` : ''}`,
    openGraph: {
      title: `Shared Vault - ${fileCount} files`,
      description: `View ${fileCount} shared files in this read-only IDE interface.`,
      type: 'website',
    },
  };
}

export default async function SharedVaultPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const vault = await getSharedVault(shareId);

  if (!vault) {
    notFound();
  }

  // Files are stored as { path, content }[] in vault.files
  const filesArray = vault.files as SharedFile[];
  const rootNodes = buildFileTree(filesArray);
  
  // Create a map for fast lookup
  const filesMap = new Map<string, string>();
  filesArray.forEach(f => filesMap.set(f.path, f.content));

  // Get the first file to display by default
  const firstFile = filesArray[0];
  const defaultContent = firstFile ? firstFile.content : '';
  const defaultLanguage = firstFile ? getLanguageFromPath(firstFile.path) : 'text';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-[#1f1f1f] p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Shared Vault</h1>
          <p className="text-gray-400 text-sm">
            {filesArray.length} files shared • Share ID: {shareId}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* File Tree Sidebar */}
        <div className="w-64 border-r border-[#1f1f1f] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Files
            </h2>
            <div className="space-y-1">
              {filesArray.map((file, index) => (
                <div
                  key={index}
                  className="group cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-[#1c1c1c] transition-colors"
                  onClick={() => {
                    // In a real implementation, this would switch the displayed file
                    window.location.href = `#file-${index}`;
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {file.path.includes('/') ? '📄' : '📄'}
                    </span>
                    <span className="text-gray-300 truncate">
                      {file.path.split('/').pop()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {file.path}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {filesArray.map((file, index) => (
              <div key={index} id={`file-${index}`} className="border-b border-[#1f1f1f]">
                {/* File Header */}
                <div className="bg-[#1c1c1c] px-4 py-2 border-b border-[#333]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📄</span>
                      <span className="text-sm font-medium text-white">{file.path}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {file.content.split('\n').length} lines
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="bg-[#0a0a0a]">
                  <SyntaxHighlighter
                    language={getLanguageFromPath(file.path)}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'transparent',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      },
                    }}
                    PreTag="pre"
                  >
                    {file.content}
                  </SyntaxHighlighter>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1f1f1f] p-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Shared via AI Memory Vault • Read-only view
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`https://ai-memory-vault.netlify.app/shared/${shareId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View on ai-memory-vault.netlify.app
            </a>
          </div>
        </div>
      </div>

      {/* AI-accessible content for crawlers */}
      <div className="sr-only">
        <h1>Shared Vault Contents</h1>
        <p>This shared vault contains {filesArray.length} files:</p>
        {filesArray.map((file, index) => (
          <div key={index}>
            <h2>{file.path}</h2>
            <pre><code>{file.content}</code></pre>
          </div>
        ))}
      </div>
    </div>
  );
}
