import {Keypair, PublicKey} from "@solana/web3.js";
import {useCallback, useEffect, useState} from "react";
import {useLocalStorageKey, useLocalStorageState} from "../storage";
import {useWallet} from "../wallet/wallet";
import {useConnection, useConnectionConfig} from "../web3/connection";
import {ClusterType, DIDDocument, resolve} from '@identity.com/sol-did-client';
import {keyToIdentifier} from "solarium-js";
import {addKey as addKeyToDID, createIdentity as createDID} from "../channels/solarium";

const docHasKey = (doc: DIDDocument, key: PublicKey) =>
  doc.verificationMethod?.find(verificationMethod => verificationMethod.publicKeyBase58 === key.toBase58())

type IdentityProps = {
  ready: boolean,
  decryptionKey: Keypair,
  did: string,
  createIdentity: () => Promise<void>,
  addKey: () => Promise<void>,
  document: DIDDocument | undefined
}
export function useIdentity():IdentityProps {
  const {wallet, connected} = useWallet();
  const connection = useConnection();
  const connectionConfig = useConnectionConfig();
  const [decryptionKey] = useLocalStorageKey('decryptionKey', Keypair.generate());
  const [did, setDID] = useLocalStorageState<string>('did', undefined);
  const [document, setDocument] = useState<DIDDocument>();
  const [ready, setReady] = useState<boolean>(false);

  const createIdentity = useCallback(() =>
    createDID(connection, wallet).then(document => setDID(document.id))
  , [connection, wallet, setDID])
  
  const addKey = useCallback(() => 
    addKeyToDID(connection, wallet, decryptionKey.publicKey, did).then(() => {
      console.log("Key Added. Ready? " + ready);
      setReady(true)
    })
  , [connection, wallet, decryptionKey, did, setReady, ready ])
  
  // load the DID document whenever the did is changed
  useEffect(() => { if (did) resolve(did).then(doc => {
    setDocument(doc)
    console.log(doc);
  }).catch(error => {
    console.log("No DID registered yet");
  }) }, [did]);
  
  // attempt to get the default DID when the wallet is loaded if none is set
  useEffect(() => {
    if (wallet && connected && !did) {
      console.log("LOAD WALLET DID HERE ", ClusterType.parse(connectionConfig.env));
      keyToIdentifier(wallet.publicKey, ClusterType.parse(connectionConfig.env))
        .then(resolve)
        .then(document => {
          setDID(document.id); // this will already update the doc via useEffect on DID
        })
        .catch(error => {
          if (error.message.startsWith("No DID found")) {
            // console.log("Prompt to create DID");
            // // TODO trigger this only after prompt. This is just to get us to the "ready" phase
            // createIdentity(connection, wallet).then(document => {
            //   setDID(document.id);
            // })
          }
        })
    }
  }, [wallet, connectionConfig, did, setDID, setDocument, connected, connection]);

  // check the loaded DID for the decryption key. prompt to add it if not present
  useEffect(()  => {
    console.log("Checking keys");
    if (document && decryptionKey) {
      console.log("Checking if decryption key is on document");
      console.log(document);
      console.log(decryptionKey.publicKey.toBase58());
      if (!docHasKey(document, decryptionKey.publicKey)) {
        if (wallet && connected) {
          console.log("Checking if wallet key is on document");
          if (docHasKey(document, wallet.publicKey)) {
            // if (window.confirm(`Add key to ${did}?`)) {
            //   addKeyToDID(connection, wallet, decryptionKey.publicKey, did).then(() => setReady(true))
            // } else {
            //   // handle no decryption possible
            //   console.log("Add decryption key rejected");
            // }
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
      if (wallet && connected) {
        if (!document) {
          // console.log("Creating new DID");
          // register({}).then(document => {
          //   console.log(document);
          //   //setDocument(document)
          // })
        }

      }
    }
  }, [document, decryptionKey, did, setReady, wallet, connected, connection])

  return {
    ready,
    decryptionKey,
    did,
    createIdentity,
    addKey,
    document
  }
}