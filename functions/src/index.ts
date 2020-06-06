import * as functions from 'firebase-functions';
import express from 'express';
import corsLib from 'cors';
import challengeFunc from './lib/attestation/challenge';
import registerFunc from './lib/attestation/register';
import assertionChallenge from './lib/assertion/challenge';
import verifyFunc from './lib/assertion/verify';

const app = express();
const cors = corsLib();
const router = express.Router();

router.use(async (req, res, next) => {
  return await cors(req, res, async () => {
    next();
  });
});
app.use('/v1', router);

router.post(
  '/attestationChallenge',
  [],
  async (req: functions.Request, res: functions.Response) => {
    const result = await challengeFunc(req);

    res.header('Content-Type', 'application/json; charset=utf-8');
    res.status(result.code).send(result);
  },
);

router.post('/attestationRegister', [], async (req: functions.Request, res: functions.Response) => {
  res.header('Content-Type', 'application/json; charset=utf-8');

  const result = await registerFunc(req);
  res.status(result.code).send(result);
});

router.post('/assertionChallenge', [], async (req: functions.Request, res: functions.Response) => {
  const result = await assertionChallenge(req);

  res.header('Content-Type', 'application/json; charset=utf-8');
  res.status(result.code).send(result);
});

router.post('/assertionVerify', [], async (req: functions.Request, res: functions.Response) => {
  res.header('Content-Type', 'application/json; charset=utf-8');

  const result = await verifyFunc(req);
  res.status(result.code).send(result);
});

exports.api = functions.region('asia-northeast1').https.onRequest(app);
