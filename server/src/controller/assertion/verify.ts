import base64url from 'base64url';
import jwkToPem from 'jwk-to-pem';
import Result from '../interface';
import { getChallenge } from '../../mongo/read/challenge';
import { getCredential } from '../../mongo/read/credential';
import { updateCredential } from '../../mongo/update/credential';
import { isNotMatchOrigin, parseAuthData, isNotMatchRpId, disabledFlagsUp, disabledFlagsUv, invalidSignature } from '../utils';

type ClientDataJSON = {
  challenge: string;
  crossOrigin: boolean;
  origin: string;
  type: string;
};

type Request = {
  body: {
    clientDataJSON: string
    authenticatorData: string
    signature: string
  }
}

const controller = async(req: Request): Promise<Result> => {
  const result: Result = { code: 200, message: 'Success' };

  const body = req.body;
  if(!body) {
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

  const challengeData = await getChallenge(clientDataJSON.challenge);
  if(!challengeData.result || !challengeData.userId) {
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

  const credential = await getCredential(challengeData.userId);
  if(!credential.result || !credential.credential) {
    result.code = 401;
    result.message = 'Authorization Failed';
    return result;
  }
  const cryptType = credential.credential.jwk.kty === 'RSA' ? 'RSA-SHA256' : 'sha256';
  const pem = jwkToPem(credential.credential.jwk);

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

  const data = await updateCredential(challengeData.userId, signCount);
  if(!data) {
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
}
export default controller;
