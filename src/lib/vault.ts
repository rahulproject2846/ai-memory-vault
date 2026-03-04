import clientPromise from './mongodb';

const DB_NAME = 'vault';
const SESSIONS_COLLECTION = 'sessions';
const FILES_COLLECTION = 'files';

export async function createSession(sessionId: string, passphraseHash: string) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    await db.collection(SESSIONS_COLLECTION).insertOne({
      sessionId,
      passphraseHash,
      createdAt: new Date(),
    });
    console.log(`✅ Session Created: ${sessionId}`);
  } catch (error) {
    console.error('❌ AUTH FAILED: CHECK ATLAS USER');
    throw error;
  }
}

export async function verifySession(sessionId: string, passphraseHash: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const session = await db.collection(SESSIONS_COLLECTION).findOne({
    sessionId,
    passphraseHash,
  });
  return !!session;
}

export async function saveFile(sessionId: string, path: string, content: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  // Upsert file content
  await db.collection(FILES_COLLECTION).updateOne(
    { sessionId, path },
    { $set: { sessionId, path, content, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getFiles(sessionId: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection(FILES_COLLECTION).find({ sessionId }).project({ path: 1, _id: 0 }).toArray();
}

export async function getFileContent(sessionId: string, path: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const file = await db.collection(FILES_COLLECTION).findOne({ sessionId, path });
  return file ? file.content : null;
}

const SHARED_VAULTS_COLLECTION = 'shared_vaults';

export async function createSharedVault(shareId: string, files: { path: string, content: string }[]) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection(SHARED_VAULTS_COLLECTION).insertOne({
    shareId,
    files,
    createdAt: new Date(),
  });
}

export async function getSharedVault(shareId: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection(SHARED_VAULTS_COLLECTION).findOne({ shareId });
}
