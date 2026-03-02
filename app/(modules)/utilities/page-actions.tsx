'use client';

import { useState } from 'react';
import { Plus, ClipboardPaste } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UtilityFormDialog } from '@/components/utilities/utility-form-dialog';
import { UtilityPasteDialog } from '@/components/utilities/utility-paste-dialog';

type PageActionsProps = {
  year: number;
};

export function UtilityPageActions({ year }: PageActionsProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={() => setPasteOpen(true)} size="sm" variant="outline">
          <ClipboardPaste className="size-4" />
          Quick Paste
        </Button>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="size-4" />
          Add Bill
        </Button>
      </div>
      <UtilityFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        year={year}
      />
      <UtilityPasteDialog
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        year={year}
      />
    </>
  );
}
