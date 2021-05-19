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

const sampleBigJWE:JWE = {
  "protected": "eyJlbmMiOiJYQzIwUCJ9",
  "iv": "s_pNicoLjYx-X-H44NFrWqchebrmBg-9",
  "ciphertext": "PQ2boDNqVWmO9Qve-iAq9pOMi7Ka",
  "tag": "65_wyZemS2X8Y9puJKPONQ",
  "recipients": [
    {
      "encrypted_key": "rgxTicuzgSY6D4WqQWR1zK2EbX4KIwMwe8xwaiCmzis",
      "header": {
        "alg": "ECDH-ES+XC20PKW",
        "iv": "Gb1vQMbVIsy6-30ArkjvpD-0a-BCVUlj",
        "tag": "aS2IV7SFRiKXJoWsQpOsqg",
        "epk": {
          "kty": "OKP",
          "crv": "X25519",
          "x": "nQZd629x7WovnJ84Yar3oKjlZ828ftKUpqAOYQhFzW8"
        },
        "kid": "key0_keyAgreement"
      }
    },
    {
      "encrypted_key": "_aqNjHHkDiBqjojDSvcsncsZep2g2pEWJIST3SQ8g04",
      "header": {
        "alg": "ECDH-ES+XC20PKW",
        "iv": "rQNGRpD-ZoFylaRrCX9mxq2gP0-5ZSgF",
        "tag": "cYib5qrQJOLBT_xXDB0sCQ",
        "epk": {
          "kty": "OKP",
          "crv": "X25519",
          "x": "GkmP1ZaxiZpHai1XzOTs8KW8En5Vd6VhpidTqtuH5GM"
        },
        "kid": "key1_keyAgreement"
      }
    }
  ]
}

describe('compression', () => {
  it('compresses a JWE', () => {
    const compressed = compress(sampleJWE)
    expect(decompress(compressed)).toEqual(sampleJWE)
    expect(compressed.length).toBeLessThan(JSON.stringify(sampleJWE).length)
  });

  it('compresses a big JWE', () => {
    const compressed = compress(sampleBigJWE)
    expect(decompress(compressed)).toEqual(sampleBigJWE)
    expect(compressed.length).toBeLessThan(JSON.stringify(sampleBigJWE).length)
  });
});
