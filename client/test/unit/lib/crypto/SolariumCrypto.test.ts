import { Keypair } from '@solana/web3.js';
import {
  generateCEK,
  encryptMessage,
  decryptMessage,
  augmentDIDDocument,
  encryptCEKForUserKey,
  decryptCEKWithUserKey,
  CEK_SIZE,
  encryptUserKeyForKeys,
  decryptUserKey, encryptUserKeyForDidDocument,
} from '../../../../src/lib/crypto/SolariumCrypto';
import {
  stringToBytes,
  base64ToBytes,
  bytesToBase58,
} from '../../../../src/lib/crypto/utils';
import { convertPublicKey } from 'ed2curve-esm';

import { sampleDidDoc } from '../fixtures';
import { generateKeyPair } from '@stablelib/x25519';
import {
  KEY_CIPHER_SIZE,
  KEY_IV_SIZE,
  KEY_TAG_SIZE,
  KID_SIZE,
  kidToBytes,
  PUBLIC_KEY_SIZE,
} from '../../../../src/lib/UserDetails';

describe('ChannelCrypto', () => {
  // Alice has two keys
  const aliceKeypair = Keypair.generate();
  const aliceKeypair1 = Keypair.generate();
  const cek = generateCEK();
  const cleartext = 'Really strange Testmessage';

  it('generates a random 32 byte CEK', async () => {
    expect(cek.length).toEqual(CEK_SIZE);
  });

  it('can symmetrically encrypt and decrypt with XC20P', async () => {
    const enc = await encryptMessage(cleartext, cek);
    const dec = await decryptMessage(enc, cek);

    expect(enc).not.toEqual(cleartext);
    // iv + tag + ciphertext (== length cleartext)
    expect(base64ToBytes(enc).length).toEqual(
      KEY_IV_SIZE + KEY_TAG_SIZE + stringToBytes(cleartext).length
    );
    expect(dec).toEqual(cleartext);
  });

  it('can wrap and unwrap CEK with userkey', async () => {
    const userKeyPair = generateKeyPair();

    const cekData = await encryptCEKForUserKey(cek, userKeyPair.publicKey);

    expect(cekData.kid.length).toEqual(KID_SIZE);
    expect(cekData.kiv.length).toEqual(KEY_IV_SIZE);
    expect(cekData.keyTag.length).toEqual(KEY_TAG_SIZE);
    expect(cekData.ephemeralPubkey.length).toEqual(PUBLIC_KEY_SIZE);
    expect(cekData.keyCiphertext.length).toEqual(KEY_CIPHER_SIZE);

    const decCek = await decryptCEKWithUserKey(cekData, userKeyPair.secretKey);
    expect(decCek).toEqual(cek);
  });

  it('can wrap and unwrap UserKey with X25519Keys', async () => {
    const userKeyPair = generateKeyPair();

    const encryptedKeys = await encryptUserKeyForKeys(userKeyPair.secretKey, [
      {
        id: 'key0',
        pub: bytesToBase58(convertPublicKey(aliceKeypair.publicKey.toBytes())),
      },
    ]);

    expect(encryptedKeys.length).toEqual(1);
    expect(encryptedKeys[0].kid.length).toEqual(KID_SIZE);
    expect(encryptedKeys[0].kiv.length).toEqual(KEY_IV_SIZE);
    expect(encryptedKeys[0].keyTag.length).toEqual(KEY_TAG_SIZE);
    expect(encryptedKeys[0].ephemeralPubkey.length).toEqual(PUBLIC_KEY_SIZE);
    expect(encryptedKeys[0].keyCiphertext.length).toEqual(KEY_CIPHER_SIZE);

    const decUserKey = await decryptUserKey(
      encryptedKeys,
      kidToBytes('key0'),
      aliceKeypair.secretKey
    );
    expect(decUserKey).toEqual(userKeyPair.secretKey);
  });

  it('should encrypt and decrypt a UserKey with DID', async () => {
    const userKeyPair = generateKeyPair();

    const encryptedKeys = await encryptUserKeyForDidDocument(userKeyPair.secretKey, {
      id: 'alice-did',
      verificationMethod: [
        {
          id: 'did:dummy:alice#default_keyAgreement',
          controller: 'did:dummy:alice',
          type: 'X25519KeyAgreementKey2019',
          publicKeyBase58: bytesToBase58(
            convertPublicKey(aliceKeypair.publicKey.toBytes())
          ),
        },
        {
          id: 'did:dummy:alice#default_keyAgreement1',
          controller: 'did:dummy:alice',
          type: 'X25519KeyAgreementKey2019',
          publicKeyBase58: bytesToBase58(
            convertPublicKey(aliceKeypair1.publicKey.toBytes())
          ),
        },
        {
          id: 'key2',
          controller: 'did:dummy:alice',
          type: 'UnsupportedType',
          publicKeyBase58: 'UNSUPPORTED BYTES',
        }
        ]
    })

    expect(encryptedKeys.length).toEqual(2)
    expect(encryptedKeys[0].kid).toEqual(kidToBytes('default_keyAgreement'));
    expect(encryptedKeys[1].kid).toEqual(kidToBytes('default_keyAgreement1'));
    // make kids generally don't conflict.
    expect(kidToBytes('default_keyAgreement')).not.toEqual(kidToBytes('default_keyAgreement1'))

    await expect(decryptUserKey(encryptedKeys, kidToBytes('default_keyAgreement'), aliceKeypair.secretKey)).resolves.toEqual(userKeyPair.secretKey)
    await expect(decryptUserKey(encryptedKeys, kidToBytes('default_keyAgreement1'), aliceKeypair1.secretKey)).resolves.toEqual(userKeyPair.secretKey)
    // wrong combination
    await expect(decryptUserKey(encryptedKeys, kidToBytes('default_keyAgreement1'), aliceKeypair.secretKey)).rejects.toThrow(/There was a problem decrypting the CEK/)
    await expect(decryptUserKey(encryptedKeys, kidToBytes('default_keyAgreement'), aliceKeypair1.secretKey)).rejects.toThrow(/There was a problem decrypting the CEK/)
    // unknown key
    await expect(decryptUserKey(encryptedKeys, kidToBytes('unknown0'), aliceKeypair1.secretKey)).rejects.toThrow(/No encrypted UserKey found for key 121,139,65,2,129,252,35,142/)
  });

  it('can successfully augment an did document with one or more X25519KeyAgreementKey2019 keys ', async () => {
    const augmentedDidDocument = augmentDIDDocument(sampleDidDoc);
    expect(augmentedDidDocument.publicKey?.length).toEqual(
      2 * sampleDidDoc.publicKey.length
    );
    expect(augmentedDidDocument.verificationMethod?.length).toEqual(
      2 * sampleDidDoc.verificationMethod.length
    );
  });
});
