'use client';

import { useState, useTransition, useOptimistic, useCallback } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  toggleChecklistItemAction,
  deleteChecklistItemAction,
  updateChecklistItemAction,
  addChecklistItemAction,
} from '@/app/(modules)/checklist/actions';
import type { ChecklistItemDecrypted } from '@/server/db/dal/checklist-items';

type Props = {
  year: number;
  items: ChecklistItemDecrypted[];
};

export function ChecklistList({ year, items }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  // Optimistic state for instant toggle feedback
  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (currentItems: ChecklistItemDecrypted[], update: { type: 'toggle'; id: string } | { type: 'remove'; id: string }) => {
      if (update.type === 'toggle') {
        return currentItems.map((item) =>
          item.id === update.id
            ? { ...item, completed: !item.completed }
            : item
        );
      }
      if (update.type === 'remove') {
        return currentItems.filter((item) => item.id !== update.id);
      }
      return currentItems;
    }
  );

  function handleAdd() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const result = await addChecklistItemAction({ year, title: newTitle.trim() });
      if (result.error) {
        toast.error(result.error);
      } else {
        setNewTitle('');
        toast.success('Item added.');
      }
    });
  }

  const handleToggle = useCallback((id: string) => {
    startTransition(async () => {
      // Optimistic update — checkbox toggles instantly
      addOptimistic({ type: 'toggle', id });
      const result = await toggleChecklistItemAction(id);
      if (result.error) {
        toast.error(result.error);
        // Server revalidation will revert the optimistic state
      }
    });
  }, [addOptimistic]);

  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      // Optimistic removal — item vanishes instantly
      addOptimistic({ type: 'remove', id });
      const result = await deleteChecklistItemAction(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Item removed.');
      }
    });
  }, [addOptimistic]);

  function startEditing(id: string, title: string) {
    setEditingId(id);
    setEditTitle(title);
  }

  function handleSaveEdit(id: string) {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      const result = await updateChecklistItemAction(id, editTitle.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a checklist item..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button onClick={handleAdd} disabled={isPending || !newTitle.trim()} variant="outline">
          Add
        </Button>
      </div>

      {/* Item list */}
      {optimisticItems.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No checklist items. Add your first one above.
        </p>
      ) : (
        <div className="space-y-1">
          {optimisticItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 group',
                'transition-all duration-200 ease-out',
                'hover:bg-muted/50',
              )}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggle(item.id)}
              />
              {editingId === item.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(item.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleSaveEdit(item.id)}
                    disabled={isPending}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      'transition-all duration-300 ease-out',
                      item.completed && 'line-through text-muted-foreground opacity-60',
                    )}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground"
                      onClick={() => startEditing(item.id, item.title)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
