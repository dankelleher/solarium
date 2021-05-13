import {Keypair, Connection, clusterApiUrl, SystemProgram, Transaction} from '@solana/web3.js'
import * as path from "path";
import {homedir} from "os";

/***
 * This script demonstrates machine 1 sending its public key to machine 2 without any on-chain constructs
 * 
 * It assumes there is some off-chain way for machine 2 to send something
 * (the ephemeral private key) to machine 1 (e.g. a QR code), but not the other way round.
 */

const connection = new Connection(clusterApiUrl('devnet'), 'processed');

// run this on machine 2
const ephemeral = Keypair.generate()
connection.onAccountChange(ephemeral.publicKey, async (accountInfo) => {
  console.log("Hello from", accountInfo.owner.toBase58());
})

//  run all this on machine 1
const payerKey:number[] = require(path.join(homedir(), '.config', 'solana', 'id.json'));
const machine1 = Keypair.fromSecretKey(Buffer.from(payerKey));

console.log('Sending a hello from ' + machine1.publicKey.toBase58());

// create a short-lived account as a "signal" to the other machine
const transaction = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: machine1.publicKey,
    newAccountPubkey: ephemeral.publicKey,
    lamports: 50, // 50 seems to be the magic number
    space: 0,
    programId: machine1.publicKey // becomes the owner of the account
  })
);

(async () => {
  const txSig = await connection.sendTransaction(transaction, [machine1, ephemeral])
  await connection.confirmTransaction(txSig)
})()