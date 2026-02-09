import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function WarningAlert({
  className,
  ...props
}: React.ComponentProps<typeof Alert>) {
  return (
    <Alert
      className={cn(
        'border-warning/50 bg-warning/10 text-warning-foreground [&>svg]:text-warning',
        className
      )}
      {...props}
    />
  );
}
