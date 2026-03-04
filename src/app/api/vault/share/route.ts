import { NextRequest, NextResponse } from 'next/server';
import { createSharedVault } from '@/lib/vault';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: files array is required' }, { status: 400 });
    }

    const shareId = randomBytes(8).toString('hex'); // 16 chars unique ID
    
    // Store in MongoDB
    await createSharedVault(shareId, files);

    return NextResponse.json({ shareId });
  } catch (error) {
    console.error('Share creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create shared vault' },
      { status: 500 }
    );
  }
}
