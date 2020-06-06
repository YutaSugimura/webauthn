import firebase from '../firebase';

const db = firebase.firestore();

export const writeChallengeDate = async (userId: string): Promise<string> => {
  return await db
    .collection('challenge')
    .add({ userId, timestamp: new Date().getTime() })
    .then((docRef) => docRef.id);
};
