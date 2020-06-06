import base64url from 'base64url';

export const signup = (instance: any, clientId: string) => async() => {
  const userId = 'titan@example.com';
  const challenge = await instance.post('/attestationChallenge', { userId });

  const credentials: any = await navigator.credentials.create({
    publicKey: {
      rp: {
        id: clientId,
        name: 'WebAuthn Demo',
      },
      user: {
        id: base64url.toBuffer(userId).buffer,
        name: userId,
        displayName: userId,
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7,
        },
        {
          type: 'public-key',
          alg: -257,
        },
      ],
      challenge: base64url.toBuffer(challenge.data.data.challenge).buffer,
    },
  });

  const id: string = credentials.id;
  const clientDataJSON = base64url(credentials.response.clientDataJSON);
  const attestationObject = base64url(credentials.response.attestationObject);

  try {
    const result = await instance.post('/attestationRegister', {
      id,
      attestationObject,
      clientDataJSON,
    });

    console.log('debug:', result);

    console.log(result.data.data);
  } catch (e) {
    console.log(e);
  }
};

export const signin = (instance: any) => async() => {
  const userId = 'titan@example.com';
  const data: any = await instance.post('/assertionChallenge', {
    userId,
  });

  const { challenge, credentialId } = data.data.data;
  const credentials: any = await navigator.credentials.get({
    publicKey: {
      allowCredentials: [
        {
          id: base64url.toBuffer(credentialId).buffer,
          transports: ['usb', 'nfc', 'internal'],
          type: 'public-key'
        }
      ],
      userVerification: 'discouraged',
      challenge: base64url.toBuffer(challenge).buffer,
    },
  });

  const result = await instance.post('/assertionVerify', {
    authenticatorData: base64url(credentials.response.authenticatorData),
    clientDataJSON: base64url(credentials.response.clientDataJSON),
    signature: base64url(credentials.response.signature),
  });
  console.log(result.data.data);
};