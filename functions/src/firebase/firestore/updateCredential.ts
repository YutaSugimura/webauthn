import firebase from '../firebase';

const db = firebase.firestore();

export const updateCredentialData = async (userId: string, signCount: number): Promise<boolean> => {
  try {
    await db.collection('credential').doc(userId).update({
      signCount,
      timestamp: new Date().getTime(),
    });
    return true;
  } catch {
    return false;
  }
};
