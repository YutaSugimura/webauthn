import client, { dbName } from '../index';

const collectionName = 'challenge';

export const writeChallenge = async (userId: string): Promise<{ result: boolean, id?: string }> => {
  if(!client.isConnected()) {
    await client.connect();
  }

  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  try {
    const result = await collection.insertOne({ userId, timestamp: new Date().getTime() });
    return { result: true, id: result.insertedId };
  } catch {
    return { result: false }
  }
}
