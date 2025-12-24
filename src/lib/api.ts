/**
 * API client wrapper for AuroraNotes backend
 * Optimized for the AuroraNotes API specification with:
 * - Firebase Auth token injection via Authorization header
 * - Rate limit header parsing
 * - X-Request-Id capture for debugging
 * - Client-side validation
 * - Exponential backoff with retry
 *
 * Backend derives tenantId from the authenticated user's Firebase UID.
 */

import type {
  RawNote,
  HealthResponse,
  ApiError,
  NotesListResponse,
  ChatResponse,
  RateLimitInfo,
  StreamSource,
  StreamEvent,
  ChatMeta,
  ContextSource,
  FeedbackRating,
  FeedbackResponse,
  TranscriptionResponse,
  Thread,
  ThreadDetail,
  ThreadsListResponse,
  TagsListResponse,
  ChatFilters,
  SearchResult,
  AdvancedSearchRequest,
} from './types';
import { API, NOTES, CHAT } from './constants';

// ============================================
// Configuration
// ============================================

/** Token getter function - set via setTokenGetter() */
type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

/** Callback for 401 errors - triggers sign out */
type UnauthorizedCallback = () => void;
let onUnauthorized: UnauthorizedCallback | null = null;

function getApiBase(): string {
  return (import.meta.env['VITE_API_BASE'] as string) || '';
}

/**
 * Set the token getter function for authentication
 * This should be called once at app initialization with the auth provider's getToken function
 */
export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

/**
 * Set the callback for 401 unauthorized errors
 * This should be called once at app initialization to handle session expiry
 */
export function setUnauthorizedCallback(callback: UnauthorizedCallback): void {
  onUnauthorized = callback;
}

/**
 * Get authorization headers with Bearer token
 * Returns headers with Content-Type and Authorization (if token available)
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('[API] tokenGetter returned null - user may not be authenticated');
      }
    } catch (err) {
      console.error('[API] Failed to get auth token:', err);
      // Continue without token - API will return 401 if auth is required
    }
  } else {
    console.warn('[API] No tokenGetter set - API calls will be unauthenticated');
  }

  return headers;
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate note text before sending to API
 */
export function validateNoteText(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, error: 'Note text is required' };
  }
  if (trimmed.length > NOTES.MAX_LENGTH) {
    return { valid: false, error: `Note text too long (max ${NOTES.MAX_LENGTH} characters)` };
  }
  return { valid: true };
}

/**
 * Validate chat message before sending to API
 */
