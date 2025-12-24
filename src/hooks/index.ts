/**
 * Custom hooks index
 * Re-exports all custom hooks for convenient imports
 */

export { useChat, type ChatLoadingState } from './useChat';
export { useCommandPalette } from './useCommandPalette';
export { useFocusTrap } from './useFocusTrap';
export { useNoteClassifier, type NoteClassification, type NoteType, type NoteTemplate } from './useNoteClassifier';
export { useOnlineStatus } from './useOnlineStatus';
export { useSpeechToText, type RecordingState, type UseSpeechToTextOptions, type UseSpeechToTextReturn } from './useSpeechToText';
export { useTouchGestures } from './useTouchGestures';

// TanStack Query hooks
export {
  useNotesInfinite,
  useNote,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from './useNotes';

export {
  useThreadsList,
  useThread,
  useThreadMutations,
} from './useThreads';

export {
  useTags,
  extractTagsFromNotes,
} from './useTags';

export { useSavedViews } from './useSavedViews';
export { usePinnedNotes } from './usePinnedNotes';
export { useChatFilters } from './useChatFilters';

// Real-time sync
export { useRealtimeSync } from './useRealtimeSync';
