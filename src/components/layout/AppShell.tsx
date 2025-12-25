/**
 * Main app layout with header, responsive grid, and mobile tabs.
 * Manages cross-pane communication for note highlighting from chat citations.
 */

import { useState, useCallback, useRef, useMemo, useEffect, memo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, FileText, LogOut, Plus, MessageSquare, Search, User } from 'lucide-react';
import { useAuth, getUserInitials } from '../../auth';
import { useToast } from '../common/useToast';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PanelFallback } from '../common/PanelFallback';
import { NoteDetailDrawer } from '../notes/NoteDetailDrawer';
import { SkipLink } from '../common/SkipLink';
import { OfflineBanner } from '../common/OfflineBanner';
import { CommandPalette, type CommandAction } from '../common/CommandPalette';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { MobileBottomNav } from './MobileBottomNav';
import { createNote } from '../../lib/api';
import { normalizeNote } from '../../lib/format';
import type { Note } from '../../lib/types';

// Lazy load panels for better initial bundle size and code splitting
const NotesPanel = lazy(() => import('../notes/NotesPanel').then(m => ({ default: m.NotesPanel })));
const ChatPanel = lazy(() => import('../chat/ChatPanel').then(m => ({ default: m.ChatPanel })));

type Tab = 'notes' | 'chat';

