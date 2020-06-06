import functions from 'firebase-functions';
import Result from '../../interface';
import { writeChallengeDate } from '../../firebase/firestore/writeChallenge';

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
    const challenge = await writeChallengeDate(userId);
    result.data = { challenge };
  } catch {
    result.code = 500;
    result.message = 'Server Error';
  }
  return result;
};
export default challengeFunc;
