import { NextRequest, NextResponse } from 'next/server';
import { createSharedVault } from '@/lib/vault';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { files, shareType = 'full' } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: files array is required' }, { status: 400 });
    }

    const shareId = randomBytes(8).toString('hex'); // 16 chars unique ID
    
    // Store in MongoDB with full project metadata
    await createSharedVault(shareId, files);

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/shared/${shareId}`;
    
    // Generate AI context template
    const aiContextTemplate = `Hello AI, I am sharing my project context. Access it here: ${shareUrl}`;

    return NextResponse.json({ 
      shareId,
      shareType,
      url: shareUrl,
      aiContextTemplate
    });
  } catch (error) {
    console.error('Share full creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create shared vault' },
      { status: 500 }
    );
  }
}
