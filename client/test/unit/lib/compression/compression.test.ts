import { JWE } from 'did-jwt';
import {compress, decompress} from "../../../../src/lib/compression";

const sampleJWE: JWE = {
  protected: 'eyJlbmMiOiJYQzIwUC9',
  iv: 'aPQ4rfWw7af1nGtv8Rqb8bXoSvu55lop',
  ciphertext: '1ctlLUzUzXeSQEAWlaFjZ29DIA',
  tag: 'TaffD3rVFr2D7XnhZaKAiw',
  recipients: [
    {
      encrypted_key: 'Y-f-oV2Tz8m2aO5mosZ0TXCMTB7eLD7T7uXPtugS49M',
      header: {
        alg: 'ECDH-ES+XC20PKW',
        iv: 'AXSQaie140ZJEAvvr-J0CyIlD25waW_6',
        tag: '0SKXZvPI3Qcfe4P5Zsl64A',
        epk: {
          kty: 'OKP',
          crv: 'X25519',
          x: 'oSTR8AsiUt2-k4tGS1hE_nsvHQMZjDufiAE-JnGm-GI',
        },
        kid: 'dummy_keyAgreement',
      },
    },
  ],
};

describe('compression', () => {
  it('compresses a JWE', () => {
    const compressed = compress(sampleJWE)
    expect(decompress(compressed)).toEqual(sampleJWE)
    expect(compressed.length).toBeLessThan(JSON.stringify(sampleJWE).length)
  });
});
