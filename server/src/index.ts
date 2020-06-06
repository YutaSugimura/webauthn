import express from 'express';
import cors from 'cors';
import attestationChallengeController from './controller/attestation/challenge';
import attestationRegisterController from './controller/attestation/register';
import assertionChallengeController from './controller/assertion/challenge';
import assertionVerifyController from './controller/assertion/verify';

const app = express();

const corsOptions = {
  // origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.post('/attestationChallenge', async (req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');

  const result = await attestationChallengeController(req);
  res.status(result.code).send(result);
});

app.post('/attestationRegister', async (req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  
  const result = await attestationRegisterController(req);
  res.status(result.code).send(result);
});

app.post('/assertionChallenge', async (req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');

  const result = await assertionChallengeController(req);
  res.status(result.code).send(result);
});

app.post('/assertionVerify', async (req, res) => {
  res.header('Content-Type', 'application/json; charset=utf-8');

  const result = await assertionVerifyController(req);
  res.status(result.code).send(result);
});

app.listen(4000, () => console.log('Listening on port 4000!'));
