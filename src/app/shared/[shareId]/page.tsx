import { getSharedVault } from '@/lib/vault';
import { buildFileTree } from '@/utils/fileHelpers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import SharedVaultClient from './SharedVaultClient';

interface SharedFile {
  path: string;
  content: string;
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

  // Serialize map for client component
  const serializedFiles: [string, string][] = Array.from(filesMap.entries());

  return (
    <>
      {/* AI-accessible content - visible for crawlers, hidden for users */}
      <div 
        className="ai-accessible-content"
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        <h1>Shared Vault Contents</h1>
        <p>This shared vault contains {filesArray.length} files:</p>
        {filesArray.map((file, index) => (
          <div key={index} className="ai-file" data-path={file.path}>
            <h2>{file.path}</h2>
            <pre><code>{file.content}</code></pre>
          </div>
        ))}
      </div>

      {/* Interactive IDE Interface */}
      <SharedVaultClient 
        initialFileTree={rootNodes} 
        initialFiles={serializedFiles}
      />
    </>
  );
}
