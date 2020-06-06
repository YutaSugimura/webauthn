import client, { dbName } from '../index';

const collectionName = 'credential';

export const updateCredential = async(userId: string, signCount: number): Promise<boolean> => {
  if(!client.isConnected()) {
    await client.connect();
  }

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const query = { userId };
  const newValue = { $set: { signCount, timestamp: new Date().getTime() }};

  try {
    await collection.updateOne(query, newValue);
    return true;
  } catch {
    return false;
  }
}
