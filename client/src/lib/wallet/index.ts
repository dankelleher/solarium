import {Keypair} from "@solana/web3.js";
import {currentCluster} from "../util";
import {ClusterType} from "@identity.com/sol-did-client";
import {SolanaUtil} from "../solana/solanaUtil";

export const create = async ():Promise<Keypair> => {
  if (currentCluster() !== ClusterType.mainnetBeta()) {
    // attempt airdrop if we are not on mainnet
    return SolanaUtil.newWalletWithLamports(SolanaUtil.getConnection(), 10_000_000_000) // 10 Sol
  }
  
  return Keypair.generate();
}