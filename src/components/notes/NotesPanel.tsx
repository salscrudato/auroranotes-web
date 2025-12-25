/**
 * Main notes panel with sticky composer, scrollable list, and cursor-based pagination.
 */

import { useState, useMemo, useCallback, useEffect, useRef, memo, useDeferredValue } from 'react';
import { Search, ArrowUp, X, Tag, FileText } from 'lucide-react';
import type { Note } from '../../lib/types';
import { normalizeNote, groupNotesByDate } from '../../lib/format';
import { listNotes, createNote, deleteNote, updateNote, ApiRequestError } from '../../lib/api';
import { NOTES } from '../../lib/constants';
import { useToast } from '../common/useToast';
import { useAnnounce } from '../common/LiveRegion';
import { useNoteClassifier } from '../../hooks/useNoteClassifier';
import { NoteCard } from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EditNoteModal } from './EditNoteModal';
import { EmptyState } from '../common/EmptyState';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../common/PullToRefreshIndicator';

interface NotesPanelProps {
  className?: string;
  highlightNoteId?: string | null;
  onNoteHighlighted?: () => void;
  onNotesLoaded?: (notes: Note[], hasMore: boolean, loadMore: () => Promise<void>) => void;
  /** Register a callback to add notes externally (e.g., from mobile voice recording) */
  onRegisterAddNote?: (addNote: (note: Note) => void) => void;
}

