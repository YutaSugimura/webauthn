import client, { dbName } from '../index';
import { PublicKeyJwk } from '../../controller/utils';

const collectionName = 'credential';

interface Credential {
  id: string;
  jwk: PublicKeyJwk;
  signCount: number;
  timestamp: number;
}

interface Result {
  result: boolean
  credential?: Credential
}

export const getCredential = async(userId: string): Promise<Result> => {
  if(!client.isConnected()) {
    await client.connect();
  }

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  try {
    const { id, jwk, signCount, timestamp }: any = await collection.findOne({ userId });
    return {result: true, credential: { id, jwk, signCount, timestamp }}
  } catch {
    return { result: false }
  }
}
