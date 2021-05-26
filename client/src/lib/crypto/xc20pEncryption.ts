import { XChaCha20Poly1305 } from '@stablelib/xchacha20poly1305'
import { generateKeyPair, sharedKey } from '@stablelib/x25519'
import { randomBytes } from '@stablelib/random'
import { concatKDF } from './Digest'
import { bytesToBase64url, toSealed, base64ToBytes } from './util'
import { Recipient, EncryptionResult } from './JWE'

function xc20pEncrypter(key: Uint8Array): (cleartext: Uint8Array, aad?: Uint8Array) => EncryptionResult {
  const cipher = new XChaCha20Poly1305(key)
  return (cleartext: Uint8Array, aad?: Uint8Array) => {
    const iv = randomBytes(cipher.nonceLength)
    const sealed = cipher.seal(iv, cleartext, aad)
    return {
      ciphertext: sealed.subarray(0, sealed.length - cipher.tagLength),
      tag: sealed.subarray(sealed.length - cipher.tagLength),
      iv
    }
  }
}

export function xc20pDirEncrypter(key: Uint8Array) {
  const xc20pEncrypt = xc20pEncrypter(key)
  const enc = 'XC20P'
  const alg = 'dir'
  async function encrypt(cleartext): Promise<EncryptionResult> {
    return {
      ...xc20pEncrypt(cleartext),
    }
  }
  return { alg, enc, encrypt }
}

export function xc20pDirDecrypter(key: Uint8Array) {
  const cipher = new XChaCha20Poly1305(key)
  async function decrypt(sealed, iv): Promise<Uint8Array | null> {
    return cipher.open(iv, sealed)
  }
  return { alg: 'dir', enc: 'XC20P', decrypt }
}

export function x25519Encrypter(publicKey: Uint8Array, kid?: string) {
  const alg = 'ECDH-ES+XC20PKW'
  const keyLen = 256
  const crv = 'X25519'
  async function encryptCek(cek): Promise<Recipient> {
    const epk = generateKeyPair()
    const sharedSecret = sharedKey(epk.secretKey, publicKey)
    // Key Encryption Key
    const kek = concatKDF(sharedSecret, keyLen, alg)
    const res = xc20pEncrypter(kek)(cek)
    const recipient: Recipient = {
      encrypted_key: bytesToBase64url(res.ciphertext),
      header: {
        alg,
        iv: bytesToBase64url(res.iv),
        tag: bytesToBase64url(res.tag),
        epk: { kty: 'OKP', crv, x: bytesToBase64url(epk.publicKey) }
      }
    }
    if (kid) recipient.header.kid = kid
    return recipient
  }

  // TODO: Note we open up this funtion to pass the cek
  // TODO: This will sacrifice forward secrecy.
  async function encrypt(cek: Uint8Array, cleartext): Promise<EncryptionResult> {
    return {
      ...(await xc20pDirEncrypter(cek).encrypt(cleartext)),
      recipient: await encryptCek(cek),
      cek
    }
  }
  return { alg, enc: 'XC20P', encrypt, encryptCek }
}


function validateHeader(header: Record<string, any>) {
  if (!(header.epk && header.iv && header.tag)) {
    throw new Error('Invalid JWE')
  }
}

export function x25519Decrypter(secretKey: Uint8Array) {
  const alg = 'ECDH-ES+XC20PKW'
  const keyLen = 256
  const crv = 'X25519'
  async function decrypt(sealed, iv, recipient): Promise<Uint8Array | null> {
    const cek = await decryptCek(recipient)
    if (cek === null) return null

    return xc20pDirDecrypter(cek).decrypt(sealed, iv)
  }

  async function decryptCek(recipient): Promise<Uint8Array | null> {
    validateHeader(recipient.header)
    if (recipient.header.epk.crv !== crv) return null
    const publicKey = base64ToBytes(recipient.header.epk.x)
    const sharedSecret = sharedKey(secretKey, publicKey)

    // Key Encryption Key
    const kek = concatKDF(sharedSecret, keyLen, alg)
    // Content Encryption Key
    const sealedCek = toSealed(recipient.encrypted_key, recipient.header.tag)
    const cek = await xc20pDirDecrypter(kek).decrypt(sealedCek, base64ToBytes(recipient.header.iv))
    return cek
  }

  return { alg, enc: 'XC20P', decrypt, decryptCek }
}
