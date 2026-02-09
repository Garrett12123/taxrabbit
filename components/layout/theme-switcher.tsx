'use client';

import * as React from 'react';
import { Check, Moon, Sun, Monitor, Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useTheme, useColorTheme } from '@/components/layout/theme-provider';
import { cn } from '@/lib/utils';

const MODE_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

function ThemePreviewSwatch({
  colors,
  isActive,
}: {
  colors: [string, string, string, string];
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition-all duration-200',
        isActive
          ? 'border-primary ring-2 ring-primary/25'
          : 'border-border hover:border-primary/40'
      )}
    >
      {/* 4-quadrant swatch */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div style={{ backgroundColor: colors[0] }} />
        <div style={{ backgroundColor: colors[1] }} />
        <div style={{ backgroundColor: colors[2] }} />
        <div style={{ backgroundColor: colors[3] }} />
      </div>
      {isActive && (
        <div className="relative z-10 flex items-center justify-center rounded-full bg-primary p-0.5">
          <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorTheme, setColorTheme, themes } = useColorTheme();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      >
        <Palette className="size-4" />
        <span>Theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Palette className="size-4" />
          <span>Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-[280px] p-0"
      >
        {/* Mode toggle */}
        <div className="p-3 pb-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Mode
          </p>
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-200',
                  theme === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Color theme grid */}
        <div className="p-3 pt-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Color
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {themes.map((t) => {
              const isActive = colorTheme === t.id;
              const previewColors = isDark ? t.previewColors.dark : t.previewColors.light;
              return (
                <button
                  key={t.id}
                  onClick={() => setColorTheme(t.id)}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all duration-150',
                    isActive
                      ? 'bg-accent'
                      : 'hover:bg-muted/60'
                  )}
                >
                  <ThemePreviewSwatch
                    colors={previewColors}
                    isActive={isActive}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs leading-tight',
                        isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
                      )}
                    >
                      {t.name}
                    </p>
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
