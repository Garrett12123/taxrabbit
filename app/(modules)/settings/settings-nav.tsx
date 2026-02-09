'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Shield, SlidersHorizontal, User, Building2, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_TABS = [
  { id: 'security', label: 'Security', description: 'Password, lock timeout, device key', icon: Shield },
  { id: 'preferences', label: 'Preferences', description: 'Default tax year, display options', icon: SlidersHorizontal },
  { id: 'personal', label: 'Personal', description: 'Name, SSN, filing status', icon: User },
  { id: 'business', label: 'Business', description: 'LLC / business profile info', icon: Building2 },
  { id: 'categories', label: 'Categories', description: 'Custom expense categories', icon: Tags },
] as const;

type SettingsNavProps = {
  activeTab: string;
};

export function SettingsNav({ activeTab }: SettingsNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabId);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <>
      {/* Desktop: Vertical sidebar nav */}
      <nav className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20 space-y-0.5">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                  "transition-colors duration-150",
                  "relative",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className={cn(
                  "size-4 shrink-0",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )} />
                <div className="min-w-0">
                  <div className={cn(
                    "text-sm leading-tight",
                    isActive ? "font-medium" : "font-normal"
                  )}>
                    {tab.label}
                  </div>
                  <div className="text-[11px] leading-tight text-muted-foreground mt-0.5 truncate">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile: Horizontal scrollable tabs */}
      <div className="overflow-x-auto -mx-6 px-6 lg:hidden">
        <div className="flex gap-1.5 w-max">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-foreground text-background font-medium"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
