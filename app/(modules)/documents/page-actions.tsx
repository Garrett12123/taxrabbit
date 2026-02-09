'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UploadDropzone } from '@/components/documents/upload-dropzone';

type DocumentPageActionsProps = {
  year: number;
  variant?: 'default' | 'empty';
};

export function DocumentPageActions({ year, variant = 'default' }: DocumentPageActionsProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setUploadOpen(true)}
        size={variant === 'empty' ? 'lg' : 'default'}
      >
        <Plus className="size-4" />
        {variant === 'empty' ? 'Upload Your First Document' : 'Upload'}
      </Button>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <UploadDropzone year={year} />
        </DialogContent>
      </Dialog>
    </>
  );
}
