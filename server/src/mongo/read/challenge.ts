import mongodb from 'mongodb';
import client, { dbName } from '../index';

const collectionName = 'challenge';

export const getChallenge = async (id: string): Promise<{ result: boolean, userId?: string, timestamp?: number}> => {
  if(!client.isConnected()) {
    await client.connect();
  }

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const _id = new mongodb.ObjectID(id);

  try {
    const { userId, timestamp }: any = await collection.findOne({ _id });
    return { result: true, userId, timestamp }
  } catch {
    return { result: false }
  }
}
