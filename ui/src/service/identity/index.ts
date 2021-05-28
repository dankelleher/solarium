import {Keypair, PublicKey} from "@solana/web3.js";
import {useEffect, useState} from "react";
import {useLocalStorageKey, useLocalStorageState} from "../storage";
import {useWallet} from "../wallet/wallet";
import {useConnection, useConnectionConfig} from "../web3/connection";
import {ClusterType, DIDDocument, resolve} from '@identity.com/sol-did-client';
import {keyToIdentifier} from "solarium-js";
import {addKey} from "../channels/solarium";

const docHasKey = (doc: DIDDocument, key: PublicKey) =>
  doc.verificationMethod?.find(verificationMethod => verificationMethod.publicKeyBase58 === key.toBase58())

type IdentityProps = {
  ready: boolean,
  decryptionKey: Keypair,
  did: string
}
export function useIdentity():IdentityProps {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const connectionConfig = useConnectionConfig();
  const [decryptionKey] = useLocalStorageKey('decryptionKey', Keypair.generate());
  const [did, setDID] = useLocalStorageState<string>('did', undefined);
  const [document, setDocument] = useState<DIDDocument>();
  const [ready, setReady] = useState<boolean>(false);

  // load the DID document whenever the did is changed
  useEffect(() => { if (did) resolve(did).then(setDocument) }, [did]);

  // attempt to get the default DID when the wallet is loaded if none is set
  useEffect(() => {
    if (wallet && connected && !did) {
      console.log("LOAD WALLET DID HERE ", ClusterType.parse(connectionConfig.env));
      keyToIdentifier(wallet.publicKey, ClusterType.parse(connectionConfig.env)).then(setDID)
    }
  }, [wallet, connectionConfig, did, setDID, connected]);

  // check the loaded DID for the decryption key. prompt to add it if not present
  useEffect(()  => {
    console.log("Checking keys");
    if (document && decryptionKey) {
      console.log("Checking if decryption key is on document");
      if (!docHasKey(document, decryptionKey.publicKey)) {
        if (wallet && connected) {
          console.log("Checking if wallet key is on document");
          if (docHasKey(document, wallet.publicKey)) {
            console.log("Asking to add decryption key");
            if (window.confirm(`Add key to ${did}?`)) {
              addKey(connection, wallet, decryptionKey.publicKey, did).then(() => setReady(true))
            } else {
              // handle no decryption possible
              console.log("Add decryption key rejected");
            }
          } else {
            console.log("This DID does not belong to the wallet");
            // prompt to request add key
          }
        } else {
          console.log("wallet is not connected yet");
        }
      } else {
        console.log("This DID already has the decryption key");
        setReady(true);
      }
    } else {
      console.log("No document or decryption key available yet");
    }
  }, [document, decryptionKey, did, setReady, wallet, connected, connection])

  return {
    ready,
    decryptionKey,
    did
  }
}