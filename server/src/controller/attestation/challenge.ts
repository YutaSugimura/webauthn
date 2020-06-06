import Result from '../interface';
import { writeChallenge } from '../../mongo/write/challenge';

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
    const data = await writeChallenge(userId);
    result.data = { challenge: data.id };
  } catch {
    result.code = 500;
    result.message = 'Server Error';
  }
  return result;
}
export default controller;