export function validateChatMessage(message: string): { valid: boolean; error?: string } {
  const trimmed = message.trim();
  if (!trimmed) {
    return { valid: false, error: 'Message is required' };
  }
  if (trimmed.length > CHAT.MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long (max ${CHAT.MAX_MESSAGE_LENGTH} characters)` };
  }
  return { valid: true };
}

// ============================================
// Error Handling
// ============================================

/**
 * Extract error message and code from API error response
 * Handles both string and object formats from backend
 */
function extractErrorInfo(
  body: ApiError | null,
  fallbackMessage: string
): { message: string; code?: string } {
  if (!body?.error) {
    return { message: fallbackMessage };
  }

  if (typeof body.error === 'string') {
    const result: { message: string; code?: string } = { message: body.error };
    if (body.code) result.code = body.code;
    return result;
  }

  if (typeof body.error === 'object' && body.error.message) {
    const result: { message: string; code?: string } = { message: body.error.message };
    const code = body.code || body.error.code;
    if (code) result.code = code;
    return result;
  }

  const result: { message: string; code?: string } = { message: fallbackMessage };
  if (body.code) result.code = body.code;
  return result;
}

/**
 * Custom error class for API errors with enhanced metadata
 */
export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
  requestId?: string;

  constructor(
    message: string,
    status?: number,
    code?: string,
    retryAfterSeconds?: number,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiRequestError';
    if (status !== undefined) this.status = status;
    if (code !== undefined) this.code = code;
    if (retryAfterSeconds !== undefined) this.retryAfterSeconds = retryAfterSeconds;
    if (requestId !== undefined) this.requestId = requestId;
  }

  /**
   * Get user-friendly error message based on status code
   */
  getUserMessage(): string {
    switch (this.status) {
      case 400:
        return this.message || 'Invalid request. Please check your input.';
      case 401:
      case 403:
        return 'Authentication error. Please check your API key configuration.';
      case 429:
        return `Too many requests. Please wait ${this.retryAfterSeconds || 30} seconds.`;
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 500:
      default:
        if (this.status && this.status >= 500) {
          return 'The server is experiencing issues. Please try again in a few moments.';
        }
        return this.message || 'An unexpected error occurred.';
    }
  }
}

// ============================================
// Rate Limit Handling
// ============================================

/** Last known rate limit info from API */
let lastRateLimitInfo: RateLimitInfo | null = null;

/**
 * Get the last known rate limit info
 */
export function getRateLimitInfo(): RateLimitInfo | null {
  return lastRateLimitInfo;
}

/**
 * Parse rate limit headers from response
 */
function parseRateLimitHeaders(res: Response): RateLimitInfo | null {
  const limit = res.headers.get('X-RateLimit-Limit');
  const remaining = res.headers.get('X-RateLimit-Remaining');
  const reset = res.headers.get('X-RateLimit-Reset');

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      resetSeconds: parseInt(reset, 10),
    };
  }
  return null;
}

/**
 * Get X-Request-Id from response for debugging
 */
function getRequestId(res: Response): string | null {
  return res.headers.get('X-Request-Id');
}

// ============================================
// Request Helpers
// ============================================

/**
 * Safe JSON parsing
 */
async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Make a single API request attempt
 */
async function singleRequest<T>(
  path: string,
  options: RequestInit,
  timeout: number,
  apiBase: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse and store rate limit info
    const rateLimitInfo = parseRateLimitHeaders(res);
    if (rateLimitInfo) {
      lastRateLimitInfo = rateLimitInfo;
    }

    // Get request ID for debugging
    const requestId = getRequestId(res);

    if (!res.ok) {
      const body = await safeJson<ApiError>(res);
      const { message, code } = extractErrorInfo(body, `Request failed: ${res.status}`);

      // For 429, get retryAfter from body (in seconds per API spec)
      const retryAfterSeconds = body?.retryAfter ?? (res.status === 429 ? 30 : undefined);

      const error = new ApiRequestError(
        message,
        res.status,
        code,
        retryAfterSeconds,
        requestId ?? undefined
      );

      // Log error with request ID for debugging
      if (requestId) {
        console.error(`API Error [${requestId}]:`, body);
      }

      // Handle 401 unauthorized - trigger sign out
      if (res.status === 401 && onUnauthorized) {
        console.warn('[API] 401 Unauthorized - triggering sign out');
        onUnauthorized();
      }

      throw error;
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiRequestError) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiRequestError('Request timed out', 0, 'TIMEOUT');
      }
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }

    throw new ApiRequestError('An unexpected error occurred');
  }
}

/**
 * Check if an error is retryable
 */
function isRetryable(error: ApiRequestError): boolean {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    return true;
  }
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }
  // 429 is retryable (we have retryAfterSeconds from API)
  if (error.status === 429) {
    return true;
  }
  return false;
}

/**
 * Get retry delay for an error (in milliseconds)
 */
function getRetryDelay(error: ApiRequestError, attempt: number): number {
  // If 429 with retryAfterSeconds, convert to ms (capped at 30s for sanity)
  if (error.status === 429 && error.retryAfterSeconds) {
    return Math.min(error.retryAfterSeconds * 1000, API.RETRY.MAX_DELAY);
  }
  // Otherwise exponential backoff: 300ms, 600ms, 1200ms...
  return API.RETRY.BASE_DELAY * Math.pow(2, attempt);
}

/**
 * Make API request with timeout, error handling, and retry for transient failures
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  timeout: number = API.TIMEOUTS.DEFAULT,
  maxRetries: number = API.RETRY.MAX_RETRIES
): Promise<T> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  let lastError: ApiRequestError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await singleRequest<T>(path, options, timeout, apiBase);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        lastError = err;

        // Only retry if it's a retryable error and we have retries left
        if (attempt < maxRetries && isRetryable(err)) {
          // Wait before retrying (uses retryAfterMs for 429 or exponential backoff)
          const delay = getRetryDelay(err, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw err;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new ApiRequestError('Request failed after retries');
}

// ============================================
// API Endpoints
// ============================================

/**
 * Check API health
 * Typical latency: <50ms
 */
export async function getHealth(): Promise<HealthResponse> {
  try {
    const response = await request<HealthResponse>(API.ENDPOINTS.HEALTH, {}, API.TIMEOUTS.HEALTH);
    // Backend returns status: 'healthy' on success
    if (response.status === 'healthy') {
      return response;
    }
    return { ...response, status: 'unhealthy' };
  } catch {
    return { status: 'unhealthy' };
  }
}

/**
 * List notes with pagination
 * Typical latency: 100-300ms
 * Backend derives tenantId from authenticated user
 *
 * @param cursor - Base64 pagination cursor from previous response
 * @param limit - Results per page (1-100, default 50)
 */
export async function listNotes(
  cursor?: string,
  limit = 50,
  signal?: AbortSignal
): Promise<NotesListResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(Math.min(Math.max(1, limit), 100))); // Clamp 1-100
  if (cursor) params.set('cursor', cursor);

  const path = `${API.ENDPOINTS.NOTES}?${params.toString()}`;
  const headers = await getAuthHeaders();

  return await request<NotesListResponse>(path, { headers, ...(signal && { signal }) });
}

/**
 * Create a new note
 * Typical latency: 200-500ms (includes async chunking for RAG)
 * Backend derives tenantId from authenticated user
 *
 * @param text - Note content (required, max 5000 chars)
 * @throws {ApiRequestError} If validation fails or server error
 */
export async function createNote(text: string): Promise<RawNote> {
  // Client-side validation
  const validation = validateNoteText(text);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  return await request<RawNote>(API.ENDPOINTS.NOTES, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text: text.trim(),
    }),
  });
}

/**
 * Update an existing note
 * Backend derives tenantId from authenticated user
 *
 * @param id - Note ID
 * @param text - New note content (required, max 5000 chars)
 * @throws {ApiRequestError} If validation fails or server error
 */
export async function updateNote(id: string, text: string): Promise<RawNote> {
  // Client-side validation
  const validation = validateNoteText(text);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  return await request<RawNote>(`${API.ENDPOINTS.NOTES}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ text: text.trim() }),
  });
}

