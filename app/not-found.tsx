import Link from 'next/link';
import { Rabbit, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6 px-4">
        {/* Branded illustration */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-muted/60">
          <Rabbit className="size-10 text-muted-foreground/60" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-foreground/20">404</h1>
          <h2 className="text-xl font-semibold">Page Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Head back to your overview to continue.
          </p>
        </div>
        <Button asChild>
          <Link href="/overview">
            <ArrowLeft className="size-4" />
            Back to Overview
          </Link>
        </Button>
      </div>
    </div>
  );
}
