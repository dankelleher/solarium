import path from 'path'
import {homedir} from "os";
import {Keypair} from "@solana/web3.js";
export { close } from './api/close'
export  {create} from "./api/create";
export {post} from "./api/post";
export {read, readStream} from "./api/read";
export { addKey } from "./api/addKey";

export { Inbox, Message } from './lib/Inbox'
export { create as createWallet } from './lib/wallet'

const payerKey:number[] = require(path.join(homedir(), '.config', 'solana', 'id.json'));
export const DEFAULT_PAYER = Keypair.fromSecretKey(Buffer.from(payerKey));