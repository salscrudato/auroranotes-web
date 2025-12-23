/**
 * MarkdownEditor component - Text editor with Markdown preview
 * Supports live preview toggle and basic formatting shortcuts
 */

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Eye, Edit3, Bold, Italic, List, Link2, Code } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  'aria-label'?: string;
}

export interface MarkdownEditorRef {
  focus: () => void;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after: string) => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({
    value,
    onChange,
    placeholder = 'Start writing...',
    minHeight = '150px',
    maxHeight = '400px',
    disabled = false,
    autoFocus = false,
    className,
    'aria-label': ariaLabel = 'Note content',
  }, ref) => {
    const [showPreview, setShowPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      insertText: (text: string) => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newValue = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
        onChange(newValue);
        // Set cursor after inserted text
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(
            selectionStart + text.length,
            selectionStart + text.length
          );
        }, 0);
      },
      wrapSelection: (before: string, after: string) => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const selected = value.slice(selectionStart, selectionEnd);
        const newValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
        onChange(newValue);
      },
    }), [value, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!textareaRef.current) return;

      // Cmd/Ctrl + B for bold
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        const { selectionStart, selectionEnd } = textareaRef.current;
        const selected = value.slice(selectionStart, selectionEnd);
        const newValue = value.slice(0, selectionStart) + `**${selected}**` + value.slice(selectionEnd);
        onChange(newValue);
      }
      // Cmd/Ctrl + I for italic
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        const { selectionStart, selectionEnd } = textareaRef.current;
        const selected = value.slice(selectionStart, selectionEnd);
        const newValue = value.slice(0, selectionStart) + `*${selected}*` + value.slice(selectionEnd);
        onChange(newValue);
      }
      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newValue = value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd);
        onChange(newValue);
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(selectionStart + 2, selectionStart + 2);
        }, 0);
      }
    }, [value, onChange]);

    // Simple markdown to HTML conversion for preview
    const renderPreview = useCallback((md: string): string => {
      return md
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-[var(--color-surface-hover)] px-1 rounded">$1</code>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
        .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
        .replace(/\n/g, '<br />');
    }, []);

    const ToolbarButton = ({ icon: Icon, label, action }: { icon: typeof Bold; label: string; action: () => void }) => (
      <button
        type="button"
        onClick={action}
        title={label}
        className={cn(
          'p-1.5 rounded hover:bg-[var(--color-surface-hover)]',
          'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
          'transition-colors'
        )}
        aria-label={label}
      >
        <Icon size={16} />
      </button>
    );

    return (
      <div className={cn('flex flex-col rounded-lg border border-[var(--color-border)]', className)}>
        {/* Toolbar */}
        <div className={cn(
          'flex items-center gap-1 px-2 py-1.5 border-b border-[var(--color-border)]',
          'bg-[var(--color-surface)]'
        )}>
          <ToolbarButton
            icon={Bold}
            label="Bold (Cmd+B)"
            action={() => {
              if (!textareaRef.current) return;
              const { selectionStart, selectionEnd } = textareaRef.current;
              const selected = value.slice(selectionStart, selectionEnd);
              onChange(value.slice(0, selectionStart) + `**${selected}**` + value.slice(selectionEnd));
            }}
          />
          <ToolbarButton
            icon={Italic}
            label="Italic (Cmd+I)"
            action={() => {
              if (!textareaRef.current) return;
              const { selectionStart, selectionEnd } = textareaRef.current;
              const selected = value.slice(selectionStart, selectionEnd);
              onChange(value.slice(0, selectionStart) + `*${selected}*` + value.slice(selectionEnd));
            }}
          />
          <ToolbarButton
            icon={Code}
            label="Code"
            action={() => {
              if (!textareaRef.current) return;
              const { selectionStart, selectionEnd } = textareaRef.current;
              const selected = value.slice(selectionStart, selectionEnd);
              onChange(value.slice(0, selectionStart) + `\`${selected}\`` + value.slice(selectionEnd));
            }}
          />
          <ToolbarButton
            icon={List}
            label="List"
            action={() => {
              if (!textareaRef.current) return;
              const { selectionStart } = textareaRef.current;
              onChange(value.slice(0, selectionStart) + '\n- ' + value.slice(selectionStart));
            }}
          />
          <ToolbarButton
            icon={Link2}
            label="Link"
            action={() => {
              if (!textareaRef.current) return;
              const { selectionStart, selectionEnd } = textareaRef.current;
              const selected = value.slice(selectionStart, selectionEnd) || 'link text';
              onChange(value.slice(0, selectionStart) + `[${selected}](url)` + value.slice(selectionEnd));
            }}
          />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-sm',
              'transition-colors',
              showPreview
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {showPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {/* Editor / Preview */}
        {showPreview ? (
          <div
            className={cn(
              'prose prose-sm dark:prose-invert p-3 overflow-y-auto',
              'text-[var(--color-text-primary)]'
            )}
            style={{ minHeight, maxHeight }}
            dangerouslySetInnerHTML={{ __html: renderPreview(value) || '<span class="text-[var(--color-text-tertiary)]">Nothing to preview</span>' }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              'w-full p-3 resize-none bg-transparent border-none outline-none',
              'text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-tertiary)]',
              'font-mono text-sm leading-relaxed'
            )}
            style={{ minHeight, maxHeight }}
            aria-label={ariaLabel}
          />
        )}
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

