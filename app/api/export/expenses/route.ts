import { NextRequest, NextResponse } from 'next/server';

import { isAuthenticated } from '@/server/security/session';
import { exportExpensesCsv } from '@/server/services/export-service';
import { getDefaultTaxYear } from '@/server/services/settings-service';

export async function GET(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : getDefaultTaxYear();

  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  try {
    const csv = await exportExpensesCsv(year);
    const filename = `expenses-${year}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
