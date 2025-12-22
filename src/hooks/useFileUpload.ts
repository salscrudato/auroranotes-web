/**
 * useFileUpload - Hook for handling file uploads with progress tracking
 * 
 * Supports images, PDFs, audio files, and documents.
 * Provides drag-and-drop support, validation, and upload progress.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/** Supported file types */
export type FileType = 'image' | 'pdf' | 'audio' | 'document';

/** Uploaded file info */
export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  url?: string;           // Preview URL (blob or uploaded)
  uploadProgress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  file: File;
  thumbnail?: string;     // Base64 thumbnail for images
}

/** Upload configuration */
export interface FileUploadConfig {
  maxFileSizeMb?: number;
  maxFiles?: number;
  acceptedTypes?: FileType[];
  onUpload?: (file: UploadedFile) => Promise<string>; // Returns URL
}

/** Accepted MIME types for each file type */
const MIME_TYPE_MAP: Record<FileType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
  pdf: ['application/pdf'],
  audio: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac', 'audio/m4a'],
  document: ['text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

/** Determine file type from MIME type */
function getFileType(mimeType: string): FileType | null {
  for (const [type, mimes] of Object.entries(MIME_TYPE_MAP)) {
    if (mimes.some(m => mimeType.startsWith(m.split('/')[0]) && mimeType.includes(m.split('/')[1]))) {
      return type as FileType;
    }
  }
  // Fallback checks
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return null;
}

/** Generate a unique ID */
function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Create image thumbnail */
async function createThumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined;

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const maxSize = 80;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(undefined);
    img.src = URL.createObjectURL(file);
  });
}

export interface UseFileUploadReturn {
  files: UploadedFile[];
  isDragging: boolean;
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  getAcceptString: () => string;
  totalSize: number;
  hasErrors: boolean;
}

const DEFAULT_CONFIG: Required<FileUploadConfig> = {
  maxFileSizeMb: 10,
  maxFiles: 5,
  acceptedTypes: ['image', 'pdf', 'audio', 'document'],
  onUpload: async () => '',
};

export function useFileUpload(config: FileUploadConfig = {}): UseFileUploadReturn {
  // onUpload is available in config but not currently used (placeholder for future implementation)
  const { maxFileSizeMb, maxFiles, acceptedTypes } = { ...DEFAULT_CONFIG, ...config };

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Add files with validation
  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList);
    const maxSizeBytes = maxFileSizeMb * 1024 * 1024;

    const newFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      if (files.length + newFiles.length >= maxFiles) {
        break;
      }

      const fileType = getFileType(file.type);

      // Validate file type
      if (!fileType || !acceptedTypes.includes(fileType)) {
        continue; // Skip unsupported files
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        newFiles.push({
          id: generateId(),
          name: file.name,
          type: fileType,
          mimeType: file.type,
          size: file.size,
          uploadProgress: 0,
          status: 'error',
          error: `File too large (max ${maxFileSizeMb}MB)`,
          file,
        });
        continue;
      }

      // Create thumbnail for images
      const thumbnail = await createThumbnail(file);

      newFiles.push({
        id: generateId(),
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadProgress: 0,
        status: 'pending',
        file,
        thumbnail,
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, maxFileSizeMb, acceptedTypes]);

  // Remove a file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    files.forEach(f => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    setFiles([]);
  }, [files]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.url) URL.revokeObjectURL(f.url);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag event handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  // Generate accept string for file input
  const getAcceptString = useCallback((): string => {
    const mimes: string[] = [];
    for (const type of acceptedTypes) {
      mimes.push(...MIME_TYPE_MAP[type]);
    }
    return mimes.join(',');
  }, [acceptedTypes]);

  // Computed values
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const hasErrors = files.some(f => f.status === 'error');

  return {
    files,
    isDragging,
    addFiles,
    removeFile,
    clearFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    getAcceptString,
    totalSize,
    hasErrors,
  };
}

