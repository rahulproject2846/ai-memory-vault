'use client';

import { useEffect } from 'react';
import VaultView from '@/components/VaultView';
import { FileNode } from '@/utils/fileHelpers';
import { useVaultStore } from '@/store/vaultStore';

interface SharedVaultClientProps {
  initialFileTree: FileNode[];
  initialFiles: [string, string][];
}

export default function SharedVaultClient({ initialFileTree, initialFiles }: SharedVaultClientProps) {
  const store = useVaultStore();

  useEffect(() => {
    store.reset();
    store.setFileTree(initialFileTree);
    store.setFilesMap(new Map(initialFiles));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VaultView
      readOnly={true}
    />
  );
}