/** Response from delete note endpoint */
export interface DeleteNoteResponse {
  success: boolean;
  id: string;
  deletedAt: string;
  chunksDeleted: number;
}

/**
 * Delete a note
 * Backend derives tenantId from authenticated user
 *
 * @param id - Note ID to delete
 */
export async function deleteNote(id: string): Promise<DeleteNoteResponse> {
  const headers = await getAuthHeaders();

  return await request<DeleteNoteResponse>(`${API.ENDPOINTS.NOTES}/${id}`, {
    method: 'DELETE',
    headers,
  });
}

/**
 * Send a chat message and get RAG-powered response with sources
 * Typical latency: 1000-3500ms (RAG pipeline + LLM generation)
 * Backend derives tenantId from authenticated user
 *
 * @param message - Question to ask (required, max 2000 chars)
 * @throws {ApiRequestError} If validation fails, rate limited, or server error
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  // Client-side validation
  const validation = validateChatMessage(message);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  const response = await request<ChatResponse>(
    API.ENDPOINTS.CHAT,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: message.trim(),
      }),
    },
    API.TIMEOUTS.CHAT
  );

  // Backward compatibility: convert legacy citations to sources
  if (!response.sources && response.citations) {
    response.sources = response.citations.map((c, idx) => ({
      id: String(idx + 1),
      noteId: c.noteId,
      preview: c.snippet,
      date: formatDateForSource(c.createdAt),
      relevance: c.score,
    }));
    // Also update answer to use new citation format [1] instead of [N1]
    response.answer = response.answer.replace(/\[N(\d+)\]/g, '[$1]');
  }

  return response;
}

/**
 * Format date string for source display
 */
