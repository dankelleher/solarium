import { JWE } from 'did-jwt';
import * as cbor from 'cbor';
import * as zlib from 'browserify-zlib';

export const compress = (message: JWE): Buffer => {
  const encodedBytes = cbor.encode(message);
  const compressedBytes = zlib.deflateSync(encodedBytes);

  debug(
    `Message ${JSON.stringify(message).length} Encoded ${
      encodedBytes.length
    } Compressed ${compressedBytes.length}`
  );
  return compressedBytes;
};

export const decompress = (compressedBytes: Buffer): JWE => {
  const encodedBytes = zlib.inflateSync(compressedBytes);
  return cbor.decode(encodedBytes);
};