export const NotesPanel = memo(function NotesPanel({
  className = '',
  highlightNoteId,
  onNoteHighlighted,
  onNotesLoaded,
  onRegisterAddNote,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);

  // Edit and delete state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const initialLoadRef = useRef(false);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();
  const announce = useAnnounce();

  // Pull-to-refresh refresh function ref (set after loadNotes is defined)
  const refreshFnRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const {
    containerRef: pullRefreshRef,
    pullDistance,
    isRefreshing,
    isPulledEnough,
  } = usePullToRefresh({
    onRefresh: () => refreshFnRef.current(),
    enabled: !loading && !loadingMore,
  });

  // Note classifier for intelligent suggestions
  const {
    classification,
    suggestedTags,
    suggestedTemplate,
    templates,
    applyTemplate,
    getIcon,
  } = useNoteClassifier(text);

  // State for showing template picker
  const [showTemplates, setShowTemplates] = useState(false);

  // Handle applying a template
  const handleApplyTemplate = useCallback((templateId: string) => {
    const structure = applyTemplate(templateId);
    if (structure) {
      setText(structure);
      setShowTemplates(false);
      textareaRef.current?.focus();
      showToast('Template applied', 'success');
    }
  }, [applyTemplate, showToast]);

  // Track mounted state and cleanup AbortController on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Abort any in-flight request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, NOTES.SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const trimmed = text.trim();
  const canSubmit = useMemo(
    () => trimmed.length > 0 && trimmed.length <= NOTES.MAX_LENGTH && !saving,
    [trimmed, saving]
  );

  const loadNotes = useCallback(async (loadCursor?: string, append = false) => {
    // Guard against concurrent requests using refs to avoid stale closures
    if (append && loadingMoreRef.current) return;
    if (!append && loadingRef.current) return;

    // Abort any in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Update both ref and state
    if (append) {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      loadingRef.current = true;
      setLoading(true);
    }
    setError(null);

    try {
      const response = await listNotes(loadCursor, NOTES.PAGE_SIZE, controller.signal);

      // Prevent state updates if component unmounted during fetch
      if (!mountedRef.current) return;

      const normalized = response.notes.map(normalizeNote);

      if (append) {
        setNotes(prev => [...prev, ...normalized]);
      } else {
        setNotes(normalized);
      }

      setCursor(response.cursor);
      setHasMore(response.hasMore);
    } catch (err) {
      // Ignore abort errors - they're expected when cancelling
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      // Prevent state updates if component unmounted during fetch
      if (!mountedRef.current) return;

      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to load notes';
      setError(message);
      showToast(message, 'error');
    } finally {
      if (mountedRef.current) {
        loadingRef.current = false;
        loadingMoreRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [showToast]);

  const loadMore = useCallback(async () => {
    if (cursor && !loadingMoreRef.current && hasMore) {
      await loadNotes(cursor, true);
    }
  }, [cursor, hasMore, loadNotes]);

  // Keep loadMoreRef in sync with the latest loadMore function
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Set up pull-to-refresh function
  useEffect(() => {
    refreshFnRef.current = async () => {
      // Clear and reload notes from scratch
      await loadNotes(undefined, false);
    };
  }, [loadNotes]);

  // Stable wrapper function that always calls the latest loadMore
  // This prevents the parent from re-rendering when loadMore changes
  const stableLoadMore = useCallback(async () => {
    await loadMoreRef.current?.();
  }, []);

  // Notify parent when notes change - uses stableLoadMore to prevent flicker
  // Only notify when loading completes (not during loading) to prevent flickering
  useEffect(() => {
    if (!loading) {
      onNotesLoaded?.(notes, hasMore, stableLoadMore);
    }
  }, [notes, hasMore, loading, stableLoadMore, onNotesLoaded]);

  // Register addNote callback for external note creation (mobile voice recording)
  useEffect(() => {
    const addNote = (note: Note) => {
      setNotes((prev) => [note, ...prev]);
    };
    onRegisterAddNote?.(addNote);
  }, [onRegisterAddNote]);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;

    // Create optimistic note
    const optimisticNote: Note = {
      id: `temp-${Date.now()}`,
      text: trimmed,
      tenantId: 'public',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPendingNotes((prev) => [optimisticNote, ...prev]);
    setText('');
    setSaving(true);
    setError(null);

    try {
      const createdNote = await createNote(trimmed);
      // Replace optimistic note with the real one from API (more efficient than reloading all)
      const normalizedNote = normalizeNote(createdNote);
      setPendingNotes([]);
      setNotes((prev) => [normalizedNote, ...prev]);
      showToast('Saved', 'success');
      announce('Note saved successfully');
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to save note';
      setError(message);
      showToast(message, 'error');
      announce(message, 'assertive');
      // Restore text on failure
      setText(optimisticNote.text);
      setPendingNotes([]);
    } finally {
      setSaving(false);
    }
  }, [canSubmit, trimmed, showToast, announce]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate]
  );

  // Handle infinite scroll - use ref for loadingMore to avoid stale closure
  const handleScroll = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || loadingMoreRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    // Load more when within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  }, [loadMore, hasMore]);

  // Handle edit note
  const handleEdit = useCallback((note: Note) => {
    setEditingNote(note);
  }, []);

  const handleEditSave = useCallback(async (id: string, newText: string) => {
    setIsEditSaving(true);
    try {
      const updated = await updateNote(id, newText);
      const normalizedNote = normalizeNote(updated);
      setNotes(prev => prev.map(n => n.id === id ? normalizedNote : n));
      setEditingNote(null);
      showToast('Note updated', 'success');
      announce('Note updated successfully');
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to update note';
      showToast(message, 'error');
      announce(message, 'assertive');
    } finally {
      setIsEditSaving(false);
    }
  }, [showToast, announce]);

  const handleEditClose = useCallback(() => {
    setEditingNote(null);
  }, []);

  // Handle delete note
  const handleDeleteClick = useCallback((note: Note) => {
    setDeleteConfirmNote(note);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmNote) return;

    setIsDeleting(true);
    const noteId = deleteConfirmNote.id;

    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setDeleteConfirmNote(null);
      showToast('Note deleted', 'success');
      announce('Note deleted');
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to delete note';
      showToast(message, 'error');
      announce(message, 'assertive');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmNote, showToast, announce]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmNote(null);
  }, []);

  // Initial load - only runs once on mount
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadNotes();
    }
  }, [loadNotes]);

  // Attach scroll listener
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll to highlighted note when requested
  useEffect(() => {
    if (highlightNoteId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onNoteHighlighted?.();
    }
  }, [highlightNoteId, onNoteHighlighted]);

  // Intelligent search: splits query into terms, matches all terms, ranks by relevance
  const filteredNotes = useMemo(() => {
    const allNotes = [...pendingNotes, ...notes];

    if (!debouncedSearch) {
      return allNotes;
    }

    const queryTerms = debouncedSearch.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (queryTerms.length === 0) {
      return allNotes;
    }

    // Score and filter notes
    const scored = allNotes.map(note => {
      const textLower = note.text.toLowerCase();
      let score = 0;
      let allTermsMatch = true;

      for (const term of queryTerms) {
        if (!textLower.includes(term)) {
          allTermsMatch = false;
          break;
        }
        // Exact word match scores higher
        const wordBoundaryRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordBoundaryRegex.test(note.text)) {
          score += 10;
        } else {
          score += 1; // Partial match
        }
        // Multiple occurrences boost score
        const occurrences = (textLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += Math.min(occurrences - 1, 3); // Cap bonus at 3
      }

      // Boost if query appears as exact phrase
      if (textLower.includes(debouncedSearch.toLowerCase())) {
        score += 20;
      }

      return { note, score, matches: allTermsMatch };
    });

    // Filter to notes that match all terms, then sort by score descending
    return scored
      .filter(s => s.matches)
      .sort((a, b) => b.score - a.score)
      .map(s => s.note);
  }, [pendingNotes, notes, debouncedSearch]);

  // Use deferred value to prevent search filtering from blocking input
  // This allows the UI to remain responsive during expensive filtering
  const deferredFilteredNotes = useDeferredValue(filteredNotes);

  // Group notes by date (Apple Notes style)
  const groupedNotes = useMemo(() => {
    return groupNotesByDate(deferredFilteredNotes);
  }, [deferredFilteredNotes]);

  const isFiltered = debouncedSearch.length > 0;

  return (
    <div className={`panel ${className}`}>
      <div className="panel-body">
        {/* Floating Composer */}
        <div className={`composer ${composerFocused || text ? 'composer-expanded' : ''}`}>
          <div className="composer-wrapper">
            <span id="composer-hint" className="sr-only">
              Press Cmd+Enter or Ctrl+Enter to save
            </span>
            <textarea
              ref={textareaRef}
              className="composer-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Capture a thought..."
              aria-label="Write a note"
              aria-describedby="composer-hint"
              disabled={saving}
            />
            <div className="composer-actions">
              <button
                className="composer-template-btn"
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={saving}
                aria-label="Choose template"
                title="Choose template"
                type="button"
              >
                <FileText size={18} />
              </button>
              <button
                className="composer-send-btn"
                onClick={handleCreate}
                disabled={!canSubmit}
                aria-label="Save note"
                title="Save note"
              >
                {saving ? (
                  <span className="spinner" />
                ) : (
                  <ArrowUp size={18} />
                )}
              </button>
            </div>
          </div>
          {/* Character count and classification hints */}
          {trimmed.length > 0 && (
            <div className="composer-footer">
              <div className="composer-char-count">
                {trimmed.length.toLocaleString()} / {NOTES.MAX_LENGTH.toLocaleString()}
              </div>
              {classification && classification.type !== 'general' && classification.confidence > 0.3 && (
                <div className="composer-classification" title={`Detected as ${classification.type} note`}>
                  <span className="classification-icon">{getIcon(classification.type)}</span>
                </div>
              )}
            </div>
          )}
          {/* Suggested tags */}
          {suggestedTags.length > 0 && composerFocused && (
            <div className="composer-suggestions">
              <Tag size={12} />
              <span className="suggestion-label">Tags:</span>
              {suggestedTags.map(tag => (
                <span key={tag} className="suggested-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Template Picker */}
        {showTemplates && (
          <div className="template-picker">
            <div className="template-picker-header">
              <span>Choose a template</span>
              <button onClick={() => setShowTemplates(false)} className="template-close" aria-label="Close templates">
                <X size={16} />
              </button>
            </div>
            <div className="template-list">
              {templates.map(template => (
                <button
                  key={template.id}
                  className="template-item"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <span className="template-icon">{template.icon}</span>
                  <div className="template-info">
                    <span className="template-name">{template.name}</span>
                    <span className="template-desc">{template.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Template suggestion */}
        {suggestedTemplate && !showTemplates && trimmed.length < 50 && composerFocused && (
          <div className="template-suggestion">
            <FileText size={14} />
            <span>Try the <button className="template-link" onClick={() => handleApplyTemplate(suggestedTemplate.id)}>
              {suggestedTemplate.icon} {suggestedTemplate.name}
            </button> template</span>
          </div>
        )}

        {/* Search */}
        <div className="notes-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notes"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-inline">{error}</div>}

        {/* Scrollable Notes List with Infinite Scroll and Pull-to-Refresh */}
        <div
          className="notes-scroll"
          ref={(el) => {
            scrollRef.current = el;
            (pullRefreshRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
        >
          <PullToRefreshIndicator
            pullDistance={pullDistance}
            isRefreshing={isRefreshing}
            isPulledEnough={isPulledEnough}
          />
          {loading && notes.length === 0 ? (
            <div className="notes-list" role="list" aria-label="Notes list">
              <NoteCardSkeleton count={3} />
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyState type={isFiltered ? 'no-search-results' : 'no-notes'} />
          ) : (
            <>
              {groupedNotes.map(({ group, notes: groupNotes }) => (
                <div key={group} className="notes-group">
                  <div className="notes-group-header">
                    <span className="notes-group-title">{group}</span>
                  </div>
                  <div className="notes-list" role="list" aria-label={`${group} notes`}>
                    {groupNotes.map((note) => (
                      <div
                        key={note.id}
                        ref={note.id === highlightNoteId ? highlightRef : null}
                        role="listitem"
                      >
                        <NoteCard
                          note={note}
                          isPending={note.id.startsWith('temp-')}
                          isHighlighted={note.id === highlightNoteId}
                          searchQuery={debouncedSearch}
                          onEdit={handleEdit}
                          onDelete={handleDeleteClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!isFiltered && loadingMore && (
                <div className="loading-more">
                  <span className="spinner" /> Loading more...
                </div>
              )}
              {!isFiltered && hasMore && !loadingMore && (
                <button
                  className="btn load-more-btn"
                  onClick={loadMore}
                >
                  Load more notes
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Note Modal - key forces remount when note changes to reset state */}
      <EditNoteModal
        key={editingNote?.id}
        note={editingNote}
        isOpen={!!editingNote}
        isSaving={isEditSaving}
        onSave={handleEditSave}
        onClose={handleEditClose}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
});
