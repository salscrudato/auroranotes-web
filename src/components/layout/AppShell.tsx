/**
 * AppShell component
 * Main layout with header, responsive grid, and mobile tabs
 * Manages cross-pane communication for note highlighting from chat citations
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { Sparkles, FileText, LogOut, Plus, MessageSquare, Search } from 'lucide-react';
import { useAuth, getUserInitials } from '../../auth';
import { useToast } from '../common/useToast';
import { NotesPanel } from '../notes/NotesPanel';
import { ChatPanel } from '../chat/ChatPanel';
import { NoteDetailDrawer } from '../notes/NoteDetailDrawer';
import { SkipLink } from '../common/SkipLink';
import { CommandPalette, type CommandAction } from '../common/CommandPalette';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import type { Note } from '../../lib/types';

type Tab = 'notes' | 'chat';

// Maximum pages to search when looking for a note
const MAX_SEARCH_PAGES = 10;

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [highlightNoteId, setHighlightNoteId] = useState<string | null>(null);
  const [drawerNote, setDrawerNote] = useState<Note | null>(null);
  const [drawerHighlight, setDrawerHighlight] = useState<string | undefined>();
  const [searchingForNote, setSearchingForNote] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { showToast } = useToast();
  const { user, signOut } = useAuth();
  const commandPalette = useCommandPalette();

  // Store notes state from NotesPanel for lookup
  const notesRef = useRef<Note[]>([]);
  const hasMoreRef = useRef<boolean>(false);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  // Ref to focus notes composer
  const notesComposerRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch {
      showToast('Failed to sign out', 'error');
    }
  }, [signOut, showToast]);

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
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="app-title">
            <div className="app-logo">
              <Sparkles size={18} />
            </div>
            <h1>Aurora</h1>
            <span className="tagline">Intelligent notes</span>
          </div>

          <div className="header-actions">
            <div className="profile-menu-container">
              <button
                className="profile-avatar"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title={user?.displayName || user?.email || 'Account'}
                aria-label="Account menu"
                aria-expanded={showProfileMenu}
                aria-haspopup="true"
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

              {showProfileMenu && (
                <>
                  <div
                    className="profile-menu-backdrop"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="profile-menu" role="menu">
                    <div className="profile-menu-header">
                      <span className="profile-menu-name">
                        {user?.displayName || 'User'}
                      </span>
                      <span className="profile-menu-email">
                        {user?.email || user?.phoneNumber || ''}
                      </span>
                    </div>
                    <button
                      className="profile-menu-item"
                      onClick={handleSignOut}
                      role="menuitem"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Tabs */}
        <div className="mobile-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'notes'}
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            <FileText size={16} />
            Notes
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'chat'}
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            <Sparkles size={16} />
            Ask AI
          </button>
        </div>

        {/* Main Grid */}
        <main id="main-content" className="main-grid" tabIndex={-1}>
          <NotesPanel
            className={activeTab !== 'notes' ? 'hidden' : ''}
            highlightNoteId={highlightNoteId}
            onNoteHighlighted={handleNoteHighlighted}
            onNotesLoaded={handleNotesLoaded}
          />
          <ChatPanel
            className={activeTab !== 'chat' ? 'hidden' : ''}
            onOpenNote={handleOpenNote}
          />
        </main>

        {/* Loading overlay when searching for note */}
        {searchingForNote && (
          <div className="searching-note-overlay">
            <div className="searching-note-content">
              <span className="spinner" />
              <span>Finding note...</span>
            </div>
          </div>
        )}

        <NoteDetailDrawer
          note={drawerNote}
          onClose={handleCloseDrawer}
          highlightText={drawerHighlight}
        />

        {/* Command Palette (Cmd/Ctrl+K) */}
        <CommandPalette
          isOpen={commandPalette.isOpen}
          onClose={commandPalette.close}
          actions={commandActions}
        />
      </div>
    </div>
  );
}

