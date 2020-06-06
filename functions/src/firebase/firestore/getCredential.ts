import firebase from '../firebase';
import { PublicKeyJwk } from '../../utils';

interface Credential {
  id?: string;
  jwk?: PublicKeyJwk;
  signCount?: number;
  timestamp?: number;
}

const db = firebase.firestore();

export const getCredentialData = async (userId: string): Promise<Credential> => {
  try {
    const credentialRef = await db.collection('credential').doc(userId).get();
    const credentialDoc = credentialRef.data();
    if (credentialDoc) {
      return {
        id: credentialDoc.id,
        jwk: credentialDoc.jwk,
        signCount: credentialDoc.signCount,
        timestamp: credentialDoc.timestamp,
      };
    }
    return {};
  } catch {
    return {};
  }
};
