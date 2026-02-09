import { redirect } from 'next/navigation';

import { isVaultConfigured } from '@/server/security/vault';
import { isAuthenticated } from '@/server/security/session';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isVaultConfigured() && (await isAuthenticated())) {
    redirect('/overview');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30">
      {/* Subtle radial gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(from_var(--primary)_l_c_h/0.04)_0%,_transparent_70%)]" />
      {/* Faint dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {children}
      </div>
    </div>
  );
}
