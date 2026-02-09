'use client';

import { useState, useTransition } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  linkDocumentAction,
  unlinkDocumentAction,
} from '@/app/(modules)/documents/actions';

type LinkableEntity = {
  id: string;
  label: string;
};

type DocumentLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  filename: string;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  incomeDocs: LinkableEntity[];
  expenses: LinkableEntity[];
};

export function DocumentLinkDialog({
  open,
  onOpenChange,
  documentId,
  filename,
  linkedEntityType,
  linkedEntityId,
  incomeDocs,
  expenses,
}: DocumentLinkDialogProps) {
  const isLinked = !!linkedEntityType && !!linkedEntityId;
  const [entityType, setEntityType] = useState<string>(
    linkedEntityType ?? 'income'
  );
  const [entityId, setEntityId] = useState<string>(linkedEntityId ?? '');
  const [isPending, startTransition] = useTransition();

  const entities = entityType === 'income' ? incomeDocs : expenses;

  const handleLink = () => {
    if (!entityId) return;
    startTransition(async () => {
      const result = await linkDocumentAction(documentId, entityType, entityId);
      if (result.success) {
        onOpenChange(false);
      }
    });
  };

  const handleUnlink = () => {
    startTransition(async () => {
      const result = await unlinkDocumentAction(documentId);
      if (result.success) {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLinked ? 'Manage Link' : 'Link Document'}
          </DialogTitle>
          <DialogDescription>
            {isLinked
              ? `"${filename}" is currently linked. You can change or remove the link.`
              : `Link "${filename}" to an income form or expense.`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Entity Type</FieldLabel>
              <Select
                value={entityType}
                onValueChange={(v) => {
                  setEntityType(v);
                  setEntityId('');
                }}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income Document</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{entityType === 'income' ? 'Income Document' : 'Expense'}</FieldLabel>
              <Select
                value={entityId}
                onValueChange={setEntityId}
                disabled={isPending || entities.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      entities.length === 0
                        ? 'No items available'
                        : 'Select...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          {isLinked && (
            <Button
              variant="outline"
              onClick={handleUnlink}
              disabled={isPending}
              className="mr-auto"
            >
              {isPending ? 'Unlinking...' : 'Unlink'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={isPending || !entityId}>
            {isPending ? 'Linking...' : 'Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
