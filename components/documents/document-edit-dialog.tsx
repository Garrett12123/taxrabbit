'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { TagsInput } from '@/components/expenses/tags-input';
import { updateDocumentMetadataAction } from '@/app/(modules)/documents/actions';

type DocumentEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  filename: string;
  description?: string;
  tags?: string[];
};

export function DocumentEditDialog({
  open,
  onOpenChange,
  documentId,
  filename,
  description: initialDescription,
  tags: initialTags,
}: DocumentEditDialogProps) {
  const [description, setDescription] = useState(initialDescription ?? '');
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateDocumentMetadataAction(documentId, {
        description: description || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      toast.success('Document updated.');
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update metadata for &ldquo;{filename}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel>Tags</FieldLabel>
              <TagsInput
                value={tags}
                onChange={setTags}
                disabled={isPending}
              />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
