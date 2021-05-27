import { XChaCha20Poly1305, NONCE_LENGTH, TAG_LENGTH } from '@stablelib/xchacha20poly1305'
import { generateKeyPair, sharedKey } from '@stablelib/x25519'
import { randomBytes } from '@stablelib/random'
import { concatKDF } from './utils'
import * as u8a from 'uint8arrays'

export const XC20P_IV_LENGTH = NONCE_LENGTH
export const XC20P_TAG_LENGTH = TAG_LENGTH

// XC20P
export const xc20pEncrypter = (key: Uint8Array) => {
  const cipher = new XChaCha20Poly1305(key)
  return (cleartext: Uint8Array, aad?: Uint8Array) => {
    const iv = randomBytes(XC20P_IV_LENGTH)
    const sealed = cipher.seal(iv, cleartext, aad)
    return {
      ciphertext: sealed.subarray(0, sealed.length - XC20P_TAG_LENGTH),
      tag: sealed.subarray(sealed.length - XC20P_TAG_LENGTH),
      iv
    }
  }
}

// XC20P
export const xc20pDecrypter = (key: Uint8Array) => {
  const cipher = new XChaCha20Poly1305(key)
  return (ciphertext: Uint8Array, tag: Uint8Array, iv: Uint8Array, aad?: Uint8Array) => cipher.open(iv, u8a.concat([ciphertext, tag]), aad)
}

// KW ECDH-ES+XC20PKW
const ECDH_ES_XC20PKW_ALG = 'ECDH-ES+XC20PKW'
const ECDH_ES_XC20PKW_KEYLEN = 256

export const x25519xc20pKeyWrap = (publicKey: Uint8Array) => (wrappedKey: Uint8Array) => {
  const epk = generateKeyPair()
  const sharedSecret = sharedKey(epk.secretKey, publicKey)
  const kek = concatKDF(sharedSecret, ECDH_ES_XC20PKW_KEYLEN, ECDH_ES_XC20PKW_ALG)
  const res = xc20pEncrypter(kek)(wrappedKey)
  return {
    encryptedKey: res.ciphertext,
    tag: res.tag,
    iv: res.iv,
    epPubKey: epk.publicKey
  }
}

export const x25519xc20pKeyUnwrap = (secretKey: Uint8Array) => (ciphertext: Uint8Array, tag: Uint8Array, iv: Uint8Array, epPubKey: Uint8Array) => {
  const sharedSecret = sharedKey(secretKey, epPubKey)
  // Key Encryption Key
  const kek = concatKDF(sharedSecret, ECDH_ES_XC20PKW_KEYLEN, ECDH_ES_XC20PKW_ALG)
  // Content Encryption Key
  return xc20pDecrypter(kek)(ciphertext, tag, iv)
}
