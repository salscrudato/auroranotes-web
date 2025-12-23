/**
 * NoteComposer component - Enhanced note creation
 * Supports title, tags, markdown editing, and voice input
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUp, Mic, FileText, X, ChevronUp } from 'lucide-react';
import { cn, triggerHaptic } from '../../lib/utils';
import { NOTES } from '../../lib/constants';
import { TagInput } from '../ui/TagInput';
import { MarkdownEditor, type MarkdownEditorRef } from '../ui/MarkdownEditor';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useNoteClassifier } from '../../hooks/useNoteClassifier';
import { VoicePreviewBar } from './VoicePreviewBar';

export interface NoteComposerData {
  text: string;
  title?: string;
  tags?: string[];
}

interface NoteComposerProps {
  onSubmit: (data: NoteComposerData) => Promise<void>;
  tagSuggestions?: string[];
  disabled?: boolean;
  className?: string;
}

export function NoteComposer({ onSubmit, tagSuggestions = [], disabled = false, className }: NoteComposerProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const editorRef = useRef<MarkdownEditorRef>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Voice input
  const {
    state: recordingState,
    isSupported: isSpeechSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    confirmTranscription,
    playPreview,
    pausePreview,
    isPlaying,
    duration,
    currentTime,
    transcript,
    setTranscript,
    rawTranscript,
    skipEnhancement,
    enhanceNow,
    enhancementFailed,
  } = useSpeechToText({
    onError: useCallback((errorMsg: string) => {
      console.error('Voice input error:', errorMsg);
    }, []),
    autoEnhance: false,
  });

  const isRecording = recordingState === 'recording';
  const isEnhancing = recordingState === 'enhancing';
  const isPreviewing = recordingState === 'preview' || recordingState === 'enhancing';

  // Note classifier
  const { suggestedTags, templates, applyTemplate } = useNoteClassifier(text);

  // Merge suggested tags with manual tags
  const allSuggestions = [...new Set([...tagSuggestions, ...suggestedTags])];

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= NOTES.MAX_LENGTH && !saving && !disabled;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit({
        text: trimmed,
        title: title.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      // Reset form on success
      setText('');
      setTitle('');
      setTags([]);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  }, [canSubmit, trimmed, title, tags, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleMicClick = useCallback(() => {
    triggerHaptic('medium');
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleConfirmTranscript = useCallback(() => {
    triggerHaptic('light');
    if (transcript.trim()) {
      setText((prev) => {
        const newText = prev ? `${prev} ${transcript.trim()}` : transcript.trim();
        return newText.slice(0, NOTES.MAX_LENGTH);
      });
    }
    confirmTranscription();
  }, [transcript, confirmTranscription]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    const structure = applyTemplate(templateId);
    if (structure) {
      setText(structure);
      setShowTemplates(false);
      editorRef.current?.focus();
    }
  }, [applyTemplate]);

  // Auto-expand when user starts typing
  useEffect(() => {
    if (text.length > 0 || title.length > 0 || tags.length > 0) {
      setExpanded(true);
    }
  }, [text, title, tags]);

  return (
    <div className={cn('flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
      {/* Voice Preview */}
      {isPreviewing && (
        <VoicePreviewBar
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlay={playPreview}
          onPause={pausePreview}
          transcript={transcript}
          rawTranscript={rawTranscript}
          isEnhancing={isEnhancing}
          enhancementFailed={enhancementFailed}
          onTranscriptChange={setTranscript}
          onSkipEnhancement={skipEnhancement}
          onEnhanceNow={enhanceNow}
          onConfirm={handleConfirmTranscript}
          onCancel={cancelRecording}
        />
      )}

      {/* Collapsed / Simple View */}
      {!expanded && !isPreviewing && (
        <div className="flex items-center gap-2 p-3" onKeyDown={handleKeyDown}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Capture a thought..."
            disabled={disabled || saving || isRecording}
            className={cn(
              'flex-1 bg-transparent border-none outline-none',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]'
            )}
            onFocus={() => setExpanded(true)}
          />
          <ActionButtons
            isSpeechSupported={isSpeechSupported}
            isRecording={isRecording}
            saving={saving}
            canSubmit={canSubmit}
            disabled={disabled}
            onMicClick={handleMicClick}
            onTemplateClick={() => { setExpanded(true); setShowTemplates(true); }}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {/* Expanded View */}
      {expanded && !isPreviewing && (
        <div className="flex flex-col" onKeyDown={handleKeyDown}>
          {/* Header with collapse */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              disabled={disabled || saving}
              className={cn(
                'flex-1 bg-transparent border-none outline-none text-lg font-medium',
                'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]'
              )}
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
              aria-label="Collapse composer"
            >
              <ChevronUp size={18} />
            </button>
          </div>

          {/* Tags */}
          <div className="px-3 py-2 border-b border-[var(--color-border)]">
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={allSuggestions}
              placeholder="Add tags..."
              disabled={disabled || saving}
            />
          </div>

          {/* Editor */}
          <MarkdownEditor
            ref={editorRef}
            value={text}
            onChange={setText}
            placeholder="Start writing..."
            minHeight="120px"
            maxHeight="300px"
            disabled={disabled || saving}
            autoFocus
            className="border-none rounded-none"
          />

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--color-border)]">
            <div className="text-xs text-[var(--color-text-tertiary)]">
              {trimmed.length.toLocaleString()} / {NOTES.MAX_LENGTH.toLocaleString()}
            </div>
            <ActionButtons
              isSpeechSupported={isSpeechSupported}
              isRecording={isRecording}
              saving={saving}
              canSubmit={canSubmit}
              disabled={disabled}
              onMicClick={handleMicClick}
              onTemplateClick={() => setShowTemplates(!showTemplates)}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}

      {/* Template Picker */}
      {showTemplates && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
            <span className="text-sm font-medium">Templates</span>
            <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-[var(--color-surface-hover)] rounded">
              <X size={14} />
            </button>
          </div>
          <div className="py-1">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template.id)}
                className="w-full px-3 py-2 text-left hover:bg-[var(--color-surface-hover)] flex items-center gap-2"
              >
                <span>{template.icon}</span>
                <div>
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{template.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Action buttons shared between collapsed and expanded views
function ActionButtons({
  isSpeechSupported,
  isRecording,
  saving,
  canSubmit,
  disabled,
  onMicClick,
  onTemplateClick,
  onSubmit,
}: {
  isSpeechSupported: boolean;
  isRecording: boolean;
  saving: boolean;
  canSubmit: boolean;
  disabled: boolean;
  onMicClick: () => void;
  onTemplateClick: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onTemplateClick}
        disabled={disabled || saving || isRecording}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
          'hover:bg-[var(--color-surface-hover)]'
        )}
        aria-label="Choose template"
      >
        <FileText size={18} />
      </button>
      {isSpeechSupported && (
        <button
          type="button"
          onClick={onMicClick}
          disabled={disabled || saving}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isRecording
              ? 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 animate-pulse'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
          )}
          aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          <Mic size={18} />
        </button>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isRecording}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canSubmit
            ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]'
        )}
        aria-label="Save note"
      >
        {saving ? <span className="spinner w-4 h-4" /> : <ArrowUp size={18} />}
      </button>
    </div>
  );
}

