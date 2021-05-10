import didJWT, { JWE, JWTVerified } from 'did-jwt';
import {resolve as resolveToDocument } from '@identity.com/sol-did-client';
import {makeKeypair, PrivateKey} from "../util";
import {convertPublicKey, convertSecretKey} from 'ed2curve-esm'
import {DIDResolutionResult} from "did-resolver/src/resolver";
import {DIDDocument} from "did-resolver";
import {encode, decode} from 'bs58'

export type JWT = string;

const EMPTY_DID_RESOLUTION_RESULT: DIDResolutionResult = {
  didResolutionMetadata: {},
  didDocument: null,
  didDocumentMetadata: {}
}

// Solarium uses the x25519 ECDH protocol for e2e encryption,
// which expects a key in the x25519 format (32-byte secret key)
// and type 'X25519KeyAgreementKey2019'.
// 'Sparse' DID documents on solana have an ed25519 key with the type
// 'Ed25519VerificationKey2018' by default, as this is the key type
// used to sign solana transactions. These keys are compatible with
// x25519, but require format conversion. So *unless a keyAgreement key exists*
// on the document, we artificially augment the document to include
// the converted key. This saves space on chain by avoiding the need
// to have the same key stored in two formats.
const augmentDIDDocument = (didDocument: DIDDocument):DIDDocument => {
  // key agreement key already exists, so we cann use it
  if (didDocument.keyAgreement && didDocument.keyAgreement.length) return didDocument;

  if (!didDocument.publicKey || !didDocument.publicKey.length) {
    throw Error('Cannot augment DID document for x25519. The document has no keys')
  }

  const keyAgreementKeys = didDocument.publicKey.map(key => ({
    ...key,
    id: key.id + '_keyAgreement',
    type: 'X25519KeyAgreementKey2019',
    publicKeyBase58: encode(convertPublicKey(decode(key.publicKeyBase58)))
  }));

  // add the new key to the document
  return {
    ...didDocument,
    publicKey: [...didDocument.publicKey, ...keyAgreementKeys],
    keyAgreement: keyAgreementKeys.map(key => key.id)
  }
};

const resolve = async (identifier: string): Promise<DIDResolutionResult> => {
  const didDocument = await resolveToDocument(identifier)

  const augmentedDIDDocument = augmentDIDDocument(didDocument);

  return {
    ...EMPTY_DID_RESOLUTION_RESULT,
    didResolutionMetadata: { contentType: 'application/did+ld+json' },
    didDocument: augmentedDIDDocument
  }
}

export class SolariumCrypto {
  constructor(readonly did: string, readonly key: PrivateKey) {
    // TODO check key belongs to DID. If it doesn't, we can create JWTs that pretend to be issued by the did, but aren't
    // This will not fool a signature verifier, but we should not allow it anyway
  }

  createToken(payload: Record<string, any>): Promise<JWT> {
    const signer = didJWT.EdDSASigner(this.key.toString('hex'));
    return didJWT.createJWT(payload, {
      issuer: this.did,
      signer,
      alg: 'Ed25519'
    });
  }

  async decrypt(jwe: JWE): Promise<string> {
    // normalise the key into an uint array
    const ed25519Key = makeKeypair(this.key).secretKey;

    // The key is used both for Ed25519 signing and x25519 ECDH encryption
    // the two different protocols use the same curve (Curve25519) but
    // different key formats. Specifically Ed25519 uses a 64 byte secret key
    // (which is the same format used by Solana), which is in fact a keypair
    // i.e. combination of the secret and public key, whereas x25519 uses a 32 byte
    // secret key. In order to use the same key for both, we convert here
    // from Ed25519 to x25519 format.
    const curve25519Key = convertSecretKey(ed25519Key);

    const decrypted = await didJWT.decryptJWE(
      jwe,
      didJWT.x25519Decrypter(curve25519Key)
    );
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(decrypted);
  }

  async encrypt(payload: string, recipient: string): Promise<JWE> {
    const didJwtResolver = {resolve};

    const encoder = new TextEncoder(); // always utf-8
    const encoded = encoder.encode(payload);

    const encrypters = await didJWT.resolveX25519Encrypters(
      [recipient],
      didJwtResolver
    );
    return didJWT.createJWE(encoded, encrypters);
  }


  verifyToken(token: JWT): Promise<JWTVerified> {
    const didJwtResolver = {resolve};
    return didJWT.verifyJWT(token, { resolver: didJwtResolver });
  }
}
