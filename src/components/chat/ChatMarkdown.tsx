/**
 * ChatMarkdown component
 * Renders markdown content with source citation support for chat messages
 */

import { memo, useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Source } from '../../lib/types';
import { SourceRefChip } from './CitationChip';

/** Regex pattern to match citation tokens like [1], [2], etc. */
const SOURCE_PATTERN = /\[(\d+)\]/g;

interface ChatMarkdownProps {
  content: string;
  sources?: Source[];
  onSourceClick: (source: Source) => void;
}

/**
 * Process text to replace [1], [2] citation markers with React elements
 */
function processTextWithCitations(
  text: string,
  sourceMap: Map<string, Source>,
  onSourceClick: (source: Source) => void
): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let keyIndex = 0;

  // Reset regex state
  SOURCE_PATTERN.lastIndex = 0;
  
  let match;
  while ((match = SOURCE_PATTERN.exec(text)) !== null) {
    const fullMatch = match[0]; // e.g., "[1]"
    const id = match[1]; // e.g., "1"
    const matchIndex = match.index;

    // Add text before this citation
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    // Add citation chip or plain text
    const source = sourceMap.get(id);
    if (source) {
      parts.push(
        <SourceRefChip
          key={`citation-${keyIndex++}`}
          source={source}
          onClick={onSourceClick}
        />
      );
    } else {
      // Source not found - render as plain text
      parts.push(fullMatch);
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * ChatMarkdown - Renders markdown with inline source citations
 */
export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  sources,
  onSourceClick,
}: ChatMarkdownProps) {
  // Build source lookup map
  const sourceMap = useMemo(() => {
    const map = new Map<string, Source>();
    if (sources) {
      for (const s of sources) {
        map.set(s.id, s);
      }
    }
    return map;
  }, [sources]);

  // Custom components for react-markdown
  const components = useMemo(() => ({
    // Override text rendering to handle citations
    p: ({ children }: { children?: ReactNode }) => {
      return <p>{processChildren(children, sourceMap, onSourceClick)}</p>;
    },
    li: ({ children }: { children?: ReactNode }) => {
      return <li>{processChildren(children, sourceMap, onSourceClick)}</li>;
    },
    strong: ({ children }: { children?: ReactNode }) => {
      return <strong>{processChildren(children, sourceMap, onSourceClick)}</strong>;
    },
    em: ({ children }: { children?: ReactNode }) => {
      return <em>{processChildren(children, sourceMap, onSourceClick)}</em>;
    },
    // Code blocks - don't process citations inside code
    code: ({ children, className }: { children?: ReactNode; className?: string }) => {
      const isInline = !className;
      if (isInline) {
        return <code className="inline-code">{children}</code>;
      }
      return <code className={className}>{children}</code>;
    },
    pre: ({ children }: { children?: ReactNode }) => {
      return <pre className="code-block">{children}</pre>;
    },
    // Links - open in new tab
    a: ({ href, children }: { href?: string; children?: ReactNode }) => {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  }), [sourceMap, onSourceClick]);

  return (
    <div className="chat-markdown">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

/**
 * Process children nodes, replacing text with citation-aware content
 */
function processChildren(
  children: ReactNode,
  sourceMap: Map<string, Source>,
  onSourceClick: (source: Source) => void
): ReactNode {
  if (typeof children === 'string') {
    return processTextWithCitations(children, sourceMap, onSourceClick);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const processed = processTextWithCitations(child, sourceMap, onSourceClick);
        return processed.length === 1 ? processed[0] : <span key={i}>{processed}</span>;
      }
      return child;
    });
  }
  return children;
}

