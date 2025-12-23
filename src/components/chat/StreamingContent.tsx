/**
 * StreamingContent component
 * Enhanced streaming visualization with thinking indicator and smooth animations
 */

import { memo, useState, useEffect, useMemo } from 'react';
import { Loader2, Brain, Sparkles, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StreamingContentProps {
  content: string;
  isThinking?: boolean;
  phase?: 'searching' | 'analyzing' | 'generating';
  sourceCount?: number;
  className?: string;
}

/** Animated thinking dots */
function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

/** Phase indicator for different stages of response generation */
function PhaseIndicator({ phase, sourceCount }: { phase: string; sourceCount?: number }) {
  const config = {
    searching: {
      icon: Search,
      label: 'Searching your notes',
      color: 'text-blue-500',
    },
    analyzing: {
      icon: Brain,
      label: sourceCount ? `Analyzing ${sourceCount} source${sourceCount > 1 ? 's' : ''}` : 'Analyzing sources',
      color: 'text-purple-500',
    },
    generating: {
      icon: Sparkles,
      label: 'Generating response',
      color: 'text-amber-500',
    },
  };

  const { icon: Icon, label, color } = config[phase as keyof typeof config] || config.generating;

  return (
    <div className={cn('flex items-center gap-2 text-sm', color)}>
      <Icon size={14} className="animate-pulse" />
      <span>{label}</span>
      <ThinkingDots />
    </div>
  );
}

export const StreamingContent = memo(function StreamingContent({
  content,
  isThinking = false,
  phase = 'generating',
  sourceCount,
  className,
}: StreamingContentProps) {
  const [displayContent, setDisplayContent] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Smooth content reveal with slight delay for natural feel
  useEffect(() => {
    if (content.length > displayContent.length) {
      const timeout = setTimeout(() => {
        setDisplayContent(content);
      }, 10); // Small delay for smoother animation
      return () => clearTimeout(timeout);
    } else if (content.length < displayContent.length) {
      // Content was reset (new message)
      setDisplayContent(content);
    }
  }, [content, displayContent.length]);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Split content into words for smoother rendering
  const words = useMemo(() => {
    return displayContent.split(/(\s+)/);
  }, [displayContent]);

  if (isThinking && !content) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <PhaseIndicator phase={phase} sourceCount={sourceCount} />
        <div className="h-4" /> {/* Placeholder space */}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Thinking indicator above content */}
      {isThinking && content && (
        <div className="mb-2">
          <PhaseIndicator phase={phase} sourceCount={sourceCount} />
        </div>
      )}
      
      {/* Content with word-by-word animation */}
      <div className="whitespace-pre-wrap">
        {words.map((word, i) => (
          <span
            key={i}
            className="animate-fade-in"
            style={{ animationDelay: `${Math.min(i * 5, 100)}ms` }}
          >
            {word}
          </span>
        ))}
        {/* Blinking cursor */}
        {isThinking && (
          <span
            className={cn(
              'inline-block w-0.5 h-[1.2em] bg-current ml-0.5 align-middle transition-opacity',
              cursorVisible ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}
      </div>
    </div>
  );
});

/** Loading skeleton for initial message fetch */
export function StreamingLoadingSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
      <span className="text-sm text-[var(--color-text-secondary)]">
        Searching your notes...
      </span>
    </div>
  );
}