const MAX_SEARCH_PAGES = 10;

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [highlightNoteId, setHighlightNoteId] = useState<string | null>(null);
  const [drawerNote, setDrawerNote] = useState<Note | null>(null);
  const [drawerHighlight, setDrawerHighlight] = useState<string | undefined>();
  const [searchingForNote, setSearchingForNote] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 60, right: 16 });
  const { showToast } = useToast();
  const { user, signOut } = useAuth();
  const commandPalette = useCommandPalette();

  // Store notes state from NotesPanel for lookup
  const notesRef = useRef<Note[]>([]);
  const hasMoreRef = useRef<boolean>(false);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  // Ref to focus notes composer
  const notesComposerRef = useRef<HTMLTextAreaElement | null>(null);
  // Ref for profile avatar button for dropdown positioning
  const profileAvatarRef = useRef<HTMLButtonElement | null>(null);
  // Ref for adding notes from mobile voice recording
  const addNoteToListRef = useRef<((note: Note) => void) | null>(null);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch {
      showToast('Failed to sign out', 'error');
    }
  }, [signOut, showToast]);

  // Handle creating a voice note from mobile recording button
  const handleCreateVoiceNote = useCallback(async (text: string) => {
    const rawNote = await createNote(text);
    const normalizedNote = normalizeNote(rawNote);
    // Add to notes list immediately
    addNoteToListRef.current?.(normalizedNote);
    // Switch to notes tab to show the new note
    setActiveTab('notes');
  }, []);

  // Command palette actions
  const commandActions: CommandAction[] = useMemo(() => [
    {
      id: 'new-note',
      label: 'New Note',
      description: 'Create a new note',
      icon: <Plus size={16} />,
      shortcut: '⌘N',
      keywords: ['create', 'add', 'write'],
      action: () => {
        setActiveTab('notes');
        // Focus the composer after tab switch
        setTimeout(() => notesComposerRef.current?.focus(), 100);
      },
    },
    {
      id: 'go-notes',
      label: 'Go to Notes',
      description: 'Switch to notes panel',
      icon: <FileText size={16} />,
      keywords: ['switch', 'view', 'list'],
      action: () => setActiveTab('notes'),
    },
    {
      id: 'go-chat',
      label: 'Go to Chat',
      description: 'Switch to Aurora AI chat',
      icon: <MessageSquare size={16} />,
      keywords: ['ai', 'ask', 'aurora', 'assistant'],
      action: () => setActiveTab('chat'),
    },
    {
      id: 'search-notes',
      label: 'Search Notes',
      description: 'Search through your notes',
      icon: <Search size={16} />,
      shortcut: '⌘F',
      keywords: ['find', 'lookup'],
      action: () => {
        setActiveTab('notes');
        // The search input will be focused by the NotesPanel
      },
    },
    {
      id: 'sign-out',
      label: 'Sign Out',
      description: 'Sign out of your account',
      icon: <LogOut size={16} />,
      keywords: ['logout', 'exit'],
      action: handleSignOut,
    },
  ], [handleSignOut]);

  // Handle notes loaded from NotesPanel
  const handleNotesLoaded = useCallback((notes: Note[], hasMore: boolean, loadMore: () => Promise<void>) => {
    notesRef.current = notes;
    hasMoreRef.current = hasMore;
    loadMoreRef.current = loadMore;
  }, []);

  // Handle opening a note from chat citation with bounded search
  const handleOpenNote = useCallback(async (noteId: string, snippet?: string) => {
    // Switch to notes tab
    setActiveTab('notes');
    setDrawerHighlight(snippet);

    // Check if note is already loaded
    let foundNote = notesRef.current.find(n => n.id === noteId);

    if (foundNote) {
      // Note is loaded - highlight it and show drawer with full content
      setDrawerNote(foundNote);
      setHighlightNoteId(noteId);
      return;
    }

    // Note not loaded - show drawer with snippet as placeholder
    const tempNote: Note = {
      id: noteId,
      text: snippet || 'Loading note content...',
      tenantId: 'public',
      createdAt: null,
      updatedAt: null,
    };
    setDrawerNote(tempNote);

    // Try to load more pages to find the note (bounded search)
    if (hasMoreRef.current && loadMoreRef.current) {
      setSearchingForNote(true);
      let pagesSearched = 0;

      while (pagesSearched < MAX_SEARCH_PAGES && hasMoreRef.current) {
        try {
          await loadMoreRef.current();
          pagesSearched++;

          // Check if we found the note
          foundNote = notesRef.current.find(n => n.id === noteId);
          if (foundNote) {
            setDrawerNote(foundNote);
            setHighlightNoteId(noteId);
            setSearchingForNote(false);
            return;
          }
        } catch {
          // Stop searching on error
          break;
        }
      }

      setSearchingForNote(false);

      // Still not found after max pages
      if (!foundNote) {
        showToast('Note not found in loaded pages. Showing snippet only.', 'info');
      }
    }
  }, [showToast]);

  const handleNoteHighlighted = useCallback(() => {
    setTimeout(() => setHighlightNoteId(null), 2500);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerNote(null);
    setDrawerHighlight(undefined);
  }, []);

  return (
    <div className="app-shell">
      <SkipLink targetId="main-content" />
      <OfflineBanner />
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          {/* Left: App Icon */}
          <div className="app-title">
            <img src="/favicon.svg" alt="NotesGPT" className="app-icon" />
          </div>

          {/* Center: Tab Toggle - Segmented Control with sliding indicator */}
          <div
            className={`header-tabs ${activeTab === 'chat' ? 'chat-active' : ''}`}
            role="tablist"
            aria-label="View switcher"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'notes'}
              className={activeTab === 'notes' ? 'active' : ''}
              onClick={() => setActiveTab('notes')}
              aria-label="Notes view"
            >
              <FileText size={15} aria-hidden="true" />
              <span>Notes</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
              aria-label="Chat view"
            >
              <Sparkles size={15} aria-hidden="true" />
              <span>Chat</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="header-actions">
            <div className="profile-menu-container">
              <button
                ref={profileAvatarRef}
                className="profile-avatar"
                onClick={() => {
                  if (profileAvatarRef.current) {
                    const rect = profileAvatarRef.current.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 12,
                      right: window.innerWidth - rect.right,
                    });
                  }
                  setShowProfileMenu(!showProfileMenu);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (profileAvatarRef.current) {
                      const rect = profileAvatarRef.current.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom + 12,
                        right: window.innerWidth - rect.right,
                      });
                    }
                    setShowProfileMenu(true);
                  }
                }}
                title={user?.displayName || user?.email || user?.phoneNumber || 'Account'}
                aria-label="Account menu"
                aria-expanded={showProfileMenu}
                aria-haspopup="menu"
                aria-controls="profile-dropdown-menu"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="profile-avatar-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="profile-avatar-initials">
                    {getUserInitials(user)}
                  </span>
                )}
              </button>

              {showProfileMenu && createPortal(
                <ProfileDropdownMenu
                  user={user}
                  position={menuPosition}
                  onSignOut={handleSignOut}
                  onClose={() => setShowProfileMenu(false)}
                />,
                document.body
              )}
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <main id="main-content" className="main-grid" tabIndex={-1}>
          <ErrorBoundary fallback={<PanelFallback title="Notes" onRetry={() => window.location.reload()} />}>
            <Suspense fallback={<PanelFallback title="Notes" />}>
              <NotesPanel
                className={activeTab !== 'notes' ? 'hidden' : ''}
                highlightNoteId={highlightNoteId}
                onNoteHighlighted={handleNoteHighlighted}
                onNotesLoaded={handleNotesLoaded}
                onRegisterAddNote={(addNote) => { addNoteToListRef.current = addNote; }}
              />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<PanelFallback title="Chat" onRetry={() => window.location.reload()} />}>
            <Suspense fallback={<PanelFallback title="Chat" />}>
              <ChatPanel
                className={activeTab !== 'chat' ? 'hidden' : ''}
                onOpenNote={handleOpenNote}
              />
            </Suspense>
          </ErrorBoundary>
        </main>

        <SearchingOverlay visible={searchingForNote} />

        <NoteDetailDrawer
          note={drawerNote}
          onClose={handleCloseDrawer}
          {...(drawerHighlight && { highlightText: drawerHighlight })}
        />

        <CommandPalette
          isOpen={commandPalette.isOpen}
          onClose={commandPalette.close}
          actions={commandActions}
          recentActionIds={commandPalette.recentActionIds}
          onActionExecuted={commandPalette.trackAction}
        />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreateNote={handleCreateVoiceNote}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/** Profile dropdown menu with keyboard navigation */
