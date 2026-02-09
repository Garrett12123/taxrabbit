import { redirect } from 'next/navigation';

import { isVaultConfigured } from '@/server/security/vault';
import { isAuthenticated } from '@/server/security/session';

export default async function RootPage() {
  if (!isVaultConfigured()) {
    redirect('/setup');
  }

  if (await isAuthenticated()) {
    redirect('/overview');
  }

  redirect('/unlock');
}
