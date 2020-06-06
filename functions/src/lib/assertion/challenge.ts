import functions from 'firebase-functions';
import Result from '../../interface';
import { writeChallengeDate } from '../../firebase/firestore/writeChallenge';
import { getCredentialData } from '../../firebase/firestore/getCredential';

const challengeFunc = async (req: functions.Request): Promise<Result> => {
  const result: Result = { code: 200, message: 'Success' };

  const body = req.body ? req.body : undefined;
  if (!body) {
    result.code = 400;
    result.message = 'Bad Request';
    return result;
  }
  const userId = body.userId;

  try {
    const credential = await getCredentialData(userId);
    if (!credential.id) {
      result.code = 400;
      result.message = 'Bad Request';
      return result;
    }
    const challenge = await writeChallengeDate(userId);
    result.data = {
      challenge,
      credentialId: credential.id,
    };
  } catch {
    result.code = 500;
    result.message = 'Server Error';
  }

  return result;
};
export default challengeFunc;
