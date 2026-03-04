import { NextRequest, NextResponse } from 'next/server';
import { verifySession, saveFile } from '@/lib/vault';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, passphrase, files } = await req.json();

    if (!sessionId || !passphrase || !files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const isValid = await verifySession(sessionId, passphrase);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process files in parallel
    const uploadPromises = files.map(file => saveFile(sessionId, file.path, file.content));
    await Promise.all(uploadPromises);

    return NextResponse.json({ success: true, count: files.length });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
