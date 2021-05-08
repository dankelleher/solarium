import path from 'path'
import {homedir} from "os";
import {Account} from "@solana/web3.js";
export { close } from './api/close'
export  {create} from "./api/create";
export {post} from "./api/post";
export {read} from "./api/read";

const payerKey:number[] = require(path.join(homedir(), '.config', 'solana', 'id.json'));
export const DEFAULT_PAYER = new Account(payerKey);