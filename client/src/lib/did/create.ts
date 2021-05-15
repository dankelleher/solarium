import {createRegisterInstruction, DecentralizedIdentifier, resolve} from '@identity.com/sol-did-client';
import {PublicKey} from "@solana/web3.js";
import {DIDDocument} from "did-resolver";
import {currentCluster} from "../util";
import {SignCallback} from "../wallet";
import {SolariumTransaction} from "../solana/transaction";

export const create = async (owner: PublicKey, payer: PublicKey, signCallback: SignCallback):Promise<DIDDocument> => {
  const [instruction, didKey] = await createRegisterInstruction({
    payer,
    authority: owner,
  });

  await SolariumTransaction.signAndSendTransaction(
    [instruction],
    signCallback
  )
  
  const did = DecentralizedIdentifier.create(didKey, currentCluster()).toString();

  return resolve(did);
}