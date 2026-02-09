import { Upload, FileText, Columns3, Eye, Building2, DollarSign, Pencil, Table, FileSpreadsheet } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ImportsPageActions } from './page-actions';
import { getDefaultTaxYear } from '@/server/services/settings-service';
import { TAX_YEARS } from '@/lib/constants';

type ImportsPageProps = {
  searchParams: Promise<{
    year?: string;
  }>;
};

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && !isNaN(yearParam) && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Imports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Import data from CSV files and quickly add income forms for {year}.
          </p>
        </div>
        <ImportsPageActions year={year} />
      </div>

      {/* Stepper-style cards with numbered steps and connecting lines */}
      <div className="relative grid gap-6 md:grid-cols-3">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-14 left-[calc(16.67%+12px)] right-[calc(16.67%+12px)] h-px bg-border z-0" />

        <Card className="relative z-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                1
              </div>
              <CardTitle className="text-base">CSV Import</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Import expenses from CSV files exported by your bank or
              accounting software. Map columns, preview, and import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Upload className="size-3.5 text-muted-foreground/60 shrink-0" />
                Upload .csv or .txt files
              </li>
              <li className="flex items-center gap-2">
                <Columns3 className="size-3.5 text-muted-foreground/60 shrink-0" />
                Auto-detect column mappings
              </li>
              <li className="flex items-center gap-2">
                <Eye className="size-3.5 text-muted-foreground/60 shrink-0" />
                Preview and validate before import
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative z-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                2
              </div>
              <CardTitle className="text-base">Quick Add W-2</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Quickly enter the key fields from your W-2. Employer
              name, wages, and withholding. Fill in more boxes later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Building2 className="size-3.5 text-muted-foreground/60 shrink-0" />
                Employer name and entity type
              </li>
              <li className="flex items-center gap-2">
                <DollarSign className="size-3.5 text-muted-foreground/60 shrink-0" />
                Box 1 (wages) and Box 2 (withheld)
              </li>
              <li className="flex items-center gap-2">
                <Pencil className="size-3.5 text-muted-foreground/60 shrink-0" />
                Edit all fields later in Income
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative z-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                3
              </div>
              <CardTitle className="text-base">Templates</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Download CSV templates with the correct column headers. Fill
              them out in a spreadsheet, then import the completed file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Table className="size-3.5 text-muted-foreground/60 shrink-0" />
                Expense template with all fields
              </li>
              <li className="flex items-center gap-2">
                <FileText className="size-3.5 text-muted-foreground/60 shrink-0" />
                W-2 template with box columns
              </li>
              <li className="flex items-center gap-2">
                <FileSpreadsheet className="size-3.5 text-muted-foreground/60 shrink-0" />
                Works with any spreadsheet app
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
