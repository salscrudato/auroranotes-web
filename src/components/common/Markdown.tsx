/**
 * Markdown component
 * Simple markdown renderer without external dependencies
 * Supports: bold, italic, code, links, headers, lists, blockquotes
 */

import { memo, useMemo } from 'react';
import { FEATURES } from '../../lib/constants';

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize URLs to prevent XSS via javascript: or data: URLs
 * Only allows http, https, and mailto protocols
 */
function sanitizeUrl(url: string): string | null {
  const trimmedUrl = url.trim().toLowerCase();

  // Block javascript:, data:, vbscript:, and other dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:') ||
    trimmedUrl.startsWith('file:')
  ) {
    return null;
  }

  // Allow only safe protocols
  if (
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('mailto:') ||
    trimmedUrl.startsWith('/') || // Relative URLs
    trimmedUrl.startsWith('#') // Anchor links
  ) {
    return escapeHtml(url);
  }

  // If no protocol, assume https
  if (!trimmedUrl.includes(':')) {
    return escapeHtml(url);
  }

  // Block unknown protocols
  return null;
}

/**
 * Parse inline markdown elements
 */
function parseInline(text: string): string {
  let result = escapeHtml(text);

  // Code (inline) - must be before other patterns
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Links - with URL sanitization to prevent XSS
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, linkText, url) => {
      const sanitizedUrl = sanitizeUrl(url);
      if (sanitizedUrl) {
        return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      }
      // If URL is unsafe, just show the link text
      return linkText;
    }
  );

  return result;
}

/**
 * Parse markdown content to HTML
 */
function parseMarkdown(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.push('</code></pre>');
        inCodeBlock = false;
      } else {
        result.push('<pre><code>');
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      result.push(escapeHtml(line));
      continue;
    }
    
    // Close list if needed
    if (inList && !line.match(/^[\s]*[-*+]|^\d+\./)) {
      result.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }
    
    // Headers
    if (line.startsWith('### ')) {
      result.push(`<h3>${parseInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      result.push(`<h2>${parseInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      result.push(`<h1>${parseInline(line.slice(2))}</h1>`);
      continue;
    }
    
    // Blockquotes
    if (line.startsWith('> ')) {
      result.push(`<blockquote>${parseInline(line.slice(2))}</blockquote>`);
      continue;
    }
    
    // Unordered lists
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push('</ol>');
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${parseInline(ulMatch[1])}</li>`);
      continue;
    }
    
    // Ordered lists
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push('</ul>');
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${parseInline(olMatch[1])}</li>`);
      continue;
    }
    
    // Empty line
    if (line.trim() === '') {
      result.push('<br/>');
      continue;
    }
    
    // Regular paragraph
    result.push(`<p>${parseInline(line)}</p>`);
  }
  
  // Close any open lists
  if (inList) {
    result.push(listType === 'ul' ? '</ul>' : '</ol>');
  }
  if (inCodeBlock) {
    result.push('</code></pre>');
  }
  
  return result.join('\n');
}

export const Markdown = memo(function Markdown({ content, className = '' }: MarkdownProps) {
  const html = useMemo(() => {
    if (!FEATURES.ENABLE_MARKDOWN) {
      return escapeHtml(content);
    }
    return parseMarkdown(content);
  }, [content]);

  return (
    <div 
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

