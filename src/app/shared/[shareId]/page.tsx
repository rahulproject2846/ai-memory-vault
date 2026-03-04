import { getSharedVault } from '@/lib/vault';
import { buildFileTree } from '@/utils/fileHelpers';
import { notFound } from 'next/navigation';
import SharedVaultClient from './SharedVaultClient';

export default async function SharedVaultPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const vault = await getSharedVault(shareId);

  if (!vault) {
    notFound();
  }

  // Files are stored as { path, content }[] in vault.files
  // We need to convert this to the props expected by VaultView
  const filesArray = vault.files as { path: string; content: string }[];
  const rootNodes = buildFileTree(filesArray);
  
  // Create a map for fast lookup
  const filesMap = new Map<string, string>();
  filesArray.forEach(f => filesMap.set(f.path, f.content));

  // Serialize map for client component
  const serializedFiles: [string, string][] = Array.from(filesMap.entries());

  return (
    <SharedVaultClient 
      initialFileTree={rootNodes} 
      initialFiles={serializedFiles}
    />
  );
}
