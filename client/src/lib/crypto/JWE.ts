export interface RecipientHeader {
  alg: string
  iv: string
  tag: string
  epk?: Record<string, any> // Ephemeral  Public Key
  kid?: string
}

export interface Recipient {
  header: RecipientHeader
  encrypted_key: string
}

export interface JWE {
  protected: string
  iv: string
  ciphertext: string
  tag: string
  aad?: string
  recipients?: Recipient[]
}

export interface EncryptionResult {
  ciphertext: Uint8Array
  tag: Uint8Array
  iv: Uint8Array
  protectedHeader?: string
  recipient?: Recipient
  cek?: Uint8Array
}

