import { hash } from '@stablelib/sha256'
import * as u8a from 'uint8arrays'

function writeUint32BE(value: number, array = new Uint8Array(4)): Uint8Array {
  const encoded = u8a.fromString(value.toString(), 'base10')
  array.set(encoded, 4 - encoded.length)
  return array
}

const lengthAndInput = (input: Uint8Array): Uint8Array => u8a.concat([writeUint32BE(input.length), input])

// Implementation from:
// https://github.com/decentralized-identity/did-jwt
export function concatKDF(secret: Uint8Array, keyLen: number, alg: string): Uint8Array {
  if (keyLen !== 256) throw new Error(`Unsupported key length: ${keyLen}`)
  const value = u8a.concat([
    lengthAndInput(u8a.fromString(alg)),
    lengthAndInput(new Uint8Array(0)), // apu
    lengthAndInput(new Uint8Array(0)), // apv
    writeUint32BE(keyLen)
  ])
  // since our key lenght is 256 we only have to do one round
  const roundNumber = 1
  return hash(u8a.concat([writeUint32BE(roundNumber), secret, value]))
}

export function base64ToBytes(s: string): Uint8Array {
  const inputBase64Url = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return u8a.fromString(inputBase64Url, 'base64url')
}

export function bytesToBase64(b: Uint8Array): string {
  return u8a.toString(b, 'base64pad')
}

export function stringToBytes(s: string): Uint8Array {
  return u8a.fromString(s)
}

export function bytesToString(s: Uint8Array): string  {
  return u8a.toString(s)
}

export function base58ToBytes(s: string): Uint8Array {
  return u8a.fromString(s, 'base58btc')
}

export function bytesToBase58(b: Uint8Array): string {
  return u8a.toString(b, 'base58btc')
}
