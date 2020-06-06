import firebase from '../firebase';

const db = firebase.firestore();

export const getChallengeData = async (
  doc: string,
): Promise<{ userId?: string; timestamp?: number }> => {
  const challengeRef = await db.collection('challenge').doc(doc).get();
  const challengeDoc = challengeRef.data();

  if (challengeDoc) {
    return { userId: challengeDoc.userId, timestamp: challengeDoc.timestamp };
  } else {
    return {};
  }
};
