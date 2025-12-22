/**
 * Citation/Source parsing and handling utilities
 * Parses [1], [2] citation tokens from RAG responses and maps to source objects
 */

import type { Source, ConfidenceLevel } from './types';

/** Regex pattern to match citation tokens like [1], [2], etc. */
const SOURCE_PATTERN = /\[(\d+)\]/g;

/** Represents a segment of parsed text - either plain text or a source reference */
export interface TextSegment {
  type: 'text' | 'source';
  content: string;
  source?: Source;
}

/**
 * Parse answer text and identify source tokens [1], [2], etc.
 * Returns an array of segments for rendering
 */
export function parseSources(
  text: string,
  sources: Source[] | undefined
): TextSegment[] {
  if (!text) return [];
  if (!sources || sources.length === 0) {
    return [{ type: 'text', content: text }];
  }

  // Build a lookup map for faster access
  const sourceMap = new Map<string, Source>();
  for (const s of sources) {
    sourceMap.set(s.id, s);
  }

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Find all source matches
  const matches = text.matchAll(SOURCE_PATTERN);

  for (const match of matches) {
    const fullMatch = match[0]; // e.g., "[1]"
    const id = match[1]; // e.g., "1"
    const matchIndex = match.index!;

    // Add text before this source
    if (matchIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, matchIndex),
      });
    }

    // Add source segment
    const source = sourceMap.get(id);
    if (source) {
      segments.push({
        type: 'source',
        content: fullMatch,
        source,
      });
    } else {
      // Source not found in list - render as plain text
      segments.push({
        type: 'text',
        content: fullMatch,
      });
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Add remaining text after last source
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Get unique sources referenced in the text
 * Useful for building a summary list of sources
 */
export function getReferencedSources(
  text: string,
  sources: Source[] | undefined
): Source[] {
  if (!text || !sources || sources.length === 0) return [];

  const sourceMap = new Map<string, Source>();
  for (const s of sources) {
    sourceMap.set(s.id, s);
  }

  const referenced: Source[] = [];
  const seen = new Set<string>();

  const matches = text.matchAll(SOURCE_PATTERN);
  for (const match of matches) {
    const id = match[1];
    if (!seen.has(id)) {
      seen.add(id);
      const source = sourceMap.get(id);
      if (source) {
        referenced.push(source);
      }
    }
  }

  return referenced;
}



/**
 * Format source preview for display (truncate if needed)
 */
export function formatPreview(preview: string, maxLength = 120): string {
  if (!preview) return '';
  if (preview.length <= maxLength) return preview;
  return preview.slice(0, maxLength).trim() + '…';
}

/**
 * Calculate confidence level from relevance score
 */
export function getConfidenceFromRelevance(relevance: number): ConfidenceLevel {
  if (relevance >= 0.7) return 'high';
  if (relevance >= 0.4) return 'medium';
  if (relevance > 0) return 'low';
  return 'none';
}
