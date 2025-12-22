/**
 * useNoteClassifier - Hook for real-time note classification
 * 
 * Provides debounced classification as the user types, suggesting
 * note types, tags, and templates based on content.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  classifyNote,
  type NoteClassification,
  type NoteType,
  type NoteTemplate,
  NOTE_TEMPLATES,
  getNoteTypeIcon,
  getNoteTypeName,
} from '../lib/noteClassifier';

interface UseNoteClassifierOptions {
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Minimum text length before classifying (default: 20) */
  minLength?: number;
}

interface UseNoteClassifierReturn {
  /** Current classification result */
  classification: NoteClassification | null;
  /** Whether classification is in progress */
  isClassifying: boolean;
  /** Suggested tags based on content */
  suggestedTags: string[];
  /** Suggested template based on content */
  suggestedTemplate: NoteTemplate | null;
  /** All available templates */
  templates: NoteTemplate[];
  /** Apply a template to get its structure */
  applyTemplate: (templateId: string) => string | null;
  /** Get icon for a note type */
  getIcon: (type: NoteType) => string;
  /** Get name for a note type */
  getName: (type: NoteType) => string;
}

/**
 * Hook for real-time note classification with debouncing
 */
export function useNoteClassifier(
  text: string,
  options: UseNoteClassifierOptions = {}
): UseNoteClassifierReturn {
  const { debounceMs = 300, minLength = 20 } = options;

  const [classification, setClassification] = useState<NoteClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Debounced classification using async setTimeout pattern
  useEffect(() => {
    // Skip classification for short text
    if (text.length < minLength) {
      const timer = setTimeout(() => {
        setClassification(null);
        setIsClassifying(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Use immediate timeout to avoid synchronous setState warning
    const startTimer = setTimeout(() => setIsClassifying(true), 0);

    const classifyTimer = setTimeout(() => {
      const result = classifyNote(text);
      setClassification(result);
      setIsClassifying(false);
    }, debounceMs);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(classifyTimer);
    };
  }, [text, debounceMs, minLength]);

  // Extract suggested tags from classification
  const suggestedTags = useMemo(() => {
    return classification?.suggestedTags || [];
  }, [classification]);

  // Get suggested template
  const suggestedTemplate = useMemo(() => {
    if (!classification || classification.confidence < 0.3) {
      return null;
    }
    return classification.template || null;
  }, [classification]);

  // Apply a template by ID
  const applyTemplate = useCallback((templateId: string): string | null => {
    const template = NOTE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    // Replace date placeholder with current date
    return template.structure.replace('[Today]', new Date().toLocaleDateString());
  }, []);

  return {
    classification,
    isClassifying,
    suggestedTags,
    suggestedTemplate,
    templates: NOTE_TEMPLATES,
    applyTemplate,
    getIcon: getNoteTypeIcon,
    getName: getNoteTypeName,
  };
}

export type { NoteClassification, NoteType, NoteTemplate };