interface ProfileDropdownMenuProps {
  user: ReturnType<typeof useAuth>['user'];
  position: { top: number; right: number };
  onSignOut: () => void;
  onClose: () => void;
}

const ProfileDropdownMenu = memo(function ProfileDropdownMenu({
  user,
  position,
  onSignOut,
  onClose,
}: ProfileDropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const signOutRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && !e.shiftKey) {
        // Trap focus within menu - if on sign out, close menu
        if (document.activeElement === signOutRef.current) {
          e.preventDefault();
          onClose();
        }
      }
    };

    // Focus first interactive element
    signOutRef.current?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  return (
    <>
      <div
        className="profile-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={menuRef}
        id="profile-dropdown-menu"
        className="profile-menu"
        role="menu"
        aria-label="Account options"
        style={{
          top: position.top,
          right: position.right,
        }}
      >
        <div className="profile-menu-header">
          <div className="profile-menu-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="profile-menu-info">
            <span className="profile-menu-name">
              {user?.displayName || 'User'}
            </span>
            <span className="profile-menu-email">
              {user?.email || user?.phoneNumber || ''}
            </span>
          </div>
        </div>
        <div className="profile-menu-divider" />
        <button
          ref={signOutRef}
          className="profile-menu-item danger"
          onClick={onSignOut}
          role="menuitem"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
});

/** Loading overlay when searching for a note */
const SearchingOverlay = memo(function SearchingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="searching-note-overlay">
      <div className="searching-note-content">
        <span className="spinner" />
        <span>Finding note...</span>
      </div>
    </div>
  );
});
