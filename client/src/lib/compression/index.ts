import * as cbor from 'cbor';
import * as zlib from 'browserify-zlib';
import {debug} from "../util";

export const compress = (message): Buffer => {
  const encodedBytes = cbor.encode(message);
  const compressedBytes = zlib.deflateSync(encodedBytes);

  debug(
    `Message ${JSON.stringify(message).length} Encoded ${
      encodedBytes.length
    } Compressed ${compressedBytes.length}`
  );
  return compressedBytes;
};

export const decompress = (compressedBytes: Buffer) => {
  const encodedBytes = zlib.inflateSync(compressedBytes);
  return cbor.decode(encodedBytes);
};
