# AuroraNotes

AI-powered note-taking app with conversational RAG (Retrieval-Augmented Generation). Users write notes and chat with an AI that has full context of their notes.

## Architecture Overview

### Frontend (This Repo)
```
React 19 + TypeScript + Vite + Tailwind CSS 4
├── src/
│   ├── App.tsx              # Root: ErrorBoundary → Toast → LiveRegion → Auth → AppShell
│   ├── auth/                # Firebase Auth (Google, Phone)
│   │   ├── AuthProvider.tsx # Context provider with auth state
│   │   └── useAuth.ts       # Hook: user, loading, getToken(), signIn/Out
│   ├── components/
│   │   ├── layout/AppShell  # Main layout: NotesPanel (left) + ChatPanel (right)
│   │   ├── notes/           # NoteCard, NotesPanel, EditNoteModal, NoteDetailDrawer
│   │   ├── chat/            # ChatPanel, ChatMessage, ChatMarkdown, SourcesPanel
│   │   ├── auth/            # LandingPage, AuthenticatedApp
│   │   └── common/          # Toast, ErrorBoundary, ConfirmDialog, CommandPalette
│   ├── hooks/               # useChat, useFileUpload, useSpeechToText, etc.
│   └── lib/
│       ├── api.ts           # REST client: getNotes, createNote, updateNote, deleteNote, chat
│       ├── firebase.ts      # Firebase init, auth methods, token management
│       └── types.ts         # Note, ChatMessage, Source interfaces
```

### Backend (Cloud Run - Separate Repo)
```
Express + TypeScript + Firestore + Vertex AI
├── Endpoints: POST /notes, GET /notes, PATCH /notes/:id, DELETE /notes/:id, POST /chat
├── RAG Pipeline: Query Analysis → Vector Search → Rank Fusion → Reranking → LLM Generation
├── Data: Firestore (notes, chunks with embeddings), Vertex AI Vector Search
└── Auth: Firebase ID tokens, per-user data isolation (tenantId = user.uid)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19, Vite 7 |
| Styling | Tailwind CSS 4 |
| Auth | Firebase Authentication (Google, Phone) |
| State | React hooks (no Redux) |
| Icons | Lucide React |
| Markdown | react-markdown |
| Testing | Vitest, Testing Library |
| Backend | Express, Firestore, Vertex AI, Gemini 2.0 Flash |

## Environment Variables

Create `.env.local`:
```bash
# API
VITE_API_BASE=https://your-backend-url.run.app

# Firebase (required)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

# Optional (development)
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099
```

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run dev:emulator # Dev with Firebase Auth Emulator
npm run emulators    # Start Firebase emulators
npm run build        # Production build (dist/)
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # TypeScript check
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
```

## Key Data Types

```typescript
interface Note {
  id: string;
  title?: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
}

interface Source {
  id: string;        // Citation marker [1], [2]
  noteId: string;    // For navigation
  preview: string;   // Text snippet
  date: string;      // Human-readable
  relevance: number; // 0-1
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes?limit=20&cursor=x` | Paginated notes list |
| POST | `/notes` | Create note `{text, title?}` |
| PATCH | `/notes/:id` | Update note |
| DELETE | `/notes/:id` | Delete note + chunks |
| POST | `/chat` | Chat with notes context `{message, history?}` |

All endpoints require `Authorization: Bearer <firebase-id-token>`.

## File Structure Quick Ref

```
src/
├── components/layout/AppShell.tsx    # Main 2-panel layout
├── components/notes/NotesPanel.tsx   # Left panel: notes list + editor
├── components/chat/ChatPanel.tsx     # Right panel: chat interface
├── hooks/useChat.ts                  # Chat state + streaming SSE
├── lib/api.ts                        # All API calls
├── lib/firebase.ts                   # Firebase config + auth
└── auth/AuthProvider.tsx             # Auth context
```

## Development Notes

- **Auth Flow**: Firebase ID tokens sent via `Authorization` header on every API call
- **Streaming**: Chat uses SSE (Server-Sent Events) for real-time token streaming
- **Citations**: AI responses include `[1]`, `[2]` markers linked to `sources[]`
- **Offline**: `useOnlineStatus` hook + `OfflineBanner` component
- **Accessibility**: LiveRegion for announcements, SkipLink, focus management

## Changelog

### 2025-12-22
- **README**: Optimized for AI agent handoff with architecture, env vars, commands, types
- **package.json**: Added version 1.0.0, description, `lint:fix`, `typecheck` scripts
- **index.html**: Fixed branding (NotesGPT → AuroraNotes in OG/Twitter meta)
- **eslint.config.js**: Added stricter rules (no-unused-vars, consistent-type-imports, no-console)
- **.gitignore**: Reorganized, added export file patterns
- **Cleanup**: Removed export scripts and txt files (code-review artifacts)
- **Bug fixes**: Fixed React hooks violations in AppShell, FileAttachment, useNoteClassifier
