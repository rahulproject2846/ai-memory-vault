'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode, Upload, Loader2, ChevronRight, ChevronDown, Rocket, Check, Folder, Search, Command, Share2 } from 'lucide-react';
import { FileNode, filterTree } from '@/utils/fileHelpers';

interface VaultViewProps {
  // Optional for Read-Only Mode
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  
  // Share Action
  onShareFull?: () => void;
  onShareSingle?: () => void;
}

import { useVaultStore } from '@/store/vaultStore';

export default function VaultView({
  onUpload,
  readOnly = false,
  onShareFull,
  onShareSingle,
}: VaultViewProps) {
  const store = useVaultStore();
  const [isDragging, setIsDragging] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const displayedTree = store.searchQuery ? filterTree(store.fileTree, store.searchQuery) : store.fileTree;

  const handleCopyInstructions = async () => {
    if (!store.session) return;
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const text = `I am working on a project. You can read my source code directly from this Vault API. Use the following credentials: 
 Session ID: ${store.session.sessionId} 
 Secret Key: ${store.session.passphrase} 
 Base API URL: ${baseUrl}/api/vault/raw?sessionId=${store.session.sessionId}&passphrase=${store.session.passphrase}&filePath=[PATH]`;

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy instructions', err);
    }
  };

  // Resizable Sidebar Logic
  const startResizing = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const stopResizing = () => setIsDragging(false);
    const resize = (mouseMoveEvent: MouseEvent) => {
      if (isDragging) {
        store.setSidebarWidth(mouseMoveEvent.clientX);
      }
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isDragging, store]);

  const FileTreeNode = ({ node, depth = 0 }: { node: FileNode; depth?: number }) => {
    return (
      <div style={{ paddingLeft: `${depth * 12}px` }}>
        <div 
          className={`
            flex items-center py-1.5 px-2 cursor-pointer rounded-md mx-1 my-0.5 transition-all duration-200
            ${store.selectedFile?.path === node.path 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
          `}
          onClick={() => node.type === 'folder' ? store.toggleFolder(node.path) : store.selectFile(node.path)}
        >
          {node.type === 'folder' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {node.isOpen 
                ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" /> 
                : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
              <Folder size={14} className={`${node.isOpen ? 'text-blue-400' : 'text-gray-500'} flex-shrink-0`} />
              <span className="text-[13px] font-medium truncate">{node.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 pl-5">
              <FileCode size={14} className="text-gray-500 flex-shrink-0" />
              <span className={`text-[13px] truncate ${store.selectedFile?.path === node.path ? 'text-blue-400' : ''}`}>
                {node.name}
              </span>
            </div>
          )}
        </div>
        {node.isOpen && node.children && (
          <div className="border-l border-white/5 ml-[19px]">
            {node.children.map(child => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden selection:bg-blue-500/30">
      {/* Sidebar */}
      <div 
        className="flex flex-col border-r border-[#1f1f1f] bg-[#0a0a0a]/95 backdrop-blur-xl transition-all duration-75 relative z-20"
        style={{ width: store.sidebarWidth, minWidth: '240px', maxWidth: '600px' }}
      >
        {/* Sidebar Header - Traffic Lights */}
        <div className="h-12 flex items-center px-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] group-hover:bg-[#ff5f57]/80 transition-colors shadow-sm"/>
            <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] group-hover:bg-[#febc2e]/80 transition-colors shadow-sm"/>
            <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] group-hover:bg-[#28c840]/80 transition-colors shadow-sm"/>
          </div>
          <span className="ml-4 text-xs font-semibold text-gray-400 tracking-wide uppercase opacity-50">
            {readOnly ? 'Shared View' : 'Explorer'}
          </span>
        </div>

        {/* Action Area (Upload / Search) */}
        <div className="p-3 border-b border-[#1f1f1f] bg-[#0f0f0f]/50 space-y-3">
          {!readOnly && onUpload && (
            <label className="
              group flex items-center justify-center w-full py-2 px-3 
              bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] 
              rounded-md cursor-pointer transition-all duration-200
              shadow-sm hover:shadow-md
            ">
              {store.isUploading ? (
                <Loader2 className="animate-spin mr-2 text-blue-400" size={14}/>
              ) : (
                <Upload className="mr-2 text-gray-400 group-hover:text-blue-400 transition-colors" size={14}/>
              )}
              <span className="text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors">
                Open Project Folder
              </span>
              <input 
                type="file" 
                className="hidden" 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...{ webkitdirectory: "", directory: "" } as any} 
                onChange={onUpload}
                multiple 
              />
            </label>
          )}

          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Filter files..."
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
              className="
                w-full bg-[#1c1c1c] border border-[#333] rounded-md py-1.5 pl-9 pr-3 
                text-[13px] text-gray-200 placeholder:text-gray-600
                focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Error Message */}
        {store.error && (
          <div className="m-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-[11px] text-red-400 font-medium leading-relaxed">{store.error}</p>
          </div>
        )}

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          {displayedTree.length > 0 ? (
            <div className="pl-1 pr-2">
              {displayedTree.map(node => (
                <FileTreeNode key={node.path} node={node} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-[#1c1c1c] border border-[#333] flex items-center justify-center mb-3 shadow-lg">
                <Command size={20} className="text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">
                {store.searchQuery ? 'No matching files' : 'No Open Folder'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {store.searchQuery ? 'Try a different search term' : (readOnly ? 'This shared vault is empty' : 'Upload a project to start exploring')}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer - Session Info */}
        {!readOnly && store.session && (
          <div className="p-3 border-t border-[#1f1f1f] bg-[#0f0f0f]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 px-1">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
               <span className="text-[10px] font-medium text-green-500 tracking-wider uppercase">System Online</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] bg-[#1c1c1c] p-1.5 rounded border border-[#333]">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-gray-300 select-all">{store.session.sessionId}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-[#1c1c1c] p-1.5 rounded border border-[#333]">
                <span className="text-gray-500">Key</span>
                <span className="font-mono text-gray-300 select-all truncate max-w-[120px]">{store.session.passphrase}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resizer Handle */}
      <div 
        className="w-[1px] cursor-col-resize hover:w-[2px] bg-[#1f1f1f] hover:bg-blue-500 transition-all z-30"
        onMouseDown={startResizing}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#000] relative">
        {/* Header Bar */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 backdrop-blur-md select-none">
          {/* Breadcrumbs / File Name */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
               <Search size={14} />
               <span className="text-[13px]">Vault</span>
            </div>
            {store.selectedFile ? (
              <>
                <ChevronRight size={14} className="text-gray-600" />
                <div className="flex items-center gap-2 text-gray-200">
                  <FileCode size={14} className="text-blue-400" />
                  <span className="text-[13px] font-medium tracking-wide">{store.selectedFile.path}</span>
                </div>
              </>
            ) : (
               <span className="text-[13px] text-gray-600 italic ml-2">Select a file to view</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!readOnly && store.session && (
              <>
                {/* Share Full Project */}
                <button
                  onClick={onShareFull}
                  disabled={store.isSharing}
                  className={`
                    group flex items-center gap-2 px-3 py-1.5 rounded-full 
                    border transition-all duration-300 ease-out
                    bg-purple-600 hover:bg-purple-500 border-transparent text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]
                  `}
                >
                  {store.isSharing && store.shareType === 'full' ? <Loader2 size={14} className="animate-spin"/> : <Share2 size={14} />}
                  <span className="text-[12px] font-medium">
                    {store.isSharing && store.shareType === 'full' ? 'Bundling...' : 'Share Project'}
                  </span>
                </button>

                {/* Share Single File (Only if file selected) */}
                {store.selectedFile && (
                  <button
                    onClick={onShareSingle}
                    disabled={store.isSharing}
                    className={`
                      group flex items-center gap-2 px-3 py-1.5 rounded-full 
                      border transition-all duration-300 ease-out
                      bg-gray-700 hover:bg-gray-600 border-transparent text-white
                    `}
                  >
                    {store.isSharing && store.shareType === 'single' ? <Loader2 size={14} className="animate-spin"/> : <FileCode size={14} />}
                    <span className="text-[12px] font-medium">
                      {store.isSharing && store.shareType === 'single' ? 'Saving...' : 'Share File'}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleCopyInstructions}
                  className={`
                    group flex items-center gap-2 px-3 py-1.5 rounded-full 
                    border transition-all duration-300 ease-out
                    ${copySuccess 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-blue-600 hover:bg-blue-500 border-transparent text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]'}
                  `}
                >
                  {copySuccess ? <Check size={14} /> : <Rocket size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />}
                  <span className="text-[12px] font-medium">
                    {copySuccess ? 'Copied' : 'Connect AI'}
                  </span>
                </button>
              </>
            )}
            {readOnly && (
               <div className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-[12px] font-medium flex items-center gap-2">
                 <Share2 size={14} />
                 Read Only Mode
               </div>
            )}
          </div>
        </header>

        {/* Code Editor Area */}
        <main className="flex-1 relative overflow-hidden bg-[#000]">
          {store.selectedFile ? (
            <div className="absolute inset-0 overflow-auto custom-scrollbar">
              <SyntaxHighlighter
                language={
                   store.selectedFile.path.endsWith('.ts') || store.selectedFile.path.endsWith('.tsx') ? 'typescript' : 
                   store.selectedFile.path.endsWith('.js') || store.selectedFile.path.endsWith('.jsx') ? 'javascript' : 
                   store.selectedFile.path.endsWith('.json') ? 'json' : 
                   store.selectedFile.path.endsWith('.css') ? 'css' : 
                   store.selectedFile.path.endsWith('.html') ? 'html' : 'text'
                }
                style={vscDarkPlus}
                customStyle={{ 
                  margin: 0, 
                  padding: '1.5rem',
                  height: '100%', 
                  fontSize: '14px', 
                  lineHeight: '1.6', 
                  background: '#000',
                  fontFamily: 'var(--font-jetbrains-mono), monospace'
                }}
                showLineNumbers={true}
                lineNumberStyle={{ minWidth: '3em', paddingRight: '1.5em', color: '#444', textAlign: 'right' }}
                wrapLines={true}
              >
                {store.selectedFile.content}
              </SyntaxHighlighter>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center opacity-20 select-none">
                 <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-gray-800 to-black border border-gray-800 flex items-center justify-center">
                    <Command size={48} className="text-gray-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-500 mb-2">The Vault</h3>
                 <p className="text-gray-600 font-mono text-sm">
                   {readOnly ? 'Viewing Shared Project' : 'Ready for connection...'}
                 </p>
               </div>
            </div>
          )}
        </main>
        
        {/* Status Bar */}
        <footer className="h-6 bg-[#0a0a0a] border-t border-[#1f1f1f] flex items-center px-3 justify-between text-[10px] text-gray-500 select-none">
           <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                UTF-8
              </span>
              <span>Typescript</span>
           </div>
           <div className="flex items-center gap-3">
              <span>Ln 1, Col 1</span>
              <span>4 spaces</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