function formatDateForSource(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

// ============================================
// SSE Stream Processing (Shared)
// ============================================

/**
 * Generic SSE event handler callback type
 */
interface SSEEventHandlers {
  onSources?: (sources: StreamSource[]) => void;
  onContextSources?: (sources: ContextSource[]) => void;
  onToken?: (token: string) => void;
  onDone?: (meta: ChatMeta) => void;
  onError?: (error: string) => void;
  onFollowups?: (followups: string[]) => void;
  onHeartbeat?: (seq: number) => void;
}

/**
 * Process an SSE stream from the API
 * Shared utility for chat streaming and transcript enhancement
 */
async function processSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handlers: SSEEventHandlers
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        try {
          const event: StreamEvent = JSON.parse(line.slice(6));

          switch (event.type) {
            case 'sources':
              handlers.onSources?.(event.sources || []);
              break;
            case 'context_sources':
              handlers.onContextSources?.(event.contextSources || []);
              break;
            case 'token':
              handlers.onToken?.(event.content || '');
              break;
            case 'done':
              handlers.onDone?.(event.meta!);
              break;
            case 'error':
              handlers.onError?.(event.error || 'Stream error');
              break;
            case 'followups':
              handlers.onFollowups?.(event.followups || []);
              break;
            case 'heartbeat':
              handlers.onHeartbeat?.(event.seq ?? 0);
              break;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      handlers.onError?.(err.message);
    }
  }
}

// ============================================
// Streaming Chat
// ============================================

export interface StreamCallbacks {
  onSources?: (sources: StreamSource[]) => void;
  onContextSources?: (sources: ContextSource[]) => void;
  onToken?: (token: string) => void;
  onDone?: (meta: ChatMeta) => void;
  onError?: (error: string) => void;
  onFollowups?: (followups: string[]) => void;
  onHeartbeat?: (seq: number) => void;
}

/**
 * Send a chat message with streaming response (SSE)
 * Delivers sources immediately, then streams tokens
 * Backend derives tenantId from authenticated user
 *
 * @param message - Question to ask (required, max 2000 chars)
 * @param callbacks - Event handlers for stream events
 * @returns AbortController to cancel the stream
 */
export async function sendChatMessageStreaming(
  message: string,
  callbacks: StreamCallbacks
): Promise<AbortController> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  // Client-side validation
  const validation = validateChatMessage(message);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const controller = new AbortController();
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${apiBase}${API.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: message.trim(),
        stream: true,
      }),
      signal: controller.signal,
    });

    // Handle error responses
    if (!response.ok) {
      const body = await safeJson<ApiError>(response);
      const { message, code } = extractErrorInfo(body, `Request failed: ${response.status}`);
      const retryAfterSeconds = body?.retryAfter ?? body?.retryAfterMs ? Math.ceil((body?.retryAfterMs || 0) / 1000) : undefined;

      throw new ApiRequestError(
        message,
        response.status,
        code,
        retryAfterSeconds,
        getRequestId(response) ?? undefined
      );
    }

    // Process SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiRequestError('Response body not available', 0, 'STREAM_ERROR');
    }

    // Process stream in background using shared helper
    processSSEStream(reader, callbacks);

    return controller;
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiRequestError('Stream aborted', 0, 'ABORTED');
      }
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }
    throw new ApiRequestError('An unexpected error occurred');
  }
}

// ============================================
// Feedback
// ============================================

/**
 * Submit feedback for a chat response
 * Backend derives tenantId from authenticated user
 *
 * @param requestId - The requestId from chat response meta
 * @param rating - 'up' or 'down'
 * @param comment - Optional feedback comment (max 1000 chars)
 */
export async function submitFeedback(
  requestId: string,
  rating: FeedbackRating,
  comment?: string
): Promise<FeedbackResponse> {
  if (!requestId) {
    throw new ApiRequestError('requestId is required', 400, 'VALIDATION_ERROR');
  }

  if (comment && comment.length > 1000) {
    throw new ApiRequestError('Comment too long (max 1000 characters)', 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();

  return await request<FeedbackResponse>(
    API.ENDPOINTS.FEEDBACK,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requestId,
        rating,
        comment: comment?.trim(),
      }),
    }
  );
}

