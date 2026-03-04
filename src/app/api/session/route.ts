import { NextResponse } from 'next/server';
import { createSession } from '@/lib/vault';
import { randomBytes } from 'crypto';

function generateId(length: number = 16) {
  return randomBytes(length).toString('hex');
}

export async function POST() {
  try {
    const sessionId = generateId(8); // 16 chars
    const passphrase = generateId(12); // 24 chars
    
    await createSession(sessionId, passphrase);

    return NextResponse.json({ sessionId, passphrase });
  } catch {
    // Error is already logged in lib/vault.ts
    return NextResponse.json(
      { error: '❌ AUTH FAILED: CHECK ATLAS USER' },
      { status: 500 }
    );
  }
}
