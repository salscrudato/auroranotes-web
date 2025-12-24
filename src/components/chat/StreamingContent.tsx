/**
 * Streaming content visualization with phase indicators and typing animation.
 */

import { memo } from 'react';
import { Loader2, Brain, Sparkles, Search, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

type StreamPhase = 'searching' | 'analyzing' | 'generating';

interface PhaseConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

const PHASE_CONFIG: Record<StreamPhase, PhaseConfig> = {
  searching: {
    icon: Search,
    label: 'Searching your notes',
    color: 'text-blue-500',
  },
  analyzing: {
    icon: Brain,
    label: 'Analyzing sources',
    color: 'text-purple-500',
  },
  generating: {
    icon: Sparkles,
    label: 'Generating response',
    color: 'text-amber-500',
  },
};

interface StreamingContentProps {
  content: string;
  isThinking?: boolean;
  phase?: StreamPhase;
  sourceCount?: number;
  className?: string;
}

export const StreamingContent = memo(function StreamingContent({
  content,
  isThinking = false,
  phase = 'generating',
  sourceCount,
  className,
}: StreamingContentProps) {
  // Show phase indicator without content
  if (isThinking && !content) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <PhaseIndicator phase={phase} sourceCount={sourceCount} />
        <div className="h-4" />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Phase indicator above content while streaming */}
      {isThinking && content && (
        <div className="mb-2">
          <PhaseIndicator phase={phase} sourceCount={sourceCount} />
        </div>
      )}

      {/* Content with cursor */}
      <div className="whitespace-pre-wrap">
        {content}
        {isThinking && <BlinkingCursor />}
      </div>
    </div>
  );
});

/** Animated thinking dots */
const ThinkingDots = memo(function ThinkingDots() {
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
});

interface PhaseIndicatorProps {
  phase: StreamPhase;
  sourceCount: number | undefined;
}

/** Phase indicator for different stages of response generation */
const PhaseIndicator = memo(function PhaseIndicator({ phase, sourceCount }: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  // Dynamic label for analyzing phase
  const label = phase === 'analyzing' && sourceCount
    ? `Analyzing ${sourceCount} source${sourceCount > 1 ? 's' : ''}`
    : config.label;

  return (
    <div className={cn('flex items-center gap-2 text-sm', config.color)}>
      <Icon size={14} className="animate-pulse" />
      <span>{label}</span>
      <ThinkingDots />
    </div>
  );
});

/** CSS-animated blinking cursor */
const BlinkingCursor = memo(function BlinkingCursor() {
  return (
    <span
      className="inline-block w-0.5 h-[1.2em] bg-current ml-0.5 align-middle animate-blink"
      aria-hidden="true"
    />
  );
});

/** Loading skeleton for initial message fetch */
export const StreamingLoadingSkeleton = memo(function StreamingLoadingSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
      <span className="text-sm text-[var(--color-text-secondary)]">
        Searching your notes...
      </span>
    </div>
  );
});
