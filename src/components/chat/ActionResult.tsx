import { memo, type ReactNode } from 'react';
import { CheckCircle, XCircle, FileText, Bell, Search, List, AtSign, Calendar, type LucideIcon } from 'lucide-react';
import type { ActionMeta } from '@/lib/types';

const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const Header = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
  <div className="action-result-header">
    <Icon size={16} />
    <span className="action-result-title">{title}</span>
  </div>
);

const Empty = ({ icon: Icon, text }: { icon: LucideIcon; text: string }) => (
  <div className="action-result action-result-empty">
    <Icon size={16} />
    <span>{text}</span>
  </div>
);

const ResultWrapper = ({ children }: { children: ReactNode }) => (
  <div className="action-result action-result-success">{children}</div>
);

interface ListItem {
  noteId: string;
  preview?: string;
  context?: string;
  date: string;
}

const ResultList = ({
  items,
  onNoteClick,
}: {
  items: ListItem[];
  onNoteClick?: (noteId: string) => void;
}) => (
  <div className="action-result-list">
    {items.slice(0, 5).map((item, idx) => (
      <div key={idx} className="action-result-item">
        <div className="action-result-item-preview">{item.preview ?? item.context}</div>
        <div className="action-result-item-meta">
          <span className="action-result-item-date">{item.date}</span>
          {onNoteClick && (
            <button className="action-result-link" onClick={() => onNoteClick(item.noteId)}>
              View →
            </button>
          )}
        </div>
      </div>
    ))}
    {items.length > 5 && <div className="action-result-more">+{items.length - 5} more</div>}
  </div>
);

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

  switch (type) {
    case 'create_note': {
      const note = data.createdNote;
      if (!note) return null;
      return (
        <ResultWrapper>
          <Header icon={CheckCircle} title="Note Created" />
          <div className="action-result-content">
            <FileText size={14} />
            <div className="action-result-details">
              {note.title && <div className="action-result-note-title">{note.title}</div>}
              <div className="action-result-note-preview">{note.text.slice(0, 100)}...</div>
              {onNoteClick && (
                <button className="action-result-link" onClick={() => onNoteClick(note.id)}>
                  View note →
                </button>
              )}
            </div>
          </div>
        </ResultWrapper>
      );
    }

    case 'set_reminder': {
      const reminder = data.reminder;
      if (!reminder) return null;
      return (
        <ResultWrapper>
          <Header icon={Bell} title="Reminder Set" />
          <div className="action-result-content">
            <Calendar size={14} />
            <div className="action-result-details">
              <div className="action-result-reminder-text">{reminder.text}</div>
              <div className="action-result-reminder-due">Due: {new Date(reminder.dueAt).toLocaleString()}</div>
            </div>
          </div>
        </ResultWrapper>
      );
    }

    case 'search_notes': {
      const results = data.searchResults;
      if (!results?.length) return <Empty icon={Search} text="No notes found" />;
      return (
        <ResultWrapper>
          <Header icon={Search} title={`Found ${pluralize(results.length, 'note')}`} />
          <ResultList items={results} {...(onNoteClick && { onNoteClick })} />
        </ResultWrapper>
      );
    }

    case 'summarize_period':
      if (!data.summary) return null;
      return (
        <ResultWrapper>
          <Header icon={FileText} title="Summary" />
          <div className="action-result-content">
            <div className="action-result-summary">{data.summary}</div>
          </div>
        </ResultWrapper>
      );

    case 'list_action_items': {
      const items = data.actionItems;
      if (!items?.length) return <Empty icon={List} text="No action items found" />;
      return (
        <ResultWrapper>
          <Header icon={List} title={pluralize(items.length, 'Action Item')} />
          <div className="action-result-list">
            {items.map((item, idx) => (
              <div key={idx} className="action-result-item action-result-action-item">
                <div className="action-result-item-text">
                  {item.status && <span className="action-item-status">[{item.status}]</span>}
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </ResultWrapper>
      );
    }

    case 'find_mentions': {
      const mentions = data.mentions;
      if (!mentions?.length) return <Empty icon={AtSign} text="No mentions found" />;
      return (
        <ResultWrapper>
          <Header icon={AtSign} title={`Found ${pluralize(mentions.length, 'mention')}`} />
          <ResultList items={mentions} {...(onNoteClick && { onNoteClick })} />
        </ResultWrapper>
      );
    }

    default:
      return null;
  }
});