// ============================================
// Transcription
// ============================================

/**
 * Transcribe audio to text using the backend transcription service
 * Typical latency: 1-5 seconds depending on audio length
 *
 * @param audioBlob - Audio data as a Blob
 * @returns Transcription result with text and metadata
 * @throws {ApiRequestError} If transcription fails
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResponse> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  // Get auth token
  let authToken: string | null = null;
  if (tokenGetter) {
    try {
      authToken = await tokenGetter();
    } catch (err) {
      console.error('Failed to get auth token:', err);
    }
  }

  // Build form data
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API.TIMEOUTS.TRANSCRIBE);

  try {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${apiBase}${API.ENDPOINTS.TRANSCRIBE}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await safeJson<ApiError>(res);
      const { message, code } = extractErrorInfo(body, `Transcription failed: ${res.status}`);
      throw new ApiRequestError(message, res.status, code);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiRequestError) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiRequestError('Transcription timed out', 0, 'TIMEOUT');
      }
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }

    throw new ApiRequestError('Transcription failed');
  }
}

// ============================================
// Transcript Enhancement
// ============================================

/** Callbacks for streaming transcript enhancement */
export interface EnhanceTranscriptCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (enhancedText: string) => void;
  onError?: (error: string) => void;
}

/**
 * Enhance a voice transcript using AI
 * Cleans up grammar, removes filler words, adds punctuation
 * Uses streaming for real-time feedback
 *
 * @param rawTranscript - The raw transcript from speech recognition
 * @param callbacks - Event handlers for streaming tokens
 * @returns AbortController to cancel the enhancement
 */
export async function enhanceTranscript(
  rawTranscript: string,
  callbacks: EnhanceTranscriptCallbacks
): Promise<AbortController> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  const trimmed = rawTranscript.trim();
  if (!trimmed) {
    callbacks.onError?.('No transcript to enhance');
    return new AbortController();
  }

  // Create a special prompt for transcript enhancement
  const enhancePrompt = `You are a transcript editor. Clean up this voice transcript by:
1. Fixing grammar and punctuation
2. Removing filler words (um, uh, like, you know, so, basically, actually)
3. Correcting obvious speech-to-text errors based on context
4. Keeping the original meaning and intent intact
5. Making it read naturally as written text

IMPORTANT:
- Output ONLY the cleaned transcript, nothing else
- Do NOT add explanations, headers, or commentary
- Do NOT change the meaning or add new information
- Keep it concise

Transcript to clean:
"""
${trimmed}
"""`;

  const controller = new AbortController();
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${apiBase}${API.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: enhancePrompt,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await safeJson<ApiError>(response);
      const { message, code } = extractErrorInfo(body, `Enhancement failed: ${response.status}`);
      throw new ApiRequestError(message, response.status, code);
    }

    // Process SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiRequestError('No response body', 0, 'STREAM_ERROR');
    }

    // Accumulate text for onComplete callback
    let fullText = '';
    processSSEStream(reader, {
      onToken: (token) => {
        fullText += token;
        callbacks.onToken?.(token);
      },
      onDone: () => callbacks.onComplete?.(fullText.trim()),
      onError: (error) => callbacks.onError?.(error),
      // onSources is ignored for enhancement
    });

    return controller;
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err;
    }
    if (err instanceof Error) {
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }
    throw new ApiRequestError('Enhancement failed');
  }
}

// ============================================
// Thread APIs
// ============================================

/**
 * List threads with pagination
 */
export async function listThreads(
  cursor?: string,
  limit = 20,
  signal?: AbortSignal
): Promise<ThreadsListResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(Math.min(Math.max(1, limit), 50)));
  if (cursor) params.set('cursor', cursor);

  const path = `${API.ENDPOINTS.THREADS}?${params.toString()}`;
  const headers = await getAuthHeaders();

  return await request<ThreadsListResponse>(path, { headers, ...(signal && { signal }) });
}

/**
 * Get thread detail with messages
 */
export async function getThread(
  threadId: string,
  signal?: AbortSignal
): Promise<ThreadDetail> {
  const headers = await getAuthHeaders();
  return await request<ThreadDetail>(`${API.ENDPOINTS.THREADS}/${threadId}`, { headers, ...(signal && { signal }) });
}

