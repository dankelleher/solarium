export { create } from './api/create';
export { post } from './api/post';
export { get } from './api/get';
export { read, readStream } from './api/read';
export { addKey } from './api/addKey';

export { Channel, Message } from './lib/Channel';
export { create as createWallet, SignCallback } from './lib/wallet';
export { ExtendedCluster } from './lib/util';
export { keyToIdentifier } from '@identity.com/sol-did-client';
