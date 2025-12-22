/**
 * FileAttachment component
 * Displays uploaded file attachments with previews and actions
 */

import { memo, useCallback, useMemo } from 'react';
import { X, Image, FileText, Music, File, Loader } from 'lucide-react';
import type { UploadedFile, FileType } from '../../hooks/useFileUpload';
import type { LucideIcon } from 'lucide-react';

interface FileAttachmentProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  compact?: boolean;
}

/** Icon mapping for file types */
const FILE_ICONS: Record<FileType, LucideIcon> = {
  image: Image,
  pdf: FileText,
  audio: Music,
  document: File,
};

/** Format file size */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FileAttachment = memo(function FileAttachment({
  file,
  onRemove,
  compact = false,
}: FileAttachmentProps) {
  const handleRemove = useCallback(() => {
    onRemove(file.id);
  }, [file.id, onRemove]);

  const Icon = useMemo(() => FILE_ICONS[file.type] || File, [file.type]);
  const isLoading = file.status === 'uploading' || file.status === 'pending';
  const hasError = file.status === 'error';

  if (compact) {
    return (
      <div className={`file-chip ${hasError ? 'error' : ''}`}>
        {file.thumbnail ? (
          <img src={file.thumbnail} alt="" className="file-chip-thumb" />
        ) : (
          <Icon size={14} />
        )}
        <span className="file-chip-name">{file.name}</span>
        {isLoading && <Loader size={12} className="file-chip-loader" />}
        <button
          className="file-chip-remove"
          onClick={handleRemove}
          aria-label={`Remove ${file.name}`}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={`file-attachment ${hasError ? 'error' : ''}`}>
      <div className="file-preview">
        {file.type === 'image' && file.url ? (
          <img src={file.url} alt={file.name} className="file-preview-image" />
        ) : (
          <div className="file-preview-icon">
            <Icon size={24} />
          </div>
        )}
        {isLoading && (
          <div className="file-upload-overlay">
            <Loader size={20} className="spinning" />
            <span>{file.uploadProgress}%</span>
          </div>
        )}
      </div>
      <div className="file-info">
        <span className="file-name" title={file.name}>
          {file.name}
        </span>
        <span className="file-size">{formatSize(file.size)}</span>
        {hasError && file.error && (
          <span className="file-error">{file.error}</span>
        )}
      </div>
      <button
        className="file-remove"
        onClick={handleRemove}
        aria-label={`Remove ${file.name}`}
      >
        <X size={16} />
      </button>
    </div>
  );
});

interface FileAttachmentListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
  compact?: boolean;
}

export const FileAttachmentList = memo(function FileAttachmentList({
  files,
  onRemove,
  compact = false,
}: FileAttachmentListProps) {
  if (files.length === 0) return null;

  return (
    <div className={`file-list ${compact ? 'compact' : ''}`}>
      {files.map(file => (
        <FileAttachment
          key={file.id}
          file={file}
          onRemove={onRemove}
          compact={compact}
        />
      ))}
    </div>
  );
});

