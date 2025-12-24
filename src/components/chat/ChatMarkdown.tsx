import { memo, useMemo, type ReactNode, type ElementType, type AnchorHTMLAttributes, type HTMLAttributes } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { Source } from '@/lib/types';
import { SourceRefChip } from './CitationChip';

const SOURCE_PATTERN = /\[(\d+)\]/g;

interface ChatMarkdownProps {
  content: string;
  sources?: Source[];
  onSourceClick: (source: Source) => void;
}

function processTextWithCitations(
  text: string,
  sourceMap: Map<string, Source>,
  onSourceClick: (source: Source) => void
): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let keyIndex = 0;

  SOURCE_PATTERN.lastIndex = 0;

  let match;
  while ((match = SOURCE_PATTERN.exec(text)) !== null) {
    const fullMatch = match[0];
    const id = match[1];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const source = id ? sourceMap.get(id) : undefined;
    if (source) {
      parts.push(<SourceRefChip key={`citation-${keyIndex++}`} source={source} onClick={onSourceClick} />);
    } else if (fullMatch) {
      parts.push(fullMatch);
    }

    lastIndex = matchIndex + (fullMatch?.length ?? 0);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

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

function createCitationWrapper(
  Tag: ElementType,
  sourceMap: Map<string, Source>,
  onSourceClick: (source: Source) => void
) {
  return ({ children }: { children?: ReactNode }) => (
    <Tag>{processChildren(children, sourceMap, onSourceClick)}</Tag>
  );
}

export const ChatMarkdown = memo(function ChatMarkdown({ content, sources, onSourceClick }: ChatMarkdownProps) {
  const sourceMap = useMemo(() => {
    const map = new Map<string, Source>();
    sources?.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const components = useMemo((): Components => {
    const wrap = (tag: ElementType) => createCitationWrapper(tag, sourceMap, onSourceClick);
    return {
      p: wrap('p'),
      li: wrap('li'),
      strong: wrap('strong'),
      em: wrap('em'),
      code: (props: HTMLAttributes<HTMLElement>) => (
        <code className={props.className ?? 'inline-code'}>{props.children}</code>
      ),
      pre: (props: HTMLAttributes<HTMLPreElement>) => <pre className="code-block">{props.children}</pre>,
      a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
      ),
    };
  }, [sourceMap, onSourceClick]);

  return (
    <div className="chat-markdown">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
});
