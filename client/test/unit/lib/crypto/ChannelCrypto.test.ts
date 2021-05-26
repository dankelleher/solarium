import { Keypair, PublicKey } from '@solana/web3.js';
import {
  generateCEK,
  encryptMessage,
  decryptMessage,
  encryptCEKForVerificationMethod,
  decryptCEK
} from "../../../../src/lib/crypto/ChannelCrypto";
import {stringToBytes, base64ToBytes} from "../../../../src/lib/crypto/util";

describe('ChannelCrypto', () => {

  // Alice has two keys
  const aliceKeypair = Keypair.generate();
  const aliceKeypair2 = Keypair.generate();

  const bobKeypair = Keypair.generate();
  const elviraKeypair = Keypair.generate();
  let cek, cleartext, encrypter, decrypter


  beforeEach(async () => {
    cek = await generateCEK()
    cleartext = "Really strange Testmessage"
  })

  it('generates a random 32 byte CEK', async () => {
    expect(cek.length).toEqual(32)
  });

  it('can symmetrically encrypt and decrypt with XC20P', async () => {
    const enc = await encryptMessage(cleartext, cek)
    const dec = await decryptMessage(enc, cek)

    expect(enc).not.toEqual(cleartext)
    // iv + tag + ciphertext (== length cleartext)
    expect(base64ToBytes(enc).length).toEqual(24 + 16 + stringToBytes(cleartext).length)
    expect(dec).toEqual(cleartext)
  });

  it('can wrap and unwrap a key', async () => {
    const cekData = await encryptCEKForVerificationMethod(cek, {
      id: 'key0',
      type: 'Ed25519VerificationKey2018',
      controller: 'did:dummy:alice',
      publicKeyBase58: aliceKeypair.publicKey.toBase58()
    })
    // expect(cekData).toEqual('')

    const decCek = await decryptCEK(cekData, aliceKeypair.secretKey)
    expect(decCek).toEqual(cek)
  });


});
