'use client';

import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useVaultStore } from '@/store/vaultStore';

interface MonacoEditorProps {
  height?: string;
  language?: string;
  theme?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
}

export default function MonacoEditorComponent({
  height = '100%',
  language = 'typescript',
  theme = 'vs-dark',
  value = '',
  onChange,
  onSave
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null);
  const store = useVaultStore();

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) onSave();
    });

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'var(--font-jetbrains-mono), monospace',
      lineNumbers: 'on',
      minimap: { enabled: true },
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: true,
      trimAutoWhitespace: true,
      formatOnPaste: true,
      formatOnType: true
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && onChange) {
      onChange(value);
    }
  };

  // Detect language based on file extension
  const detectLanguage = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'html':
      case 'htm':
        return 'html';
      case 'md':
        return 'markdown';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'sql':
        return 'sql';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
      case 'h':
        return 'cpp';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'sh':
      case 'bash':
        return 'shell';
      default:
        return 'plaintext';
    }
  };

  const currentLanguage = store.selectedFile 
    ? detectLanguage(store.selectedFile.path)
    : language;

  return (
    <div className="h-full">
      <Editor
        height={height}
        language={currentLanguage}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          wordWrap: 'on',
          lineNumbersMinChars: 3,
          fontSize: 14,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          automaticLayout: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          trimAutoWhitespace: true,
          formatOnPaste: true,
          formatOnType: true,
          renderWhitespace: 'selection',
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on'
        }}
      />
    </div>
  );
}
