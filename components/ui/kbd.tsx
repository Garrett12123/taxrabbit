import { cn } from '@/lib/utils';

type KbdProps = React.ComponentProps<'kbd'> & {
  /** Render as a single key or a combination */
  variant?: 'default' | 'outline';
};

/**
 * Keyboard shortcut display component.
 * Use for showing keyboard shortcuts in tooltips, menus, or help text.
 *
 * @example
 * <Kbd>⌘</Kbd><Kbd>K</Kbd>
 * <Kbd>Ctrl</Kbd>+<Kbd>S</Kbd>
 */
function Kbd({ className, variant = 'default', children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5',
        'font-sans text-[11px] font-medium',
        'select-none',
        variant === 'default' && [
          'bg-muted text-muted-foreground',
          'border border-border/50',
          'shadow-[0_1px_0_1px_rgba(0,0,0,0.04)]',
        ],
        variant === 'outline' && [
          'bg-transparent text-muted-foreground',
          'border border-border',
        ],
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

/**
 * Common keyboard shortcuts as constants
 */
const KeyboardShortcuts = {
  // Modifiers
  cmd: '⌘',
  ctrl: 'Ctrl',
  alt: '⌥',
  shift: '⇧',
  enter: '↵',
  esc: 'Esc',
  tab: '⇥',
  delete: '⌫',
  // Arrows
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
} as const;

export { Kbd, KeyboardShortcuts };
