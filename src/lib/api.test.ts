/**
 * API Client Tests
 * Tests for validation, error handling, and rate limiting
 * Note: tenantId is now derived from Firebase Auth on the backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ApiRequestError,
  validateNoteText,
  validateChatMessage,
  getRateLimitInfo,
  getHealth,
  listNotes,
  createNote,
  sendChatMessage,
  setTokenGetter,
} from './api';
import { NOTES, CHAT } from './constants';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper to create mock response
function createMockResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(headers),
  } as Response;
}

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock token getter
    setTokenGetter(async () => 'mock-firebase-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // Validation Tests
  // ============================================
  describe('Note Validation', () => {
    it('should validate valid note text', () => {
      const result = validateNoteText('This is a valid note');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty note text', () => {
      const result = validateNoteText('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Note text is required');
    });

    it('should reject whitespace-only note text', () => {
      const result = validateNoteText('   \n\t  ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Note text is required');
    });

    it('should reject note text exceeding max length', () => {
      const longText = 'a'.repeat(NOTES.MAX_LENGTH + 1);
      const result = validateNoteText(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`max ${NOTES.MAX_LENGTH}`);
    });

    it('should accept note text at exactly max length', () => {
      const maxText = 'a'.repeat(NOTES.MAX_LENGTH);
      const result = validateNoteText(maxText);
      expect(result.valid).toBe(true);
    });
  });

  describe('Chat Message Validation', () => {
    it('should validate valid chat message', () => {
      const result = validateChatMessage('What are my notes about?');
      expect(result.valid).toBe(true);
    });

    it('should reject empty chat message', () => {
      const result = validateChatMessage('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Message is required');
    });

    it('should reject message exceeding max length', () => {
      const longMessage = 'a'.repeat(CHAT.MAX_MESSAGE_LENGTH + 1);
      const result = validateChatMessage(longMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`max ${CHAT.MAX_MESSAGE_LENGTH}`);
    });
  });

  // ============================================
  // ApiRequestError Tests
  // ============================================
  describe('ApiRequestError', () => {
    it('should create error with all properties', () => {
      const error = new ApiRequestError('Test error', 429, 'RATE_LIMITED', 30, 'req-123');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.retryAfterSeconds).toBe(30);
      expect(error.requestId).toBe('req-123');
    });

    it('should return user-friendly message for 400 error', () => {
      const error = new ApiRequestError('text is required', 400);
      expect(error.getUserMessage()).toBe('text is required');
    });

    it('should return user-friendly message for 401 error', () => {
      const error = new ApiRequestError('Unauthorized', 401);
      expect(error.getUserMessage()).toContain('Authentication error');
    });

    it('should return user-friendly message for 429 error', () => {
      const error = new ApiRequestError('Rate limited', 429, undefined, 30);
      expect(error.getUserMessage()).toContain('Too many requests');
      expect(error.getUserMessage()).toContain('30 seconds');
    });

    it('should return user-friendly message for 503 error', () => {
      const error = new ApiRequestError('Service unavailable', 503);
      expect(error.getUserMessage()).toContain('temporarily unavailable');
    });

    it('should return user-friendly message for 500 error', () => {
      const error = new ApiRequestError('Internal error', 500);
      expect(error.getUserMessage()).toContain('server is experiencing issues');
    });
  });

  // ============================================
  // Health Check Tests
  // ============================================
  describe('getHealth', () => {
    it('should return healthy status on success', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 'healthy',
          timestamp: '2025-12-15T01:30:00.000Z',
          service: 'auroranotes-api',
          version: '2.0.0',
        })
      );

      const result = await getHealth();
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('auroranotes-api');
    });

    it('should return unhealthy status on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getHealth();
      expect(result.status).toBe('unhealthy');
    });
  });

  // ============================================
  // Rate Limit Header Tests
  // ============================================
  describe('Rate Limit Headers', () => {
    it('should parse rate limit headers from response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { notes: [], cursor: null, hasMore: false },
          200,
          {
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '45',
            'X-RateLimit-Reset': '30',
          }
        )
      );

      await listNotes();
      const rateLimitInfo = getRateLimitInfo();

      expect(rateLimitInfo).not.toBeNull();
      expect(rateLimitInfo?.limit).toBe(60);
      expect(rateLimitInfo?.remaining).toBe(45);
      expect(rateLimitInfo?.resetSeconds).toBe(30);
    });
  });

  // ============================================
  // API Endpoint Tests
  // ============================================
  describe('listNotes', () => {
    it('should include Authorization header with Bearer token', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ notes: [], cursor: null, hasMore: false })
      );

      await listNotes();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-firebase-token',
          }),
        })
      );
    });

    it('should clamp limit between 1 and 100', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ notes: [], cursor: null, hasMore: false })
      );

      await listNotes(undefined, 150); // Should be clamped to 100

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      );
    });
  });

  describe('createNote', () => {
    it('should include Authorization header with Bearer token', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'note-123',
          text: 'Test note',
          tenantId: 'user-123',
          createdAt: '2025-12-15T01:30:00.000Z',
          updatedAt: '2025-12-15T01:30:00.000Z',
        })
      );

      await createNote('Test note');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-firebase-token',
          }),
        })
      );
    });

    it('should throw validation error for empty text', async () => {
      await expect(createNote('')).rejects.toThrow('Note text is required');
    });

    it('should throw validation error for text too long', async () => {
      const longText = 'a'.repeat(NOTES.MAX_LENGTH + 1);
      await expect(createNote(longText)).rejects.toThrow('too long');
    });
  });

  describe('sendChatMessage', () => {
    it('should include Authorization header with Bearer token', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          answer: 'Test answer',
          citations: [],
          meta: { model: 'test', retrieval: { k: 5, strategy: 'test' } },
        })
      );

      await sendChatMessage('Test question');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-firebase-token',
          }),
        })
      );
    });

    it('should throw validation error for empty message', async () => {
      await expect(sendChatMessage('')).rejects.toThrow('Message is required');
    });

    it('should throw validation error for message too long', async () => {
      const longMessage = 'a'.repeat(CHAT.MAX_MESSAGE_LENGTH + 1);
      await expect(sendChatMessage(longMessage)).rejects.toThrow('too long');
    });
  });
});

