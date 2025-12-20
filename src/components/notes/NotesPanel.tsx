/**
 * NotesPanel component
 * Sticky composer, scrollable notes list, keyboard shortcuts, optimistic updates
 * Now with cursor-based pagination for 100k+ notes support
 * Includes search and quick filters (Today/This week/All)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FileText, Search, ArrowUp } from 'lucide-react';
import type { Note } from '../../lib/types';
import { normalizeNote } from '../../lib/format';
import { listNotes, createNote, deleteNote, updateNote, ApiRequestError } from '../../lib/api';
import { useToast } from '../common/useToast';
import { NoteCard } from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EditNoteModal } from './EditNoteModal';
import { EmptyState } from '../common/EmptyState';

const MAX_NOTE_LENGTH = 5000;
const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

type FilterType = 'all' | 'today' | 'week';

interface NotesPanelProps {
  className?: string;
  highlightNoteId?: string | null;
  onNoteHighlighted?: () => void;
  onNotesLoaded?: (notes: Note[], hasMore: boolean, loadMore: () => Promise<void>) => void;
}

export function NotesPanel({ className = '', highlightNoteId, onNoteHighlighted, onNotesLoaded }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
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
  const { showToast } = useToast();

  // Track mounted state for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const trimmed = text.trim();
  const canSubmit = useMemo(
    () => trimmed.length > 0 && trimmed.length <= MAX_NOTE_LENGTH && !saving,
    [trimmed, saving]
  );

  const loadNotes = useCallback(async (loadCursor?: string, append = false) => {
    // Guard against concurrent requests using refs to avoid stale closures
    if (append && loadingMoreRef.current) return;
    if (!append && loadingRef.current) return;

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
      const response = await listNotes(loadCursor, PAGE_SIZE);

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
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to save note';
      setError(message);
      showToast(message, 'error');
      // Restore text on failure
      setText(optimisticNote.text);
      setPendingNotes([]);
    } finally {
      setSaving(false);
    }
  }, [canSubmit, trimmed, showToast]);

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
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to update note';
      showToast(message, 'error');
    } finally {
      setIsEditSaving(false);
    }
  }, [showToast]);

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
    } catch (err) {
      const message = err instanceof ApiRequestError
        ? err.getUserMessage()
        : err instanceof Error ? err.message : 'Failed to delete note';
      showToast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmNote, showToast]);

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

  // Filter notes client-side
  const filteredNotes = useMemo(() => {
    const allNotes = [...pendingNotes, ...notes];

    let result = allNotes;

    // Apply time filter
    if (activeFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      result = result.filter(note => {
        if (!note.createdAt) return false;
        if (activeFilter === 'today') {
          return note.createdAt >= startOfDay;
        }
        if (activeFilter === 'week') {
          return note.createdAt >= startOfWeek;
        }
        return true;
      });
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(note =>
        note.text.toLowerCase().includes(query)
      );
    }

    return result;
  }, [pendingNotes, notes, activeFilter, debouncedSearch]);

  const totalLoaded = notes.length;
  const isFiltered = activeFilter !== 'all' || debouncedSearch.length > 0;

  return (
    <div className={`panel ${className}`}>
      <div className="panel-header">
        <h2>
          <FileText size={16} />
          Your Notes
        </h2>
        <div className="text-muted text-xs">
          {loading ? (
            <span className="spinner" />
          ) : isFiltered ? (
            <>{filteredNotes.length} found</>
          ) : (
            <>
              {totalLoaded.toLocaleString()}{hasMore && '+'} notes
            </>
          )}
        </div>
      </div>

      <div className="panel-body">
        {/* Floating Composer */}
        <div className={`composer ${composerFocused || text ? 'composer-expanded' : ''}`}>
          <div className="composer-wrapper">
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
              disabled={saving}
            />
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
          {trimmed.length > 0 && (
            <div className="composer-char-count">
              {trimmed.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}
            </div>
          )}
        </div>

        {/* Search and Filters */}
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
          <div className="filter-tabs">
            {(['all', 'today', 'week'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'All' : filter === 'today' ? 'Today' : 'Week'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-inline">{error}</div>}

        {/* Scrollable Notes List with Infinite Scroll */}
        <div className="notes-scroll" ref={scrollRef}>
          <div className="notes-list" role="list" aria-label="Notes list">
            {loading && notes.length === 0 ? (
              <NoteCardSkeleton count={3} />
            ) : filteredNotes.length === 0 ? (
              <EmptyState type={isFiltered ? 'no-search-results' : 'no-notes'} />
            ) : (
              <>
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    ref={note.id === highlightNoteId ? highlightRef : null}
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
}

