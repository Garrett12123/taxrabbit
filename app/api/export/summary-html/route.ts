import { NextRequest, NextResponse } from 'next/server';

import { isAuthenticated } from '@/server/security/session';
import { getYearEndSummary } from '@/server/services/report-service';
import { generateSummaryHTML } from '@/lib/html/summary-template';
import { TAX_YEARS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const yearParam = request.nextUrl.searchParams.get('year');
  const year = yearParam ? Number(yearParam) : null;
  if (!year || !(TAX_YEARS as readonly number[]).includes(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  try {
    const summary = await getYearEndSummary(year);
    const html = generateSummaryHTML(summary);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="tax-summary-${year}.html"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
