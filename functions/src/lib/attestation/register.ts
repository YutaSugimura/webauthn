import functions from 'firebase-functions';
import base64url from 'base64url';
import Result from '../../interface';
import { getChallengeData } from '../../firebase/firestore/getChallenge';
import { writeCredentialData } from '../../firebase/firestore/writeCredential';
import {
  isNotMatchOrigin,
  decodeCobr,
  parseAuthData,
  coseToJwk,
  isNotMatchRpId,
  disabledFlagsUp,
  disabledFlagsUv,
  check,
} from '../../utils';

type ClientData = {
  challenge: string;
  origin: string;
  type: string;
  crossOrigin: boolean;
};

const registerFunc = async (req: functions.Request): Promise<Result> => {
  const result: Result = { code: 200, message: 'Success' };

  const body = req.body ? req.body : undefined;
  if (!body) {
    result.code = 400;
    result.message = 'Bad Request';
    return result;
  }

  const rawClientDataJSON = base64url.decode(body.clientDataJSON);
  const attestationObjectBuffer = base64url.toBuffer(body.attestationObject);
  const id = body.id;
  const clientDataJSON: ClientData = JSON.parse(rawClientDataJSON);

  if (clientDataJSON.type !== 'webauthn.create') {
    result.code = 401;
    result.message = 'clientDataJSON.type is Disagreement';
    return result;
  }

  if (isNotMatchOrigin(clientDataJSON.origin)) {
    result.code = 401;
    result.message = 'clientDataJSON.challenge is Disagreement';
    return result;
  }

  const challengeData = await getChallengeData(clientDataJSON.challenge);
  if (!challengeData.userId) {
    result.code = 401;
    result.message = 'clientDataJSON.challenge is Disagreement';
    return result;
  }

  const { fmt, attStmt, authData } = decodeCobr(attestationObjectBuffer);
  const {
    rpIdHash,
    flags,
    signCount,
    aaguid,
    credentialIdLength,
    credentialPublicKey,
  } = parseAuthData(authData);

  const publicKeyJwk = coseToJwk(credentialPublicKey.buffer);

  const signatureCheck = check(fmt, attStmt, authData, rawClientDataJSON, publicKeyJwk);
  if (!signatureCheck) {
    result.code = 401;
    result.message = 'Could not verify signature';
    return result;
  }

  if (isNotMatchRpId(rpIdHash)) {
    result.code = 401;
    result.message = 'authData.rpIdHash is Disagreement';
    return result;
  }

  if (disabledFlagsUp(flags)) {
    result.code = 401;
    result.message = 'authData.flags.up is Disagreement';
    return result;
  }

  if (disabledFlagsUv(flags)) {
    result.code = 401;
    result.message = 'authData.flags.uv is Disagreement';
    result.data = '7';
    return result;
  }

  const register = await writeCredentialData(challengeData.userId, id, publicKeyJwk, signCount);
  if (!register) {
    result.code = 500;
    result.message = 'Server Error';
    return result;
  }

  result.data = {
    clientDataJSON,
    attestationObject: {
      fmt,
      authData: 'ArrayBuffer',
      attStmt: {
        alg: attStmt.alg,
        sig: 'ArrayBuffer',
      },
    },
    authData: {
      rpIdHash: 'ArrayBuffer',
      flags,
      signCount,
      aaguid,
      credentialIdLength,
      credentialId: 'ArrayBuffer',
      credentialPublicKey: 'ArrayBuffer',
    },
    credentialPublicKey: publicKeyJwk,
  };

  return result;
};
export default registerFunc;
