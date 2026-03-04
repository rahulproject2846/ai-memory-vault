'use client';

import { useState, useEffect } from 'react';
import { X, Check, Copy } from 'lucide-react';
import { buildFileTree } from '@/utils/fileHelpers';
import { useVaultStore } from '@/store/vaultStore';
import VaultView from '@/components/VaultView';
import ProjectSwitcher from '@/components/ProjectSwitcher';

export default function VaultPage() {
  const store = useVaultStore();
  const [copyShareSuccess, setCopyShareSuccess] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // First, try to hydrate from IndexedDB
        await store.hydrateFromDB();
        
        // If no session exists, create a new one
        if (!store.session) {
          const res = await fetch('/api/session', { method: 'POST' });
          if (!res.ok) throw new Error('Failed to create session');
          const data = await res.json();
          store.setSession(data);
        }
      } catch (err) {
        console.error('Failed to init session', err);
        store.setError('Failed to connect to Vault Server (MongoDB). Ensure DB is running.');
      }
    };
    initSession();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !store.session) return;
    store.setIsUploading(true);
    
    const fileList = Array.from(e.target.files);
    const newFilesMap = new Map<string, string>();
    const filesArray: { path: string; content: string }[] = [];

    // Helper to read file content
    const readFile = (file: File): Promise<{ path: string; content: string }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            path: file.webkitRelativePath,
            content: e.target?.result as string || '',
          });
        };
        reader.readAsText(file);
      });
    };

    // Process files in chunks to avoid blocking UI
    const CHUNK_SIZE = 10;
    
    for (let i = 0; i < fileList.length; i += CHUNK_SIZE) {
      const chunk = fileList.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(chunk.map(readFile));
      results.forEach(f => {
        newFilesMap.set(f.path, f.content);
        filesArray.push(f);
      });
    }

    const rootNodes = buildFileTree(filesArray);

    // Update store
    store.setFilesMap(newFilesMap);
    store.setFileTree(rootNodes);
    
    // Save to IndexedDB
    await store.saveToDB();
    
    store.setIsUploading(false);
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !store.session) return;
    store.setIsUploading(true);
    
    const fileList = Array.from(e.target.files);
    const newFilesMap = new Map(store.filesMap);
    const filesArray: { path: string; content: string }[] = [];

    // Helper to read file content
    const readFile = (file: File): Promise<{ path: string; content: string }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            path: file.name, // Single files use just the filename
            content: e.target?.result as string || '',
          });
        };
        reader.readAsText(file);
      });
    };

    // Process files
    for (const file of fileList) {
      const result = await readFile(file);
      newFilesMap.set(result.path, result.content);
      filesArray.push(result);
    }

    // Update store with new files added to existing ones
    store.setFilesMap(newFilesMap);
    
    // Rebuild file tree with all files
    const allFilesArray = Array.from(newFilesMap.entries()).map(([path, content]) => ({ path, content }));
    const rootNodes = buildFileTree(allFilesArray);
    store.setFileTree(rootNodes);
    
    // Save to IndexedDB
    await store.saveToDB();
    
    store.setIsUploading(false);
  };

  const handleShareFull = async () => {
    if (store.filesMap.size === 0) {
      alert("Please upload a folder first.");
      return;
    }
    
    store.setIsSharing(true);
    store.setShareType('full');
    try {
      // Bundle files
      const files: { path: string; content: string }[] = [];
      store.filesMap.forEach((content, path) => {
        files.push({ path, content });
      });

      const res = await fetch('/api/vault/share-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, shareType: 'full' })
      });

      if (!res.ok) throw new Error('Failed to share project');
      
      const data = await res.json();
      store.setShareUrl(data.url);
      store.setAiContextTemplate(data.aiContextTemplate);
    } catch (err) {
      console.error('Share failed', err);
      alert('Failed to share project. See console for details.');
    } finally {
      store.setIsSharing(false);
    }
  };

  const handleShareSingle = async () => {
    if (!store.selectedFile) return;
    
    store.setIsSharing(true);
    store.setShareType('single');
    try {
      // Only share current file
      const files = [{ 
        path: store.selectedFile.path, 
        content: store.selectedFile.content 
      }];

      const res = await fetch('/api/vault/share-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, shareType: 'page' })
      });

      if (!res.ok) throw new Error('Failed to share file');
      
      const data = await res.json();
      store.setShareUrl(data.url);
      store.setAiContextTemplate(`Hello AI, I am sharing a specific file. Access it here: ${data.url}`);
    } catch (err) {
      console.error('Share failed', err);
      alert('Failed to share file.');
    } finally {
      store.setIsSharing(false);
    }
  };

  const copyShareLink = async () => {
    if (!store.shareUrl) return;
    const template = store.aiContextTemplate || `Hello AI, I am sharing my project context. Access it here: ${store.shareUrl}`;
    try {
      await navigator.clipboard.writeText(template);
      setCopyShareSuccess(true);
      setTimeout(() => setCopyShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-[#0a0a0a]">
        {/* Main Vault Interface */}
        <VaultView
          onUpload={handleFileUpload}
          onAddFile={handleAddFile}
          onShareFull={handleShareFull}
          onShareSingle={handleShareSingle}
        />
        
        {/* Project Switcher */}
        <ProjectSwitcher />
      </div>

      {/* Share Modal */}
      {store.shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-[#333] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {store.shareType === 'full' ? 'Project Shared Successfully' : 'File Shared Successfully'}
              </h3>
              <button onClick={() => store.setShareUrl(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Anyone with this link can view this {store.shareType === 'full' ? 'project' : 'file'} in Read-Only mode.
              </p>
              
              {/* Share URL */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-medium">Share Link</label>
                <div className="flex items-center gap-2 bg-[#1c1c1c] p-2 rounded-lg border border-[#333]">
                  <input 
                    type="text" 
                    value={store.shareUrl} 
                    readOnly 
                    className="flex-1 bg-transparent text-sm text-blue-400 outline-none font-mono"
                  />
                  <button 
                    onClick={copyShareLink}
                    className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                  >
                    {copyShareSuccess ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                  </button>
                </div>
              </div>

              {/* AI Context Template */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-medium">AI Context Template</label>
                <div className="bg-[#1c1c1c] p-3 rounded-lg border border-[#333]">
                  <div className="text-xs text-gray-300 font-mono break-all">
                    {store.aiContextTemplate || `Hello AI, I am sharing my project context. Access it here: ${store.shareUrl}`}
                  </div>
                  <button 
                    onClick={copyShareLink}
                    className="mt-2 w-full p-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors text-white text-xs font-medium flex items-center justify-center gap-2"
                  >
                    {copyShareSuccess ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
                    {copyShareSuccess ? 'Copied!' : 'Copy AI Context'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
