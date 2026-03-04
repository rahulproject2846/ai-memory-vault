'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  content: string;
  fileName: string;
}

export default function CodeViewer({ content, fileName }: CodeViewerProps) {
  const language = fileName.endsWith('.ts') || fileName.endsWith('.tsx') ? 'typescript' : 
                   fileName.endsWith('.js') || fileName.endsWith('.jsx') ? 'javascript' : 
                   fileName.endsWith('.json') ? 'json' : 
                   fileName.endsWith('.css') ? 'css' : 
                   fileName.endsWith('.html') ? 'html' : 'text';

  return (
    <div className="h-full w-full overflow-auto bg-[#1e1e1e] text-sm">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, height: '100%', background: '#1e1e1e' }}
        showLineNumbers={true}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
