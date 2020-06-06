import Result from '../interface';
import { writeChallenge } from '../../mongo/write/challenge';
import { getCredential } from '../../mongo/read/credential';

type Request = {
  body: {
    userId?: string
  }
}

const controller = async(req: Request): Promise<Result> => {
  const result: Result = { code: 200, message: 'Success' };

  const body = req.body;
  const userId = body.userId;
  if (!userId) {
    result.code = 400;
    result.message = 'Bad Request';
    return result;
  }

  try {
    const credential = await getCredential(userId);
    if(!credential.result || !credential.credential) {
      result.code = 400;
      result.message = 'Bad Request';
      return result;
    }

    const data = await writeChallenge(userId);
    result.data = { challenge: data.id, credentialId: credential.credential.id };
  } catch {
    result.code = 500;
    result.message = 'Server Error';
  }
  return result;
}
export default controller;
