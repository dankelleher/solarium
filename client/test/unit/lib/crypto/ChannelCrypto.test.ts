import { Keypair } from '@solana/web3.js';
import {
  generateCEK,
  encryptMessage,
  decryptMessage,
  encryptCEKForVerificationMethod,
  decryptKeyWrap,
  augmentDIDDocument,
} from '../../../../src/lib/crypto/SolariumCrypto';
import {
  stringToBytes,
  base64ToBytes,
  bytesToBase58,
} from '../../../../src/lib/crypto/utils';
import { convertPublicKey } from 'ed2curve-esm';

import { sampleDidDoc } from '../fixtures';
import { VM_TYPE_X25519KEYAGREEMENTKEY2019 } from '../../../../src/lib/constants';

describe('ChannelCrypto', () => {
  // Alice has two keys
  const aliceKeypair = Keypair.generate();
  let cek, cleartext;

  beforeEach(async () => {
    cek = await generateCEK();
    cleartext = 'Really strange Testmessage';
  });

  it('generates a random 32 byte CEK', async () => {
    expect(cek.length).toEqual(32);
  });

  it('can symmetrically encrypt and decrypt with XC20P', async () => {
    const enc = await encryptMessage(cleartext, cek);
    const dec = await decryptMessage(enc, cek);

    expect(enc).not.toEqual(cleartext);
    // iv + tag + ciphertext (== length cleartext)
    expect(base64ToBytes(enc).length).toEqual(
      24 + 16 + stringToBytes(cleartext).length
    );
    expect(dec).toEqual(cleartext);
  });

  it('can wrap and unwrap a key', async () => {
    const cekData = await encryptCEKForVerificationMethod(cek, {
      id: 'key0',
      controller: 'did:dummy:alice',
      type: VM_TYPE_X25519KEYAGREEMENTKEY2019,
      publicKeyBase58: bytesToBase58(
        convertPublicKey(aliceKeypair.publicKey.toBytes())
      ),
    });

    expect(base64ToBytes(cekData.header).length).toEqual(24 + 12 + 36);
    expect(base64ToBytes(cekData.encryptedKey).length).toEqual(32);

    const decCek = await decryptKeyWrap(cekData, aliceKeypair.secretKey);
    expect(decCek).toEqual(cek);
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