/**
 * Create a new thread
 */
export async function createThread(title?: string): Promise<Thread> {
  const headers = await getAuthHeaders();
  return await request<Thread>(API.ENDPOINTS.THREADS, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: title || 'New Chat' }),
  });
}

/**
 * Update thread title
 */
export async function updateThread(threadId: string, title: string): Promise<Thread> {
  const headers = await getAuthHeaders();
  return await request<Thread>(`${API.ENDPOINTS.THREADS}/${threadId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ title }),
  });
}

/**
 * Delete a thread
 */
export async function deleteThread(threadId: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  return await request<{ success: boolean }>(`${API.ENDPOINTS.THREADS}/${threadId}`, {
    method: 'DELETE',
    headers,
  });
}

/**
 * Send a message to a thread (streaming)
 */
export async function sendThreadMessage(
  threadId: string,
  message: string,
  filters?: ChatFilters,
  callbacks?: StreamCallbacks
): Promise<AbortController> {
  const apiBase = getApiBase();

  if (!apiBase) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE. Add it to .env.local and restart the dev server.',
      0,
      'MISSING_CONFIG'
    );
  }

  const validation = validateChatMessage(message);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const controller = new AbortController();
  const headers = await getAuthHeaders();

  const body: Record<string, unknown> = {
    message: message.trim(),
    stream: true,
    threadId,
  };
  if (filters) {
    body['filters'] = filters;
  }

  try {
    const response = await fetch(`${apiBase}${API.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await safeJson<ApiError>(response);
      const { message: errMsg, code } = extractErrorInfo(errorBody, `Request failed: ${response.status}`);
      throw new ApiRequestError(errMsg, response.status, code);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ApiRequestError('Response body not available', 0, 'STREAM_ERROR');
    }

    if (callbacks) {
      processSSEStream(reader, callbacks);
    }

    return controller;
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiRequestError('Stream aborted', 0, 'ABORTED');
      }
      throw new ApiRequestError(err.message, 0, 'NETWORK_ERROR');
    }
    throw new ApiRequestError('An unexpected error occurred');
  }
}

// ============================================
// Tags APIs
// ============================================

/**
 * Get all tags for the user
 */
export async function listTags(signal?: AbortSignal): Promise<TagsListResponse> {
  const headers = await getAuthHeaders();
  return await request<TagsListResponse>(API.ENDPOINTS.TAGS, { headers, ...(signal && { signal }) });
}

// ============================================
// Search APIs
// ============================================

/**
 * Advanced search with filters and optional semantic search
 */
export async function searchNotes(
  searchRequest: AdvancedSearchRequest,
  signal?: AbortSignal
): Promise<{ results: SearchResult[] }> {
  const headers = await getAuthHeaders();
  return await request<{ results: SearchResult[] }>(
    API.ENDPOINTS.NOTES_SEARCH,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(searchRequest),
      ...(signal && { signal }),
    },
    API.TIMEOUTS.SEARCH
  );
}

/**
 * Get a single note by ID
 */
export async function getNote(noteId: string, signal?: AbortSignal): Promise<RawNote> {
  const headers = await getAuthHeaders();
  return await request<RawNote>(`${API.ENDPOINTS.NOTES}/${noteId}`, { headers, ...(signal && { signal }) });
}

/**
 * Update note with full data (title, tags, metadata)
 */
export async function updateNoteWithMetadata(
  id: string,
  data: {
    text?: string;
    title?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<RawNote> {
  const headers = await getAuthHeaders();
  return await request<RawNote>(`${API.ENDPOINTS.NOTES}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * Create note with full data (title, tags, metadata)
 */
export async function createNoteWithMetadata(data: {
  text: string;
  title?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Promise<RawNote> {
  const validation = validateNoteText(data.text);
  if (!validation.valid) {
    throw new ApiRequestError(validation.error!, 400, 'VALIDATION_ERROR');
  }

  const headers = await getAuthHeaders();
  return await request<RawNote>(API.ENDPOINTS.NOTES, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...data,
      text: data.text.trim(),
    }),
  });
}
