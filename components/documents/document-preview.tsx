'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { downloadDocumentAction } from '@/app/(modules)/documents/actions';

type DocumentPreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  filename: string;
};

export function DocumentPreview({
  open,
  onOpenChange,
  documentId,
  filename,
}: DocumentPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await downloadDocumentAction(documentId);
    if (result.error || !result.data) {
      setError(result.error ?? 'Failed to load document.');
      setLoading(false);
      return;
    }

    const { base64, mimeType: mime } = result.data;
    const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([byteArray], { type: mime });
    const url = URL.createObjectURL(blob);

    setBlobUrl(url);
    setMimeType(mime);
    setLoading(false);
  }, [documentId]);

  // Track blobUrl in a ref so cleanup always revokes the latest URL
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      loadDocument();
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        setBlobUrl(null);
        setMimeType(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId]);

  // Keep the ref in sync with state
  useEffect(() => {
    blobUrlRef.current = blobUrl;
  }, [blobUrl]);

  const handleOpenChange = (next: boolean) => {
    if (!next && blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setMimeType(null);
    }
    onOpenChange(next);
  };

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{filename}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[400px]">
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <Spinner className="size-6" />
              <p className="text-sm text-muted-foreground">
                Decrypting document...
              </p>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {blobUrl && isPdf && (
            <iframe
              src={blobUrl}
              className="h-[70vh] w-full rounded border"
              title={filename}
            />
          )}
          {blobUrl && isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt={filename}
              className="max-h-[70vh] max-w-full rounded object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
