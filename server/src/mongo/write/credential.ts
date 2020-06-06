import client, { dbName } from '../index';
import { PublicKeyJwk } from '../../controller/utils';

const collectionName = 'credential';

export const writeCredential = async(userId: string, id: string, publicKeyJwk: PublicKeyJwk, signCount: number): Promise<boolean> => {
  if(!client.isConnected()) {
    await client.connect();
  }

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  try {
    await collection.insertOne({_id: userId, userId, id, jwk: publicKeyJwk, signCount, timestamp: new Date().getTime()});
    return true;
  } catch {
    return false;
  }
}
