import {execSync} from "child_process";
import {Keypair} from "@solana/web3.js";
import {createWallet} from "solarium-js";
import {mkdirSync, writeFileSync} from 'fs';
import path from "path";
import {homedir} from "os";

type Config = {
  keypairPath: string
}

const DEFAULT_CONFIG_PATH = path.join(homedir(), '.solarium')
// used only if the user does not have a discoverable solana wallet already
const DEFAULT_KEYPAIR_FILE = path.join(DEFAULT_CONFIG_PATH.toString(), 'id.json')

const parseConfig = (configString:string):Config => {
  // solana config get --output json appears not to be outputting JSON in some versions
  // normalise for this here
  try {
    return JSON.parse(configString)
  } catch {
    const lines = configString.split('\n')
    const findLine = (name:string) => ((lines.find((l) => l.startsWith(name)) || "").split(":")[1] || '').trim()

    return {
      keypairPath: findLine('Keypair Path')
    }
  }
}

// If the user has the solana cli installed, use their default solana wallet (TODO and chain)
export const getDefaultSolanaWallet = ():Keypair => {
  const solanaConfig = execSync('solana config get --output json', { encoding: 'utf-8' });
  const parsedConfig = parseConfig(solanaConfig.toString('utf-8'))
  const secretKey = require(parsedConfig.keypairPath);

  return Keypair.fromSecretKey(Buffer.from(secretKey));
}

// If the user has a wallet in their .solarium folder, use that
export const getSolariumWallet = ():Keypair => {
  const secretKey = require(DEFAULT_KEYPAIR_FILE);

  console.log("Using keypair in $HOME/.solarium");

  return Keypair.fromSecretKey(Buffer.from(secretKey));
}

export const getWallet = async ():Promise<Keypair> => {
  try {
    return getDefaultSolanaWallet();
  } catch (defaultSolanaError) {
    if (defaultSolanaError.message.indexOf('command not found')) {
      console.log("Solana CLI not found on path - looking for a keypair in $HOME/.solarium");

      try {
        return getSolariumWallet();
      } catch (solariumWalletError) {
        if (solariumWalletError.code === 'MODULE_NOT_FOUND') {
          console.log("No keypair found in $HOME/.solarium - creating...");
          const generatedKeypair = await createWallet()

          mkdirSync(DEFAULT_CONFIG_PATH)

          writeFileSync(DEFAULT_KEYPAIR_FILE, JSON.stringify([...generatedKeypair.secretKey]));
          return generatedKeypair;
        }
      }
    }

    throw Error('Unable to find Solana wallet')
  }
}
