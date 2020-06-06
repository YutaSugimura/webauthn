import base64url from 'base64url';
import crypto from 'crypto';
import arrayBufferToBuffer from 'arraybuffer-to-buffer';
import jwkToPem from 'jwk-to-pem';
const cbor = require('cbor-js');

type AttStmt = {
  x5c?: any;
  sig?: any;
  alg?: any;
};

type DecodeCobr = {
  fmt: string;
  attStmt: AttStmt;
  authData: Buffer;
};

export type PublicKeyJwk =
  | { kty: 'EC'; crv: string; d: string; x?: string; y?: string }
  | { kty: 'EC'; crv: string; x: string; y: string }
  | {
      kty: 'RSA';
      e: string;
      n: string;
      d?: string;
      p?: string;
      q?: string;
      dp?: string;
      dq?: string;
      qi?: string;
    };

const rpId = 'localhost';
const origin = 'http://localhost:3000';

export const bufferToArrayBuffer = (buf: Buffer): ArrayBuffer => {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i += 1) {
    view[i] = buf[i];
  }
  return ab;
};

export const decodeCobr = (buf: Buffer): DecodeCobr => cbor.decode(bufferToArrayBuffer(buf));

export const sha256 = (data: crypto.BinaryLike): Buffer => {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
};

export const derToPEM = (der: string): string => `-----BEGIN CERTIFICATE-----
${der}
-----END CERTIFICATE-----`;

export const parseAuthData = (
  authData: Buffer,
): {
  rpIdHash: Buffer;
  flags: number;
  signCount: number;
  aaguid: Buffer;
  credentialIdLength: number;
  credentialId: Buffer;
  credentialPublicKey: Buffer;
} => {
  const rpIdHash = authData.slice(0, 32);
  const flags = authData[32];
  const signCount =
    (authData[33] << 24) | (authData[34] << 16) | (authData[35] << 8) | authData[36];
  const aaguid = authData.slice(37, 53);
  const credentialIdLength = (authData[53] << 8) + authData[54];
  const credentialId = authData.slice(55, 55 + credentialIdLength);
  const credentialPublicKey = authData.slice(55 + credentialIdLength);
  return {
    rpIdHash,
    flags,
    signCount,
    aaguid,
    credentialIdLength,
    credentialId,
    credentialPublicKey,
  };
};

export const coseToJwk = (cose: ArrayBuffer | SharedArrayBuffer): PublicKeyJwk => {
  try {
    const publicKeyCbor = cbor.decode(cose);
    if (publicKeyCbor[3] === -7) {
      return {
        kty: 'EC',
        crv: 'P-256',
        x: base64url(publicKeyCbor[-2]),
        y: base64url(publicKeyCbor[-3]),
      };
    } else if (publicKeyCbor[3] === -257) {
      return {
        kty: 'RSA',
        n: base64url(publicKeyCbor[-1]),
        e: base64url(publicKeyCbor[-2]),
      };
    } else {
      throw new Error('Unknown public key algorithm');
    }
  } catch {
    throw new Error('Could not decode COSE key');
  }
};

export const invalidSignature = ({
  authData,
  clientDataJSON,
  signature,
  pem,
  cryptType = 'sha256',
}: {
  authData: Buffer;
  clientDataJSON: string;
  signature: Buffer;
  pem: string;
  cryptType?: string;
}): boolean => {
  const clientDataHash = sha256(clientDataJSON);
  const verify = crypto.createVerify(cryptType);
  verify.update(authData);
  verify.update(clientDataHash);
  return !verify.verify(pem, signature);
};

export const isNotMatchOrigin = (clientOrigin: string): boolean => origin !== clientOrigin;
export const isNotMatchRpId = (hash: crypto.BinaryLike): boolean =>
  sha256(rpId).equals(arrayBufferToBuffer(hash)) === false;
export const disabledFlagsUp = (flags: number): boolean => Boolean(flags & 0x01) === false;
export const disabledFlagsUv = (flags: number): boolean => Boolean(flags & 0x04) === false;

export const check = (
  fmt: string,
  attStmt: AttStmt,
  authData: Buffer,
  rawClientDataJSON: string,
  publicKeyJwk: PublicKeyJwk,
): boolean => {
  switch (fmt) {
    case 'packed':
      if ('x5c' in attStmt) {
        const [attestnCert] = attStmt.x5c;
        const pem = derToPEM(base64url(attestnCert));
        const signature = attStmt.sig;

        if (
          invalidSignature({
            authData,
            clientDataJSON: rawClientDataJSON,
            pem,
            signature,
          })
        ) {
          return false;
        }
      } else {
        const cryptType = publicKeyJwk.kty === 'RSA' ? 'RSA-SHA256' : 'sha256';
        const pem = jwkToPem(publicKeyJwk);
        const signature = attStmt.sig;
        if (
          invalidSignature({
            authData,
            clientDataJSON: rawClientDataJSON,
            pem,
            signature,
            cryptType,
          })
        ) {
          return false;
        }
      }
      break;
    case 'android-key':
    case 'android-safetynet':
    case 'tpm':
    case 'fido-u2f':
    default:
      break;
  }
  return true;
};
