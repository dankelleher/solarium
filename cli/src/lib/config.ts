import {execSync} from "child_process";
import {Keypair} from "@solana/web3.js";

type Config = {
  keypairPath: string
}

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

export const getWallet = ():Keypair => {
  const solanaConfig = execSync('solana config get --output json', { encoding: 'utf-8' });
  const parsedConfig = parseConfig(solanaConfig.toString('utf-8'))
  const secretKey = require(parsedConfig.keypairPath);

  return Keypair.fromSecretKey(Buffer.from(secretKey));
}
