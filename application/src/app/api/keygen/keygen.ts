import { subtle } from 'crypto';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  const binary = String.fromCharCode(...byteArray);
  return Buffer.from(binary, 'binary').toString('base64');
}

export async function generateKeyPair() {
  const keyPair = await subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBuffer = await subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await subtle.exportKey("pkcs8", keyPair.privateKey);

  const publicKey = arrayBufferToBase64(publicKeyBuffer);
  const privateKey = arrayBufferToBase64(privateKeyBuffer);

  return {
    publicKey,
    privateKey,
  };
}
