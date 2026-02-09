'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { uploadDocumentAction } from '@/app/(modules)/documents/actions';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ACCEPT_STRING = '.pdf,.jpg,.jpeg,.png,.webp,.gif';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

type FileEntry = {
  file: File;
  status: FileStatus;
  error?: string;
};

type UploadDropzoneProps = {
  year: number;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function UploadDropzone({ year }: UploadDropzoneProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported file type: ${file.type || 'unknown'}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File exceeds 50MB limit.';
    }
    return null;
  };

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const entries: FileEntry[] = newFiles.map((file) => {
        const validationError = validateFile(file);
        return {
          file,
          status: validationError ? ('error' as const) : ('pending' as const),
          error: validationError ?? undefined,
        };
      });
      setFiles((prev) => [...prev, ...entries]);
    },
    []
  );

  const processUploads = useCallback(async () => {
    setIsUploading(true);

    setFiles((current) => {
      const updated = [...current];
      const pendingFiles = updated.filter((f) => f.status === 'pending');

      // Process sequentially using a chain
      let chain = Promise.resolve();
      for (const entry of pendingFiles) {
        chain = chain.then(async () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === entry.file ? { ...f, status: 'uploading' as const } : f
            )
          );

          const formData = new FormData();
          formData.set('file', entry.file);
          formData.set('year', String(year));

          const result = await uploadDocumentAction(formData);

          setFiles((prev) =>
            prev.map((f) =>
              f.file === entry.file
                ? {
                    ...f,
                    status: result.success
                      ? ('success' as const)
                      : ('error' as const),
                    error: result.error,
                  }
                : f
            )
          );
        });
      }

      chain
        .then(() => setIsUploading(false))
        .catch((err) => {
          console.error('Upload chain failed:', err);
          setIsUploading(false);
        });
      return updated;
    });
  }, [year]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      if (selected.length > 0) {
        addFiles(selected);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [addFiles]
  );

  const hasPending = files.some((f) => f.status === 'pending');

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, JPEG, PNG, WebP, GIF up to 50MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((entry, index) => (
            <div
              key={`${entry.file.name}-${index}`}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
            >
              {entry.file.type === 'application/pdf' ? (
                <FileText className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {entry.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(entry.file.size)}
                </p>
              </div>
              <div className="shrink-0">
                {entry.status === 'pending' && (
                  <span className="text-xs text-muted-foreground">Ready</span>
                )}
                {entry.status === 'uploading' && (
                  <Spinner className="size-4" />
                )}
                {entry.status === 'success' && (
                  <CheckCircle2 className="size-4 text-green-500" />
                )}
                {entry.status === 'error' && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="size-4 text-destructive" />
                    {entry.error && (
                      <span className="text-xs text-destructive">
                        {entry.error}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {hasPending && (
            <Button
              onClick={processUploads}
              disabled={isUploading}
              className="mt-2"
            >
              {isUploading ? (
                <>
                  <Spinner className="size-4" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Upload {files.filter((f) => f.status === 'pending').length}{' '}
                  file{files.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
