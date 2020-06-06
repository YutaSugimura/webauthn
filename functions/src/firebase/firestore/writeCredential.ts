import firebase from '../firebase';
import { PublicKeyJwk } from '../../utils';

const db = firebase.firestore();

export const writeCredentialData = async (
  userId: string,
  id: string,
  publicKeyJwk: PublicKeyJwk,
  signCount: number,
): Promise<boolean> => {
  try {
    await db.collection('credential').doc(userId).set({
      id,
      jwk: publicKeyJwk,
      signCount,
      timestamp: new Date().getTime(),
    });
    return true;
  } catch {
    return false;
  }
};
