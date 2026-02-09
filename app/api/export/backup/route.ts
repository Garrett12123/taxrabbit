import { NextResponse } from 'next/server';

import { isAuthenticated } from '@/server/security/session';
import { createBackup } from '@/server/services/backup-service';

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { buffer, filename } = await createBackup();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Backup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
