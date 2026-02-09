'use client';

import { useEffect, useState, useTransition, useOptimistic, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  addCategoryAction,
  deleteCategoryAction,
  getCustomCategoriesForYear,
} from '@/app/(modules)/settings/actions';
import { EXPENSE_CATEGORIES, TAX_YEARS } from '@/lib/constants';
import type { CustomCategoryRecord } from '@/server/db/dal/custom-categories';

type CategoriesTabProps = {
  defaultTaxYear: number;
  initialCustomCategories?: CustomCategoryRecord[];
};

export function CategoriesTab({
  defaultTaxYear,
  initialCustomCategories,
}: CategoriesTabProps) {
  const [year, setYear] = useState(defaultTaxYear);
  const [customCategories, setCustomCategories] = useState<CustomCategoryRecord[]>(
    initialCustomCategories ?? []
  );
  const [newName, setNewName] = useState('');
  const [isPending, startTransition] = useTransition();

  // Optimistic state for instant removal feedback
  const [optimisticCategories, addOptimistic] = useOptimistic(
    customCategories,
    (current: CustomCategoryRecord[], removedId: string) =>
      current.filter((cat) => cat.id !== removedId)
  );

  useEffect(() => {
    if (year === defaultTaxYear && initialCustomCategories !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomCategories(initialCustomCategories ?? []);
      return;
    }

    getCustomCategoriesForYear(year)
      .then(setCustomCategories)
      .catch((err) => {
        console.error('Failed to load custom categories:', err);
        toast.error('Failed to load custom categories.');
      });
  }, [year, defaultTaxYear, initialCustomCategories]);

  function handleAdd() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await addCategoryAction({ year, name: newName.trim() });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNewName('');
      const updated = await getCustomCategoriesForYear(year);
      setCustomCategories(updated);
      toast.success('Category added.');
    });
  }

  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      // Optimistic removal
      addOptimistic(id);
      const result = await deleteCategoryAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const updated = await getCustomCategoriesForYear(year);
      setCustomCategories(updated);
      toast.success('Category deleted.');
    });
  }, [addOptimistic, year]);

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Tax Year</FieldLabel>
        <NativeSelect
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {TAX_YEARS.map((y) => (
            <NativeSelectOption key={y} value={y}>
              {y}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Card>
        <CardHeader>
          <CardTitle>IRS Categories</CardTitle>
          <CardDescription>
            Built-in expense categories from Schedule C.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {EXPENSE_CATEGORIES.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Categories</CardTitle>
          <CardDescription>
            Add your own expense categories for {year}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {optimisticCategories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {optimisticCategories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="outline"
                  className={cn(
                    'gap-1 pr-1',
                    'transition-all duration-200 ease-out',
                    'animate-in fade-in-0 slide-in-from-left-1',
                  )}
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isPending}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors duration-150"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No custom categories for {year}.
            </p>
          )}

          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleAdd}
                      disabled={isPending || !newName.trim()}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </span>
                </TooltipTrigger>
                {!newName.trim() && (
                  <TooltipContent>
                    Enter a category name to add
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
