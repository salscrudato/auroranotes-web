/**
 * ActionResult component
 * Displays results from agentic actions (create_note, set_reminder, search_notes, etc.)
 */

import { memo } from 'react';
import { CheckCircle, XCircle, FileText, Bell, Search, List, AtSign, Calendar } from 'lucide-react';
import type { ActionMeta } from '../../lib/types';

interface ActionResultProps {
  action: ActionMeta;
  onNoteClick?: (noteId: string) => void;
}

export const ActionResult = memo(function ActionResult({ action, onNoteClick }: ActionResultProps) {
  const { type, success, data } = action;

  if (!success || !data) {
    return (
      <div className="action-result action-result-error">
        <XCircle size={16} />
        <span>Action failed: {type.replace(/_/g, ' ')}</span>
      </div>
    );
  }

  // Render different UI based on action type
  switch (type) {
    case 'create_note':
      if (!data.createdNote) return null;
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <CheckCircle size={16} />
            <span className="action-result-title">Note Created</span>
          </div>
          <div className="action-result-content">
            <FileText size={14} />
            <div className="action-result-details">
              {data.createdNote.title && (
                <div className="action-result-note-title">{data.createdNote.title}</div>
              )}
              <div className="action-result-note-preview">{data.createdNote.text.slice(0, 100)}...</div>
              {onNoteClick && (
                <button
                  className="action-result-link"
                  onClick={() => onNoteClick(data.createdNote!.id)}
                >
                  View note →
                </button>
              )}
            </div>
          </div>
        </div>
      );

    case 'set_reminder':
      if (!data.reminder) return null;
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <Bell size={16} />
            <span className="action-result-title">Reminder Set</span>
          </div>
          <div className="action-result-content">
            <Calendar size={14} />
            <div className="action-result-details">
              <div className="action-result-reminder-text">{data.reminder.text}</div>
              <div className="action-result-reminder-due">
                Due: {new Date(data.reminder.dueAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      );

    case 'search_notes':
      if (!data.searchResults || data.searchResults.length === 0) {
        return (
          <div className="action-result action-result-empty">
            <Search size={16} />
            <span>No notes found</span>
          </div>
        );
      }
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <Search size={16} />
            <span className="action-result-title">Found {data.searchResults.length} note{data.searchResults.length === 1 ? '' : 's'}</span>
          </div>
          <div className="action-result-list">
            {data.searchResults.slice(0, 5).map((result, idx) => (
              <div key={idx} className="action-result-item">
                <div className="action-result-item-preview">{result.preview}</div>
                <div className="action-result-item-meta">
                  <span className="action-result-item-date">{result.date}</span>
                  {onNoteClick && (
                    <button
                      className="action-result-link"
                      onClick={() => onNoteClick(result.noteId)}
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {data.searchResults.length > 5 && (
              <div className="action-result-more">
                +{data.searchResults.length - 5} more
              </div>
            )}
          </div>
        </div>
      );

    case 'summarize_period':
      if (!data.summary) return null;
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <FileText size={16} />
            <span className="action-result-title">Summary</span>
          </div>
          <div className="action-result-content">
            <div className="action-result-summary">{data.summary}</div>
          </div>
        </div>
      );

    case 'list_action_items':
      if (!data.actionItems || data.actionItems.length === 0) {
        return (
          <div className="action-result action-result-empty">
            <List size={16} />
            <span>No action items found</span>
          </div>
        );
      }
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <List size={16} />
            <span className="action-result-title">{data.actionItems.length} Action Item{data.actionItems.length === 1 ? '' : 's'}</span>
          </div>
          <div className="action-result-list">
            {data.actionItems.map((item, idx) => (
              <div key={idx} className="action-result-item action-result-action-item">
                <div className="action-result-item-text">
                  {item.status && <span className="action-item-status">[{item.status}]</span>}
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'find_mentions':
      if (!data.mentions || data.mentions.length === 0) {
        return (
          <div className="action-result action-result-empty">
            <AtSign size={16} />
            <span>No mentions found</span>
          </div>
        );
      }
      return (
        <div className="action-result action-result-success">
          <div className="action-result-header">
            <AtSign size={16} />
            <span className="action-result-title">Found {data.mentions.length} mention{data.mentions.length === 1 ? '' : 's'}</span>
          </div>
          <div className="action-result-list">
            {data.mentions.slice(0, 5).map((mention, idx) => (
              <div key={idx} className="action-result-item">
                <div className="action-result-item-preview">{mention.context}</div>
                <div className="action-result-item-meta">
                  <span className="action-result-item-date">{mention.date}</span>
                  {onNoteClick && (
                    <button
                      className="action-result-link"
                      onClick={() => onNoteClick(mention.noteId)}
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {data.mentions.length > 5 && (
              <div className="action-result-more">
                +{data.mentions.length - 5} more
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
});

