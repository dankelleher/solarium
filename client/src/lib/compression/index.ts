import {JWE} from "did-jwt";
import * as cbor from 'cbor';

export const encode = (message:JWE):Buffer => {
  const encodedBytes = cbor.encode(message);
  
  return encodedBytes
}

export const decode = (encodedBytes: Buffer):JWE => {
  const message = cbor.decode(encodedBytes);
  
  return message
}