import functions from 'firebase-functions';
import base64url from 'base64url';
import jwkToPem from 'jwk-to-pem';
import Result from '../../interface';
import { getChallengeData } from '../../firebase/firestore/getChallenge';
import { getCredentialData } from '../../firebase/firestore/getCredential';
import { updateCredentialData } from '../../firebase/firestore/updateCredential';
import {
  isNotMatchOrigin,
  parseAuthData,
  isNotMatchRpId,
  disabledFlagsUp,
  disabledFlagsUv,
  invalidSignature,
} from '../../utils';

type ClientDataJSON = {
  challenge: string;
  crossOrigin: boolean;
  origin: string;
  type: string;
};

const verifyFunc = async (req: functions.Request): Promise<Result> => {
  const result: Result = { code: 200, message: 'Success' };

  const body = req.body ? req.body : undefined;
  if (!body) {
    result.code = 400;
    result.message = 'Bad Request';
    return result;
  }

  const rawClientDataJSON = base64url.decode(body.clientDataJSON);
  const authData = base64url.toBuffer(body.authenticatorData);
  const signature = base64url.toBuffer(body.signature);
  const clientDataJSON: ClientDataJSON = JSON.parse(rawClientDataJSON);

  if (clientDataJSON.type !== 'webauthn.get') {
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

  const { rpIdHash, flags, signCount } = parseAuthData(authData);

  if (isNotMatchRpId(rpIdHash)) {
    result.code = 401;
    result.message = 'authenticatorData.rpIdHash is Disagreement';
    return result;
  }

  if (disabledFlagsUp(flags)) {
    result.code = 401;
    result.message = 'authenticatorData.flags.up is Disagreement';
    return result;
  }

  if (disabledFlagsUv(flags)) {
    result.code = 401;
    result.message = 'authenticatorData.flags.uv is Disagreement';
    return result;
  }

  const credential = await getCredentialData(challengeData.userId);
  if (!credential.jwk) {
    result.code = 401;
    result.message = 'Authorization Failed';
    return result;
  }
  const cryptType = credential.jwk?.kty === 'RSA' ? 'RSA-SHA256' : 'sha256';
  const pem = jwkToPem(credential.jwk);

  if (
    invalidSignature({
      authData,
      clientDataJSON: rawClientDataJSON,
      pem,
      signature,
      cryptType,
    })
  ) {
    result.code = 401;
    result.message = 'Could not verify signature';
    return result;
  }

  const updateCredential = await updateCredentialData(challengeData.userId, signCount);
  if (!updateCredential) {
    result.code = 500;
    result.message = 'Server Error';
    return result;
  }

  result.data = {
    clientDataJSON,
    authenticatorData: {
      rpIdHash,
      flags,
      signCount,
    },
    credential,
  };

  return result;
};
export default verifyFunc;
