import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getFileContent } from '@/lib/vault';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('filePath');
  const passphrase = searchParams.get('passphrase');
  const sessionId = searchParams.get('sessionId');

  if (!filePath || !passphrase || !sessionId) {
    return new NextResponse('Missing parameters: filePath, passphrase, sessionId', { status: 400 });
  }

  // Verify session
  const isValid = await verifySession(sessionId, passphrase);
  if (!isValid) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get file content
  const content = await getFileContent(sessionId, filePath);
  
  if (content === null) {
    return new NextResponse('File not found', { status: 404 });
  }

  // Return raw text
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
