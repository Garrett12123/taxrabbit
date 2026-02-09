export const dynamic = 'force-dynamic';

import { getSettings } from '@/server/services/settings-service';
import { listPersonProfilesByYear } from '@/server/db/dal/person-profiles';
import { getBusinessProfileForYear } from '@/server/services/business-service';
import { listCustomCategories } from '@/server/db/dal/custom-categories';
import { SecurityTab } from '@/components/settings/security-tab';
import { PreferencesTab } from '@/components/settings/preferences-tab';
import { PersonalTab } from '@/components/settings/personal-tab';
import { BusinessTab } from '@/components/settings/business-tab';
import { CategoriesTab } from '@/components/settings/categories-tab';
import { SettingsNav } from './settings-nav';

type SettingsPageProps = {
  searchParams: Promise<{ year?: string; tab?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const settings = await getSettings();
  const year = params.year ? Number(params.year) : settings.defaultTaxYear;
  const activeTab = params.tab ?? 'security';

  const [personProfiles, businessProfile, customCategories] = await Promise.all([
    listPersonProfilesByYear(year),
    getBusinessProfileForYear(year),
    listCustomCategories(year),
  ]);

  const personProfile = personProfiles[0] ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your vault, security, and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Vertical nav on desktop, horizontal scroll on mobile */}
        <SettingsNav activeTab={activeTab} />

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          <div className="rounded-lg border bg-card p-6">
            {activeTab === 'security' && (
              <SecurityTab
                lockTimeoutMinutes={settings.lockTimeoutMinutes}
                deviceKeyEnabled={settings.deviceKeyEnabled}
              />
            )}
            {activeTab === 'preferences' && (
              <PreferencesTab defaultTaxYear={settings.defaultTaxYear} />
            )}
            {activeTab === 'personal' && (
              <PersonalTab
                defaultTaxYear={year}
                initialProfile={personProfile}
              />
            )}
            {activeTab === 'business' && (
              <BusinessTab
                defaultTaxYear={year}
                initialProfile={businessProfile}
              />
            )}
            {activeTab === 'categories' && (
              <CategoriesTab
                defaultTaxYear={year}
                initialCustomCategories={customCategories}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
