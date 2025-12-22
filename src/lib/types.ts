/**
 * Shared types for AuroraNotes
 * Types aligned with API specification (2024-12 version)
 */

/** Firestore timestamp shape when serialized from backend */
export type FirestoreTs = { _seconds: number; _nanoseconds?: number };

/** Raw timestamp value that can come from API */
export type RawTimestamp = string | FirestoreTs | undefined | null;

/** Processing status for notes */
export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

/** Note as returned from API (with raw timestamps) */
export interface RawNote {
  id: string;
  title?: string;                        // Optional title
  text: string;
  tenantId: string;
  processingStatus?: ProcessingStatus;   // Chunk processing status
  tags?: string[];                       // Optional tags
  metadata?: Record<string, unknown>;    // Optional metadata
  createdAt: string;                     // ISO 8601 timestamp
  updatedAt: string;                     // ISO 8601 timestamp
}

/** Normalized note with JS Date objects */
export interface Note {
  id: string;
  title?: string;
  text: string;
  tenantId: string;
  processingStatus?: ProcessingStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Request body for creating a note */
export interface CreateNoteRequest {
  text: string;
  // Note: tenantId is derived from authenticated user on backend
}

/** Request body for chat */
export interface ChatRequest {
  message: string;
  stream?: boolean;
  // Note: tenantId is derived from authenticated user on backend
}

/** Paginated notes list response from API */
export interface NotesListResponse {
  notes: RawNote[];
  cursor: string | null;
  hasMore: boolean;
}

/** Rate limit information from API headers */
export interface RateLimitInfo {
  limit: number;        // Max requests per window
  remaining: number;    // Requests remaining in current window
  resetSeconds: number; // Seconds until window resets
}

// ============================================
// Chat Types (Updated for new API spec)
// ============================================

/** Source in chat response - maps citation markers to source details */
export interface Source {
  id: string;        // "1", "2", etc. - matches [1], [2] in answer
  noteId: string;    // For deep-linking to the original note
  preview: string;   // ~120 char preview of the source
  date: string;      // Human-readable: "Dec 15, 2024"
  relevance: number; // 0-1 confidence score
}

/** Query intent classification - matches backend QueryIntent */
export type QueryIntent = 'summarize' | 'list' | 'decision' | 'action_item' | 'search' | 'question';

/** Confidence level for chat responses */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

/** Enhanced confidence breakdown from API */
export interface EnhancedConfidence {
  overall: number;           // 0-1 overall confidence score
  level: ConfidenceLevel;    // high, medium, low
  isReliable: boolean;       // Whether answer should be trusted
  breakdown?: {
    citationDensity?: number;
    sourceRelevance?: number;
    answerCoherence?: number;
    claimSupport?: number;
  };
}

/** Action result data from agentic actions */
export interface ActionData {
  createdNote?: { id: string; title?: string; text: string };
  reminder?: { id: string; text: string; dueAt: string };
  searchResults?: Array<{ noteId: string; preview: string; date: string }>;
  summary?: string;
  actionItems?: Array<{ text: string; source: string; status?: string }>;
  mentions?: Array<{ noteId: string; context: string; date: string }>;
}

/** Action metadata in chat response */
export interface ActionMeta {
  type: 'create_note' | 'set_reminder' | 'search_notes' | 'summarize_period' | 'list_action_items' | 'find_mentions';
  success: boolean;
  data?: ActionData;
}

/** Chat response metadata */
export interface ChatMeta {
  model: string;
  requestId?: string;
  responseTimeMs: number;
  intent: QueryIntent;
  confidence: ConfidenceLevel;
  sourceCount: number;
  action?: ActionMeta;  // Present when an agentic action was executed
  debug?: {
    strategy: string;
    candidateCount?: number;
    rerankCount?: number;
    enhancedConfidence?: EnhancedConfidence;
  };
}

/** Chat response from API (new format) */
export interface ChatResponse {
  answer: string;      // Contains [1], [2] citation markers
  sources: Source[];   // Maps citation markers to source details (cited in answer)
  contextSources?: Source[]; // All relevant sources used as context (may not be cited)
  meta: ChatMeta;
  /** @deprecated Use sources instead */
  citations?: Citation[];
}

/** @deprecated Legacy citation format - use Source instead */
export interface Citation {
  cid: string;          // e.g., "N1", "N2"
  noteId: string;
  chunkId: string;
  createdAt: string;    // ISO string
  snippet: string;
  score: number;
}



/** Chat message for UI state */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  contextSources?: Source[]; // All relevant sources used as context (may not be cited)
  meta?: ChatMeta;
  action?: ActionMeta;  // Present when this message was an agentic action response
  isError?: boolean;
  errorCode?: number;
  isStreaming?: boolean;
  /** @deprecated Use sources instead */
  citations?: Citation[];
}

// ============================================
// Streaming Types
// ============================================

/** Stream event types from SSE */
export type StreamEventType = 'sources' | 'token' | 'done' | 'error';

/** Source event in streaming (without relevance) */
export type StreamSource = Omit<Source, 'relevance'>;

/** Stream event from SSE */
export interface StreamEvent {
  type: StreamEventType;
  content?: string;              // For 'token' events
  sources?: StreamSource[];      // For 'sources' event
  meta?: ChatMeta;               // For 'done' event
  error?: string;                // For 'error' event
}

// ============================================
// Feedback Types
// ============================================

/** Feedback rating options */
export type FeedbackRating = 'up' | 'down';

/** Request body for submitting feedback */
export interface FeedbackRequest {
  requestId: string;         // Required. From chat response meta.requestId
  rating: FeedbackRating;    // Required.
  comment?: string;          // Optional. Max 1000 chars.
  // Note: tenantId is derived from authenticated user on backend
}

/** Feedback response */
export interface FeedbackResponse {
  status: 'recorded';
  requestId: string;
}

// ============================================
// Other Types
// ============================================

/** Health check response */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp?: string;
  service?: string;
  project?: string;
  version?: string;
}

/** API error response - matches backend format */
export interface ApiError {
  error: string | { code: string; message: string; details?: Record<string, unknown> };
  code?: string;
  retryAfter?: number;       // Seconds until retry allowed (for 429 responses)
  retryAfterMs?: number;     // Milliseconds until retry (alternative format)
}

/** Enhanced API response with metadata */
export interface ApiResponse<T> {
  data: T;
  requestId: string | null;
  rateLimit: RateLimitInfo | null;
}

// ============================================
// Transcription Types
// ============================================

/** Transcription response from API */
export interface TranscriptionResponse {
  text: string;
  processingTimeMs: number;
  model: string;
  estimatedDurationSeconds?: number;
}

