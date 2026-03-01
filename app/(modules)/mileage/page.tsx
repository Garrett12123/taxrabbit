import { Car, MapPin } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MileageForm } from '@/components/mileage/mileage-form';
import { MileageDeleteButton } from '@/components/mileage/mileage-delete-button';
import { MileageEditButton } from '@/components/mileage/mileage-edit-button';
import { ExportCsvButton } from '@/components/common/export-csv-button';
import {
  getMileageSummary,
  listMileageLogsByYear,
  getIrsMileageRateTenths,
} from '@/server/services/mileage-service';
import { formatCents } from '@/lib/utils';
import { TAX_YEARS } from '@/lib/constants';
import { getDefaultTaxYear } from '@/server/services/settings-service';

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function MileagePage({ searchParams }: Props) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  const [summary, logs] = await Promise.all([
    Promise.resolve(getMileageSummary(year)),
    listMileageLogsByYear(year),
  ]);

  const rateTenths = getIrsMileageRateTenths(year);
  const displayMiles = (stored: number) => (stored / 100).toFixed(1);
  const displayRate = (rateTenths / 1000).toFixed(rateTenths % 10 !== 0 ? 3 : 2);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Mileage Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log business miles for {year}. IRS rate: ${displayRate}/mile.
          </p>
        </div>
        {logs.length > 0 && <ExportCsvButton module="mileage" year={year} />}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Miles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold tabular-nums">
              {displayMiles(summary.totalMiles)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalTrips} trip{summary.totalTrips !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </CardMetric>

        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated Deduction
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold tabular-nums text-positive">
              {formatCents(summary.totalDeduction)}
            </span>
          </CardContent>
        </CardMetric>

        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold tabular-nums">
              ${displayRate}
            </span>
            <p className="text-xs text-muted-foreground mt-1">per mile (IRS {year})</p>
          </CardContent>
        </CardMetric>
      </div>

      {/* Form + Log: stacked on mobile, side-by-side on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Log a Trip</CardTitle>
            <CardDescription>Record business miles driven</CardDescription>
          </CardHeader>
          <CardContent>
            <MileageForm year={year} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trip Log</CardTitle>
            <CardDescription>
              {logs.length} trip{logs.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="py-8 text-center">
                <Car className="mx-auto size-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No trips logged yet. Start by adding a business trip.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-2 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Trip info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="hidden sm:flex size-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <MapPin className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {displayMiles(log.miles)} miles
                          {log.payload?.destination && (
                            <span className="text-muted-foreground font-normal">
                              {' '}— {log.payload.destination}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {log.date}
                          </Badge>
                          {log.payload?.purpose && <span>{log.payload.purpose}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions + amount */}
                    <div className="flex items-center gap-3 shrink-0 pl-0 sm:pl-2">
                      <span className="text-xs font-mono tabular-nums text-positive">
                        {formatCents(Math.round((log.miles * rateTenths) / 1000))}
                      </span>
                      <MileageEditButton
                        id={log.id}
                        year={year}
                        date={log.date}
                        miles={log.miles}
                        destination={log.payload?.destination}
                        purpose={log.payload?.purpose}
                        isRoundTrip={log.payload?.isRoundTrip}
                      />
                      <MileageDeleteButton id={log.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
