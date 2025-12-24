/**
 * Note Classifier - AI-powered note type detection and auto-tagging
 * 
 * Classifies notes into types and suggests relevant tags based on content analysis.
 * Uses pattern matching and keyword analysis for fast, local classification.
 */

/** Note types that can be detected */
export type NoteType = 
  | 'meeting'      // Meeting notes, agendas, minutes
  | 'todo'         // Task lists, action items
  | 'idea'         // Creative ideas, brainstorms
  | 'journal'      // Personal reflections, daily logs
  | 'reference'    // Facts, documentation, how-tos
  | 'decision'     // Decision records, pros/cons
  | 'contact'      // People info, contact details
  | 'project'      // Project plans, updates
  | 'general';     // Uncategorized

/** Classification result */
export interface NoteClassification {
  type: NoteType;
  confidence: number;      // 0-1 confidence score
  suggestedTags: string[];
  suggestedTitle?: string;
  template?: NoteTemplate;
}

/** Note template for structured notes */
export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  structure: string;
  icon: string;
}

/** Classification patterns for each note type */
interface ClassificationPattern {
  type: NoteType;
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

const CLASSIFICATION_PATTERNS: ClassificationPattern[] = [
  {
    type: 'meeting',
    keywords: ['meeting', 'agenda', 'minutes', 'attendees', 'discussed', 'sync', 'standup', 'retrospective', 'call', 'conference'],
    patterns: [
      /meeting\s+(with|about|notes?)/i,
      /attendees?:/i,
      /agenda:/i,
      /action\s+items?:/i,
      /next\s+steps?:/i,
      /discussed\s+(with|about)/i,
    ],
    weight: 1.2,
  },
  {
    type: 'todo',
    keywords: ['todo', 'task', 'tasks', 'checklist', 'must', 'need', 'should', 'deadline', 'due', 'priority'],
    patterns: [
      /^[-*□☐✓✗]\s+/m,
      /\[\s*[x ]?\s*\]/i,
      /todo:/i,
      /tasks?:/i,
      /deadline:/i,
      /due\s+(by|date|on)/i,
      /need\s+to/i,
      /must\s+/i,
    ],
    weight: 1.1,
  },
  {
    type: 'idea',
    keywords: ['idea', 'brainstorm', 'concept', 'what if', 'maybe', 'could', 'explore', 'innovation', 'creative'],
    patterns: [
      /^idea:/im,
      /what\s+if/i,
      /brainstorm/i,
      /concept:/i,
      /💡|🧠|✨/,
    ],
    weight: 1.0,
  },
  {
    type: 'journal',
    keywords: ['today', 'feeling', 'grateful', 'reflection', 'thoughts', 'diary', 'personal', 'morning', 'evening'],
    patterns: [
      /^today/im,
      /i\s+(feel|felt|am|was)\s+/i,
      /grateful\s+for/i,
      /reflection/i,
      /dear\s+diary/i,
    ],
    weight: 1.0,
  },
  {
    type: 'decision',
    keywords: ['decision', 'decided', 'option', 'pros', 'cons', 'choose', 'alternative', 'tradeoff', 'versus', 'vs'],
    patterns: [
      /decision:/i,
      /pros\s*(and|&|\/)\s*cons/i,
      /option\s*[1-9a-z]:/i,
      /we\s+decided/i,
      /vs\.?|versus/i,
    ],
    weight: 1.1,
  },
  {
    type: 'contact',
    keywords: ['email', 'phone', 'linkedin', 'twitter', 'contact', 'met', 'introduced'],
    patterns: [
      /[\w.-]+@[\w.-]+\.\w+/,           // Email
      /\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/, // Phone
      /linkedin\.com/i,
      /met\s+(with|at)/i,
    ],
    weight: 1.0,
  },
  {
    type: 'project',
    keywords: ['project', 'milestone', 'sprint', 'release', 'roadmap', 'timeline', 'deliverable', 'stakeholder'],
    patterns: [
      /project:/i,
      /milestone:/i,
      /sprint\s+\d+/i,
      /release\s+(date|notes?|v)/i,
      /roadmap/i,
    ],
    weight: 1.0,
  },
  {
    type: 'reference',
    keywords: ['how to', 'guide', 'documentation', 'reference', 'steps', 'instructions', 'tutorial', 'note:'],
    patterns: [
      /how\s+to/i,
      /step\s+[1-9]/i,
      /instructions?:/i,
      /^#\s+/m,  // Markdown headers suggest documentation
    ],
    weight: 0.9,
  },
];

/** Available note templates */
export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Structured meeting notes with attendees and action items',
    icon: '📅',
    structure: `## Meeting: [Topic]\n**Date:** [Today]\n**Attendees:** \n\n### Agenda\n- \n\n### Discussion Notes\n\n\n### Action Items\n- [ ] \n\n### Next Steps\n`,
  },
  {
    id: 'todo',
    name: 'Task List',
    description: 'Checklist for tracking tasks',
    icon: '✅',
    structure: `## Tasks\n\n### High Priority\n- [ ] \n\n### Normal Priority\n- [ ] \n\n### Low Priority\n- [ ] \n`,
  },
  {
    id: 'idea',
    name: 'Idea',
    description: 'Capture and develop creative ideas',
    icon: '💡',
    structure: `## 💡 Idea: [Title]\n\n### The Concept\n\n\n### Why It Matters\n\n\n### Next Steps to Explore\n- \n`,
  },
  {
    id: 'journal',
    name: 'Daily Journal',
    description: 'Daily reflection and gratitude',
    icon: '📔',
    structure: `## Journal Entry\n\n### Today I'm grateful for:\n- \n\n### What happened today:\n\n\n### Reflections:\n\n\n### Tomorrow I want to:\n- \n`,
  },
  {
    id: 'decision',
    name: 'Decision Record',
    description: 'Document important decisions',
    icon: '⚖️',
    structure: `## Decision: [Title]\n\n### Context\n\n\n### Options Considered\n\n**Option A:**\n- Pros: \n- Cons: \n\n**Option B:**\n- Pros: \n- Cons: \n\n### Decision\n\n\n### Rationale\n\n`,
  },
  {
    id: 'project',
    name: 'Project Update',
    description: 'Track project progress and updates',
    icon: '📊',
    structure: `## Project: [Name]\n**Status:** On Track | At Risk | Blocked\n\n### Progress This Week\n- \n\n### Blockers\n- \n\n### Next Week\n- \n`,
  },
];

