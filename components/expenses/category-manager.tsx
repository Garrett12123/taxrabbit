'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  addCustomCategoryAction,
  deleteCustomCategoryAction,
} from '@/app/(modules)/expenses/category-actions';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import type { CustomCategoryRecord } from '@/server/db/dal/custom-categories';

type CategoryManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  customCategories: CustomCategoryRecord[];
};

export function CategoryManager({
  open,
  onOpenChange,
  year,
  customCategories,
}: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    startTransition(async () => {
      await addCustomCategoryAction({ year, name: trimmed });
      setNewName('');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteCustomCategoryAction(id);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Manage Categories</SheetTitle>
          <SheetDescription>
            View preset IRS categories and manage your custom categories for {year}.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-4">
            <div>
              <h4 className="mb-3 text-sm font-medium">IRS Categories</h4>
              <div className="flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-sm font-medium">Custom Categories</h4>
              {customCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No custom categories yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {customCategories.map((cat) => (
                    <Badge key={cat.id} variant="outline" className="gap-1 pr-1">
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        disabled={isPending}
                        className="ml-0.5 rounded-sm hover:bg-muted"
                      >
                        <X className="size-3" />
                        <span className="sr-only">Remove {cat.name}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="New category name..."
                disabled={isPending}
              />
              <Button
                onClick={handleAdd}
                disabled={isPending || !newName.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
