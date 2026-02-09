import { NextRequest, NextResponse } from 'next/server';

import { isAuthenticated } from '@/server/security/session';
import { generateCPAPacket } from '@/server/services/export-service';
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

  const includeDocs =
    request.nextUrl.searchParams.get('includeDocs') === 'true';

  try {
    const { buffer, filename } = await generateCPAPacket({
      year,
      includeDocuments: includeDocs,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
