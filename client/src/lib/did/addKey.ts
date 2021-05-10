import {update, resolve } from '@identity.com/sol-did-client';
import {PublicKey, Keypair} from "@solana/web3.js";
import {DIDDocument} from "did-resolver";

export const addKey = async (
  did: string, 
  keyIdentifier: string,
  key: PublicKey,
  signer: Keypair,
  payer: Keypair
):Promise<DIDDocument> => {
  const keyDID = did + '#' + keyIdentifier;
  
  const existingDoc = await resolve(did);

  const appendedCapabilityInvocation = [... (existingDoc.capabilityInvocation || []), keyDID];
  await update({
    identifier: did,
    payer: payer.secretKey,
    owner: signer.secretKey,
    mergeBehaviour: 'Append',
    document: {
      verificationMethod: [{
        id: keyDID,
        type: 'Ed25519VerificationKey2018',
        controller: did,
        publicKeyBase58: key.toBase58()
      }],
      capabilityInvocation: appendedCapabilityInvocation
    }
  });

  return resolve(did);
}