/**
 * Classify a note based on its content
 */
export function classifyNote(text: string): NoteClassification {
  const normalizedText = text.toLowerCase();
  const scores: Map<NoteType, number> = new Map();

  // Initialize scores
  for (const pattern of CLASSIFICATION_PATTERNS) {
    scores.set(pattern.type, 0);
  }

  // Score each pattern
  for (const pattern of CLASSIFICATION_PATTERNS) {
    let score = 0;

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (normalizedText.includes(keyword)) {
        score += 1;
      }
    }

    // Check regex patterns (weighted higher)
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        score += 2;
      }
    }

    // Apply type-specific weight
    score *= pattern.weight;
    scores.set(pattern.type, score);
  }

  // Find the best match
  let bestType: NoteType = 'general';
  let bestScore = 0;

  for (const [type, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // Calculate confidence (normalize to 0-1)
  const maxPossibleScore = 20; // Rough max score
  const confidence = Math.min(bestScore / maxPossibleScore, 1);

  // Only classify if confidence is above threshold
  if (confidence < 0.15) {
    bestType = 'general';
  }

  // Generate suggested tags
  const suggestedTags = generateSuggestedTags(text, bestType);

  // Generate suggested title
  const suggestedTitle = generateSuggestedTitle(text);

  // Get template for this type
  const template = NOTE_TEMPLATES.find(t => t.id === bestType);

  // Build result, only including optional properties if defined
  const result: NoteClassification = {
    type: bestType,
    confidence,
    suggestedTags,
  };

  if (suggestedTitle !== undefined) result.suggestedTitle = suggestedTitle;
  if (template !== undefined) result.template = template;

  return result;
}

/**
 * Generate suggested tags based on content
 */
function generateSuggestedTags(text: string, noteType: NoteType): string[] {
  const tags: Set<string> = new Set();

  // Add type-based tag
  if (noteType !== 'general') {
    tags.add(noteType);
  }

  // Extract @mentions as tags
  const mentions = text.match(/@(\w+)/g);
  if (mentions) {
    mentions.slice(0, 3).forEach(m => tags.add(m.slice(1).toLowerCase()));
  }

  // Extract #hashtags
  const hashtags = text.match(/#(\w+)/g);
  if (hashtags) {
    hashtags.slice(0, 5).forEach(h => tags.add(h.slice(1).toLowerCase()));
  }

  // Common topic keywords
  const topicKeywords: Record<string, string> = {
    'budget': 'finance',
    'revenue': 'finance',
    'sales': 'sales',
    'marketing': 'marketing',
    'design': 'design',
    'engineering': 'engineering',
    'product': 'product',
    'customer': 'customer',
    'team': 'team',
    'hiring': 'hiring',
    'onboarding': 'onboarding',
    'security': 'security',
    'performance': 'performance',
    'bug': 'bug',
    'feature': 'feature',
  };

  const normalizedText = text.toLowerCase();
  for (const [keyword, tag] of Object.entries(topicKeywords)) {
    if (normalizedText.includes(keyword)) {
      tags.add(tag);
    }
  }

  return Array.from(tags).slice(0, 5);
}

/**
 * Generate a suggested title from the first line or key content
 */
function generateSuggestedTitle(text: string): string | undefined {
  // Try to extract title from markdown header
  const headerMatch = text.match(/^#\s+(.+)$/m);
  if (headerMatch && headerMatch[1]) {
    return headerMatch[1].trim().slice(0, 60);
  }

  // Use first line if it's short enough
  const lines = text.split('\n');
  const firstLine = lines[0]?.trim() ?? '';
  if (firstLine.length > 5 && firstLine.length <= 60) {
    // Clean up common prefixes
    const cleaned = firstLine
      .replace(/^(meeting|note|idea|todo|task):\s*/i, '')
      .replace(/^[-*•]\s*/, '');
    if (cleaned.length > 5) {
      return cleaned;
    }
  }

  return undefined;
}

/**
 * Get icon for a note type
 */
export function getNoteTypeIcon(type: NoteType): string {
  const icons: Record<NoteType, string> = {
    meeting: '📅',
    todo: '✅',
    idea: '💡',
    journal: '📔',
    reference: '📚',
    decision: '⚖️',
    contact: '👤',
    project: '📊',
    general: '📝',
  };
  return icons[type];
}

/**
 * Get display name for a note type
 */
export function getNoteTypeName(type: NoteType): string {
  const names: Record<NoteType, string> = {
    meeting: 'Meeting',
    todo: 'Task List',
    idea: 'Idea',
    journal: 'Journal',
    reference: 'Reference',
    decision: 'Decision',
    contact: 'Contact',
    project: 'Project',
    general: 'Note',
  };
  return names[type];
}

